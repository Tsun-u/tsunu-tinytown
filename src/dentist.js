// 牙醫診所：街上那棟有臉的房子（兩扇圓窗是眼睛，白色的門板是牙齒）。
// 場景設定：白天的兒童牙醫。奶油色的牆配鵝黃腰板和紅白屋簷（跟房子外觀同色），診療椅是薄荷綠。
// 裡面有兩張可以躺的診療椅、一顆可以刷的大牙齒、候診的椅子。座標和剖開方式跟點心店一樣（見 shop.js）。
import * as THREE from 'three';
import { Builder } from './builder.js';
import { C, VIEW, ground, walls, lamps, chair, pot, finishPlace } from './shop.js';

const T = { yellow: '#f8d98a', yellowDark: '#e9c46a', red: '#e8766a', steel: '#c5ced8', steelDark: '#9aa6b3', mint: '#a8dccf', mintDark: '#86c7b7' };
const CHAIR_HEIGHT = 0.6;

function entrance(b) {
  for (const x of [-3.72, -2.08]) b.rbox(0.2, 2.6, 0.2, C.white, x, 1.3, 3.05, { r: 0.04 });
  b.rbox(1.9, 0.22, 0.26, C.white, -2.9, 2.62, 3.05, { r: 0.04 });
  for (let i = 0; i < 5; i++) b.rbox(0.42, 0.08, 0.85, i % 2 ? C.cream : T.red, -3.74 + i * 0.42, 2.72, 3.42, { rx: 0.42, r: 0.03 });
  b.rbox(0.08, 2.2, 0.82, C.white, -3.9, 1.15, 2.52, { r: 0.03 });
  b.box(0.03, 1.5, 0.6, C.glass, -3.85, 1.25, 2.52);
  b.rbox(1.2, 0.04, 0.6, T.red, -2.9, 0.07, 3.55, { r: 0.02 });
  tooth(b, -2.9, 1.86, 3.12, 0.5);                                       // 門上掛的牙齒招牌
  for (const x of [-0.9, 1.1, 3.1]) for (let i = 0; i < 5; i++) b.ball(0.16, i % 2 ? C.green : C.greenDark, x - 0.44 + i * 0.22, 0.46, 3.05, { sy: 0.8 });
  pot(b, -4.35, 3.65, T.yellow);
  pot(b, -1.65, 3.5, C.white);
}

/** 一顆牙齒：圓圓的牙冠和兩支牙根。x、y、z 是底部中心，s 是大小。face 為 true 時畫上眼睛和微笑。 */
function tooth(b, x, y, z, s, face) {
  b.rbox(0.9 * s, 0.7 * s, 0.7 * s, C.white, x, y + 0.75 * s, z, { r: 0.22 * s });
  for (const dx of [-0.24, 0.24]) b.rbox(0.3 * s, 0.5 * s, 0.4 * s, C.white, x + dx * s, y + 0.28 * s, z, { r: 0.12 * s });
  if (!face) return;
  for (const dx of [-0.17, 0.17]) b.ball(0.06 * s, C.dark, x + dx * s, y + 0.86 * s, z + 0.36 * s);
  b.rbox(0.26 * s, 0.05 * s, 0.03, C.dark, x, y + 0.66 * s, z + 0.36 * s, { r: 0.02 });
  for (const dx of [-0.3, 0.3]) b.ball(0.07 * s, C.pink, x + dx * s, y + 0.72 * s, z + 0.33 * s, { sz: 0.4 });
}

