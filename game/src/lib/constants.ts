import type { ClassInfo, WeaponInfo, MapInfo, CharacterCustomization } from '@/types/game';

// ============================================================
// Asset path helpers
// ============================================================
export const ASSET_PATHS = {
  images: '/assets/images',
  background: '/assets/images/background.png',
  logo: '/assets/images/logo.png',
  characters: '/assets/images/characters',
  classui: '/assets/images/classui',
  frames: '/assets/images/frames',
  maps: '/assets/images/maps',
  weapons: '/assets/images/weapons',
  models: '/assets/models',
  music: '/assets/music',
} as const;

// ============================================================
// Class Definitions (Theo đúng luật chơi chi tiết)
// ============================================================
export const CLASS_DEFINITIONS: Record<string, ClassInfo> = {
  assassin: {
    id: 'assassin',
    name: 'Assassin',
    nameVi: 'Sát Thủ',
    description: 'Tăng 50% sát thương gây ra, giảm 1/4 HP tối đa (còn 75 HP).',
    descriptionVi: 'Tăng 50% sát thương gây ra, giảm 1/4 HP tối đa (còn 75 HP).',
    image: `${ASSET_PATHS.classui}/class-assassin.png`,
    hpModifier: 0.75,
    damageModifier: 1.5,
    damageReduction: 1.0,
    extraD6Rolls: 0,
    extraD20Rolls: 0,
    baseHp: 75,
  },
  tanker: {
    id: 'tanker',
    name: 'Tanker',
    nameVi: 'Đỡ Đòn',
    description: 'Giáp vững như bàn thạch. Giảm 30% toàn bộ sát thương nhận vào.',
    descriptionVi: 'Giáp vững như bàn thạch. Giảm 30% toàn bộ sát thương nhận vào.',
    image: `${ASSET_PATHS.classui}/class-tanker.png`,
    hpModifier: 1.0,
    damageModifier: 1.0,
    damageReduction: 0.7,
    extraD6Rolls: 0,
    extraD20Rolls: 0,
    baseHp: 100,
  },
  juggernaut: {
    id: 'juggernaut',
    name: 'Juggernaut',
    nameVi: 'Khổng Lồ',
    description: 'Tăng 50% HP tối đa (lên 150 HP), giảm 1/4 sát thương gây ra (còn 75%).',
    descriptionVi: 'Tăng 50% HP tối đa (lên 150 HP), giảm 1/4 sát thương gây ra (còn 75%).',
    image: `${ASSET_PATHS.classui}/class-juggernaut.png`,
    hpModifier: 1.5,
    damageModifier: 0.75,
    damageReduction: 1.0,
    extraD6Rolls: 0,
    extraD20Rolls: 0,
    baseHp: 150,
  },
  mage: {
    id: 'mage',
    name: 'Mage',
    nameVi: 'Pháp Sư',
    description: 'Bậc thầy nguyên tố. Được phép tung xúc xắc kỹ năng (D6) thêm 1 lần mỗi lượt.',
    descriptionVi: 'Bậc thầy nguyên tố. Được phép tung xúc xắc kỹ năng (D6) thêm 1 lần mỗi lượt.',
    image: `${ASSET_PATHS.classui}/class-mage.png`,
    hpModifier: 1.0,
    damageModifier: 1.0,
    damageReduction: 1.0,
    extraD6Rolls: 1,
    extraD20Rolls: 0,
    baseHp: 100,
  },
  boxer: {
    id: 'boxer',
    name: 'Boxer',
    nameVi: 'Võ Sĩ Quyền Anh',
    description: 'Cú đấm thép. Tung xúc xắc tấn công D20 2 lần sau đó lấy kết quả to hơn!',
    descriptionVi: 'Cú đấm thép. Tung xúc xắc tấn công D20 2 lần sau đó lấy kết quả to hơn!',
    image: `${ASSET_PATHS.classui}/class-boxer.png`,
    hpModifier: 1.0,
    damageModifier: 1.0,
    damageReduction: 1.0,
    extraD6Rolls: 0,
    extraD20Rolls: 1,
    baseHp: 100,
  },
  warrior: {
    id: 'warrior',
    name: 'Warrior',
    nameVi: 'Chiến Binh',
    description: 'Chiến binh toàn diện. Máu gốc 120 HP, tấn công ổn định không điểm yếu.',
    descriptionVi: 'Chiến binh toàn diện. Máu gốc 120 HP, tấn công ổn định không điểm yếu.',
    image: `${ASSET_PATHS.classui}/class-warrior.png`,
    hpModifier: 1.2,
    damageModifier: 1.0,
    damageReduction: 1.0,
    extraD6Rolls: 0,
    extraD20Rolls: 0,
    baseHp: 120,
  },
};

