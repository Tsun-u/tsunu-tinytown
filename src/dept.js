// 百貨公司：街上左邊第二棟高樓，四層。地下室是超市，一樓服飾店，二樓兒童遊戲區和書店，三樓美食街。
// 樓層之間搭手扶梯，一次走一層：靠後牆那台往上，地板開口裡那台往下。
// 場景設定：白天的百貨公司。每層一個主色（超市綠、服飾紫、遊戲區黃、美食街橘），手扶梯和欄杆是銀色。
// 座標和剖開方式跟點心店一樣（見 shop.js）。樓上的地板底下看得到大樓外牆，地下室底下是土。
import * as THREE from 'three';
import { Builder } from './builder.js';
import { C, RAINBOW, SEAT_HEIGHT, VIEW, walls, lamps, chair, table, plate, pot, finishPlace } from './shop.js';
import { steamPuffs } from './home.js';

const D = {
  tower: '#c9b6e4', steel: '#c5ced8', steelDark: '#9aa6b3', step: '#6d6875', soil: '#b98a62', soilDark: '#9c7350', cloud: '#ffffff',
  green: '#9bd69a', greenDark: '#7cc788', lilac: '#c9b6e4', lilacDark: '#ae98d0', sun: '#f8d98a', sunDark: '#e9c46a', peach: '#f7b89a', peachDark: '#ec9d7c',
};
const FLOORS = ['dept0', 'dept1', 'dept2', 'dept3'];   // 由下往上
const HOLE = { x0: 0.5, x1: 3.0, z0: -2.0, z1: -1.0 };  // 往下那台手扶梯的地板開口
const UP = { x0: 3.0, x1: 0.5, rise: 2.2, z: -2.5 };    // 往上那台：從右邊的地板升到左邊的平台
const DOWN_DROP = 2.0;

/** 一塊平板；有 hole 的話切成四片，中間留一個開口。 */
function slab(b, hex, y, h, x0, x1, z0, z1, hole) {
  const piece = (ax, bx, az, bz) => { if (bx - ax > 0.01 && bz - az > 0.01) b.box(bx - ax, h, bz - az, hex, (ax + bx) / 2, y, (az + bz) / 2); };
  if (!hole) { piece(x0, x1, z0, z1); return; }
  piece(x0, hole.x0, z0, z1);
  piece(hole.x1, x1, z0, z1);
  piece(hole.x0, hole.x1, z0, hole.z0);
  piece(hole.x0, hole.x1, hole.z1, z1);
}

function tiles(b, a, c, hole) {
  for (let ix = 0; ix < 16; ix++) for (let iz = 0; iz < 12; iz++) {
    const x = -3.75 + ix * 0.5, z = -2.75 + iz * 0.5;
    if (hole && x > hole.x0 && x < hole.x1 && z > hole.z0 && z < hole.z1) continue;
    b.box(0.495, 0.06, 0.495, (ix + iz) % 2 ? a : c, x, 0.03, z);
  }
}

/** 地板開口的內壁和底，從上面看下去是暗的。 */
function pit(b) {
  const { x0, x1, z0, z1 } = HOLE;
  b.box(0.08, 2.4, z1 - z0, C.dark, x0 - 0.04, -1.2, (z0 + z1) / 2);
  b.box(x1 - x0, 2.4, 0.08, C.dark, (x0 + x1) / 2, -1.2, z0 - 0.04);
  b.box(x1 - x0, 0.08, z1 - z0, C.dark, (x0 + x1) / 2, -2.36, (z0 + z1) / 2);
  // 開口前面和右邊的欄杆
  for (let x = x0; x <= x1 + 0.01; x += 0.5) b.box(0.05, 0.5, 0.05, D.steelDark, x, 0.3, z1 + 0.04);
  b.box(x1 - x0 + 0.1, 0.05, 0.07, D.steelDark, (x0 + x1) / 2, 0.56, z1 + 0.04);
  for (let z = z0; z <= z1 + 0.01; z += 0.5) b.box(0.05, 0.5, 0.05, D.steelDark, x1 + 0.04, 0.3, z);
  b.box(0.07, 0.05, z1 - z0 + 0.1, D.steelDark, x1 + 0.04, 0.56, (z0 + z1) / 2);
}

/** 一樓的地面：底座（留手扶梯的開口）、門外的人行道和馬路。 */
function streetGround(b, a, c) {
  slab(b, C.baseDark, -0.42, 0.5, -5.6, 5.6, -3.9, 6.3, HOLE);
  slab(b, C.base, -0.13, 0.26, -5.45, 5.45, -3.75, 6.15, HOLE);
  tiles(b, a, c, HOLE);
  for (let ix = 0; ix < 10; ix++) for (let iz = 0; iz < 2; iz++) b.box(0.97, 0.06, 0.97, (ix + iz) % 2 ? C.tileA : C.tileB, -4.5 + ix, 0.03, 3.6 + iz);
  b.rbox(10.2, 0.14, 0.26, C.cream, 0, 0.04, 5.25, { r: 0.05 });
  b.box(10.2, 0.04, 0.7, C.road, 0, 0.01, 5.75);
  for (let i = 0; i < 6; i++) b.box(0.7, 0.02, 0.1, C.white, -4.2 + i * 1.7, 0.04, 5.78);
  b.box(1.0, 0.07, 6.6, C.leaf, -4.85, 0.02, -0.3);
  b.box(1.0, 0.07, 6.6, C.leaf, 4.85, 0.02, -0.3);
}

