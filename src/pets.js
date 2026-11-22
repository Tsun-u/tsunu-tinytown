// 寵物店：街上玩具攤和幼稚園中間那一間，店裡有一隻店狗（固定角色，見 staff.js）。
// 場景設定：早上剛開門的寵物店。奶油色的牆配湖水綠的腰板和橘白屋簷，小動物和用品用暖色。
// 可以玩的：泡泡澡盆（坐進去拍水）、美容桌（一個躺上去、一個站旁邊刷毛）、兩張寵物睡墊。
// 座標和剖開方式跟點心店一樣（見 shop.js）。
import { Builder } from './builder.js';
import { C, VIEW, ground, walls, lamps, pot, finishPlace } from './shop.js';
import { splashDrops, steamPuffs } from './home.js';

const P = { teal: '#8fd0c8', tealDark: '#6fb8b0', tub: '#f7a8c4', water: '#bfe8f7', cushionA: '#f6a35a', cushionB: '#7db4ec', cat: '#f2b36b', rabbit: '#ffffff', steel: '#c5ced8' };
const TUB_HEIGHT = 0.2, TABLE_HEIGHT = 0.72, BED_HEIGHT = 0.16;
const TUB = { x: 2.2, z: 1.0 }, TABLE = { x: 0.3, z: -1.3 };

function entrance(b) {
  for (const x of [-3.72, -2.08]) b.rbox(0.2, 2.6, 0.2, C.white, x, 1.3, 3.05, { r: 0.04 });
  b.rbox(1.9, 0.22, 0.26, C.white, -2.9, 2.62, 3.05, { r: 0.04 });
  for (let i = 0; i < 5; i++) b.rbox(0.42, 0.08, 0.85, i % 2 ? C.cream : C.orange, -3.74 + i * 0.42, 2.72, 3.42, { rx: 0.42, r: 0.03 });
  b.rbox(0.08, 2.2, 0.82, P.teal, -3.9, 1.15, 2.52, { r: 0.03 });
  b.box(0.03, 0.6, 0.5, C.glass, -3.85, 1.65, 2.52);
  b.ball(0.05, C.yellow, -3.83, 1.1, 2.24);
  b.rbox(1.2, 0.04, 0.6, C.orange, -2.9, 0.07, 3.55, { r: 0.02 });
  pot(b, -4.35, 3.65, C.orange);
  // 矮牆上的一排腳印和骨頭
  for (const x of [-0.6, 1.0, 2.6]) {
    b.ball(0.11, P.teal, x, 0.44, 3.05, { sy: 0.5 });
    for (const dx of [-0.13, 0, 0.13]) b.ball(0.05, P.teal, x + dx, 0.5, 3.05 - Math.abs(dx) * 0.4 + 0.12, { sy: 0.5 });
  }
}

/** 坐著的貓：圓身體、尖耳朵、捲在旁邊的尾巴。 */
function cat(b, x, y, z, ry, hex) {
  b.at(x, y, z, ry, () => {
    b.ball(0.15, hex, 0, 0.13, 0, { sy: 0.95 });
    b.ball(0.12, hex, 0, 0.33, 0.04);
    for (const dx of [-0.07, 0.07]) b.cyl(0.001, 0.045, 0.09, hex, dx, 0.46, 0.03, { seg: 6 });
    for (const dx of [-0.045, 0.045]) b.ball(0.018, C.dark, dx, 0.35, 0.15);
    b.ball(0.016, C.pink, 0, 0.31, 0.16);
    b.ball(0.05, hex, 0.14, 0.05, 0.08, { sx: 1.6 });
  });
}

function rabbit(b, x, y, z, ry, hex) {
  b.at(x, y, z, ry, () => {
    b.ball(0.13, hex, 0, 0.11, 0, { sz: 1.25 });
    b.ball(0.09, hex, 0, 0.24, 0.12);
    for (const dx of [-0.04, 0.04]) b.ball(0.035, hex, dx, 0.39, 0.1, { sy: 2.4 });
    for (const dx of [-0.035, 0.035]) b.ball(0.015, C.dark, dx, 0.26, 0.2);
    b.ball(0.045, C.cream2, 0, 0.12, -0.16);
  });
}