function frontDesk(b) {
  // 櫃台：正面一顆牙齒，檯面上有電腦和一罐牙刷
  b.rbox(2.4, 0.9, 0.7, C.white, -2.5, 0.45, -1.7, { r: 0.05 });
  b.box(2.3, 0.1, 0.62, T.yellowDark, -2.5, 0.05, -1.68);
  b.rbox(2.6, 0.1, 0.86, T.yellow, -2.5, 0.96, -1.68, { r: 0.04 });
  tooth(b, -2.5, 0.22, -1.36, 0.5);
  b.rbox(0.46, 0.32, 0.05, C.dark, -3.1, 1.3, -1.8, { r: 0.03 });
  b.box(0.06, 0.14, 0.06, C.dark, -3.1, 1.08, -1.8);
  b.cyl(0.08, 0.07, 0.14, C.blue, -1.7, 1.08, -1.6, { seg: 10 });
  [C.red, C.yellow, C.green].forEach((hex, i) => b.box(0.025, 0.2, 0.025, hex, -1.74 + i * 0.04, 1.2, -1.6, { rz: (i - 1) * 0.2 }));
  // 後牆的架子：牙膏、漱口杯、一副假牙
  b.rbox(2.2, 0.07, 0.34, C.white, -2.5, 1.75, -2.82, { r: 0.02 });
  [C.red, C.blue, C.green, C.pink].forEach((hex, i) => {
    b.rbox(0.12, 0.34, 0.12, C.white, -3.35 + i * 0.26, 1.96, -2.82, { r: 0.03 });
    b.box(0.13, 0.1, 0.13, hex, -3.35 + i * 0.26, 2.16, -2.82);
  });
  [C.yellow, C.blue].forEach((hex, i) => b.cyl(0.09, 0.07, 0.14, hex, -2.2 + i * 0.26, 1.86, -2.82, { seg: 10 }));
  b.rbox(0.4, 0.12, 0.26, C.pink, -1.65, 1.85, -2.82, { r: 0.05 });
  for (let i = 0; i < 4; i++) b.box(0.07, 0.07, 0.04, C.white, -1.78 + i * 0.09, 1.93, -2.72);
  // 候診區：左牆邊兩張椅子、一張放繪本的小桌
  const seats = [[0.0, C.blue], [0.8, T.red]].map(([z, hex]) => chair(b, -3.35, z, Math.PI / 2, hex));
  b.rbox(0.5, 0.36, 0.5, C.white, -3.4, 0.18, -0.75, { r: 0.04 });
  [C.green, C.yellow].forEach((hex, i) => b.box(0.3, 0.035, 0.22, hex, -3.4, 0.38 + i * 0.035, -0.75, { ry: i * 0.4 }));
  return seats;
}

/** 診療椅：躺平的椅子、旁邊的器械盤、從後面伸過來的燈臂。燈本身另外做才會亮（見 chairLamp）。 */
function dentalChair(b, x) {
  const z = -1.55;
  b.cyl(0.34, 0.4, 0.14, T.steelDark, x, 0.07, z + 0.1, { seg: 16 });
  b.cyl(0.12, 0.14, 0.3, T.steelDark, x, 0.26, z + 0.1, { seg: 10 });
  b.rbox(0.72, 0.16, 1.75, T.mint, x, 0.48, z, { r: 0.07 });
  b.rbox(0.5, 0.12, 0.36, T.mintDark, x, 0.6, z - 0.62, { r: 0.05 });      // 頭枕
  b.rbox(0.72, 0.1, 0.4, T.mintDark, x, 0.5, z + 0.72, { r: 0.04 });       // 腳踏
  for (const sx of [-1, 1]) b.rbox(0.08, 0.1, 0.6, T.steelDark, x + sx * 0.42, 0.62, z + 0.05, { r: 0.03 });
  // 器械盤
  b.cyl(0.03, 0.03, 0.9, T.steelDark, x + 0.72, 0.45, z - 0.3, { seg: 6 });
  b.rbox(0.44, 0.04, 0.3, T.steel, x + 0.72, 0.92, z - 0.3, { r: 0.02 });
  for (let i = 0; i < 3; i++) b.box(0.025, 0.02, 0.2, i === 1 ? C.blue : T.steelDark, x + 0.6 + i * 0.12, 0.95, z - 0.3);
  b.cyl(0.05, 0.04, 0.09, C.white, x + 0.86, 0.985, z - 0.2, { seg: 8 });   // 漱口杯
  // 燈臂
  b.cyl(0.03, 0.03, 2.1, T.steelDark, x - 0.5, 1.05, z - 0.95, { seg: 6 });
  b.box(0.52, 0.04, 0.04, T.steelDark, x - 0.26, 2.08, z - 0.95);
  b.box(0.04, 0.04, 0.5, T.steelDark, x, 2.08, z - 0.72);
  b.cyl(0.2, 0.14, 0.12, T.steel, x, 2.02, z - 0.5, { seg: 12 });
  return { x, z: z + 0.1, facing: 0, seatHeight: CHAIR_HEIGHT, pose: 'dental', markerY: 0.68 };
}

/** 診療椅上面的燈和牙齒冒出來的星星：有人躺著才亮、才閃。 */
function chairLamp(group, seat) {
  const lamp = new THREE.Group();
  const glow = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.03, 12), new THREE.MeshBasicMaterial({ color: '#fff2a8' }));
  glow.position.set(seat.x, 1.95, seat.z - 0.6);
  lamp.add(glow);
  for (let i = 0; i < 4; i++) {
    const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.07), new THREE.MeshBasicMaterial({ color: i % 2 ? '#ffffff' : '#ffe27a', transparent: true, depthWrite: false }));
    star.userData.offset = i / 4;
    star.userData.home = [seat.x + (i - 1.5) * 0.14, 0.95, seat.z - 0.45];
    lamp.add(star);
  }
  lamp.visible = false;
  group.add(lamp);
  return lamp;
}

