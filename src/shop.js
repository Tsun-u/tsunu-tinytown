// 一間看得到內部的點心店和門口的街道。屋頂打開、前牆和右牆只留矮牆，鏡頭從右前方往裡看。
// 座標：x 往右、z 往前（街道）、y 往上。店內地板是 x -4～4、z -3～3，人行道在 z 3.1～5.1。
import * as THREE from 'three';
import { Builder } from './builder.js';

export const C = {
  cream: '#fff6e8', cream2: '#f7e3c8', wall: '#fdeedb', coral: '#f29a85', coralDark: '#e07f6c',
  mint: '#8fd6c4', mintDark: '#6fbfac', wood: '#dcae7c', woodDark: '#b88758', plankA: '#f8dfb8', plankB: '#f2d2a2',
  tileA: '#f6eee0', tileB: '#ebe0cd', base: '#f1dcc0', baseDark: '#d7b28c', road: '#9a96a3',
  dark: '#5a5560', white: '#ffffff', glass: '#c9ecf5',
  red: '#e86a5c', orange: '#f5a25a', yellow: '#f8d15c', green: '#7cc788', greenDark: '#5aad6c', leaf: '#9bd69a',
  blue: '#7db4ec', lilac: '#b79ce2', pink: '#f7a8c4', choco: '#9a6a4c',
};
export const RAINBOW = [C.red, C.orange, C.yellow, C.green, C.blue, C.lilac];

/** 店面的地面：底座、屋內木地板、門外的人行道和馬路。玩具店也用這一塊。 */
export function ground(b) {
  b.rbox(11.2, 0.5, 10.2, C.baseDark, 0, -0.42, 1.2, { r: 0.18 });
  b.rbox(10.9, 0.26, 9.9, C.base, 0, -0.13, 1.2, { r: 0.1 });
  for (let i = 0; i < 12; i++) b.box(7.98, 0.06, 0.49, i % 2 ? C.plankA : C.plankB, 0, 0.03, -2.75 + i * 0.5);   // 店內的木地板
  for (let ix = 0; ix < 10; ix++) for (let iz = 0; iz < 2; iz++) {                                                 // 人行道的地磚
    b.box(0.97, 0.06, 0.97, (ix + iz) % 2 ? C.tileA : C.tileB, -4.5 + ix, 0.03, 3.6 + iz);
  }
  b.rbox(10.2, 0.14, 0.26, C.cream, 0, 0.04, 5.25, { r: 0.05 });                                                   // 路緣
  b.box(10.2, 0.04, 0.7, C.road, 0, 0.01, 5.75);                                                                   // 馬路
  for (let i = 0; i < 6; i++) b.box(0.7, 0.02, 0.1, C.white, -4.2 + i * 1.7, 0.04, 5.78);
  b.box(1.0, 0.07, 6.6, C.leaf, -4.85, 0.02, -0.3);                                                                // 左邊的草地
  b.box(1.0, 0.07, 6.6, C.leaf, 4.85, 0.02, -0.3);                                                                 // 右邊的草地
}

/** walls 圍出來的屋內範圍：每一間屋子都一樣大。雨雪下在這個範圍外，晚上燈開在這個範圍裡。 */
export const ROOM = { minX: -4.12, maxX: 4.02, minZ: -3.12, maxZ: 3.05, height: 3.9 };

