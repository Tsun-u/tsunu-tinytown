// 停車塔：醫院和百貨公司中間那一棟，三層（park1 到 park3），第三層露天。
// 場景設定：水泥樓板、白色的停車格線、矮牆和柱子，牆是開放的，看得到外面。樓層之間是車子開的坡道。
// 坡道輪流放在右邊和左邊：一樓右邊的坡道往上，到二樓右邊的開口；二樓左邊的坡道往上，到三樓左邊的開口。
// 車子是 mobile 的座位（見主程式的 moveVehicle）：四台車在街上和每一層都留了位子，車開到哪裡，那裡的位子才看得到。
import { Builder } from './builder.js';
import { C, ground, finishPlace } from './shop.js';
import { carModel, CAR_COLORS, CAR_SEATS, CAR_SEAT_HEIGHT } from './street.js';

const K = { deck: '#d5d8de', deckDark: '#a3a8b3', wall: '#eef0f3', line: '#ffffff', body: '#b9bfca', hole: '#5d6270', up: '#5ec27a', down: '#f29b4b' };
const RAMP_X = 3.15, RAMP_RISE = 1.6;
const SLOTS = [-1.6, 0, 1.6];   // 三個停車格的中心
const FLOORS = ['park1', 'park2', 'park3'];

/** 樓板、停車格線、後牆和左牆。roofed：有沒有上面那一層（三樓露天，只有欄杆）。 */
function deck(b, level, roofed) {
  b.box(8.0, 0.03, 6.0, K.deck, 0, 0.075, 0);
  for (const x of [-2.4, -0.8, 0.8, 2.4]) b.box(0.07, 0.01, 2.2, K.line, x, 0.095, -1.8);   // 停車格
  b.box(4.87, 0.01, 0.07, K.line, 0, 0.095, -2.9);
  for (const x of SLOTS) b.rbox(0.9, 0.1, 0.14, C.yellow, x, 0.14, -2.72, { r: 0.03 });      // 車輪擋
  for (let i = 0; i < level; i++) b.cyl(0.13, 0.13, 0.01, C.yellow, -0.3 * (level - 1) + i * 0.6, 0.097, 0.6, { seg: 12 });   // 地上的圓點：第幾層就幾顆
  const coneSide = level === 2 ? 1 : -1;   // 三角錐放在沒有坡道的那個前面角落
  for (const [dx, z] of [[3.3, 2.2], [2.9, 2.35], [3.4, 1.7]]) {
    const x = coneSide * dx;
    b.cyl(0.02, 0.11, 0.3, C.orange, x, 0.24, z, { seg: 8 });
    b.box(0.26, 0.03, 0.26, C.orange, x, 0.1, z);
    b.cyl(0.06, 0.075, 0.05, C.white, x, 0.26, z, { seg: 8 });
  }
  const wallHeight = roofed ? 1.0 : 0.6;
  b.box(8.25, wallHeight, 0.22, K.wall, -0.12, wallHeight / 2, -3.12);
  b.box(0.22, wallHeight, 6.25, K.wall, -4.12, wallHeight / 2, -0.12);
  b.rbox(8.3, 0.08, 0.3, K.deckDark, -0.12, wallHeight + 0.04, -3.12, { r: 0.02 });
  b.rbox(0.3, 0.08, 6.3, K.deckDark, -4.12, wallHeight + 0.04, -0.12, { r: 0.02 });
  if (!roofed) return;
  for (const [x, z] of [[-4.12, -3.12], [-1.4, -3.12], [1.3, -3.12], [4.0, -3.12], [-4.12, -0.1], [-4.12, 3.0]]) b.rbox(0.3, 2.9, 0.3, K.wall, x, 1.45, z, { r: 0.04 });   // 柱子
  b.rbox(8.4, 0.34, 0.36, K.deckDark, -0.12, 2.9, -3.12, { r: 0.04 });   // 上一層樓板的邊
  b.rbox(0.36, 0.34, 6.4, K.deckDark, -4.12, 2.9, -0.12, { r: 0.04 });
  for (const x of [-2.7, 0, 2.7]) b.box(0.9, 0.05, 0.12, '#fff2a8', x, 2.7, -2.95, { glow: true });   // 燈管
  // 後面那根樑上的 P 字招牌
  b.rbox(0.6, 0.6, 0.08, C.blue, -3.2, 2.2, -2.98, { r: 0.07 });
  b.box(0.09, 0.38, 0.04, C.white, -3.3, 2.2, -2.93);
  b.box(0.22, 0.09, 0.04, C.white, -3.2, 2.35, -2.93);
  b.box(0.22, 0.09, 0.04, C.white, -3.2, 2.2, -2.93);
  b.box(0.09, 0.2, 0.04, C.white, -3.1, 2.27, -2.93);
}

