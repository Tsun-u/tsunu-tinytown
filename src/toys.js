// 玩具店：她線稿裡放著積木和玩具的那一間。後牆一整面玩具架，店裡有搖搖馬、球池和積木桌可以玩。
// 場景設定：下午的玩具店。奶油色的牆配薰衣草紫的腰板和黃白屋簷，玩具用彩虹色。
// 座標和剖開方式跟點心店一樣（見 shop.js）。
import * as THREE from 'three';
import { Builder } from './builder.js';
import { C, RAINBOW, VIEW, ground, walls, lamps, pot, finishPlace } from './shop.js';

const T = { lilac: '#c4b0e6', lilacDark: '#a892d4', pit: '#7db4ec', horse: '#f5a25a', mane: '#fff6e8' };
const STOOL_HEIGHT = 0.34, HORSE_HEIGHT = 0.66, PIT_HEIGHT = 0.14;

function entrance(b) {
  for (const x of [-3.72, -2.08]) b.rbox(0.2, 2.6, 0.2, C.white, x, 1.3, 3.05, { r: 0.04 });
  b.rbox(1.9, 0.22, 0.26, C.white, -2.9, 2.62, 3.05, { r: 0.04 });
  for (let i = 0; i < 5; i++) b.rbox(0.42, 0.08, 0.85, i % 2 ? C.cream : C.yellow, -3.74 + i * 0.42, 2.72, 3.42, { rx: 0.42, r: 0.03 });
  b.rbox(0.08, 2.2, 0.82, C.red, -3.9, 1.15, 2.52, { r: 0.03 });
  b.box(0.03, 0.6, 0.5, C.glass, -3.85, 1.65, 2.52);
  b.ball(0.05, C.yellow, -3.83, 1.1, 2.24);
  b.rbox(1.2, 0.04, 0.6, C.blue, -2.9, 0.07, 3.55, { r: 0.02 });
  // 門邊的一束氣球
  [[C.red, -1.75, 2.1], [C.yellow, -1.55, 2.4], [C.blue, -1.4, 2.05], [C.green, -1.62, 1.8]].forEach(([hex, x, y]) => {
    b.box(0.012, y - 0.3, 0.012, C.dark, x, (y + 0.3) / 2 - 0.1, 3.3);
    b.ball(0.2, hex, x, y, 3.3, { sy: 1.15 });
  });
  for (const x of [-0.9, 1.1, 3.1]) {   // 矮牆上擺一排積木
    for (let i = 0; i < 4; i++) b.rbox(0.24, 0.24, 0.24, RAINBOW[(i + Math.round(x + 1)) % 6], x - 0.4 + i * 0.27, 0.48, 3.05, { r: 0.03 });
  }
}

function robot(b, x, y, z, hex) {
  b.rbox(0.22, 0.24, 0.16, hex, x, y + 0.2, z, { r: 0.03 });
  b.rbox(0.18, 0.15, 0.14, C.cream2, x, y + 0.41, z, { r: 0.03 });
  for (const dx of [-0.04, 0.04]) b.ball(0.022, C.dark, x + dx, y + 0.42, z + 0.07);
  b.box(0.012, 0.08, 0.012, C.dark, x, y + 0.52, z);
  b.ball(0.025, C.red, x, y + 0.57, z);
  for (const dx of [-0.06, 0.06]) b.box(0.06, 0.08, 0.08, C.dark, x + dx, y + 0.04, z);
}

function teddy(b, x, y, z, s = 1) {
  b.at(x, y, z, 0, () => {
    b.ball(0.17 * s, C.choco, 0, 0.16 * s, 0);
    b.ball(0.13 * s, C.choco, 0, 0.4 * s, 0);
    for (const dx of [-0.1, 0.1]) b.ball(0.05 * s, C.choco, dx * s, 0.52 * s, 0);
    b.ball(0.05 * s, C.cream2, 0, 0.38 * s, 0.11 * s);
  });
}

