// 醫院：街上最左邊那棟高樓。一樓是掛號、候診和看診，二樓是病房；兩層樓用同一座電梯上下。
// 場景設定：白天的兒童醫院。白色配薄荷綠，紅十字只當點綴；量身高的尺是長頸鹿，病房有魚缸和玩具墊。
// 座標和剖開方式跟點心店一樣（見 shop.js）。二樓沒有街道，前面是陽台，腳下看得到大樓的外牆。
import * as THREE from 'three';
import { Builder } from './builder.js';
import { C, SEAT_HEIGHT, VIEW, walls, lamps, chair, pot, finishPlace } from './shop.js';

const M = { mint: '#a8dccf', mintDark: '#86c7b7', tileA: '#f4faf8', tileB: '#e0f1ec', steel: '#c5ced8', steelDark: '#9aa6b3', tower: '#a9c4de', giraffe: '#f8d15c', cloud: '#ffffff' };
const BED_HEIGHT = 0.6, STOOL_HEIGHT = 0.42;
const LIFT_X = 0.9;   // 電梯在後牆的位置，兩層樓一樣
function tiles(b) {
  for (let ix = 0; ix < 8; ix++) for (let iz = 0; iz < 6; iz++) b.box(0.99, 0.06, 0.99, (ix + iz) % 2 ? M.tileA : M.tileB, -3.5 + ix, 0.03, -2.5 + iz);
}

/** 一樓的地面：底座、屋內地磚、門外的人行道和馬路。 */
function streetGround(b) {
  b.rbox(11.2, 0.5, 10.2, C.baseDark, 0, -0.42, 1.2, { r: 0.18 });
  b.rbox(10.9, 0.26, 9.9, C.base, 0, -0.13, 1.2, { r: 0.1 });
  tiles(b);
  for (let ix = 0; ix < 10; ix++) for (let iz = 0; iz < 2; iz++) b.box(0.97, 0.06, 0.97, (ix + iz) % 2 ? C.tileA : C.tileB, -4.5 + ix, 0.03, 3.6 + iz);
  b.rbox(10.2, 0.14, 0.26, C.cream, 0, 0.04, 5.25, { r: 0.05 });
  b.box(10.2, 0.04, 0.7, C.road, 0, 0.01, 5.75);
  for (let i = 0; i < 6; i++) b.box(0.7, 0.02, 0.1, C.white, -4.2 + i * 1.7, 0.04, 5.78);
  b.box(1.0, 0.07, 6.6, C.leaf, -4.85, 0.02, -0.3);
  b.box(1.0, 0.07, 6.6, C.leaf, 4.85, 0.02, -0.3);
}

/** 樓上的地面：地板底下是大樓的外牆和窗戶，前面是有欄杆的陽台，旁邊飄著雲。 */
function upstairsGround(b) {
  b.rbox(9.0, 0.3, 8.0, C.cream2, 0, -0.15, 0.6, { r: 0.08 });
  b.rbox(8.6, 2.2, 7.6, M.tower, 0, -1.4, 0.6, { r: 0.06 });           // 樓下的外牆
  for (let i = 0; i < 6; i++) b.box(0.7, 0.8, 0.05, C.glass, -3.3 + i * 1.3, -1.2, 4.41);
  for (let i = 0; i < 5; i++) b.box(0.05, 0.8, 0.7, C.glass, 4.31, -1.2, -2.2 + i * 1.3);
  tiles(b);
  b.box(8.2, 0.06, 1.3, C.tileA, 0, 0.03, 3.72);                        // 陽台
  b.rbox(2.0, 0.3, 0.22, M.mint, -2.95, 0.15, 3.05, { r: 0.04 });       // 一樓大門的位置在樓上是矮牆
  for (let i = 0; i < 12; i++) b.box(0.06, 0.7, 0.06, C.white, -4.0 + i * 0.73, 0.4, 4.3);
  b.rbox(8.3, 0.08, 0.1, C.white, 0, 0.78, 4.3, { r: 0.03 });
  for (const x of [-3.2, 3.2]) {                                        // 陽台的花箱
    b.rbox(1.1, 0.26, 0.3, C.white, x, 0.19, 4.05, { r: 0.04 });
    for (let i = 0; i < 4; i++) {
      b.ball(0.11, i % 2 ? C.green : C.greenDark, x - 0.36 + i * 0.24, 0.38, 4.05);
      b.ball(0.055, [C.pink, C.yellow, C.white, C.lilac][i], x - 0.36 + i * 0.24, 0.49, 4.08);
    }
  }
  for (const [x, y, z] of [[5.6, -1.0, 2.6], [-5.4, -0.2, 4.6]]) {      // 樓上才看得到的雲
    b.ball(0.5, M.cloud, x, y, z, { glow: true });
    b.ball(0.38, M.cloud, x - 0.55, y - 0.08, z, { glow: true });
    b.ball(0.4, M.cloud, x + 0.55, y - 0.06, z, { glow: true });
  }
}

