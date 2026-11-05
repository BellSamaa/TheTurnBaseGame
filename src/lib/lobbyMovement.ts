/** Furniture footprints in normalized lounge.png coordinates; movement uses feet. */
export const LOBBY_FOOTPRINTS = [
  [.025,.415,.10,.565], [.90,.415,.975,.565],
  [.035,.23,.115,.30], [.305,.20,.42,.305], [.425,.20,.575,.315], [.58,.20,.695,.305], [.865,.21,.955,.30],
  [.305,.675,.395,.88], [.605,.675,.695,.88], [.435,.72,.56,.845],
  [.03,.77,.10,.89], [.095,.80,.155,.91], [.16,.82,.26,.91],
  [.74,.82,.84,.91], [.845,.80,.905,.91], [.91,.77,.975,.89],
];
export const LOBBY_OBSTACLES=LOBBY_FOOTPRINTS.map(([a,b,c,d])=>[(a-.5)*20,(b-.56)*15,(c-.5)*20,(d-.56)*15]);
export function lobbyPositionAllowed(x:number,z:number){
  const u=.5+x/20,v=.56+z/15;
  return Number.isFinite(x)&&Number.isFinite(z)&&u>.025&&u<.975&&v>.30&&v<.945&&
    !LOBBY_FOOTPRINTS.some(([a,b,c,d])=>u>a-.008&&u<c+.008&&v>b-.005&&v<d+.005);
}

export const LOBBY_SEATS=[
 {id:'sofa-left-1',x:-3,z:2.6,exitX:-2,exitZ:1.5},{id:'sofa-left-2',x:-3,z:3.6,exitX:-3,exitZ:5.25},
 {id:'sofa-right-1',x:3,z:2.6,exitX:2,exitZ:1.5},{id:'sofa-right-2',x:3,z:3.6,exitX:3,exitZ:5.25},
 {id:'bench-left',x:-5.8,z:4.6,exitX:-5.8,exitZ:3.7},{id:'bench-right',x:5.8,z:4.6,exitX:5.8,exitZ:3.7},
];
export function nearbyLobbySeat(x:number,z:number){return LOBBY_SEATS.filter(s=>Math.hypot(s.exitX-x,s.exitZ-z)<1.15).sort((a,b)=>Math.hypot(a.exitX-x,a.exitZ-z)-Math.hypot(b.exitX-x,b.exitZ-z))[0];}
