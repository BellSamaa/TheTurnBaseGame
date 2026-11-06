import type {PlayerState} from '@/types/game';
import type {DungeonState} from './dungeon';
/** Skills still target one fighter's debuffs, but the entire party shares defensive resources. */
export function prepareDungeonDefense(s:DungeonState,recipient:PlayerState){
 const original=structuredClone(recipient),target={...structuredClone(recipient),hp:s.teamHp,maxHp:s.teamMaxHp,d12Charge:s.pts};
 const rock=s.players.find(p=>p.weapon.id==='spirit_stone'&&(p.petRockHp??0)>0);
 const immune=s.players.find(p=>p.immuneDamageNext),dodge=s.players.find(p=>p.dodgeNextSkill);
 const armor=s.players.reduce((n,p)=>n+(p.weaponUpdate?.armor??0),0);
 const summons=s.players.flatMap(p=>p.weaponUpdate?.summons||[]).filter(p=>p.hp>0&&p.activeUntil>=s.round);
 target.weaponUpdate={...target.weaponUpdate,armor,summons:structuredClone(summons)};
 if(rock){target.weapon=rock.weapon;target.petRockHp=rock.petRockHp;target.petRockEnraged=rock.petRockEnraged;target.petRockHits=rock.petRockHits;}
 target.immuneDamageNext=!!immune;target.dodgeNextSkill=!!dodge;
 return {target,commit(result:PlayerState){
  const guardian=s.buffs.find(b=>b.id==='guardian'&&b.active&&b.remaining>0);
  const spent=(result.weaponUpdate?.armor??0)<armor||JSON.stringify(result.weaponUpdate?.summons||[])!==JSON.stringify(summons)||(rock&&(result.petRockHp??0)<(rock.petRockHp??0))||(immune&&!result.immuneDamageNext)||(dodge&&!result.dodgeNextSkill);
  const blocked=!!guardian&&(result.hp<target.hp||!!spent);
  if(blocked)guardian!.remaining=0;
  else{
   let used=armor-(result.weaponUpdate?.armor??0);
   for(const member of s.players){if(used<=0)break;const taken=Math.min(used,member.weaponUpdate?.armor??0);if(taken){member.weaponUpdate!.armor!-=taken;used-=taken;}}
   const survivors=new Map((result.weaponUpdate?.summons||[]).map(p=>[p.id,p]));
   for(const member of s.players)if(member.weaponUpdate?.summons)member.weaponUpdate.summons=member.weaponUpdate.summons.flatMap(p=>survivors.has(p.id)?[structuredClone(survivors.get(p.id)!)]:[]);
   if(rock){rock.petRockHp=result.petRockHp;rock.petRockHits=result.petRockHits;}
   if(immune&&!result.immuneDamageNext)immune.immuneDamageNext=false;
   if(dodge&&!result.dodgeNextSkill)dodge.dodgeNextSkill=false;
  }
  const updated=structuredClone(result);
  updated.weapon=original.weapon;updated.petRockHp=recipient.petRockHp;updated.petRockHits=recipient.petRockHits;updated.petRockEnraged=original.petRockEnraged;
  updated.immuneDamageNext=recipient.immuneDamageNext;updated.dodgeNextSkill=recipient.dodgeNextSkill;
  updated.weaponUpdate={...updated.weaponUpdate,armor:recipient.weaponUpdate?.armor,summons:recipient.weaponUpdate?.summons};
  if(blocked)updated.hp=target.hp;
  return {updated,blocked};
 }};
}