function entrance(b) {
  for (const x of [-3.72, -2.08]) b.rbox(0.2, 2.6, 0.2, C.white, x, 1.3, 3.05, { r: 0.04 });
  b.rbox(1.9, 0.22, 0.26, C.white, -2.9, 2.62, 3.05, { r: 0.04 });
  for (let i = 0; i < 5; i++) b.rbox(0.42, 0.08, 0.85, i % 2 ? C.cream : M.mint, -3.74 + i * 0.42, 2.72, 3.42, { rx: 0.42, r: 0.03 });
  b.rbox(0.08, 2.2, 0.82, C.white, -3.9, 1.15, 2.52, { r: 0.03 });      // 往內開的玻璃門
  b.box(0.03, 1.5, 0.6, C.glass, -3.85, 1.25, 2.52);
  b.rbox(1.2, 0.04, 0.6, M.mint, -2.9, 0.07, 3.55, { r: 0.02 });
  redCross(b, -2.9, 2.08, 3.12, 0.5, true);                             // 門上的紅十字牌
  for (const x of [-0.9, 1.1, 3.1]) {                                   // 矮牆上的樹籬
    for (let i = 0; i < 5; i++) b.ball(0.16, i % 2 ? C.green : C.greenDark, x - 0.44 + i * 0.22, 0.46, 3.05, { sy: 0.8 });
  }
  pot(b, -4.35, 3.65, C.mint);
  pot(b, -1.65, 3.5, C.white);
}

/** 白底紅十字的牌子，面向 +z。 */
function redCross(b, x, y, z, size, round) {
  if (round) b.cyl(size * 0.62, size * 0.62, 0.06, C.white, x, y, z, { seg: 20, rx: Math.PI / 2 });
  else b.rbox(size * 1.2, size * 1.2, 0.06, C.white, x, y, z, { r: 0.04 });
  b.box(size * 0.7, size * 0.22, 0.03, C.red, x, y, z + 0.04);
  b.box(size * 0.22, size * 0.7, 0.03, C.red, x, y, z + 0.04);
}

/** 電梯在牆上不會動的部分：門框、門洞、樓層燈（第幾層就亮第幾顆）、按鈕。門板另外做才會開（見 liftDoors）。 */
function liftFrame(b, floor) {
  b.rbox(1.56, 2.36, 0.14, M.steelDark, LIFT_X, 1.18, -2.94, { r: 0.04 });
  b.box(1.26, 2.1, 0.04, C.dark, LIFT_X, 1.08, -2.87);
  b.box(1.26, 0.04, 0.3, M.steelDark, LIFT_X, 0.08, -2.75);                // 門檻
  b.rbox(0.62, 0.26, 0.08, C.dark, LIFT_X, 2.56, -2.92, { r: 0.04 });      // 樓層燈
  for (let i = 0; i < 2; i++) {
    const lit = i === floor - 1;
    b.ball(0.06, lit ? '#ffd45c' : '#8a8590', LIFT_X - 0.13 + i * 0.26, 2.56, -2.87, { glow: lit });
  }
  b.rbox(0.16, 0.36, 0.05, C.white, LIFT_X + 1.0, 1.2, -2.97, { r: 0.02 });   // 上下按鈕
  b.ball(0.035, floor === 1 ? '#6fdc8c' : '#8a8590', LIFT_X + 1.0, 1.28, -2.94, { glow: floor === 1 });
  b.ball(0.035, floor === 2 ? '#6fdc8c' : '#8a8590', LIFT_X + 1.0, 1.12, -2.94, { glow: floor === 2 });
}

