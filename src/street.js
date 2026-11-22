// 街道：所有地方的中心。一排房子的外觀，前面是人行道和馬路；把人拖到哪一棟的門口，他就進那一棟。
// 場景設定：照線稿的那條街。左邊兩棟高樓，中間是點心店、有臉的房子、家，右邊是放積木和玩具的攤子；
// 紅綠燈在高樓和店之間，房子上方浮著點點方塊，天上有太陽和雲。高的東西在左後方，才不會擋到矮的房子。
// 座標：房子的正面在 z = 0、朝前（+z）；人行道 z 0～2，馬路 z 2.3～4.4。
import * as THREE from 'three';
import { Builder } from './builder.js';
import { C, SEAT_HEIGHT, pot, finishPlace } from './shop.js';

const S = { towerA: '#a9c4de', towerB: '#c9b6e4', trim: '#f6efe4', roofRed: '#e8766a', roofBlue: '#7fb2e0', wallBlue: '#9cc6e6', face: '#f8d98a', block: '#f8d15c', cloud: '#ffffff', car: '#f7a8c4', deck: '#c9cdd6', deckDark: '#8f95a3', petWall: '#bfe6df', petRoof: '#f6a35a' };

// 街道的版面改過一次：醫院和百貨中間多了停車塔（右邊的房子全部往右移 TOWER_GAP），玩具攤和幼稚園中間多了寵物店（幼稚園再往右移 PETS_GAP）。
// 每一棟的函式還是用原本的座標寫，蓋的時候再整棟平移。
const TOWER_GAP = 2.6, PETS_GAP = 2.9;
const MID = TOWER_GAP, END = TOWER_GAP + PETS_GAP;   // 中間那一排（百貨到玩具攤）和街尾（幼稚園）各移了多少
const LEFT = -8.1, RIGHT = 12.1 + END, CENTER = (LEFT + RIGHT) / 2, LENGTH = RIGHT - LEFT;
export const STREET_LAYOUT = 2;
/** 版面改之前存的街上位置，換算成現在的位置：人原本站在哪一棟門口，現在還是那一棟門口。 */
export const movedStreetX = (x) => (x < -5.6 ? x : x < 8.3 ? x + MID : x + END);

function ground(b) {
  b.rbox(LENGTH + 1.2, 0.5, 9.6, C.baseDark, CENTER, -0.42, 0.9, { r: 0.18 });
  b.rbox(LENGTH + 0.9, 0.26, 9.3, C.base, CENTER, -0.13, 0.9, { r: 0.1 });
  for (let ix = 0; ix < Math.round(LENGTH); ix++) for (let iz = 0; iz < 2; iz++) b.box(0.97, 0.06, 0.97, (ix + iz) % 2 ? C.tileA : C.tileB, LEFT + 0.6 + ix, 0.03, 0.55 + iz);   // 人行道
  b.rbox(LENGTH, 0.14, 0.24, C.cream, CENTER, 0.04, 2.18, { r: 0.05 });
  b.box(LENGTH, 0.04, 2.2, C.road, CENTER, 0.01, 3.4);                             // 馬路
  for (let x = LEFT + 1.1; x < RIGHT - 1; x += 2.0) b.box(0.9, 0.02, 0.1, C.white, x, 0.04, 3.4);
  for (let i = 0; i < 6; i++) b.box(0.24, 0.02, 1.9, C.white, 2.5 + MID + i * 0.36, 0.04, 3.4);   // 斑馬線
  b.rbox(LENGTH, 0.14, 0.24, C.cream, CENTER, 0.04, 4.62, { r: 0.05 });
  b.box(LENGTH, 0.07, 0.7, C.leaf, CENTER, 0.02, 5.1);                             // 馬路對面的草地：只放矮的花，才不會擋到街上
  for (let i = 0; i < Math.round(LENGTH / 1.12); i++) {
    const x = LEFT + 0.7 + i * 1.12, z = 5.0 + (i % 2) * 0.22;
    if (i % 3 === 0) { b.ball(0.2, C.greenDark, x, 0.14, z, { sy: 0.7 }); continue; }
    b.box(0.02, 0.2, 0.02, C.greenDark, x, 0.15, z);
    b.ball(0.07, [C.pink, C.yellow, C.white, C.red, C.lilac][i % 5], x, 0.27, z);
  }
}

/** 高樓：一格一格的窗戶。正面和右側都看得到，兩面都要有窗。 */
function tower(b, cx, w, h, wall) {
  b.rbox(w, h, 3.0, wall, cx, h / 2, -1.5, { r: 0.06 });
  b.rbox(w + 0.16, 0.16, 3.16, S.trim, cx, h + 0.08, -1.5, { r: 0.04 });
  for (let y = 1.55; y < h - 0.4; y += 0.95) {
    for (const dx of [-0.38, 0.38]) {
      b.box(0.44, 0.54, 0.05, C.glass, cx + dx, y, 0.01);
      b.box(0.5, 0.05, 0.08, S.trim, cx + dx, y - 0.3, 0.03);
    }
    for (const z of [-0.6, -1.5, -2.4]) b.box(0.05, 0.54, 0.44, C.glass, cx + w / 2 + 0.01, y, z);
  }
  b.rbox(0.62, 0.98, 0.06, C.dark, cx, 0.5, 0.01, { r: 0.03 });      // 大門
  b.box(0.26, 0.6, 0.03, C.glass, cx, 0.6, 0.04);
  b.rbox(0.9, 0.08, 0.3, S.trim, cx, 1.06, 0.12, { r: 0.02 });
}

