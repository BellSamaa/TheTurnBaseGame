import {translateText} from './localeText';
import type {LmsState} from './lms';
import {rollD20,rollD6,calculateD20Combat} from './battleLogic';
import {CLASS_DEFINITIONS} from './constants';
export const LMS_BUFFS=[
 'Khiên Bức Xạ','Nước Mắt Phượng Hoàng','Thao Túng Không Gian','Bảo Hiểm Nhân Thọ','Ảo Ảnh Kép',
 'Huyết Ngải','Đạn Nổ Diện Rộng','Kẻ Lật Đổ','Nhát Đâm Hèn Nhát','Thuế Khát Máu',
 'Bom Hẹn Giờ','Luật Im Lặng','Nguyền Rủa Đui Mù','Kẻ Trộm D6','Sương Mù Hỗn Loạn',
 'Thương Gia Bóng Tối','Đồng Hồ Cát','Tọa Sơn Quan Hổ Đấu','Hiệp Ước Hòa Bình','Thiên Thạch Tử Chiến'];
export interface BuffState{id:number;used:boolean;revealed:boolean}
export interface LmsExtras{buffs:Record<string,BuffState>;bonusBuffs?:Record<string,BuffState>;bonusRound?:number;flags:Record<string,number|boolean|string>;bombs:{target:string;round:number}[];direction:1|-1;silencedRound?:number;suddenRound:number;lastKill?:{killer:string;round:number;claimed?:boolean;hp:number;pts:number};eliminated:string[]}
export function activateBuff(s:LmsState,actor:string,args:{target?:string;choice?:string;buffSlot?:'initial'|'bonus'}){
 const x=s.extras!,buff=args.buffSlot==='bonus'?x.bonusBuffs?.[actor]:x.buffs[actor],u=s.players.find(p=>p.id===actor)!,a=s.players.find(p=>p.id===s.order[s.active])!,t=s.players.find(p=>p.id===s.target),pick=s.players.find(p=>p.id===args.target&&p.hp>0),own=a.id===actor;
 const require=(ok:unknown,message:string)=>{if(!ok)throw Error(message);};
 require(buff&&!buff.used&&x.silencedRound!==s.round,'Buff đã dùng hoặc đang bị cấm');
 const hit=s.phase==='clash'&&t&&s.attack!>s.defense!;
 const projected=t?calculateD20Combat(s.attack??0,s.defense??20,CLASS_DEFINITIONS[a.classType],CLASS_DEFINITIONS[t.classType],structuredClone(a),structuredClone(t)).damage:0;
 const mark=(key:string,value:number|boolean|string=true)=>x.flags[key]=value;
 switch(buff!.id){
 case 0:require(hit&&t?.id===actor,'Chỉ khi bạn sắp bị đánh trúng');mark('shield:'+actor);break;
 case 1:require(hit&&t?.id===actor&&projected>=u.hp,'Chỉ khi nhận đòn chí tử');mark('phoenix:'+actor);break;
 case 2:require(s.phase==='attack'&&t?.id===actor&&pick&&pick.id!==actor&&pick.id!==a.id,'Chọn người khác để chuyển mục tiêu');s.target=pick!.id;break;
 case 3:require(hit&&t?.id===actor,'Chỉ khi bạn bị đánh trúng');mark('insurance:'+actor);break;
 case 4:require(s.phase==='clash'&&t?.id===actor,'Sau khi bạn tung Thủ');s.defense=Math.max(s.defense!,rollD20(),rollD20());break;
 case 5:require(own&&['target','attack'].includes(s.phase)&&u.hp>30,'Lượt của bạn, trước Công, cần hơn 30 HP');u.hp-=30;mark('blood:'+actor);break;
 case 6:require(own&&['target','attack'].includes(s.phase),'Trước khi tung Công');mark('aoe:'+actor);break;
 case 7:require(own&&s.phase==='attack'&&t&&t.hp===Math.max(...s.players.filter(p=>p.hp>0).map(p=>p.hp)),'Mục tiêu phải có HP cao nhất');mark('double:'+actor);break;
 case 8:require(own&&['target','attack'].includes(s.phase)&&pick&&pick.id!==actor&&pick.hp<30,'Chọn đối thủ dưới 30 HP');if(rollD6()%2===0)pick!.hp=0;s.phase='end';break;
 case 9:require(x.lastKill&&x.lastKill.killer!==actor&&!x.lastKill.claimed&&s.phase==='end','Ngay sau người khác hạ gục');const killer=s.players.find(p=>p.id===x.lastKill!.killer)!;killer.hp=Math.max(1,killer.hp-x.lastKill!.hp);killer.d12Charge=Math.max(0,(killer.d12Charge??0)-x.lastKill!.pts);u.hp=Math.min(u.maxHp,u.hp+30);u.d12Charge=(u.d12Charge??0)+5;x.lastKill!.claimed=true;break;
 case 10:require(pick&&pick.id!==actor,'Chọn đối thủ');x.bombs.push({target:pick!.id,round:s.round+2});break;
 case 11:require(s.active===0&&s.phase==='target'&&s.rolls.length===0,'Đầu vòng mới');x.silencedRound=s.round;break;
 case 12:require(['defense','clash'].includes(s.phase),'Sau khi có kết quả D20');if(args.choice==='defense'){require((s.defense??0)>15,'Thủ phải >15');s.defense=1;}else{require((s.attack??0)>15,'Công phải >15');s.attack=1;}break;
 case 13:require(s.phase==='target'&&pick&&pick.id!==actor,'Đầu lượt, chọn người khác');const stolen=Math.floor((pick!.d12Charge??0)/2);pick!.d12Charge=(pick!.d12Charge??0)-stolen;u.d12Charge=(u.d12Charge??0)+stolen;break;
 case 14:require(s.phase==='attack','Sau khi chọn mục tiêu');const candidates=s.players.filter(p=>p.hp>0);s.target=candidates[Math.floor(Math.random()*candidates.length)].id;break;
 case 15:if(args.choice==='hp'){const cost=Number(args.target);require(Number.isInteger(cost)&&cost>0&&u.hp>cost*5,'Nhập số PTS muốn mua, phải còn ít nhất 1 HP');u.hp-=cost*5;u.d12Charge=(u.d12Charge??0)+cost;}else{u.hp=Math.min(u.maxHp,u.hp+(u.d12Charge??0)*3);u.d12Charge=0;}break;
 case 16:require(s.phase==='end','Cuối lượt');x.direction=x.direction===1?-1:1;break;
 case 17:require(s.phase==='clash'&&a.id!==actor&&t?.id!==actor,'Hai người khác giao chiến');mark('watch:'+actor);break;
 case 18:require(s.phase!=='finished','Trận còn diễn ra');s.players.filter(p=>p.hp>0).forEach(p=>p.hp=Math.min(p.maxHp,p.hp+15));s.phase='end';break;
 case 19:require(s.phase==='end'&&(s.active===(x.direction===1?s.order.length-1:0)),'Cuối vòng');s.players.filter(p=>p.hp>0).forEach(p=>p.hp=Math.max(0,p.hp-25));x.suddenRound=Math.max(s.round+1,x.suddenRound-1);break;
 default:throw Error('Buff không tồn tại');
 }
 buff!.used=true;buff!.revealed=true;s.logVi??=[...s.log];const message=u.name+' lật '+LMS_BUFFS[buff!.id];s.log.unshift(translateText(message,'en'));s.logVi.unshift(message);
}

