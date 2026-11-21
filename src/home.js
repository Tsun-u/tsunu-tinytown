// 小人的家：左後方是臥室，右後方是廚房，中間是餐桌，左前方是沙發和玩具角，門外是有圍籬的院子。
// 場景設定：下午的家。奶油色的牆配淺藍腰板和藍白屋簷，原木家具，寢具和小物用粉紅、薄荷綠、黃色點綴。
// 座標和剖開方式跟店一樣（見 shop.js）。
import * as THREE from 'three';
import { Builder } from './builder.js';
import { C, SEAT_HEIGHT, VIEW, walls, lamps, chair, table, plate, pot, finishPlace } from './shop.js';

const H = { blue: '#9cc6e6', blueDark: '#7eb0d6', roof: '#7fb2e0', sofa: '#f4b183', sofaDark: '#e59a68', fence: '#ffffff', stone: '#e3dccf', water: '#9bdcf0' };
const BED_HEIGHT = 0.6;

function ground(b) {
  b.rbox(11.2, 0.5, 10.2, C.baseDark, 0, -0.42, 1.2, { r: 0.18 });
  b.rbox(10.9, 0.26, 9.9, C.base, 0, -0.13, 1.2, { r: 0.1 });
  for (let i = 0; i < 12; i++) b.box(7.98, 0.06, 0.49, i % 2 ? C.plankA : C.plankB, 0, 0.03, -2.75 + i * 0.5);
  b.box(10.4, 0.07, 3.0, C.leaf, 0, 0.02, 4.6);          // 院子的草地
  b.box(1.0, 0.07, 6.6, C.leaf, -4.85, 0.02, -0.3);
  b.box(1.0, 0.07, 6.6, C.leaf, 4.85, 0.02, -0.3);
  for (let i = 0; i < 5; i++) b.cyl(0.36, 0.36, 0.05, H.stone, -2.9 + (i % 2 ? 0.12 : -0.1), 0.07, 3.6 + i * 0.52, { seg: 10 });   // 門口到大門的石板
}

function fence(b) {
  // 院子前面的白色圍籬，石板路那裡留一個缺口
  const picket = (x) => {
    b.box(0.09, 0.5, 0.05, H.fence, x, 0.3, 5.95);
    b.box(0.09, 0.09, 0.05, H.fence, x, 0.56, 5.95, { rz: Math.PI / 4 });
  };
  for (let x = -5.0; x <= 5.01; x += 0.36) if (x < -3.5 || x > -2.25) picket(x);
  for (const y of [0.22, 0.42]) {
    b.box(1.6, 0.05, 0.04, H.fence, -4.3, y, 5.93);
    b.box(7.4, 0.05, 0.04, H.fence, 1.4, y, 5.93);
  }
}

function entrance(b) {
  for (const x of [-3.72, -2.08]) b.rbox(0.2, 2.6, 0.2, C.white, x, 1.3, 3.05, { r: 0.04 });
  b.rbox(1.9, 0.22, 0.26, C.white, -2.9, 2.62, 3.05, { r: 0.04 });
  for (let i = 0; i < 5; i++) b.rbox(0.42, 0.08, 0.85, i % 2 ? C.cream : H.roof, -3.74 + i * 0.42, 2.72, 3.42, { rx: 0.42, r: 0.03 });
  b.rbox(0.08, 2.2, 0.82, C.yellow, -3.9, 1.15, 2.52, { r: 0.03 });   // 往內開的黃色大門
  b.box(0.03, 0.5, 0.5, C.glass, -3.85, 1.75, 2.52);
  b.ball(0.05, C.dark, -3.83, 1.1, 2.24);
  b.rbox(1.2, 0.04, 0.6, C.green, -2.9, 0.09, 3.3, { r: 0.02 });
  b.rbox(0.9, 0.02, 0.36, C.cream, -2.9, 0.11, 3.3, { r: 0.02 });
  for (const x of [-0.9, 1.1, 3.1]) {   // 矮牆上的花箱
    b.rbox(1.2, 0.18, 0.28, C.white, x, 0.45, 3.05, { r: 0.04 });
    for (let i = 0; i < 5; i++) {
      b.ball(0.1, i % 2 ? C.green : C.greenDark, x - 0.44 + i * 0.22, 0.58, 3.05);
      b.ball(0.055, [C.yellow, C.pink, C.white, C.orange, C.lilac][i], x - 0.44 + i * 0.22, 0.68, 3.08);
    }
  }
}

