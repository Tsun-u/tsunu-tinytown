// 造型面板：選要改哪個人、加人、刪人，以及每一排造型選項。全部用圖示和色塊。
import { SKINS, HAIR_COLORS, CLOTH_COLORS, HAIRS, BOTTOMS, EXTRAS, SIZES, MAX_PEOPLE, drawAvatar } from './design.js';

const ICONS = {
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4h6v3M6.5 7l1 13h9l1-13M10 11v6M14 11v6"/></svg>',
};

// 每一排選項：改 design 的哪個欄位、有哪些值、圖示怎麼畫（adultIcon：圖示固定用大人尺寸畫，小孩的全身圖太小看不清楚）
const ROWS = [
  { field: 'size', values: SIZES, label: '大人或小孩', icon: 'full' },
  { field: 'skin', values: SKINS, label: '膚色', swatch: true },
  { field: 'hair', values: HAIRS, label: '髮型', icon: 'head' },
  { field: 'hairColor', values: HAIR_COLORS, label: '髮色', swatch: true },
  { field: 'top', values: CLOTH_COLORS, label: '上衣顏色', swatch: true },
  { field: 'bottom', values: BOTTOMS, label: '褲子或裙子', icon: 'full', adultIcon: true },
  { field: 'bottomColor', values: CLOTH_COLORS, label: '褲裙顏色', swatch: true },
  { field: 'extra', values: EXTRAS, label: '配件', icon: 'full', adultIcon: true },
];

function iconCanvas(design, mode) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 120;
  drawAvatar(canvas, design, mode);
  return canvas;
}

export class Creator {
  constructor(hooks) {
    this.hooks = hooks;
    this.open = false;
    this.armed = false;   // 垃圾桶按過第一下、等第二下確認
    this.panel = document.getElementById('creator');
    this.peopleRow = document.getElementById('peopleRow');
    this.options = document.getElementById('creatorOptions');
    const done = document.getElementById('creatorDone');
    done.innerHTML = ICONS.check;
    done.addEventListener('click', () => this.toggle());
    this.panel.addEventListener('click', (e) => {
      if (this.armed && !e.target.closest('.danger')) { this.armed = false; this.sync(); }
    });
  }

  toggle() {
    this.open = !this.open;
    this.armed = false;
    this.panel.hidden = !this.open;
    this.sync();
    this.hooks.onToggle();
  }

  sync() {
    if (!this.open) return;
    const person = this.hooks.getSelected();
    if (!person) return;
    this.renderPeople(person);
    this.renderOptions(person);
  }

  renderPeople(current) {
    const people = this.hooks.getPeople();
    this.peopleRow.replaceChildren();
    for (const person of people) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip' + (person === current ? ' on' : '');
      chip.setAttribute('aria-label', '改這個人');
      chip.append(iconCanvas(person.data.design, 'head'));
      chip.addEventListener('click', () => this.hooks.onSelect(person));
      this.peopleRow.append(chip);
    }
    const add = document.createElement('button');
    add.type = 'button';
    add.className = 'chip';
    add.id = 'addPerson';
    add.setAttribute('aria-label', '加一個人');
    add.innerHTML = ICONS.plus;
    add.disabled = people.length >= MAX_PEOPLE;
    add.addEventListener('click', () => this.hooks.onAdd());

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'chip danger' + (this.armed ? ' armed' : '');
    remove.id = 'removePerson';
    remove.setAttribute('aria-label', this.armed ? '再按一次就刪掉這個人' : '刪掉這個人');
    remove.innerHTML = this.armed ? ICONS.check : ICONS.trash;
    remove.disabled = people.length <= 1;
    remove.addEventListener('click', () => {
      if (!this.armed) { this.armed = true; this.sync(); return; }
      this.armed = false;
      this.hooks.onRemove(current);
    });
    this.peopleRow.append(add, remove);
  }

  renderOptions(person) {
    const design = person.data.design;
    const scroll = this.options.scrollTop;
    this.options.replaceChildren();
    for (const row of ROWS) {
      const line = document.createElement('div');
      line.className = 'chip-row';
      line.setAttribute('role', 'group');
      line.setAttribute('aria-label', row.label);
      for (const value of row.values) {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.field = row.field;
        button.dataset.value = value;
        const on = design[row.field] === value;
        if (row.swatch) {
          button.className = 'swatch' + (on ? ' on' : '');
          button.style.background = value;
        } else {
          button.className = 'chip' + (on ? ' on' : '');
          const shown = { ...design, [row.field]: value };
          if (row.adultIcon) shown.size = 'adult';
          button.append(iconCanvas(shown, row.icon));
        }
        button.addEventListener('click', () => {
          design[row.field] = value;
          this.hooks.onChange(person);
          this.sync();
        });
        line.append(button);
      }
      this.options.append(line);
    }
    this.options.scrollTop = scroll;
  }
}