/** 電梯的兩片門板。open 從 0（關）到 1（開）由主程式設定，門板往兩邊縮。 */
function liftDoors(group) {
  const material = new THREE.MeshLambertMaterial({ color: M.steel });
  const panels = [-1, 1].map((side) => {
    const panel = new THREE.Mesh(new THREE.BoxGeometry(0.62, 2.08, 0.05), material);
    panel.userData.side = side;
    group.add(panel);
    return panel;
  });
  const lift = { x: LIFT_X, z: -2.1, open: 0, holdUntil: 0, panels };
  setLiftOpen(lift, 0);
  return lift;
}

export function setLiftOpen(lift, open) {
  lift.open = open;
  for (const panel of lift.panels) {
    const width = 0.62 * (1 - open * 0.85);
    panel.scale.x = width / 0.62;
    panel.position.set(LIFT_X + panel.userData.side * (0.63 - width / 2), 1.1, -2.82);
  }
}

/** 病床：白色鐵架、有輪子，床頭靠後牆。回傳躺下的位置。 */
function sickbed(b, x, z, blanket) {
  const w = 0.95, l = 1.8;
  b.at(x, 0, z, 0, () => {
    b.rbox(w + 0.08, 0.12, l + 0.08, C.white, 0, 0.32, 0, { r: 0.04 });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      b.box(0.06, 0.24, 0.06, M.steelDark, sx * (w / 2 - 0.04), 0.16, sz * (l / 2 - 0.06));
      b.ball(0.06, C.dark, sx * (w / 2 - 0.04), 0.07, sz * (l / 2 - 0.06));
    }
    b.rbox(w, 0.2, l, C.white, 0, 0.46, 0, { r: 0.07 });
    b.rbox(w + 0.04, 0.1, l * 0.6, blanket, 0, 0.55, l * 0.2, { r: 0.05 });
    b.rbox(w + 0.04, 0.1, 0.16, C.cream, 0, 0.56, -l * 0.1, { r: 0.04 });
    b.rbox(0.62, 0.13, 0.4, C.cream, 0, 0.6, -l / 2 + 0.3, { r: 0.06 });
    b.rbox(w + 0.1, 0.7, 0.08, C.white, 0, 0.62, -l / 2 - 0.02, { r: 0.04 });   // 床頭和床尾的欄杆
    b.rbox(w + 0.1, 0.36, 0.08, C.white, 0, 0.5, l / 2 + 0.02, { r: 0.04 });
  });
  return { x, z: z + 0.1, facing: 0, seatHeight: BED_HEIGHT, pose: 'sleep' };
}

function reception(b) {
  // 掛號櫃台：正面有紅十字，檯面上有電腦、筆筒和叫人鈴
  b.rbox(2.6, 0.9, 0.7, C.white, -2.3, 0.45, -1.7, { r: 0.05 });
  b.box(2.5, 0.1, 0.62, M.mintDark, -2.3, 0.05, -1.68);
  b.rbox(2.8, 0.1, 0.86, M.mint, -2.3, 0.96, -1.68, { r: 0.04 });
  redCross(b, -2.3, 0.5, -1.36, 0.42, true);
  b.rbox(0.46, 0.32, 0.05, C.dark, -3.0, 1.3, -1.8, { r: 0.03 });
  b.box(0.38, 0.24, 0.02, C.glass, -3.0, 1.3, -1.77);
  b.box(0.06, 0.14, 0.06, C.dark, -3.0, 1.08, -1.8);
  b.cyl(0.06, 0.06, 0.12, C.blue, -1.5, 1.07, -1.6, { seg: 10 });
  for (const [dx, hex] of [[-0.02, C.red], [0.02, C.yellow]]) b.box(0.015, 0.14, 0.015, hex, -1.5 + dx, 1.17, -1.6);
  b.cyl(0.08, 0.09, 0.04, C.yellow, -2.0, 1.03, -1.45, { seg: 12 });
  b.ball(0.035, C.dark, -2.0, 1.07, -1.45);
  // 櫃台後面的凳子和牆上的病歷架
  b.cyl(0.24, 0.24, 0.08, M.mint, -2.3, STOOL_HEIGHT + 0.06, -2.4, { seg: 14 });
  b.cyl(0.05, 0.14, STOOL_HEIGHT + 0.02, M.steelDark, -2.3, (STOOL_HEIGHT + 0.02) / 2, -2.4, { seg: 10 });
  b.rbox(2.4, 0.07, 0.34, C.white, -2.4, 1.75, -2.82, { r: 0.02 });
  [C.red, C.yellow, C.blue, C.green, C.lilac, C.orange, C.pink, C.mint].forEach((hex, i) => b.box(0.13, 0.4 + (i % 3) * 0.04, 0.26, hex, -3.4 + i * 0.17, 1.99 + (i % 3) * 0.02, -2.82));
  b.rbox(0.36, 0.3, 0.26, C.white, -1.6, 1.94, -2.82, { r: 0.04 });   // 急救箱
  b.box(0.16, 0.05, 0.02, C.red, -1.6, 1.94, -2.68);
  b.box(0.05, 0.16, 0.02, C.red, -1.6, 1.94, -2.68);
  // 牆上的時鐘
  b.cyl(0.26, 0.26, 0.05, C.white, -0.55, 2.5, -2.96, { seg: 20, rx: Math.PI / 2 });
  b.box(0.03, 0.17, 0.02, C.dark, -0.55, 2.57, -2.92);
  b.box(0.12, 0.03, 0.02, C.dark, -0.5, 2.5, -2.92);
  return { x: -2.3, z: -2.4, facing: 0, seatHeight: STOOL_HEIGHT + 0.1 };
}

