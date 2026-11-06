export const DUNGEON_FLOORS = [
  {weapon:'greatsword',name:'Bandit',mini:'King Bandit',boss:'Shadow Bandit',hp:[50,50,150,55,300],attack:[2,5],skill:[5,7],support:['bow','shield','greatsword']},
  {weapon:'bow',name:'Goblin',mini:'King Goblin',boss:'Shadow Goblin',hp:[60,60,170,60,320],attack:[3,6],skill:[5,9],support:['bow','bow','bow']},
  {weapon:'staff',name:'Apprentice Mage',mini:'High Monk',boss:'Shadow Archmage',hp:[65,65,180,70,340],attack:[3,6],skill:[5,8],support:['staff','staff','shield']},
  {weapon:'shield',name:'Armored Guard',mini:'Shield Captain',boss:'Shadow Fortress',hp:[75,75,200,80,380],attack:[4,7],skill:[6,10],support:['shield','greatsword','bow']},
  {weapon:'spirit_stone',name:'Stone Creature',mini:'Rock Elemental King',boss:'Shadow Golem',hp:[80,80,220,85,400],attack:[4,7],skill:[0,0],support:['spirit_stone','spirit_stone','substitute_doll']},
  {weapon:'bee_shooter',name:'Poison Bee',mini:'Queen Bee Guardian',boss:'Shadow Swarm Lord',hp:[85,85,240,90,420],attack:[5,7],skill:[0,0],support:['bee_shooter','bee_shooter','bow']},
  {weapon:'revolver',name:'Sharpshooter',mini:'Desperado Boss',boss:'Shadow Gunslinger',hp:[90,90,260,95,460],attack:[5,8],skill:[0,0],support:['revolver','revolver','frying_pan']},
  {weapon:'thunder_spear',name:'Thunder Guard',mini:'Thunder Lord Mini',boss:'Shadow Storm Knight',hp:[95,95,280,100,500],attack:[6,8],skill:[8,0],support:['thunder_spear','ice_spear','kagutsuchi']},
  {weapon:'dagger',name:'Dragon Assassin',mini:'Dragon General',boss:'Shadow Dragon King',hp:[100,100,320,110,550],attack:[6,8],skill:[8,0],support:['dagger','dagger','revolver']},
  {weapon:'mirror_of_life',name:'Mirror Guardian',mini:'Mirror Guardian',boss:'Archdemon Lord',hp:[110,110,350,120,650],attack:[7,8],skill:[0,0],support:['mirror_of_life','dagger','kagutsuchi']},
];

export const DUNGEON_BUFFS = [
  {id:'guardian',name:'Guardian',vi:'Hộ Mệnh',en:'Block all incoming damage once.',description:'Chặn toàn bộ sát thương nhận một lần.'},
  {id:'devil',name:'Devil',vi:'Ác Quỷ',en:'Lose 15 team HP. +5 attack damage for 10 encounters.',description:'Trừ 15 HP chung, tăng 5 sát thương trong 10 trận.'},
  {id:'throne',name:'Throne',vi:'Ngai Vàng',en:'Win 10 encounters to earn 1,000 dungeon coins.',description:'Thắng 10 trận nhận 1.000 tiền Dungeon.'},
  {id:'underdog',name:'Underdog',vi:'Đáy Xã Hội',en:'Activate at a boss: −20% D20=20 chance for 5 encounters, then +20% permanently.',description:'Kích hoạt ở Boss, giảm 20% ra 20 trong 5 trận, sau đó tăng vĩnh viễn 20%.'},
  {id:'musashi',name:'Musashi',vi:'Musashi',en:'Blades have 20% chance for another D20 with +80% chance of 20.',description:'Kiếm có 20% cơ hội tung thêm D20 với 80% tăng cơ hội ra 20.'},
  {id:'helena',name:'Helena',vi:'Helena',en:'Weapon healing +20%.',description:'Hồi máu từ kỹ năng tăng 20%.'},
  {id:'summoner',name:'The Summoner',vi:'The Summoner',en:'Summons gain 5 HP and deal 2 extra damage.',description:'Triệu hồi tăng 5 HP và 2 sát thương.'},
  {id:'instinct',name:'Ultra Instinct',vi:'Ultra Instinct',en:'Immune/Dodge skills have 50% chance to be reusable next round.',description:'Kỹ năng Immune/Né có 50% cơ hội dùng lại vòng sau.'},
  {id:'slayer',name:'Boss Slayer',vi:'Boss Slayer',en:'+5 damage for the next 2 boss attacks.',description:'Tăng 5 sát thương trong 2 lần đánh Boss.'},
  {id:'weather',name:'Weather Forecast',vi:'Weather Forecast',en:'The next weather effect lasts 2 extra rounds.',description:'Lần tạo thời tiết tiếp theo tăng 2 round.'},
];

