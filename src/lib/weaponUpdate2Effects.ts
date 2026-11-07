import type {PlayerState} from '@/types/game';
export function animationSpec(effect:string){return effect==='mu:S1_B_Dash_Cut'?{frames:24,ms:1200}:effect==='mu:S2_B_20_Cuts'?{frames:24,ms:1200}:/^mu:D20_(Red|Blue)$/.test(effect)?{frames:24,ms:900}:/^mu:S1_C_(Blue|Red)_Wave$/.test(effect)?{frames:24,ms:1200}:effect.startsWith('mu:')?{frames:24,ms:2000}:effect.startsWith('nw:')?{frames:4,ms:700}:effect.startsWith('dn:')?{frames:4,ms:2000}:{frames:4,ms:520};}
export function weapon2Presentation(p:PlayerState,slot:1|2,form=1){
 const id=p.weapon.id;
 const row=id==='vine_staff'?(slot===1?['nw:vine_bind','Briar Snare','Bẫy Dây Gai','opponent','#9be656']:['nw:skill_seal','Verdant Seal','Phong Ấn Dây Leo','opponent','#89ed56']):
 id==='wind_wand'?(slot===2?['nw:storm_armor','Cyclone Mantle','Áo Giáp Cuồng Phong','caster','#a3eaff']:form===2?['nw:gale_beam','Gale Beam','Cuồng Phong','opponent','#8af3ed']:['nw:tornado','Tornado','Lốc Xoáy','opponent','#bcf4ff']):
 id==='astghik_staff'?(slot===2?['nw:water_halo','Rain of Astghik','Thiên Vũ Astghik','opponent','#72bfff']:form===2?['nw:water_wall','Water Wall','Thủy Tường','caster','#5cd0fa']:['nw:water_heal','Tidal Bloom','Thủy Sinh','caster','#7befb4']):
 id==='musashi'?(slot===2?(form===2?['mu:S2_B_20_Cuts','Twentyfold Eclipse','Nhị Thập Ảnh Trảm','opponent','#ffffff']:['mu:S2_A_Void_Flash','Void Severance','Hư Không Trảm','opponent','#ffffff']):form===2?['mu:S1_B_Dash_Cut','Flash Cut','Tốc Trảm','opponent','#f8b4d9']:form===3?['mu:S1_C_Blue_Wave','Twin Heavens Waves','Song Kiếm Khí','opponent','#68b8ff']:['mu:S1_A_12_Cuts','Twelve Cuts','Thập Nhị Trảm','opponent','#fb77ab']):undefined;
 return row?{effect:row[0],nameEn:row[1],nameVi:row[2],target:row[3] as 'caster'|'opponent',color:row[4]}:undefined;
}
export function weapon2Cues(p:PlayerState,slot:1|2,form=1){
 const main=weapon2Presentation(p,slot,form);if(!main)return;
 if(p.weapon.id==='musashi'&&slot===1&&form===3)return [{effect:'mu:S1_C_Blue_Wave',target:'opponent' as const},{effect:'mu:S1_C_Red_Wave',target:'opponent' as const}];
 if(p.weapon.id==='wind_wand'&&slot===2)return [{effect:'nw:wind_impact',target:'opponent' as const},main];
 if(p.weapon.id==='astghik_staff'&&slot===1&&form===2)return [{effect:'nw:water_impact',target:'opponent' as const},main];
 return [main];
}
