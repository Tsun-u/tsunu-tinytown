// 街道：所有地方的中心。一排房子的外觀，前面是人行道和馬路；把人拖到哪一棟的門口，他就進那一棟。
// 場景設定：照線稿的那條街。左邊兩棟高樓，中間是點心店、有臉的房子、家，右邊是放積木和玩具的攤子；
// 紅綠燈在高樓和店之間，房子上方浮著點點方塊，天上有太陽和雲。高的東西在左後方，才不會擋到矮的房子。
// 座標：房子的正面在 z = 0、朝前（+z）；人行道 z 0～2，馬路 z 2.3～4.4。
import * as THREE from 'three';
import { Builder } from './builder.js';
import { C, SEAT_HEIGHT, pot, finishPlace } from './shop.js';

const S = { towerA: '#a9c4de', towerB: '#c9b6e4', trim: '#f6efe4', roofRed: '#e8766a', roofBlue: '#7fb2e0', wallBlue: '#9cc6e6', face: '#f8d98a', block: '#f8d15c', cloud: '#ffffff', car: '#f7a8c4', deck: '#c9cdd6', deckDark: '#8f95a3', petWall: '#bfe6df', petRoof: '#f6a35a' };

// 街道是 L 型：後面一排（牙醫、家、玩具攤、寵物店、幼稚園）沿著 x 排，正面朝前（+z）；
// 左邊一排（由近到轉角：醫院、停車塔、百貨公司、點心店）沿著 z 排，正面朝右（+x）；轉角是小公園。
// 每一棟的函式用的是「一整排往右排、正面朝前」的座標。後排整棟平移過去；左排整組轉 90 度：那套座標的 (x, z) 變成街上的 (z, ARM_Z - x)。
const MID = 2.6;            // 左排裡，百貨和點心店比原本的座標往後移這麼多（中間多了停車塔）
const ARM_Z = 3.6;
const toArm = (x, z) => ({ x: z, z: ARM_Z - x });
const BACK = 0.93, PETS_X = 10.48, KINDER = 3.58;   // 後排：牙醫、家、玩具攤平移多少，寵物店的中心，幼稚園平移多少
const X_END = 16.0, Z_END = 11.9;                    // 後排和左排各到哪裡
// 版面的編號：1 是一開始的一條直街，2 是加了停車塔和寵物店的直街，3 是 L 型
export const STREET_LAYOUT = 3;
/** 舊版面存的街上位置，換算成現在的位置：人原本站在哪一棟門口，現在還是那一棟門口。 */
export function migrateStreetSpot(layout, x, z) {
  if (layout < 2) x = x < -5.6 ? x : x < 8.3 ? x + 2.6 : x + 5.5;
  if (layout < 3) {
    if (x < 2.7) return toArm(x, z);                                   // 醫院到點心店：轉到左排
    x += x < 10.75 ? BACK - 2.6 : x < 13.75 ? PETS_X - 12.2 : KINDER - 5.5;   // 牙醫到玩具攤、寵物店、幼稚園
  }
  return { x, z };
}