/** 樓上的地面：地板底下是大樓外牆和窗戶，前面是陽台，旁邊有雲（越高越多）。 */
function upstairsGround(b, a, c, clouds) {
  slab(b, C.cream2, -0.15, 0.3, -4.5, 4.5, -3.4, 4.6, HOLE);
  b.box(8.6, 2.2, 0.2, D.tower, 0, -1.4, 4.3);
  b.box(0.2, 2.2, 7.6, D.tower, 4.2, -1.4, 0.6);
  for (let i = 0; i < 6; i++) b.box(0.7, 0.8, 0.05, C.glass, -3.3 + i * 1.3, -1.2, 4.41);
  for (let i = 0; i < 5; i++) b.box(0.05, 0.8, 0.7, C.glass, 4.31, -1.2, -2.2 + i * 1.3);
  tiles(b, a, c, HOLE);
  b.box(8.2, 0.06, 1.3, C.tileA, 0, 0.03, 3.72);
  for (let i = 0; i < 12; i++) b.box(0.06, 0.7, 0.06, C.white, -4.0 + i * 0.73, 0.4, 4.3);
  b.rbox(8.3, 0.08, 0.1, C.white, 0, 0.78, 4.3, { r: 0.03 });
  for (const [x, y, z] of [[5.6, -1.0, 2.6], [-5.4, -0.2, 4.6], [5.9, 1.4, -1.5], [-5.6, 1.8, 1.0]].slice(0, clouds)) {
    b.ball(0.5, D.cloud, x, y, z, { glow: true });
    b.ball(0.38, D.cloud, x - 0.55, y - 0.08, z, { glow: true });
    b.ball(0.4, D.cloud, x + 0.55, y - 0.06, z, { glow: true });
  }
}

/** 地下室的地面：地板底下和旁邊是土，土裡有石頭、一根骨頭和水管。 */
function basementGround(b, a, c) {
  slab(b, C.cream2, -0.15, 0.3, -4.5, 4.5, -3.4, 4.6);
  b.box(9.4, 2.4, 0.5, D.soil, 0, -1.5, 4.55);
  b.box(0.5, 2.4, 8.4, D.soil, 4.45, -1.5, 0.6);
  for (const [x, y, r] of [[-3.2, -1.0, 0.22], [-1.0, -1.9, 0.3], [1.4, -1.2, 0.18], [3.0, -2.0, 0.26]]) b.ball(r, D.soilDark, x, y, 4.76, { sz: 0.4 });
  for (const [z, y, r] of [[-2.0, -1.4, 0.24], [0.4, -2.0, 0.2], [2.6, -1.1, 0.28]]) b.ball(r, D.soilDark, 4.66, y, z, { sx: 0.4 });
  b.box(0.5, 0.1, 0.04, C.cream, 0.2, -1.5, 4.82, { rz: 0.4 });   // 骨頭
  for (const dx of [-0.24, 0.24]) b.ball(0.08, C.cream, 0.2 + dx, -1.5 + dx * 0.42, 4.82);
  b.cyl(0.12, 0.12, 3.0, D.steelDark, 4.74, -1.7, 1.0, { seg: 10, rx: Math.PI / 2 });   // 水管
  tiles(b, a, c);
  for (const [x, y, hex] of [[-3.3, 0.28, C.wood], [-2.6, 0.28, C.woodDark], [-2.95, 0.8, C.wood]]) b.rbox(0.6, 0.5, 0.6, hex, x, y, 3.9, { r: 0.03 });   // 前面堆著進貨的箱子
}

/** 樓上沒有大門：把前牆留給門的缺口補上矮牆。 */
function closeDoorGap(b, hex) {
  b.rbox(2.0, 0.3, 0.22, hex, -2.95, 0.15, 3.05, { r: 0.04 });
}

/** 手扶梯不會動的部分：斜的機身和兩側扶手。從 (x0, y0) 到 (x1, y1)，寬 w。 */
function escalatorBody(b, x0, y0, x1, y1, z, w) {
  const length = Math.hypot(x1 - x0, y1 - y0), angle = Math.atan2(y1 - y0, x1 - x0);
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  b.box(length, 0.26, w, D.steel, cx, cy - 0.05, z, { rz: angle });
  // 靠牆那一側是整片玻璃和扶手；靠鏡頭這一側只留矮矮的一條，才看得到階梯在動
  b.box(length, 0.5, 0.05, C.glass, cx, cy + 0.36, z - (w / 2 - 0.03), { rz: angle });
  b.box(length + 0.1, 0.06, 0.09, C.dark, cx, cy + 0.64, z - (w / 2 - 0.03), { rz: angle });
  b.box(length, 0.16, 0.05, D.steelDark, cx, cy + 0.14, z + (w / 2 - 0.03), { rz: angle });
}

/** 箭頭牌：白底，綠色往上或橘色往下。面向 +z。 */
function arrowSign(b, x, y, z, up) {
  b.rbox(0.5, 0.6, 0.06, C.white, x, y, z, { r: 0.05 });
  const hex = up ? '#4fc878' : '#f59a3c', dir = up ? 1 : -1;
  b.box(0.1, 0.22, 0.03, hex, x, y - dir * 0.1, z + 0.04, { glow: true });
  b.cyl(0, 0.18, 0.22, hex, x, y + dir * 0.1, z + 0.04, { seg: 4, rz: up ? 0 : Math.PI, glow: true });
}