/** 最左邊的高樓是醫院：屋頂和門口上方有紅十字。 */
function hospitalTower(b) {
  tower(b, -6.75, 1.9, 5.6, S.towerA);
  b.rbox(0.5, 0.8, 0.5, S.trim, -6.4, 6.1, -2.0, { r: 0.04 });         // 她畫的高樓頂上有一小塊
  b.box(0.04, 0.9, 0.04, C.dark, -7.2, 6.2, -1.0);
  b.ball(0.07, '#ff6b5e', -7.2, 6.68, -1.0, { glow: true });
  for (const dx of [-0.35, 0.35]) b.box(0.08, 0.3, 0.08, C.dark, -6.75 + dx, 5.85, -0.3);
  b.rbox(1.1, 1.1, 0.14, C.white, -6.75, 6.5, -0.3, { r: 0.08 });
  b.box(0.7, 0.22, 0.04, C.red, -6.75, 6.5, -0.21);
  b.box(0.22, 0.7, 0.04, C.red, -6.75, 6.5, -0.21);
  b.box(0.26, 0.08, 0.03, C.red, -6.75, 1.26, 0.05);
  b.box(0.08, 0.26, 0.03, C.red, -6.75, 1.26, 0.05);
  return { x: -6.75, z: 0.75, to: 'hospital' };
}

/** 停車塔：三層，每一層是開放的樓板和柱子，第三層露天、只有欄杆。正面一樓是車子進出的大開口。 */
function parkingTower(b) {
  const cx = -4.45, w = 2.3, floors = [0, 1.45, 2.9];
  for (const y of floors) {
    b.rbox(w, 0.16, 3.0, S.deck, cx, y + 0.08, -1.5, { r: 0.03 });
    if (y > 0) b.box(w + 0.04, 0.3, 0.08, S.deckDark, cx, y - 0.02, 0.0);                       // 樓板正面的邊
  }
  for (const y of floors.slice(0, 2)) {   // 一、二樓：四角的柱子和後牆
    for (const dx of [-1.05, 1.05]) for (const z of [-0.12, -2.88]) b.rbox(0.2, 1.45, 0.2, S.trim, cx + dx, y + 0.72, z, { r: 0.03 });
    b.box(w - 0.1, 1.3, 0.1, S.deckDark, cx, y + 0.8, -2.9);
    b.box(0.08, 0.5, 2.6, S.deckDark, cx - 1.1, y + 0.4, -1.5);
    b.box(0.08, 0.36, 2.6, S.trim, cx + 1.1, y + 0.34, -1.5);                                    // 右側的護欄，看得到裡面的車
  }
  for (const dx of [-1.1, 1.1]) b.box(0.07, 0.42, 3.0, S.trim, cx + dx, 3.27, -1.5);             // 三樓露天：四周的欄杆
  b.box(w, 0.42, 0.07, S.trim, cx, 3.27, -0.04);
  b.box(w, 0.42, 0.07, S.trim, cx, 3.27, -2.96);
  // 每一層停著的車（只是外觀；裡面的車在 parking.js）
  [[0.16, C.blue, -0.3], [1.61, C.yellow, 0.35], [3.06, C.green, -0.2]].forEach(([y, hex, dx]) => {
    b.rbox(0.8, 0.3, 1.3, hex, cx + dx, y + 0.3, -1.6, { r: 0.1 });
    b.rbox(0.66, 0.24, 0.6, C.glass, cx + dx, y + 0.54, -1.7, { r: 0.08 });
    for (const sx of [-0.4, 0.4]) for (const z of [-1.2, -2.0]) b.cyl(0.14, 0.14, 0.1, C.dark, cx + dx + sx, y + 0.14, z, { seg: 10, rz: Math.PI / 2 });
  });
  // 入口上方的 P 字招牌
  b.rbox(0.7, 0.7, 0.1, C.blue, cx - 0.65, 1.02, 0.08, { r: 0.08 });
  b.box(0.1, 0.44, 0.04, C.white, cx - 0.76, 1.02, 0.14);
  b.box(0.26, 0.1, 0.04, C.white, cx - 0.65, 1.19, 0.14);
  b.box(0.26, 0.1, 0.04, C.white, cx - 0.65, 1.02, 0.14);
  b.box(0.1, 0.24, 0.04, C.white, cx - 0.53, 1.1, 0.14);
  for (let i = 0; i < 5; i++) b.box(0.18, 0.03, 0.5, i % 2 ? C.yellow : C.dark, cx + 0.05 + i * 0.2, 0.18, 0.2);   // 入口的黃黑斜坡
  return { x: cx + 0.45, z: 0.75, to: 'park1' };
}