function ground(b) {
  // 底座：後排和左排各一條，疊成 L 型
  for (const [w, d, cx, cz] of [[X_END + 4.2, 9.6, X_END / 2 - 1.65, 1.05], [9.6, Z_END + 4.2, 1.05, Z_END / 2 - 1.65]]) {
    b.rbox(w, 0.5, d, C.baseDark, cx, -0.42, cz, { r: 0.18 });
    b.rbox(w - 0.3, 0.26, d - 0.3, C.base, cx, -0.13, cz, { r: 0.1 });
  }
  // 人行道
  for (let ix = 0; ix < Math.round(X_END) - 1; ix++) for (let iz = 0; iz < 2; iz++) b.box(0.97, 0.06, 0.97, (ix + iz) % 2 ? C.tileA : C.tileB, 1.5 + ix, 0.03, 0.55 + iz);
  for (let iz = 0; iz < Math.round(Z_END) - 1; iz++) for (let ix = 0; ix < 2; ix++) {
    if (iz === 0 && ix === 1) continue;   // 轉角那一格後排已經鋪了
    b.box(0.97, 0.06, 0.97, (ix + iz) % 2 ? C.tileB : C.tileA, 0.55 + ix, 0.03, 1.5 + iz);
  }
  // 馬路：兩條在轉角相接
  b.box(X_END - 2.3, 0.04, 2.2, C.road, (X_END + 2.3) / 2, 0.01, 3.4);
  b.box(2.2, 0.04, Z_END - 2.3, C.road, 3.4, 0.01, (Z_END + 2.3) / 2);
  b.rbox(X_END - 2.06, 0.14, 0.24, C.cream, (X_END + 2.06) / 2, 0.04, 2.18, { r: 0.05 });
  b.rbox(0.24, 0.14, Z_END - 2.3, C.cream, 2.18, 0.04, (Z_END + 2.3) / 2, { r: 0.05 });
  for (let x = 5.6; x < X_END - 1; x += 2.0) b.box(0.9, 0.02, 0.1, C.white, x, 0.04, 3.4);
  for (let z = 5.6; z < Z_END - 1; z += 2.0) b.box(0.1, 0.02, 0.9, C.white, 3.4, 0.04, z);
  for (let i = 0; i < 6; i++) b.box(0.24, 0.02, 1.9, C.white, 6.2 + i * 0.36, 0.04, 3.4);   // 斑馬線
  // 馬路對面的草地：只放矮的花，才不會擋到街上
  b.rbox(X_END - 4.5, 0.14, 0.24, C.cream, (X_END + 4.5) / 2, 0.04, 4.62, { r: 0.05 });
  b.rbox(0.24, 0.14, Z_END - 4.74, C.cream, 4.62, 0.04, (Z_END + 4.74) / 2, { r: 0.05 });
  b.box(X_END - 4.75, 0.07, 0.7, C.leaf, (X_END + 4.75) / 2, 0.02, 5.1);
  b.box(0.7, 0.07, Z_END - 5.45, C.leaf, 5.1, 0.02, (Z_END + 5.45) / 2);
  const flower = (x, z, i) => {
    if (i % 3 === 0) { b.ball(0.2, C.greenDark, x, 0.14, z, { sy: 0.7 }); return; }
    b.box(0.02, 0.2, 0.02, C.greenDark, x, 0.15, z);
    b.ball(0.07, [C.pink, C.yellow, C.white, C.red, C.lilac][i % 5], x, 0.27, z);
  };
  for (let i = 0; i * 1.12 < X_END - 5.6; i++) flower(5.3 + i * 1.12, 5.0 + (i % 2) * 0.22, i);
  for (let i = 0; i * 1.12 < Z_END - 6.6; i++) flower(5.0 + (i % 2) * 0.22, 6.3 + i * 1.12, i + 1);
}

const PARK = { fountain: [-0.9, -0.9], bench: [-2.55, 0.15] };

/** 長椅：可以坐兩個人，面向 +z。 */
function bench(b) {
  b.rbox(1.8, 0.08, 0.5, C.wood, 0, SEAT_HEIGHT - 0.04, 0, { r: 0.03 });
  for (const y of [0.66, 0.86]) b.rbox(1.8, 0.14, 0.06, C.wood, 0, y, -0.24, { r: 0.02 });
  for (const sx of [-1, 1]) {
    b.rbox(0.07, 0.95, 0.07, C.dark, sx * 0.82, 0.47, -0.24, { r: 0.02 });
    b.rbox(0.07, SEAT_HEIGHT, 0.07, C.dark, sx * 0.82, SEAT_HEIGHT / 2, 0.2, { r: 0.02 });
    b.rbox(0.07, 0.06, 0.5, C.dark, sx * 0.82, 0.64, 0, { r: 0.02 });
  }
}

