// 天空：一天的四個時段（改光線和背景的顏色）和天氣（晴天、下雨、下雪）。
import * as THREE from 'three';

// 每個時段：半球光的天空色、地面色、強度，太陽（晚上是月亮）的顏色、強度、位置，背景的三個漸層色
const TIMES = {
  morning: { sky: 0xfff4e6, floor: 0xf3d4bc, ambient: 1.75, sun: 0xffe6c2, power: 1.9, from: [9, 9, 6], back: ['#fffbf0', '#ffe8d2', '#ffcfb0'] },
  noon: { sky: 0xfff8ee, floor: 0xf0cfb4, ambient: 1.9, sun: 0xfff0d8, power: 2.1, from: [7, 12, 5], back: ['#fff7ea', '#fbe9d6', '#f3d6bd'] },
  evening: { sky: 0xffd8c0, floor: 0xd9a08c, ambient: 1.5, sun: 0xff9d6a, power: 1.9, from: [-9, 6, 7], back: ['#ffdcae', '#f9ab8c', '#c57c9c'] },
  night: { sky: 0x7f95d6, floor: 0x3d3f70, ambient: 1.15, sun: 0xa9bcff, power: 0.75, from: [6, 12, 5], back: ['#3d4f93', '#252d61', '#141837'] },
};
// 每種天氣：太陽變暗多少、蓋在背景上的一層顏色
const WEATHERS = {
  sun: { dim: 1, veil: null },
  rain: { dim: 0.6, veil: 'rgba(110, 125, 150, 0.4)' },
  snow: { dim: 0.78, veil: 'rgba(205, 220, 240, 0.4)' },
};
export const TIME_NAMES = Object.keys(TIMES), WEATHER_NAMES = Object.keys(WEATHERS);

const STARS = [[12, 14], [27, 8], [41, 20], [58, 10], [73, 17], [88, 9], [20, 32], [66, 30], [93, 28], [6, 44], [82, 44]]
  .map(([x, y]) => `radial-gradient(circle at ${x}% ${y}%, #fff 0 1.5px, transparent 2.5px)`).join(', ');

const AREA = { x: 15, y: 13, z: 11 };   // 雨和雪落下的範圍：以畫面中心為準，左右、高度、前後
const RAIN_COUNT = 420, SNOW_COUNT = 320;
const LAMP = { color: 0xffd9a0, power: 26, at: [0, 3.0, 0], reach: 11 };   // 晚上屋裡開的燈
const HIDDEN = -1000;   // 不該看到的雨滴和雪花放到畫面外的高度（見 shownHeight）

/** 雨滴或雪花在 (x, z) 上方、高度 y 時要畫在多高；不該看到就回傳 HIDDEN。toCamera 是從場景指向鏡頭的方向。
 *  從鏡頭看過去，屋子前面太高的雨雪會疊在屋內，所以每個位置有一段看不到的高度（low 到 high）：
 *  屋外的雨雪改在 low 以下循環往下掉，院子才看得出在下；屋內的整段藏起來。 */
function shownHeight(x, y, z, toCamera, room) {
  if (!room) return y;
  let near = 0, far = Infinity;   // 往鏡頭反方向走多遠會進到、離開屋子的平面範圍
  for (const [from, step, min, max] of [[x, -toCamera.x, room.minX, room.maxX], [z, -toCamera.z, room.minZ, room.maxZ]]) {
    if (Math.abs(step) < 1e-6) {
      if (from < min || from > max) return y;
      continue;
    }
    const a = (min - from) / step, b = (max - from) / step;
    near = Math.max(near, Math.min(a, b));
    far = Math.min(far, Math.max(a, b));
    if (near > far) return y;
  }
  const low = near * toCamera.y, high = far * toCamera.y + room.height;
  if (y < low || y > high) return y;
  return low > 0.3 ? y % low : HIDDEN;
}

function rainLines() {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(RAIN_COUNT * 6), 3));
  const lines = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: '#a9d4ee', transparent: true, opacity: 0.85 }));
  lines.frustumCulled = false;
  lines.userData.drops = Array.from({ length: RAIN_COUNT }, () => [(Math.random() - 0.5) * 2 * AREA.x, Math.random() * AREA.y, (Math.random() - 0.5) * 2 * AREA.z]);
  return lines;
}

function snowFlakes() {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(SNOW_COUNT * 3), 3));
  // 點預設是方的，貼一張圓形的圖才像雪花
  const dot = document.createElement('canvas');
  dot.width = dot.height = 32;
  const pen = dot.getContext('2d');
  pen.fillStyle = '#fff';
  pen.beginPath();
  pen.arc(16, 16, 14, 0, Math.PI * 2);
  pen.fill();
  const points = new THREE.Points(geometry, new THREE.PointsMaterial({ color: '#ffffff', size: 9, sizeAttenuation: false, map: new THREE.CanvasTexture(dot), transparent: true, opacity: 0.95, depthWrite: false }));
  points.frustumCulled = false;
  points.userData.flakes = Array.from({ length: SNOW_COUNT }, () => [(Math.random() - 0.5) * 2 * AREA.x, Math.random() * AREA.y, (Math.random() - 0.5) * 2 * AREA.z, Math.random() * 6]);
  return points;
}