function shelves(b) {
  // 後牆的玩具架：三層，從左牆排到櫃台
  for (const y of [0.95, 1.65, 2.35]) {
    b.rbox(5.0, 0.07, 0.42, C.wood, -1.3, y, -2.78, { r: 0.02 });
    for (const x of [-3.7, -1.3, 1.1]) b.box(0.06, 0.24, 0.32, C.woodDark, x, y - 0.14, -2.8);
  }
  b.rbox(5.0, 0.9, 0.5, T.lilac, -1.3, 0.45, -2.74, { r: 0.04 });   // 最下面的櫃子
  for (let i = 0; i < 5; i++) b.ball(0.035, C.white, -3.3 + i, 0.55, -2.48);
  // 下層：積木，照她畫的疊成一堆
  RAINBOW.forEach((hex, i) => b.rbox(0.3, 0.3, 0.3, hex, -3.5 + i * 0.36, 1.14, -2.78, { r: 0.04 }));
  b.rbox(0.3, 0.3, 0.3, C.pink, -3.32, 1.44, -2.78, { r: 0.04, ry: 0.3 });
  b.rbox(0.3, 0.3, 0.3, C.mint, -2.6, 1.44, -2.78, { r: 0.04, ry: -0.2 });
  b.ball(0.2, C.red, -1.0, 1.19, -2.78);
  b.ball(0.16, C.yellow, -0.6, 1.15, -2.78);
  b.ball(0.2, C.blue, -0.15, 1.19, -2.78);
  teddy(b, 0.55, 0.99, -2.8);
  // 中層：機器人和小車
  [C.blue, C.red, C.green].forEach((hex, i) => robot(b, -3.5 + i * 0.45, 1.69, -2.78, hex));
  [C.yellow, C.pink, C.mint].forEach((hex, i) => {
    const x = -1.8 + i * 0.6;
    b.rbox(0.42, 0.14, 0.22, hex, x, 1.8, -2.78, { r: 0.04 });
    b.rbox(0.22, 0.12, 0.2, hex, x - 0.04, 1.92, -2.78, { r: 0.04 });
    for (const dx of [-0.13, 0.13]) b.cyl(0.055, 0.055, 0.24, C.dark, x + dx, 1.74, -2.78, { seg: 8, rx: Math.PI / 2 });
  });
  teddy(b, 0.3, 1.69, -2.8, 0.8);
  // 上層：火箭、彩色的盒子、皮球
  for (const [x, hex] of [[-3.5, C.red], [-2.9, C.blue]]) {
    b.cyl(0.1, 0.1, 0.34, C.white, x, 2.6, -2.78, { seg: 10 });
    b.cyl(0.0, 0.1, 0.16, hex, x, 2.85, -2.78, { seg: 10 });
    b.box(0.3, 0.1, 0.03, hex, x, 2.46, -2.78);
  }
  RAINBOW.slice(2).forEach((hex, i) => b.rbox(0.34, 0.24 + (i % 2) * 0.1, 0.26, hex, -2.2 + i * 0.44, 2.51 + (i % 2) * 0.05, -2.78, { r: 0.03 }));
  b.ball(0.18, C.orange, 0.0, 2.57, -2.78);
  b.ball(0.14, C.lilac, 0.4, 2.53, -2.78);
  // 右後方的櫃台和收銀機
  b.rbox(1.5, 0.9, 0.7, C.yellow, 2.95, 0.45, -2.5, { r: 0.05 });
  b.rbox(1.6, 0.08, 0.8, C.cream, 2.95, 0.94, -2.5, { r: 0.03 });
  b.rbox(0.46, 0.26, 0.4, C.dark, 3.2, 1.11, -2.5, { r: 0.04 });
  b.rbox(0.4, 0.28, 0.05, C.glass, 3.2, 1.38, -2.64, { rx: -0.35, r: 0.02 });
  teddy(b, 2.55, 0.98, -2.5, 0.9);
  // 櫃台上方的招牌畫：一個大星星
  b.rbox(1.2, 0.9, 0.06, C.white, 2.95, 2.35, -2.97, { r: 0.04 });
  b.box(1.04, 0.74, 0.03, C.blue, 2.95, 2.35, -2.94);
  b.ball(0.24, C.yellow, 2.95, 2.35, -2.93, { sz: 0.25 });
  // 左牆角的大熊
  teddy(b, -3.3, 0, -1.7, 2.6);
}

