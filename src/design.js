// 小人的造型選項，以及 2D 頭像（大頭照按鈕、造型面板的圖示都用它畫）。

export const SKINS = ['#ffe0c4', '#f6c9a0', '#e0a878', '#b9794e', '#8a5a3c'];
export const HAIR_COLORS = ['#2f2622', '#6b4226', '#c98a3c', '#f2d16b', '#e2574c', '#f29bc0', '#5b8def'];
export const CLOTH_COLORS = ['#e2574c', '#f29b4b', '#f6d04d', '#6fbf73', '#4fb7c5', '#5b8def', '#a77bd9', '#f29bc0', '#ffffff', '#5a5560'];
export const HAIRS = ['short', 'bob', 'long', 'pigtails', 'bun'];
export const BOTTOMS = ['pants', 'skirt'];
export const EXTRAS = ['none', 'hat', 'glasses', 'backpack', 'crown'];
export const SIZES = ['adult', 'child', 'dog'];   // 狗狗也是一種角色：造型用下面那幾個狗狗專用的欄位，上衣顏色當項圈
const PEOPLE_SIZES = ['adult', 'child'];
export const FUR_COLORS = ['#f4e3c8', '#e0a45c', '#a86b3c', '#6b4a36', '#3a3230', '#ffffff', '#b9b4ae'];
export const EARS = ['floppy', 'pointy'];
export const PATCHES = ['none', 'eye', 'back'];
export const DOG_DEFAULTS = { fur: '#e0a45c', ears: 'floppy', patch: 'none' };

/** 把顏色調暗（factor 小於 1）或調亮（大於 1）。 */
function shade(hex, factor) {
  const channels = [1, 3, 5].map((i) => Math.min(255, Math.round(parseInt(hex.slice(i, i + 2), 16) * factor)));
  return '#' + channels.map((c) => c.toString(16).padStart(2, '0')).join('');
}

/** 狗狗身上每個部位的顏色和樣子。耳朵和斑塊用比毛色深一階的顏色，毛色很深時改用淺色才看得出來。 */
export function dogLook(d) {
  const fur = d.fur || DOG_DEFAULTS.fur;
  const dark = parseInt(fur.slice(1, 3), 16) + parseInt(fur.slice(3, 5), 16) + parseInt(fur.slice(5, 7), 16) < 300;
  return {
    fur, ears: d.ears || DOG_DEFAULTS.ears, patch: d.patch || DOG_DEFAULTS.patch, collar: d.top,
    mark: dark ? '#f4e3c8' : shade(fur, 0.62),
    snout: dark ? shade(fur, 1.5) : '#fff6ea',
  };
}
export const MAX_PEOPLE = 6;

export const HAT_COLOR = '#e2574c';
export const PACK_COLOR = '#5b8def';
export const CROWN_COLOR = '#f6c644';
const INK = '#4a3b33';

const pick = (list) => list[Math.floor(Math.random() * list.length)];

export function randomDesign(size = pick(PEOPLE_SIZES)) {
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

function drawDogHead(ctx, d) {
  // 跟人的頭一樣，以 (0,0) 為臉的中心、臉半徑 30 來畫
  const look = dogLook(d);
  ctx.fillStyle = look.mark;
  if (look.ears === 'floppy') {
    for (const side of [-1, 1]) { ctx.beginPath(); ctx.ellipse(side * 31, 6, 11, 24, side * 0.2, 0, Math.PI * 2); ctx.fill(); }
  } else {
    for (const side of [-1, 1]) { ctx.beginPath(); ctx.moveTo(side * 30, -8); ctx.lineTo(side * 24, -46); ctx.lineTo(side * 4, -24); ctx.closePath(); ctx.fill(); }
  }
  ctx.fillStyle = look.fur;
  ctx.beginPath(); ctx.arc(0, 0, 30, 0, Math.PI * 2); ctx.fill();
  if (look.patch === 'eye') { ctx.fillStyle = look.mark; ctx.beginPath(); ctx.ellipse(11, 0, 11, 12, 0, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = look.snout;
  ctx.beginPath(); ctx.ellipse(0, 14, 15, 12, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = INK;
  for (const side of [-1, 1]) { ctx.beginPath(); ctx.arc(side * 11, 0, 3.6, 0, Math.PI * 2); ctx.fill(); }
  ctx.beginPath(); ctx.ellipse(0, 8, 5.5, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f28ba0';   // 舌頭
  ctx.beginPath(); ctx.roundRect(-4, 16, 8, 9, 4); ctx.fill();
}

function drawDogBody(ctx, d) {
  // 以 (0,0) 為脖子：正面坐著的狗狗
  const look = dogLook(d);
  ctx.fillStyle = look.fur;
  ctx.beginPath(); ctx.ellipse(27, 44, 7, 16, 0.7, 0, Math.PI * 2); ctx.fill();   // 尾巴
  ctx.beginPath(); ctx.roundRect(-22, -6, 44, 60, 18); ctx.fill();
  if (look.patch === 'back') { ctx.fillStyle = look.mark; ctx.beginPath(); ctx.ellipse(-10, 22, 9, 13, 0, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = look.snout;
  for (const side of [-1, 1]) { ctx.beginPath(); ctx.roundRect(side * 11 - 7, 44, 14, 14, 6); ctx.fill(); }   // 前腳掌
  ctx.fillStyle = look.collar;
  ctx.beginPath(); ctx.roundRect(-20, -2, 40, 9, 4); ctx.fill();
  ctx.fillStyle = CROWN_COLOR;
  ctx.beginPath(); ctx.arc(0, 11, 4.5, 0, Math.PI * 2); ctx.fill();
}

/** mode：'head' 只畫頭；'full' 畫全身，小孩畫得比大人矮，狗狗最矮。 */
export function drawAvatar(canvas, d, mode = 'head') {
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const dog = d.size === 'dog';
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, w, h);
  if (mode === 'head') {
    const s = w / 110;
    ctx.setTransform(s, 0, 0, s, w / 2, h / 2 + 8 * s);
    (dog ? drawDogHead : drawHead)(ctx, d);
    return;
  }
  if (dog) {
    const s = (h / 165) * 1.2, feet = h - 5 * (h / 165);
    ctx.setTransform(s, 0, 0, s, w / 2, feet - 58 * s);
    drawDogBody(ctx, d);
    ctx.setTransform(s * 1.05, 0, 0, s * 1.05, w / 2, feet - 58 * s - 26 * s);
    drawDogHead(ctx, d);
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