/** 百貨公司：屋頂有購物袋招牌。 */
function deptTower(b) {
  tower(b, -4.6, 1.9, 4.6, S.towerB);
  b.rbox(0.8, 0.5, 1.0, S.trim, -4.6, 5.0, -1.6, { r: 0.05 });
  for (const dx of [-0.3, 0.3]) b.box(0.08, 0.3, 0.08, C.dark, -4.6 + dx, 4.85, -0.3);
  b.rbox(0.9, 0.8, 0.2, C.pink, -4.6, 5.4, -0.3, { r: 0.06 });
  for (const dx of [-0.2, 0.2]) b.box(0.06, 0.3, 0.05, C.white, -4.6 + dx, 5.92, -0.3);
  b.box(0.46, 0.06, 0.05, C.white, -4.6, 6.06, -0.3);
  b.ball(0.12, C.yellow, -4.6, 5.4, -0.2, { sz: 0.3 });
  return { x: -4.6, z: 0.75, to: 'dept1' };
}

/** 寵物店：湖水綠的牆、橘色屋頂，屋頂上一根大骨頭，櫥窗裡坐著一隻貓。這一棟直接用現在的座標寫。 */
function petFront(b) {
  const cx = 7.15 + MID + 2.45;
  b.rbox(2.6, 2.3, 3.0, S.petWall, cx, 1.15, -1.5, { r: 0.05 });
  b.box(2.64, 0.6, 3.04, '#8fd0c8', cx, 0.31, -1.5);
  b.rbox(2.76, 0.26, 3.16, S.petRoof, cx, 2.42, -1.5, { r: 0.1 });
  b.rbox(0.8, 1.66, 0.08, C.white, cx - 0.7, 0.85, 0.02, { r: 0.03 });   // 門
  b.rbox(0.64, 1.52, 0.06, C.orange, cx - 0.7, 0.81, 0.05, { r: 0.03 });
  b.box(0.34, 0.4, 0.03, C.glass, cx - 0.7, 1.22, 0.09);
  b.ball(0.045, C.dark, cx - 0.47, 0.78, 0.1);
  b.rbox(1.1, 1.0, 0.08, C.white, cx + 0.55, 1.35, 0.02, { r: 0.03 });   // 櫥窗和裡面的貓
  b.box(0.96, 0.86, 0.04, C.glass, cx + 0.55, 1.35, 0.05);
  b.ball(0.16, '#f2b36b', cx + 0.55, 1.1, 0.1, { sz: 0.4 });
  b.ball(0.13, '#f2b36b', cx + 0.55, 1.34, 0.1, { sz: 0.4 });
  for (const dx of [-0.08, 0.08]) b.cyl(0.001, 0.05, 0.1, '#f2b36b', cx + 0.55 + dx, 1.48, 0.1, { seg: 5 });
  for (let i = 0; i < 6; i++) b.rbox(0.43, 0.08, 0.8, i % 2 ? C.cream : S.petRoof, cx - 1.08 + i * 0.43, 2.06, 0.34, { rx: 0.42, r: 0.03 });   // 遮雨棚
  // 屋頂的招牌：一根大骨頭
  for (const dx of [-0.5, 0.5]) b.box(0.08, 0.3, 0.08, C.dark, cx + dx, 2.68, -0.3);
  b.rbox(1.3, 0.3, 0.26, C.white, cx, 3.05, -0.3, { r: 0.1 });
  for (const dx of [-0.7, 0.7]) for (const dy of [-0.14, 0.14]) b.ball(0.2, C.white, cx + dx, 3.05 + dy, -0.3);
  b.box(0.05, 0.6, 0.5, C.glass, cx + 1.31, 1.4, -1.5);
  return { x: cx - 0.7, z: 0.75, to: 'pets' };
}