/** 轉角的小公園：草地、噴水池、一張長椅、兩棵樹、花圃。回傳長椅的兩個位子。 */
function park(b) {
  b.box(4.2, 0.07, 4.2, C.leaf, -1.1, 0.02, -1.1);
  const [fx, fz] = PARK.fountain;
  b.cyl(1.5, 1.5, 0.03, C.tileB, fx, 0.075, fz, { seg: 28 });           // 噴水池周圍的鋪面
  b.cyl(0.85, 0.9, 0.34, C.cream2, fx, 0.23, fz, { seg: 24 });
  b.cyl(0.72, 0.72, 0.04, '#9fd8ee', fx, 0.4, fz, { seg: 24 });
  b.cyl(0.1, 0.14, 0.7, C.cream2, fx, 0.6, fz, { seg: 10 });
  b.cyl(0.34, 0.2, 0.1, C.cream2, fx, 0.97, fz, { seg: 14 });
  b.cyl(0.28, 0.28, 0.03, '#9fd8ee', fx, 1.02, fz, { seg: 14 });
  b.ball(0.1, '#e4f7fd', fx, 1.16, fz, { glow: true });
  for (let i = 0; i < 5; i++) b.ball(0.05, '#e4f7fd', fx + Math.cos(i * 1.26) * 0.45, 0.47, fz + Math.sin(i * 1.26) * 0.45, { glow: true });
  for (const [x, z] of [[0.2, 0.35], [0.55, -0.2], [-0.3, 0.6]]) b.cyl(0.26, 0.26, 0.03, C.cream, x, 0.075, z, { seg: 12 });   // 從人行道走進來的石板
  // 長椅在左邊，面向右
  const [bx, bz] = PARK.bench;
  b.at(bx, 0, bz, Math.PI / 2, () => bench(b));
  // 兩棵樹：高的在最裡面的角落
  b.cyl(0.14, 0.2, 1.9, C.woodDark, -2.6, 0.95, -2.6, { seg: 10 });
  b.ball(0.85, C.green, -2.6, 2.4, -2.6);
  b.ball(0.6, C.leaf, -2.2, 2.95, -2.4);
  b.ball(0.55, C.greenDark, -2.9, 2.9, -2.2);
  b.cyl(0.1, 0.14, 1.1, C.woodDark, 0.4, 0.55, -2.6, { seg: 8 });
  b.ball(0.55, C.leaf, 0.4, 1.45, -2.6);
  b.ball(0.38, C.green, 0.65, 1.75, -2.45);
  // 沿著後面兩邊的花圃
  for (let i = 0; i < 7; i++) {
    const hex = [C.pink, C.yellow, C.white, C.red, C.lilac][i % 5];
    b.ball(0.16, C.greenDark, -1.9 + i * 0.36, 0.14, -2.95, { sy: 0.7 });
    b.ball(0.07, hex, -1.9 + i * 0.36, 0.3, -2.9);
    if (i < 5) { b.ball(0.16, C.greenDark, -2.95, 0.14, -1.7 + i * 0.36, { sy: 0.7 }); b.ball(0.07, hex, -2.9, 0.3, -1.7 + i * 0.36); }
  }
  // 路燈
  b.cyl(0.12, 0.16, 0.2, C.dark, -2.6, 0.14, 0.95, { seg: 12 });
  b.cyl(0.05, 0.06, 2.2, C.dark, -2.6, 1.25, 0.95, { seg: 10 });
  b.ball(0.2, '#fff2a8', -2.6, 2.5, 0.95, { glow: true });
  return [-0.4, 0.4].map((along) => ({ x: bx + 0.02, z: bz - along, facing: Math.PI / 2, seatHeight: SEAT_HEIGHT }));
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
  const cx = PETS_X;
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
  dottedBlock(b, 1.35 + BACK, 3.5, -0.9);    // 牙醫診所上面
  dottedBlock(b, 7.15 + BACK, 3.4, -0.7);    // 玩具攤上面
  dottedBlock(b, -0.9, 4.4, 4.0);            // 點心店上面
  b.ball(0.6, '#ffd75e', 3.2, 7.6, -3.3, { glow: true });   // 太陽
  for (const [x, y, z] of [[6.4, 6.6, -3.2], [11.8, 6.9, -3.2], [-3.2, 7.4, 2.6], [-3.2, 8.0, 8.4]]) {   // 雲
    if (x < 0) {   // 左排後面的雲：沿著 z 排
      b.ball(0.55, S.cloud, x, y, z, { glow: true });
      b.ball(0.42, S.cloud, x, y - 0.1, z - 0.6, { glow: true });
      b.ball(0.45, S.cloud, x, y - 0.08, z + 0.6, { glow: true });
      b.ball(0.36, S.cloud, x, y + 0.3, z + 0.15, { glow: true });
      continue;
    }
    b.ball(0.55, S.cloud, x, y, z, { glow: true });
    b.ball(0.42, S.cloud, x - 0.6, y - 0.1, z, { glow: true });
    b.ball(0.45, S.cloud, x + 0.6, y - 0.08, z, { glow: true });
    b.ball(0.36, S.cloud, x + 0.15, y + 0.3, z, { glow: true });
  }
}

