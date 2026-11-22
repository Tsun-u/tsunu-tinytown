import * as THREE from 'three';
import { buildShop } from './shop.js';
import { buildHome } from './home.js';
import { buildStreet, driveCar } from './street.js';
import { buildToys } from './toys.js';
import { buildHospital, buildHospital2, setLiftOpen } from './hospital.js';
import { buildDept0, buildDept1, buildDept2, buildDept3, moveEscalators, setCurtain } from './dept.js';
import { buildKinder, SWING } from './kinder.js';
import { buildDentist, twinkle } from './dentist.js';
import { STAFF } from './staff.js';
import { Sky, TIME_NAMES, WEATHER_NAMES } from './sky.js';
import { Person } from './person.js';
import { randomDesign, drawAvatar, MAX_PEOPLE, CLOTH_COLORS } from './design.js';
import { Creator } from './creator.js';

const SAVE_KEY = 'tinytown.v1';
const params = new URLSearchParams(location.search);

// ---------- 存檔 ----------
function loadSave() {
  if (!params.has('fresh')) {
    try {
      const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (saved && Array.isArray(saved.people) && saved.people.length) return saved;
    } catch { /* 讀不到就用預設的兩個人 */ }
  }
  return { people: DEFAULT_PEOPLE };
}

const DEFAULT_PEOPLE = [
    { id: 1, place: 'street', x: -2.2, z: 1.9, seat: null, design: { skin: '#f6c9a0', hair: 'short', hairColor: '#2f2622', top: '#5b8def', bottom: 'pants', bottomColor: '#5a5560', extra: 'glasses', size: 'adult' } },
    { id: 2, place: 'street', x: -1.4, z: 2.1, seat: null, design: { skin: '#ffe0c4', hair: 'pigtails', hairColor: '#6b4226', top: '#f29bc0', bottom: 'skirt', bottomColor: '#e2574c', extra: 'none', size: 'child' } },
];

const parked = {};   // 被推走的輪椅停在哪裡：「地方:第幾個座位」對到 { x, z, facing }

function save() {
  touchShadow(2);   // 存檔代表有人動過或換過造型
  try { localStorage.setItem(SAVE_KEY, JSON.stringify({ people: people.map((p) => p.data), place: placeName, sky: { time: sky.time, weather: sky.weather }, parked })); } catch { /* 存不了照樣能玩 */ }
}

// ---------- 場景 ----------
const canvas = document.getElementById('stage');
const SHADOWS = params.get('shadows') !== '0';   // ?shadows=0 關掉即時陰影，改用腳下的假影子
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
renderer.shadowMap.enabled = SHADOWS;
const scene = new THREE.Scene();
const hemi = new THREE.HemisphereLight(0xfff8ee, 0xf0cfb4, 1.9);   // 顏色和強度之後由 Sky 照時段設定
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff0d8, 2.1);
sun.position.set(7, 12, 5);
sun.target.position.set(0, 0, 1);
sun.castShadow = SHADOWS;
sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -13, right: 15, top: 11, bottom: -11, near: 1, far: 44 });   // 要蓋得住最寬的街道
sun.shadow.bias = -0.0008;
sun.shadow.normalBias = 0.03;
sun.shadow.autoUpdate = false;   // 陰影只在有人移動或換造型時重算（見 frame），閒置時不用每格重畫一次整間店
let shadowDirtyUntil = 0;
const touchShadow = (seconds = 0.3) => { shadowDirtyUntil = Math.max(shadowDirtyUntil, performance.now() / 1000 + seconds); };
touchShadow(1);
scene.add(sun, sun.target);
const sky = new Sky(scene, hemi, sun);

// 地方：每個地方是一組模型加上座位、障礙、可站範圍、門口。一次只顯示一個。
// 街道是中心：街上每一棟的門口通往那一棟的屋內，屋內的門口通回街上。
// 第一次要用到某個地方時才蓋它（開頁只蓋街道和有人在的地方），開頁才不會等四個地方都蓋完。
// 有樓層的大樓一層是一個地方（hospital 是一樓、hospital2 是二樓），樓層之間用電梯的門口來回。
// 百貨公司四層（dept0 是地下室）用手扶梯，一次走一層。
const builders = {
  street: buildStreet, hospital: buildHospital, hospital2: buildHospital2,
  dept0: buildDept0, dept1: buildDept1, dept2: buildDept2, dept3: buildDept3,
  shop: buildShop, dentist: buildDentist, home: buildHome, toys: buildToys, kinder: buildKinder,
};
const places = {};   // 已經蓋好的地方
const people = [];   // 玩家的小人和固定角色（data.npc）都在這裡
let selected = null;
const players = () => people.filter((p) => !p.data.npc);
function placeNamed(name) {
  if (!places[name]) {
    places[name] = builders[name](scene);
    places[name].group.visible = false;
    places[name].chairs.forEach((chair, index) => {
      if (chair.mobile) moveChair(chair, parked[`${name}:${index}`] || chair);
    });
    for (const person of people) if (person.data.place === name) settle(person);   // 地方蓋好了，原本就在這裡的人各就各位
  }
  return places[name];
}
/** 把會動的座位（輪椅）擺到 spot：模型和提示圈跟著走。spot.away 是這台輪椅被推到別層去了，這一層就看不到它。 */
function moveChair(chair, spot) {
  chair.x = spot.x; chair.z = spot.z; chair.facing = spot.facing; chair.away = Boolean(spot.away);
  chair.mesh.position.set(chair.x, 0, chair.z);
  chair.mesh.rotation.y = chair.facing;
  chair.mesh.visible = !chair.away;
  chair.marker.position.x = chair.x; chair.marker.position.z = chair.z;
}
/** 擺好輪椅，並記進存檔。 */
function parkAt(name, chair, spot) {
  moveChair(chair, spot);
  parked[`${name}:${places[name].chairs.indexOf(chair)}`] = { x: chair.x, z: chair.z, facing: chair.facing, away: chair.away };
}
/** 人現在坐的座位；沒坐著就是 null。 */
const seatOf = (person) => (person.data.seat === null ? null : placeOf(person).chairs[person.data.seat]);

let placeName = 'street';
let world = placeNamed('street');
world.group.visible = true;
const placeOf = (person) => placeNamed(person.data.place);
const here = () => people.filter((p) => p.data.place === placeName);

