import type {CharacterCustomization} from '@/types/game';
export type LobbyPose={x:number;z:number;facing:'left'|'right';moving:boolean;seat_id?:string|null};
export type LobbyPeer=LobbyPose&{session:string;user_id:string;seq:number;users:{username:string;avatar_config:CharacterCustomization}};
export function validLobbyPose(p:unknown):p is LobbyPose{const v=p as LobbyPose;return !!v&&Number.isFinite(v.x)&&Number.isFinite(v.z)&&Math.abs(v.x)<=9.6&&v.z>=-4&&v.z<=6&&typeof v.moving==='boolean'&&['left','right'].includes(v.facing)&&(!v.seat_id||typeof v.seat_id==='string');}
/** Frame-rate independent lerp: reaches ~95% of the target in 180ms. */
export function interpolateLobbyPose(current:LobbyPose,target:LobbyPose,dt:number):LobbyPose{
 const alpha=1-Math.exp(-Math.max(0,Math.min(dt,.1))*18);
 const x=current.x+(target.x-current.x)*alpha,z=current.z+(target.z-current.z)*alpha;
 return {...target,x:Math.abs(target.x-x)<.002?target.x:x,z:Math.abs(target.z-z)<.002?target.z:z,moving:target.moving||Math.hypot(target.x-x,target.z-z)>.025};
}