/** 後牆、左牆、屋簷、矮牆和左牆的窗。o：{ wainscot, slat, eave, curtain, windowZ } */
export function walls(b, o = {}) {
  const wainscot = o.wainscot || C.coral, slat = o.slat || C.coralDark, eave = o.eave || wainscot, curtain = o.curtain || C.pink, wz = o.windowZ ?? 0.6;
  // 後牆（z = -3.12）和左牆（x = -4.12）：下半是腰板，上半是奶油色
  b.box(8.25, 1.0, 0.25, wainscot, -0.12, 0.5, -3.12);
  b.box(8.25, 2.25, 0.25, C.wall, -0.12, 2.12, -3.12);
  b.rbox(8.3, 0.09, 0.34, C.cream, -0.12, 1.04, -3.1, { r: 0.03 });
  b.rbox(8.45, 0.14, 0.4, C.cream2, -0.12, 3.3, -3.12, { r: 0.04 });
  b.box(0.25, 1.0, 6.25, wainscot, -4.12, 0.5, -0.12);
  b.box(0.25, 2.25, 6.25, C.wall, -4.12, 2.12, -0.12);
  b.rbox(0.34, 0.09, 6.3, C.cream, -4.1, 1.04, -0.12, { r: 0.03 });
  b.rbox(0.4, 0.14, 6.45, C.cream2, -4.12, 3.3, -0.12, { r: 0.04 });
  for (let i = 0; i < 16; i++) b.box(0.05, 0.86, 0.03, slat, -3.75 + i * 0.5, 0.5, -2.985);   // 腰板的直條
  for (let i = 0; i < 12; i++) b.box(0.03, 0.86, 0.05, slat, -3.985, 0.5, -2.75 + i * 0.5);
  for (const [x, z] of [[-4.12, -3.12], [4.0, -3.12], [-4.12, 3.0]]) b.rbox(0.34, 3.44, 0.34, C.cream2, x, 1.72, z, { r: 0.05 });   // 轉角和牆尾的柱子

  // 牆頂的條紋屋簷，往店內斜下來
  for (let i = 0; i < 16; i++) b.rbox(0.5, 0.1, 0.95, i % 2 ? C.cream : eave, -3.87 + i * 0.5, 3.62, -3.2, { rx: 0.5, r: 0.03 });
  for (let i = 0; i < 12; i++) b.rbox(0.95, 0.1, 0.5, i % 2 ? C.cream : eave, -4.2, 3.62, -2.87 + i * 0.5, { rz: -0.5, r: 0.03 });

  // 右邊和前面只留矮牆，店內才看得到
  b.rbox(0.22, 0.3, 6.1, wainscot, 4.02, 0.15, -0.05, { r: 0.04 });
  b.rbox(5.9, 0.3, 0.22, wainscot, 1.05, 0.15, 3.05, { r: 0.04 });
  b.rbox(6.0, 0.06, 0.3, C.cream, 1.05, 0.33, 3.05, { r: 0.02 });

  // 左牆的窗：窗框、玻璃、窗簾、窗台上的小盆栽
  b.rbox(0.1, 1.5, 2.1, C.white, -3.97, 2.05, wz, { r: 0.03 });
  for (const z of [wz - 0.48, wz + 0.48]) b.box(0.1, 1.24, 0.86, C.glass, -3.95, 2.05, z);
  for (const z of [wz - 0.93, wz + 0.93]) b.rbox(0.08, 1.36, 0.3, curtain, -3.9, 2.08, z, { r: 0.03 });
  b.rbox(0.3, 0.07, 2.3, C.cream2, -3.88, 1.28, wz, { r: 0.02 });
  b.box(0.06, 0.06, 2.3, C.woodDark, -3.9, 2.86, wz);
  for (const [z, hex] of [[wz - 0.4, C.yellow], [wz + 0.4, C.blue]]) {
    b.cyl(0.09, 0.07, 0.13, hex, -3.86, 1.38, z, { seg: 10 });
    b.ball(0.11, C.green, -3.86, 1.52, z);
  }
}

function sign(b) {
  // 屋頂上的招牌：一個杯子蛋糕，旁邊幾條彩色的線
  for (const x of [-0.7, 1.9]) b.box(0.12, 0.6, 0.12, C.woodDark, x, 3.6, -3.3);
  b.rbox(3.7, 1.15, 0.2, C.coral, 0.6, 4.4, -3.3, { r: 0.12 });
  b.rbox(3.4, 0.86, 0.06, C.cream, 0.6, 4.4, -3.19, { r: 0.08 });
  b.at(-0.55, 4.25, -3.12, 0, () => {
    b.cyl(0.2, 0.14, 0.24, C.blue, 0, 0, 0, { seg: 12 });
    b.ball(0.23, C.pink, 0, 0.2, 0, { sy: 0.75 });
    b.ball(0.07, C.red, 0, 0.4, 0);
  });
  [C.red, C.yellow, C.green, C.blue].forEach((hex, i) => b.rbox(0.5, 0.13, 0.05, hex, 0.15 + i * 0.6, 4.4 + (i % 2 ? 0.13 : -0.13), -3.15, { r: 0.04 }));
  for (let i = 0; i < 7; i++) b.ball(0.07, i % 2 ? '#fff2a8' : '#ffd9a0', -0.9 + i * 0.5, 5.02, -3.3, { glow: true });
}