// ============================================================
// 9 Weapons với 2 kỹ năng (Skill 1: mốc sạc D6 15-30, Skill 2: đổ ra số chỉ định)
// ============================================================
export const WEAPON_DEFINITIONS: Record<string, WeaponInfo> = {
  greatsword: {
    id: 'greatsword',
    name: 'Silver Greatsword',
    nameVi: 'Đại Kiếm Bạc',
    image: `${ASSET_PATHS.weapons}/weapon-greatsword.png`,
    description: 'Thanh đại kiếm hai tay cổ xưa rèn từ bạc thánh.',
    descriptionVi: 'Thanh đại kiếm hai tay cổ xưa rèn từ bạc thánh.',
    skill1: {
      name: 'Judgement Cleave',
      nameVi: 'Nhát Chém Phán Quyết',
      chargeRequired: 20,
      description: 'Chém nhát chí mạng gây thêm 18 sát thương bỏ qua phòng thủ.',
      descriptionVi: 'Chém nhát chí mạng gây thêm 18 sát thương bỏ qua phòng thủ.',
      effect: 'cleave_18',
    },
    skill2: {
      name: 'Holy Blade Strike',
      nameVi: 'Thánh Kiếm Trảm',
      triggerNumber: 6,
      description: 'Khi đổ ra mặt 6: Kích hoạt ngay lập tức đòn chém thánh gây 12 sát thương!',
      descriptionVi: 'Khi đổ ra mặt 6: Kích hoạt ngay lập tức đòn chém thánh gây 12 sát thương!',
      effect: 'strike_12',
    },
  },
  bow: {
    id: 'bow',
    name: 'Curved Wood Bow',
    nameVi: 'Cung Gỗ Cong Tên Đỏ',
    image: `${ASSET_PATHS.weapons}/weapon-bow.png`,
    description: 'Cung tiễn săn thú thần với mũi tên đỏ tẩm độc.',
    descriptionVi: 'Cung tiễn săn thú thần với mũi tên đỏ tẩm độc.',
    skill1: {
      name: 'Rain of Arrows',
      nameVi: 'Mưa Tên Đỏ',
      chargeRequired: 16,
      description: 'Bắn loạt tên lửa gây 15 sát thương lên kẻ địch.',
      descriptionVi: 'Bắn loạt tên lửa gây 15 sát thương lên kẻ địch.',
      effect: 'arrow_rain_15',
    },
    skill2: {
      name: 'Piercing Heart',
      nameVi: 'Tên Xuyên Tim',
      triggerNumber: 1,
      description: 'Khi đổ ra mặt 1: Kích hoạt ngắm bắn chính xác gây ngay 10 sát thương chuẩn!',
      descriptionVi: 'Khi đổ ra mặt 1: Kích hoạt ngắm bắn chính xác gây ngay 10 sát thương chuẩn!',
      effect: 'piercing_10',
    },
  },
  dagger: {
    id: 'dagger',
    name: 'Blue Flame Dragon Dagger',
    nameVi: 'Dao Găm Rồng Lửa Xanh',
    image: `${ASSET_PATHS.weapons}/weapon-dagger-dragon.png`,
    description: 'Lưỡi đoản đao rèn từ vảy rồng băng lam rực cháy.',
    descriptionVi: 'Lưỡi đoản đao rèn từ vảy rồng băng lam rực cháy.',
    skill1: {
      name: 'Dragon Fang Rush',
      nameVi: 'Nanh Rồng Vồ Mồi',
      chargeRequired: 18,
      description: 'Ám sát chớp nhoáng gây 20 sát thương.',
      descriptionVi: 'Ám sát chớp nhoáng gây 20 sát thương.',
      effect: 'dragon_rush_20',
    },
    skill2: {
      name: 'Blue Flame Burn',
      nameVi: 'Lửa Lam Thiêu Rụi',
      triggerNumber: 4,
      description: 'Khi đổ ra mặt 4: Thiêu đốt đối thủ gây 11 sát thương thiêu đốt!',
      descriptionVi: 'Khi đổ ra mặt 4: Thiêu đốt đối thủ gây 11 sát thương thiêu đốt!',
      effect: 'burn_11',
    },
  },
  revolver: {
    id: 'revolver',
    name: 'Silver Six-Chamber Revolver',
    nameVi: 'Súng Lục Bạc Sáu Ổ Đạn',
    image: `${ASSET_PATHS.weapons}/weapon-revolver.png`,
    description: 'Súng lục phong cách miền tây cổ điển với đạn bạc nổ tung.',
    descriptionVi: 'Súng lục phong cách miền tây cổ điển với đạn bạc nổ tung.',
    skill1: {
      name: 'Fan The Hammer',
      nameVi: 'Xả Trọn Ổ Đạn',
      chargeRequired: 24,
      description: 'Bắn liên tiếp cả ổ 6 viên đạn bạc gây 26 sát thương dữ dội!',
      descriptionVi: 'Bắn liên tiếp cả ổ 6 viên đạn bạc gây 26 sát thương dữ dội!',
      effect: 'fan_hammer_26',
    },
    skill2: {
      name: 'Roulette Shot',
      nameVi: 'Phát Bắn Định Mệnh',
      triggerNumber: 6,
      description: 'Khi đổ ra mặt 6: Viên đạn may mắn nổ tung gây 16 sát thương bộc phá!',
      descriptionVi: 'Khi đổ ra mặt 6: Viên đạn may mắn nổ tung gây 16 sát thương bộc phá!',
      effect: 'roulette_16',
    },
  },
  staff: {
    id: 'staff',
    name: 'Cyan Arcane Staff',
    nameVi: 'Trượng Gỗ Phép Ngọc Lam',
    image: `${ASSET_PATHS.weapons}/weapon-staff.png`,
    description: 'Gậy phép cổ thụ đính ngọc lam hội tụ linh khí đất trời.',
    descriptionVi: 'Gậy phép cổ thụ đính ngọc lam hội tụ linh khí đất trời.',
    skill1: {
      name: 'Arcane Nova',
      nameVi: 'Bão Ma Pháp Ngọc Lam',
      chargeRequired: 22,
      description: 'Bùng nổ năng lượng ma thuật gây 22 sát thương và hồi 8 HP.',
      descriptionVi: 'Bùng nổ năng lượng ma thuật gây 22 sát thương và hồi 8 HP.',
      effect: 'arcane_nova_22',
    },
    skill2: {
      name: 'Mana Barrier',
      nameVi: 'Khiên Ma Lực',
      triggerNumber: 3,
      description: 'Khi đổ ra mặt 3: Tạo khiên hấp thu và hồi lại 12 HP!',
      descriptionVi: 'Khi đổ ra mặt 3: Tạo khiên hấp thu và hồi lại 12 HP!',
      effect: 'heal_12',
    },
  },
  infinity_ring: {
    id: 'infinity_ring',
    name: 'Void Infinity Ring',
    nameVi: 'Vòng Vô Cực Hư Không',
    image: `${ASSET_PATHS.weapons}/weapon-infinity-ring.png`,
    description: 'Chiếc nhẫn xoắn ốc chứa đựng bí mật của không gian và thời gian.',
    descriptionVi: 'Chiếc nhẫn xoắn ốc chứa đựng bí mật của không gian và thời gian.',
    skill1: {
      name: 'Black Hole Surge',
      nameVi: 'Xoáy Lỗ Đen Hư Không',
      chargeRequired: 25,
      description: 'Hút cạn sinh lực kẻ thù: gây 24 sát thương và giảm 5 điểm sạc của đối thủ!',
      descriptionVi: 'Hút cạn sinh lực kẻ thù: gây 24 sát thương và giảm 5 điểm sạc của đối thủ!',
      effect: 'void_surge_24',
    },
    skill2: {
      name: 'Warp Distortion',
      nameVi: 'Bẻ Cong Chiều Không Gian',
      triggerNumber: 5,
      description: 'Khi đổ ra mặt 5: Dịch chuyển thực tại gây ngay 13 sát thương hư không!',
      descriptionVi: 'Khi đổ ra mặt 5: Dịch chuyển thực tại gây ngay 13 sát thương hư không!',
      effect: 'warp_13',
    },
  },
  spirit_stone: {
    id: 'spirit_stone',
    name: 'Raging Beast Soul Stone',
    nameVi: 'Đá Linh Thú Giận Dữ',
    image: `${ASSET_PATHS.weapons}/weapon-spirit-stone.png`,
    description: 'Hòn đá phong ấn linh hồn thú cổ đại đang gầm thét cuồng nộ.',
    descriptionVi: 'Hòn đá phong ấn linh hồn thú cổ đại đang gầm thét cuồng nộ.',
    skill1: {
      name: 'Beast Awakening',
      nameVi: 'Linh Thú Thức Tỉnh',
      chargeRequired: 20,
      description: 'Triệu hồi cuồng thú giẫm nát phòng tuyến gây 21 sát thương.',
      descriptionVi: 'Triệu hồi cuồng thú giẫm nát phòng tuyến gây 21 sát thương.',
      effect: 'beast_21',
    },
    skill2: {
      name: 'Primal Roar',
      nameVi: 'Tiếng Gầm Nguyên Thủy',
      triggerNumber: 2,
      description: 'Khi đổ ra mặt 2: Tiếng gầm chấn động gây 9 sát thương và tăng 5 điểm sạc!',
      descriptionVi: 'Khi đổ ra mặt 2: Tiếng gầm chấn động gây 9 sát thương và tăng 5 điểm sạc!',
      effect: 'roar_9',
    },
  },
  chronos_watch: {
    id: 'chronos_watch',
    name: 'Chronos Pocket Watch',
    nameVi: 'Đồng Hồ Bỏ Túi Chronos',
    image: `${ASSET_PATHS.weapons}/weapon-chronos-watch.png`,
    description: 'Bảo vật của thần thời gian có thể quay ngược kim đồng hồ sinh mệnh.',
    descriptionVi: 'Bảo vật của thần thời gian có thể quay ngược kim đồng hồ sinh mệnh.',
    skill1: {
      name: 'Time Dilation',
      nameVi: 'Ngưng Đọng Thời Gian',
      chargeRequired: 30,
      description: 'Dừng thời gian gây 20 sát thương và hồi phục ngay 20 HP!',
      descriptionVi: 'Dừng thời gian gây 20 sát thương và hồi phục ngay 20 HP!',
      effect: 'time_stop_20',
    },
    skill2: {
      name: 'Rewind Fate',
      nameVi: 'Đảo Ngược Vận Mệnh',
      triggerNumber: 1,
      description: 'Khi đổ ra mặt 1: Quay ngược dòng thời gian lập tức hồi phục 15 HP!',
      descriptionVi: 'Khi đổ ra mặt 1: Quay ngược dòng thời gian lập tức hồi phục 15 HP!',
      effect: 'rewind_15',
    },
  },
  fire_headband: {
    id: 'fire_headband',
    name: 'Dark Flame Leaf Headband',
    nameVi: 'Băng Đô Lá Hắc Hỏa',
    image: `${ASSET_PATHS.weapons}/weapon-headband-fire.png`,
    description: 'Chiếc băng đô dệt từ sợi lá ma thuật bốc cháy lửa địa ngục.',
    descriptionVi: 'Chiếc băng đô dệt từ sợi lá ma thuật bốc cháy lửa địa ngục.',
    skill1: {
      name: 'Hellfire Burst',
      nameVi: 'Bộc Phá Hắc Hỏa',
      chargeRequired: 19,
      description: 'Phóng luồng lửa đen hủy diệt gây 21 sát thương thiêu đốt!',
      descriptionVi: 'Phóng luồng lửa đen hủy diệt gây 21 sát thương thiêu đốt!',
      effect: 'hellfire_21',
    },
    skill2: {
      name: 'Blazing Will',
      nameVi: 'Ý Chí Rực Lửa',
      triggerNumber: 5,
      description: 'Khi đổ ra mặt 5: Bừng cháy ý chí chiến đấu gây ngay 14 sát thương!',
      descriptionVi: 'Khi đổ ra mặt 5: Bừng cháy ý chí chiến đấu gây ngay 14 sát thương!',
      effect: 'blaze_14',
    },
  },
};

