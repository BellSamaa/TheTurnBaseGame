type Point={x:number;y:number};
type Rect=readonly[number,number,number,number];
// Bounds follow the visible floor and the bases of furniture, not their tall sprites.
const floors:Record<number,Point[]>={
 0:[{x:.08,y:.66},{x:.33,y:.62},{x:.35,y:.54},{x:.65,y:.54},{x:.67,y:.62},{x:.94,y:.66},{x:.92,y:.81},{x:.74,y:.87},{x:.74,y:.92},{x:.25,y:.92},{x:.25,y:.87},{x:.08,y:.81}],
 1:[{x:.07,y:.49},{x:.93,y:.49},{x:.94,y:.9},{x:.07,y:.9}],
 2:[{x:.05,y:.47},{x:.95,y:.47},{x:.95,y:.94},{x:.05,y:.94}],
 3:[{x:.28,y:.49},{x:.96,y:.49},{x:.94,y:.84},{x:.6,y:.86},{x:.6,y:.94},{x:.41,y:.94},{x:.41,y:.86},{x:.07,y:.84},{x:.07,y:.63},{x:.27,y:.61}],
 4:[{x:.07,y:.48},{x:.95,y:.48},{x:.94,y:.83},{x:.60,y:.84},{x:.59,y:.94},{x:.41,y:.94},{x:.40,y:.84},{x:.07,y:.83}],
};
const furniture:Record<number,Rect[]>={
 0:[[.08,.59,.25,.64],[.73,.59,.94,.64],[.08,.76,.14,.85],[.87,.76,.95,.85]],
 1:[[.05,.49,.25,.51],[.28,.49,.45,.51],[.68,.49,.94,.51],[.04,.64,.19,.81],[.81,.64,.95,.81],[.32,.80,.47,.87],[.55,.80,.67,.87],[.43,.76,.57,.89],[.34,.89,.47,.95],[.55,.89,.68,.95],[.69,.75,.84,.86]],
 2:[[.03,.73,.13,.94],[.14,.82,.24,.90],[.28,.77,.38,.95],[.40,.81,.59,.91],[.61,.77,.72,.95],[.76,.82,.86,.90],[.87,.73,.97,.95]],
 3:[[.04,.72,.15,.85],[.17,.77,.31,.86],[.30,.82,.38,.87],[.64,.82,.71,.87],[.71,.77,.85,.86],[.85,.72,.97,.85]],
 4:[[.09,.73,.15,.84],[.13,.78,.39,.86],[.38,.79,.44,.94],[.57,.79,.63,.94],[.62,.78,.87,.86],[.86,.73,.92,.84]],
};
function inside(p:Point,polygon:Point[]){let result=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i],b=polygon[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)result=!result;}return result;}
export function dungeonFloorAllowed(x:number,y:number,area:number){
 if(!Number.isFinite(x)||!Number.isFinite(y))return false;
 const poly=floors[area]||floors[0],rects=furniture[area]||furniture[0];
 // A small foot box stops the character clipping through the edge of furniture.
 for(const dx of [-.009,.009])for(const dy of [-.007,.007]){const p={x:x+dx,y:y+dy};if(!inside(p,poly)||rects.some(([l,t,r,b])=>p.x>=l&&p.x<=r&&p.y>=t&&p.y<=b))return false;}
 return true;
}
export function dungeonPathAllowed(from:Point,to:Point,area:number){
 const steps=Math.max(1,Math.ceil(Math.hypot(to.x-from.x,to.y-from.y)/.004));
 for(let i=1;i<=steps;i++)if(!dungeonFloorAllowed(from.x+(to.x-from.x)*i/steps,from.y+(to.y-from.y)*i/steps,area))return false;
 return true;
}
