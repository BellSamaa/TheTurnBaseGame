// ============================================================
// Dice Maniac Character Kit v2 Metadata & Helpers
// Layer contract: 64x96 canvas, origin (0, 0)
// Layer order: accessory_back -> hair_back -> body -> pants -> shirt -> face -> hair_front -> accessory_front
// ============================================================

export interface BodyOption {
  id: string;
  nameEn: string;
  nameVi: string;
  gender: 'male' | 'female';
  build: number;
}

export const BODIES_V2: BodyOption[] = [
  { id: 'male_1', nameEn: 'Male Slim (Knight)', nameVi: 'Nam Thon Gọn (Hiệp Sĩ)', gender: 'male', build: 1 },
  { id: 'male_2', nameEn: 'Male Standard (Warrior)', nameVi: 'Nam Chuẩn (Chiến Binh)', gender: 'male', build: 2 },
  { id: 'male_3', nameEn: 'Male Athletic (Fighter)', nameVi: 'Nam Vạm Vỡ (Võ Sĩ)', gender: 'male', build: 3 },
  { id: 'male_4', nameEn: 'Male Heavy (Titan)', nameVi: 'Nam Khổng Lồ (Đấu Sĩ)', gender: 'male', build: 4 },
  { id: 'female_1', nameEn: 'Female Petite (Rogue)', nameVi: 'Nữ Nhỏ Nhắn (Sát Thủ)', gender: 'female', build: 1 },
  { id: 'female_2', nameEn: 'Female Standard (Mage)', nameVi: 'Nữ Chuẩn (Pháp Sư)', gender: 'female', build: 2 },
  { id: 'female_3', nameEn: 'Female Athletic (Ranger)', nameVi: 'Nữ Thể Thao (Cung Thủ)', gender: 'female', build: 3 },
  { id: 'female_4', nameEn: 'Female Heavy (Valkyrie)', nameVi: 'Nữ Lực Lưỡng (Chiến Binh Nữ)', gender: 'female', build: 4 },
];

export interface ItemOption {
  id: string;
  nameEn: string;
  nameVi: string;
}

export const HAIR_V2: ItemOption[] = [
  { id: 'crop', nameEn: 'Crew Crop', nameVi: 'Tóc Cắt Ngắn' },
  { id: 'side_part', nameEn: 'Side Part', nameVi: 'Tóc Rẽ Ngôi' },
  { id: 'spiky', nameEn: 'Spiky Anime', nameVi: 'Tóc Nhọn Gai' },
  { id: 'messy', nameEn: 'Messy Shag', nameVi: 'Tóc Rối Lãng Tử' },
  { id: 'curtain', nameEn: 'Curtain Bangs', nameVi: 'Tóc Hai Mái' },
  { id: 'quiff', nameEn: 'Modern Quiff', nameVi: 'Tóc Vuốt Quiff' },
  { id: 'bob', nameEn: 'Classic Bob', nameVi: 'Tóc Bob Ngắn' },
  { id: 'pixie', nameEn: 'Pixie Cut', nameVi: 'Tóc Pixie Cá Tính' },
  { id: 'long_straight', nameEn: 'Long Straight', nameVi: 'Tóc Dài Thẳng' },
  { id: 'long_wavy', nameEn: 'Long Wavy', nameVi: 'Tóc Dài Gợn Sóng' },
  { id: 'ponytail', nameEn: 'High Ponytail', nameVi: 'Tóc Đuôi Ngựa' },
  { id: 'twin_tails', nameEn: 'Twin Tails', nameVi: 'Tóc Hai Bím' },
  { id: 'double_buns', nameEn: 'Double Buns', nameVi: 'Tóc Búi Củ Tỏi' },
  { id: 'braid', nameEn: 'Hero Braid', nameVi: 'Tóc Bện Hiệp Sĩ' },
  { id: 'side_braid', nameEn: 'Side Braid', nameVi: 'Tóc Tết Một Bên' },
  { id: 'afro', nameEn: 'Afro Puff', nameVi: 'Tóc Xù Afro' },
  { id: 'mohawk', nameEn: 'Punk Mohawk', nameVi: 'Tóc Mào Gà Punk' },
  { id: 'shag', nameEn: 'Layered Shag', nameVi: 'Tóc Tỉa Layer' },
  { id: 'undercut', nameEn: 'Undercut Slick', nameVi: 'Tóc Undercut' },
  { id: 'swept', nameEn: 'Wind Swept', nameVi: 'Tóc Bay Theo Gió' },
];