// ============================================================
// 9 Chiến trường (Maps)
// ============================================================
export const MAP_DEFINITIONS: MapInfo[] = [
  {
    id: 'castle',
    name: 'Moonlit Castle Arena',
    nameVi: 'Sân Đấu Lâu Đài Dưới Trăng',
    image: `${ASSET_PATHS.maps}/map-castle.png`,
    ambient: 'mystic',
  },
  {
    id: 'cyberpunk',
    name: 'Neon Cyberpunk Rooftop',
    nameVi: 'Sân Thượng Cyberpunk Mưa Neon',
    image: `${ASSET_PATHS.maps}/map-cyberpunk.png`,
    ambient: 'electronic',
  },
  {
    id: 'forest',
    name: 'Ancient Forest Under Moonlight',
    nameVi: 'Đấu Trường Rừng Cổ Dưới Trăng',
    image: `${ASSET_PATHS.maps}/map-forest.png`,
    ambient: 'nature',
  },
  {
    id: 'ice',
    name: 'Frozen Aurora Glacier',
    nameVi: 'Đấu Trường Băng Dưới Cực Quang',
    image: `${ASSET_PATHS.maps}/map-ice.png`,
    ambient: 'chill',
  },
  {
    id: 'plains',
    name: 'Windmill Sunny Meadow',
    nameVi: 'Thảo Nguyên Nắng Bên Cối Xay Gió',
    image: `${ASSET_PATHS.maps}/map-plains.png`,
    ambient: 'peaceful',
  },
  {
    id: 'sky_island',
    name: 'Pink Cloud Floating Island',
    nameVi: 'Đấu Trường Đảo Bay Giữa Mây Hồng',
    image: `${ASSET_PATHS.maps}/map-sky-island.png`,
    ambient: 'ethereal',
  },
  {
    id: 'swamp',
    name: 'Bioluminescent Bog',
    nameVi: 'Đấu Trường Đầm Lầy Phát Quang',
    image: `${ASSET_PATHS.maps}/map-swamp.png`,
    ambient: 'dark',
  },
  {
    id: 'volcano',
    name: 'Basalt Lava Ocean Crater',
    nameVi: 'Đấu Trường Bazan Giữa Dung Nham',
    image: `${ASSET_PATHS.maps}/map-volcano.png`,
    ambient: 'inferno',
  },
  {
    id: 'desert',
    name: 'Sunset Desert Ruins',
    nameVi: 'Đấu Trường Sa Mạc Hoàng Hôn',
    image: `${ASSET_PATHS.maps}/map-desert.png`,
    ambient: 'dune',
  },
];