// 鏡頭繞著店左右轉。店只有後牆和左牆，轉太多會被牆擋住店內，所以限制在預設角度的左右各一段。
const DEFAULT_YAW = Math.PI / 4, YAW_RANGE = 0.6;
const CAMERA_DIR = new THREE.Vector3();
let yaw = DEFAULT_YAW;
function setYaw(value) {
  yaw = Math.min(DEFAULT_YAW + YAW_RANGE, Math.max(DEFAULT_YAW - YAW_RANGE, value));
  CAMERA_DIR.set(Math.sin(yaw) * Math.SQRT2, 0.85, Math.cos(yaw) * Math.SQRT2).normalize();
}
setYaw(DEFAULT_YAW);
const homeCenter = new THREE.Vector3();   // 現在這個地方預設看的中心（world.view.center）
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
const view = { center: new THREE.Vector3(), zoom: 1, goalCenter: new THREE.Vector3(), goalZoom: 1 };
let viewHeight = 13.6;   // 鏡頭 zoom 1 時看得到的高度（世界單位）

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  const aspect = w / h;
  viewHeight = Math.max(world.view.height, world.view.width / aspect);
  homeCenter.fromArray(world.view.center);
  camera.left = -viewHeight * aspect / 2; camera.right = viewHeight * aspect / 2;
  camera.top = viewHeight / 2; camera.bottom = -viewHeight / 2;
  camera.updateProjectionMatrix();
  refocus();
}

function applyCamera() {
  camera.position.copy(view.center).addScaledVector(CAMERA_DIR, 30);
  camera.lookAt(view.center);
  camera.zoom = view.zoom;
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
}

// ---------- 人 ----------
function addPerson(data) {
  if (!builders[data.place]) data.place = 'shop';   // 只有店的時候存的檔沒有這一欄
  const person = new Person(data, { castShadow: SHADOWS });
  person.root.visible = data.place === placeName;
  scene.add(person.root);
  people.push(person);
  if (places[data.place]) settle(person);   // 那個地方還沒蓋的話，等蓋好時再就位（見 placeNamed）
  return person;
}

/** 照存檔把人放回椅子或地上。存檔裡的位子已經不在（座位改過）就站在地上。 */
function settle(person) {
  const chair = person.data.seat === null ? null : placeOf(person).chairs[person.data.seat];
  if (chair && (!chair.occupant || chair.occupant === person)) {
    chair.occupant = person;
    person.place(chair.x, chair.z, chair.facing);
    if (chair.pose === 'sleep' || chair.pose === 'dental') person.sleep(chair.seatHeight);
    else if (chair.pose === 'ride') person.ride(chair.seatHeight);
    else if (chair.pose === 'splash') person.splash(chair.seatHeight);
    else if (WORK_SECONDS[chair.pose]) person.work();
    else if (chair.pose === 'stand' || chair.pose === 'bounce') person.stand();
    else person.sit(chair.seatHeight);
  } else {
    person.data.seat = null;
    person.place(person.data.x, person.data.z, person.data.facing ?? Math.PI / 4);   // facing：固定角色一開始面向的方向，被拖過就沒有了
    person.stand();
  }
}

const BITE_SECONDS = 0.8, REFILL_SECONDS = 6;

/** 坐在桌邊、面前有蛋糕就開始吃。 */
function tryEat(person) {
  const chair = person.data.seat === null ? null : placeOf(person).chairs[person.data.seat];
  if (!chair || !chair.food || chair.food.bites === 0 || chair.food.eater) return;
  chair.food.eater = person;
  person.eating = chair.food.bites * BITE_SECONDS;
}

// 站在流理台前做事要幾秒：洗東西、煮東西、開冰箱拿冰棒
// 百貨公司的：冰淇淋攤拿冰棒、試衣間換衣服、夾娃娃
// 幼稚園的：彈鋼琴。牙醫的：幫大牙齒刷牙
const WORK_SECONDS = { wash: 3, cook: 3, fridge: 1.6, treat: 1.2, change: 1.6, claw: 2.5, piano: 3, brush: 3 };
const TREAT_SECONDS = 4;
const DOOR_OPEN = 1.9;   // 冰箱門打開的角度（弧度）

/** 站在水槽、爐子、冰箱前面就開始做事。 */
function tryWork(person) {
  const chair = person.data.seat === null ? null : placeOf(person).chairs[person.data.seat];
  if (!chair || !WORK_SECONDS[chair.pose] || person.working > 0) return;
  person.working = WORK_SECONDS[chair.pose];
  person.root.rotation.y = chair.facing;   // 拿完冰棒轉過身的人，再做一次時轉回去面向流理台
  chair.busy = true;
}

/** 做完的結果：煮好了補滿吃空的盤子、冰箱拿出一支冰棒，做完都開心跳一下。 */
function finishWork(chair, person) {
  if (chair.pose === 'cook') serveFood(world);
  if (chair.pose === 'fridge' || chair.pose === 'treat') {   // 轉過身來面向鏡頭吃，才看得到手上的冰棒
    person.treat = TREAT_SECONDS;
    person.root.rotation.y = Math.PI / 4;
  }
  if (chair.pose === 'change') {   // 試衣間：換一套不同顏色的上衣和褲裙，轉過來給大家看
    const design = person.data.design;
    const another = (...avoid) => { const rest = CLOTH_COLORS.filter((c) => !avoid.includes(c)); return rest[Math.floor(Math.random() * rest.length)]; };
    design.top = another(design.top);
    design.bottomColor = another(design.bottomColor, design.top);   // 跟新上衣不同色，才看得出是一套
    person.rebuild();
    person.root.rotation.y = Math.PI / 4;
    if (person === selected) drawAvatar(document.getElementById('portraitFace'), design, 'head');
    creator.sync();
    save();
  }
  person.hop = 0.35;
}

function serveFood(place) {
  for (const chair of place.chairs) {
    if (chair.food && !chair.food.eater && chair.food.bites < 3) { chair.food.bites = 3; chair.food.pop = 0; }
  }
}

