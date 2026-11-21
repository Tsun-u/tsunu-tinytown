// 小人的造型選項，以及 2D 頭像（大頭照按鈕、造型面板的圖示都用它畫）。

export const SKINS = ['#ffe0c4', '#f6c9a0', '#e0a878', '#b9794e', '#8a5a3c'];
export const HAIR_COLORS = ['#2f2622', '#6b4226', '#c98a3c', '#f2d16b', '#e2574c', '#f29bc0', '#5b8def'];
export const CLOTH_COLORS = ['#e2574c', '#f29b4b', '#f6d04d', '#6fbf73', '#4fb7c5', '#5b8def', '#a77bd9', '#f29bc0', '#ffffff', '#5a5560'];
export const HAIRS = ['short', 'bob', 'long', 'pigtails', 'bun'];
export const BOTTOMS = ['pants', 'skirt'];
export const EXTRAS = ['none', 'hat', 'glasses', 'backpack', 'crown'];
export const SIZES = ['adult', 'child'];
export const MAX_PEOPLE = 6;

export const HAT_COLOR = '#e2574c';
export const PACK_COLOR = '#5b8def';
export const CROWN_COLOR = '#f6c644';
const INK = '#4a3b33';

const pick = (list) => list[Math.floor(Math.random() * list.length)];

export function randomDesign(size = pick(SIZES)) {
  return {
    skin: pick(SKINS), hair: pick(HAIRS), hairColor: pick(HAIR_COLORS),
    top: pick(CLOTH_COLORS), bottom: pick(BOTTOMS), bottomColor: pick(CLOTH_COLORS),
    extra: 'none', size,
  };
}

function drawHead(ctx, d) {
  // 以 (0,0) 為臉的中心、臉半徑 30 來畫
  ctx.fillStyle = d.hairColor;
  if (d.hair === 'bob' || d.hair === 'long') {
    const bottom = d.hair === 'long' ? 62 : 30;
    ctx.beginPath(); ctx.roundRect(-35, -20, 70, bottom + 20, 16); ctx.fill();
  }
  if (d.hair === 'pigtails') {
    for (const side of [-1, 1]) { ctx.beginPath(); ctx.arc(side * 39, 4, 13, 0, Math.PI * 2); ctx.fill(); }
  }
  if (d.hair === 'bun') { ctx.beginPath(); ctx.arc(0, -40, 14, 0, Math.PI * 2); ctx.fill(); }

  ctx.fillStyle = d.skin;
  ctx.beginPath(); ctx.arc(0, 0, 30, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = d.hairColor;   // 瀏海：蓋住臉的上緣
  ctx.beginPath(); ctx.arc(0, 0, 33, Math.PI * 1.02, Math.PI * 1.98); ctx.quadraticCurveTo(0, -22, -33, -2); ctx.fill();

  ctx.fillStyle = INK;
  for (const side of [-1, 1]) { ctx.beginPath(); ctx.arc(side * 11, 2, 3.6, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = 'rgba(240, 120, 120, 0.45)';
  for (const side of [-1, 1]) { ctx.beginPath(); ctx.arc(side * 19, 11, 5, 0, Math.PI * 2); ctx.fill(); }
  ctx.strokeStyle = INK; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(0, 9, 7, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();

  if (d.extra === 'glasses') {
    ctx.lineWidth = 2.6;
    for (const side of [-1, 1]) { ctx.beginPath(); ctx.arc(side * 11, 2, 8.5, 0, Math.PI * 2); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(-2.5, 2); ctx.lineTo(2.5, 2); ctx.stroke();
  }
  if (d.extra === 'hat') {
    ctx.fillStyle = HAT_COLOR;
    ctx.beginPath(); ctx.roundRect(-22, -48, 44, 24, 8); ctx.fill();
    ctx.beginPath(); ctx.roundRect(-40, -28, 80, 9, 4); ctx.fill();
  }
  if (d.extra === 'crown') {
    ctx.fillStyle = CROWN_COLOR;
    ctx.beginPath();
    ctx.moveTo(-20, -26); ctx.lineTo(-22, -48); ctx.lineTo(-10, -37); ctx.lineTo(0, -52); ctx.lineTo(10, -37); ctx.lineTo(22, -48); ctx.lineTo(20, -26);
    ctx.closePath(); ctx.fill();
  }
}

function drawBody(ctx, d) {
  // 以 (0,0) 為脖子：往下畫身體和腳
  if (d.extra === 'backpack') {
    ctx.fillStyle = PACK_COLOR;
    ctx.beginPath(); ctx.roundRect(-30, 2, 60, 40, 10); ctx.fill();
  }
  ctx.fillStyle = d.bottom === 'skirt' ? d.skin : d.bottomColor;
  for (const side of [-1, 1]) { ctx.beginPath(); ctx.roundRect(side * 11 - 7, 40, 14, 42, 6); ctx.fill(); }
  if (d.bottom === 'skirt') {
    ctx.fillStyle = d.bottomColor;
    ctx.beginPath(); ctx.moveTo(-20, 36); ctx.lineTo(20, 36); ctx.lineTo(30, 62); ctx.lineTo(-30, 62); ctx.closePath(); ctx.fill();
  }
  ctx.fillStyle = d.top;
  ctx.beginPath(); ctx.roundRect(-22, -4, 44, 48, 12); ctx.fill();
  for (const side of [-1, 1]) { ctx.beginPath(); ctx.roundRect(side * 28 - 6, 0, 12, 34, 6); ctx.fill(); }
  ctx.strokeStyle = 'rgba(74, 59, 51, 0.18)'; ctx.lineWidth = 1.5;   // 白衣服在白底上也看得到
  ctx.beginPath(); ctx.roundRect(-22, -4, 44, 48, 12); ctx.stroke();
  if (d.extra === 'backpack') {   // 背帶
    ctx.fillStyle = PACK_COLOR;
    for (const side of [-1, 1]) ctx.fillRect(side * 13 - 3.5, -4, 7, 34);
  }
}

/** mode：'head' 只畫頭；'full' 畫全身，小孩畫得比大人矮。 */
export function drawAvatar(canvas, d, mode = 'head') {
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, w, h);
  if (mode === 'head') {
    const s = w / 110;
    ctx.setTransform(s, 0, 0, s, w / 2, h / 2 + 8 * s);
    drawHead(ctx, d);
    return;
  }
  const s = (h / 165) * (d.size === 'child' ? 0.74 : 1);
  const feet = h - 5 * (h / 165);
  ctx.setTransform(s, 0, 0, s, w / 2, feet - 82 * s);
  drawBody(ctx, d);
  const headScale = d.size === 'child' ? 1.12 : 0.95;
  ctx.setTransform(s * headScale, 0, 0, s * headScale, w / 2, feet - 82 * s - 26 * s * headScale);
  drawHead(ctx, d);
}
