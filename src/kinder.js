// 幼稚園：街尾那一棟。屋裡是教室，門外是有圍籬的小公園：溜滑梯、盪鞦韆、搖搖馬、沙坑。
// 場景設定：早上的幼稚園。奶油色的牆配嫩綠腰板和黃白屋簷，桌椅和遊樂器材用彩虹色。
// 座標和剖開方式跟點心店一樣（見 shop.js），只是門外的院子比較深（z 3.2～7.6）。
// 高的器材（溜滑梯、鞦韆架）放在院子靠外側，從右前方看才不會擋到教室。
import * as THREE from 'three';
import { Builder } from './builder.js';
import { C, RAINBOW, walls, lamps, chair, table, plate, finishPlace } from './shop.js';
import { rockingHorse } from './toys.js';

const K = { green: '#b9e3a8', greenDark: '#97cf85', board: '#4f8f6a', sand: '#f3deb0', piano: '#8a5a3c', stone: '#e3dccf' };
const MAT_HEIGHT = 0.14, SAND_HEIGHT = 0.12, SWING_SEAT = 0.5;
export const SWING = { pivotY: 2.1, rope: 1.6, z: 5.3 };
const SLIDE_X = 3.6;

function ground(b) {
  b.rbox(11.2, 0.5, 12.2, C.baseDark, 0, -0.42, 2.1, { r: 0.18 });
  b.rbox(10.9, 0.26, 11.9, C.base, 0, -0.13, 2.1, { r: 0.1 });
  for (let i = 0; i < 12; i++) b.box(7.98, 0.06, 0.49, i % 2 ? C.plankA : C.plankB, 0, 0.03, -2.75 + i * 0.5);
  b.box(10.4, 0.07, 4.6, C.leaf, 0, 0.02, 5.4);            // 院子的草地
  b.box(1.0, 0.07, 6.6, C.leaf, -4.85, 0.02, -0.3);
  b.box(1.0, 0.07, 6.6, C.leaf, 4.85, 0.02, -0.3);
  for (let i = 0; i < 8; i++) b.cyl(0.34, 0.34, 0.05, K.stone, -2.9 + (i % 2 ? 0.12 : -0.1), 0.07, 3.6 + i * 0.52, { seg: 10 });   // 門口到大門的石板
}

function fence(b) {
  // 院子前面的彩色圍籬，石板路那裡留一個缺口
  let i = 0;
  for (let x = -5.0; x <= 5.01; x += 0.36) {
    if (x > -3.5 && x < -2.25) continue;
    b.box(0.1, 0.5, 0.05, RAINBOW[i++ % 6], x, 0.3, 7.6);
  }
  for (const y of [0.22, 0.42]) {
    b.box(1.6, 0.05, 0.04, C.white, -4.3, y, 7.58);
    b.box(7.4, 0.05, 0.04, C.white, 1.4, y, 7.58);
  }
  for (const z of [3.6, 4.6, 5.6, 6.6]) b.ball(0.26, z % 2 > 1 ? C.green : C.greenDark, 4.85, 0.2, z, { sy: 0.8 });   // 右邊一排矮樹叢
}

function entrance(b) {
  [C.red, C.blue].forEach((hex, i) => b.rbox(0.2, 2.6, 0.2, hex, i ? -2.08 : -3.72, 1.3, 3.05, { r: 0.04 }));
  b.rbox(1.9, 0.22, 0.26, C.yellow, -2.9, 2.62, 3.05, { r: 0.04 });
  RAINBOW.forEach((hex, i) => b.rbox(0.3, 0.3, 0.1, hex, -3.65 + i * 0.3, 2.95, 3.05, { r: 0.05 }));   // 門上一排彩色方塊
  b.rbox(0.08, 2.2, 0.82, C.orange, -3.9, 1.15, 2.52, { r: 0.03 });
  b.box(0.03, 0.5, 0.5, C.glass, -3.85, 1.75, 2.52);
  b.ball(0.05, C.dark, -3.83, 1.1, 2.24);
  for (const x of [-0.9, 1.1, 3.1]) {   // 矮牆上的花箱
    b.rbox(1.2, 0.18, 0.28, C.white, x, 0.45, 3.05, { r: 0.04 });
    for (let i = 0; i < 5; i++) {
      b.ball(0.1, i % 2 ? C.green : C.greenDark, x - 0.44 + i * 0.22, 0.58, 3.05);
      b.ball(0.055, RAINBOW[(i + 1) % 6], x - 0.44 + i * 0.22, 0.68, 3.08);
    }
  }
}