/** 一張床，床頭靠後牆。slots 是每個人躺的位置（離床中心多遠），一個位置一顆枕頭。回傳躺下的位置。 */
function bed(b, x, z, w, l, blanket, slots = [0]) {
  b.at(x, 0, z, 0, () => {
    b.rbox(w + 0.1, 0.28, l + 0.1, C.wood, 0, 0.24, 0, { r: 0.05 });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box(0.1, 0.12, 0.1, C.woodDark, sx * (w / 2 - 0.05), 0.06, sz * (l / 2 - 0.05));
    b.rbox(w, 0.2, l, C.white, 0, 0.46, 0, { r: 0.07 });
    b.rbox(w + 0.04, 0.1, l * 0.6, blanket, 0, 0.55, l * 0.2, { r: 0.05 });
    b.rbox(w + 0.04, 0.1, 0.16, C.cream, 0, 0.56, -l * 0.1, { r: 0.04 });       // 被子反摺的那一條
    for (const dx of slots) b.rbox(0.62, 0.13, 0.4, C.cream, dx, 0.6, -l / 2 + 0.3, { r: 0.06 });   // 枕頭
    b.rbox(w + 0.1, 0.95, 0.1, C.wood, 0, 0.58, -l / 2 - 0.02, { r: 0.05 });    // 床頭板
  });
  return slots.map((dx) => ({ x: x + dx, z: z + 0.1, facing: 0, seatHeight: BED_HEIGHT, pose: 'sleep' }));
}

function bedroom(b) {
  // 爸爸媽媽睡雙人床，小孩睡旁邊的小床
  const seats = [...bed(b, -2.95, -1.85, 1.8, 2.0, C.pink, [-0.44, 0.44]), ...bed(b, -1.1, -2.0, 1.0, 1.7, C.mint)];
  // 兩張床中間的床頭櫃和小夜燈
  b.rbox(0.34, 0.5, 0.42, C.wood, -1.84, 0.25, -2.72, { r: 0.04 });
  b.box(0.34, 0.03, 0.02, C.woodDark, -1.84, 0.32, -2.5);
  b.cyl(0.07, 0.09, 0.14, C.cream, -1.84, 0.57, -2.72, { seg: 10 });
  b.cyl(0.1, 0.16, 0.18, C.yellow, -1.84, 0.74, -2.72, { seg: 12 });
  b.ball(0.07, '#fff2a8', -1.84, 0.68, -2.72, { glow: true });
  // 床頭牆上的畫：月亮和星星
  b.rbox(0.8, 0.6, 0.06, C.white, -2.95, 2.2, -2.97, { r: 0.03 });
  b.box(0.66, 0.46, 0.03, '#5d6fa8', -2.95, 2.2, -2.94);
  b.ball(0.12, C.yellow, -3.05, 2.24, -2.93, { sz: 0.3 });
  for (const [x, y] of [[-2.75, 2.32], [-2.82, 2.08]]) b.ball(0.035, C.white, x, y, -2.93, { sz: 0.4 });
  b.rbox(0.5, 0.5, 0.06, C.white, -1.1, 2.05, -2.97, { r: 0.03 });
  b.box(0.38, 0.38, 0.03, C.mint, -1.1, 2.05, -2.94);
  b.ball(0.1, C.pink, -1.1, 2.05, -2.93, { sz: 0.3 });
  // 床尾的地毯
  b.cyl(1.0, 1.0, 0.03, H.blue, -2.0, 0.075, -0.15, { seg: 28, sx: 1.25 });
  b.cyl(0.78, 0.78, 0.032, C.cream, -2.0, 0.076, -0.15, { seg: 28, sx: 1.25 });
  // 左牆邊的衣櫃
  b.rbox(0.6, 1.9, 0.7, C.wood, -3.66, 0.95, -0.42, { r: 0.04 });
  b.box(0.02, 1.7, 0.02, C.woodDark, -3.35, 0.95, -0.42);
  for (const z of [-0.5, -0.34]) b.ball(0.035, C.dark, -3.34, 1.0, z);
  b.rbox(0.5, 0.2, 0.5, C.pink, -3.66, 2.0, -0.42, { r: 0.04 });   // 櫃頂的收納盒
  // 小床和廚房之間的小書櫃
  b.at(-0.15, 0, -2.75, 0, () => {
    b.box(0.7, 1.5, 0.05, C.woodDark, 0, 0.75, -0.17);
    for (const x of [-0.33, 0.33]) b.rbox(0.06, 1.5, 0.4, C.wood, x, 0.75, 0, { r: 0.02 });
    for (const y of [0.05, 0.52, 1.0, 1.47]) b.rbox(0.7, 0.06, 0.4, C.wood, 0, y, 0, { r: 0.02 });
    [C.red, C.orange, C.yellow, C.green, C.blue].forEach((hex, i) => b.box(0.1, 0.3 + (i % 2) * 0.06, 0.26, hex, -0.24 + i * 0.12, 1.2 + (i % 2) * 0.03, 0));
    [C.pink, C.mint, C.lilac, C.yellow].forEach((hex, i) => b.box(0.1, 0.32, 0.26, hex, -0.2 + i * 0.12, 0.71, 0));
    b.rbox(0.4, 0.3, 0.3, C.blue, 0, 0.23, 0.02, { r: 0.04 });
    b.ball(0.13, C.yellow, 0.05, 1.62, 0);
  });
  return seats;
}