const BENCH_X = 10.85 + KINDER, LIGHT_X = -3.35 + MID, LAMP_X = -7.9, POT_X = 3.05 + BACK, HYDRANT_X = 6.0 + BACK;

/** 左排人行道上的東西（用左排那套座標）：紅綠燈和路燈。 */
function armFurniture(b) {
  // 紅綠燈：在高樓和店之間，照她畫的位置
  b.at(LIGHT_X, 0, 1.85, 0, () => {
    b.cyl(0.13, 0.16, 0.18, C.dark, 0, 0.13, 0, { seg: 12 });
    b.cyl(0.05, 0.05, 2.2, C.dark, 0, 1.25, 0, { seg: 10 });
    b.rbox(0.36, 1.0, 0.3, C.dark, 0, 2.85, 0, { r: 0.08 });
    [['#ff6b5e', 3.15], ['#ffd45c', 2.85], ['#6fdc8c', 2.55]].forEach(([hex, y]) => b.ball(0.11, hex, 0, y, 0.13, { glow: true }));
  });
  // 路燈：放最靠近鏡頭的那一頭
  b.at(LAMP_X, 0, 1.85, 0, () => {
    b.cyl(0.14, 0.18, 0.2, C.dark, 0, 0.14, 0, { seg: 12 });
    b.cyl(0.05, 0.06, 2.5, C.dark, 0, 1.4, 0, { seg: 10 });
    b.ball(0.22, '#fff2a8', 0, 2.88, 0, { glow: true });
    b.cyl(0.05, 0.2, 0.1, C.dark, 0, 3.12, 0, { seg: 12 });
  });
}

/** 後排人行道上的東西：幼稚園前的長椅、盆栽、消防栓。 */
function backFurniture(b) {
  b.at(BENCH_X, 0, 0.5, 0, () => bench(b));   // 長椅：在幼稚園右邊的窗戶前面，可以坐兩個人
  pot(b, POT_X, 0.42, C.pink);
  // 消防栓
  b.cyl(0.11, 0.13, 0.42, C.red, HYDRANT_X, 0.27, 1.85, { seg: 10 });
  b.ball(0.12, C.red, HYDRANT_X, 0.5, 1.85);
  b.cyl(0.05, 0.05, 0.36, C.red, HYDRANT_X, 0.32, 1.85, { seg: 8, rz: Math.PI / 2 });
}

// 小車沿著 L 型的馬路繞圈：外側的車道從左排開到轉角、轉進後排往右開，街尾迴轉，內側的車道開回來，在左排那一頭再迴轉。
// 車道是一圈折線，每個轉折處修成圓角，取樣成一串點；LANE_AT 是開到每一點時的里程。
const LANE_POINTS = (() => {
  const corners = [[3.9, Z_END - 1.2], [3.9, 3.9], [X_END - 1.4, 3.9], [X_END - 1.4, 2.9], [2.9, 2.9], [2.9, Z_END - 1.2]];
  const points = [];
  corners.forEach((corner, i) => {
    const toward = (other) => {   // 從轉折處往相鄰的點退一小段，當圓角的起點和終點
      const dx = other[0] - corner[0], dz = other[1] - corner[1], length = Math.hypot(dx, dz), cut = Math.min(0.5, length / 2);
      return [corner[0] + dx / length * cut, corner[1] + dz / length * cut];
    };
    const from = toward(corners[(i + corners.length - 1) % corners.length]), to = toward(corners[(i + 1) % corners.length]);
    for (let k = 0; k <= 6; k++) {
      const t = k / 6, u = 1 - t;
      points.push([u * u * from[0] + 2 * u * t * corner[0] + t * t * to[0], u * u * from[1] + 2 * u * t * corner[1] + t * t * to[1]]);
    }
  });
  return points;
})();
const LANE_AT = [0];
LANE_POINTS.forEach((point, i) => {
  const next = LANE_POINTS[(i + 1) % LANE_POINTS.length];
  LANE_AT.push(LANE_AT[i] + Math.hypot(next[0] - point[0], next[1] - point[1]));
});
const LAP = LANE_AT[LANE_POINTS.length];
/** 車道上離 (x, z) 最近的那一點的里程。 */
function laneNear(x, z) {
  let best = { distance: Infinity, s: 0 };
  LANE_POINTS.forEach((a, i) => {   // 每一小段上離 (x, z) 最近的地方
    const c = LANE_POINTS[(i + 1) % LANE_POINTS.length], dx = c[0] - a[0], dz = c[1] - a[1], span = dx * dx + dz * dz;
    const t = span > 0 ? Math.min(1, Math.max(0, ((x - a[0]) * dx + (z - a[1]) * dz) / span)) : 0;
    const distance = Math.hypot(a[0] + dx * t - x, a[1] + dz * t - z);
    if (distance < best.distance) best = { distance, s: LANE_AT[i] + Math.sqrt(span) * t };
  });
  return best.s;
}
const CAR_SPEED = 2.2;
export const CAR_SEAT_HEIGHT = 0.68;
// 四台車：粉紅色那台一開始在街上，其他三台停在停車塔的一、二、三樓。每台車有前座和後座（離車子中心多遠）。
export const CAR_COLORS = [S.car, '#7db4ec', '#f8d15c', '#8fd6a0'];
export const CAR_SEATS = [0.2, -0.45];
const TOWER_DOOR = toArm(-4.0, 0.75);   // 停車塔的車道口
/** 從停車塔開出來的車，從車道口前面的車道開始開。 */
export const laneStart = () => laneNear(2.9, TOWER_DOOR.z);