function waiting(b) {
  // 候診區：左牆邊三張椅子、一張放繪本的小桌
  const seats = [[-0.3, C.blue], [0.45, M.mint], [1.2, C.yellow]].map(([z, hex]) => chair(b, -3.35, z, Math.PI / 2, hex));
  b.rbox(0.5, 0.36, 0.5, C.white, -3.4, 0.18, -1.0, { r: 0.04 });
  [C.red, C.blue, C.yellow].forEach((hex, i) => b.box(0.3, 0.035, 0.22, hex, -3.4, 0.38 + i * 0.035, -1.0, { ry: i * 0.3 }));
  return seats;
}

function clinic(b) {
  // 看診桌：醫生坐桌子後面，病人坐左邊的凳子
  const cx = 1.75, cz = 0.75;
  b.rbox(1.4, 0.07, 0.75, C.wood, cx, 0.74, cz, { r: 0.03 });
  b.rbox(0.4, 0.66, 0.66, C.white, cx + 0.46, 0.36, cz, { r: 0.03 });
  for (const y of [0.22, 0.5]) b.ball(0.03, M.steelDark, cx + 0.46, y, cz + 0.34);
  for (const sz of [-1, 1]) b.box(0.06, 0.7, 0.06, C.woodDark, cx - 0.62, 0.35, cz + sz * 0.3);
  b.rbox(0.44, 0.3, 0.05, C.dark, cx + 0.3, 1.02, cz - 0.2, { r: 0.03, ry: -0.3 });
  b.box(0.06, 0.12, 0.06, C.dark, cx + 0.3, 0.83, cz - 0.2);
  b.cyl(0.05, 0.05, 0.14, C.white, cx - 0.4, 0.85, cz - 0.15, { seg: 10 });   // 藥罐
  b.cyl(0.055, 0.055, 0.03, C.red, cx - 0.4, 0.93, cz - 0.15, { seg: 10 });
  b.cyl(0.05, 0.05, 0.1, C.orange, cx - 0.25, 0.83, cz - 0.2, { seg: 10 });
  b.at(cx - 0.3, 0.78, cz + 0.2, 0, () => {                                   // 桌上的小熊
    b.ball(0.1, C.choco, 0, 0.09, 0);
    b.ball(0.08, C.choco, 0, 0.23, 0);
    for (const dx of [-0.06, 0.06]) b.ball(0.03, C.choco, dx, 0.3, 0);
  });
  const doctor = chair(b, cx, cz - 0.85, 0, M.mint);
  b.cyl(0.24, 0.24, 0.08, C.pink, cx - 1.15, STOOL_HEIGHT - 0.04, cz, { seg: 14 });
  b.cyl(0.05, 0.14, STOOL_HEIGHT - 0.08, M.steelDark, cx - 1.15, (STOOL_HEIGHT - 0.08) / 2, cz, { seg: 10 });
  const patient = { x: cx - 1.15, z: cz, facing: Math.PI / 2, seatHeight: STOOL_HEIGHT };
  // 診療床靠後牆，牆上一張愛心海報
  const bedSeat = sickbed(b, 3.15, -1.85, C.blue);
  b.rbox(0.8, 0.7, 0.06, C.white, 3.15, 2.3, -2.97, { r: 0.03 });
  b.box(0.66, 0.56, 0.03, C.pink, 3.15, 2.3, -2.94);
  for (const dx of [-0.08, 0.08]) b.ball(0.11, C.red, 3.15 + dx, 2.36, -2.93, { sz: 0.3 });
  b.box(0.2, 0.2, 0.02, C.red, 3.15, 2.25, -2.93, { rz: Math.PI / 4 });
  return [doctor, patient, bedSeat];
}