function ballPit(b) {
  // 球池：一圈矮牆，裡面鋪滿球
  const cx = -2.3, cz = 1.2;
  b.cyl(1.2, 1.2, 0.4, T.pit, cx, 0.2, cz, { seg: 28 });
  b.cyl(1.05, 1.05, 0.41, C.cream, cx, 0.2, cz, { seg: 28 });
  for (let i = 0; i < 46; i++) {
    const angle = i * 2.4, radius = 0.16 + (i % 9) * 0.105;
    b.ball(0.13, RAINBOW[i % 6], cx + Math.cos(angle) * radius, 0.4 + (i % 3) * 0.03, cz + Math.sin(angle) * radius, { seg: 7 });
  }
  return [
    { x: cx - 0.4, z: cz + 0.1, facing: Math.PI / 4, seatHeight: PIT_HEIGHT },
    { x: cx + 0.4, z: cz - 0.2, facing: Math.PI / 4, seatHeight: PIT_HEIGHT },
  ];
}

function playTable(b) {
  // 積木桌和四張小凳子
  const cx = 2.2, cz = 1.5;
  b.cyl(1.4, 1.4, 0.03, C.yellow, cx, 0.075, cz, { seg: 30 });
  b.cyl(1.15, 1.15, 0.032, C.cream, cx, 0.076, cz, { seg: 30 });
  b.cyl(0.7, 0.7, 0.07, C.mint, cx, 0.52, cz, { seg: 24 });
  b.cyl(0.09, 0.12, 0.5, C.wood, cx, 0.25, cz, { seg: 10 });
  [[C.red, -0.2, 0.1], [C.blue, 0.05, 0.15], [C.yellow, -0.08, -0.15], [C.green, 0.25, -0.1]].forEach(([hex, dx, dz], i) => b.rbox(0.2, 0.2, 0.2, hex, cx + dx, 0.66, cz + dz, { r: 0.03, ry: i * 0.4 }));
  b.rbox(0.2, 0.2, 0.2, C.pink, cx - 0.14, 0.86, cz + 0.12, { r: 0.03, ry: 0.5 });
  b.rbox(0.2, 0.2, 0.2, C.orange, cx - 0.1, 1.06, cz + 0.1, { r: 0.03, ry: 0.2 });
  const stools = [[-1.0, 0, Math.PI / 2, C.pink], [0, -1.0, 0, C.blue], [1.0, 0, -Math.PI / 2, C.yellow], [0, 1.0, Math.PI, C.lilac]];
  return stools.map(([dx, dz, facing, hex]) => {
    b.cyl(0.24, 0.24, 0.08, hex, cx + dx, STOOL_HEIGHT - 0.04, cz + dz, { seg: 14 });
    b.cyl(0.07, 0.16, STOOL_HEIGHT - 0.08, C.wood, cx + dx, (STOOL_HEIGHT - 0.08) / 2, cz + dz, { seg: 10 });
    return { x: cx + dx, z: cz + dz, facing, seatHeight: STOOL_HEIGHT };
  });
}

function floorToys(b) {
  // 地上的小火車和軌道
  b.at(-0.2, 0.06, 2.3, 0, () => {
    b.cyl(0.62, 0.62, 0.03, C.woodDark, 0, 0.02, 0, { seg: 24 });
    b.cyl(0.5, 0.5, 0.032, C.plankA, 0, 0.021, 0, { seg: 24 });
    b.rbox(0.3, 0.18, 0.18, C.red, 0.55, 0.14, 0, { r: 0.04, ry: Math.PI / 2 });
    b.cyl(0.04, 0.05, 0.12, C.dark, 0.55, 0.28, 0.06, { seg: 8 });
    b.rbox(0.26, 0.14, 0.18, C.blue, 0.42, 0.12, -0.36, { r: 0.03, ry: 0.9 });
    b.rbox(0.26, 0.14, 0.18, C.yellow, 0.14, 0.12, -0.54, { r: 0.03, ry: 1.4 });
  });
  pot(b, -4.35, 3.65, C.lilac);
  pot(b, 3.6, -0.9, C.pink, true);
}