/** 往上的手扶梯：靠後牆，頂端有一小塊平台。 */
function upEscalator(b) {
  escalatorBody(b, UP.x0, 0, UP.x1, UP.rise, UP.z, 0.8);
  b.box(0.7, 0.14, 0.86, D.steel, UP.x1 - 0.3, UP.rise - 0.02, UP.z);
  b.box(0.6, 0.04, 0.8, D.steelDark, UP.x0 + 0.3, 0.08, UP.z);   // 入口的踏板
  arrowSign(b, UP.x0 + 0.45, 2.3, -2.96, true);
}

/** 往下的手扶梯：在地板開口裡。 */
function downEscalator(b) {
  pit(b);
  escalatorBody(b, HOLE.x0, 0, HOLE.x1, -DOWN_DROP, -1.5, 0.9);
  b.box(0.05, 1.2, 0.05, D.steelDark, 0.25, 0.6, -0.85);
  arrowSign(b, 0.25, 1.3, -0.85, false);
}

/** 手扶梯上會動的階梯。回傳給 moveEscalators 用的資料。 */
function steps(group, from, to, width) {
  const geometry = new THREE.BoxGeometry(0.3, 0.07, width), material = new THREE.MeshLambertMaterial({ color: D.step });
  const meshes = [];
  for (let i = 0; i < 9; i++) { const mesh = new THREE.Mesh(geometry, material); group.add(mesh); meshes.push(mesh); }
  return { meshes, from, to };
}

/** 每一格把手扶梯的階梯沿著斜面往前送。 */
export function moveEscalators(place, time) {
  for (const { meshes, from, to } of place.escalators) {
    meshes.forEach((mesh, i) => {
      const t = (time * 0.22 + i / meshes.length) % 1;
      mesh.position.set(from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t, from[2]);
    });
  }
}

/** 把一層樓收成一個地方：加上往上、往下的手扶梯門口，以及搭手扶梯到這一層的人站的位置。 */
function finishFloor(scene, b, level, seats, data) {
  const below = FLOORS[level - 1], above = FLOORS[level + 1];
  const doors = [...(data.doors || [])], arrive = { ...(data.arrive || {}) }, areas = [...data.areas];
  if (above) {
    doors.push({ x: UP.x0 + 0.45, z: UP.z + 0.1, to: above, r: 0.6, markerY: 0.16 });   // 圈放在入口踏板上面
    arrive[above] = { x: 3.5, z: -1.4 };                       // 從樓上下來的人，站在手扶梯右邊
    areas.push({ minX: 3.15, maxX: 3.6, minZ: -1.9, maxZ: -0.6 });
  }
  if (below) {
    doors.push({ x: HOLE.x0 - 0.45, z: -1.5, to: below, r: 0.6 });
    arrive[below] = { x: -0.35, z: -0.55 };                    // 從樓下上來的人，站在開口左前方；離往下的門口夠遠，原地放下不會又被送下樓
  }
  const place = finishPlace(scene, b, seats, { ...data, doors, arrive, areas });
  place.escalators = [];
  if (above) place.escalators.push(steps(place.group, [UP.x0, 0.14, UP.z], [UP.x1, UP.rise + 0.14, UP.z], 0.66));
  if (below) place.escalators.push(steps(place.group, [HOLE.x0, 0.14, -1.5], [HOLE.x1, -DOWN_DROP + 0.14, -1.5], 0.76));
  return place;
}

/** 靠左牆的一長排貨架，商品朝店內。make(i, row) 回傳要放的商品顏色。 */
function wallShelf(b, books) {
  b.rbox(0.5, 1.95, 3.5, C.white, -3.68, 0.98, 0.3, { r: 0.03 });
  [0.38, 0.98, 1.58].forEach((y, row) => {
    b.box(0.46, 0.05, 3.4, C.cream2, -3.6, y - 0.06, 0.3);
    for (let i = 0; i < 11; i++) {
      const z = -1.25 + i * 0.31, hex = RAINBOW[(i + row * 2) % 6];
      if (books) b.box(0.3, 0.36 + (i % 3) * 0.05, 0.2, hex, -3.5, y + 0.18 + (i % 3) * 0.025, z, { rx: i % 5 === 4 ? 0.2 : 0 });
      else if ((i + row) % 3 === 0) b.cyl(0.1, 0.1, 0.3, hex, -3.48, y + 0.13, z, { seg: 10 });
      else b.rbox(0.24, 0.26 + (i % 2) * 0.1, 0.22, hex, -3.48, y + 0.11 + (i % 2) * 0.05, z, { r: 0.03 });
    }
  });
}

/** 收銀櫃台，上面有收銀機。店員站在櫃台後面。 */
function counter(b, x, z, hex) {
  b.rbox(1.6, 0.88, 0.6, hex, x, 0.44, z, { r: 0.05 });
  b.rbox(1.7, 0.08, 0.7, C.cream, x, 0.92, z, { r: 0.03 });
  b.rbox(0.42, 0.24, 0.36, C.dark, x + 0.45, 1.08, z, { r: 0.04 });
  b.rbox(0.36, 0.26, 0.05, C.glass, x + 0.45, 1.33, z - 0.12, { rx: -0.35, r: 0.02 });
}

// ---------- 地下室：超市 ----------
function cart(b, x, z) {
  b.at(x, 0, z, 0, () => {
    b.box(0.6, 0.05, 0.8, D.steel, 0, 0.42, 0);
    for (const sx of [-1, 1]) b.box(0.04, 0.4, 0.8, D.steel, sx * 0.3, 0.64, 0);
    b.box(0.6, 0.4, 0.04, D.steel, 0, 0.64, 0.4);
    b.box(0.6, 0.4, 0.04, D.steel, 0, 0.64, -0.4);
    b.box(0.7, 0.06, 0.06, C.red, 0, 0.98, -0.5);
    for (const sx of [-1, 1]) {
      b.box(0.04, 0.2, 0.14, D.steelDark, sx * 0.3, 0.9, -0.45);
      for (const sz of [-1, 1]) {
        b.box(0.04, 0.36, 0.04, D.steelDark, sx * 0.26, 0.24, sz * 0.32);
        b.ball(0.07, C.dark, sx * 0.26, 0.07, sz * 0.32);
      }
    }
  });
  return { x, z, facing: 0, seatHeight: 0.5 };
}

