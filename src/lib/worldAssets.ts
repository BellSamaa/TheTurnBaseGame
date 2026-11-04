export const WORLD_SCENES: Record<string,string> = {
  plains:'01_Meadow',forest:'02_Moon_Forest',desert:'03_Desert',ice:'04_Ice',
  volcano:'05_Lava',castle:'06_Castle',swamp:'07_Swamp',sky_island:'08_Sky_Island',
  cyberpunk:'09_Cyberpunk',lobby:'10_Cozy_Lobby',
};
export function worldSceneUrl(mapId:string){return '/assets/worlds/scenes/'+(WORLD_SCENES[mapId]||WORLD_SCENES.castle)+'.glb';}
export const LOBBY_DOORS = {
  modes: {x:-9,z:0}, rooms: {x:9,z:0},
} as const;
export const LOBBY_SPAWN = {x:0,z:5};