/** 每一格更新會動的效果：泳池的水花、水龍頭的水、鍋子的蒸氣、冰箱門、搖搖馬。 */
function updateEffects(dt, time) {
  if (world.lift) {   // 電梯門：有人被拖到電梯附近、或剛有人搭到這一層時打開
    const lift = world.lift;
    const near = !!drag && drag.moved && Math.hypot(drag.person.root.position.x - lift.x, drag.person.root.position.z - lift.z) < 1.6;
    const goal = near || time < lift.holdUntil ? 1 : 0;
    if (Math.abs(goal - lift.open) > 0.002) { setLiftOpen(lift, lift.open + (goal - lift.open) * (1 - Math.exp(-dt * 10))); touchShadow(); }
  }
  if (world.escalators) moveEscalators(world, time);
  if (world.car) {   // 小車：有人坐著就開，坐在車上的人跟著車走
    if (driveCar(world, dt)) touchShadow();
    for (const seat of world.carSeats) {
      const rider = seat.occupant;
      if (rider && rider.mode === 'sit') { rider.root.position.set(seat.x, 0, seat.z); rider.root.rotation.y = seat.facing; }
    }
  }
  for (const chair of world.chairs) {
    const person = chair.occupant;
    const working = !!person && person.working > 0;
    if (chair.curtain) {   // 試衣間的簾子：裡面的人在換衣服時拉上
      const goal = working ? 1 : 0, closed = chair.curtain.userData.closed;
      if (Math.abs(goal - closed) > 0.002) { setCurtain(chair.curtain, closed + (goal - closed) * (1 - Math.exp(-dt * 12))); touchShadow(); }
    }
    if (chair.pose === 'bounce' && person && person.mode === 'stand' && person.hop <= 0) person.hop = 0.35;   // 彈跳床：一直跳
    if (chair.lamp) {   // 牙醫的診療椅：有人躺著燈就亮，牙齒冒星星
      chair.lamp.visible = !!person && person.mode === 'sleep';
      if (chair.lamp.visible) twinkle(chair.lamp, time);
    }
    if (chair.swing) {   // 鞦韆：有人坐就前後盪，人跟著坐板走
      const rider = person && person.mode === 'sit' ? person : null;
      const angle = rider ? Math.sin(time * 2.4 + chair.x) * 0.5 : chair.swing.rotation.x * 0.94;
      chair.swing.rotation.x = angle;
      if (rider) {
        rider.root.position.set(chair.x, SWING.pivotY - SWING.rope * Math.cos(angle) + 0.03 - chair.seatHeight, chair.z - SWING.rope * Math.sin(angle));
        rider.root.rotation.x = angle;
        touchShadow();
      }
    }
    if (chair.pose === 'slide' && person && person.mode === 'sit') {   // 溜滑梯：在平台上坐一下、溜下來、在底下停一下，再回到平台
      const phase = (time * 0.4) % 1, t = Math.min(1, Math.max(0, (phase - 0.3) / 0.35));
      const [topY, topZ] = chair.top, [bottomY, bottomZ] = chair.bottom;
      if (t === 0) person.root.position.set(chair.x, topY, chair.z);
      else person.root.position.set(chair.x, topY + (bottomY - topY) * t, topZ + (bottomZ - topZ) * t);
      touchShadow();
    }
    if (chair.busy && !working) {   // 做完了（或做到一半被拖走）
      chair.busy = false;
      if (person && person.mode === 'work') finishWork(chair, person);
    }
    if (chair.splash) {
      chair.splash.visible = !!person && person.mode === 'splash';
      if (chair.splash.visible) for (const drop of chair.splash.children) {
        const phase = (time * 1.6 + drop.userData.angle) % 1;
        drop.position.set(Math.cos(drop.userData.angle) * (0.2 + phase * 0.3), Math.sin(phase * Math.PI) * 0.55, Math.sin(drop.userData.angle) * (0.2 + phase * 0.3));
      }
    }
    if (chair.water) {
      chair.water.visible = working;
      if (working) for (const bubble of chair.water.children.slice(1)) {
        const phase = (time * 0.9 + bubble.userData.offset) % 1;
        const [dx, dz] = bubble.userData.spread;
        bubble.position.set(dx + Math.sin(phase * 7) * 0.03, 0.05 + phase * 0.6, dz);
        bubble.scale.setScalar(0.5 + phase * 0.8);
        bubble.material.opacity = 0.85 * (1 - phase);
      }
    }
    if (chair.door) {
      const goal = working ? DOOR_OPEN : 0;
      const angle = -chair.door.rotation.y;
      if (Math.abs(goal - angle) > 0.001) {
        chair.door.rotation.y = -(angle + (goal - angle) * (1 - Math.exp(-dt * 9)));
        touchShadow();
      }
    }
    if (chair.bar) {   // 身高尺的橫桿：有人站著就降到頭頂，沒人就回到最上面
      const goal = person && person.mode === 'stand' ? person.height + 0.05 : 2.05;
      if (Math.abs(goal - chair.bar.position.y) > 0.002) { chair.bar.position.y += (goal - chair.bar.position.y) * (1 - Math.exp(-dt * 6)); touchShadow(); }
    }
    if (chair.steam) {
      chair.steam.visible = working;
      if (working) for (const puff of chair.steam.children) {
        const phase = (time * 0.7 + puff.userData.offset) % 1;
        puff.position.set(Math.sin(phase * 6 + puff.userData.offset * 9) * 0.06, phase * 0.7, 0);
        puff.scale.setScalar(0.6 + phase);
        puff.material.opacity = 0.8 * (1 - phase);
      }
    }
    if (chair.rocker) {   // 搖搖馬：有人騎就前後搖，人跟著一起搖
      const rider = person && person.mode === 'ride' ? person : null;
      const angle = rider ? Math.sin(time * 3.4) * 0.2 : chair.rocker.rotation.x * 0.9;
      chair.rocker.rotation.x = angle;
      if (rider) { rider.root.rotation.x = angle; touchShadow(); }
    }
  }
}

/** 每一格更新蛋糕：被吃就一口一口變小，吃完過幾秒補一盤。 */
function updateFood(dt, time) {
  for (const chair of Object.values(places).flatMap((place) => place.chairs)) {
    const food = chair.food;
    if (!food) continue;
    if (food.eater) {
      const eater = food.eater;
      if (eater.mode !== 'sit' || eater.eating <= 0) {   // 吃完了，或吃到一半被拖走
        if (eater.mode !== 'sit') eater.eating = 0;
        else { food.bites = 0; food.refillAt = time + REFILL_SECONDS; }
        food.eater = null;
      } else {
        food.bites = Math.ceil(eater.eating / BITE_SECONDS);
      }
      touchShadow();
    } else if (food.bites === 0 && time >= food.refillAt) {
      food.bites = 3;
      food.pop = 0;
    }
    if (food.pop < 1) { food.pop = Math.min(1, food.pop + dt * 3); touchShadow(); }
    const size = [0, 0.5, 0.78, 1][food.bites] * (food.pop < 1 ? 1 + Math.sin(food.pop * Math.PI) * 0.35 : 1) * (food.pop < 1 ? food.pop : 1);
    food.mesh.visible = size > 0;
    food.mesh.scale.setScalar(Math.max(size, 0.001));
  }
}

function leaveSeat(person) {
  if (person.data.seat !== null) placeOf(person).chairs[person.data.seat].occupant = null;
  person.data.seat = null;
}

