/** Furniture footprints in normalized lounge.png coordinates; movement uses feet. */
export const LOBBY_FOOTPRINTS = [
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
