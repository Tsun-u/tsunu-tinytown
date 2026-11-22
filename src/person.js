// 積木小人：用幾何形狀拼出來的 3D 人物。原點在腳底，正面朝 +z。
import * as THREE from 'three';
import { HAT_COLOR, PACK_COLOR, CROWN_COLOR, dogLook } from './design.js';

const DOG_LEG = 0.26;      // 狗狗的腿長，也是站著時肚子離地的高度
const DOG_HEIGHT = 0.95;
const HIP = 0.45;          // 髖關節高度（大人、站著）
const SHOULDER = 0.88;
const HEAD_Y = 1.22;
const CHILD_SCALE = 0.72;

const materials = new Map();
function mat(color) {
  if (!materials.has(color)) materials.set(color, new THREE.MeshLambertMaterial({ color }));
  return materials.get(color);
}

const geometries = new Map();
function geo(key, make) {
  if (!geometries.has(key)) geometries.set(key, make());
  return geometries.get(key);
}

function part(parent, geometry, color, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(geometry, mat(color));
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

const shadowMaterial = new THREE.MeshBasicMaterial({ color: 0x4a3b33, transparent: true, opacity: 0.18, depthWrite: false });

export class Person {
  constructor(data, { castShadow = false } = {}) {
    this.castShadow = castShadow;     // 有即時陰影時身體投影，腳下的假影子就收起來
    this.data = data;                 // { id, design, x, z, seat }
    this.root = new THREE.Group();    // 位置、面向
    this.body = new THREE.Group();    // 造型（換造型時整組重建）
    this.root.add(this.body);
    this.shadow = new THREE.Mesh(geo('shadow', () => new THREE.CircleGeometry(0.36, 20).rotateX(-Math.PI / 2)), shadowMaterial);
    this.shadow.position.y = 0.02;
    this.root.add(this.shadow);
    this.mode = 'stand';              // stand | sit | ride | splash | work | sleep | held
    this.seatHeight = 0;
    this.greet = 0;                   // 打招呼動畫剩下的秒數
    this.hop = 0;                     // 被點到時跳一下
    this.eating = 0;                  // 吃東西動畫剩下的秒數，每 0.8 秒一口
    this.working = 0;                 // 在爐子、水槽、冰箱前做事剩下的秒數
    this.treat = 0;                   // 拿著冰棒吃剩下的秒數
    this.phase = Math.random() * 6;
    this.rebuild();
  }

  get isDog() { return this.data.design.size === 'dog'; }
  get scale() { return this.data.design.size === 'child' ? CHILD_SCALE : 1; }
  get height() { return this.isDog ? DOG_HEIGHT : 1.55 * this.scale; }

  /** 冰棒：棒子在原點、冰的那頭朝 -y。人握在右手，狗狗叼在嘴裡。 */
  buildPopsicle() {
    this.popsicle = new THREE.Group();
    this.popsicle.scale.setScalar(1.35);
    part(this.popsicle, geo('popStick', () => new THREE.BoxGeometry(0.025, 0.12, 0.02)), '#e8c99a', 0, 0, 0);
    ['#ff9fb8', '#ffd86b', '#8fdcc0'].forEach((color, i) => {   // 三色條紋，穿什麼顏色的衣服都看得出來
      part(this.popsicle, geo('popIce', () => new THREE.BoxGeometry(0.1, 0.06, 0.05)), color, 0, -0.08 - i * 0.06, 0);
    });
    this.popsicle.visible = false;
    return this.popsicle;
  }

  /** 狗狗：四隻腳站著，原點在腳底、正面朝 +z。torso 以肚子底為準，趴下時整個往下放、四隻腳往前伸。 */
  buildDog(d) {
    const look = dogLook(d);
    this.torso = new THREE.Group();
    this.torso.position.y = DOG_LEG;
    this.body.add(this.torso);
    part(this.torso, geo('dogBody', () => new THREE.SphereGeometry(0.2, 16, 12)), look.fur, 0, 0.18, 0).scale.set(1, 0.92, 1.75);
    if (look.patch === 'back') part(this.torso, geo('dogBack', () => new THREE.SphereGeometry(0.14, 12, 9)), look.mark, 0, 0.3, -0.06).scale.set(1.15, 0.5, 1.5);
    // 四隻腳：前兩隻、後兩隻
    this.paws = [[-1, 0.22], [1, 0.22], [-1, -0.22], [1, -0.22]].map(([side, z]) => {
      const joint = new THREE.Group();
      joint.position.set(side * 0.11, 0.04, z);
      part(joint, geo('dogLeg', () => new THREE.CylinderGeometry(0.058, 0.052, DOG_LEG, 8)), look.fur, 0, -DOG_LEG / 2 - 0.02, 0);
      part(joint, geo('dogPaw', () => new THREE.SphereGeometry(0.07, 8, 6)), look.snout, 0, -DOG_LEG + 0.01, 0.025).scale.y = 0.7;
      this.torso.add(joint);
      return joint;
    });
    this.tail = new THREE.Group();
    this.tail.position.set(0, 0.28, -0.33);
    this.tail.rotation.x = -0.7;
    part(this.tail, geo('dogTail', () => new THREE.CylinderGeometry(0.028, 0.045, 0.28, 8)), look.fur, 0, 0.14, 0);
    this.torso.add(this.tail);
    // 項圈和名牌
    const collar = part(this.torso, geo('dogCollar', () => new THREE.TorusGeometry(0.16, 0.032, 6, 16)), look.collar, 0, 0.3, 0.24);
    collar.rotation.x = Math.PI / 2 - 0.75;
    part(this.torso, geo('dogTag', () => new THREE.SphereGeometry(0.04, 8, 6)), CROWN_COLOR, 0, 0.17, 0.36);

    this.head = new THREE.Group();
    this.head.position.set(0, 0.46, 0.33);
    this.torso.add(this.head);
    part(this.head, geo('dogHead', () => new THREE.SphereGeometry(0.23, 18, 14)), look.fur);
    part(this.head, geo('dogSnout', () => new THREE.SphereGeometry(0.12, 12, 9)), look.snout, 0, -0.07, 0.19).scale.set(1.05, 0.8, 1.1);
    part(this.head, geo('dogNose', () => new THREE.SphereGeometry(0.045, 8, 6)), '#4a3b33', 0, -0.03, 0.315);
    part(this.head, geo('dogTongue', () => new THREE.BoxGeometry(0.05, 0.02, 0.07)), '#f28ba0', 0, -0.135, 0.26);
    for (const side of [-1, 1]) part(this.head, geo('eye', () => new THREE.SphereGeometry(0.036, 8, 6)), '#4a3b33', side * 0.095, 0.05, 0.2);
    if (look.patch === 'eye') part(this.head, geo('dogEyePatch', () => new THREE.SphereGeometry(0.09, 10, 8)), look.mark, 0.095, 0.05, 0.165).scale.z = 0.5;
    for (const side of [-1, 1]) {
      if (look.ears === 'floppy') {
        part(this.head, geo('dogEarFlop', () => new THREE.SphereGeometry(0.11, 10, 8)), look.mark, side * 0.215, -0.03, -0.01).scale.set(0.5, 1.35, 0.9);
      } else {
        part(this.head, geo('dogEarUp', () => new THREE.ConeGeometry(0.085, 0.2, 8)), look.mark, side * 0.13, 0.25, -0.02).rotation.z = -side * 0.25;
      }
    }
    // 嘴巴：叼東西的位置。冰的那頭轉成朝前
    this.mouth = new THREE.Group();
    this.mouth.position.set(0, -0.12, 0.3);
    this.mouth.add(this.buildPopsicle());
    this.popsicle.rotation.x = -Math.PI / 2;
    this.head.add(this.mouth);
  }

  rebuild() {
    const d = this.data.design;
    this.body.clear();
    this.body.scale.setScalar(this.scale);
    if (this.isDog) {
      this.buildDog(d);
      if (this.castShadow) this.body.traverse((node) => { if (node.isMesh) node.castShadow = true; });
      return;
    }

    this.legs = [-1, 1].map((side) => {
      const hip = new THREE.Group();
      hip.position.set(side * 0.11, HIP, 0);
      const legColor = d.bottom === 'skirt' ? d.skin : d.bottomColor;
      part(hip, geo('leg', () => new THREE.CylinderGeometry(0.09, 0.08, HIP, 10)), legColor, 0, -HIP / 2, 0);
      part(hip, geo('shoe', () => new THREE.BoxGeometry(0.17, 0.08, 0.26)), '#5a5560', 0, -HIP + 0.04, 0.04);
      this.body.add(hip);
      return hip;
    });

    this.torso = new THREE.Group();
    this.body.add(this.torso);
    part(this.torso, geo('torso', () => new THREE.CylinderGeometry(0.2, 0.26, 0.55, 14)), d.top, 0, 0.69, 0);
    if (d.bottom === 'skirt') {
      part(this.torso, geo('skirt', () => new THREE.CylinderGeometry(0.24, 0.38, 0.28, 14)), d.bottomColor, 0, 0.4, 0);
    }

    this.arms = [-1, 1].map((side) => {
      const shoulder = new THREE.Group();
      shoulder.position.set(side * 0.29, SHOULDER, 0);
      shoulder.rotation.z = side * 0.18;
      part(shoulder, geo('arm', () => new THREE.CylinderGeometry(0.07, 0.065, 0.36, 8)), d.top, 0, -0.18, 0);
      part(shoulder, geo('hand', () => new THREE.SphereGeometry(0.08, 10, 8)), d.skin, 0, -0.39, 0);
      this.torso.add(shoulder);
      return shoulder;
    });
    // 冰棒握在右手，棒子朝下、冰的那頭朝手臂外
    this.arms[1].add(this.buildPopsicle());
    this.popsicle.position.set(0, -0.42, 0.06);

    this.head = new THREE.Group();
    this.head.position.y = HEAD_Y;
    if (d.size === 'child') this.head.scale.setScalar(1.15);
    this.torso.add(this.head);
    part(this.head, geo('head', () => new THREE.SphereGeometry(0.3, 20, 16)), d.skin);
    for (const side of [-1, 1]) {
      part(this.head, geo('eye', () => new THREE.SphereGeometry(0.036, 8, 6)), '#4a3b33', side * 0.11, 0.03, 0.275);
      const cheek = part(this.head, geo('cheek', () => new THREE.SphereGeometry(0.05, 8, 6)), '#f2a0a0', side * 0.19, -0.07, 0.225);
      cheek.scale.z = 0.4;
    }
    const smile = part(this.head, geo('smile', () => new THREE.TorusGeometry(0.06, 0.013, 6, 12, Math.PI)), '#4a3b33', 0, -0.06, 0.288);
    smile.rotation.z = Math.PI;

    this.buildHair(d);
    this.buildExtra(d);
    if (this.castShadow) this.body.traverse((node) => { if (node.isMesh) node.castShadow = true; });
  }

  buildHair(d) {
    const fringe = d.hair === 'short' ? 0.47 : 0.52;
    const cap = part(this.head, geo('cap' + fringe, () => new THREE.SphereGeometry(0.325, 20, 12, 0, Math.PI * 2, 0, Math.PI * fringe)), d.hairColor);
    cap.rotation.x = -0.38;
    if (d.hair === 'bob' || d.hair === 'long') {
      part(this.head, geo('back', () => new THREE.SphereGeometry(0.335, 20, 12, Math.PI, Math.PI, 0, Math.PI * 0.82)), d.hairColor);
    }
    if (d.hair === 'long') {
      const fall = part(this.head, geo('fall', () => new THREE.CylinderGeometry(0.31, 0.27, 0.5, 14)), d.hairColor, 0, -0.3, -0.17);
      fall.scale.z = 0.45;
    }
    if (d.hair === 'pigtails') {
      for (const side of [-1, 1]) part(this.head, geo('tail', () => new THREE.SphereGeometry(0.13, 12, 10)), d.hairColor, side * 0.37, -0.05, -0.05);
    }
    if (d.hair === 'bun') part(this.head, geo('bun', () => new THREE.SphereGeometry(0.15, 12, 10)), d.hairColor, 0, 0.36, -0.08);
  }

  buildExtra(d) {
    if (d.extra === 'hat') {
      part(this.head, geo('hatTop', () => new THREE.CylinderGeometry(0.23, 0.25, 0.2, 16)), HAT_COLOR, 0, 0.33, 0);
      part(this.head, geo('hatBrim', () => new THREE.CylinderGeometry(0.42, 0.42, 0.035, 20)), HAT_COLOR, 0, 0.23, 0);
    }
    if (d.extra === 'crown') {
      part(this.head, geo('crown', () => new THREE.CylinderGeometry(0.22, 0.17, 0.16, 6, 1, true)), CROWN_COLOR, 0, 0.36, 0).material = crownMaterial;
    }
    if (d.extra === 'glasses') {
      for (const side of [-1, 1]) part(this.head, geo('lens', () => new THREE.TorusGeometry(0.078, 0.014, 6, 16)), '#4a3b33', side * 0.11, 0.03, 0.29);
      part(this.head, geo('bridge', () => new THREE.BoxGeometry(0.07, 0.02, 0.02)), '#4a3b33', 0, 0.03, 0.3);
    }
    // 以下是店員、醫生這些固定角色的制服，造型面板裡沒有
    if (d.extra === 'nurseCap') {
      part(this.head, geo('nurseCap', () => new THREE.CylinderGeometry(0.2, 0.24, 0.14, 12)), '#ffffff', 0, 0.3, 0.02);
      part(this.head, geo('capCrossH', () => new THREE.BoxGeometry(0.12, 0.04, 0.02)), '#e86a5c', 0, 0.31, 0.25);
      part(this.head, geo('capCrossV', () => new THREE.BoxGeometry(0.04, 0.12, 0.02)), '#e86a5c', 0, 0.31, 0.25);
    }
    if (d.extra === 'chefHat') {
      part(this.head, geo('chefBand', () => new THREE.CylinderGeometry(0.21, 0.21, 0.14, 14)), '#ffffff', 0, 0.3, 0);
      part(this.head, geo('chefPuff', () => new THREE.SphereGeometry(0.26, 12, 9)), '#ffffff', 0, 0.48, 0).scale.y = 0.7;
    }
    if (d.extra === 'stethoscope') {
      const tube = part(this.torso, geo('stethTube', () => new THREE.TorusGeometry(0.19, 0.022, 6, 16)), '#5a5560', 0, 0.9, 0.04);
      tube.rotation.x = Math.PI / 2 - 0.5;
      part(this.torso, geo('stethDisc', () => new THREE.CylinderGeometry(0.05, 0.05, 0.03, 10)), '#c5ced8', 0.07, 0.68, 0.22).rotation.x = Math.PI / 2;
    }
    if (d.apron) {
      part(this.torso, geo('apron', () => new THREE.BoxGeometry(0.34, 0.5, 0.05)), d.apron, 0, 0.6, 0.21);
    }
    if (d.extra === 'backpack') {
      part(this.torso, geo('pack', () => new THREE.BoxGeometry(0.36, 0.4, 0.18)), PACK_COLOR, 0, 0.7, -0.3);
    }
  }

  place(x, z, facing) {
    this.root.position.set(x, 0, z);
    this.root.rotation.x = 0;   // 搖搖馬會把人前後搖，離開時擺正
    if (facing !== undefined) this.root.rotation.y = facing;
  }

  stand() { this.mode = 'stand'; }
  sit(seatHeight) { this.mode = 'sit'; this.seatHeight = seatHeight; }
  hold() { this.mode = 'held'; }
  /** 坐在泳池裡拍水。 */
  splash(seatHeight) { this.mode = 'splash'; this.seatHeight = seatHeight; }
  /** 站在爐子這類東西前面做事。 */
  work() { this.mode = 'work'; }
  /** 跨坐在搖搖馬這類東西上：腳往下放在兩側。 */
  ride(seatHeight) { this.mode = 'ride'; this.seatHeight = seatHeight; }
  /** 躺在床上：頭朝人物的背後方向（床頭），臉朝上。 */
  sleep(bedHeight) { this.mode = 'sleep'; this.seatHeight = bedHeight; }

  /** 手指要點哪個高度才算點到這個人。 */
  get pickHeight() { return this.mode === 'sleep' ? this.seatHeight + 0.2 : this.body.position.y + this.height * 0.55; }

  /** 狗狗每一格的姿勢：站著、趴著（坐椅子、騎東西、睡覺都是趴）、被抓起來。 */
  updateDog(t) {
    const lying = ['sit', 'ride', 'sleep', 'splash'].includes(this.mode);
    const busy = this.greet > 0 || this.working > 0 || this.eating > 0 || this.treat > 0 || this.mode === 'held';
    let lift = 0, squash = 1 + Math.sin(t * 2.2) * 0.015;
    let swing = [0, 0, 0, 0];
    if (lying) {
      lift = this.seatHeight - DOG_LEG;                      // 肚子貼在座位上
      swing = [-1.45, -1.45, -1.45, -1.45];                  // 四隻腳往前伸
      if (this.mode === 'sleep') squash = 1 + Math.sin(t * 1.4) * 0.03;
      if (this.mode === 'splash') {
        lift += Math.abs(Math.sin(t * 5)) * 0.05;
        swing[0] += Math.sin(t * 9) * 0.6; swing[1] -= Math.sin(t * 9) * 0.6;   // 前腳輪流拍水
      }
    } else if (this.mode === 'held') {
      lift = 0.5;
      swing = [Math.sin(t * 9) * 0.5, -Math.sin(t * 9) * 0.5, -Math.sin(t * 9) * 0.5, Math.sin(t * 9) * 0.5];
    }
    if (this.greet > 0 && this.mode === 'stand') lift += Math.abs(Math.sin(this.greet * 7)) * 0.2;
    if (this.hop > 0 && this.mode !== 'held') lift += Math.sin((this.hop / 0.35) * Math.PI) * 0.18;

    this.body.rotation.x = 0;
    this.body.position.set(0, lift, 0);
    this.body.scale.set(1, squash, 1);
    this.paws.forEach((paw, i) => { paw.rotation.x = swing[i]; });
    this.tail.rotation.z = Math.sin(t * (busy ? 15 : 5)) * (busy ? 0.7 : 0.4);
    const munch = Math.max(this.eating, this.treat);
    const nod = munch > 0 ? Math.sin(((munch % 0.8) / 0.8) * Math.PI) : (this.working > 0 ? 0.5 + Math.sin(t * 9) * 0.3 : 0);
    this.head.rotation.x = (this.mode === 'sleep' ? 0.45 : 0) + 0.3 * nod;   // 睡覺時頭垂下來；吃東西、做事時點頭
    this.head.rotation.z = busy ? 0 : Math.sin(t * 0.9) * 0.08;
    this.popsicle.visible = this.treat > 0;
    this.shadow.scale.setScalar(this.mode === 'held' ? 0.55 : 0.8);
    this.shadow.visible = !this.castShadow && (this.mode === 'stand' || this.mode === 'work');
  }

  update(dt, time) {
    this.greet = Math.max(0, this.greet - dt);
    this.hop = Math.max(0, this.hop - dt);
    this.eating = Math.max(0, this.eating - dt);
    this.working = this.mode === 'work' ? Math.max(0, this.working - dt) : 0;
    this.treat = this.mode === 'held' ? 0 : Math.max(0, this.treat - dt);
    const t = time + this.phase;
    if (this.isDog) { this.updateDog(t); return; }
    let lift = 0, legSwing = [0, 0], armLift = [0, 0], squash = 1 + Math.sin(t * 2.2) * 0.012;

    if (this.mode === 'sit') {
      lift = Math.max(0, this.seatHeight - HIP * this.scale);
      legSwing = [-Math.PI / 2, -Math.PI / 2];
      if (this.scale < 1) legSwing = legSwing.map((a, i) => a + Math.sin(t * 2.4 + i * Math.PI) * 0.22);   // 腳搆不到地的小孩晃腳
    } else if (this.mode === 'splash') {
      lift = Math.max(0, this.seatHeight - HIP * this.scale) + Math.abs(Math.sin(t * 5)) * 0.05;
      legSwing = [-Math.PI / 2, -Math.PI / 2];
      armLift = [1.3 + Math.sin(t * 9) * 0.7, 1.3 - Math.sin(t * 9) * 0.7];   // 兩隻手輪流拍水
    } else if (this.mode === 'ride') {
      lift = Math.max(0, this.seatHeight - HIP * this.scale * 0.9);
      legSwing = [-0.35, -0.35];
    } else if (this.mode === 'sleep') {
      lift = this.seatHeight + 0.24 * this.scale;
      squash = 1 + Math.sin(t * 1.4) * 0.02;   // 睡著時慢慢呼吸
    } else if (this.mode === 'held') {
      lift = 0.45;
      legSwing = [Math.sin(t * 9) * 0.5, -Math.sin(t * 9) * 0.5];
      armLift = [2.4, 2.4];
    }
    if (this.greet > 0) {
      if (this.mode === 'stand') lift += Math.abs(Math.sin(this.greet * 7)) * 0.22;
      armLift = [0, 2.5 + Math.sin(this.greet * 14) * 0.35];
    }
    if (this.hop > 0 && this.mode !== 'held') lift += Math.sin((this.hop / 0.35) * Math.PI) * 0.18;

    const lying = this.mode === 'sleep';
    this.body.rotation.x = lying ? -Math.PI / 2 : 0;
    this.body.position.z = lying ? this.height / 2 : 0;   // 躺下時身體以床的中心為準
    this.body.position.y = lift;
    this.body.scale.set(this.scale, this.scale * squash, this.scale);
    this.legs.forEach((leg, i) => { leg.rotation.x = legSwing[i]; });
    this.popsicle.visible = this.treat > 0;
    const stir = this.working > 0 ? 0.55 + Math.sin(t * 9) * 0.12 : 0;   // 做事：右手伸向前攪、刷、拿
    const munch = Math.max(this.eating, this.treat);
    const bite = munch > 0 ? Math.sin(((munch % 0.8) / 0.8) * Math.PI) : stir;   // 一口：手舉到嘴邊再放下
    this.arms.forEach((arm, i) => {
      const side = i === 0 ? -1 : 1;
      arm.rotation.z = side * (0.18 + armLift[i]) * (i === 1 ? 1 - bite : 1);
      arm.rotation.x = i === 1 ? -2.2 * bite : 0;
    });
    this.head.rotation.x = 0.18 * bite;
    const shadowLift = this.mode === 'held' ? 0.7 : 1;
    this.shadow.scale.setScalar(this.scale * shadowLift);
    this.shadow.visible = !this.castShadow && (this.mode === 'stand' || this.mode === 'work');
  }
}

const crownMaterial = new THREE.MeshLambertMaterial({ color: CROWN_COLOR, side: THREE.DoubleSide });