function shopFront(b) {
  const cx = -1.6;
  b.rbox(3.0, 2.6, 3.0, C.wall, cx, 1.3, -1.5, { r: 0.05 });
  b.box(3.04, 0.7, 3.04, C.coral, cx, 0.36, -1.5);
  b.rbox(3.16, 0.16, 3.16, C.cream2, cx, 2.68, -1.5, { r: 0.04 });
  // 門
  b.rbox(0.86, 1.72, 0.08, C.woodDark, cx - 0.85, 0.88, 0.02, { r: 0.03 });
  b.rbox(0.7, 1.58, 0.06, C.mint, cx - 0.85, 0.84, 0.05, { r: 0.03 });
  b.box(0.4, 0.5, 0.03, C.glass, cx - 0.85, 1.2, 0.09);
  b.ball(0.045, C.yellow, cx - 0.6, 0.8, 0.1);
  // 櫥窗和裡面的蛋糕
  b.rbox(1.5, 1.1, 0.08, C.white, cx + 0.55, 1.35, 0.02, { r: 0.03 });
  b.box(1.36, 0.96, 0.04, C.glass, cx + 0.55, 1.35, 0.05);
  b.box(1.3, 0.05, 0.1, C.white, cx + 0.55, 1.1, 0.1);
  [[C.pink, C.red], [C.yellow, C.white], [C.choco, C.pink]].forEach(([cake, top], i) => {
    b.cyl(0.13, 0.13, 0.14, cake, cx + 0.15 + i * 0.4, 1.2, 0.12, { seg: 12 });
    b.ball(0.045, top, cx + 0.15 + i * 0.4, 1.3, 0.12);
  });
  // 條紋遮雨棚
  for (let i = 0; i < 7; i++) b.rbox(0.43, 0.08, 0.9, i % 2 ? C.cream : C.coral, cx - 1.29 + i * 0.43, 2.12, 0.38, { rx: 0.42, r: 0.03 });
  // 屋頂上的招牌：杯子蛋糕和幾條彩色的線
  for (const dx of [-0.9, 0.9]) b.box(0.1, 0.4, 0.1, C.woodDark, cx + dx, 2.9, -0.4);
  b.rbox(2.6, 0.95, 0.18, C.coral, cx, 3.5, -0.4, { r: 0.1 });
  b.rbox(2.36, 0.72, 0.06, C.cream, cx, 3.5, -0.3, { r: 0.07 });
  b.cyl(0.17, 0.12, 0.2, C.blue, cx - 0.8, 3.38, -0.24, { seg: 12 });
  b.ball(0.2, C.pink, cx - 0.8, 3.55, -0.24, { sy: 0.75 });
  b.ball(0.06, C.red, cx - 0.8, 3.72, -0.24);
  [C.red, C.yellow, C.green, C.blue].forEach((hex, i) => b.rbox(0.36, 0.11, 0.05, hex, cx - 0.3 + i * 0.42, 3.5 + (i % 2 ? 0.11 : -0.11), -0.26, { r: 0.04 }));
  for (let i = 0; i < 6; i++) b.ball(0.06, i % 2 ? '#fff2a8' : '#ffd9a0', cx - 1.05 + i * 0.42, 4.02, -0.4, { glow: true });
  b.box(0.05, 0.6, 0.5, C.glass, cx + 1.51, 1.5, -1.5);   // 側面的窗
  pot(b, cx + 1.25, 0.42, C.orange);
  return { x: cx - 0.85, z: 0.75, to: 'shop' };
}

/** 有臉的房子：兩扇圓窗是眼睛，一排白色的門板是牙齒。 */
function faceHouse(b) {
  const cx = 1.35;
  b.rbox(2.2, 2.3, 3.0, S.face, cx, 1.15, -1.5, { r: 0.12 });
  b.rbox(2.36, 0.3, 3.16, S.roofRed, cx, 2.42, -1.5, { r: 0.12 });
  for (const dx of [-0.52, 0.52]) {
    b.cyl(0.36, 0.36, 0.08, C.white, cx + dx, 1.62, 0.02, { seg: 20, rx: Math.PI / 2 });
    b.cyl(0.28, 0.28, 0.1, C.glass, cx + dx, 1.62, 0.03, { seg: 20, rx: Math.PI / 2 });
    b.ball(0.1, C.dark, cx + dx, 1.58, 0.1, { sz: 0.4 });
  }
  b.rbox(1.5, 0.74, 0.08, C.coralDark, cx, 0.55, 0.02, { r: 0.1 });
  for (let i = 0; i < 5; i++) b.rbox(0.24, 0.3, 0.05, C.white, cx - 0.56 + i * 0.28, 0.72, 0.07, { r: 0.03 });
  b.box(0.05, 0.6, 0.5, C.glass, cx + 1.11, 1.4, -1.5);
  // 這棟是牙醫診所：屋頂上一顆牙齒招牌，嘴巴就是門口
  for (const dx of [-0.2, 0.2]) b.box(0.07, 0.2, 0.07, C.dark, cx + dx, 2.66, -0.25);
  b.rbox(0.8, 0.6, 0.3, C.white, cx, 3.2, -0.25, { r: 0.18 });
  for (const dx of [-0.2, 0.2]) b.rbox(0.26, 0.4, 0.2, C.white, cx + dx, 2.85, -0.25, { r: 0.1 });
  return { x: cx, z: 0.75, to: 'dentist' };
}