export function dungeonReward(floor:number) {
  return {gems:20*floor,rubies:floor>=5?Math.floor(floor/2):0,exp:50*floor};
}

export const DUNGEON_RULES_EN = [
 'Tied D20 totals trigger Clashing (except tied natural 20s). Each teammate wagers 0–3 shared PTS within 5s. Attack wins 65% / defense counters 35%; each net wager point shifts the chance by 10 percentage points. The winner deals two thirds of the tied score plus weapon damage.',
  '1–4 players share team HP, skill PTS and dungeon coins. Class HP modifiers apply.',
  'Ten floors, five encounters per floor. Mob, three mobs, mini boss, three mixed mobs, boss.',
  'HP scales to 40% / 60% / 80% / 100% for 1 / 2 / 3 / 4 players. Departures take effect next encounter.',
  '1. All players roll D20 ATK. Enemies roll the same number of DEF dice. Damage is the difference of totals.',
  'A lead of 10 or more triggers Team Crit: deal the full ATK total. Dungeon Focus at the center gives a 80% chance of rolling 18–20 on attack, 40% on defense.',
  '2. Players roll D20 DEF against the enemy attack total.',
  '3. All players charge D6 into the shared PTS pool. Enemies charge once.',
  '4. Players use skills from shared PTS, then all confirm End Turn.',
  '5. Enemies use skills. 6. All players confirm End Turn. Potions can be used here.',
  'Every two floors, visit the rest area. The Hand sells potions, Roger changes equipment, Avocado sells buffs.',
  'Lucky costs 200 coins and adds 10 percentage points to the buyer’s chance of rolling 20 for two encounters. 150 coins buys 10 shared PTS or heals 20 team HP.',
  'Each cleared floor awards every participating player 20 × floor Gems and 50 × floor EXP. From floor 5, gain floor(floor / 2) Rubies.',
];
export const DUNGEON_RULES_VI = [
 'Tổng D20 bằng nhau kích hoạt Va Chạm (trừ khi tất cả tung 20). Mỗi thành viên cược 0–3 PTS chung trong 5 giây. Công thắng 65% / Thủ phản đòn 35%; mỗi PTS chênh lệch thay đổi 10 điểm phần trăm. Bên thắng gây 2/3 điểm xúc xắc cộng sát thương vũ khí.',
 'Chênh lệch Công − Thủ từ 10 kích hoạt Team Crit, gây tổng điểm Công. Focus Dungeon ở tâm có 80% ra 18–20 khi công, 40% khi thủ.',
 '1–4 người dùng chung HP, PTS và tiền Dungeon. Máu cơ bản vẫn áp dụng chỉ số Class.',
 '10 tầng, mỗi tầng 5 trận: 1 quái, 3 quái, Mini Boss, 3 quái phối hợp, Boss.',
 'Máu địch bằng 40% / 60% / 80% / 100% khi có 1 / 2 / 3 / 4 người. Người rời đội được tính lại ở trận kế tiếp.',
 '1. Cả đội tung D20 Công. Địch tung số viên Thủ bằng số thành viên. Sát thương bằng chênh lệch tổng Công và Thủ.',
 '2. Cả đội tung D20 Thủ để chống tổng Công của địch.',
 '3. Mọi người tung D6 vào quỹ PTS chung, sau đó địch sạc D6.',
 '4. Dùng kỹ năng từ PTS chung. Mọi người xác nhận Kết thúc để chuyển bước.',
 '5. Địch dùng kỹ năng. 6. Mọi người xác nhận Kết thúc. Có thể dùng thuốc ở bước 6.',
 'Cứ sau 2 tầng có khu nghỉ: The Hand bán thuốc, Roger đổi vũ khí, Avocado bán 10 buff giá 500 tiền.',
 'Lucky: 200 tiền, tăng 10 điểm phần trăm ra D20 = 20 trong 2 trận. 150 tiền mua 10 PTS chung hoặc hồi 20 HP chung.',
 'Mỗi tầng thưởng mỗi người 20 × tầng Gem, 50 × tầng EXP. Từ tầng 5 có thêm floor(tầng / 2) Ruby.',
];