export const FACES_V2: ItemOption[] = [
  { id: '00', nameEn: 'Determined', nameVi: 'Kiên Định' },
  { id: '01', nameEn: 'Confident Smile', nameVi: 'Cười Tự Tin' },
  { id: '02', nameEn: 'Fierce Battler', nameVi: 'Chiến Đấu Dữ Dội' },
  { id: '03', nameEn: 'Calm Hero', nameVi: 'Bình Thản' },
  { id: '04', nameEn: 'Playful Wink', nameVi: 'Nháy Mắt Tinh Nghịch' },
  { id: '05', nameEn: 'Stoic Knight', nameVi: 'Lạnh Lùng Trầm Mặc' },
  { id: '06', nameEn: 'Focused Eyes', nameVi: 'Tập Trung Cao Độ' },
  { id: '07', nameEn: 'Cheery Adventurer', nameVi: 'Vui Vẻ Hào Hứng' },
  { id: '08', nameEn: 'Grinning Challenger', nameVi: 'Cười Thách Thức' },
  { id: '09', nameEn: 'Serene Mystic', nameVi: 'Huyền Bí Điềm Đạm' },
];

export const SHIRTS_V2: ItemOption[] = [
  { id: 'crew_tee', nameEn: 'Crew Tee', nameVi: 'Áo Thun Cổ Tròn' },
  { id: 'vneck', nameEn: 'V-Neck Shirt', nameVi: 'Áo Cổ Tim' },
  { id: 'polo', nameEn: 'Combat Polo', nameVi: 'Áo Polo Thể Thao' },
  { id: 'long_sleeve', nameEn: 'Long Sleeve Tee', nameVi: 'Áo Dài Tay' },
  { id: 'tank', nameEn: 'Muscle Tank', nameVi: 'Áo Ba Lỗ Thể Hình' },
  { id: 'hoodie', nameEn: 'Street Hoodie', nameVi: 'Áo Hoodie Đường Phố' },
  { id: 'zip_hoodie', nameEn: 'Zip Hoodie', nameVi: 'Áo Khoác Nón Kéo Khóa' },
  { id: 'sweatshirt', nameEn: 'Cozy Sweatshirt', nameVi: 'Áo Nỉ Dày Dặn' },
  { id: 'cardigan', nameEn: 'Scholar Cardigan', nameVi: 'Áo Len Cardigan' },
  { id: 'denim_jacket', nameEn: 'Denim Jacket', nameVi: 'Áo Khoác Bò Denim' },
  { id: 'bomber', nameEn: 'Flight Bomber', nameVi: 'Áo Khoác Phi Công' },
  { id: 'leather_jacket', nameEn: 'Rider Leather', nameVi: 'Áo Khoác Da Biker' },
  { id: 'formal', nameEn: 'Formal Suit Shirt', nameVi: 'Áo Sơ Mi Lịch Lãm' },
  { id: 'vest', nameEn: 'Tactical Vest', nameVi: 'Áo Ghi Lê Tác Chiến' },
  { id: 'turtleneck', nameEn: 'Turtleneck Sweater', nameVi: 'Áo Len Cổ Lọ' },
  { id: 'striped', nameEn: 'Striped Mariner', nameVi: 'Áo Kẻ Sọc Thủy Thủ' },
  { id: 'baseball', nameEn: 'Baseball Jersey', nameVi: 'Áo Bóng Chày' },
  { id: 'tunic', nameEn: 'Adventurer Tunic', nameVi: 'Áo Choàng Du Ca' },
  { id: 'light_armor', nameEn: 'Light Steel Armor', nameVi: 'Giáp Thép Nhẹ' },
  { id: 'raincoat', nameEn: 'Cyber Raincoat', nameVi: 'Áo Khoác Mưa Cyber' },
];