// Music playlist
export const BATTLE_TRACKS = [
  `${ASSET_PATHS.music}/battle-music-1.mp3`,
  `${ASSET_PATHS.music}/battle-music-2.mp3`,
  `${ASSET_PATHS.music}/battle-music-3.mp3`,
  `${ASSET_PATHS.music}/battle-music-4.mp3`,
];

export const LOBBY_BGM = `${ASSET_PATHS.music}/bg-music.mp3`;

// Default Character Customization
export const DEFAULT_CUSTOMIZATION: CharacterCustomization = {
  baseIndex: 0,
  hairIndex: 0,
  hairColor: '#ffe066', // Blonde
  skinColor: '#f8d5b8', // Light skin
  shirtIndex: 0,
  shirtColor: '#4d94ff', // Blue shirt
  pantsIndex: 0,
  pantsColor: '#2d3748', // Dark pants
  accessoryIndex: 0,
  faceIndex: 0,
};

// Preset colors for skin, hair, and clothing
export const COLOR_PALETTES = {
  skin: [
    '#fceae6', // Fair
    '#f8d5b8', // Light
    '#e0a878', // Medium Tan
    '#b87333', // Deep Tan
    '#8b5a2b', // Dark Brown
    '#4a2c11', // Deep Dark
    '#90d7ff', // Mystic Blue
    '#c4a8ff', // Elf Lilac
  ],
  hair: [
    '#1a1a1a', // Black
    '#4a2e18', // Chestnut
    '#8B4513', // Auburn
    '#ffe066', // Gold Blonde
    '#ffffff', // Platinum White
    '#ff4d4d', // Crimson Red
    '#ff79c6', // Sakura Pink
    '#50fa7b', // Emerald Green
    '#8be9fd', // Cyan
    '#bd93f9', // Royal Purple
    '#ffb86c', // Fiery Orange
  ],
  clothes: [
    '#e53e3e', // Red
    '#dd6b20', // Orange
    '#d69e2e', // Yellow Gold
    '#38a169', // Emerald
    '#319795', // Teal
    '#3182ce', // Royal Blue
    '#805ad5', // Purple
    '#d53f8c', // Magenta
    '#ffffff', // Pure White
    '#718096', // Slate Grey
    '#1a202c', // Dark Charcoal
    '#975a16', // Leather Brown
  ],
};