function kitchen(b) {
  // 流理台：下櫃、檯面、水槽、爐子
  b.rbox(2.7, 0.9, 0.7, C.yellow, 1.75, 0.45, -2.62, { r: 0.04 });
  b.box(2.6, 0.1, 0.62, C.woodDark, 1.75, 0.05, -2.6);
  b.rbox(2.8, 0.08, 0.78, C.cream, 1.75, 0.94, -2.6, { r: 0.03 });
  for (let i = 0; i < 4; i++) {
    b.box(0.02, 0.7, 0.02, C.woodDark, 0.75 + i * 0.67, 0.5, -2.26);
    b.ball(0.035, C.white, 0.6 + i * 0.67, 0.62, -2.25);
  }
  b.box(0.7, 0.03, 0.46, C.dark, 0.95, 0.985, -2.6);                 // 水槽
  b.cyl(0.025, 0.025, 0.3, C.dark, 0.95, 1.13, -2.86, { seg: 8 });
  b.box(0.04, 0.04, 0.2, C.dark, 0.95, 1.27, -2.78);
  b.box(0.8, 0.03, 0.56, C.dark, 2.35, 0.985, -2.6);                 // 爐子
  for (const [x, z] of [[2.17, -2.74], [2.53, -2.74], [2.17, -2.46], [2.53, -2.46]]) b.cyl(0.11, 0.11, 0.02, '#8a8590', x, 1.0, z, { seg: 10 });
  b.cyl(0.15, 0.15, 0.16, C.red, 2.17, 1.09, -2.72, { seg: 14 });    // 鍋子
  b.cyl(0.16, 0.16, 0.03, C.red, 2.17, 1.18, -2.72, { seg: 14 });
  b.ball(0.035, C.dark, 2.17, 1.21, -2.72);
  b.rbox(0.3, 0.2, 0.2, C.mint, 1.62, 1.08, -2.72, { r: 0.04 });     // 烤麵包機和兩片吐司
  for (const x of [1.56, 1.68]) b.box(0.03, 0.1, 0.14, C.wood, x, 1.2, -2.72);
  b.cyl(0.16, 0.1, 0.08, C.blue, 1.6, 1.02, -2.4, { seg: 12 });      // 水果盤
  for (const [x, hex] of [[1.54, C.red], [1.66, C.orange], [1.6, C.yellow]]) b.ball(0.06, hex, x, 1.1, -2.4 + (hex === C.yellow ? 0.06 : 0));
  // 吊櫃和上面的盤子
  b.rbox(2.7, 0.7, 0.36, C.yellow, 1.75, 2.25, -2.8, { r: 0.04 });
  for (let i = 0; i < 3; i++) b.box(0.02, 0.6, 0.02, C.woodDark, 1.08 + i * 0.67, 2.25, -2.61);
  b.rbox(2.7, 0.06, 0.4, C.wood, 1.75, 1.72, -2.8, { r: 0.02 });
  [C.pink, C.blue, C.mint, C.lilac].forEach((hex, i) => b.cyl(0.08, 0.06, 0.1, hex, 0.8 + i * 0.3, 1.8, -2.8, { seg: 10 }));
  for (let i = 0; i < 3; i++) b.cyl(0.13, 0.13, 0.02, C.white, 2.5, 1.76 + i * 0.025, -2.8, { seg: 12 });
  fridge(b);
}