/** 管理光線、背景和雨雪。hemi 是半球光，sun 是有陰影的方向光。 */
export class Sky {
  constructor(scene, hemi, sun) {
    this.hemi = hemi;
    this.sun = sun;
    this.time = 'noon';
    this.weather = 'sun';
    this.center = { x: 0, z: 1 };   // 現在這個地方陰影的中心
    this.room = null;          // 現在這個地方的屋內範圍；整個都在戶外就是 null
    this.underground = false;  // 地下室：沒有雨雪
    this.rain = rainLines();
    this.snow = snowFlakes();
    // 燈一直留在場景裡，關燈是把強度設成 0：燈的數量一變，所有材質都要重新編譯
    this.lamp = new THREE.PointLight(LAMP.color, 0, LAMP.reach, 1.4);
    this.lamp.position.fromArray(LAMP.at);
    scene.add(this.rain, this.snow, this.lamp);
    this.set({});
  }

  /** 換地方：雨雪只下在屋外，晚上屋裡開燈；陰影的範圍對準這個地方（place.shadow：中心的 x、z，左右各蓋多寬 half、前後各蓋多深 deep；街道比屋子大很多）。 */
  enter(place) {
    this.room = place.indoor;
    this.underground = Boolean(place.underground);
    const { x = 0, z = 1, half = 14, deep = 11 } = place.shadow || {};
    this.center = { x, z };
    this.sun.target.position.set(x, 0, z);
    Object.assign(this.sun.shadow.camera, { left: -half, right: half, top: deep, bottom: -deep });
    this.sun.shadow.camera.updateProjectionMatrix();
    this.set({});
  }

  /** 換時段或天氣；沒給的那一項維持原樣。 */
  set({ time, weather }) {
    if (TIMES[time]) this.time = time;
    if (WEATHERS[weather]) this.weather = weather;
    const t = TIMES[this.time], w = WEATHERS[this.weather];
    this.hemi.color.set(t.sky);
    this.hemi.groundColor.set(t.floor);
    this.hemi.intensity = t.ambient * (0.9 + w.dim * 0.1);
    this.sun.color.set(t.sun);
    this.sun.intensity = t.power * w.dim;
    this.sun.position.fromArray(t.from);
    this.sun.position.x += this.center.x;   // 太陽跟著陰影的中心平移，光的方向才不會變（from 是以 (0, 0, 1) 為中心寫的）
    this.sun.position.z += this.center.z - 1;
    this.rain.visible = this.weather === 'rain' && !this.underground;
    this.snow.visible = this.weather === 'snow' && !this.underground;
    this.lamp.intensity = this.time === 'night' && this.room ? LAMP.power : 0;
    const layers = [`radial-gradient(ellipse at 50% 42%, ${t.back[0]} 0%, ${t.back[1]} 55%, ${t.back[2]} 100%)`];
    if (this.time === 'night' && this.weather === 'sun') layers.unshift(STARS);
    if (w.veil) layers.unshift(`linear-gradient(${w.veil}, ${w.veil})`);
    document.documentElement.style.background = document.body.style.background = layers.join(', ');
  }

  /** 每一格讓雨和雪往下掉。center 是畫面現在看的中心；spread 是範圍要放大幾倍（直式畫面看到的範圍比較大）；
   *  toCamera 是從場景指向鏡頭的方向，用來藏掉會疊在屋內的雨雪。 */
  update(dt, time, center, spread, toCamera) {
    if (this.rain.visible) {
      const position = this.rain.geometry.attributes.position;
      this.rain.userData.drops.forEach((drop, i) => {
        drop[1] -= 15 * dt / spread;
        if (drop[1] < 0) drop[1] += AREA.y;
        const x = center.x + drop[0] * spread, z = center.z + drop[2] * spread;
        const y = shownHeight(x, drop[1] * spread, z, toCamera, this.room);
        position.setXYZ(i * 2, x, y, z);
        position.setXYZ(i * 2 + 1, x + 0.06 * spread, y + 0.45 * spread, z);
      });
      position.needsUpdate = true;
    }
    if (this.snow.visible) {
      const position = this.snow.geometry.attributes.position;
      this.snow.userData.flakes.forEach((flake, i) => {
        flake[1] -= 1.7 * dt / spread;
        if (flake[1] < 0) flake[1] += AREA.y;
        const x = center.x + (flake[0] + Math.sin(time * 1.3 + flake[3]) * 0.3) * spread, z = center.z + flake[2] * spread;
        position.setXYZ(i, x, shownHeight(x, flake[1] * spread, z, toCamera, this.room), z);
      });
      position.needsUpdate = true;
    }
  }
}