function backWall(b) {
  // 後牆的架子：飼料袋、罐頭、玩具
  for (const y of [1.55, 2.25]) {
    b.rbox(4.2, 0.07, 0.4, C.wood, -0.3, y, -2.8, { r: 0.02 });
    for (const x of [-2.3, -0.3, 1.7]) b.box(0.06, 0.22, 0.3, C.woodDark, x, y - 0.13, -2.82);
  }
  [C.orange, C.blue, C.pink, C.green, C.yellow].forEach((hex, i) => {   // 飼料袋：上面一個腳印
    b.rbox(0.36, 0.46, 0.2, hex, -2.1 + i * 0.5, 1.82, -2.8, { r: 0.04 });
    b.ball(0.06, C.white, -2.1 + i * 0.5, 1.84, -2.69, { sz: 0.3 });
  });
  for (let i = 0; i < 6; i++) b.cyl(0.09, 0.09, 0.16, [C.red, C.cream2, C.blue][i % 3], 0.7 + i * 0.22, 1.67, -2.78, { seg: 10 });
  [C.red, C.yellow, C.blue, C.green].forEach((hex, i) => b.ball(0.11, hex, -2.0 + i * 0.36, 2.4, -2.8));   // 球
  for (let i = 0; i < 3; i++) {   // 骨頭玩具
    b.box(0.26, 0.07, 0.07, C.cream2, 0.2 + i * 0.5, 2.36, -2.8);
    for (const dx of [-0.14, 0.14]) for (const dy of [-0.035, 0.035]) b.ball(0.05, C.cream2, 0.2 + i * 0.5 + dx, 2.36 + dy, -2.8);
  }
  // 櫃台：收銀機、一罐零食
  b.rbox(1.9, 0.9, 0.7, P.teal, -2.6, 0.45, -2.3, { r: 0.05 });
  b.rbox(2.0, 0.08, 0.8, C.cream, -2.6, 0.94, -2.3, { r: 0.03 });
  b.rbox(0.36, 0.26, 0.3, C.dark, -3.1, 1.11, -2.3, { r: 0.04 });
  b.box(0.3, 0.16, 0.03, '#bfe8d8', -3.1, 1.2, -2.13, { rx: -0.3 });
  b.cyl(0.13, 0.13, 0.26, C.glass, -2.2, 1.11, -2.3, { seg: 12 });
  b.cyl(0.14, 0.14, 0.04, C.red, -2.2, 1.26, -2.3, { seg: 12 });
  // 魚缸：右後方的櫃子上
  b.rbox(1.3, 0.9, 0.6, C.wood, 2.9, 0.45, -2.6, { r: 0.04 });
  b.rbox(1.1, 0.6, 0.46, P.water, 2.9, 1.22, -2.6, { r: 0.04 });
  b.box(1.14, 0.05, 0.5, C.dark, 2.9, 1.54, -2.6);
  b.box(1.0, 0.06, 0.4, '#e8d3a0', 2.9, 0.96, -2.6);
  [[C.orange, 2.6, 1.25], [C.red, 3.1, 1.36], [C.yellow, 2.95, 1.12]].forEach(([hex, x, y]) => {
    b.ball(0.07, hex, x, y, -2.38, { sx: 1.4, sz: 0.5 });
    b.cyl(0.001, 0.05, 0.08, hex, x - 0.11, y, -2.38, { seg: 4, rz: Math.PI / 2 });
  });
  for (const x of [2.5, 3.25]) b.cyl(0.02, 0.03, 0.22, C.green, x, 1.08, -2.62, { seg: 5 });
}