function market(b) {
  wallShelf(b, false);
  // 後牆的冷凍櫃，裡面是一桶一桶的冰淇淋
  b.rbox(2.6, 0.85, 0.75, C.white, -2.2, 0.43, -2.55, { r: 0.05 });
  b.box(2.4, 0.04, 0.6, C.glass, -2.2, 0.87, -2.55);
  [C.pink, C.choco, C.yellow, C.mint, C.lilac, C.white].forEach((hex, i) => b.cyl(0.14, 0.14, 0.08, hex, -3.2 + i * 0.4, 0.84, -2.55, { seg: 10 }));
  b.rbox(2.2, 0.5, 0.06, C.white, -2.2, 2.2, -2.97, { r: 0.05 });   // 牆上的牌子：一排水果
  [C.red, C.orange, C.yellow, C.green, C.lilac].forEach((hex, i) => b.ball(0.13, hex, -3.0 + i * 0.4, 2.2, -2.93, { sz: 0.3 }));
  // 中間的蔬果台：四個斜放的木箱
  const cx = -1.4, cz = 0.7;
  b.rbox(1.7, 0.5, 1.3, D.greenDark, cx, 0.25, cz, { r: 0.05 });
  [[-0.42, -0.3, C.red], [0.42, -0.3, C.orange], [-0.42, 0.34, C.yellow], [0.42, 0.34, C.green]].forEach(([dx, dz, hex]) => {
    b.rbox(0.76, 0.2, 0.56, C.wood, cx + dx, 0.6, cz + dz, { r: 0.03, rx: 0.2 });
    for (let i = 0; i < 6; i++) b.ball(0.11, hex, cx + dx - 0.24 + (i % 3) * 0.24, 0.76 - Math.floor(i / 3) * 0.05, cz + dz - 0.12 + Math.floor(i / 3) * 0.24);
  });
  // 右前方堆成小山的西瓜
  for (const [dx, dz, y] of [[0, 0, 0.2], [0.42, 0.05, 0.2], [0.2, 0.4, 0.2], [0.2, 0.15, 0.52]]) b.ball(0.22, C.greenDark, 3.1 + dx, y + 0.06, 2.0 + dz, { sy: 0.9 });
  counter(b, 1.6, 1.3, D.greenDark);
  b.box(0.9, 0.03, 0.4, C.dark, 1.25, 0.975, 1.3);                  // 結帳的輸送帶和上面的東西
  b.rbox(0.2, 0.22, 0.16, C.orange, 1.05, 1.1, 1.3, { r: 0.03 });
  b.ball(0.09, C.red, 1.35, 1.08, 1.3);
  return [cart(b, 0.1, 2.0), cart(b, 0.1, 0.5)];
}

export function buildDept0(scene) {
  const b = new Builder();
  basementGround(b, '#f1f7ee', '#dcebd6');
  walls(b, { wainscot: D.green, slat: D.greenDark, eave: D.green, curtain: C.white, windowZ: 0.3 });
  lamps(b);
  closeDoorGap(b, D.green);
  upEscalator(b);
  const carts = market(b);
  return finishFloor(scene, b, 0, carts, {
    spawn: { x: 3.5, z: -1.4 },
    view: { center: [0, 1.2, 0.8], height: 13.6, width: 16 },
    underground: true,
    // 小人放不上去的圓：蔬果台、櫃台、購物車、西瓜堆
    obstacles: [{ x: -1.4, z: 0.7, r: 1.1 }, { x: 1.6, z: 1.3, r: 0.95 }, { x: 0.1, z: 2.0, r: 0.5 }, { x: 0.1, z: 0.5, r: 0.5 }, { x: 3.3, z: 2.2, r: 0.6 }],
    areas: [{ minX: -3.0, maxX: 3.6, minZ: -0.9, maxZ: 2.6 }, { minX: -0.6, maxX: 2.6, minZ: -1.9, maxZ: -0.9 }],
  });
}

// ---------- 一樓：服飾店 ----------
function entrance(b) {
  for (const x of [-3.72, -2.08]) b.rbox(0.2, 2.6, 0.2, C.white, x, 1.3, 3.05, { r: 0.04 });
  b.rbox(1.9, 0.22, 0.26, C.white, -2.9, 2.62, 3.05, { r: 0.04 });
  for (let i = 0; i < 5; i++) b.rbox(0.42, 0.08, 0.85, i % 2 ? C.cream : D.lilac, -3.74 + i * 0.42, 2.72, 3.42, { rx: 0.42, r: 0.03 });
  b.rbox(0.08, 2.2, 0.82, C.white, -3.9, 1.15, 2.52, { r: 0.03 });
  b.box(0.03, 1.5, 0.6, C.glass, -3.85, 1.25, 2.52);
  b.rbox(1.2, 0.04, 0.6, D.lilac, -2.9, 0.07, 3.55, { r: 0.02 });
  bag(b, -2.9, 2.0, 3.12, C.pink);                                  // 門上掛的購物袋招牌
  for (const x of [-0.9, 1.1, 3.1]) for (let i = 0; i < 5; i++) b.ball(0.16, i % 2 ? C.green : C.greenDark, x - 0.44 + i * 0.22, 0.46, 3.05, { sy: 0.8 });
  pot(b, -4.35, 3.65, D.lilac);
  pot(b, -1.65, 3.5, C.pink);
}