function homeFront(b) {
  const cx = 4.5;
  b.rbox(3.0, 2.3, 3.0, C.wall, cx, 1.15, -1.5, { r: 0.05 });
  b.box(3.04, 0.7, 3.04, S.wallBlue, cx, 0.36, -1.5);
  // 斜屋頂：兩片屋面在屋脊相接，正面用三層牆板補成三角形
  for (const side of [-1, 1]) b.rbox(2.0, 0.16, 3.4, S.roofBlue, cx + side * 0.8, 2.85, -1.5, { rz: -side * 0.62, r: 0.04 });
  [[2.5, 2.5], [1.7, 2.9], [0.9, 3.2]].forEach(([w, y]) => b.box(w, 0.42, 2.9, C.wall, cx, y, -1.5));
  b.rbox(0.4, 0.9, 0.4, C.coral, cx + 0.9, 3.3, -2.0, { r: 0.04 });   // 煙囪
  b.rbox(0.5, 0.1, 0.5, C.cream2, cx + 0.9, 3.78, -2.0, { r: 0.03 });
  // 黃色的大門
  b.rbox(0.86, 1.72, 0.08, C.white, cx - 0.75, 0.88, 0.02, { r: 0.03 });
  b.rbox(0.7, 1.58, 0.06, C.yellow, cx - 0.75, 0.84, 0.05, { r: 0.03 });
  b.box(0.36, 0.36, 0.03, C.glass, cx - 0.75, 1.3, 0.09);
  b.ball(0.045, C.dark, cx - 0.5, 0.8, 0.1);
  b.rbox(1.0, 0.08, 0.5, C.cream2, cx - 0.75, 0.06, 0.3, { r: 0.03 });   // 門階
  // 窗、窗簾和窗台的花箱
  b.rbox(1.2, 1.0, 0.08, C.white, cx + 0.65, 1.4, 0.02, { r: 0.03 });
  for (const dx of [-0.27, 0.27]) b.box(0.48, 0.82, 0.04, C.glass, cx + 0.65 + dx, 1.4, 0.05);
  for (const dx of [-0.5, 0.5]) b.box(0.14, 0.82, 0.03, C.yellow, cx + 0.65 + dx, 1.4, 0.08);
  b.rbox(1.24, 0.18, 0.24, C.white, cx + 0.65, 0.82, 0.14, { r: 0.04 });
  for (let i = 0; i < 5; i++) {
    b.ball(0.1, i % 2 ? C.green : C.greenDark, cx + 0.2 + i * 0.22, 0.95, 0.14);
    b.ball(0.055, [C.yellow, C.pink, C.white, C.orange, C.lilac][i], cx + 0.2 + i * 0.22, 1.05, 0.17);
  }
  b.ball(0.2, S.wallBlue, cx, 2.75, 0.04, { sz: 0.25 });   // 山牆上的圓窗
  b.box(0.05, 0.6, 0.5, C.glass, cx + 1.51, 1.4, -1.5);
  // 信箱
  b.box(0.06, 0.7, 0.06, C.woodDark, cx + 1.25, 0.4, 0.5);
  b.rbox(0.3, 0.22, 0.4, C.red, cx + 1.25, 0.84, 0.5, { r: 0.06 });
  return { x: cx - 0.75, z: 0.75, to: 'home' };
}

/** 放積木和玩具的攤子：她畫裡寫著 ABC 的那個櫃子。攤子前面是玩具店的門口。 */
function toyStall(b) {
  const cx = 7.15;
  b.rbox(1.7, 0.9, 1.2, C.lilac, cx, 0.45, -0.7, { r: 0.05 });
  b.rbox(1.8, 0.08, 1.3, C.cream, cx, 0.94, -0.7, { r: 0.03 });
  [[C.red, -0.5], [C.blue, -0.15], [C.yellow, 0.2]].forEach(([hex, dx]) => b.rbox(0.3, 0.3, 0.3, hex, cx + dx, 1.13, -0.45, { r: 0.04 }));
  b.rbox(0.28, 0.28, 0.28, C.green, cx - 0.32, 1.42, -0.45, { r: 0.04, ry: 0.4 });
  b.ball(0.18, C.orange, cx + 0.55, 1.16, -0.5);
  b.at(cx + 0.1, 0.98, -1.0, 0, () => {   // 小熊
    b.ball(0.19, C.choco, 0, 0.18, 0);
    b.ball(0.15, C.choco, 0, 0.45, 0);
    for (const x of [-0.11, 0.11]) b.ball(0.06, C.choco, x, 0.58, 0);
    b.ball(0.055, C.cream2, 0, 0.42, 0.12);
  });
  for (const [dx, dz] of [[-0.8, -0.15], [0.8, -0.15], [-0.8, -1.25], [0.8, -1.25]]) b.box(0.07, 2.3, 0.07, C.woodDark, cx + dx, 1.15, dz);
  for (let i = 0; i < 5; i++) b.rbox(0.38, 0.08, 1.5, i % 2 ? C.cream : C.yellow, cx - 0.76 + i * 0.38, 2.34, -0.66, { rx: 0.18, r: 0.03 });
  return { x: cx, z: 0.85, to: 'toys' };
}

