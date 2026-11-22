// 可以拿的小物品：用手指拖。拖到人身上他就拿著（狗狗用叼的），拖到桌面或地上就放下。
// 這張表是每一樣東西一開始放在哪裡（y 是桌面的高度，放地上就是 0）；之後在哪裡、被誰拿著，記在存檔裡。
// 每個一開始的位置也是一個「桌面」：別的東西拖到那附近，會放到同一個高度上。
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { Builder } from './builder.js';
import { C } from './shop.js';

export const ITEMS = [
  // 玩具店：積木桌上的三塊積木和一隻小熊
  { id: 'blockRed', kind: 'block', color: C.red, place: 'toys', x: 2.72, y: 0.56, z: 1.78 },
  { id: 'blockBlue', kind: 'block', color: C.blue, place: 'toys', x: 1.72, y: 0.56, z: 1.22 },
  { id: 'blockYellow', kind: 'block', color: C.yellow, place: 'toys', x: 1.9, y: 0.56, z: 1.98 },
  { id: 'teddy', kind: 'teddy', place: 'toys', x: 2.6, y: 0.56, z: 1.08 },
  // 醫院一樓：看診桌上的聽診器和針筒
  { id: 'stethoscope', kind: 'stethoscope', place: 'hospital', x: 1.95, y: 0.78, z: 1.0 },
  { id: 'syringe', kind: 'syringe', place: 'hospital', x: 1.42, y: 0.78, z: 0.52 },
  // 超市：蔬果台上的蘋果和香蕉，地上一顆西瓜
  { id: 'apple', kind: 'apple', place: 'dept0', x: -1.82, y: 0.86, z: 1.06 },
  { id: 'banana', kind: 'banana', place: 'dept0', x: -0.98, y: 0.88, z: 0.4 },
  { id: 'watermelon', kind: 'watermelon', place: 'dept0', x: 2.5, y: 0, z: 2.3 },
  // 幼稚園：畫畫桌上的兩本書
  { id: 'bookRed', kind: 'book', color: C.red, place: 'kinder', x: 1.62, y: 0.77, z: 0.88 },
  { id: 'bookBlue', kind: 'book', color: C.blue, place: 'kinder', x: 2.15, y: 0.77, z: 0.28 },
];

const SHAPES = {
  block(b, item) {
    b.rbox(0.26, 0.26, 0.26, item.color, 0, 0.13, 0, { r: 0.04 });
    b.cyl(0.05, 0.05, 0.03, item.color, 0, 0.27, 0, { seg: 8 });
  },
  teddy(b) {
    b.ball(0.15, C.choco, 0, 0.14, 0);
    b.ball(0.12, C.choco, 0, 0.36, 0);
    for (const dx of [-0.09, 0.09]) b.ball(0.05, C.choco, dx, 0.47, 0);
    b.ball(0.05, C.cream2, 0, 0.34, 0.1);
    for (const dx of [-0.04, 0.04]) b.ball(0.018, C.dark, dx, 0.39, 0.1);
    for (const dx of [-0.13, 0.13]) b.ball(0.055, C.choco, dx, 0.2, 0.06);
    b.rbox(0.12, 0.06, 0.03, C.red, 0, 0.26, 0.11, { r: 0.02 });   // 領結
  },
  stethoscope(b) {
    for (let i = 0; i < 8; i++) {   // 一圈管子
      const a = (i / 8) * Math.PI * 2;
      b.ball(0.035, C.dark, Math.cos(a) * 0.13, 0.04, Math.sin(a) * 0.13);
    }
    b.cyl(0.07, 0.07, 0.04, '#c5ced8', 0.13, 0.05, 0.13, { seg: 12 });
    for (const dx of [-0.05, 0.05]) b.ball(0.035, C.blue, dx - 0.12, 0.05, -0.14);
  },
  syringe(b) {
    b.cyl(0.05, 0.05, 0.26, '#eaf6fb', 0, 0.06, 0, { seg: 10, rz: Math.PI / 2 });
    b.cyl(0.04, 0.04, 0.12, '#f7a8c4', -0.04, 0.06, 0, { seg: 10, rz: Math.PI / 2 });   // 裡面的藥水
    b.cyl(0.012, 0.012, 0.12, '#c5ced8', 0.19, 0.06, 0, { seg: 6, rz: Math.PI / 2 });
    b.cyl(0.065, 0.065, 0.025, C.blue, -0.14, 0.06, 0, { seg: 10, rz: Math.PI / 2 });
    b.cyl(0.02, 0.02, 0.1, C.blue, -0.2, 0.06, 0, { seg: 6, rz: Math.PI / 2 });
    b.cyl(0.05, 0.05, 0.02, C.blue, -0.25, 0.06, 0, { seg: 10, rz: Math.PI / 2 });
  },
  apple(b) {
    b.ball(0.13, C.red, 0, 0.13, 0, { sy: 0.92 });
    b.box(0.02, 0.07, 0.02, C.woodDark, 0, 0.27, 0);
    b.ball(0.045, C.green, 0.05, 0.28, 0, { sy: 0.4 });
  },
  banana(b) {
    for (let i = 0; i < 5; i++) {   // 彎彎的一根
      const a = -0.9 + i * 0.45;
      b.ball(0.055, C.yellow, Math.sin(a) * 0.17, 0.06 + (1 - Math.cos(a)) * 0.2, 0, { sx: 1.5 });
    }
    b.ball(0.025, C.woodDark, Math.sin(-0.9) * 0.2, 0.15, 0);
  },
  watermelon(b) {
    b.ball(0.22, '#4fa56a', 0, 0.2, 0, { sx: 1.2, sy: 0.92 });
    for (const dz of [-0.11, 0, 0.11]) b.ball(0.2, '#2f7d4c', 0, 0.2, dz, { sx: 1.22, sy: 0.94, sz: 0.16 });
  },
  book(b, item) {
    b.rbox(0.3, 0.07, 0.38, item.color, 0, 0.04, 0, { r: 0.02 });
    b.box(0.26, 0.05, 0.34, C.white, 0.02, 0.04, 0);
    b.box(0.3, 0.012, 0.38, item.color, 0, 0.078, 0);
    b.ball(0.06, C.yellow, 0, 0.085, 0, { sy: 0.2 });
  },
};

/** 一樣東西的模型：合成一個網格，原點在底部的中心。 */
export function itemMesh(item) {
  const b = new Builder();
  SHAPES[item.kind](b, item);
  const mesh = new THREE.Mesh(mergeGeometries(b.solid), new THREE.MeshLambertMaterial({ vertexColors: true }));
  for (const geometry of b.solid) geometry.dispose();
  mesh.castShadow = true;
  mesh.scale.setScalar(1.35);   // 比照實際比例會太小，手指點不到
  return mesh;
}