function classroom(b) {
  // 黑板：上面畫著太陽、花和幾條彩色的線
  b.rbox(2.8, 1.4, 0.07, C.woodDark, -1.3, 2.1, -2.97, { r: 0.04 });
  b.box(2.64, 1.24, 0.03, K.board, -1.3, 2.1, -2.94);
  b.ball(0.2, C.yellow, -2.2, 2.4, -2.92, { sz: 0.25 });
  [C.red, C.white, C.blue, C.pink].forEach((hex, i) => b.rbox(0.9 - (i % 2) * 0.3, 0.06, 0.02, hex, -0.9, 2.5 - i * 0.2, -2.92, { r: 0.02 }));
  b.box(0.03, 0.3, 0.02, C.green, -2.1, 1.75, -2.92);
  b.ball(0.1, C.pink, -2.1, 1.95, -2.92, { sz: 0.25 });
  b.rbox(2.8, 0.06, 0.14, C.wood, -1.3, 1.38, -2.9, { r: 0.02 });
  // 左牆的書包櫃：兩排四格
  b.rbox(0.5, 1.3, 2.7, C.wood, -3.68, 0.65, -1.1, { r: 0.03 });
  for (let row = 0; row < 2; row++) for (let i = 0; i < 4; i++) {
    b.box(0.06, 0.52, 0.58, C.cream2, -3.46, 0.36 + row * 0.6, -2.08 + i * 0.65);
    b.rbox(0.26, 0.34, 0.36, RAINBOW[(i + row * 3) % 6], -3.42, 0.3 + row * 0.6, -2.08 + i * 0.65, { r: 0.06 });
  }
  // 右後方的鋼琴
  b.rbox(1.5, 1.15, 0.5, K.piano, 2.9, 0.58, -2.7, { r: 0.04 });
  b.box(1.4, 0.06, 0.3, K.piano, 2.9, 0.72, -2.36);
  b.box(1.3, 0.03, 0.22, C.white, 2.9, 0.765, -2.34);
  for (let i = 0; i < 8; i++) b.box(0.05, 0.035, 0.13, C.dark, 2.34 + i * 0.16, 0.775, -2.38);
  b.rbox(0.5, 0.36, 0.03, C.cream, 2.9, 1.34, -2.42, { rx: -0.2, r: 0.02 });   // 譜
  const piano = { x: 2.9, z: -1.8, facing: Math.PI, seatHeight: 0, pose: 'piano' };   // 站在琴鍵前面彈
  // 點心桌（桌上有可以吃的蛋糕）和畫畫桌
  table(b, -1.0, 0.2, C.red, C.yellow);
  table(b, 1.9, 0.6, C.blue, C.pink, 0.8);
  [C.red, C.yellow, C.blue, C.green].forEach((hex, i) => b.box(0.03, 0.03, 0.2, hex, 1.7 + i * 0.06, 0.78, 0.75, { ry: i * 0.4 }));   // 蠟筆
  b.box(0.36, 0.01, 0.28, C.white, 2.2, 0.765, 0.45, { ry: 0.3 });
  b.ball(0.07, C.orange, 2.2, 0.77, 0.45, { sy: 0.1 });
  const seats = [
    { ...chair(b, -1.95, 0.2, Math.PI / 2, C.pink), plate: plate(b, -1.42, 0.2), cake: C.pink },
    { ...chair(b, -1.0, -0.75, 0, C.yellow), plate: plate(b, -1.0, -0.22), cake: C.choco },
    chair(b, 0.8, 0.6, Math.PI / 2, C.blue), chair(b, 1.9, -0.5, 0, C.green), chair(b, 3.0, 0.6, -Math.PI / 2, C.orange), chair(b, 1.9, 1.7, Math.PI, C.lilac),
  ];
  // 左前方的午睡墊
  const mats = [[-3.1, C.blue], [-2.15, C.pink]].map(([x, hex]) => {
    b.rbox(0.8, 0.12, 1.5, hex, x, 0.12, 1.75, { r: 0.05 });
    b.rbox(0.5, 0.1, 0.32, C.cream, x, 0.22, 1.2, { r: 0.05 });
    return { x, z: 1.8, facing: 0, seatHeight: MAT_HEIGHT, pose: 'sleep' };
  });
  // 右前方的積木箱
  b.rbox(0.9, 0.4, 0.6, C.yellow, 3.3, 0.2, 2.3, { r: 0.05 });
  [[C.red, -0.25, 0], [C.blue, 0.05, 0.05], [C.green, 0.28, -0.05]].forEach(([hex, dx, dz], i) => b.rbox(0.24, 0.24, 0.24, hex, 3.3 + dx, 0.5, 2.3 + dz, { r: 0.03, ry: i * 0.5 }));
  return [piano, ...seats, ...mats];
}

