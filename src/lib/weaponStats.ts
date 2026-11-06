import type {WeaponTier} from '@/types/game';
/** Added once to a successful normal D20 hit, before defensive absorption. */
export function weaponBaseDamage(tier?:WeaponTier){return tier?({common:0,rare:1,epic:2,legendary:3,mythic:4,secret:5}[tier]??0):0;}