function select(person) {
  if (person.data.place !== placeName) goTo(person.data.place);   // 選到在另一個地方的人，畫面跟過去
  if (person.data.npc) return;   // 固定角色不進造型面板，右上角的大頭照維持原本選的人
  if (person !== selected) creator.armed = false;   // 換了人，垃圾桶的第一下就不算數
  selected = person;
  drawAvatar(document.getElementById('portraitFace'), person.data.design, 'head');
  creator.sync();
  refocus();
}

/** 把點推到小人能站的地方：先夾進可站的範圍，再推出桌子這類障礙。輪椅也是障礙；except 是不算在內的那一台（正在推的）。 */
function walkable(x, z, place = world, except = null) {
  let best = null;
  for (const area of place.areas) {
    const cx = Math.min(area.maxX, Math.max(area.minX, x));
    const cz = Math.min(area.maxZ, Math.max(area.minZ, z));
    const distance = (cx - x) ** 2 + (cz - z) ** 2;
    if (!best || distance < best.distance) best = { x: cx, z: cz, distance };
  }
  const wheelchairs = place.chairs.filter((c) => c.mobile && !c.away && c !== except).map((c) => ({ x: c.x, z: c.z, r: 0.6 }));
  for (const o of [...place.obstacles, ...wheelchairs]) {
    const dx = best.x - o.x, dz = best.z - o.z;
    const d = Math.hypot(dx, dz);
    if (d < o.r) {
      const ux = d > 0.001 ? dx / d : 0, uz = d > 0.001 ? dz / d : 1;
      best.x = o.x + ux * o.r; best.z = o.z + uz * o.r;
    }
  }
  return best;
}

/** 某個地方、某一點附近第一個沒有人站的位置；新加的人和剛到的人放這裡。 */
function freeSpot(name = placeName, near = placeNamed(name).spawn) {
  const place = placeNamed(name);
  const others = people.filter((p) => p.data.place === name);
  const steps = [[0, 0], [0.9, 0.3], [-0.9, 0.3], [0, 0.9], [1.8, 0.2], [-1.8, 0.2], [0.9, 1.1], [-0.9, 1.1], [2.7, 0.4], [-2.7, 0.4], [0, 1.8]];
  for (const [dx, dz] of steps) {
    const spot = walkable(near.x + dx, near.z + dz, place);
    if (!others.some((p) => Math.hypot(p.root.position.x - spot.x, p.root.position.z - spot.z) < 0.8)) return spot;
  }
  return walkable(near.x, near.z, place);
}

// ---------- 換地方 ----------
// 地圖：左上角的鈕畫的是現在在哪裡；點開是所有地方的圖示，底下的小頭像是現在在那裡的人，點哪個畫面就切過去（只切畫面，不帶人）。
const PLACE_ICONS = {
  street: '<svg viewBox="0 0 48 48"><path d="M5 20h11v20H5z" fill="#a9c4de"/><path d="M18 26h12v14H18z" fill="#fff6e8"/><path d="M17 22h14l1 5H16z" fill="#f29a85"/><path d="M32 28h11v12H32z" fill="#fff6e8"/><path d="M30 29l7.5-7 7.5 7z" fill="#7fb2e0"/><path d="M3 40h42v4H3z" fill="#9a96a3"/></svg>',
  shop: '<svg viewBox="0 0 48 48"><path d="M8 20h32v20H8z" fill="#fff6e8"/><path d="M6 12h36l2 8a5 5 0 0 1-9 2 5 5 0 0 1-9 0 5 5 0 0 1-9 0 5 5 0 0 1-9 0 5 5 0 0 1-4-2z" fill="#f29a85"/><path d="M14 27h9v13h-9z" fill="#8fd6c4"/><path d="M27 27h9v7h-9z" fill="#c9ecf5"/></svg>',
  home: '<svg viewBox="0 0 48 48"><path d="M10 22h28v18H10z" fill="#fff6e8"/><path d="M4 24 24 7l20 17-3 3-17-14L7 27z" fill="#7fb2e0"/><path d="M20 28h8v12h-8z" fill="#f8d15c"/><path d="M31 11h5v8l-5-4z" fill="#b88758"/></svg>',
  toys: '<svg viewBox="0 0 48 48"><circle cx="15" cy="12" r="5" fill="#9a6a4c"/><circle cx="33" cy="12" r="5" fill="#9a6a4c"/><circle cx="24" cy="20" r="12" fill="#9a6a4c"/><circle cx="24" cy="23" r="5" fill="#f7e3c8"/><circle cx="19" cy="17" r="1.8" fill="#4a3b33"/><circle cx="29" cy="17" r="1.8" fill="#4a3b33"/><path d="M6 34h11v10H6z" fill="#e86a5c"/><path d="M19 34h11v10H19z" fill="#f8d15c"/><path d="M32 34h11v10H32z" fill="#7db4ec"/></svg>',
};
/** 大樓某一層的圖示：大樓的圖加上樓層數字。 */
const floorIcon = (inner, floor) => `<svg viewBox="0 0 48 48">${inner}<circle cx="37" cy="37" r="10" fill="#fff" stroke="#f29a85" stroke-width="2.5"/><text x="37" y="42" text-anchor="middle" font-size="15" font-weight="800" font-family="sans-serif" fill="#4a3b33">${floor}</text></svg>`;
const HOSPITAL_ICON = '<path d="M9 8h26v36H9z" fill="#a9c4de"/><path d="M7 5h30v5H7z" fill="#f6efe4"/><path d="M13 14h18v18H13z" fill="#fff"/><path d="M19.5 16h5v14h-5z" fill="#e86a5c"/><path d="M15 20.5h14v5H15z" fill="#e86a5c"/><path d="M18 35h8v9h-8z" fill="#5a5560"/>';
PLACE_ICONS.hospital = floorIcon(HOSPITAL_ICON, 1);
PLACE_ICONS.hospital2 = floorIcon(HOSPITAL_ICON, 2);
const DEPT_ICON = '<path d="M8 8h28v36H8z" fill="#c9b6e4"/><path d="M6 5h32v5H6z" fill="#f6efe4"/><path d="M14 20h16v15H14z" fill="#f7a8c4"/><path d="M18 20v-3a4 4 0 0 1 8 0v3" fill="none" stroke="#fff" stroke-width="2.5"/><path d="M12 12h6v5h-6zM26 12h6v5h-6z" fill="#c9ecf5"/>';
['B', 1, 2, 3].forEach((floor, i) => { PLACE_ICONS['dept' + i] = floorIcon(DEPT_ICON, floor); });
PLACE_ICONS.kinder = '<svg viewBox="0 0 48 48"><path d="M8 22h32v20H8z" fill="#fff6e8"/><path d="M5 22 24 8l19 14z" fill="#f8d15c"/><path d="M8 34h32v8H8z" fill="#b9e3a8"/><path d="M20 30h8v12h-8z" fill="#f5a25a"/><circle cx="24" cy="17" r="3" fill="#e86a5c"/><path d="M11 26h6v6h-6zM31 26h6v6h-6z" fill="#c9ecf5"/></svg>';
PLACE_ICONS.dentist = '<svg viewBox="0 0 48 48"><path d="M8 14h32v28H8z" fill="#f8d98a"/><path d="M5 9h38v7H5z" fill="#e8766a"/><path d="M17 20c-4 0-6 3-5 8 1 6 2 12 5 12 2 0 2-6 7-6s5 6 7 6c3 0 4-6 5-12 1-5-1-8-5-8-3 0-4 1.500-7 1.500S20 20 17 20z" fill="#fff"/></svg>';
const PLACE_LABELS = { kinder: '幼稚園', dentist: '牙醫診所', street: '街上', hospital: '醫院一樓', hospital2: '醫院二樓', dept0: '百貨地下室超市', dept1: '百貨一樓服飾店', dept2: '百貨二樓遊戲區和書店', dept3: '百貨三樓美食街', shop: '點心店', home: '家', toys: '玩具店' };
const mapButton = document.getElementById('mapBtn');
const mapMenu = document.getElementById('mapMenu');