function entrance(b) {
  // 門框、條紋遮雨棚、往內開的門、門墊
  for (const x of [-3.72, -2.08]) b.rbox(0.2, 2.6, 0.2, C.woodDark, x, 1.3, 3.05, { r: 0.04 });
  b.rbox(1.9, 0.22, 0.26, C.woodDark, -2.9, 2.62, 3.05, { r: 0.04 });
  for (let i = 0; i < 5; i++) b.rbox(0.42, 0.08, 0.85, i % 2 ? C.cream : C.coral, -3.74 + i * 0.42, 2.72, 3.42, { rx: 0.42, r: 0.03 });
  b.rbox(0.08, 2.2, 0.82, C.mint, -3.9, 1.15, 2.52, { r: 0.03 });
  b.box(0.03, 0.7, 0.5, C.glass, -3.85, 1.6, 2.52);
  b.ball(0.05, C.yellow, -3.83, 1.1, 2.24);
  b.rbox(1.2, 0.04, 0.6, C.coral, -2.9, 0.07, 3.55, { r: 0.02 });
  b.rbox(0.9, 0.02, 0.36, C.cream, -2.9, 0.09, 3.55, { r: 0.02 });
  // 門上掛的小招牌
  b.box(0.03, 0.3, 0.03, C.dark, -2.9, 2.36, 3.05);
  b.rbox(0.7, 0.36, 0.07, C.cream, -2.9, 2.06, 3.05, { r: 0.05 });
  b.ball(0.09, C.pink, -3.05, 2.06, 3.1, { sz: 0.5 });
  b.rbox(0.26, 0.07, 0.03, C.mintDark, -2.78, 2.06, 3.09, { r: 0.02 });
  // 矮牆上的花箱
  for (const x of [-0.9, 1.1, 3.1]) {
    b.rbox(1.2, 0.18, 0.28, C.wood, x, 0.45, 3.05, { r: 0.04 });
    for (let i = 0; i < 5; i++) {
      b.ball(0.1, i % 2 ? C.green : C.greenDark, x - 0.44 + i * 0.22, 0.58, 3.05);
      b.ball(0.055, [C.pink, C.yellow, C.white, C.red, C.lilac][i], x - 0.44 + i * 0.22, 0.68, 3.08);
    }
  }
}

