const fs=require('fs');const p='src/lib/lmsRound.ts';let s=fs.readFileSync(p,'utf8').replaceAll('now+10000','now+20000');s=s.replace('s.endVotes=[];return s;', 's.endVotes=[];s.openingReady=[];s.rollDeadline=undefined;s.openingSetupDeadline=Date.now()+60000;return s;');s=s.replace(" if(action==='buff'&&",` if(action==='ready_opening'){
  if(s.round!==1||s.phase!=='initiative')return s;
  if(!s.openingReady?.includes(actor))(s.openingReady??=[]).push(actor);
  if(s.players.filter(p=>p.hp>0).every(p=>s.openingReady!.includes(p.id)))s.rollDeadline??=now+20000;
  s.revision++;return s;
 }
 if(['skills','buffs'].includes(s.phase)&&['charge','skill','buff','end','next_stage'].includes(action)){
  if(stageActor(s)!==actor)throw Error('Chưa đến thứ tự của bạn');
  if(s.phase==='skills'&&s.stagePart==='charge'&&action==='skill')throw Error('Tất cả phải sạc D6 trước khi dùng skill');
 }
 if(action==='buff'&&`);s=s.replace(" if(action==='charge'&&s.phase==='skills'){", " if(action==='charge'&&s.phase==='skills'){\n  if(s.stagePart!=='charge')throw Error('Đã kết thúc bước sạc');");s=s.replace("s.revision++;return s;\n }\n if(action==='end')", "if(rolls.length>=d6Allowance(user,s.round))completeStageActor(s,actor,now);else s.stageDeadline=now+20000;s.revision++;return s;\n }\n if(action==='end')",1);s=s.replace("  (s.stageDone??=[]).push(actor);s.revision++;advanceStage(s,now);return s;", "  if(s.phase==='skills'&&s.stagePart==='charge')fillCharge(s,user);completeStageActor(s,actor,now);s.revision++;return s;");s=s.replaceAll('(s.stageDone??=[]).push(actor);advanceStage(s,now);','completeStageActor(s,actor,now);').replaceAll('(next.stageDone??=[]).push(actor);advanceStage(next,now);','completeStageActor(next,actor,now);');s=s.replaceAll('next.stageDone=[];next.stageDeadline=now+20000;',"startOrderedStage(next,'skills',now);");
let a=s.indexOf('function advanceStage('),b=s.indexOf('export function roundLmsTick',a);s=s.slice(0,a)+`export function stageActor(s:LmsState){return (s.stageOrder||s.order).find(id=>s.players.some(p=>p.id===id&&p.hp>0)&&!s.stageDone?.includes(id));}
function randomOrder(s:LmsState,phase:string){
 const groups=new Map<number,string[]>();for(const p of s.players.filter(p=>p.hp>0)){const roll=s.initiative?.find(r=>r.id===p.id)?.roll??0;groups.set(roll,[...(groups.get(roll)||[]),p.id]);}
 const ties:{roll:number;ids:string[]}[]=[];const order=[...groups].sort((a,b)=>b[0]-a[0]).flatMap(([roll,ids])=>{for(let i=ids.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[ids[i],ids[j]]=[ids[j],ids[i]];}if(ids.length>1)ties.push({roll,ids:[...ids]});return ids;});
 if(ties.length)s.tieNotice={id:crypto.randomUUID(),phase,groups:ties,order};return order;
}
function startOrderedStage(s:LmsState,phase:'skills'|'buffs',now:number){s.phase=phase;s.stagePart=phase==='skills'?'charge':undefined;s.stageDone=[];s.stageOrder=randomOrder(s,phase);s.stageDeadline=now+20000;s.rollDeadline=undefined;}
function fillCharge(s:LmsState,p:LmsState['players'][number]){const rolls=(s.roundCharges??={})[p.id]??=[];while(rolls.length<d6Allowance(p,s.round)){const roll=rollD6();rolls.push(roll);Object.assign(p,chargeSkillPoints(p,[roll],s.round));}}
function completeStageActor(s:LmsState,actor:string,now:number){if(!s.stageDone?.includes(actor))(s.stageDone??=[]).push(actor);s.stageDeadline=now+20000;advanceStage(s,now);}
function advanceStage(s:LmsState,now:number){
 if(s.winner||stageActor(s))return;
 if(s.phase==='skills'&&s.stagePart==='charge'){s.stagePart='skill';s.stageDone=[];s.stageDeadline=now+20000;return;}
 if(s.phase==='skills'){startOrderedStage(s,'buffs',now);return;}
 s.phase='end';s.stageDone=[];s.endVotes=[];s.endDeadline=now+30000;s.stageDeadline=undefined;s.rollDeadline=undefined;
}
`+s.slice(b);
a=s.indexOf(" if(['skills','buffs'].includes(input.phase))");b=s.indexOf(' const legacy=',a);s=s.slice(0,a)+` if(input.phase==='initiative'&&input.round===1&&!input.rollDeadline){
  if(now<(input.openingSetupDeadline??0)&&!input.players.filter(p=>p.hp>0).every(p=>input.openingReady?.includes(p.id)))return input;
  const s=structuredClone(input);s.rollDeadline=now+20000;s.revision++;return s;
 }
 if(['skills','buffs'].includes(input.phase)){
  if(!input.stageOrder||!input.stageDeadline){const s=structuredClone(input);startOrderedStage(s,input.phase as 'skills'|'buffs',now);s.revision++;return s;}
  if(now<input.stageDeadline)return input;const s=structuredClone(input),actor=stageActor(s);
  if(actor){if(s.phase==='skills'&&s.stagePart==='charge')fillCharge(s,s.players.find(p=>p.id===actor)!);completeStageActor(s,actor,now);}else advanceStage(s,now);s.revision++;return s;
 }
`+s.slice(b);s=s.replace("next.turnFlow=3;if(input.phase==='clash'", "next.turnFlow=3;if(input.phase==='initiative'&&next.phase==='target'){next.order=randomOrder(next,'initiative');next.active=0;}if(input.phase==='clash'");s=s.replace(' return next;\n}\nexport function stageActor', " if(input.phase==='initiative'&&next.phase==='target'){next.order=randomOrder(next,'initiative');next.active=0;}\n if(next.phase==='initiative'&&next.round===1&&!next.players.filter(p=>p.hp>0).every(p=>next.openingReady?.includes(p.id)))next.rollDeadline=undefined;\n return next;\n}\nexport function stageActor");s=s.replace('next.roundCharges={};next.endVotes=[];', 'next.roundCharges={};next.stageOrder=undefined;next.stagePart=undefined;next.tieNotice=undefined;next.endVotes=[];');fs.writeFileSync(p,s);
p2='src/components/battle/BattleScreen.tsx';s=fs.readFileSync(p2,'utf8').replaceAll('currentRound === 1 ? 20 : 10','20').replaceAll('currentTurn === 1 ? 20 : 10','20');fs.writeFileSync(p2,s);
