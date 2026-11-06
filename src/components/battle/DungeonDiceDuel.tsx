'use client';
import type {DungeonState} from '@/lib/dungeon';
export default function DungeonDiceDuel({state:s,en}:{state:DungeonState;en:boolean}){
 if(s.phase!=='attack'&&s.phase!=='defense')return null;
 const actors=s.phase==='attack'&&s.attackActors?s.players.filter(p=>s.attackActors!.includes(p.id)):s.players;
 const rolled=actors.filter(p=>s.rolls[p.id]?.length),team=rolled.reduce((n,p)=>n+s.rolls[p.id].reduce((a,b)=>a+b,0),0);
 const enemyReady=s.botDice?.stage==='result'&&s.botDice.role===(s.phase==='attack'?'defense':'attack');
 const enemy=enemyReady?s.botDice!.values.reduce((a,b)=>a+b,0):null,ready=rolled.length===actors.length&&enemy!==null;
 const outcome=ready?(team>enemy!?'team-wins':team<enemy!?'enemy-wins':'draw'):'pending';
 return <div className={'dungeon-dice-duel '+outcome} key={s.round+':'+s.phase+':'+(enemy??'waiting')} role="status" aria-live="polite" data-team-total={rolled.length?team:''} data-enemy-total={enemy??''}>
 <div className="duel-team" aria-label={en?'Team total':'Tổng đội'}><b>{rolled.length?team:'—'}{rolled.length>0&&rolled.length<actors.length&&<i>…</i>}</b></div>
 <strong className="duel-comparator">{ready?(team>enemy!?'>':team<enemy!?'<':'='):'⋯'}</strong>
 <div className="duel-enemy" aria-label={en?'Enemy total':'Tổng đối thủ'}><b>{enemy??'—'}</b></div>
 </div>;
}
