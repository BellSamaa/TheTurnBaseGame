/** Contact attacks approach the target; beams, projectiles, auras and counters stay in place. */
export function isMeleeEffect(effect:string){return new Set(['slash_light','slash_heavy','slash_multi','wu1:white_cross','wu1:white_slash','wu1:red_multi_slash','wu1:dual_slash','wu1:pan_bonk']).has(effect);}
export function effectDuration(effect:string){return effect.startsWith('dn:')?2200:isMeleeEffect(effect)?1200:850;}
