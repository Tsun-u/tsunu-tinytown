// 把一堆小幾何形狀合成一個網格：顏色寫在頂點上，整間店只要畫一次，平板才跑得動。
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const color = new THREE.Color();
const euler = new THREE.Euler();
const quaternion = new THREE.Quaternion();
const position = new THREE.Vector3();
const scale = new THREE.Vector3();

export class Builder {
  constructor() {
    this.solid = [];                     // 受光、有陰影的部分
    this.glow = [];                      // 自己會亮的部分：燈泡、號誌
    this.stack = [new THREE.Matrix4()];
  }

  /** 在 (x, y, z)、繞 y 轉 ry 的位置上蓋一組東西；fn 裡的座標都相對這個位置。 */
  at(x, y, z, ry, fn) {
    const local = new THREE.Matrix4().makeRotationY(ry).setPosition(x, y, z);
    this.stack.push(this.stack[this.stack.length - 1].clone().multiply(local));
    fn();
    this.stack.pop();
  }

  /** o：{ rx, ry, rz, sx, sy, sz, glow } */
  add(source, hex, x, y, z, o = {}) {
    const geometry = source.index ? source.toNonIndexed() : source;   // 圓角方塊沒有索引，其他形狀有；統一成沒有索引才能合併
    euler.set(o.rx || 0, o.ry || 0, o.rz || 0);
    const matrix = new THREE.Matrix4().compose(position.set(x, y, z), quaternion.setFromEuler(euler), scale.set(o.sx || 1, o.sy || 1, o.sz || 1));
    geometry.applyMatrix4(matrix.premultiply(this.stack[this.stack.length - 1]));
    color.set(hex);
    const count = geometry.attributes.position.count;
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) { colors[i * 3] = color.r; colors[i * 3 + 1] = color.g; colors[i * 3 + 2] = color.b; }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    (o.glow ? this.glow : this.solid).push(geometry);
  }

  box(w, h, d, hex, x, y, z, o) { this.add(new THREE.BoxGeometry(w, h, d), hex, x, y, z, o); }
  /** 圓角方塊；o.r 是圓角半徑。圓角只切一段，面數才不會暴增。 */
  rbox(w, h, d, hex, x, y, z, o = {}) { this.add(new RoundedBoxGeometry(w, h, d, 1, o.r || 0.04), hex, x, y, z, o); }
  cyl(rTop, rBottom, h, hex, x, y, z, o = {}) { this.add(new THREE.CylinderGeometry(rTop, rBottom, h, o.seg || 14), hex, x, y, z, o); }
  ball(r, hex, x, y, z, o = {}) { this.add(new THREE.SphereGeometry(r, o.seg || (r < 0.12 ? 7 : 12), r < 0.12 ? 5 : 9), hex, x, y, z, o); }

  /** 合成兩個網格：solid（受光、投影）和 glow（自發光）。 */
  finish() {
    const solid = new THREE.Mesh(mergeGeometries(this.solid), new THREE.MeshLambertMaterial({ vertexColors: true }));
    solid.castShadow = solid.receiveShadow = true;
    const glow = new THREE.Mesh(mergeGeometries(this.glow), new THREE.MeshBasicMaterial({ vertexColors: true }));
    for (const geometry of [...this.solid, ...this.glow]) geometry.dispose();
    return { solid, glow };
  }
}