/** 量身高的長頸鹿：柱子是脖子，頂上是頭。站上去的位置回傳給主程式；會動的橫桿另外做（見 heightBar）。 */
function giraffe(b) {
  const x = 2.1;
  b.rbox(0.56, 0.08, 0.5, C.white, x, 0.1, -2.45, { r: 0.03 });
  b.rbox(0.2, 2.1, 0.1, M.giraffe, x, 1.15, -2.82, { r: 0.04 });
  for (let i = 0; i < 6; i++) b.ball(0.05, C.choco, x + (i % 2 ? 0.04 : -0.04), 0.5 + i * 0.3, -2.77, { sz: 0.3 });
  for (let i = 0; i < 8; i++) b.box(i % 2 ? 0.08 : 0.13, 0.02, 0.02, C.dark, x + 0.14, 0.6 + i * 0.2, -2.78);
  b.rbox(0.26, 0.24, 0.36, M.giraffe, x, 2.3, -2.68, { r: 0.07 });
  b.rbox(0.2, 0.16, 0.16, C.cream2, x, 2.24, -2.46, { r: 0.06 });
  for (const dx of [-0.07, 0.07]) {
    b.box(0.03, 0.12, 0.03, C.choco, x + dx, 2.47, -2.72);
    b.ball(0.035, C.choco, x + dx, 2.54, -2.72);
    b.ball(0.028, C.dark, x + dx * 1.5, 2.34, -2.52);
  }
  return { x, z: -2.42, facing: 0, seatHeight: 0, pose: 'stand', markerY: 0.16 };
}

/** 身高尺的橫桿：有人站上去就降到他的頭頂。 */
function heightBar(group, seat) {
  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.05, 0.42), new THREE.MeshLambertMaterial({ color: C.red }));
  bar.position.set(seat.x, 2.05, -2.56);
  bar.castShadow = true;
  group.add(bar);
  return bar;
}

export function buildHospital(scene) {
  const b = new Builder();
  streetGround(b);
  walls(b, { wainscot: M.mint, slat: M.mintDark, eave: M.mint, curtain: C.white, windowZ: 0.45 });
  lamps(b);
  entrance(b);
  liftFrame(b, 1);
  const nurse = reception(b);
  const waitingSeats = waiting(b);
  const clinicSeats = clinic(b);
  const scale = giraffe(b);
  const wheels = [wheelSeat(0, { x: -1.0, z: 1.7 }), wheelSeat(1, null)];

  const place = finishPlace(scene, b, [nurse, ...waitingSeats, ...clinicSeats, scale, ...wheels], {
    doors: [{ x: -2.9, z: 3.4, to: 'street' }, { x: LIFT_X, z: -2.1, to: 'hospital2', r: 0.62 }],
    spawn: { x: -1.0, z: 4.5 },
    arrive: { hospital2: { x: LIFT_X, z: -1.2 } },   // 搭電梯下來的人站在電梯前面
    view: VIEW,    // 小人放不上去的圓：看診桌、凳子、醫生的椅子、候診椅、門外的盆栽
    obstacles: [
      { x: 1.75, z: 0.75, r: 0.85 }, { x: 0.6, z: 0.75, r: 0.4 }, { x: 1.75, z: -0.1, r: 0.45 },
      { x: -3.35, z: -0.3, r: 0.45 }, { x: -3.35, z: 0.45, r: 0.45 }, { x: -3.35, z: 1.2, r: 0.45 },
      { x: -4.35, z: 3.65, r: 0.5 }, { x: -1.65, z: 3.5, r: 0.5 },
    ],
    // 小人能站的範圍：大廳、電梯前面、門外的人行道
    areas: [
      { minX: -2.8, maxX: 3.5, minZ: -0.9, maxZ: 2.6 },
      { minX: -0.5, maxX: 1.5, minZ: -1.9, maxZ: -0.9 },
      { minX: -4.4, maxX: 4.5, minZ: 3.5, maxZ: 4.85 },
    ],
  });
  place.lift = liftDoors(place.group);
  const scaleChair = place.chairs.find((c) => c.pose === 'stand');
  scaleChair.bar = heightBar(place.group, scaleChair);
  for (const chair of place.chairs) if (chair.mobile) chair.mesh = wheelchair(place.group);
  return place;
}