/** 冰箱：上面是冷凍庫，下面的冷藏室是空心的，門打開看得到裡面的食物（門另外做，才會動）。 */
function fridge(b) {
  b.rbox(0.78, 0.72, 0.74, C.mint, 3.5, 1.64, -2.6, { r: 0.07 });        // 冷凍庫
  b.box(0.04, 0.22, 0.04, C.white, 3.76, 1.55, -2.2);
  b.box(0.1, 0.1, 0.02, C.red, 3.4, 1.72, -2.22);
  b.box(0.78, 1.3, 0.06, C.mint, 3.5, 0.65, -2.94);                     // 冷藏室的背板、兩側、底座
  for (const x of [3.14, 3.86]) b.box(0.06, 1.3, 0.74, C.mint, x, 0.65, -2.6);
  b.box(0.78, 0.1, 0.74, C.mintDark, 3.5, 0.05, -2.6);
  b.box(0.66, 1.18, 0.02, C.white, 3.5, 0.69, -2.9);                    // 內壁和兩層架子
  for (const y of [0.5, 0.9]) b.box(0.66, 0.03, 0.62, C.white, 3.5, y, -2.6);
  b.ball(0.05, '#fff2a8', 3.5, 1.22, -2.82, { glow: true });            // 裡面的小燈
  // 食物擺在架子前半、偏左：鏡頭從右前方看進去，右邊的側板會擋住靠右靠裡的東西
  // 下層：西瓜和一盒蛋
  b.ball(0.15, C.greenDark, 3.32, 0.22, -2.45, { sy: 0.75 });
  b.cyl(0.13, 0.13, 0.02, C.red, 3.32, 0.31, -2.45, { seg: 12 });
  b.box(0.2, 0.07, 0.16, C.cream, 3.56, 0.14, -2.72);
  for (const x of [3.5, 3.56, 3.62]) b.ball(0.035, C.white, x, 0.2, -2.72);
  // 中層：牛奶、果汁、一塊蛋糕
  b.cyl(0.065, 0.065, 0.28, C.white, 3.26, 0.66, -2.47, { seg: 10 });
  b.cyl(0.04, 0.04, 0.05, C.blue, 3.26, 0.82, -2.47, { seg: 8 });
  b.box(0.13, 0.24, 0.12, C.orange, 3.43, 0.64, -2.55);
  b.box(0.15, 0.1, 0.14, C.pink, 3.56, 0.57, -2.4);
  b.box(0.15, 0.025, 0.14, C.white, 3.56, 0.635, -2.4);
  // 上層：一杯冰棒和布丁
  b.cyl(0.08, 0.07, 0.12, C.blue, 3.3, 0.98, -2.43, { seg: 10 });
  [C.pink, C.yellow, C.mint].forEach((hex, i) => b.box(0.05, 0.13, 0.03, hex, 3.25 + i * 0.05, 1.09, -2.43, { rz: (i - 1) * 0.25 }));
  b.cyl(0.06, 0.07, 0.08, C.yellow, 3.52, 0.96, -2.45, { seg: 10 });
  b.cyl(0.04, 0.06, 0.02, C.choco, 3.52, 1.01, -2.45, { seg: 10 });
}

