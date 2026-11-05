import type {LmsState} from './lms';
import {applyOpponentDamage} from './combatDamage';
import {rollD20,rollD6} from './battleLogic';
export function roundBuff(s:LmsState,actor:string,args:{target?:string;choice?:string;buffSlot?:'initial'|'bonus'}){
 const x=s.extras!,u=s.players.find(p=>p.id===actor)!,a=s.players.find(p=>p.id===s.order[s.active])!,t=s.players.find(p=>p.id===s.target),pick=s.players.find(p=>p.id===args.target&&p.hp>0),card=args.buffSlot==='bonus'?x.bonusBuffs?.[actor]:x.buffs[actor];
 const need=(v:unknown,m:string)=>{if(!v)throw Error(m);};need(card&&!card.used&&x.silencedRound!==s.round,'Buff đã dùng hoặc đang bị cấm');need(['buffs','clash','target'].includes(s.phase),'Chờ bước Buff hoặc phản ứng');const reaction=s.phase==='clash'&&t?.id===actor;
 const enemy=()=>{need(pick&&pick.id!==actor,'Chọn đối thủ còn sống');return pick!;};
 const damage=(p:typeof u,n:number)=>applyOpponentDamage(p,n,s.round);
 switch(card!.id){
 case 0:need(reaction,'Khi bị chọn đánh: chặn đòn và phản 50%');x.flags['shield:'+actor]=true;break;
 case 1:need(reaction&&(s.attack??0)>=u.hp,'Khi đòn đánh sắp gây chí tử');x.flags['phoenix:'+actor]=true;break;
 case 2:need(reaction,'Khi đang bị nhắm tới');need(enemy().id!==a.id,'Không chuyển đòn về người Công');s.target=pick!.id;break;
 case 3:need(reaction,'Khi đang bị nhắm tới');x.flags['insurance:'+actor]=true;break;
 case 4:need(reaction,'Khi đang bị nhắm tới');s.phase='defense';s.defense=undefined;x.flags['buffDefense']=actor;break;
 case 5:need(s.phase==='buffs'&&u.hp>30,'Bước Buff và cần hơn 30 HP');u.hp-=30;damage(enemy(),20);break;
 case 6:need(s.phase==='buffs','Bước Buff');s.players.filter(p=>p.id!==actor&&p.hp>0).forEach(p=>damage(p,10));break;
 case 7:need(s.phase==='buffs','Bước Buff');const foe=enemy();need(foe.hp===Math.max(...s.players.filter(p=>p.hp>0&&p.id!==actor).map(p=>p.hp)),'Chọn đối thủ có HP cao nhất');damage(foe,2*(s.initiative?.find(r=>r.id===actor)?.roll??1));break;
 case 8:need(s.phase==='buffs'&&enemy().hp<30,'Bước Buff: mục tiêu dưới 30 HP');const die=rollD6();if(die%2===0)pick!.hp=0;s.log.unshift(u.name+' execution D6: '+die);break;
 case 9:need(s.phase==='buffs'&&x.lastKill&&x.lastKill.killer!==actor&&!x.lastKill.claimed,'Bước Buff sau khi người khác hạ gục');const k=s.players.find(p=>p.id===x.lastKill!.killer)!;k.hp=Math.max(1,k.hp-x.lastKill!.hp);k.d12Charge=Math.max(0,(k.d12Charge||0)-5);u.hp=Math.min(u.maxHp,u.hp+30);u.d12Charge=(u.d12Charge||0)+5;x.lastKill!.claimed=true;break;
 case 10:need(s.phase==='buffs','Bước Buff');x.bombs.push({target:enemy().id,round:s.round+2});break;
 case 11:need(s.phase==='target','Sau so sánh D20, trước khi chọn mục tiêu');x.silencedRound=s.round;break;
 case 12:need(s.phase==='clash','Khi đang báo đòn đánh');if(args.choice==='defense'){need((s.defense||0)>15,'Thủ do buff phải >15');s.defense=1;}else{need((s.attack||0)>15,'Công phải >15');s.attack=1;}break;
 case 13:need(s.phase==='buffs','Bước Buff');const victim=enemy(),pts=Math.floor((victim.d12Charge||0)/2);victim.d12Charge=(victim.d12Charge||0)-pts;u.d12Charge=(u.d12Charge||0)+pts;break;
 case 14:need(s.phase==='clash','Khi đang báo đòn đánh');const pool=s.players.filter(p=>p.hp>0);s.target=pool[Math.floor(Math.random()*pool.length)].id;break;
 case 15:need(s.phase==='buffs','Bước Buff');if(args.choice==='hp'){const n=Number(args.target);need(Number.isInteger(n)&&n>0&&u.hp>5*n,'Cần đủ HP và còn ít nhất 1 HP');u.hp-=n*5;u.d12Charge=(u.d12Charge||0)+n;}else{u.hp=Math.min(u.maxHp,u.hp+(u.d12Charge||0)*3);u.d12Charge=0;}break;
 case 16:need(s.phase==='buffs','Bước Buff');x.flags['reverseTie']=true;break;
 case 17:need(s.phase==='clash'&&a.id!==actor&&t?.id!==actor,'Khi hai người khác giao chiến');x.flags['watch:'+actor]=true;break;
 case 18:need(s.phase==='clash'||s.phase==='buffs','Bước Buff hoặc khi báo đòn');if(s.phase==='clash')s.attack=0;s.players.filter(p=>p.hp>0).forEach(p=>p.hp=Math.min(p.maxHp,p.hp+15));break;
 case 19:need(s.phase==='buffs','Bước Buff');s.players.filter(p=>p.hp>0).forEach(p=>p.hp=Math.max(0,p.hp-25));x.suddenRound=Math.max(s.round+1,x.suddenRound-1);break;
 default:throw Error('Buff không tồn tại');
 }
 card!.used=true;card!.revealed=true;
}
export const ROUND_BUFF_HELP=[
'Khi đang bị nhắm tới: chặn đòn và phản 50% sát thương.',
'Khi đòn đánh sắp gây chí tử: còn 1 HP và +20 PTS.',
'Khi bị nhắm tới: chuyển đòn sang đối thủ khác, trừ người Công.',
'Khi bị nhắm tới: đòn gây tối đa 15 HP, nhận 3 PTS.',
'Khi bị nhắm tới: mở Defense, tung 2 D20 và lấy số cao hơn để trừ Công.',
'Bước Buff: trả 30 HP để gây 20 sát thương cho một đối thủ.',
'Bước Buff: gây 10 sát thương cho toàn bộ đối thủ.',
'Bước Buff: chọn đối thủ nhiều HP nhất; gây sát thương bằng 2 lần D20 của bạn trong round.',
'Bước Buff: chọn đối thủ dưới 30 HP; D6 chẵn kết liễu, lẻ mất lá.',
'Bước Buff sau khi người khác hạ gục: lấy phần thưởng 30 HP và 5 PTS của họ.',
'Bước Buff: gắn bom lên đối thủ, nổ 40 sát thương chuẩn sau 2 round.',
'Sau so sánh D20, trước chọn mục tiêu: cấm skill và mọi buff khác trong round.',
'Khi đang báo đòn đánh: biến D20 Công hoặc Defense do buff >15 thành 1.',
'Bước Buff: cướp nửa PTS của một đối thủ, làm tròn xuống.',
'Khi đang báo đòn đánh: chọn lại mục tiêu ngẫu nhiên, có thể trúng người Công.',
'Bước Buff: đổi toàn bộ PTS thành HP (1:3), hoặc mua PTS bằng HP (1:5).',
'Bước Buff: đảo thứ tự ưu tiên nếu D20 bằng nhau ở round tiếp theo.',
'Khi hai người khác giao chiến: nhận PTS bằng HP thực mất chia 5, làm tròn xuống.',
'Khi báo đòn: hủy đòn và hồi mọi người 15 HP; ở bước Buff chỉ hồi 15 HP.',
'Bước Buff: tất cả mất 25 HP chuẩn; vòng bo đến sớm một round.'
];
