'use client';
import {effectFrame} from '@/lib/weaponUpdateAssets';
import {useEffect,useState} from 'react';
import type {PlayerState} from '@/types/game';
import {activeWeather} from '@/lib/weaponUpdateState';
import {useGameStore} from '@/stores/gameStore';
export function WeaponWeather({players,round}:{players:PlayerState[];round:number}){
 const [frame,setFrame]=useState(0);const en=useGameStore(s=>s.settings.language)==='en';
 const weather=players.map(p=>activeWeather(p,round)).filter(w=>!!w).sort((a,b)=>b!.started-a!.started)[0];
 useEffect(()=>{if(!weather)return;const timer=setInterval(()=>setFrame(f=>(f+1)%4),220);return()=>clearInterval(timer);},[weather?.kind]);
 if(!weather)return null;
 const label={mist:['MIST','SƯƠNG MÙ'],rain:['RAIN','MƯA'],snow:['FROZEN REALM','BĂNG GIỚI'],heat:['HEAT','NÓNG'],superconduct:['SUPERCONDUCT','SIÊU DẪN']}[weather.kind];
 return <div className={'weapon-weather weather-'+weather.kind} aria-label={label[en?0:1]}><img src={weather.kind==='mist'?'/assets/weapon-update-2/musashi/Mist_Field/'+(frame*6)+'.webp':'/assets/weapon-update-1/frames/weather_'+weather.kind+'/'+frame+'.png'} alt=""/><div className="weather-particles"/><span>{label[en?0:1]} · {weather.remainingTurns??weather.until-round+1}R</span></div>;
}
export function WeaponSummons({player,side}:{player:PlayerState;side:'left'|'right'}){
 const [frame,setFrame]=useState(0);const living=player.hp>0?player.weaponUpdate?.summons?.filter(x=>x.hp>0)||[]:[];
 useEffect(()=>{if(!living.length)return;const timer=setInterval(()=>setFrame(f=>(f+1)%4),280);return()=>clearInterval(timer);},[living.length]);
 if(!living.length)return null;
 return <div className={'weapon-summons summons-'+side}>{living.map(p=><div key={p.id} className={'summoned-unit summon-'+p.kind}><img src={'/assets/weapon-update-1/frames/'+p.kind+'/'+frame+'.png'} alt={p.kind}/><small>{p.kind==='fire_person'?'Flame':p.kind} {p.hp}/{p.maxHp}</small><progress value={p.hp} max={p.maxHp}/></div>)}</div>;
}
export function WeaponStatus({player:p,round}:{player:PlayerState;round:number}){
 const en=useGameStore(s=>s.settings.language)==='en',s=p.weaponUpdate;if(!s)return null;
 const labels=[[(s.musashiMarkUntil??-1)>=round,en?'BLEED MARK':'DẤU RỈ MÁU'],[(s.musashiSmokeAttacks??0)>0,(en?'SMOKE ':'KHÓI ')+s.musashiSmokeAttacks],[(s.vineUntil??-1)>=round,en?'D6 SNARE':'BẪY D6'],[(s.sealAttacks??0)>0||s.sealActiveRound===round,en?'SKILL SEAL':'KHÓA CHIÊU'],[(s.waterWallAttacks??0)>0,(en?'WATER WALL ':'TƯỜNG NƯỚC ')+s.waterWallAttacks],[(s.cycloneAttacks??0)>0,(en?'CYCLONE ':'GIÁP GIÓ ')+s.cycloneAttacks],[(s.haloUntil??-1)>=round,en?'WATER HALO':'VÒNG NƯỚC'],[(s.deathEyeUntil??-1)>=round,(en?'EYE OF DEATH ':'MẮT TỬ THẦN ')+((s.deathEyeUntil??round)-round+1)+'R'],[(s.shieldDefenses||0)>0,(en?'DEF +2 · ':'THỦ +2 · ')+s.shieldDefenses],[s.slowChargeRound===round&&s.slowChargeBlocked,en?'D6 LOCKED · END TURN':'KHÓA D6 · KẾT THÚC'],[!!s.anchor&&(s.anchorUntil??0)>=round,(en?'ANCHOR ':'NEO ')+((s.anchorUntil??round)-round+1)+'R'],[(s.armor||0)>0,(en?'ARMOR ':'GIÁP ')+(s.armor||0)],[(s.superconductUntil??0)>=round,en?'SUPERCONDUCT +2 ICE/THUNDER':'SIÊU DẪN +2 BĂNG/LÔI'],[(s.poisonStacks||0)>0&&(s.poisonUntil??0)>=round,(en?'POISON ':'ĐỘC ')+(s.poisonStacks||0)],[(s.cleaveAttacks||0)>0,(en?'CLEAVE ':'BÁT ')+s.cleaveAttacks],[(s.slashDefenses||0)>0,(en?'SLASHING ':'GIẢI ')+s.slashDefenses],[!!s.namedBy,en?'NAME WRITTEN':'ĐÃ GHI TÊN'],[(s.markUntil??0)>=round,en?'FLAME MARK':'HỎA ẤN'],[(s.weakUntil??0)>=round,en?'WEAK −7':'SUY NHƯỢC −7'],[(s.paralysisAttacks||0)>0,en?'PARALYSIS':'TÊ LIỆT'],[(s.frozenAttacks||0)>0,en?'FROZEN':'ĐÓNG BĂNG'],[(s.dodgeHits||0)>0,(en?'DODGE ':'NÉ ')+s.dodgeHits],[(s.chronoRerollAttacks||0)>0,(en?'REROLL ':'TUNG LẠI ')+s.chronoRerollAttacks]];
 return <div className="weapon-status-tags">{labels.filter(x=>x[0]).map((x,i)=><span key={i}>{x[1]}</span>)}</div>;
}

export function WeaponAura({player:p,round}:{player:PlayerState;round:number}){const [frame,setFrame]=useState(0),s=p.weaponUpdate;const effects=s?[((s.musashiHealAt??0)>0&&Date.now()-s.musashiHealAt!<2000?'mu:Heal_10HP':null),((s.vineUntil??-1)>=round?'nw:vine_ground':null),((s.musashiMarkUntil??-1)>=round?'mu:Bleed_Status':null),((s.musashiSmokeAttacks??0)>0?'mu:White_Smoke_Aura':null),((s.waterWallAttacks??0)>0?'nw:water_wall':null),((s.regenUntil??-1)>=round?'nw:healing_aura':null),((s.cycloneAttacks??0)>0?'nw:storm_armor':null),((s.haloUntil??-1)>=round?'nw:water_halo':null),((s.dodgeHits??0)>0?'red_dodge_aura':null),((s.superconductUntil??0)>=round?'superconduct_aura':null),((s.markUntil??0)>=round?'king_mark':null),((s.paralysisAttacks??0)>0?'paralysis':null),((s.armor??0)>0?'shield_armor':null)].filter((x):x is string=>!!x):[];useEffect(()=>{if(!effects.length)return;const t=setInterval(()=>setFrame(f=>(f+1)%24),84);return()=>clearInterval(t);},[effects.length]);if(p.hp<=0)return null;return <div className="weapon-state-aura" aria-hidden="true">{(p.weaponUpdate?.deathEyeUntil??-1)>=round&&<img className="death-eye" src="/assets/death-note/eye.png" alt="Eye of Death"/>}{effects.map(effect=><img className={'state-'+effect.replace(':','-')} key={effect} src={effectFrame(effect.includes(':')?effect:'wu1:'+effect,frame%((effect.startsWith('mu:'))?24:4))} alt=""/>)}</div>;}