/** 每一格更新診療椅的星星：從嘴巴的位置往上飄、變淡。 */
export function twinkle(lamp, time) {
  for (const star of lamp.children.slice(1)) {
    const phase = (time * 0.8 + star.userData.offset) % 1, [x, y, z] = star.userData.home;
    star.position.set(x, y + phase * 0.6, z);
    star.rotation.y = time * 3 + star.userData.offset * 6;
    star.scale.setScalar(0.5 + Math.sin(phase * Math.PI) * 0.9);
    star.material.opacity = 1 - phase;
  }
}

function clinic(b) {
  const chairs = [0.5, 2.55].map((x) => dentalChair(b, x));
  // 後牆的 X 光片燈箱：一排白色的牙齒
  b.rbox(1.3, 0.8, 0.07, T.steelDark, 1.5, 2.45, -2.97, { r: 0.04 });
  b.box(1.16, 0.66, 0.03, '#3d4a66', 1.5, 2.45, -2.94);
  for (let i = 0; i < 6; i++) b.rbox(0.13, 0.22 + (i % 2) * 0.06, 0.02, C.white, 1.05 + i * 0.18, 2.45, -2.92, { r: 0.04, glow: true });
  // 牆上的海報：一支牙刷
  b.rbox(0.7, 0.9, 0.06, C.white, 3.3, 2.3, -2.97, { r: 0.03 });
  b.box(0.56, 0.76, 0.03, T.mint, 3.3, 2.3, -2.94);
  b.box(0.07, 0.5, 0.02, C.blue, 3.3, 2.2, -2.92, { rz: 0.5 });
  b.box(0.16, 0.12, 0.02, C.white, 3.44, 2.46, -2.92, { rz: 0.5 });
  return chairs;
}

/** 右前方的大牙齒：站在旁邊就幫它刷牙。 */
function bigTooth(b) {
  const x = 2.7, z = 1.5;
  b.cyl(0.75, 0.82, 0.2, T.yellowDark, x, 0.1, z, { seg: 22 });
  b.cyl(0.66, 0.66, 0.21, C.cream, x, 0.1, z, { seg: 22 });
  tooth(b, x, 0.2, z, 1.25, true);
  // 靠在旁邊的大牙刷
  b.rbox(0.1, 1.5, 0.1, C.blue, x + 0.78, 0.85, z + 0.2, { r: 0.04, rz: -0.18 });
  b.rbox(0.14, 0.34, 0.16, C.white, x + 0.9, 1.66, z + 0.2, { r: 0.03, rz: -0.18 });
  return { x: x - 0.95, z: z + 0.15, facing: Math.PI / 2, seatHeight: 0, pose: 'brush' };
}

/** 刷牙的泡泡：刷的時候從大牙齒上面冒出來。跟鍋子的蒸氣用同一套動畫。 */
function foam(group, x, y, z) {
  const puffs = new THREE.Group();
  puffs.position.set(x, y, z);
  for (let i = 0; i < 3; i++) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), new THREE.MeshBasicMaterial({ color: i % 2 ? '#d7f1fb' : '#ffffff', transparent: true, depthWrite: false }));
    puff.userData.offset = i / 3;
    puffs.add(puff);
  }
  puffs.visible = false;
  group.add(puffs);
  return puffs;
}

export function buildDentist(scene) {
  const b = new Builder();
  ground(b);
  walls(b, { wainscot: T.yellow, slat: T.yellowDark, eave: T.red, curtain: C.white, windowZ: 0.4 });
  lamps(b);
  entrance(b);
  const waiting = frontDesk(b);
  const dental = clinic(b);
  const brush = bigTooth(b);

  const place = finishPlace(scene, b, [...waiting, ...dental, brush], {
    doors: [{ x: -2.9, z: 3.4, to: 'street' }],
    spawn: { x: -1.0, z: 4.5 },
    view: VIEW,
    // 小人放不上去的圓：大牙齒、候診椅、繪本桌、門外的盆栽
    obstacles: [
      { x: 2.7, z: 1.5, r: 0.9 }, { x: -3.35, z: 0.0, r: 0.45 }, { x: -3.35, z: 0.8, r: 0.45 },
      { x: -4.35, z: 3.65, r: 0.5 }, { x: -1.65, z: 3.5, r: 0.5 },
    ],
    // 小人能站的範圍：診療椅前面的地板和門外的人行道
    areas: [{ minX: -2.8, maxX: 3.5, minZ: -0.4, maxZ: 2.6 }, { minX: -4.4, maxX: 4.5, minZ: 3.5, maxZ: 4.85 }],
  });
  for (const seat of place.chairs) {
    if (seat.pose === 'dental') seat.lamp = chairLamp(place.group, seat);
    if (seat.pose === 'brush') seat.steam = foam(place.group, 2.7, 1.5, 1.5);
  }
  return place;
}