function renderMap() {
  mapButton.innerHTML = PLACE_ICONS[placeName];
  mapMenu.replaceChildren();
  for (const name of Object.keys(builders)) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'map-place' + (name === placeName ? ' on' : '');
    button.dataset.place = name;
    button.setAttribute('aria-label', PLACE_LABELS[name]);
    button.innerHTML = PLACE_ICONS[name];
    const faces = document.createElement('span');
    faces.className = 'map-faces';
    for (const person of players().filter((p) => p.data.place === name)) {
      const face = document.createElement('canvas');
      face.width = face.height = 56;
      drawAvatar(face, person.data.design, 'head');
      faces.append(face);
    }
    button.append(faces);
    button.addEventListener('click', () => { mapMenu.hidden = true; goTo(name); save(); });
    mapMenu.append(button);
  }
}

function goTo(name) {
  if (!builders[name] || name === placeName) return;
  cancelDrag();
  world.group.visible = false;
  placeName = name;
  world = placeNamed(name);
  world.group.visible = true;
  sky.enter(world);
  for (const person of people) person.root.visible = person.data.place === name;
  renderMap();
  look.zoom = 1; look.pan.set(0, 0, 0);
  if (selected && selected.data.place !== name) { const first = here().find((p) => !p.data.npc); if (first) select(first); }
  resize();   // 每個地方的取景範圍不一樣
  view.center.copy(view.goalCenter); view.zoom = view.goalZoom;
  touchShadow(1);
}

/** 那個地方有沒有替這台輪椅留的座位（同一棟的另一層才有）。 */
const twinOf = (wheelchair, destination) => destination.chairs.find((c) => c.mobile && c.wheel === wheelchair.wheel);

/** 人走過門口，到門通往的那個地方。wheelchair 是他坐著的輪椅：門的另一邊有它的位子（醫院的另一層），就連輪椅一起過去。 */
function travel(person, door, wheelchair = null) {
  const from = placeName, destination = placeNamed(door.to);
  const spot = freeSpot(door.to, (destination.arrive && destination.arrive[from]) || destination.spawn);
  const twin = wheelchair && twinOf(wheelchair, destination);
  person.data.place = door.to;
  if (destination.lift && world.lift) destination.lift.holdUntil = performance.now() / 1000 + 1.2;   // 搭電梯到的那一層，門開著讓人走出來
  Object.assign(person.data, { x: spot.x, z: spot.z, seat: null });
  if (twin) {
    parkAt(from, wheelchair, { x: wheelchair.x, z: wheelchair.z, facing: 0, away: true });
    parkAt(door.to, twin, { x: spot.x, z: spot.z, facing: 0 });
    person.data.seat = destination.chairs.indexOf(twin);
  }
  settle(person);
  person.hop = 0.35;
  select(person);
}
// ---------- 天氣和時間 ----------
// 兩顆鈕畫的是現在的天氣、現在的時段；點了從鈕的下面展開全部選項，選一個就換。
const SUN_ICON = '<circle cx="24" cy="24" r="9" fill="#f8c93c"/><g stroke="#f8c93c" stroke-width="3.5" stroke-linecap="round"><path d="M24 5v5M24 38v5M5 24h5M38 24h5M10.500 10.500l3.500 3.500M34 34l3.500 3.500M10.500 37.500l3.500-3.500M34 14l3.500-3.500"/></g>';
const CLOUD = '<path d="M14 30a8 8 0 0 1 1-16 11 11 0 0 1 21 2 7 7 0 0 1-1 14z" fill="#b9c6d8"/>';
const WEATHER_ICONS = {
  sun: `<svg viewBox="0 0 48 48">${SUN_ICON}</svg>`,
  rain: `<svg viewBox="0 0 48 48">${CLOUD}<g stroke="#5b9fe0" stroke-width="3.5" stroke-linecap="round"><path d="M16 35l-2 6M25 35l-2 6M34 35l-2 6"/></g></svg>`,
  snow: `<svg viewBox="0 0 48 48">${CLOUD}<g fill="#fff" stroke="#8fb8e8" stroke-width="2"><circle cx="15" cy="38" r="3.500"/><circle cx="25" cy="41" r="3.500"/><circle cx="35" cy="38" r="3.500"/></g></svg>`,
};
const TIME_ICONS = {
  morning: '<svg viewBox="0 0 48 48"><path d="M10 34a14 14 0 0 1 28 0z" fill="#f8c93c"/><g stroke="#f8c93c" stroke-width="3.500" stroke-linecap="round"><path d="M24 8v6M7 22l5 3M41 22l-5 3"/></g><path d="M4 36h40v5H4z" fill="#9bd69a"/></svg>',
  noon: `<svg viewBox="0 0 48 48">${SUN_ICON}</svg>`,
  evening: '<svg viewBox="0 0 48 48"><path d="M4 8h40v28H4z" fill="#f9ab8c"/><path d="M12 36a12 12 0 0 1 24 0z" fill="#f2703c"/><path d="M4 36h40v5H4z" fill="#8a6fa8"/></svg>',
  night: '<svg viewBox="0 0 48 48"><path d="M4 6h40v36H4z" fill="#2b3570"/><path d="M30 12a13 13 0 1 0 6 21 11 11 0 0 1-6-21z" fill="#ffe27a"/><g fill="#fff"><circle cx="12" cy="14" r="2"/><circle cx="18" cy="34" r="1.500"/><circle cx="38" cy="10" r="1.500"/></g></svg>',
};
const SKY_LABELS = { sun: '晴天', rain: '下雨', snow: '下雪', morning: '早上', noon: '中午', evening: '傍晚', night: '晚上' };
const weatherButton = document.getElementById('weatherBtn'), weatherMenu = document.getElementById('weatherMenu');
const timeButton = document.getElementById('timeBtn'), timeMenu = document.getElementById('timeMenu');
const topMenus = [weatherMenu, timeMenu, mapMenu];

