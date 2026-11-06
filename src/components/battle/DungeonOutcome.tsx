'use client';
import {useEffect,useRef,useState} from 'react';
import type {DungeonState} from '@/lib/dungeon';
import {playHitSound} from '@/lib/soundEffects';
export default function DungeonOutcome({state,en}:{state:DungeonState;en:boolean}){
 const [comparison,setComparison]=useState<DungeonState['comparison']>();
 const [change,setChange]=useState<{team:number;enemy:number;reason:string}>();
 const previous=useRef({team:state.teamHp,enemy:state.enemies.reduce((n,p)=>n+p.hp,0),log:state.log,comparison:state.comparison?.id,floor:state.floor,encounter:state.encounter});
 useEffect(()=>{if(!state.comparison)return;setComparison(state.comparison);const timer=setTimeout(()=>setComparison(undefined),5000);return()=>clearTimeout(timer)},[state.comparison?.id]);
 useEffect(()=>{
  const enemy=state.enemies.reduce((n,p)=>n+p.hp,0),old=previous.current;
  const teamChange=state.teamHp-old.team,enemyChange=enemy-old.enemy;
  previous.current={team:state.teamHp,enemy,log:state.log,comparison:state.comparison?.id,floor:state.floor,encounter:state.encounter};
  if(old.floor!==state.floor||old.encounter!==state.encounter){setComparison(undefined);setChange(undefined);return;}
  if(!teamChange&&!enemyChange)return;
  if(old.comparison===state.comparison?.id)setComparison(undefined);
  if(teamChange<0||enemyChange<0)playHitSound(1.8);
  setChange({team:teamChange,enemy:enemyChange,reason:state.log.slice(0,Math.max(1,state.log.indexOf(old.log[0]))).filter(line=>!['Encounter cleared!','Dungeon complete!'].includes(line)).slice(0,3).join(' · ')});
  const timer=setTimeout(()=>setChange(undefined),5000);return()=>clearTimeout(timer);
 },[state.teamHp,state.enemies.reduce((n,p)=>n+p.hp,0)]);
 if(!comparison&&!change)return null;
 return <div className={'dungeon-outcome '+(comparison?.critical?'is-critical':'')} role="status" aria-live="polite">
 {comparison?<><b>{comparison.critical?'TEAM CRIT':en?'DICE CLASH':'SO SÁNH XÚC XẮC'}</b><div className="dungeon-equation"><span>{en?'ATK':'CÔNG'} <strong>{comparison.attack}</strong></span><i>−</i><span>{en?'DEF':'THỦ'} <strong>{comparison.defense}</strong></span><i>=</i><strong>{comparison.difference}</strong></div><p>{comparison.target==='TEAM'?(en?'YOUR TEAM':'ĐỘI CỦA BẠN'):comparison.target} <em>−{comparison.damage} HP</em></p><small>{comparison.critical?(en?'Difference ≥ 15 · full attack damage before shields':'Chênh lệch ≥ 15 · sát thương bằng Công trước giáp'):(en?'Damage after class, weapon and shield effects':'Sát thương sau hiệu ứng lớp, vũ khí và giáp')}</small></>:<><b>{en?'COMBAT EFFECT':'HIỆU ỨNG CHIẾN ĐẤU'}</b><p>{change!.team!==0&&<span>{en?'TEAM':'ĐỘI'} <em>{change!.team>0?'+':''}{change!.team} HP</em> </span>}{change!.enemy!==0&&<span>{en?'ENEMY':'ĐỐI THỦ'} <em>{change!.enemy>0?'+':''}{change!.enemy} HP</em></span>}</p><small>{change!.reason}</small></>}
 </div>;
}
