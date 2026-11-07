import type {WeaponInfo} from '@/types/game';
const LEGACY_BLADES=new Set(['greatsword','dagger','king_slasher','kagutsuchi']);
export function isBladeWeapon(weapon:WeaponInfo){return weapon.family==='blade'||LEGACY_BLADES.has(weapon.id);}