function ward(b) {
  // 病房：後牆三張病床，床邊有小櫃子，床頭牆上各一幅畫
  const seats = [sickbed(b, -3.1, -1.85, C.pink), sickbed(b, -1.45, -1.85, M.mint), sickbed(b, 3.15, -1.85, C.yellow)];
  b.rbox(0.36, 0.56, 0.42, C.white, -2.28, 0.28, -2.7, { r: 0.04 });
  b.cyl(0.05, 0.04, 0.14, C.glass, -2.28, 0.63, -2.7, { seg: 8 });           // 花瓶
  for (const [dx, hex] of [[-0.04, C.pink], [0.04, C.yellow], [0, C.red]]) b.ball(0.05, hex, -2.28 + dx, 0.76 + Math.abs(dx), -2.7);
  [[-3.1, C.yellow, C.orange], [-1.45, C.blue, C.white], [3.15, C.mint, C.pink]].forEach(([x, back, dot]) => {
    b.rbox(0.6, 0.5, 0.06, C.white, x, 2.25, -2.97, { r: 0.03 });
    b.box(0.46, 0.36, 0.03, back, x, 2.25, -2.94);
    b.ball(0.1, dot, x, 2.25, -2.93, { sz: 0.3 });
  });
  // 點滴架
  b.cyl(0.16, 0.18, 0.04, M.steelDark, 3.78, 0.08, -2.5, { seg: 10 });
  b.cyl(0.02, 0.02, 1.8, M.steelDark, 3.78, 0.98, -2.5, { seg: 6 });
  b.box(0.3, 0.02, 0.02, M.steelDark, 3.78, 1.86, -2.5);
  b.rbox(0.14, 0.22, 0.06, C.glass, 3.68, 1.7, -2.5, { r: 0.03 });
  // 魚缸
  b.rbox(0.7, 0.8, 0.46, C.white, 2.1, 0.4, -2.72, { r: 0.04 });
  b.box(0.6, 0.4, 0.38, C.glass, 2.1, 1.02, -2.72);
  b.box(0.6, 0.04, 0.38, C.yellow, 2.1, 0.84, -2.72);
  b.box(0.64, 0.04, 0.42, M.steelDark, 2.1, 1.24, -2.72);
  for (const [dx, y, hex] of [[-0.14, 1.06, C.orange], [0.1, 0.98, C.red], [0.16, 1.12, C.orange]]) b.ball(0.05, hex, 2.1 + dx, y, -2.6, { sx: 1.4 });
  b.box(0.02, 0.16, 0.02, C.green, 1.9, 0.94, -2.72);
  return seats;
}

function lounge(b) {
  // 左牆邊的訪客沙發，坐兩個人
  b.rbox(0.8, 0.34, 1.9, M.mint, -3.5, 0.26, 0.6, { r: 0.08 });
  b.rbox(0.26, 0.6, 1.9, M.mintDark, -3.8, 0.62, 0.6, { r: 0.08 });
  for (const z of [-0.42, 1.62]) b.rbox(0.8, 0.28, 0.2, M.mintDark, -3.5, 0.52, z, { r: 0.07 });
  for (const z of [0.15, 1.05]) b.rbox(0.56, 0.1, 0.8, C.cream, -3.42, 0.45, z, { r: 0.04 });
  const sofa = [0.15, 1.05].map((z) => ({ x: -3.4, z, facing: Math.PI / 2, seatHeight: SEAT_HEIGHT + 0.02 }));
  // 玩具墊：積木和小熊
  b.cyl(0.95, 0.95, 0.03, C.yellow, -0.7, 0.075, 1.5, { seg: 26 });
  b.cyl(0.75, 0.75, 0.032, C.cream, -0.7, 0.076, 1.5, { seg: 26 });
  [[C.red, -0.2, 0.1], [C.blue, 0.15, 0.2], [C.green, 0, -0.15]].forEach(([hex, dx, dz], i) => b.rbox(0.22, 0.22, 0.22, hex, -0.7 + dx, 0.2, 1.5 + dz, { r: 0.03, ry: i * 0.5 }));
  b.rbox(0.22, 0.22, 0.22, C.pink, -0.72, 0.42, 1.56, { r: 0.03, ry: 0.3 });
  b.at(-1.15, 0.09, 1.75, 0.5, () => {
    b.ball(0.15, C.choco, 0, 0.14, 0);
    b.ball(0.12, C.choco, 0, 0.36, 0);
    for (const dx of [-0.09, 0.09]) b.ball(0.045, C.choco, dx, 0.47, 0);
    b.ball(0.045, C.cream2, 0, 0.34, 0.1);
  });
  return sofa;
}