function bag(b, x, y, z, hex) {
  b.rbox(0.44, 0.44, 0.1, hex, x, y, z, { r: 0.04 });
  b.box(0.04, 0.16, 0.03, C.white, x - 0.1, y + 0.28, z);
  b.box(0.04, 0.16, 0.03, C.white, x + 0.1, y + 0.28, z);
  b.box(0.24, 0.04, 0.03, C.white, x, y + 0.36, z);
}

/** 人形模特兒：圓台上兩個穿洋裝的假人。 */
function mannequins(b, x, z) {
  b.cyl(0.85, 0.85, 0.14, C.white, x, 0.07, z, { seg: 24 });
  [[-0.34, C.red, C.yellow], [0.34, C.blue, C.pink]].forEach(([dx, dress, hat]) => {
    b.cyl(0.03, 0.03, 0.5, D.steelDark, x + dx, 0.39, z, { seg: 6 });
    b.cyl(0.14, 0.3, 0.6, dress, x + dx, 0.9, z, { seg: 12 });
    b.cyl(0.16, 0.14, 0.34, dress, x + dx, 1.34, z, { seg: 12 });
    b.ball(0.15, C.cream2, x + dx, 1.68, z);
    b.cyl(0.26, 0.26, 0.03, hat, x + dx, 1.8, z, { seg: 14 });
    b.cyl(0.13, 0.15, 0.12, hat, x + dx, 1.87, z, { seg: 12 });
  });
}

function boutique(b) {
  // 左牆的衣架：一根橫桿掛滿衣服
  for (const z of [-1.3, 1.9]) b.box(0.06, 1.6, 0.06, D.steelDark, -3.5, 0.8, z);
  b.box(0.05, 0.05, 3.3, D.steelDark, -3.5, 1.58, 0.3);
  for (let i = 0; i < 10; i++) {
    const z = -1.1 + i * 0.31, hex = RAINBOW[(i * 5) % 6];
    b.box(0.5, 0.5 + (i % 3) * 0.14, 0.07, hex, -3.5, 1.24 - (i % 3) * 0.07, z);
    b.box(0.3, 0.05, 0.03, C.dark, -3.5, 1.53, z);
  }
  // 後牆的層架：摺好的衣服、帽子、包包
  for (const y of [1.0, 1.6, 2.2]) b.rbox(1.5, 0.06, 0.4, C.white, -3.1, y, -2.8, { r: 0.02 });
  for (let i = 0; i < 4; i++) for (let k = 0; k < 2; k++) b.rbox(0.3, 0.1, 0.3, RAINBOW[(i + k * 2) % 6], -3.65 + i * 0.36, 1.08 + k * 0.1, -2.8, { r: 0.03 });
  [C.yellow, C.pink, C.blue].forEach((hex, i) => {
    b.cyl(0.2, 0.2, 0.03, hex, -3.55 + i * 0.46, 1.65, -2.8, { seg: 14 });
    b.cyl(0.1, 0.12, 0.12, hex, -3.55 + i * 0.46, 1.72, -2.8, { seg: 12 });
  });
  [C.red, C.mint, C.lilac].forEach((hex, i) => bag(b, -3.55 + i * 0.46, 2.45, -2.8, hex));
  b.rbox(1.5, 0.9, 0.5, D.lilac, -3.1, 0.45, -2.74, { r: 0.04 });
  // 試衣間：三面隔板和裡面的鏡子，簾子另外做（見 curtain）
  // 右邊和上面只留細框：鏡頭從右前方看，整片隔板會把裡面的人擋住
  b.rbox(0.08, 2.2, 1.0, C.white, -2.1, 1.1, -2.48, { r: 0.03 });
  b.box(0.06, 2.15, 0.06, C.white, -0.85, 1.08, -2.0);
  b.box(0.06, 0.06, 1.0, C.white, -0.85, 2.13, -2.48);
  b.rbox(0.8, 1.5, 0.05, D.steel, -1.475, 1.1, -2.94, { r: 0.03 });
  b.box(0.68, 1.38, 0.03, C.glass, -1.475, 1.1, -2.92);
  b.box(1.25, 0.05, 0.05, D.steelDark, -1.475, 2.1, -2.0);
  mannequins(b, -1.3, 1.2);
  counter(b, 1.7, 1.4, D.lilacDark);
  bag(b, 1.15, 1.2, 1.4, C.yellow);
  // 前面的展示桌：鞋子和帽子
  b.rbox(1.3, 0.5, 0.7, C.white, 0.4, 0.25, 2.3, { r: 0.05 });
  [C.red, C.blue, C.yellow, C.green].forEach((hex, i) => {
    b.rbox(0.14, 0.1, 0.3, hex, -0.05 + i * 0.3, 0.56, 2.3, { r: 0.04 });
    b.rbox(0.14, 0.12, 0.14, hex, -0.05 + i * 0.3, 0.64, 2.22, { r: 0.04 });
  });
  // 右邊兩張等人的小沙發凳
  const poufs = [0.2, 1.0].map((z) => {
    b.cyl(0.3, 0.32, SEAT_HEIGHT, C.pink, 3.4, SEAT_HEIGHT / 2, z, { seg: 16 });
    b.cyl(0.31, 0.31, 0.05, C.cream, 3.4, SEAT_HEIGHT, z, { seg: 16 });
    return { x: 3.4, z, facing: -Math.PI / 2, seatHeight: SEAT_HEIGHT + 0.02 };
  });
  return [{ x: -1.475, z: -2.45, facing: 0, seatHeight: 0, pose: 'change' }, ...poufs];
}