function counter(b) {
  // 櫃台
  b.rbox(3.2, 0.9, 0.8, C.mint, -2.2, 0.45, -1.6, { r: 0.05 });
  b.box(3.1, 0.1, 0.72, C.mintDark, -2.2, 0.05, -1.58);
  for (let i = 0; i < 11; i++) b.box(0.06, 0.66, 0.03, C.mintDark, -3.7 + i * 0.3, 0.5, -1.19);
  b.rbox(3.4, 0.1, 0.96, C.cream, -2.2, 0.96, -1.58, { r: 0.04 });
  // 收銀機
  b.rbox(0.5, 0.26, 0.42, C.dark, -3.35, 1.14, -1.6, { r: 0.04 });
  b.rbox(0.44, 0.3, 0.05, C.glass, -3.35, 1.42, -1.74, { rx: -0.35, r: 0.02 });
  for (let i = 0; i < 6; i++) b.box(0.07, 0.03, 0.07, i % 2 ? C.cream : C.yellow, -3.48 + (i % 3) * 0.13, 1.28, -1.52 + Math.floor(i / 3) * 0.11);
  // 蛋糕櫃：兩層，四根細柱
  b.at(-2.25, 1.01, -1.6, 0, () => {
    b.rbox(1.2, 0.05, 0.6, C.white, 0, 0.03, 0, { r: 0.02 });
    b.box(1.14, 0.03, 0.54, C.glass, 0, 0.3, 0);
    b.rbox(1.2, 0.05, 0.6, C.white, 0, 0.58, 0, { r: 0.02 });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box(0.03, 0.55, 0.03, C.cream2, sx * 0.57, 0.3, sz * 0.27);
    [[C.pink, C.red], [C.yellow, C.white], [C.choco, C.pink]].forEach(([cake, top], i) => {
      b.cyl(0.14, 0.14, 0.12, cake, -0.36 + i * 0.36, 0.12, 0, { seg: 12 });
      b.ball(0.045, top, -0.36 + i * 0.36, 0.2, 0);
    });
    [[C.blue, C.white], [C.lilac, C.yellow]].forEach(([cup, top], i) => {
      b.cyl(0.11, 0.08, 0.1, cup, -0.2 + i * 0.42, 0.37, 0, { seg: 10 });
      b.ball(0.1, top, -0.2 + i * 0.42, 0.44, 0, { sy: 0.7 });
    });
  });
  // 咖啡機、一疊杯子、小費罐
  b.at(-1.15, 1.01, -1.65, 0, () => {
    b.rbox(0.56, 0.6, 0.46, C.red, 0, 0.3, 0, { r: 0.06 });
    b.rbox(0.5, 0.2, 0.1, C.dark, 0, 0.32, 0.22, { r: 0.03 });
    b.cyl(0.03, 0.03, 0.12, C.dark, 0, 0.2, 0.26, { seg: 8 });
    b.box(0.4, 0.03, 0.18, C.dark, 0, 0.02, 0.3);
    b.cyl(0.07, 0.055, 0.1, C.white, 0, 0.09, 0.3, { seg: 10 });
    for (let i = 0; i < 3; i++) b.cyl(0.07, 0.055, 0.09, C.white, -0.14 + i * 0.14, 0.65, -0.05, { seg: 10 });
  });
  for (let i = 0; i < 4; i++) b.cyl(0.075, 0.06, 0.05, i % 2 ? C.cream2 : C.white, -0.72, 1.04 + i * 0.045, -1.3, { seg: 10 });
  b.cyl(0.08, 0.08, 0.16, C.glass, -2.95, 1.09, -1.3, { seg: 10 });
  b.cyl(0.085, 0.085, 0.03, C.yellow, -2.95, 1.18, -1.3, { seg: 10 });

  // 後牆的兩層架子
  for (const y of [1.7, 2.42]) {
    b.rbox(3.3, 0.07, 0.38, C.wood, -2.2, y, -2.8, { r: 0.02 });
    for (const x of [-3.6, -0.8]) b.box(0.06, 0.24, 0.3, C.woodDark, x, y - 0.14, -2.82);
  }
  RAINBOW.forEach((hex, i) => {   // 下層：罐子
    b.cyl(0.13, 0.13, 0.28, hex, -3.55 + i * 0.5, 1.88, -2.8, { seg: 12 });
    b.cyl(0.14, 0.14, 0.05, C.cream, -3.55 + i * 0.5, 2.04, -2.8, { seg: 12 });
  });
  b.cyl(0.1, 0.08, 0.14, C.coral, -0.72, 1.81, -2.8, { seg: 10 });
  b.ball(0.14, C.green, -0.72, 1.98, -2.8);
  RAINBOW.forEach((hex, i) => {   // 上層：盒子和瓶子輪流
    const x = -3.55 + i * 0.52, other = RAINBOW[(i + 3) % 6];
    if (i % 2) {
      b.cyl(0.09, 0.1, 0.3, other, x, 2.61, -2.8, { seg: 10 });
      b.cyl(0.035, 0.05, 0.14, other, x, 2.82, -2.8, { seg: 8 });
    } else {
      b.rbox(0.3, 0.26 + (i % 3) * 0.05, 0.22, other, x, 2.59 + (i % 3) * 0.025, -2.8, { r: 0.03 });
    }
  });

  // 菜單黑板
  b.rbox(1.5, 1.05, 0.07, C.woodDark, 0.45, 2.35, -2.97, { r: 0.04 });
  b.box(1.34, 0.9, 0.03, C.dark, 0.45, 2.35, -2.94);
  [C.pink, C.yellow, C.mint, C.orange].forEach((hex, i) => {
    b.ball(0.06, hex, -0.05, 2.66 - i * 0.2, -2.92, { sz: 0.4 });
    b.rbox(0.5 + (i % 2) * 0.22, 0.045, 0.02, C.cream, 0.42 + (i % 2) * 0.11, 2.66 - i * 0.2, -2.92, { r: 0.02 });
  });
}