/** 街尾的幼稚園：黃色斜屋頂、彩色的門柱，旁邊的草地上有一座小溜滑梯和一棵樹。 */
function kinderFront(b) {
  const cx = 10.0;
  b.rbox(3.0, 2.3, 3.0, C.wall, cx, 1.15, -1.5, { r: 0.05 });
  b.box(3.04, 0.7, 3.04, '#b9e3a8', cx, 0.36, -1.5);
  for (const side of [-1, 1]) b.rbox(2.0, 0.16, 3.4, C.yellow, cx + side * 0.8, 2.85, -1.5, { rz: -side * 0.62, r: 0.04 });
  [[2.5, 2.5], [1.7, 2.9], [0.9, 3.2]].forEach(([w, y]) => b.box(w, 0.42, 2.9, C.wall, cx, y, -1.5));
  b.ball(0.24, C.red, cx, 2.8, 0.04, { sz: 0.25 });                        // 山牆上的紅色圓窗
  // 門：兩根彩色門柱、橘色的門
  b.rbox(0.14, 1.9, 0.14, C.red, cx - 1.22, 0.95, 0.06, { r: 0.03 });
  b.rbox(0.14, 1.9, 0.14, C.blue, cx - 0.28, 0.95, 0.06, { r: 0.03 });
  b.rbox(0.7, 1.58, 0.06, C.orange, cx - 0.75, 0.84, 0.05, { r: 0.03 });
  b.box(0.36, 0.36, 0.03, C.glass, cx - 0.75, 1.3, 0.09);
  [C.red, C.orange, C.yellow, C.green, C.blue].forEach((hex, i) => b.rbox(0.2, 0.2, 0.08, hex, cx - 1.15 + i * 0.2, 2.02, 0.06, { r: 0.04 }));
  // 窗戶上貼著小朋友的畫
  b.rbox(1.2, 1.0, 0.08, C.white, cx + 0.65, 1.4, 0.02, { r: 0.03 });
  b.box(1.06, 0.86, 0.04, C.glass, cx + 0.65, 1.4, 0.05);
  [[-0.28, C.yellow], [0.02, C.pink], [0.3, C.green]].forEach(([dx, hex]) => b.ball(0.11, hex, cx + 0.65 + dx, 1.42, 0.08, { sz: 0.25 }));
  b.box(0.05, 0.6, 0.5, C.glass, cx + 1.51, 1.4, -1.5);
  // 旁邊的草地：圍籬、樹、小溜滑梯
  b.box(0.9, 0.07, 3.0, C.leaf, 11.75, 0.02, -1.5);
  for (let i = 0; i < 3; i++) b.box(0.09, 0.45, 0.05, [C.red, C.yellow, C.blue][i], 11.45 + i * 0.3, 0.26, 0.0);
  b.box(0.8, 0.05, 0.04, C.white, 11.75, 0.34, -0.02);
  b.cyl(0.12, 0.16, 1.6, C.woodDark, 11.8, 0.8, -2.2, { seg: 10 });
  b.ball(0.6, C.green, 11.8, 1.9, -2.2);
  b.ball(0.42, C.leaf, 12.0, 2.25, -2.0);
  b.box(0.4, 0.05, 1.0, C.yellow, 11.75, 0.38, -0.85, { rx: 0.55 });
  for (const z of [-1.2, -1.45]) b.box(0.4, 0.7, 0.05, C.blue, 11.75, 0.35, z);
  return { x: cx - 0.75, z: 0.75, to: 'kinder' };
}

/** 浮在房子上方的點點方塊，照她畫的。 */
function dottedBlock(b, x, y, z) {
  b.rbox(0.62, 0.62, 0.62, S.block, x, y, z, { r: 0.08 });
  for (const [dx, dy] of [[-0.15, 0.15], [0.15, 0.15], [0, 0], [-0.15, -0.15], [0.15, -0.15]]) {
    b.ball(0.05, C.dark, x + dx, y + dy, z + 0.31, { sz: 0.3 });
    b.ball(0.05, C.dark, x + 0.31, y + dy, z + dx, { sx: 0.3 });
  }
}

function sky(b) {
  dottedBlock(b, 1.35 + MID, 3.5, -0.9);
  dottedBlock(b, 7.15 + MID, 3.4, -0.7);
  dottedBlock(b, -3.0 + MID, 4.4, -0.9);
  b.ball(0.6, '#ffd75e', -1.4, 7.4, -3.3, { glow: true });   // 太陽
  for (const [x, y, z] of [[0.4, 7.2, -3.2], [6.2, 6.4, -3.2], [12.6, 6.9, -3.2]]) {   // 雲
    b.ball(0.55, S.cloud, x, y, z, { glow: true });
    b.ball(0.42, S.cloud, x - 0.6, y - 0.1, z, { glow: true });
    b.ball(0.45, S.cloud, x + 0.6, y - 0.08, z, { glow: true });
    b.ball(0.36, S.cloud, x + 0.15, y + 0.3, z, { glow: true });
  }
}

const BENCH_X = 10.85 + END, LIGHT_X = -3.35 + MID, POT_X = 3.05 + MID, HYDRANT_X = 6.0 + MID;