export const PANTS_V2: ItemOption[] = [
  { id: 'straight', nameEn: 'Straight Jeans', nameVi: 'Quần Bò Ống Thẳng' },
  { id: 'slim', nameEn: 'Slim Fit Trousers', nameVi: 'Quần Tây Ôm' },
  { id: 'baggy', nameEn: 'Baggy Streetwear', nameVi: 'Quần Rộng Đường Phố' },
  { id: 'cargo', nameEn: 'Cargo Pockets', nameVi: 'Quần Túi Hộp Cargo' },
  { id: 'joggers', nameEn: 'Sport Joggers', nameVi: 'Quần Nỉ Bo Gấu' },
  { id: 'formal', nameEn: 'Formal Slacks', nameVi: 'Quần Âu Sang Trọng' },
  { id: 'chinos', nameEn: 'Casual Chinos', nameVi: 'Quần Kaki Chinos' },
  { id: 'cropped', nameEn: 'Cropped Pants', nameVi: 'Quần Lửng Thời Trang' },
  { id: 'sport_shorts', nameEn: 'Athletic Shorts', nameVi: 'Quần Đùi Thể Thao' },
  { id: 'denim_shorts', nameEn: 'Denim Shorts', nameVi: 'Quần Short Bò' },
  { id: 'cargo_shorts', nameEn: 'Cargo Shorts', nameVi: 'Quần Short Túi Hộp' },
  { id: 'knee_shorts', nameEn: 'Knee Bermuda', nameVi: 'Quần Lửng Đến Gối' },
  { id: 'overalls', nameEn: 'Work Overalls', nameVi: 'Quần Yếm Lao Động' },
  { id: 'tactical', nameEn: 'Tactical Combatants', nameVi: 'Quần Tác Chiến Quân Đội' },
  { id: 'greaves', nameEn: 'Knight Greaves', nameVi: 'Giáp Ống Chân Thép' },
  { id: 'martial', nameEn: 'Martial Gi Pants', nameVi: 'Quần Võ Thuật' },
  { id: 'bellbottom', nameEn: 'Retro Bellbottom', nameVi: 'Quần Ống Loe Retro' },
  { id: 'patched', nameEn: 'Patched Denim', nameVi: 'Quần Bò Chắp Vá' },
  { id: 'checked', nameEn: 'Checked Tartan', nameVi: 'Quần Kẻ Ca-rô' },
  { id: 'harem', nameEn: 'Desert Harem', nameVi: 'Quần Aladdin Sa Mạc' },
];

export const ACCESSORIES_V2: ItemOption[] = [
  { id: 'round_glasses', nameEn: 'Round Glasses', nameVi: 'Kính Tròn Tri Thức' },
  { id: 'square_glasses', nameEn: 'Square Frames', nameVi: 'Kính Vuông Trí Tuệ' },
  { id: 'sunglasses', nameEn: 'Cool Shades', nameVi: 'Kính Râm Ngầu' },
  { id: 'monocle', nameEn: 'Noble Monocle', nameVi: 'Kính Một Mắt Quý Tộc' },
  { id: 'hoops', nameEn: 'Gold Hoops', nameVi: 'Khuyên Tai Tròn Vàng' },
  { id: 'studs', nameEn: 'Gem Studs', nameVi: 'Khuyên Tai Đính Ngọc' },
  { id: 'scarf', nameEn: 'Winter Scarf', nameVi: 'Khăn Quàng Mùa Đông' },
  { id: 'neckerchief', nameEn: 'Silk Neckerchief', nameVi: 'Khăn Cổ Lụa' },
  { id: 'beanie', nameEn: 'Knit Beanie', nameVi: 'Mũ Len Ấm Áp' },
  { id: 'cap', nameEn: 'Snapback Cap', nameVi: 'Mũ Lưỡi Trai' },
  { id: 'headphones', nameEn: 'Studio Headphones', nameVi: 'Tai Nghe Chụp Tai' },
  { id: 'crown', nameEn: 'Golden Crown', nameVi: 'Vương Miện Hoàng Gia' },
  { id: 'headband', nameEn: 'Shinobi Headband', nameVi: 'Băng Đeo Trán Ninja' },
  { id: 'eyepatch', nameEn: 'Pirate Eyepatch', nameVi: 'Bịt Mắt Hải Tặc' },
  { id: 'mask', nameEn: 'Shinobi Mask', nameVi: 'Khẩu Trang Sát Thủ' },
  { id: 'necklace', nameEn: 'Pendant Necklace', nameVi: 'Dây Chuyền Mặt Ngọc' },
  { id: 'bowtie', nameEn: 'Dapper Bowtie', nameVi: 'Nơ Đeo Cổ Lịch Lãm' },
  { id: 'backpack', nameEn: 'Explorer Backpack', nameVi: 'Balo Nhà Thám Hiểm' },
  { id: 'wristbands', nameEn: 'Brawler Wristbands', nameVi: 'Băng Cuốn Cổ Tay' },
  { id: 'belt_pouch', nameEn: 'Alchemist Belt Pouch', nameVi: 'Túi Da Đeo Hông' },
];