/** 冷藏室的門：鉸鏈在左邊，打開時往鏡頭這邊轉開，看得到門內側。回傳轉軸，主程式轉它的 rotation.y。 */
function fridgeDoor(group) {
  const hinge = new THREE.Group();
  hinge.position.set(3.11, 0, -2.22);
  const part = (w, h, d, color, x, y, z) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color }));
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    hinge.add(mesh);
  };
  part(0.78, 1.2, 0.06, C.mint, 0.39, 0.7, 0.03);
  part(0.04, 0.3, 0.04, C.white, 0.68, 0.95, 0.08);                     // 把手
  part(0.1, 0.1, 0.02, C.yellow, 0.36, 1.05, 0.065);                    // 磁鐵
  part(0.1, 0.1, 0.02, C.blue, 0.24, 0.8, 0.065);
  part(0.7, 1.1, 0.01, C.white, 0.39, 0.7, -0.005);                     // 門內側和一格放瓶子的架子
  part(0.62, 0.1, 0.06, C.white, 0.39, 0.45, -0.04);
  group.add(hinge);
  return hinge;
}

/** 水龍頭流下來的水和水槽冒起來的泡泡，有人在洗東西時才出現。 */
function sinkWater(group) {
  const water = new THREE.Group();
  water.position.set(0.95, 0.99, -2.68);
  const stream = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.27, 6), new THREE.MeshBasicMaterial({ color: '#bfe8f7', transparent: true, opacity: 0.75 }));
  stream.position.y = 0.135;
  water.add(stream);
  for (let i = 0; i < 5; i++) {
    const bubble = new THREE.Mesh(new THREE.SphereGeometry(0.05, 7, 5), new THREE.MeshBasicMaterial({ color: '#f4fbff', transparent: true, opacity: 0.85, depthWrite: false }));
    bubble.userData.offset = i / 5;
    bubble.userData.spread = [(i - 2) * 0.12, (i % 2 ? 0.1 : -0.04)];
    water.add(bubble);
  }
  water.visible = false;
  group.add(water);
  return water;
}

function dining(b) {
  b.cyl(1.55, 1.55, 0.03, C.yellow, 2.15, 0.075, 0.65, { seg: 30 });
  b.cyl(1.3, 1.3, 0.032, C.cream, 2.15, 0.076, 0.65, { seg: 30 });
  table(b, 2.15, 0.65, C.red, C.yellow, 0.8);
  return [
    { ...chair(b, 1.05, 0.65, Math.PI / 2, C.blue), plate: plate(b, 1.6, 0.65), cake: C.pink },
    { ...chair(b, 2.15, -0.45, 0, C.mint), plate: plate(b, 2.15, 0.1), cake: C.yellow },
    { ...chair(b, 3.25, 0.65, -Math.PI / 2, C.pink), plate: plate(b, 2.7, 0.65), cake: C.choco },
    { ...chair(b, 2.15, 1.75, Math.PI, C.yellow), plate: plate(b, 2.15, 1.2), cake: C.lilac },
  ];
}

