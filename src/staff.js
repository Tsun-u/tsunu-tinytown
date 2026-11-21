// 固定角色：醫生、護理師、店員、老師。跟玩家的小人一樣可以拖、可以坐、可以搭電梯，位置也會存檔；
// 差別是不會出現在造型面板裡（不能改造型、不能刪）。這張表是他們一開始站的位置和制服。
const nurse = { skin: '#ffe0c4', hair: 'bun', hairColor: '#6b4226', top: '#f7a8c4', bottom: 'skirt', bottomColor: '#ffffff', extra: 'nurseCap', size: 'adult' };

export const STAFF = [
  { id: 'nurse', place: 'hospital', x: -1.55, z: -2.35, facing: 0, design: nurse },   // 掛號櫃台後面
  { id: 'doctor', place: 'hospital', x: 2.45, z: -0.6, facing: Math.PI / 4, design: { skin: '#f6c9a0', hair: 'short', hairColor: '#2f2622', top: '#ffffff', bottom: 'pants', bottomColor: '#5b8def', extra: 'stethoscope', size: 'adult' } },
  { id: 'wardNurse', place: 'hospital2', x: -2.28, z: -0.5, facing: Math.PI / 4, design: { ...nurse, hair: 'bob', top: '#8fd6c4' } },
  { id: 'cashier', place: 'dept0', x: 1.75, z: 0.6, facing: 0, design: { skin: '#f6c9a0', hair: 'bob', hairColor: '#6b4226', top: '#6fbf73', bottom: 'pants', bottomColor: '#5a5560', extra: 'none', apron: '#ffffff', size: 'adult' } },
  { id: 'clerk', place: 'dept1', x: 1.85, z: 0.72, facing: 0, design: { skin: '#ffe0c4', hair: 'bun', hairColor: '#2f2622', top: '#a77bd9', bottom: 'skirt', bottomColor: '#5a5560', extra: 'none', size: 'adult' } },
  { id: 'bookseller', place: 'dept2', x: -0.9, z: -2.3, facing: 0, design: { skin: '#f6c9a0', hair: 'long', hairColor: '#8a5a2b', top: '#f6d04d', bottom: 'pants', bottomColor: '#5b8def', extra: 'glasses', apron: '#5b8def', size: 'adult' } },
  { id: 'iceCream', place: 'dept3', x: -3.1, z: -2.6, facing: 0, design: { skin: '#ffe0c4', hair: 'pigtails', hairColor: '#6b4226', top: '#f29bc0', bottom: 'skirt', bottomColor: '#ffffff', extra: 'none', apron: '#ffffff', size: 'adult' } },
  { id: 'chef', place: 'dept3', x: -1.1, z: -2.6, facing: 0, design: { skin: '#f6c9a0', hair: 'short', hairColor: '#2f2622', top: '#ffffff', bottom: 'pants', bottomColor: '#5a5560', extra: 'chefHat', apron: '#e2574c', size: 'adult' } },
  { id: 'dentist', place: 'dentist', x: -0.4, z: -1.5, facing: Math.PI / 2, design: { skin: '#f6c9a0', hair: 'bob', hairColor: '#2f2622', top: '#ffffff', bottom: 'pants', bottomColor: '#8fd6c4', extra: 'glasses', size: 'adult' } },   // 診療椅的左邊，才不會擋住躺著的人
  { id: 'dentalNurse', place: 'dentist', x: -2.5, z: -2.4, facing: 0, design: { skin: '#ffe0c4', hair: 'pigtails', hairColor: '#8a5a2b', top: '#8fd6c4', bottom: 'skirt', bottomColor: '#ffffff', extra: 'none', apron: '#ffffff', size: 'adult' } },   // 櫃台後面
  { id: 'teacher', place: 'kinder', x: 0.6, z: -2.2, facing: Math.PI / 5, design: { skin: '#ffe0c4', hair: 'long', hairColor: '#6b4226', top: '#f29b4b', bottom: 'skirt', bottomColor: '#5b8def', extra: 'none', apron: '#f6d04d', size: 'adult' } },
  { id: 'yardTeacher', place: 'kinder', x: 0.9, z: 4.0, facing: Math.PI / 4, design: { skin: '#f6c9a0', hair: 'short', hairColor: '#2f2622', top: '#6fbf73', bottom: 'pants', bottomColor: '#5a5560', extra: 'hat', apron: '#ffffff', size: 'adult' } },
];