/** 搖搖馬：獨立的網格，有人騎的時候會前後搖。馬頭朝 +z。 */
export function rockingHorse(group, x, z, hex) {
  const horse = new THREE.Group();
  horse.position.set(x, 0, z);
  const part = (geometry, color, px, py, pz, rx = 0) => {
    const mesh = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({ color }));
    mesh.position.set(px, py, pz);
    mesh.rotation.x = rx;
    mesh.castShadow = true;
    horse.add(mesh);
  };
  part(new THREE.BoxGeometry(0.3, 0.3, 0.8), hex, 0, 0.5, 0);
  part(new THREE.BoxGeometry(0.22, 0.42, 0.24), hex, 0, 0.8, 0.38, 0.35);
  part(new THREE.BoxGeometry(0.2, 0.2, 0.3), hex, 0, 0.98, 0.56, 0.2);
  part(new THREE.BoxGeometry(0.08, 0.34, 0.1), T.mane, 0, 0.92, 0.26, 0.35);
  part(new THREE.BoxGeometry(0.08, 0.3, 0.08), T.mane, 0, 0.55, -0.44, -0.5);
  for (const sx of [-1, 1]) {
    part(new THREE.SphereGeometry(0.03, 6, 5), C.dark, sx * 0.11, 1.02, 0.6);
    for (const sz of [-1, 1]) part(new THREE.BoxGeometry(0.08, 0.36, 0.08), hex, sx * 0.11, 0.2, sz * 0.28);
    part(new THREE.BoxGeometry(0.07, 0.07, 1.25), C.red, sx * 0.13, 0.04, 0);   // 搖板
    for (const sz of [-1, 1]) part(new THREE.BoxGeometry(0.07, 0.07, 0.22), C.red, sx * 0.13, 0.09, sz * 0.66, -sz * 0.5);
  }
  group.add(horse);
  return horse;
}

export function buildToys(scene) {
  const b = new Builder();
  ground(b);
  walls(b, { wainscot: T.lilac, slat: T.lilacDark, eave: C.yellow, curtain: C.blue });
  lamps(b);
  entrance(b);
  shelves(b);
  const pitSeats = ballPit(b);
  const stools = playTable(b);
  floorToys(b);
  const horseSpots = [{ x: 0.2, z: -0.4, hex: T.horse }, { x: 1.1, z: -0.9, hex: C.pink }];
  const horseSeats = horseSpots.map(({ x, z }) => ({ x, z, facing: 0, seatHeight: HORSE_HEIGHT, pose: 'ride' }));

  const place = finishPlace(scene, b, [...stools, ...pitSeats, ...horseSeats], {
    doors: [{ x: -2.9, z: 3.4, to: 'street' }],
    spawn: { x: -1.0, z: 4.5 },
    view: VIEW,
    // 小人放不上去的圓：積木桌、球池、搖搖馬、小火車、大熊、盆栽
    obstacles: [
      { x: 2.2, z: 1.5, r: 1.3 }, { x: -2.3, z: 1.2, r: 1.3 },
      { x: 0.2, z: -0.4, r: 0.6 }, { x: 1.1, z: -0.9, r: 0.6 }, { x: -0.2, z: 2.3, r: 0.75 },
      { x: -4.35, z: 3.65, r: 0.5 }, { x: 3.6, z: -0.9, r: 0.6 },
    ],
    // 小人能站的範圍：店內和門外的人行道
    areas: [
      { minX: -3.4, maxX: 3.5, minZ: -1.3, maxZ: 2.6 },
      { minX: -4.4, maxX: 4.5, minZ: 3.5, maxZ: 4.85 },
    ],
  });
  // 搖搖馬要會動，所以不合進店面的網格；rocker 交給主程式在有人騎的時候搖
  place.chairs.filter((chair) => chair.pose === 'ride').forEach((chair, i) => { chair.rocker = rockingHorse(place.group, chair.x, chair.z, horseSpots[i].hex); });
  return place;
}