/** 輪椅的模型。輪椅會被推著走，所以是獨立的網格，位置由主程式照座位的 x、z、facing 擺。 */
function wheelchair(group) {
  const chair = new THREE.Group();
  const part = (geometry, color, x, y, z) => {
    const mesh = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({ color }));
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    chair.add(mesh);
  };
  const wheel = (radius, width, seg) => new THREE.CylinderGeometry(radius, radius, width, seg).rotateZ(Math.PI / 2);
  part(new THREE.BoxGeometry(0.52, 0.08, 0.5), C.blue, 0, SEAT_HEIGHT - 0.04, 0);
  part(new THREE.BoxGeometry(0.52, 0.5, 0.07), C.blue, 0, SEAT_HEIGHT + 0.32, -0.24);
  for (const sx of [-1, 1]) {
    part(wheel(0.3, 0.05, 16), C.dark, sx * 0.31, 0.32, -0.08);
    part(wheel(0.2, 0.06, 12), M.steel, sx * 0.31, 0.32, -0.08);
    part(wheel(0.09, 0.05, 10), C.dark, sx * 0.24, 0.11, 0.3);
    part(new THREE.BoxGeometry(0.04, 0.3, 0.04), M.steelDark, sx * 0.24, 0.27, 0.26);
    part(new THREE.BoxGeometry(0.04, 0.04, 0.5), M.steelDark, sx * 0.27, SEAT_HEIGHT + 0.2, -0.02);     // 扶手
    part(new THREE.BoxGeometry(0.04, 0.04, 0.2), M.steelDark, sx * 0.24, SEAT_HEIGHT + 0.56, -0.34);    // 推把
  }
  part(new THREE.BoxGeometry(0.44, 0.03, 0.14), M.steelDark, 0, 0.1, 0.36);                              // 腳踏板
  group.add(chair);
  return chair;
}

export function buildHospital2(scene) {
  const b = new Builder();
  upstairsGround(b);
  walls(b, { wainscot: M.mint, slat: M.mintDark, eave: M.mint, curtain: C.yellow, windowZ: 0.6 });
  lamps(b);
  liftFrame(b, 2);
  const beds = ward(b);
  const sofa = lounge(b);
  const wheels = [wheelSeat(1, { x: 1.9, z: 1.2 }), wheelSeat(0, null)];

  const place = finishPlace(scene, b, [...beds, ...sofa, ...wheels], {
    doors: [{ x: LIFT_X, z: -2.1, to: 'hospital', r: 0.62 }],
    spawn: { x: LIFT_X, z: -1.2 },
    view: { center: [0, 1.2, 0.8], height: 13.6, width: 16 },    // 小人放不上去的圓：玩具墊、沙發（輪椅會動，主程式另外算）
    obstacles: [{ x: -0.7, z: 1.5, r: 0.85 }, { x: -3.4, z: 0.15, r: 0.5 }, { x: -3.4, z: 1.05, r: 0.5 }],
    // 小人能站的範圍：病房、電梯前面、陽台
    areas: [
      { minX: -2.7, maxX: 3.5, minZ: -0.7, maxZ: 2.6 },
      { minX: -0.5, maxX: 1.5, minZ: -1.9, maxZ: -0.7 },
      { minX: -3.8, maxX: 3.8, minZ: 3.5, maxZ: 3.95 },
    ],
  });
  place.lift = liftDoors(place.group);
  for (const chair of place.chairs) if (chair.mobile) chair.mesh = wheelchair(place.group);
  return place;
}

/** 輪椅的座位。醫院有兩台輪椅（wheel 0 一開始在一樓、wheel 1 在二樓），可以連人一起拖著走、搭電梯換樓層。
 *  每一層替每一台都留一個座位：輪椅在別層時這個座位是 away（看不到、坐不了），停在哪裡由主程式記。 */
function wheelSeat(wheel, spot) {
  return { x: 0, z: 0, ...spot, facing: 0, seatHeight: SEAT_HEIGHT, mobile: true, wheel, away: !spot };
}