function furniture(b) {
  // 紅綠燈：在高樓和店之間，照她畫的位置
  b.at(LIGHT_X, 0, 1.85, 0, () => {
    b.cyl(0.13, 0.16, 0.18, C.dark, 0, 0.13, 0, { seg: 12 });
    b.cyl(0.05, 0.05, 2.2, C.dark, 0, 1.25, 0, { seg: 10 });
    b.rbox(0.36, 1.0, 0.3, C.dark, 0, 2.85, 0, { r: 0.08 });
    [['#ff6b5e', 3.15], ['#ffd45c', 2.85], ['#6fdc8c', 2.55]].forEach(([hex, y]) => b.ball(0.11, hex, 0, y, 0.13, { glow: true }));
  });
  // 路燈：放最左邊
  b.at(-7.9, 0, 1.85, 0, () => {
    b.cyl(0.14, 0.18, 0.2, C.dark, 0, 0.14, 0, { seg: 12 });
    b.cyl(0.05, 0.06, 2.5, C.dark, 0, 1.4, 0, { seg: 10 });
    b.ball(0.22, '#fff2a8', 0, 2.88, 0, { glow: true });
    b.cyl(0.05, 0.2, 0.1, C.dark, 0, 3.12, 0, { seg: 12 });
  });
  // 長椅：在幼稚園右邊的窗戶前面，可以坐兩個人
  b.at(BENCH_X, 0, 0.5, 0, () => {
    b.rbox(1.8, 0.08, 0.5, C.wood, 0, SEAT_HEIGHT - 0.04, 0, { r: 0.03 });
    for (const y of [0.66, 0.86]) b.rbox(1.8, 0.14, 0.06, C.wood, 0, y, -0.24, { r: 0.02 });
    for (const sx of [-1, 1]) {
      b.rbox(0.07, 0.95, 0.07, C.dark, sx * 0.82, 0.47, -0.24, { r: 0.02 });
      b.rbox(0.07, SEAT_HEIGHT, 0.07, C.dark, sx * 0.82, SEAT_HEIGHT / 2, 0.2, { r: 0.02 });
      b.rbox(0.07, 0.06, 0.5, C.dark, sx * 0.82, 0.64, 0, { r: 0.02 });
    }
  });
  pot(b, POT_X, 0.42, C.pink);
  // 消防栓
  b.cyl(0.11, 0.13, 0.42, C.red, HYDRANT_X, 0.27, 1.85, { seg: 10 });
  b.ball(0.12, C.red, HYDRANT_X, 0.5, 1.85);
  b.cyl(0.05, 0.05, 0.36, C.red, HYDRANT_X, 0.32, 1.85, { seg: 8, rz: Math.PI / 2 });
}

// 小車沿著馬路繞圈：靠鏡頭的車道往右開，街尾迴轉，靠人行道的車道往左開回來
const LANE = { x0: LEFT + 1.6, x1: RIGHT - 1.6, near: 3.9, far: 2.9 };
const TURN = (LANE.near - LANE.far) / 2, STRAIGHT = LANE.x1 - LANE.x0, LAP = 2 * STRAIGHT + 2 * Math.PI * TURN;
const CAR_SPEED = 2.2, CAR_SEAT_HEIGHT = 0.68;

/** 車子開了 s 這麼遠時在哪裡。 */
function lanePoint(s) {
  const d = ((s % LAP) + LAP) % LAP, mid = (LANE.near + LANE.far) / 2;
  if (d < STRAIGHT) return [LANE.x0 + d, LANE.near];
  if (d < STRAIGHT + Math.PI * TURN) { const a = Math.PI / 2 - (d - STRAIGHT) / TURN; return [LANE.x1 + Math.cos(a) * TURN, mid + Math.sin(a) * TURN]; }
  if (d < 2 * STRAIGHT + Math.PI * TURN) return [LANE.x1 - (d - STRAIGHT - Math.PI * TURN), LANE.far];
  const a = -Math.PI / 2 - (d - 2 * STRAIGHT - Math.PI * TURN) / TURN;
  return [LANE.x0 + Math.cos(a) * TURN, mid + Math.sin(a) * TURN];
}

/** 敞篷小車：獨立的網格，有人坐上去就會開。車頭朝 +x。 */
function carModel(group) {
  const b = new Builder();
  b.rbox(1.7, 0.42, 0.9, S.car, 0, 0.42, 0, { r: 0.12 });
  b.box(1.0, 0.03, 0.7, C.dark, -0.15, 0.64, 0);                           // 座艙
  b.rbox(0.14, 0.4, 0.74, C.cream, -0.72, 0.8, 0, { r: 0.05 });            // 後座椅背
  b.rbox(0.1, 0.34, 0.74, C.cream, -0.08, 0.78, 0, { r: 0.04 });           // 前座椅背
  b.box(0.05, 0.32, 0.8, C.glass, 0.5, 0.8, 0, { rz: 0.35 });              // 擋風玻璃
  b.cyl(0.11, 0.11, 0.03, C.dark, 0.36, 0.84, 0.16, { seg: 10, rz: Math.PI / 2 - 0.5 });   // 方向盤
  for (const x of [-0.52, 0.52]) for (const z of [-0.44, 0.44]) {
    b.cyl(0.19, 0.19, 0.12, C.dark, x, 0.2, z, { seg: 14, rx: Math.PI / 2 });
    b.cyl(0.08, 0.08, 0.13, C.cream, x, 0.2, z, { seg: 8, rx: Math.PI / 2 });
  }
  for (const z of [-0.3, 0.3]) {
    b.ball(0.07, '#fff2a8', 0.85, 0.46, z, { glow: true });
    b.ball(0.05, '#ff6b5e', -0.85, 0.46, z, { glow: true });
  }
  const car = new THREE.Group();
  const { solid, glow } = b.finish();
  car.add(solid, glow);
  group.add(car);
  return car;
}