export const LMS_BUFF_HELP=[
 'Khi sắp bị đánh trúng: chặn đòn, phản 50% sát thương.',
 'Khi D20 sắp gây chí tử: sống với 1 HP và nhận 20 PTS.',
 'Sau khi bị chọn làm mục tiêu, trước D20 Công: chuyển sang người khác.',
 'Khi sắp bị đánh trúng: nhận tối đa 15 sát thương và +3 PTS.',
 'Sau khi tung D20 Thủ: tung thêm hai lần, lấy số lớn nhất.',
 'Trước Công trong lượt mình: trả 30 HP, D20 Công thành 20.',
 'Trước Công trong lượt mình: đánh toàn bộ đối thủ, từng người tung Thủ.',
 'Trước Công, mục tiêu có HP cao nhất bàn: nhân đôi sát thương.',
 'Lượt mình, chọn đối thủ dưới 30 HP: D6 chẵn kết liễu, lẻ mất lượt.',
 'Cuối lượt ngay sau người khác hạ gục: lấy phần thưởng 30 HP và 5 PTS.',
 'Chọn đối thủ còn sống: gắn bom 40 sát thương chuẩn, nổ sau hai vòng.',
 'Đầu vòng mới, trước D6: cấm skill, can thiệp PTS và buff trong vòng.',
 'Sau khi có D20 >15: chọn Công hoặc Thủ để biến kết quả thành 1.',
 'Đầu lượt, khi chọn mục tiêu: cướp một nửa PTS của mục tiêu, làm tròn xuống.',
 'Sau khi chọn mục tiêu, trước Công: random mục tiêu, có thể trúng người công.',
 'Đổi toàn bộ PTS thành HP (1:3), hoặc nhập PTS muốn mua bằng HP (1:5).',
 'Cuối lượt bất kỳ: đảo chiều thứ tự lượt.',
 'Trong Clash của hai người khác: nhận PTS bằng sát thương thực mất /5, làm tròn xuống.',
 'Khi trận còn diễn ra: hủy phần đánh còn lại của lượt và hồi 15 HP cho người sống.',
 'Cuối vòng: tất cả mất 25 HP chuẩn, vòng bo đến sớm một vòng.'
];