/** 試衣間的簾子：平常收在左邊，有人在裡面換衣服時拉上。 */
function curtain(group) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.9, 0.05), new THREE.MeshLambertMaterial({ color: '#f29bc0' }));
  mesh.castShadow = true;
  group.add(mesh);
  setCurtain(mesh, 0);
  return mesh;
}

export function setCurtain(mesh, closed) {
  mesh.userData.closed = closed;
  const width = 0.22 + closed * 0.98;
  mesh.scale.x = width / 1.2;
  mesh.position.set(-2.06 + width / 2, 1.12, -2.0);
}

export function buildDept1(scene) {
  const b = new Builder();
  streetGround(b, '#f8f3fb', '#ebe1f4');
  walls(b, { wainscot: D.lilac, slat: D.lilacDark, eave: D.lilac, curtain: C.pink, windowZ: 0.3 });
  lamps(b);
  entrance(b);
  upEscalator(b);
  downEscalator(b);
  const seats = boutique(b);
  const place = finishFloor(scene, b, 1, seats, {
    doors: [{ x: -2.9, z: 3.4, to: 'street' }],
    spawn: { x: -1.0, z: 4.5 },
    view: VIEW,
    // 小人放不上去的圓：模特兒、櫃台、展示桌、沙發凳、門外的盆栽
    obstacles: [
      { x: -1.3, z: 1.2, r: 0.95 }, { x: 1.7, z: 1.4, r: 0.95 }, { x: 0.4, z: 2.3, r: 0.75 }, { x: 3.4, z: 0.2, r: 0.45 }, { x: 3.4, z: 1.0, r: 0.45 },
      { x: -4.35, z: 3.65, r: 0.5 }, { x: -1.65, z: 3.5, r: 0.5 },
    ],
    areas: [{ minX: -2.9, maxX: 3.6, minZ: -0.6, maxZ: 2.6 }, { minX: -2.9, maxX: -0.6, minZ: -1.6, maxZ: -0.6 }, { minX: -4.4, maxX: 4.5, minZ: 3.5, maxZ: 4.85 }],
  });
  place.chairs.find((c) => c.pose === 'change').curtain = curtain(place.group);
  return place;
}

// ---------- 二樓：兒童遊戲區和書店 ----------
/** 投幣搖搖車：獨立的網格，有人坐上去會搖。kind 是 'rocket' 或 'car'。 */
function coinRide(group, x, z, kind) {
  const ride = new THREE.Group();
  ride.position.set(x, 0, z);
  const part = (geometry, color, px, py, pz, rx = 0) => {
    const mesh = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({ color }));
    mesh.position.set(px, py, pz);
    mesh.rotation.x = rx;
    mesh.castShadow = true;
    ride.add(mesh);
  };
  if (kind === 'rocket') {
    part(new THREE.CylinderGeometry(0.26, 0.26, 1.0, 12), '#ffffff', 0, 0.5, 0, Math.PI / 2);
    part(new THREE.ConeGeometry(0.26, 0.4, 12), C.red, 0, 0.5, 0.7, Math.PI / 2);
    for (const sx of [-1, 1]) part(new THREE.BoxGeometry(0.06, 0.4, 0.4), C.red, sx * 0.28, 0.42, -0.4);
    part(new THREE.CylinderGeometry(0.1, 0.1, 0.05, 10), C.blue, 0, 0.74, 0.3);
  } else {
    part(new THREE.BoxGeometry(0.6, 0.3, 1.0), C.blue, 0, 0.42, 0);
    part(new THREE.BoxGeometry(0.5, 0.22, 0.3), C.blue, 0, 0.62, 0.32);
    part(new THREE.BoxGeometry(0.44, 0.16, 0.03), C.glass, 0, 0.7, 0.18);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) part(new THREE.CylinderGeometry(0.14, 0.14, 0.1, 10).rotateZ(Math.PI / 2), C.dark, sx * 0.32, 0.3, sz * 0.32);
    for (const sx of [-1, 1]) part(new THREE.SphereGeometry(0.06, 7, 5), '#fff2a8', sx * 0.2, 0.46, 0.5);
  }
  group.add(ride);
  return ride;
}