/** 車子開了 s 這麼遠時在哪裡。 */
function lanePoint(s) {
  const d = ((s % LAP) + LAP) % LAP;
  let i = 0;
  while (LANE_AT[i + 1] <= d) i++;
  const a = LANE_POINTS[i], c = LANE_POINTS[(i + 1) % LANE_POINTS.length], span = LANE_AT[i + 1] - LANE_AT[i];
  const t = span > 0 ? (d - LANE_AT[i]) / span : 0;
  return [a[0] + (c[0] - a[0]) * t, a[1] + (c[1] - a[1]) * t];
}

/** 敞篷小車：獨立的網格，有人坐上去就會開。車頭朝 +x。 */
export function carModel(group, hex) {
  const b = new Builder();
  b.rbox(1.7, 0.42, 0.9, hex, 0, 0.42, 0, { r: 0.12 });
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

/** 每一格更新街上的車：車上有人就往前開；座位跟著車走。不在街上的車（away，開進停車塔了）收起來。回傳這一格有沒有車在動。 */
export function driveCars(place, dt) {
  let anyMoving = false;
  for (const car of place.vehicles) {
    car.mesh.visible = !car.away;
    for (const seat of car.seats) seat.away = car.away;
    if (car.away) continue;
    const moving = car.seats.some((seat) => seat.occupant);
    if (moving) car.s += CAR_SPEED * dt;
    anyMoving = anyMoving || moving;
    const [x, z] = lanePoint(car.s), [ax, az] = lanePoint(car.s + 0.05);
    const heading = Math.atan2(-(az - z), ax - x);
    car.mesh.position.set(x, moving ? Math.abs(Math.sin(car.s * 6)) * 0.015 : 0, z);
    car.mesh.rotation.y = heading;
    for (const seat of car.seats) {
      seat.x = x + seat.along * Math.cos(heading);
      seat.z = z - seat.along * Math.sin(heading);
      seat.facing = heading + Math.PI / 2;
      seat.marker.position.set(seat.x, 0.95, seat.z);
    }
  }
  return anyMoving;
}

export function buildStreet(scene) {
  const b = new Builder();
  ground(b);
  // 後排：蓋的時候整棟平移過去，門口的位置跟著移
  const moved = (dx, front) => { let door; b.at(dx, 0, 0, 0, () => { door = front(b); }); return { ...door, x: door.x + dx }; };
  // 左排：整棟轉 90 度、正面朝右，門口的位置跟著轉
  const turned = (dx, front) => {
    let door;
    b.at(0, 0, ARM_Z, Math.PI / 2, () => b.at(dx, 0, 0, 0, () => { door = front(b); }));
    return { ...door, ...toArm(door.x + dx, door.z) };
  };
  const hospitalDoor = turned(0, hospitalTower);
  const parkDoor = turned(0, parkingTower);
  const deptDoor = turned(MID, deptTower);
  const shopDoor = turned(MID, shopFront);
  b.at(0, 0, ARM_Z, Math.PI / 2, () => armFurniture(b));
  const dentistDoor = moved(BACK, faceHouse);
  const homeDoor = moved(BACK, homeFront);
  const toysDoor = moved(BACK, toyStall);
  const petsDoor = petFront(b);
  const kinderDoor = moved(KINDER, kinderFront);
  backFurniture(b);
  const parkSeats = park(b);
  sky(b);
  // 幼稚園前長椅的兩個位子、每一台車的前座和後座（位置每一格跟著車子更新）、公園長椅的兩個位子。
  // 順序不能動：存檔記的是第幾個座位，新的只能加在最後面
  const seats = [
    { x: BENCH_X - 0.4, z: 0.52, facing: 0, seatHeight: SEAT_HEIGHT }, { x: BENCH_X + 0.4, z: 0.52, facing: 0, seatHeight: SEAT_HEIGHT },
    ...CAR_COLORS.flatMap((hex, car) => CAR_SEATS.map((along) => ({ x: 0, z: 0, facing: 0, seatHeight: CAR_SEAT_HEIGHT, pose: 'drive', along, car }))),
    ...parkSeats,
  ];
  const leftDoors = [hospitalDoor, parkDoor, deptDoor, shopDoor], backDoors = [dentistDoor, homeDoor, toysDoor, petsDoor, kinderDoor];
  const light = toArm(LIGHT_X, 1.85), lamp = toArm(LAMP_X, 1.85), shopPot = toArm(-0.35 + MID, 0.42);

  const place = finishPlace(scene, b, seats, {
    doors: [...leftDoors, ...backDoors],
    spawn: { x: 1.6, z: shopDoor.z },
    // 從屋裡出來的人站在那一棟的門外：左排的門外是門的右邊，後排的門外是門的前面
    arrive: {
      ...Object.fromEntries(leftDoors.map((door) => [door.to, { x: 1.65, z: door.z }])),
      ...Object.fromEntries(backDoors.map((door) => [door.to, { x: door.x, z: 1.65 }])),
    },
    view: { center: [4.7, 1.5, 2.6], height: 18.5, width: 27.5 },
    shadow: { x: 5, z: 3.5, half: 18, deep: 16 },   // 陰影要蓋得住兩排
    indoor: null,
    // 小人放不上去的圓：紅綠燈、路燈、兩張長椅、盆栽、消防栓、信箱、噴水池、公園的樹（小車會開走，不算）
    obstacles: [
      { ...light, r: 0.45 }, { ...lamp, r: 0.45 }, { ...shopPot, r: 0.5 },
      { x: BENCH_X - 0.4, z: 0.5, r: 0.5 }, { x: BENCH_X + 0.4, z: 0.5, r: 0.5 },
      { x: POT_X, z: 0.42, r: 0.5 }, { x: HYDRANT_X, z: 1.85, r: 0.4 }, { x: 5.75 + BACK, z: 0.5, r: 0.4 },
      { x: PARK.fountain[0], z: PARK.fountain[1], r: 1.05 }, { x: -2.6, z: -2.6, r: 0.5 }, { x: 0.4, z: -2.6, r: 0.4 },
      ...parkSeats.map((seat) => ({ x: seat.x, z: seat.z, r: 0.5 })), { x: -2.6, z: 0.95, r: 0.35 },
    ],
    // 小人能站的範圍：後排和左排的人行道與馬路、轉角的公園
    areas: [
      { minX: 1.0, maxX: X_END - 0.6, minZ: 0.95, maxZ: 4.3 },
      { minX: 0.95, maxX: 4.3, minZ: 1.0, maxZ: Z_END - 0.5 },
      { minX: -2.8, maxX: 1.0, minZ: -2.8, maxZ: 1.0 },
    ],
  });
  // 街上的車：s 是沿著車道開了多遠。粉紅色那台一開始停在醫院前面的路旁；其他三台在停車塔裡
  place.vehicles = CAR_COLORS.map((hex, id) => ({
    kind: 'car', id, street: true, mesh: carModel(place.group, hex), seats: place.chairs.filter((chair) => chair.car === id),
    s: laneNear(2.9, hospitalDoor.z), away: id > 0,
  }));
  driveCars(place, 0);
  return place;
}