function living(b) {
  // 窗下的沙發，坐兩個人
  b.at(-3.4, 0, 1.3, 0, () => {
    b.rbox(0.85, 0.3, 2.0, H.sofa, 0.05, 0.27, 0, { r: 0.08 });
    b.rbox(0.28, 0.75, 2.0, H.sofaDark, -0.32, 0.55, 0, { r: 0.1 });
    for (const z of [-1.0, 1.0]) b.rbox(0.85, 0.5, 0.24, H.sofaDark, 0.05, 0.42, z, { r: 0.1 });
    for (const z of [-0.45, 0.45]) b.rbox(0.62, 0.14, 0.82, H.sofa, 0.12, 0.46, z, { r: 0.06 });
    b.rbox(0.14, 0.34, 0.34, C.mint, -0.14, 0.7, -0.6, { r: 0.06, rz: -0.25 });   // 抱枕
    b.rbox(0.14, 0.34, 0.34, C.yellow, -0.14, 0.7, 0.62, { r: 0.06, rz: -0.25 });
  });
  const seats = [
    { x: -3.2, z: 0.85, facing: Math.PI / 2, seatHeight: SEAT_HEIGHT + 0.06 },
    { x: -3.2, z: 1.75, facing: Math.PI / 2, seatHeight: SEAT_HEIGHT + 0.06 },
  ];
  // 茶几
  b.rbox(0.7, 0.07, 1.0, C.wood, -2.05, 0.38, 1.3, { r: 0.03 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box(0.06, 0.35, 0.06, C.woodDark, -2.05 + sx * 0.28, 0.18, 1.3 + sz * 0.42);
  b.box(0.3, 0.05, 0.4, C.red, -2.05, 0.44, 1.5, { ry: 0.3 });
  b.box(0.26, 0.04, 0.36, C.blue, -2.05, 0.485, 1.5, { ry: -0.1 });
  b.cyl(0.07, 0.055, 0.1, C.white, -2.0, 0.47, 1.0, { seg: 10 });
  // 玩具角：拼圖地墊、積木塔、球、小火車
  [C.pink, C.yellow, C.mint, C.blue].forEach((hex, i) => b.rbox(0.68, 0.04, 0.68, hex, -0.52 + (i % 2) * 0.7, 0.08, 1.75 + Math.floor(i / 2) * 0.7, { r: 0.02 }));
  [[C.red, 0.12], [C.blue, 0.36], [C.yellow, 0.6]].forEach(([hex, y], i) => b.rbox(0.24, 0.24, 0.24, hex, -0.45, y + 0.1, 1.85, { r: 0.03, ry: i * 0.35 }));
  b.rbox(0.22, 0.22, 0.22, C.green, -0.12, 0.22, 1.7, { r: 0.03, ry: 0.5 });
  b.ball(0.18, C.orange, 0.3, 0.28, 2.45);
  b.at(-0.35, 0.1, 2.5, 0.4, () => {
    b.rbox(0.36, 0.2, 0.2, C.red, 0, 0.16, 0, { r: 0.04 });
    b.rbox(0.16, 0.16, 0.2, C.red, -0.1, 0.32, 0, { r: 0.03 });
    b.cyl(0.04, 0.05, 0.12, C.dark, 0.1, 0.32, 0, { seg: 8 });
    b.rbox(0.3, 0.16, 0.2, C.blue, 0.42, 0.14, 0, { r: 0.03 });
    for (const x of [-0.1, 0.1, 0.34, 0.5]) for (const z of [-0.11, 0.11]) b.cyl(0.05, 0.05, 0.03, C.dark, x, 0.05, z, { seg: 8, rx: Math.PI / 2 });
  });
  b.at(0.45, 0.1, 1.85, -0.5, () => {   // 小熊
    b.ball(0.17, C.choco, 0, 0.16, 0);
    b.ball(0.13, C.choco, 0, 0.4, 0);
    for (const x of [-0.1, 0.1]) b.ball(0.05, C.choco, x, 0.52, 0);
    b.ball(0.05, C.cream2, 0, 0.38, 0.11);
  });
  return seats;
}

function yard(b) {
  pot(b, -4.35, 3.65, C.yellow);
  pot(b, -1.65, 3.5, C.pink);
  // 院子的白色長椅
  b.at(2.3, 0, 3.78, 0, () => {
    b.rbox(1.8, 0.08, 0.5, C.white, 0, SEAT_HEIGHT - 0.04, 0, { r: 0.03 });
    for (const y of [0.66, 0.86]) b.rbox(1.8, 0.14, 0.06, C.white, 0, y, -0.24, { r: 0.02 });
    for (const sx of [-1, 1]) {
      b.rbox(0.07, 0.95, 0.07, H.blueDark, sx * 0.82, 0.47, -0.24, { r: 0.02 });
      b.rbox(0.07, SEAT_HEIGHT, 0.07, H.blueDark, sx * 0.82, SEAT_HEIGHT / 2, 0.2, { r: 0.02 });
      b.rbox(0.07, 0.06, 0.5, H.blueDark, sx * 0.82, 0.64, 0, { r: 0.02 });
    }
  });
  // 充氣小泳池和黃色小鴨
  b.cyl(0.8, 0.8, 0.22, C.pink, 0.1, 0.17, 4.7, { seg: 24 });
  b.cyl(0.68, 0.68, 0.23, H.water, 0.1, 0.175, 4.7, { seg: 24 });
  b.ball(0.11, C.yellow, 0.1, 0.34, 5.18);
  b.ball(0.07, C.yellow, 0.18, 0.45, 5.18);
  b.box(0.06, 0.02, 0.04, C.orange, 0.26, 0.44, 5.18);
  // 大門旁的信箱
  b.box(0.06, 0.7, 0.06, C.woodDark, -1.95, 0.4, 5.7);
  b.rbox(0.3, 0.22, 0.4, C.red, -1.95, 0.84, 5.7, { r: 0.06 });
  b.box(0.02, 0.16, 0.06, C.yellow, -1.79, 0.9, 5.6);
  // 左前方的大樹，樹下幾朵花
  b.at(-4.65, 0, 4.7, 0, () => {
    b.cyl(0.16, 0.24, 2.2, C.woodDark, 0, 1.1, 0, { seg: 10 });
    b.ball(0.95, C.green, 0, 2.7, 0);
    b.ball(0.7, C.leaf, 0.45, 3.2, 0.3);
    b.ball(0.65, C.greenDark, -0.35, 3.15, -0.3);
    for (const [x, z, hex] of [[0.5, 0.3, C.red], [-0.2, 0.55, C.orange], [0.3, -0.5, C.red]]) b.ball(0.09, hex, x, 2.35, z);   // 樹上的果子
  });
  // 牆後的樹和兩側草地的小花
  b.at(-4.9, 0, -1.5, 0, () => {
    b.cyl(0.16, 0.24, 3.4, C.woodDark, 0, 1.7, 0, { seg: 10 });
    b.ball(1.0, C.greenDark, 0, 4.0, 0);
    b.ball(0.75, C.green, 0.5, 4.6, 0.4);
    b.ball(0.6, C.leaf, 0.2, 3.6, 0.8);
  });
  for (let i = 0; i < 9; i++) {
    const x = 4.6 + (i % 3) * 0.24, z = -2.6 + i * 0.62;
    b.box(0.02, 0.2, 0.02, C.greenDark, x, 0.15, z);
    b.ball(0.07, [C.yellow, C.white, C.pink, C.orange, C.lilac][i % 5], x, 0.27, z);
  }
  for (const [x, z] of [[3.6, 5.2], [4.3, 4.3], [-3.9, 5.3], [1.4, 5.4]]) {
    b.box(0.02, 0.2, 0.02, C.greenDark, x, 0.15, z);
    b.ball(0.08, C.white, x, 0.28, z);
    b.ball(0.035, C.yellow, x, 0.3, z + 0.05);
  }
  for (const z of [0.4, 1.3, 2.2]) b.ball(0.3, z === 1.3 ? C.greenDark : C.green, -4.9, 0.24, z, { sy: 0.85 });
}

/** 泳池裡濺起來的水花：幾顆小水珠，有人在玩水時才跳。 */
function splashDrops(group, x, z) {
  const drops = new THREE.Group();
  drops.position.set(x, 0.3, z);
  const material = new THREE.MeshBasicMaterial({ color: '#e4f7fd' });
  for (let i = 0; i < 6; i++) {
    const drop = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 5), material);
    drop.userData.angle = i * 1.05;
    drops.add(drop);
  }
  drops.visible = false;
  group.add(drops);
  return drops;
}

