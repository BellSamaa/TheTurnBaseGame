export const RANK_NAMES=['Đồng','Sắt','Vàng','Kim Cương','Bạch Kim','Huyền Thoại Xúc Sắc','Xúc Sắc Hoàng Kim','Vua trò chơi'];
export const STAR_COSTS=[100,150,220,320,450,650,900,1300];
export const RANK_WIN_STAR_RATIOS=[1,1,.9,.8,.6,.5,.1,.1];
export function rankWinPoints(points:number){const r=rankProgress(points);return Math.round(100*RANK_WIN_STAR_RATIOS[r.rank]);}
export function rankProgress(points=1000){
 let balance=Math.max(0,points-1000),rank=0;
 while(rank<7&&balance>=STAR_COSTS[rank]*5){balance-=STAR_COSTS[rank]*5;rank++;}
 return {rank,name:RANK_NAMES[rank],stars:Math.min(5,Math.floor(balance/STAR_COSTS[rank])),points:balance%STAR_COSTS[rank],required:STAR_COSTS[rank]};
}
export function levelProgress(exp=0){let level=1,remaining=Math.max(0,exp);while(level<100&&remaining>=100*level*level){remaining-=100*level*level;level++;}return{level,exp:remaining,required:level===100?0:100*level*level};}
export interface AccountProgress{highest_rank?:number;gems:number;rubies:number;exp:number;equipped_frame:number;ownedFrames:number[];claimedRanks:number[];rankPoints:number;wins:number;losses:number}
export const EMPTY_PROGRESS:AccountProgress={gems:0,rubies:0,exp:0,equipped_frame:0,ownedFrames:[],claimedRanks:[],rankPoints:1000,wins:0,losses:0};
export const PVE_WEAPONS=['greatsword','bow','spirit_stone','revolver','dagger','chronos_watch','fire_headband','infinity_ring'];
export function pveReward(stage:number){const n=Math.min(100,Math.max(1,stage));return{gems:Math.floor(12+6*Math.pow(n,1.3)),rubies:n>=5?1+(n>=8?1:0):0,exp:Math.floor(20+12*Math.pow(n,1.4))};}
