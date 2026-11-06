import type {CSSProperties} from 'react';
import {weaponBaseDamage} from '@/lib/weaponStats';
import type {WeaponInfo} from '@/types/game';
import {getTierConfig} from '@/lib/tierStyles';
export default function BattleWeaponPreview({weapon,en}:{weapon:WeaponInfo;en:boolean}){
 const tier=getTierConfig(weapon.tier);
 return <div className="battle-weapon-preview weapon-preview-aura" style={{'--weapon-glow':tier.accentColor} as CSSProperties} title={(en?'Base D20 damage +':'Sát thương gốc D20 +')+weaponBaseDamage(weapon.tier)}><img className="weapon-preview-art" src={weapon.image} alt={en?weapon.name:weapon.nameVi}/><div><b>{en?weapon.name:weapon.nameVi}</b><small>{en?tier.labelEn:tier.labelVi}</small></div></div>;
}