function petCorner(b) {
  // 右後方的貓跳台：三層平台，最上面坐一隻貓
  b.cyl(0.07, 0.07, 1.7, '#e8d3a0', 3.4, 0.85, -1.2, { seg: 8 });
  for (const [y, w] of [[0.55, 0.7], [1.15, 0.6], [1.72, 0.5]]) b.rbox(w, 0.08, w, C.coral, 3.4, y, -1.2, { r: 0.03 });
  b.rbox(0.8, 0.1, 0.8, C.coralDark, 3.4, 0.05, -1.2, { r: 0.03 });
  cat(b, 3.4, 1.76, -1.2, -0.5, P.cat);
  b.ball(0.06, C.pink, 3.15, 1.0, -1.0);
  b.box(0.01, 0.12, 0.01, C.dark, 3.15, 1.09, -1.0);
  // 左牆邊的兔子圍欄：兩隻兔子和一根胡蘿蔔
  b.rbox(1.0, 0.06, 1.3, '#e8d3a0', -3.35, 0.05, 0.1, { r: 0.02 });
  for (let i = 0; i < 7; i++) b.box(0.04, 0.4, 0.04, C.white, -2.85, 0.24, -0.5 + i * 0.2);
  for (let i = 0; i < 5; i++) for (const z of [-0.55, 0.75]) b.box(0.04, 0.4, 0.04, C.white, -3.75 + i * 0.22, 0.24, z);
  b.box(0.04, 0.04, 1.3, C.white, -2.85, 0.44, 0.1);
  for (const z of [-0.55, 0.75]) b.box(0.94, 0.04, 0.04, C.white, -3.32, 0.44, z);
  rabbit(b, -3.45, 0.08, -0.15, 0.9, P.rabbit);
  rabbit(b, -3.25, 0.08, 0.4, 2.2, '#d9c2a3');
  b.cyl(0.001, 0.04, 0.2, C.orange, -3.1, 0.12, -0.05, { seg: 6, rz: Math.PI / 2 });
}

/** 泡泡澡盆：坐進去拍水，盆邊一堆泡泡和一隻小鴨。 */
function tub(b) {
  b.at(TUB.x, 0, TUB.z, 0, () => {
    b.cyl(0.72, 0.6, 0.42, P.tub, 0, 0.21, 0, { seg: 20 });
    b.cyl(0.62, 0.62, 0.04, P.water, 0, 0.4, 0, { seg: 20 });
    b.cyl(0.76, 0.76, 0.06, C.white, 0, 0.43, 0, { seg: 20 });
    b.cyl(0.64, 0.64, 0.07, P.water, 0, 0.43, 0, { seg: 20 });
    [[-0.45, 0.2, 0.11], [-0.3, 0.42, 0.08], [0.42, -0.3, 0.1], [0.5, -0.08, 0.07], [-0.5, -0.1, 0.07]].forEach(([dx, dz, r]) => b.ball(r, C.white, dx, 0.5, dz));
    b.ball(0.08, C.yellow, 0.3, 0.52, 0.38);
    b.ball(0.055, C.yellow, 0.36, 0.6, 0.4);
    b.cyl(0.04, 0.04, 0.5, P.steel, -0.2, 0.7, -0.66, { seg: 8 });       // 水龍頭
    b.cyl(0.04, 0.04, 0.3, P.steel, -0.2, 0.93, -0.53, { seg: 8, rx: Math.PI / 2 });
  });
  return { x: TUB.x, z: TUB.z, facing: Math.PI / 4, seatHeight: TUB_HEIGHT, pose: 'splash', markerY: 0.5 };
}

/** 美容桌：桌上躺一個，旁邊站一個幫他刷毛。 */
function groomingTable(b) {
  b.at(TABLE.x, 0, TABLE.z, 0, () => {
    b.rbox(1.3, 0.08, 0.8, P.steel, 0, TABLE_HEIGHT - 0.04, 0, { r: 0.03 });
    b.rbox(1.2, 0.03, 0.7, P.teal, 0, TABLE_HEIGHT, 0, { r: 0.01 });
    for (const dx of [-0.55, 0.55]) for (const dz of [-0.3, 0.3]) b.box(0.06, TABLE_HEIGHT - 0.08, 0.06, C.dark, dx, (TABLE_HEIGHT - 0.08) / 2, dz);
    b.box(0.05, 0.9, 0.05, C.dark, -0.6, TABLE_HEIGHT + 0.45, -0.34);          // 吊桿和吹風機
    b.box(0.5, 0.05, 0.05, C.dark, -0.37, TABLE_HEIGHT + 0.9, -0.34);
    b.rbox(0.16, 0.14, 0.26, C.pink, -0.14, TABLE_HEIGHT + 0.8, -0.34, { r: 0.04 });
    b.rbox(0.2, 0.06, 0.1, C.yellow, 0.45, TABLE_HEIGHT + 0.05, 0.25, { r: 0.02 });   // 梳子
    b.cyl(0.06, 0.06, 0.18, C.lilac, 0.45, TABLE_HEIGHT + 0.11, -0.2, { seg: 8 });    // 洗毛精
  });
  return [
    { x: TABLE.x, z: TABLE.z, facing: Math.PI / 4, seatHeight: TABLE_HEIGHT, pose: 'sleep' },
    { x: TABLE.x - 1.0, z: TABLE.z + 0.1, facing: Math.PI / 2, seatHeight: 0, pose: 'brush' },   // 站在桌子的左邊，才不會擋住桌上的
  ];
}