function cornerShelf(b) {
  // 右後方的玩具櫃：她畫裡放著積木和玩具的櫃子
  b.at(2.95, 0, -2.72, 0, () => {
    b.box(1.6, 1.95, 0.06, C.woodDark, 0, 0.98, -0.22);
    for (const x of [-0.78, 0.78]) b.rbox(0.07, 1.95, 0.5, C.wood, x, 0.98, 0, { r: 0.02 });
    for (const y of [0.05, 0.68, 1.3, 1.93]) b.rbox(1.6, 0.07, 0.5, C.wood, 0, y, 0, { r: 0.02 });
    // 最下層：積木
    [[C.red, -0.5], [C.blue, -0.18], [C.yellow, 0.14], [C.green, 0.46]].forEach(([hex, x]) => b.rbox(0.28, 0.28, 0.28, hex, x, 0.23, 0.02, { r: 0.04 }));
    b.rbox(0.26, 0.26, 0.26, C.lilac, -0.34, 0.5, 0.02, { r: 0.04, ry: 0.4 });
    // 中層：小熊和球
    b.at(-0.4, 0.72, 0.02, 0, () => {
      b.ball(0.17, C.choco, 0, 0.16, 0);
      b.ball(0.13, C.choco, 0, 0.4, 0);
      for (const x of [-0.1, 0.1]) b.ball(0.05, C.choco, x, 0.52, 0);
      b.ball(0.05, C.cream2, 0, 0.38, 0.11);
    });
    b.ball(0.17, C.red, 0.1, 0.89, 0.04);
    b.cyl(0.12, 0.16, 0.2, C.blue, 0.5, 0.82, 0.02, { seg: 10 });
    b.ball(0.12, C.yellow, 0.5, 0.96, 0.02);
    // 上層：一排書
    [C.red, C.yellow, C.blue, C.green, C.lilac, C.orange, C.pink].forEach((hex, i) => b.box(0.11, 0.38 + (i % 3) * 0.05, 0.3, hex, -0.6 + i * 0.13, 1.53 + (i % 3) * 0.025, 0));
    b.box(0.11, 0.42, 0.3, C.mint, 0.36, 1.53, 0, { rz: -0.28 });
    // 櫃頂：盆栽
    b.cyl(0.14, 0.1, 0.2, C.cream, -0.4, 2.07, 0, { seg: 10 });
    b.ball(0.2, C.green, -0.4, 2.3, 0);
    b.ball(0.13, C.greenDark, -0.28, 2.42, 0.04);
  });
  // 牆上的兩幅畫
  b.rbox(0.9, 0.7, 0.06, C.woodDark, 1.6, 2.5, -2.97, { r: 0.03 });
  b.box(0.76, 0.56, 0.03, C.glass, 1.6, 2.5, -2.94);
  b.box(0.76, 0.18, 0.03, C.green, 1.6, 2.31, -2.93);
  b.ball(0.11, C.yellow, 1.78, 2.62, -2.93, { sz: 0.3 });
  b.rbox(0.56, 0.56, 0.06, C.white, 3.2, 2.7, -2.97, { r: 0.03 });
  b.box(0.42, 0.42, 0.03, C.pink, 3.2, 2.7, -2.94);
  b.ball(0.12, C.red, 3.2, 2.7, -2.93, { sz: 0.3 });
  // 落地燈
  b.cyl(0.18, 0.2, 0.05, C.dark, 3.55, 0.09, -1.5, { seg: 12 });
  b.cyl(0.025, 0.025, 1.5, C.dark, 3.55, 0.85, -1.5, { seg: 8 });
  b.cyl(0.16, 0.28, 0.34, C.yellow, 3.55, 1.72, -1.5, { seg: 14 });
  b.ball(0.1, '#fff2a8', 3.55, 1.6, -1.5, { glow: true });
}

