import {weaponBaseDamage} from '@/lib/weaponStats';
import type { WeaponInfo, WeaponTier } from '@/types/game';
import { getTierConfig } from '@/lib/tierStyles';

const ATLAS = '/assets/sprites/ui/frames/weapon-tier-atlas.png';
const slices: Record<WeaponTier, { frame: string; badge: string }> = {
  common: { frame: '81 11 200 201', badge: '585 58 369 104' },
  rare: { frame: '73 434 215 207', badge: '573 450 388 173' },
  epic: { frame: '77 651 207 205', badge: '567 666 396 175' },
  legendary: { frame: '54 862 245 209', badge: '549 886 436 170' },
  mythic: { frame: '43 1077 267 217', badge: '555 1084 430 197' },
  secret: { frame: '43 1296 263 225', badge: '568 1325 405 177' },
};

export default function BattleWeaponPreview({ weapon, en }: { weapon: WeaponInfo; en: boolean }) {
  const tier = getTierConfig(weapon.tier);
  const art = slices[weapon.tier] ?? slices.common;
  return (
    <div className="battle-weapon-preview" title={(en?'Base D20 damage +':'Sát thương gốc D20 +')+weaponBaseDamage(weapon.tier)}>
      <div className="battle-weapon-frame">
        <svg viewBox={art.frame} aria-hidden="true">
          <image href={ATLAS} width="1024" height="1536" />
        </svg>
        <img src={weapon.image} alt={en ? weapon.name : weapon.nameVi} />
      </div>
      <svg className="battle-weapon-tier" viewBox={art.badge} role="img" aria-label={en ? tier.labelEn : tier.labelVi}>
        <image href={ATLAS} width="1024" height="1536" />
      </svg>
    </div>
  );
}