function playZone(b) {
  // 搖搖車的底座和投幣箱
  const rides = [{ x: 1.0, z: 1.5, kind: 'rocket' }, { x: 2.5, z: 1.9, kind: 'car' }];
  for (const { x, z } of rides) {
    b.cyl(0.6, 0.66, 0.2, D.sunDark, x, 0.1, z, { seg: 18 });
    b.rbox(0.2, 0.7, 0.2, C.red, x + 0.6, 0.35, z - 0.45, { r: 0.04 });
    b.box(0.08, 0.02, 0.03, C.dark, x + 0.6, 0.55, z - 0.34);
  }
  // 彈跳床
  b.cyl(0.75, 0.75, 0.1, C.blue, -0.1, 0.11, 0.7, { seg: 22 });
  b.cyl(0.6, 0.6, 0.11, C.dark, -0.1, 0.112, 0.7, { seg: 22 });
  // 夾娃娃機：左前方靠牆
  const mz = 2.52;
  b.rbox(0.8, 0.8, 0.8, C.pink, -3.4, 0.4, mz, { r: 0.05 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box(0.05, 0.8, 0.05, C.white, -3.4 + sx * 0.37, 1.2, mz + sz * 0.37);   // 四根柱子當玻璃櫃，才看得到裡面的娃娃
  b.box(0.74, 0.8, 0.03, C.glass, -3.4, 1.2, mz - 0.37);
  b.rbox(0.84, 0.2, 0.84, C.pink, -3.4, 1.7, mz, { r: 0.05 });
  for (const [dx, dz, hex] of [[-0.18, -0.15, C.choco], [0.15, 0.1, C.yellow], [0, 0.2, C.blue], [0.2, -0.2, C.red]]) b.ball(0.14, hex, -3.4 + dx, 0.94, mz + dz);
  b.box(0.03, 0.3, 0.03, D.steelDark, -3.35, 1.45, mz);
  b.ball(0.07, D.steelDark, -3.35, 1.28, mz);
  b.ball(0.06, C.red, -2.96, 0.7, mz + 0.2);
  const horses = rides.map(({ x, z }) => ({ x, z, facing: 0, seatHeight: 0.72, pose: 'ride' }));
  const claw = { x: -2.6, z: mz, facing: -Math.PI / 2, seatHeight: 0, pose: 'claw' };
  const trampoline = { x: -0.1, z: 0.7, facing: Math.PI / 4, seatHeight: 0, pose: 'bounce', markerY: 0.2 };
  return { seats: [...horses, claw, trampoline], rides };
}

function bookstore(b) {
  wallShelf(b, true);
  // 後牆的書櫃
  b.rbox(2.6, 2.0, 0.44, C.wood, -2.25, 1.0, -2.78, { r: 0.03 });
  [0.3, 0.9, 1.5].forEach((y, row) => {
    b.box(2.44, 0.5, 0.06, C.woodDark, -2.25, y + 0.2, -2.9);
    for (let i = 0; i < 14; i++) b.box(0.13, 0.36 + (i % 3) * 0.05, 0.26, RAINBOW[(i + row) % 6], -3.35 + i * 0.17, y + 0.14 + (i % 3) * 0.025, -2.66);
  });
  // 看書的角落：地毯、兩顆懶骨頭、放繪本的矮桌
  b.cyl(1.05, 1.05, 0.03, C.blue, -2.0, 0.075, -0.7, { seg: 26 });
  b.cyl(0.85, 0.85, 0.032, C.cream, -2.0, 0.076, -0.7, { seg: 26 });
  const bags = [[-2.6, -0.9, C.orange, Math.PI / 3], [-1.5, -1.15, C.mint, Math.PI / 6]].map(([x, z, hex, facing]) => {
    b.ball(0.4, hex, x, 0.24, z, { sy: 0.62 });
    return { x, z, facing, seatHeight: 0.34 };
  });
  b.cyl(0.3, 0.3, 0.26, C.wood, -1.95, 0.13, -0.3, { seg: 14 });
  [C.red, C.yellow].forEach((hex, i) => b.box(0.3, 0.04, 0.22, hex, -1.95, 0.29 + i * 0.04, -0.3, { ry: i * 0.5 }));
  return bags;
}

export function buildDept2(scene) {
  const b = new Builder();
  upstairsGround(b, '#fffaf0', '#f6ecd2', 2);
  walls(b, { wainscot: D.sun, slat: D.sunDark, eave: D.sun, curtain: C.blue, windowZ: 0.3 });
  lamps(b);
  closeDoorGap(b, D.sun);
  upEscalator(b);
  downEscalator(b);
  const bags = bookstore(b);
  const play = playZone(b);
  const place = finishFloor(scene, b, 2, [...bags, ...play.seats], {
    spawn: { x: -0.35, z: -0.55 },
    view: { center: [0, 1.2, 0.8], height: 13.6, width: 16 },
    // 小人放不上去的圓：搖搖車、彈跳床、夾娃娃機、懶骨頭、矮桌
    obstacles: [
      { x: 1.0, z: 1.5, r: 0.75 }, { x: 2.5, z: 1.9, r: 0.75 }, { x: -0.1, z: 0.7, r: 0.8 }, { x: -3.4, z: 2.52, r: 0.6 },
      { x: -2.6, z: -0.9, r: 0.45 }, { x: -1.5, z: -1.15, r: 0.45 }, { x: -1.95, z: -0.3, r: 0.4 },
    ],
    areas: [{ minX: -2.9, maxX: 3.6, minZ: -0.6, maxZ: 2.6 }, { minX: -3.0, maxX: -0.6, minZ: -1.9, maxZ: -0.6 }, { minX: -3.8, maxX: 3.8, minZ: 3.5, maxZ: 3.95 }],
  });
  place.chairs.filter((c) => c.pose === 'ride').forEach((c, i) => { c.rocker = coinRide(place.group, c.x, c.z, play.rides[i].kind); });
  return place;
}

// ---------- 三樓：美食街 ----------
/** 靠後牆的攤位：櫃台、條紋遮雨棚、兩根柱子。 */
function stall(b, x, hex) {
  b.rbox(1.5, 0.9, 0.6, hex, x, 0.45, -1.95, { r: 0.05 });
  b.rbox(1.6, 0.08, 0.7, C.cream, x, 0.94, -1.95, { r: 0.03 });
  for (const dx of [-0.74, 0.74]) b.box(0.07, 2.3, 0.07, C.white, x + dx, 1.15, -1.66);
  for (let i = 0; i < 4; i++) b.rbox(0.4, 0.08, 1.2, i % 2 ? C.cream : hex, x - 0.6 + i * 0.4, 2.42, -2.2, { rx: 0.22, r: 0.03 });
}

function foodCourt(b) {
  // 冰淇淋攤：甜筒招牌和一排甜筒
  stall(b, -3.1, C.pink);
  b.cyl(0.0, 0.16, 0.36, C.wood, -3.1, 2.86, -2.3, { seg: 10, rz: Math.PI });
  b.ball(0.2, C.pink, -3.1, 3.12, -2.3);
  b.ball(0.15, C.cream, -3.1, 3.36, -2.3);
  [C.pink, C.choco, C.mint].forEach((hex, i) => {
    b.cyl(0.0, 0.07, 0.18, C.wood, -3.5 + i * 0.3, 1.07, -1.85, { seg: 8, rz: Math.PI });
    b.ball(0.085, hex, -3.5 + i * 0.3, 1.2, -1.85);
  });
  // 麵攤：一鍋湯和幾個碗
  stall(b, -1.35, D.peachDark);
  b.cyl(0.2, 0.17, 0.2, D.steel, -1.6, 1.08, -1.95, { seg: 14 });
  b.cyl(0.21, 0.21, 0.03, D.steelDark, -1.6, 1.19, -1.95, { seg: 14 });
  for (const dx of [0, 0.34]) {
    b.cyl(0.13, 0.08, 0.1, C.white, -1.15 + dx, 1.03, -1.9, { seg: 12 });
    b.cyl(0.11, 0.11, 0.02, C.yellow, -1.15 + dx, 1.08, -1.9, { seg: 12 });
  }
  b.cyl(0.26, 0.2, 0.14, C.white, -1.35, 2.9, -2.3, { seg: 14 });         // 招牌：一碗麵
  b.cyl(0.24, 0.24, 0.03, C.yellow, -1.35, 2.98, -2.3, { seg: 14 });
  for (const dx of [-0.06, 0.06]) b.box(0.02, 0.4, 0.02, C.woodDark, -1.2 + dx, 3.16, -2.3, { rz: -0.5 });
  pot(b, 3.3, -2.45, D.peach, true);   // 頂樓沒有往上的手扶梯，右後方放一盆大盆栽
  // 左牆邊的飲料櫃
  b.rbox(0.6, 1.9, 1.3, C.red, -3.66, 0.95, 0.6, { r: 0.05 });
  b.box(0.04, 1.5, 1.1, C.glass, -3.35, 1.05, 0.6);
  for (let row = 0; row < 3; row++) for (let i = 0; i < 4; i++) b.cyl(0.07, 0.07, 0.26, RAINBOW[(i + row * 2) % 6], -3.42, 0.52 + row * 0.5, 0.18 + i * 0.28, { seg: 8 });
  // 四人桌和兩人桌，桌上有可以吃的蛋糕
  b.cyl(1.55, 1.55, 0.03, D.peach, 1.9, 0.075, 1.25, { seg: 30 });
  b.cyl(1.3, 1.3, 0.032, C.cream, 1.9, 0.076, 1.25, { seg: 30 });
  table(b, 1.9, 1.25, C.red, C.yellow, 0.8);
  table(b, -1.3, 1.5, C.blue, C.pink);
  return [
    { ...chair(b, 0.8, 1.25, Math.PI / 2, C.yellow), plate: plate(b, 1.35, 1.25), cake: C.pink },
    { ...chair(b, 1.9, 0.15, 0, C.blue), plate: plate(b, 1.9, 0.7), cake: C.yellow },
    { ...chair(b, 3.0, 1.25, -Math.PI / 2, C.mint), plate: plate(b, 2.45, 1.25), cake: C.choco },
    { ...chair(b, 1.9, 2.35, Math.PI, C.pink), plate: plate(b, 1.9, 1.8), cake: C.lilac },
    { ...chair(b, -2.25, 1.5, Math.PI / 2, C.orange), plate: plate(b, -1.72, 1.5), cake: C.yellow },
    { ...chair(b, -1.3, 0.55, 0, C.lilac), plate: plate(b, -1.3, 1.08), cake: C.pink },
    // 站在攤位前面：冰淇淋攤拿一支冰棒，麵攤點餐（煮好時桌上吃空的盤子補滿）
    { x: -3.1, z: -1.2, facing: Math.PI, seatHeight: 0, pose: 'treat' },
    { x: -1.35, z: -1.2, facing: Math.PI, seatHeight: 0, pose: 'cook' },
  ];
}

export function buildDept3(scene) {
  const b = new Builder();
  upstairsGround(b, '#fff6ee', '#fbe3d2', 4);
  walls(b, { wainscot: D.peach, slat: D.peachDark, eave: D.peach, curtain: C.yellow, windowZ: 2.0 });
  lamps(b);
  closeDoorGap(b, D.peach);
  downEscalator(b);
  const seats = foodCourt(b);
  const place = finishFloor(scene, b, 3, seats, {
    spawn: { x: -0.35, z: -0.55 },
    view: { center: [0, 1.2, 0.8], height: 13.6, width: 16 },
    // 小人放不上去的圓：兩張桌子
    obstacles: [{ x: 1.9, z: 1.25, r: 1.15 }, { x: -1.3, z: 1.5, r: 0.95 }],
    areas: [{ minX: -2.9, maxX: 3.6, minZ: -0.6, maxZ: 2.6 }, { minX: -3.4, maxX: -0.6, minZ: -1.2, maxZ: -0.6 }, { minX: -3.8, maxX: 3.8, minZ: 3.5, maxZ: 3.95 }],
  });
  place.chairs.find((c) => c.pose === 'cook').steam = steamPuffs(place.group, -1.6, 1.3, -1.95);
  return place;
}