/** 鋼琴上飄起來的音符：彈琴的時候才出現。跟鍋子的蒸氣用同一套動畫。 */
function notes(group, x, y, z) {
  const puffs = new THREE.Group();
  puffs.position.set(x, y, z);
  [C.red, C.blue, C.yellow].forEach((color, i) => {
    const note = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), new THREE.MeshBasicMaterial({ color, transparent: true, depthWrite: false }));
    note.userData.offset = i / 3;
    puffs.add(note);
  });
  puffs.visible = false;
  group.add(puffs);
  return puffs;
}

function playground(b) {
  // 溜滑梯：平台在後、滑道朝前，爬梯在平台後面
  b.at(SLIDE_X, 0, 0, 0, () => {
    b.rbox(0.9, 0.1, 0.7, C.blue, 0, 1.25, 4.5, { r: 0.03 });
    for (const sx of [-1, 1]) for (const z of [4.2, 4.8]) b.box(0.08, 1.25, 0.08, C.blue, sx * 0.4, 0.62, z);
    for (const sx of [-1, 1]) b.box(0.06, 0.4, 0.7, C.red, sx * 0.44, 1.5, 4.5);
    b.box(0.74, 0.06, 2.2, C.yellow, 0, 0.72, 5.82, { rx: 0.545 });
    for (const sx of [-1, 1]) b.box(0.06, 0.2, 2.2, C.red, sx * 0.4, 0.82, 5.82, { rx: 0.545 });
    for (const sx of [-1, 1]) b.box(0.06, 1.4, 0.06, C.dark, sx * 0.3, 0.66, 3.95, { rx: -0.25 });
    for (let i = 0; i < 4; i++) b.box(0.6, 0.05, 0.05, C.dark, 0, 0.25 + i * 0.3, 3.82 + i * 0.075);
  });
  const slide = { x: SLIDE_X, z: 4.5, facing: 0, seatHeight: 0, pose: 'slide', markerY: 1.34, top: [1.33, 4.75], bottom: [0.22, 6.85] };
  // 鞦韆架：兩邊的 A 字腳和上面的橫桿，鞦韆本身另外做（見 swing）
  for (const x of [-1.85, 0.65]) for (const dir of [-1, 1]) b.box(0.08, 2.25, 0.08, C.red, x, 1.05, SWING.z + dir * 0.45, { rx: dir * 0.4 });
  b.box(2.6, 0.09, 0.09, C.red, -0.6, SWING.pivotY, SWING.z);
  const swings = [-1.15, -0.05].map((x) => ({ x, z: SWING.z, facing: 0, seatHeight: SWING_SEAT, pose: 'swing', markerY: 0.6 }));
  // 沙坑：木頭框、沙堡、水桶和鏟子
  const sx = 1.9, sz = 6.55;
  b.box(1.7, 0.1, 1.5, K.sand, sx, 0.09, sz);
  for (const d of [-1, 1]) {
    b.rbox(1.9, 0.2, 0.14, C.wood, sx, 0.12, sz + d * 0.8, { r: 0.04 });
    b.rbox(0.14, 0.2, 1.74, C.wood, sx + d * 0.9, 0.12, sz, { r: 0.04 });
  }
  b.cyl(0.2, 0.24, 0.2, K.sand, sx + 0.45, 0.24, sz - 0.4, { seg: 10 });
  b.cyl(0.0, 0.14, 0.18, K.sand, sx + 0.45, 0.43, sz - 0.4, { seg: 10 });
  b.cyl(0.1, 0.08, 0.16, C.red, sx - 0.5, 0.22, sz - 0.45, { seg: 10 });
  b.box(0.04, 0.03, 0.3, C.blue, sx + 0.05, 0.16, sz + 0.5, { ry: 0.6 });
  const sand = [[-0.3, 0.15], [0.4, 0.3]].map(([dx, dz]) => ({ x: sx + dx, z: sz + dz, facing: Math.PI / 4, seatHeight: SAND_HEIGHT, markerY: 0.2 }));
  // 一棵樹在左後方角落，樹下一張長椅
  b.at(-4.4, 0, 4.0, 0, () => {
    b.cyl(0.14, 0.2, 1.9, C.woodDark, 0, 0.95, 0, { seg: 10 });
    b.ball(0.75, C.green, 0, 2.3, 0);
    b.ball(0.55, C.leaf, 0.4, 2.7, 0.2);
    b.ball(0.5, C.greenDark, -0.3, 2.75, -0.2);
  });
  return { slide, swings, sand };
}