export function lamps(b) {
  // 沿著牆頂的一串小燈泡
  const bulbs = ['#ffd27a', '#ff9f8f', '#a8e6cf', '#ffe59a'];
  for (let i = 0; i < 13; i++) b.ball(0.055, bulbs[i % 4], -3.7 + i * 0.6, 3.05 - Math.sin((i % 4) / 3 * Math.PI) * 0.1, -2.9, { glow: true });
  for (let i = 0; i < 9; i++) b.ball(0.055, bulbs[(i + 1) % 4], -3.9, 3.05 - Math.sin((i % 4) / 3 * Math.PI) * 0.1, -2.5 + i * 0.6, { glow: true });
}

export const SEAT_HEIGHT = 0.45;
/** 屋內場景的取景：鏡頭看的中心、至少要看到的高度和寬度（世界單位）。 */
export const VIEW = { center: [0, 1.75, 1.0], height: 13.6, width: 16 };

export function chair(b, x, z, facing, hex) {
  b.at(x, 0, z, facing, () => {
    b.rbox(0.5, 0.08, 0.5, hex, 0, SEAT_HEIGHT - 0.04, 0, { r: 0.03 });
    b.rbox(0.5, 0.34, 0.07, hex, 0, SEAT_HEIGHT + 0.4, -0.22, { r: 0.03 });
    for (const sx of [-1, 1]) {
      b.box(0.05, 0.5, 0.05, C.wood, sx * 0.2, SEAT_HEIGHT + 0.2, -0.22);
      for (const sz of [-1, 1]) b.cyl(0.03, 0.025, SEAT_HEIGHT - 0.08, C.wood, sx * 0.2, (SEAT_HEIGHT - 0.08) / 2, sz * 0.2, { seg: 8 });
    }
  });
  return { x, z, facing, seatHeight: SEAT_HEIGHT };
}

export function table(b, x, z, cup, flower, r = 0.62) {
  b.at(x, 0, z, 0, () => {
    b.cyl(r, r, 0.07, C.cream, 0, 0.72, 0, { seg: 26 });
    b.cyl(r + 0.02, r + 0.02, 0.03, C.cream2, 0, 0.69, 0, { seg: 26 });
    b.cyl(0.07, 0.07, 0.66, C.wood, 0, 0.35, 0, { seg: 10 });
    b.cyl(0.3, 0.34, 0.05, C.wood, 0, 0.025, 0, { seg: 16 });
    b.cyl(0.1, 0.1, 0.015, C.white, 0.3, 0.765, 0.3, { seg: 12 });            // 杯子和杯盤
    b.cyl(0.065, 0.05, 0.1, cup, 0.3, 0.82, 0.3, { seg: 10 });
    b.cyl(0.05, 0.04, 0.12, C.glass, 0.12, 0.82, 0.12, { seg: 8 });          // 小花瓶
    b.ball(0.06, flower, 0.12, 0.95, 0.12);
    b.box(0.012, 0.1, 0.012, C.greenDark, 0.12, 0.89, 0.12);
  });
}

/** 座位面前的盤子。回傳蛋糕要放的位置。 */
export function plate(b, x, z) {
  b.cyl(0.17, 0.17, 0.02, C.white, x, 0.765, z, { seg: 14 });
  return { x, y: 0.775, z };
}

/** 一塊可以吃的蛋糕：獨立的網格，被吃的時候才能一口一口變小。 */
function cake(scene, at, hex) {
  const group = new THREE.Group();
  group.position.set(at.x, at.y, at.z);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.1, 14), new THREE.MeshLambertMaterial({ color: hex }));
  body.position.y = 0.05;
  const cream = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.115, 0.025, 14), new THREE.MeshLambertMaterial({ color: C.cream }));
  cream.position.y = 0.11;
  const cherry = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), new THREE.MeshLambertMaterial({ color: C.red }));
  cherry.position.y = 0.15;
  group.add(body, cream, cherry);
  group.traverse((node) => { node.castShadow = true; });
  scene.add(group);
  return group;
}