/** 打開一個選單時把另外兩個收起來；再點同一顆鈕就收起來。 */
function toggleMenu(menu) {
  const open = menu.hidden;
  for (const other of topMenus) other.hidden = true;
  menu.hidden = !open;
}

function skyMenu(button, menu, names, icons, field) {
  const render = () => {
    button.innerHTML = icons[sky[field]];
    menu.replaceChildren();
    for (const name of names) {
      const option = document.createElement('button');
      option.type = 'button';
      option.className = 'map-place' + (name === sky[field] ? ' on' : '');
      option.setAttribute('aria-label', SKY_LABELS[name]);
      option.innerHTML = icons[name];
      option.addEventListener('click', () => { sky.set({ [field]: name }); menu.hidden = true; render(); touchShadow(1); save(); });
      menu.append(option);
    }
  };
  button.addEventListener('click', () => toggleMenu(menu));
  return render;
}
const renderWeather = skyMenu(weatherButton, weatherMenu, WEATHER_NAMES, WEATHER_ICONS, 'weather');
const renderTime = skyMenu(timeButton, timeMenu, TIME_NAMES, TIME_ICONS, 'time');

mapButton.addEventListener('click', () => { renderMap(); toggleMenu(mapMenu); });

// ---------- 拖曳 ----------
const raycaster = new THREE.Raycaster();
const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const pointerNdc = new THREE.Vector2();
const projected = new THREE.Vector3();
let drag = null;

function screenOf(x, y, z) {
  projected.set(x, y, z).project(camera);
  return { x: (projected.x + 1) / 2 * window.innerWidth, y: (1 - projected.y) / 2 * window.innerHeight };
}

function groundAt(clientX, clientY) {
  pointerNdc.set(clientX / window.innerWidth * 2 - 1, -(clientY / window.innerHeight) * 2 + 1);
  raycaster.setFromCamera(pointerNdc, camera);
  const hit = new THREE.Vector3();
  return raycaster.ray.intersectPlane(ground, hit) ? hit : null;
}

/** 手指附近最近的小人。可點的範圍比模型大，小朋友的手指點得到。 */
function personAt(clientX, clientY) {
  const pxPerUnit = window.innerHeight / viewHeight * view.zoom;
  let best = null;
  for (const person of here()) {
    const pos = person.root.position;
    const middle = screenOf(pos.x, person.pickHeight, pos.z);
    const reach = Math.max(44, person.height * 0.6 * pxPerUnit);
    const distance = Math.hypot(middle.x - clientX, middle.y - clientY);
    if (distance < reach && (!best || distance < best.distance)) best = { person, distance };
  }
  return best && best.person;
}

/** 放手的位置會碰到什麼：空位、門口、另一個人，或地板。 */
function dropTarget(person, x, z) {
  let chair = null, chairDistance = 1.0;
  world.chairs.forEach((c) => {
    const d = Math.hypot(c.x - x, c.z - z);
    if (!c.occupant && !c.away && d < chairDistance) { chair = c; chairDistance = d; }
  });
  if (chair) return { chair };
  const door = world.doors.find((d) => Math.hypot(d.x - x, d.z - z) < (d.r ? d.r + 0.1 : 0.85));   // 圈比較小的門口（電梯、手扶梯），判定範圍跟著縮小
  if (door) return { door };
  let friend = null, friendDistance = 0.95;
  for (const other of here()) {
    if (other === person) continue;
    const d = Math.hypot(other.root.position.x - x, other.root.position.z - z);
    if (d < friendDistance) { friend = other; friendDistance = d; }
  }
  return friend ? { friend } : {};
}

/** 拖人的時候亮起空位和門口的圈圈；target 是現在放手會碰到的東西，那一個圈會變大變色。 */
function showMarkers(target = {}) {
  const dragging = !!drag && drag.moved;
  world.chairs.forEach((c) => {
    c.marker.visible = dragging && !c.occupant && !c.away;
    c.marker.scale.setScalar(c === target.chair ? 1.35 : 1);
    c.marker.material.color.set(c === target.chair ? 0xff8a3c : 0xffc94a);
  });
  world.doors.forEach((d) => {
    d.marker.visible = dragging;
    d.marker.scale.setScalar(d === target.door ? 1.3 : 1);
    d.marker.material.color.set(d === target.door ? 0x2f8cff : 0x6ab7ff);
  });
}

// 一指（滑鼠左鍵）拖人；兩指（滑鼠中鍵）左右拖是轉鏡頭
const touches = new Map();   // 螢幕上每根手指的位置
let orbit = null;
const fingers = () => [...touches.values()];
const orbitX = (e) => (e.pointerType === 'touch' ? fingers().reduce((sum, f) => sum + f.x, 0) / touches.size : e.clientX);
const pinchGap = () => { const [a, b] = fingers(); return b ? Math.hypot(a.x - b.x, a.y - b.y) : 0; };

// 放大縮小：滑鼠滾輪或兩指捏合。zoom 1 是看得到整個場景，最多放大到 3 倍。
const MAX_ZOOM = 3;
const look = { zoom: 1, pan: new THREE.Vector3() };   // pan：放大時鏡頭中心離預設位置多遠

/** 以畫面上的 (clientX, clientY) 為中心縮放：那一點底下的東西留在原地。 */
function zoomAt(clientX, clientY, factor) {
  if (creator.open) return;   // 改造型時鏡頭跟著選中的人
  const next = Math.min(MAX_ZOOM, Math.max(1, look.zoom * factor));
  if (next === look.zoom) return;
  const pxPerUnit = window.innerHeight / viewHeight;
  const shift = (1 / look.zoom - 1 / next) / pxPerUnit;
  const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
  const up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
  look.pan.addScaledVector(right, (clientX - window.innerWidth / 2) * shift).addScaledVector(up, -(clientY - window.innerHeight / 2) * shift);
  look.zoom = next;
  if (next === 1) look.pan.set(0, 0, 0);   // 縮回全景就回到預設的取景
  look.pan.clampLength(0, 6);
  refocus();
}

canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * 0.0015));
}, { passive: false });

function cancelDrag() {
  if (!drag) return;
  const { person, origin, moved, chair, chairOrigin } = drag;
  drag = null;
  showMarkers();
  if (!moved) return;
  if (chair) moveChair(chair, chairOrigin);
  Object.assign(person.data, origin);
  settle(person);
}

/** 坐輪椅的人點一下就站起來，站在輪椅旁邊。 */
function standUp(person, chair) {
  leaveSeat(person);
  const spot = walkable(chair.x + 0.75, chair.z + 0.25);
  Object.assign(person.data, { x: spot.x, z: spot.z });
  settle(person);
  person.hop = 0.35;
  save();
}

/** 推著輪椅放手：推到別的空位就換坐過去；推到電梯就連輪椅一起到另一層；推到通往街上的門，人自己走出去、輪椅留下；其他地方就停在那裡。 */
function parkChair(person, chair, chairOrigin, x, z) {
  const name = placeName;   // 先記下來：人走過門口後，畫面會換到別的地方
  const target = dropTarget(person, x, z);
  if (target.chair) {
    // 輪椅停在新座位旁邊，往原本來的方向退開一點才不會疊在一起
    const away = Math.atan2(chairOrigin.x - target.chair.x, chairOrigin.z - target.chair.z);
    const spot = walkable(target.chair.x + Math.sin(away) * 0.9, target.chair.z + Math.cos(away) * 0.9, world, chair);
    moveChair(chair, { ...spot, facing: chair.facing });
    leaveSeat(person);
    person.data.seat = world.chairs.indexOf(target.chair);
    settle(person);
    tryEat(person);
    tryWork(person);
  } else if (target.door) {
    const rides = Boolean(twinOf(chair, placeNamed(target.door.to)));
    if (!rides) moveChair(chair, chairOrigin);
    leaveSeat(person);
    travel(person, target.door, rides ? chair : null);
  } else {
    moveChair(chair, { ...walkable(x, z, world, chair), facing: chair.facing });
    settle(person);
  }
  parkAt(name, chair, chair);
}

canvas.addEventListener('mousedown', (e) => { if (e.button === 1) e.preventDefault(); });   // 中鍵不要變成瀏覽器的自動捲動

canvas.addEventListener('pointerdown', (e) => {
  for (const menu of topMenus) menu.hidden = true;   // 點到場景就收起選單
  if (e.pointerType === 'touch') touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
  const twoFingers = e.pointerType === 'touch' && touches.size === 2;
  if (twoFingers || (e.pointerType === 'mouse' && e.button === 1)) {
    cancelDrag();   // 第一指已經抓起人的話，放回原位
    orbit = { x: orbitX(e), yaw, gap: pinchGap() };
    try { canvas.setPointerCapture(e.pointerId); } catch { /* 抓不到指標也能轉 */ }
    return;
  }
  if (orbit || drag || e.button !== 0) return;
  const person = personAt(e.clientX, e.clientY);
  if (!person) return;
  select(person);
  person.hop = 0.35;
  if (creator.open) return;   // 改造型時點人只是換一個人改
  try { canvas.setPointerCapture(e.pointerId); } catch { /* 抓不到指標也照樣能拖，只是拖出畫布會斷 */ }
  drag = { id: e.pointerId, person, startX: e.clientX, startY: e.clientY, moved: false, origin: { x: person.data.x, z: person.data.z, seat: person.data.seat } };
  const seat = seatOf(person);
  if (seat && seat.mobile) Object.assign(drag, { chair: seat, chairOrigin: { x: seat.x, z: seat.z, facing: seat.facing }, turnFrom: { x: seat.x, z: seat.z } });   // 坐輪椅的人：連輪椅一起推
});

canvas.addEventListener('pointermove', (e) => {
  if (touches.has(e.pointerId)) touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (orbit) {
    setYaw(orbit.yaw - (orbitX(e) - orbit.x) * 0.006);
    const gap = pinchGap();
    if (orbit.gap > 0 && gap > 0) {   // 兩指的距離變了就是捏合
      const [a, b] = fingers();
      zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, gap / orbit.gap);
      orbit.gap = gap;
    }
    return;
  }
  if (!drag || e.pointerId !== drag.id) return;
  if (!drag.moved && Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) < 10) return;
  const { person, chair } = drag;
  if (!drag.moved) {
    drag.moved = true;
    if (!chair) {
      leaveSeat(person);
      person.hold();
    }
  }
  const hit = groundAt(e.clientX, e.clientY);
  if (!hit) return;
  if (chair) {
    // 輪椅只在地板上走，朝推的方向轉
    const spot = walkable(hit.x, hit.z, world, chair);
    const dx = spot.x - drag.turnFrom.x, dz = spot.z - drag.turnFrom.z;
    const turned = Math.hypot(dx, dz) > 0.25;
    if (turned) drag.turnFrom = { x: spot.x, z: spot.z };
    moveChair(chair, { ...spot, facing: turned ? Math.atan2(dx, dz) : chair.facing });
    person.place(chair.x, chair.z, chair.facing);
    drag.at = { x: hit.x, z: hit.z };
    touchShadow();
  } else {
    person.place(hit.x, hit.z, Math.PI / 4);
  }
  showMarkers(dropTarget(person, hit.x, hit.z));
});

function endDrag(e, cancelled) {
  touches.delete(e.pointerId);
  if (orbit) {
    if (e.pointerType !== 'touch' || touches.size === 0) orbit = null;
    else orbit = { x: orbitX(e), yaw, gap: 0 };   // 還有一指留在螢幕上：從現在的位置接著算，鏡頭不會跳
    return;
  }
  if (!drag || e.pointerId !== drag.id) return;
  if (cancelled) { cancelDrag(); return; }
  const { person, moved, chair, chairOrigin, at } = drag;
  drag = null;
  showMarkers();
  if (!moved) {   // 點一下：坐輪椅的人站起來，坐在桌邊的人再吃一盤，站在流理台前的人再做一次
    if (chair) standUp(person, chair);
    else { tryEat(person); tryWork(person); }
    return;
  }
  delete person.data.facing;
  if (chair) {
    if (at) parkChair(person, chair, chairOrigin, at.x, at.z);
    save();
    return;
  }
  const { x, z } = person.root.position;
  const target = dropTarget(person, x, z);
  if (target.chair) {
    person.data.seat = world.chairs.indexOf(target.chair);
    settle(person);
    tryEat(person);
    tryWork(person);
  } else if (target.door) {
    travel(person, target.door);
  } else {
    let spot = walkable(x, z);
    if (target.friend) {
      const friend = target.friend, fp = friend.root.position;
      // 站到朋友在畫面上的左邊或右邊（看放手時偏哪邊），兩個人才不會互相擋住
      const side = (x - fp.x) - (z - fp.z) >= 0 ? 1 : -1;
      spot = walkable(fp.x + side * 0.6, fp.z - side * 0.6);
      if (friend.mode === 'stand') friend.root.rotation.y = Math.atan2(spot.x - fp.x, spot.z - fp.z);
      person.greet = friend.greet = 1.6;
      person.root.rotation.y = Math.atan2(fp.x - spot.x, fp.z - spot.z);
      person.data.x = spot.x; person.data.z = spot.z;
      person.root.position.set(spot.x, 0, spot.z);
      person.stand();
    } else {
      person.data.x = spot.x; person.data.z = spot.z;
      settle(person);
    }
  }
  save();
}
canvas.addEventListener('pointerup', (e) => endDrag(e, false));
canvas.addEventListener('pointercancel', (e) => endDrag(e, true));