export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function getCharacterV2Layers(customization: {
  baseIndex?: number;
  hairIndex?: number;
  hairColor?: string;
  skinColor?: string;
  shirtIndex?: number;
  shirtColor?: string;
  pantsIndex?: number;
  pantsColor?: string;
  accessoryIndex?: number;
  faceIndex?: number;
}): { path: string; color?: string }[] {
  const bodyIdx = Math.max(0, Math.min(7, customization.baseIndex ?? 0));
  const bodyId = BODIES_V2[bodyIdx].id;

  const hairIdx = Math.max(0, Math.min(19, customization.hairIndex ?? 0));
  const hairNum = pad2(hairIdx);

  const faceIdx = Math.max(0, Math.min(9, customization.faceIndex ?? 0));
  const faceNum = pad2(faceIdx);

  const shirtIdx = Math.max(0, Math.min(19, customization.shirtIndex ?? 0));
  const shirtNum = pad2(shirtIdx);

  const pantsIdx = Math.max(0, Math.min(19, customization.pantsIndex ?? 0));
  const pantsNum = pad2(pantsIdx);

  const accIdx = customization.accessoryIndex ?? -1;
  const hasAcc = accIdx >= 0 && accIdx < 20;
  const accNum = hasAcc ? pad2(accIdx) : '';

  const BASE_DIR = '/assets/sprites/character_kit_v2';

  // Strict Layer Order from manifest.json:
  // 1. accessory_back
  // 2. hair_back
  // 3. body
  // 4. pants
  // 5. shirt
  // 6. face
  // 7. hair_front
  // 8. accessory_front

  const layers: { path: string; color?: string }[] = [];

  // 1. Accessory Back (if equipped)
  if (hasAcc) {
    layers.push({
      path: `${BASE_DIR}/accessories/${bodyId}/${accNum}_back.png`,
    });
  }

  // 2. Hair Back
  layers.push({
    path: `${BASE_DIR}/hair/${hairNum}_back.png`,
    color: customization.hairColor || '#87562e',
  });

  // 3. Body Base
  layers.push({
    path: `${BASE_DIR}/bodies/${bodyId}.png`,
    color: customization.skinColor || '#e8b88b',
  });

  // 4. Pants (body-matched geometry)
  layers.push({
    path: `${BASE_DIR}/pants/${bodyId}/${pantsNum}.png`,
    color: customization.pantsColor || '#526785',
  });

  // 5. Shirt (body-matched geometry)
  layers.push({
    path: `${BASE_DIR}/shirts/${bodyId}/${shirtNum}.png`,
    color: customization.shirtColor || '#38b4ad',
  });

  // 6. Face
  layers.push({
    path: `${BASE_DIR}/faces/${faceNum}.png`,
  });

  // 7. Hair Front
  layers.push({
    path: `${BASE_DIR}/hair/${hairNum}_front.png`,
    color: customization.hairColor || '#87562e',
  });

  // 8. Accessory Front (if equipped)
  if (hasAcc) {
    layers.push({
      path: `${BASE_DIR}/accessories/${bodyId}/${accNum}_front.png`,
    });
  }

  return layers;
}