/** 寵物睡墊：圓圓的墊子，可以躺。 */
function beds(b) {
  const spots = [{ x: -1.9, z: 1.2, hex: P.cushionA }, { x: -0.7, z: 2.0, hex: P.cushionB }];
  for (const { x, z, hex } of spots) {
    b.cyl(0.6, 0.62, 0.14, hex, x, 0.1, z, { seg: 18 });
    b.cyl(0.46, 0.46, 0.05, C.cream, x, 0.16, z, { seg: 18 });
    b.ball(0.09, C.cream2, x + 0.42, 0.2, z + 0.2);
  }
  // 地上的碗和玩具
  b.cyl(0.16, 0.12, 0.08, C.red, 0.9, 0.08, 2.3, { seg: 12 });
  b.cyl(0.12, 0.12, 0.03, '#a86b3c', 0.9, 0.12, 2.3, { seg: 12 });
  b.cyl(0.16, 0.12, 0.08, C.blue, 1.3, 0.08, 2.45, { seg: 12 });
  b.cyl(0.12, 0.12, 0.03, P.water, 1.3, 0.12, 2.45, { seg: 12 });
  b.ball(0.12, C.yellow, -2.9, 0.15, 2.2);
  return spots.map(({ x, z }) => ({ x, z, facing: Math.PI / 4, seatHeight: BED_HEIGHT, pose: 'sleep' }));
}

export function buildPets(scene) {
  const b = new Builder();
  ground(b);
  walls(b, { wainscot: P.teal, slat: P.tealDark, eave: C.orange, curtain: C.yellow, windowZ: 1.6 });
  lamps(b);
  entrance(b);
  backWall(b);
  petCorner(b);
  const tubSeat = tub(b);
  const tableSeats = groomingTable(b);
  const bedSeats = beds(b);

  const place = finishPlace(scene, b, [tubSeat, ...tableSeats, ...bedSeats], {
    doors: [{ x: -2.9, z: 3.4, to: 'street' }],
    spawn: { x: -1.0, z: 4.5 },
    view: VIEW,
    // 小人放不上去的圓：澡盆、美容桌、睡墊、貓跳台、兔子圍欄、碗、門外的盆栽
    obstacles: [
      { x: TUB.x, z: TUB.z, r: 1.0 }, { x: TABLE.x, z: TABLE.z, r: 0.8 },
      { x: -1.9, z: 1.2, r: 0.7 }, { x: -0.7, z: 2.0, r: 0.7 }, { x: 3.4, z: -1.2, r: 0.6 },
      { x: -3.35, z: 0.1, r: 0.85 }, { x: 1.1, z: 2.4, r: 0.4 }, { x: -4.35, z: 3.65, r: 0.5 },
    ],
    // 小人能站的範圍：店內（櫃台和架子前面）和門外的人行道
    areas: [
      { minX: -2.6, maxX: 3.5, minZ: -1.5, maxZ: 2.6 },
      { minX: -4.4, maxX: 4.5, minZ: 3.5, maxZ: 4.85 },
    ],
  });
  // 水花和泡泡會動，不合進店面的網格
  const tubChair = place.chairs.find((c) => c.pose === 'splash');
  tubChair.splash = splashDrops(place.group, TUB.x, TUB.z);
  tubChair.splash.position.y = 0.55;
  place.chairs.find((c) => c.pose === 'brush').steam = steamPuffs(place.group, TABLE.x, TABLE_HEIGHT + 0.35, TABLE.z);
  return place;
}