function seating(b) {
  // 左邊是兩人桌（椅子在桌子的後側和左側，坐下來面向鏡頭），右邊是四人桌
  b.cyl(1.55, 1.55, 0.03, C.pink, 2.15, 0.075, 1.45, { seg: 30 });
  b.cyl(1.3, 1.3, 0.032, C.cream, 2.15, 0.076, 1.45, { seg: 30 });
  table(b, -0.4, 0.3, C.red, C.yellow);
  table(b, 2.15, 1.45, C.blue, C.pink, 0.8);
  const chairs = [
    { ...chair(b, -1.35, 0.3, Math.PI / 2, C.pink), plate: plate(b, -0.82, 0.3), cake: C.pink },
    { ...chair(b, -0.4, -0.65, 0, C.yellow), plate: plate(b, -0.4, -0.12), cake: C.choco },
    { ...chair(b, 1.05, 1.45, Math.PI / 2, C.mint), plate: plate(b, 1.6, 1.45), cake: C.yellow },
    { ...chair(b, 2.15, 0.35, 0, C.lilac), plate: plate(b, 2.15, 0.9), cake: C.lilac },
    { ...chair(b, 3.25, 1.45, -Math.PI / 2, C.blue), plate: plate(b, 2.7, 1.45), cake: C.pink },
    { ...chair(b, 2.15, 2.55, Math.PI, C.orange), plate: plate(b, 2.15, 2.0), cake: C.choco },
  ];
  return chairs;
}

export function pot(b, x, z, hex, big) {
  const s = big ? 1.25 : 1;
  b.cyl(0.24 * s, 0.17 * s, 0.34 * s, hex, x, 0.2 * s, z, { seg: 12 });
  b.cyl(0.26 * s, 0.26 * s, 0.05, hex, x, 0.37 * s, z, { seg: 12 });
  b.ball(0.3 * s, C.green, x, 0.66 * s, z);
  b.ball(0.21 * s, C.leaf, x + 0.15 * s, 0.9 * s, z + 0.05);
  b.ball(0.19 * s, C.greenDark, x - 0.16 * s, 0.86 * s, z - 0.06);
}

function street(b) {
  pot(b, -3.5, 1.4, C.orange, true);
  pot(b, -4.35, 3.65, C.pink);
  pot(b, -1.65, 3.5, C.yellow);
  // 立牌
  b.at(0.25, 0, 3.75, 0.25, () => {
    b.rbox(0.7, 0.95, 0.06, C.dark, 0, 0.5, 0.1, { rx: -0.2, r: 0.03 });
    b.rbox(0.7, 0.95, 0.06, C.woodDark, 0, 0.5, -0.1, { rx: 0.2, r: 0.03 });
    b.ball(0.09, C.pink, -0.14, 0.7, 0.1, { sz: 0.4 });
    b.rbox(0.3, 0.06, 0.02, C.yellow, 0.1, 0.7, 0.1, { r: 0.02 });
    b.rbox(0.44, 0.05, 0.02, C.cream, 0, 0.5, 0.14, { r: 0.02 });
    b.rbox(0.3, 0.05, 0.02, C.cream, -0.07, 0.36, 0.17, { r: 0.02 });
  });
  // 路燈：放在右後方的草地上，燈柱才不會擋到店內
  b.at(4.85, 0, -3.1, 0, () => {
    b.cyl(0.14, 0.18, 0.2, C.dark, 0, 0.14, 0, { seg: 12 });
    b.cyl(0.05, 0.06, 2.5, C.dark, 0, 1.4, 0, { seg: 10 });
    b.cyl(0.2, 0.08, 0.08, C.dark, 0, 2.66, 0, { seg: 12 });
    b.ball(0.22, '#fff2a8', 0, 2.88, 0, { glow: true });
    b.cyl(0.05, 0.2, 0.1, C.dark, 0, 3.12, 0, { seg: 12 });
  });
  // 左邊草地：牆後的大樹和灌木
  b.at(-4.9, 0, -1.5, 0, () => {
    b.cyl(0.16, 0.24, 3.4, C.woodDark, 0, 1.7, 0, { seg: 10 });
    b.ball(1.0, C.green, 0, 4.0, 0);
    b.ball(0.75, C.leaf, 0.5, 4.6, 0.4);
    b.ball(0.7, C.greenDark, -0.3, 4.5, -0.5);
    b.ball(0.6, C.green, 0.2, 3.6, 0.8);
  });
  for (const [z, r] of [[0.4, 0.34], [1.2, 0.28], [2.2, 0.36]]) b.ball(r, r > 0.3 ? C.green : C.greenDark, -4.9, r * 0.8, z, { sy: 0.85 });
  // 右邊草地：矮矮的小花，才不會擋到店內
  for (let i = 0; i < 9; i++) {
    const x = 4.6 + (i % 3) * 0.24, z = -2.6 + i * 0.62;
    b.box(0.02, 0.2, 0.02, C.greenDark, x, 0.15, z);
    b.ball(0.07, [C.pink, C.yellow, C.white, C.red, C.lilac][i % 5], x, 0.27, z);
  }
  for (const z of [-2.2, 0.2, 2.2]) b.ball(0.2, C.greenDark, 4.95, 0.14, z, { sy: 0.7 });
}