/** 往上的坡道：從靠前面的地板升到後面，上面畫綠色的箭頭。side：1 是右邊，-1 是左邊。 */
function rampUp(b, side) {
  const x = side * RAMP_X, length = Math.hypot(4.1, RAMP_RISE), tilt = Math.atan2(RAMP_RISE, 4.1);
  b.box(1.4, 0.1, length, K.deckDark, x, RAMP_RISE / 2, -0.85, { rx: tilt });
  for (const dx of [-0.7, 0.7]) b.box(0.08, 0.3, length, K.wall, x + dx, RAMP_RISE / 2 + 0.16, -0.85, { rx: tilt });
  for (let i = 0; i < 3; i++) {   // 箭頭：三個往上的尖角
    const z = 0.5 - i * 1.2, y = (1.2 - z) / 4.1 * RAMP_RISE + 0.07;
    for (const turn of [-1, 1]) b.box(0.42, 0.02, 0.1, K.up, x + turn * 0.14, y, z, { rx: tilt, ry: -turn * 0.7 });
  }
  for (let i = 0; i < 4; i++) b.box(0.3, 0.012, 0.16, i % 2 ? C.dark : C.yellow, x - 0.52 + i * 0.35, 0.1, 1.35);   // 坡道口的黃黑線
  return [0.5, -0.6, -1.7, -2.6].map((z) => ({ x, z, r: 0.85 }));
}

/** 往下的開口：地板上一個洞，三面有欄杆，洞口畫橘色的箭頭。 */
function rampDown(b, side) {
  const x = side * RAMP_X;
  b.box(1.36, 0.02, 2.0, K.hole, x, 0.1, -1.9);
  b.box(1.36, 0.1, 1.0, K.deckDark, x, 0.02, -1.3, { rx: -0.35 });
  for (const dx of [-0.72, 0.72]) b.box(0.07, 0.5, 2.0, K.wall, x + dx, 0.33, -1.9);
  b.box(1.5, 0.5, 0.07, K.wall, x, 0.33, -2.92);
  for (const turn of [-1, 1]) b.box(0.42, 0.02, 0.1, K.down, x + turn * 0.14, 0.1, -0.62, { ry: -turn * 0.7 });   // 箭頭朝開口裡面
  for (let i = 0; i < 4; i++) b.box(0.3, 0.012, 0.16, i % 2 ? C.dark : C.yellow, x - 0.52 + i * 0.35, 0.1, -0.85);
  return [-1.3, -2.3].map((z) => ({ x, z, r: 0.85 }));
}

/** 二、三樓的地面：樓板底下是停車塔的外牆，旁邊飄著雲。 */
function upstairsGround(b) {
  b.rbox(8.9, 0.3, 6.9, K.deckDark, -0.05, -0.1, -0.05, { r: 0.08 });
  b.box(8.5, 5.0, 6.5, K.body, -0.05, -2.7, -0.05);
  for (let i = 0; i < 4; i++) {
    b.box(1.5, 0.7, 0.05, K.hole, -3.0 + i * 2.0, -1.4, 3.21);
    b.box(0.05, 0.7, 1.3, K.hole, 4.21, -1.4, -2.4 + i * 1.6);
  }
  for (const [x, y, z] of [[-5.6, -0.6, 2.2], [3.2, -2.6, 4.6]]) {
    b.ball(0.5, C.white, x, y, z, { glow: true });
    b.ball(0.38, C.white, x - 0.55, y - 0.08, z, { glow: true });
    b.ball(0.4, C.white, x + 0.55, y - 0.06, z, { glow: true });
  }
}

