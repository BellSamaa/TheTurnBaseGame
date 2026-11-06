export const HIT_SOUND_FILES = [
 'bamboo-hit-sound-effect.mp3','bat_hit.mp3','bongo-hit.mp3','combat-sword-swing-hit.mp3',
 'critical-hit-sounds-effect.mp3','hit1.mp3','hitsound_2.mp3','knock-out-hit-sound.mp3',
 'minecraft-mob-villager-hit-2-gaming-sound-effect-minecraft-hd-sound-effects.mp3','orchestra-hit-or-combo-sound-1.mp3',
 'sfx_taunt.mp3','slap-sound-effect-funny-memes.mp3','smash-bros-hit.mp3','tf2-critical-hit-recieved.mp3',
] as const;
/** Every shuffle uses all available clips; the last two also stay excluded across shuffle boundaries. */
export function createHitSoundPicker(random=()=>Math.random()){
 let remaining:number[]=[],recent:number[]=[];
 return ()=>{
  if(!remaining.length){remaining=HIT_SOUND_FILES.map((_,i)=>i);for(let i=remaining.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[remaining[i],remaining[j]]=[remaining[j],remaining[i]];}}
  const index=remaining.findIndex(i=>!recent.includes(i));
  const [choice]=remaining.splice(index,1);recent=[...recent,choice].slice(-2);
  return '/assets/sounds/hits/'+encodeURIComponent(HIT_SOUND_FILES[choice]);
 };
}
export interface CombatHit {id:string;damage:number;caster:string;target:string;at:number}
export function recordCombatHit(state:{hitEvents?:CombatHit[]},damage:number,caster:string,target:string){
 if(!(damage>0)||!Number.isFinite(damage)||caster===target)return;
 state.hitEvents=[...(state.hitEvents||[]),{id:crypto.randomUUID(),damage,caster,target,at:Date.now()}].slice(-48);
}