// ---------- 造型面板 ----------
const creator = new Creator({
  getPeople: players,
  getSelected: () => selected,
  onSelect: select,
  onChange(person) {
    person.rebuild();
    drawAvatar(document.getElementById('portraitFace'), person.data.design, 'head');
    save();
  },
  onAdd() {
    if (players().length >= MAX_PEOPLE) return;
    const id = Math.max(0, ...players().map((p) => p.data.id)) + 1;
    const spot = freeSpot();
    const person = addPerson({ id, x: spot.x, z: spot.z, seat: null, place: placeName, design: randomDesign() });
    select(person);
    save();
  },
  onRemove(person) {
    if (players().length <= 1) return;
    leaveSeat(person);
    scene.remove(person.root);
    people.splice(people.indexOf(person), 1);
    select(here().find((p) => !p.data.npc) || players()[0]);
    save();
  },
  onToggle: () => refocus(),
});
document.getElementById('portraitBtn').addEventListener('click', () => creator.toggle());

// 存檔備份（savebox.js，跟其他遊戲共用同一份）：匯出、匯入存檔的檔案。雲端備份要等有正式網域、補上 clientId 才會出現。
// 雲端備份的 Google 登入只登記了正式網域，在本機和區網開的時候只有檔案匯出、匯入
const CLOUD_CLIENT = location.hostname === 'tsun-u.github.io' ? '674654433726-tq25dneafbu0pm39pq6kl2kpdmgmnh3f.apps.googleusercontent.com' : undefined;
window.SaveBox.init({ game: 'tiny-town', keys: [SAVE_KEY], clientId: CLOUD_CLIENT });
const saveBoxButton = window.SaveBox.button();
saveBoxButton.className = 'savebox-button';
document.getElementById('saveBoxSlot').append(saveBoxButton);

/** 面板開著時把鏡頭拉近選中的人，並讓他落在沒被面板蓋住的那一半。 */
function refocus() {
  if (!creator.open || !selected) {
    view.goalCenter.copy(homeCenter).add(look.pan); view.goalZoom = look.zoom;
    return;
  }
  const zoom = Math.min(2.6, viewHeight / 4.6);
  const pxPerUnit = window.innerHeight / viewHeight * zoom;
  const panel = document.getElementById('creator').getBoundingClientRect();
  const sideways = panel.height >= window.innerHeight - 1;
  const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
  const up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
  const pos = selected.root.position;
  view.goalCenter.set(pos.x, selected.height * 0.55, pos.z);
  if (sideways) view.goalCenter.addScaledVector(right, panel.width / 2 / pxPerUnit);
  else view.goalCenter.addScaledVector(up, -panel.height / 2 / pxPerUnit);
  view.goalZoom = zoom;
}

// ---------- 開場 ----------
const saved = loadSave();
Object.assign(parked, saved.parked);
saved.people.filter((data) => !data.npc).forEach(addPerson);
// 固定角色：存檔裡有就照存檔的位置，沒有（新加的角色、第一次玩）就站在表上的位置；制服一律照表
for (const staff of STAFF) {
  const kept = saved.people.find((data) => data.npc && data.id === staff.id);
  const spot = kept ? { place: kept.place, x: kept.x, z: kept.z, seat: kept.seat, facing: kept.facing } : { place: staff.place, x: staff.x, z: staff.z, seat: null, facing: staff.facing };
  addPerson({ id: staff.id, npc: true, design: { ...staff.design }, ...spot });
}
applyCamera();
window.addEventListener('resize', resize);
resize();
sky.set(saved.sky || {});
renderWeather();
renderTime();
goTo(params.get('place') || saved.place);
renderMap();
view.center.copy(view.goalCenter); view.zoom = view.goalZoom;   // 開場直接在定位，不要從別處滑過來
select(players().find((p) => String(p.data.id) === params.get('person')) || here().find((p) => !p.data.npc) || players()[0]);
if (params.get('panel') === 'creator') creator.toggle();

const frames = { count: 0, longest: 0 };   // longest：最長的一格花了幾秒，量效能用
let lastTime = performance.now();
function frame(now) {
  const elapsed = (now - lastTime) / 1000;
  lastTime = now;
  const dt = Math.min(0.05, elapsed);
  const time = now / 1000;
  frames.count += 1; frames.longest = Math.max(frames.longest, elapsed);
  const ease = 1 - Math.exp(-dt * 7);
  view.center.lerp(view.goalCenter, ease);
  view.zoom += (view.goalZoom - view.zoom) * ease;
  applyCamera();
  for (const person of people) {
    person.update(dt, time);
    if (person.mode === 'held' || person.mode === 'splash' || person.greet > 0 || person.hop > 0 || person.working > 0 || person.treat > 0) touchShadow();
  }
  sky.update(dt, time, view.center, Math.max(1, viewHeight / 18), CAMERA_DIR);
  updateFood(dt, time);
  updateEffects(dt, time);
  if (SHADOWS && time < shadowDirtyUntil) sun.shadow.needsUpdate = true;
  if (drag && drag.moved) for (const { marker } of [...world.doors, ...world.chairs]) marker.material.opacity = 0.6 + Math.sin(time * 6) * 0.3;
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// 測試入口：網址參數 ?fresh=1（不讀存檔）、?panel=creator、?person=<id>、?place=home、shop 或 toys；其餘看 README。
window.__town = { people, places, goTo, get world() { return world; }, get placeName() { return placeName; }, creator, renderer, sky, view, frames, select, screenOf, save, getYaw: () => yaw, setYaw, look };