/** 一座鞦韆：兩條繩子和坐板掛在橫桿上，主程式轉它的 rotation.x。 */
function swing(group, x) {
  const pivot = new THREE.Group();
  pivot.position.set(x, SWING.pivotY, SWING.z);
  const part = (w, h, d, color, px, py) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color }));
    mesh.position.set(px, py, 0);
    mesh.castShadow = true;
    pivot.add(mesh);
  };
  for (const dx of [-0.24, 0.24]) part(0.03, SWING.rope, 0.03, C.dark, dx, -SWING.rope / 2);
  part(0.56, 0.05, 0.26, C.blue, 0, -SWING.rope);
  group.add(pivot);
  return pivot;
}

export function buildKinder(scene) {
  const b = new Builder();
  ground(b);
  walls(b, { wainscot: K.green, slat: K.greenDark, eave: C.yellow, curtain: C.red, windowZ: -0.9 });
  lamps(b);
  entrance(b);
  fence(b);
  const indoor = classroom(b);
  const yard = playground(b);
  const horseSpots = [{ x: -4.1, z: 5.4, hex: C.orange }, { x: -4.1, z: 6.6, hex: C.pink }];
  const horses = horseSpots.map(({ x, z }) => ({ x, z, facing: 0, seatHeight: 0.66, pose: 'ride' }));

  const place = finishPlace(scene, b, [...indoor, yard.slide, ...yard.swings, ...yard.sand, ...horses], {
    doors: [{ x: -2.9, z: 3.4, to: 'street' }],
    spawn: { x: -1.6, z: 4.0 },
    view: { center: [0, 1.6, 2.2], height: 16.5, width: 17.5 },
    // 小人放不上去的圓：兩張桌子、午睡墊、積木箱、溜滑梯、鞦韆、沙坑、搖搖馬、樹
    obstacles: [
      { x: -1.0, z: 0.2, r: 0.95 }, { x: 1.9, z: 0.6, r: 1.15 }, { x: -2.6, z: 1.75, r: 0.9 }, { x: 3.3, z: 2.3, r: 0.6 },
      { x: SLIDE_X, z: 4.5, r: 0.7 }, { x: SLIDE_X, z: 5.6, r: 0.6 }, { x: SLIDE_X, z: 6.5, r: 0.6 },
      { x: -1.15, z: SWING.z, r: 0.6 }, { x: -0.05, z: SWING.z, r: 0.6 }, { x: 1.9, z: 6.55, r: 1.0 },
      { x: -4.1, z: 5.4, r: 0.6 }, { x: -4.1, z: 6.6, r: 0.6 }, { x: -4.4, z: 4.0, r: 0.5 },
    ],
    // 小人能站的範圍：教室和院子
    areas: [{ minX: -3.0, maxX: 3.5, minZ: -1.4, maxZ: 2.6 }, { minX: -4.4, maxX: 4.4, minZ: 3.5, maxZ: 7.2 }],
  });
  place.chairs.find((c) => c.pose === 'piano').steam = notes(place.group, 2.9, 1.4, -2.6);
  place.chairs.filter((c) => c.pose === 'swing').forEach((c) => { c.swing = swing(place.group, c.x); });
  place.chairs.filter((c) => c.pose === 'ride').forEach((c, i) => { c.rocker = rockingHorse(place.group, c.x, c.z, horseSpots[i].hex); });
  return place;
}
