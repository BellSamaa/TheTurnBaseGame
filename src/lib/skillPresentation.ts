import abilities from '@/data/weaponUpdate1Abilities.json';
import type { PlayerState } from '@/types/game';

export function normalAttackEffect(weaponId: string) {
  return ({ king_slasher:'wu1:white_slash',greatsword: 'slash_light', dagger: 'slash_light', bow: 'arrow', staff: 'magic_orb', revolver: 'bullet' } as Record<string, string>)[weaponId] ?? 'impact_physical';
}

// Visuals describe the action that was actually cast, including its chosen form.
export function skillPresentation(player: PlayerState, slot: 1 | 2, form?: number) {
  const skill = slot === 1 ? player.weapon.skill1 : player.weapon.skill2;
  let effect = 'impact_physical';
  let target: 'caster' | 'opponent' | 'center' = 'opponent';
  let nameEn = skill.name, nameVi = skill.nameVi;
  let color = '#facc15';
  const id = player.weapon.id;
  if(id==='death_note'&&slot===2&&(form===2||form===3))return {effect:form===2?'dn:eye':'dn:purge',target:form===2?'caster' as const:'opponent' as const,nameEn:form===2?'Eye of Death':'Purging Judgement',nameVi:form===2?'Đôi Mắt Tử Thần':'Phán Quyết Thanh Trừng',color:'#ff294d'};
  const variants:Record<string,string[]>={king_slasher:slot===1?['bat','giai','fire_arrow']:['fire_arrow','world_slash'],thunder_spear:slot===1?['yellow','red','blue']:[],dual_spears:slot===1?['lightning','ice','dual']:['orb','beam']};
  const branch=variants[id]?.[(form||1)-1];const ability=abilities.abilities.find(a=>a.id===id+'.s'+slot+(branch?'.'+branch:''));
  if(ability){const cue=ability.cues[0]||{effect:id==='elemental_rings'?slot===1?'golem':'elemental_beam':'name_write',anchor:'caster.chest'};const names:Record<string,[string,string]>={bat:['Cleave','Bát'],giai:['Dismantle','Giải'],fire_arrow:['Flame Arrow','Hỏa Tiễn'],world_slash:['World Slash','Trảm Thế Giới'],yellow:['Golden Thunder','Sét Vàng'],red:['Crimson Thunder','Sét Đỏ'],blue:['Azure Thunder','Sét Xanh'],lightning:['Thunder Spear','Giáo Sét'],ice:['Triple Icicle','Tam Băng Giáo'],dual:['Dual Slash','Song Trảm'],orb:['Superconduct Orb','Cầu Siêu Dẫn'],beam:['Superconduct Beam','Chưởng Siêu Dẫn']};return {effect:'wu1:'+cue.effect,target:(cue.anchor.startsWith('caster')?'caster':cue.anchor.includes('screen')?'center':'opponent') as 'caster'|'opponent'|'center',nameEn:branch?names[branch]?.[0]||skill.name:skill.name,nameVi:branch?names[branch]?.[1]||skill.nameVi:skill.nameVi,color:'#e5e7eb'};}
  if (slot === 1) {
    switch (id) {
      case 'greatsword': effect = 'slash_light'; break;
      case 'bow': effect = 'bleed'; color = '#10b981'; break;
      case 'staff': effect = 'magic_orb'; color = '#22d3ee'; break;
      case 'revolver': effect = 'reload'; target = 'caster'; break;
      case 'infinity_ring':
        effect = form === 3 ? 'void_blue' : form === 4 ? 'void_red' : 'infinity';
        nameEn = nameVi = form === 3 ? 'Aoi' : form === 4 ? 'Akai' : 'Immune';
        target = form === 6 ? 'caster' : 'opponent';
        color = form === 3 ? '#38bdf8' : form === 4 ? '#f87171' : '#ffffff'; break;
      case 'dagger':
        effect = form === 2 ? 'slash_multi' : 'burn_orange';
        nameEn = form === 2 ? 'Multi Slash' : 'Flame Throw';
        nameVi = form === 2 ? 'Liên Trảm' : 'Phi Đao Lửa'; color = '#fb923c'; break;
      case 'chronos_watch':
        effect = form === 2 ? (player.weaponUpdate?.anchor == null ? 'time_save' : 'time_erase') : form === 4 ? 'time_reroll' : 'time_lock';
        target = form === 2 ? 'caster' : 'opponent';
        nameEn = form === 2 ? (player.weaponUpdate?.anchor == null ? 'Time Anchor' : 'Time Rewind') : form === 4 ? 'Fate Seal' : 'Time Slow';
        nameVi = form === 2 ? (player.weaponUpdate?.anchor == null ? 'Neo Thời Gian' : 'Tua Ngược Thời Gian') : form === 4 ? 'Phong Ấn Vận Mệnh' : 'Chậm Thời Gian'; break;
      case 'fire_headband': effect = 'burn_black'; color = '#ef4444'; break;
      case 'spirit_stone': effect = 'rock_summon'; target = 'caster'; color = '#d97706'; break;
    }
  } else {
    switch (id) {
      case 'greatsword': effect = 'slash_heavy'; break;
      case 'bow': effect = 'dodge_attack'; target = 'caster'; color = '#10b981'; break;
      case 'staff': effect = 'dodge_spell'; target = 'caster'; color = '#22d3ee'; break;
      case 'revolver': effect = 'bullet'; break;
      case 'infinity_ring':
        effect = 'hollow_purple'; color = '#a855f7';
        if (form === 2) { target = 'center'; nameEn = 'Purple Sky'; nameVi = 'Tử Sắc Thiên Không'; } break;
      case 'dagger': effect = 'burn_blue'; color = '#38bdf8'; break;
      case 'chronos_watch': effect = form===2?'time_lock':'time_erase'; target = 'caster';nameEn=form===2?'Time Changer':'Erase Time';nameVi=form===2?'Đổi Thời Gian':'Xóa Thời Gian'; break;
      case 'fire_headband':
        effect = form === 30 ? 'meteor_two' : 'meteor_one'; color = '#f97316';
        nameEn = form === 30 ? 'Twin Meteors' : 'Meteor'; nameVi = form === 30 ? 'Song Thiên Thạch' : 'Thiên Thạch'; break;
      case 'spirit_stone': target='caster'; effect = 'rock_rage'; color = '#d97706'; break;
    }
  }
  return { effect, target, nameEn, nameVi, color };
}

export function skillEffectPlan(player: PlayerState, slot: 1 | 2, form?: number) {
  const main = skillPresentation(player, slot, form);
  type Cue = { effect: string; target: 'caster' | 'opponent' | 'center' };
  const cue = (effect: string, target: Cue['target'] = 'opponent'): Cue => ({ effect, target });
  const id = player.weapon.id;
  if (id === 'greatsword' && slot === 1) return [main, cue('impact_physical')];
  if (id === 'bow' && slot === 1) return [cue('arrow'), main];
  if (id === 'revolver' && slot === 2) return [main, cue('impact_physical')];
  if (id === 'infinity_ring' && slot === 2) return [cue('void_blue', 'caster'), cue('void_red', 'caster'), main];
  if (id === 'dagger') return slot === 2
    ? [cue('burn_blue', 'caster'), cue('slash_multi'), main]
    : form === 2 ? [main, cue('burn_orange', 'caster')] : [cue('slash_light'), main];
  if (id === 'fire_headband' && slot === 2) return [main, cue('meteor_impact')];
  if (id === 'spirit_stone' && slot === 2) return [cue('rock_rage', 'caster')];
  return [main];
}