/** 鍋子上的蒸氣：三團白煙，煮東西時往上飄。 */
export function steamPuffs(group, x, y, z) {
  const puffs = new THREE.Group();
  puffs.position.set(x, y, z);
  for (let i = 0; i < 3; i++) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.8, depthWrite: false }));
    puff.userData.offset = i / 3;
    puffs.add(puff);
  }
  puffs.visible = false;
  group.add(puffs);
  return puffs;
}

export function buildHome(scene) {
  const b = new Builder();
  ground(b);
  walls(b, { wainscot: H.blue, slat: H.blueDark, eave: H.roof, curtain: C.yellow, windowZ: 1.3 });
  lamps(b);
  entrance(b);
  fence(b);
  const beds = bedroom(b);
  kitchen(b);
  const diningSeats = dining(b);
  const sofaSeats = living(b);
  yard(b);
  const benchSeats = [{ x: 1.9, z: 3.8, facing: 0, seatHeight: SEAT_HEIGHT }, { x: 2.7, z: 3.8, facing: 0, seatHeight: SEAT_HEIGHT }];
  // 泳池裡坐兩個人玩水；水槽、爐子、冰箱前面各站一個人做事（面向流理台）
  const poolSeats = [-0.22, 0.42].map((x) => ({ x, z: 4.68, facing: Math.PI / 4, seatHeight: 0.1, pose: 'splash', markerY: 0.32 }));
  const kitchenSpots = [
    { x: 0.95, z: -1.75, facing: Math.PI, seatHeight: 0, pose: 'wash' },
    { x: 2.3, z: -1.75, facing: Math.PI, seatHeight: 0, pose: 'cook' },
    { x: 3.38, z: -1.5, facing: Math.PI - 0.15, seatHeight: 0, pose: 'fridge' },   // 站在門邊，才不會擋住冰箱裡面
  ];

  const place = finishPlace(scene, b, [...diningSeats, ...sofaSeats, ...beds, ...benchSeats, ...poolSeats, ...kitchenSpots], {
    doors: [{ x: -2.9, z: 3.4, to: 'street' }],
    spawn: { x: -1.0, z: 4.0 },
    view: VIEW,
    // 小人放不上去的圓：餐桌、茶几、玩具、泳池（要進去得拖到池裡的位子）、長椅、盆栽、大樹
    obstacles: [
      { x: 2.15, z: 0.65, r: 1.15 }, { x: -2.05, z: 1.3, r: 0.7 }, { x: -0.1, z: 2.1, r: 0.8 },
      { x: 0.1, z: 4.7, r: 0.95 }, { x: 1.9, z: 3.75, r: 0.5 }, { x: 2.7, z: 3.75, r: 0.5 },
      { x: -4.35, z: 3.65, r: 0.5 }, { x: -1.65, z: 3.5, r: 0.5 }, { x: -4.65, z: 4.7, r: 0.6 },
    ],
    // 小人能站的範圍：屋內（床尾和廚房前面）和院子
    areas: [
      { minX: -2.6, maxX: 3.5, minZ: -0.6, maxZ: 2.6 },
      { minX: -4.0, maxX: 4.5, minZ: 3.5, maxZ: 5.5 },
    ],
  });
  // 會動的東西不合進房子的網格，交給主程式在有人玩水、洗東西、煮東西、開冰箱時播放
  for (const chair of place.chairs) {
    if (chair.pose === 'splash') chair.splash = splashDrops(place.group, chair.x, chair.z);
    if (chair.pose === 'wash') chair.water = sinkWater(place.group);
    if (chair.pose === 'cook') chair.steam = steamPuffs(place.group, 2.17, 1.28, -2.72);
    if (chair.pose === 'fridge') chair.door = fridgeDoor(place.group);
  }
  return place;
}