/** 每一格更新小車：車上有人就往前開；座位跟著車走。回傳車子這一格有沒有動。 */
export function driveCar(place, dt) {
  const { car, carSeats } = place;
  const moving = carSeats.some((seat) => seat.occupant);
  if (moving) car.userData.s += CAR_SPEED * dt;
  const s = car.userData.s, [x, z] = lanePoint(s), [ax, az] = lanePoint(s + 0.05);
  const heading = Math.atan2(-(az - z), ax - x);
  car.position.set(x, moving ? Math.abs(Math.sin(s * 6)) * 0.015 : 0, z);
  car.rotation.y = heading;
  for (const seat of carSeats) {
    seat.x = x + seat.along * Math.cos(heading);
    seat.z = z - seat.along * Math.sin(heading);
    seat.facing = heading + Math.PI / 2;
    seat.marker.position.set(seat.x, 0.95, seat.z);
  }
  return moving;
}

export function buildStreet(scene) {
  const b = new Builder();
  ground(b);
  // 平移過的那幾棟：蓋的時候整棟移過去，門口的位置跟著移
  const moved = (dx, front) => { let door; b.at(dx, 0, 0, 0, () => { door = front(b); }); return { ...door, x: door.x + dx }; };
  const hospitalDoor = hospitalTower(b);
  parkingTower(b);
  const deptDoor = moved(MID, deptTower);
  const shopDoor = moved(MID, shopFront);
  const dentistDoor = moved(MID, faceHouse);
  const homeDoor = moved(MID, homeFront);
  const toysDoor = moved(MID, toyStall);
  const petsDoor = petFront(b);
  const kinderDoor = moved(END, kinderFront);
  sky(b);
  furniture(b);
  // 長椅的兩個位子，加上小車的前座和後座（位置每一格跟著車子更新）
  const seats = [
    { x: BENCH_X - 0.4, z: 0.52, facing: 0, seatHeight: SEAT_HEIGHT }, { x: BENCH_X + 0.4, z: 0.52, facing: 0, seatHeight: SEAT_HEIGHT },
    ...[0.2, -0.45].map((along) => ({ x: 0, z: 0, facing: 0, seatHeight: CAR_SEAT_HEIGHT, pose: 'drive', along })),
  ];

  const place = finishPlace(scene, b, seats, {
    doors: [hospitalDoor, deptDoor, shopDoor, dentistDoor, homeDoor, toysDoor, petsDoor, kinderDoor],
    spawn: { x: shopDoor.x, z: 1.6 },
    // 從屋裡出來的人站在那一棟的門外
    arrive: { hospital: { x: hospitalDoor.x, z: 1.6 }, dept1: { x: deptDoor.x, z: 1.6 }, shop: { x: shopDoor.x, z: 1.6 }, home: { x: homeDoor.x, z: 1.6 }, toys: { x: toysDoor.x - 0.3, z: 1.7 }, pets: { x: petsDoor.x, z: 1.6 }, kinder: { x: kinderDoor.x, z: 1.6 }, dentist: { x: dentistDoor.x, z: 1.6 } },
    view: { center: [CENTER, 2.4, 0.9], height: 17.5, width: LENGTH + 9.3 },
    shadow: { x: CENTER, half: LENGTH / 2 + 3.9 },   // 陰影要蓋得住整條街
    indoor: null,
    // 小人放不上去的圓：紅綠燈、路燈、長椅、盆栽、消防栓、信箱（小車會開走，不算）
    obstacles: [
      { x: LIGHT_X, z: 1.85, r: 0.45 }, { x: -7.9, z: 1.85, r: 0.45 },
      { x: BENCH_X - 0.4, z: 0.5, r: 0.5 }, { x: BENCH_X + 0.4, z: 0.5, r: 0.5 },
      { x: -0.35 + MID, z: 0.42, r: 0.5 }, { x: POT_X, z: 0.42, r: 0.5 }, { x: HYDRANT_X, z: 1.85, r: 0.4 },
      { x: 5.75 + MID, z: 0.5, r: 0.4 },
    ],
    // 小人能站的範圍：人行道和馬路
    areas: [{ minX: LEFT + 0.5, maxX: RIGHT - 0.7, minZ: 0.95, maxZ: 4.3 }],
  });
  place.car = carModel(place.group);
  place.car.userData.s = 2 * STRAIGHT + Math.PI * TURN - 0.9;   // 一開始停在左邊路旁，車頭朝左
  place.carSeats = place.chairs.filter((chair) => chair.pose === 'drive');
  driveCar(place, 0);
  return place;
}