/** 每一台車在這一層的兩個位子。home：這台車一開始停在這一層的哪個停車格；不在這一層的話位子先收著（away）。 */
function carSeats(level) {
  return CAR_COLORS.flatMap((hex, car) => {
    const here = car === level;   // 第 1、2、3 台各停在一、二、三樓，粉紅色那台（第 0 台）在街上
    const spot = { x: SLOTS[car - 1] ?? 0, z: -1.8, facing: 0, away: !here };
    return CAR_SEATS.map((along) => ({ x: spot.x, z: spot.z, facing: 0, seatHeight: CAR_SEAT_HEIGHT, markerY: 0.95, mobile: true, car, along, spot }));
  });
}

function buildFloor(scene, level) {
  const b = new Builder();
  const roofed = level < 3;
  if (level === 1) ground(b); else upstairsGround(b);
  deck(b, level, roofed);
  const up = FLOORS[level], down = FLOORS[level - 2];
  // 往上的坡道：一樓在右邊、二樓在左邊。往下的開口跟下一層的坡道同一邊
  const upSide = level === 1 ? 1 : -1, downSide = level === 2 ? 1 : -1;
  const obstacles = [];
  const doors = [], arrive = {};
  if (up) {
    obstacles.push(...rampUp(b, upSide));
    doors.push({ x: upSide * RAMP_X, z: 1.8, to: up, r: 0.62, markerY: 0.13 });
    arrive[up] = { x: upSide * 1.7, z: 1.8 };
  }
  if (down) {
    obstacles.push(...rampDown(b, downSide));
    doors.push({ x: downSide * RAMP_X, z: -0.25, to: down, r: 0.62, markerY: 0.13 });
    arrive[down] = { x: downSide * 1.7, z: -0.25 };
  }
  if (level === 1) {   // 一樓前面是通往街上的出口：黃黑相間的線
    for (let i = 0; i < 8; i++) b.box(0.4, 0.012, 0.3, i % 2 ? C.dark : C.yellow, -1.4 + i * 0.4, 0.1, 2.85);
    // 出口旁的收費亭和抬起來的柵欄
    b.rbox(0.5, 1.1, 0.5, C.blue, 2.2, 0.62, 2.75, { r: 0.05 });
    b.box(0.36, 0.4, 0.04, C.glass, 2.2, 0.9, 3.01);
    b.rbox(0.6, 0.08, 0.6, C.white, 2.2, 1.2, 2.75, { r: 0.03 });
    b.box(0.14, 0.7, 0.14, C.dark, 1.7, 0.42, 2.9);
    for (let i = 0; i < 5; i++) b.box(0.3, 0.07, 0.07, i % 2 ? C.white : C.red, 1.6 - i * 0.2, 0.9 + i * 0.2, 2.9, { rz: -0.78 });
    doors.push({ x: 0, z: 3.5, to: 'street' });
    arrive.street = { x: 0, z: 1.6 };
  }

  const place = finishPlace(scene, b, carSeats(level), {
    doors, arrive,
    spawn: { x: 0, z: 1.6 },
    view: { center: [0, 1.2, 0.8], height: 13.6, width: 16 },
    ...(roofed ? {} : { indoor: null }),   // 三樓露天：雨雪照下，晚上沒有屋裡的燈
    obstacles,
    // 小人和車子能待的範圍：整片樓板（坡道和開口是障礙）
    areas: [{ minX: -3.5, maxX: 3.5, minZ: -2.5, maxZ: 2.5 }],
  });
  // 車子是獨立的網格，同一台車的兩個位子共用一個；車頭在模型裡朝 +x，這裡轉成朝 +z
  CAR_COLORS.forEach((hex, car) => {
    const mesh = carModel(place.group, hex);
    mesh.children.forEach((child) => { child.rotation.y = -Math.PI / 2; });
    for (const chair of place.chairs) if (chair.car === car) chair.mesh = mesh;
  });
  return place;
}

export const buildPark1 = (scene) => buildFloor(scene, 1);
export const buildPark2 = (scene) => buildFloor(scene, 2);
export const buildPark3 = (scene) => buildFloor(scene, 3);