export function buildShop(scene) {
  const b = new Builder();
  ground(b);
  walls(b);
  sign(b);
  entrance(b);
  counter(b);
  cornerShelf(b);
  lamps(b);
  const seats = seating(b);
  street(b);
  return finishPlace(scene, b, seats, {
    doors: [{ x: -2.9, z: 3.4, to: 'street' }],   // 走出門就回到街上
    spawn: { x: -1.0, z: 4.5 },
    view: VIEW,
    // 小人放不上去的圓：桌子、盆栽、立牌
    obstacles: [
      { x: -0.4, z: 0.3, r: 0.95 }, { x: 2.15, z: 1.45, r: 1.15 },
      { x: -3.5, z: 1.4, r: 0.65 }, { x: -4.35, z: 3.65, r: 0.5 }, { x: -1.65, z: 3.5, r: 0.5 },
      { x: 0.25, z: 3.75, r: 0.55 },
    ],
    // 小人能站的範圍：店內（櫃台前面）和人行道
    areas: [
      { minX: -3.4, maxX: 3.5, minZ: -0.7, maxZ: 2.6 },
      { minX: -4.4, maxX: 4.5, minZ: 3.5, maxZ: 4.85 },
    ],
  });
}

/** 把蓋好的場景收成一個地方：模型放進一個群組（換地方時整組顯示或隱藏），座位加上提示圈和蛋糕，門口加上提示圈。
 *  data：{ doors, spawn（新來的人站哪附近）, arrive（從某個地方來的人站哪，沒有就用 spawn）, view, obstacles, areas,
 *  indoor（屋內範圍，沒給就是 ROOM；整個都在戶外給 null）, underground（地下室，沒有雨雪） } */
export function finishPlace(scene, b, seats, data) {
  const group = new THREE.Group();
  const { solid, glow } = b.finish();
  group.add(solid, glow);
  scene.add(group);

  const ring = (x, z, inner, outer, color) => {
    const marker = new THREE.Mesh(
      new THREE.RingGeometry(inner, outer, 28).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, depthWrite: false }),
    );
    marker.position.set(x, 0.1, z);
    marker.visible = false;
    group.add(marker);
    return marker;
  };

  // 拖人的時候，空位底下亮起來的圈圈
  const chairs = seats.map((seat) => {
    // 桌邊的座位有一盤蛋糕：bites 是還剩幾口，吃完後 refillAt 那一刻再補一盤
    const food = seat.plate ? { mesh: cake(group, seat.plate, seat.cake), bites: 3, eater: null, refillAt: 0, pop: 1 } : null;
    const marker = ring(seat.x, seat.z, 0.42, 0.56, 0xffc94a);
    if (seat.pose === 'sleep') marker.position.y = seat.seatHeight + 0.08;   // 床的圈圈放在床面上，放地上會被床蓋住
    if (seat.markerY) marker.position.y = seat.markerY;
    return { ...seat, occupant: null, marker, food };
  });

  // 門口：把人拖到這裡，他就去 to 那個地方
  const doors = data.doors.map((door) => {
    const marker = ring(door.x, door.z, door.r ? door.r - 0.3 : 0.55, door.r || 0.75, 0x6ab7ff);
    if (door.markerY) marker.position.y = door.markerY;
    return { ...door, marker };
  });
  return { indoor: ROOM, ...data, group, chairs, doors };
}
