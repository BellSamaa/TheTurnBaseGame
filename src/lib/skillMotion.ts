import {animationSpec} from './weaponUpdate2Effects';
export function isMeleeEffect(effect:string){return new Set(['slash_light','slash_heavy','slash_multi','wu1:white_cross','wu1:white_slash','wu1:red_multi_slash','wu1:dual_slash','wu1:pan_bonk','mu:D20_Red','mu:D20_Blue','mu:S1_A_12_Cuts','mu:S1_B_Dash_Cut','mu:S2_B_20_Cuts']).has(effect);}
export function isSupersonicEffect(effect:string){return effect==='mu:S1_B_Dash_Cut'||effect==='mu:S2_B_20_Cuts';}
export function isTravelingEffect(effect:string){return /^mu:S1_C_(Blue|Red)_Wave$/.test(effect)||['wu1:white_triple','wu1:white_flurry','wu1:world_slash','mu:S2_A_Void_Flash'].includes(effect);}
export function projectileColor(effect:string):string|undefined{
 if(/^dn:/.test(effect))return;
 if(['arrow','bullet','magic_orb','fireball','burn_orange','burn_blue','meteor_one','meteor_two','meteor_impact','hollow_purple','void_red','void_blue'].includes(effect))return /purple/.test(effect)?'#bc75ff':/blue|magic/.test(effect)?'#67d8ff':/fire|burn|red|meteor/.test(effect)?'#ff7857':'#ffd66c';
 if(/^nw:(tornado|gale_beam|wind_impact|water_impact|halo_rays|wall_collapse)$/.test(effect))return '#83e5ff';
 if(/^wu1:(fire_arrow|giant_fire_arrow|ice_spear|ice_spears_three|giant_ice_spear|lightning_yellow|lightning_red|lightning_blue|superconduct_orb|superconduct_beam|elemental_beam|water_orb|fire_bomb|worker_bee|queen_bee)$/.test(effect))return /ice|water|blue/.test(effect)?'#7adfff':/fire|red/.test(effect)?'#ff755b':/superconduct|elemental/.test(effect)?'#c58aff':'#ffdc5d';
}
export function effectDuration(effect:string){const clip=animationSpec(effect).ms;return clip+(isSupersonicEffect(effect)?500:/^mu:D20_/.test(effect)?600:isMeleeEffect(effect)?900:projectileColor(effect)?750:effect.startsWith('dn:')?200:350);}
export function presentationDuration(event:{effect:string;cues?:{effect:string}[]}|undefined){return event?(event.cues?.length?event.cues:[event]).reduce((n,c)=>n+effectDuration(c.effect),0):0;}

/** Musashi normal-cut art curves left by default; mirror it for a left-side caster. */
export function musashiNormalFlipX(effect:string,casterOnRight:boolean){return /^mu:D20_(Red|Blue)$/.test(effect)?!casterOnRight:undefined;}
