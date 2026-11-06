import type {PlayerState} from '@/types/game';
export type WeatherKind='rain'|'snow'|'heat'|'superconduct'|'mist';
export interface SummonState {id:string;kind:'golem'|'fire_person'|'mermaid'|'niko';hp:number;maxHp:number;activeUntil:number;lastActionRound?:number;exploded?:boolean}
export interface WeaponUpdateState {
 vineUntil?:number;vineBleedUntil?:number;vineRollRound?:number;vineRestricted?:boolean;sealAttacks?:number;sealActiveRound?:number;
 windAttacks?:number;windChance?:number;windSkipNext?:boolean;attackStartRound?:number;blockedAttackRound?:number;
 cycloneAttacks?:number;cycloneRound?:number;cycloneActiveRound?:number;regenUntil?:number;waterWallAttacks?:number;waterWallRound?:number;waterWallActiveRound?:number;wallCollapse?:boolean;
 haloUntil?:number;haloOwner?:string;d6OneRound?:number;critBonusPending?:number;critBonusRound?:number;critBonus?:number;
 musashiMarkUntil?:number;musashiSmokeAttacks?:number;musashiSmokeRound?:number;musashiRed?:boolean;musashiNormalRound?:number;musashiHealAt?:number;v2ReactionRound?:number;regenPending?:number;
 deathFailures?:number;deathFailureRounds?:number[];deathHiddenReady?:boolean;deathEyeUntil?:number;judgement?:{owner:string;hits:number;attacksLeft:number;lastAttackRound?:number};
 events?:{effect:string;target:string;text:string;textVi:string;damage?:number}[];burnOwner?:string;armor?:number;shieldDefenses?:number;cleaveAttacks?:number;slashDefenses?:number;slashMissTriggered?:boolean;
 lastSkillDie?:number;markUntil?:number;markedBy?:string;namedBy?:string;lastNameDie?:number;nailHits?:number;lastSuccessfulDamage?:number;
 dodgeHits?:number;paralysisAttacks?:number;paralysisChance?:number;frozenAttacks?:number;freezeDefense?:number;freezeDefenseChance?:number;
 slowUntil?:number;chargeBlockUntil?:number;chargeBlockChance?:number;superconductUntil?:number;weakUntil?:number;
 queenDefenseTurns?:number;poisonStacks?:number;poisonUntil?:number;swarmUntil?:number;swarmOwner?:string;
 blueUntil?:number;blueOwner?:string;blueTick?:number;mealUntil?:number;akaiUntil?:number;akaiRound?:number;akaiProcs?:number;
 weather?:{kind:WeatherKind;until:number;remainingTurns?:number;fresh?:boolean;started:number;owner:string;variant?:number};summons?:SummonState[];earthReflects?:number;
 lastRoundTick?:number;lastSummonRound?:number;lastD20Round?:number;lastD20Role?:string;normalSkipRound?:number;
 lastChargeValue?:number;slowChargeRound?:number;slowChargeBlocked?:boolean;skipOpponentAttacks?:number;extraAttacks?:number;
 anchorUntil?:number;anchor?:PlayerState;chronoRerollAttacks?:number;chronoCaster?:string;
 luckUntil?:number;chosenSkill2Form?:number;nextNormalEffect?:string;
}
export function weaponState(p:PlayerState){return p.weaponUpdate??={};}
export function activeWeather(p:PlayerState,round:number){const w=p.weaponUpdate?.weather;return w&&(w.remainingTurns===undefined?w.until>=round:w.remainingTurns>0)?w:undefined;}
export function syncWeather(players:PlayerState[]){const latest=players.map(p=>p.weaponUpdate?.weather).filter(w=>!!w).sort((a,b)=>b!.started-a!.started)[0];if(latest)for(const p of players)weaponState(p).weather={...latest};}
export function takeArmorAndSummons(p:PlayerState,damage:number){const s=weaponState(p);let left=damage;for(const summon of s.summons||[]){const hit=Math.min(summon.hp,left);summon.hp-=hit;left-=hit;if(left<=0)break;}s.summons=s.summons?.filter(x=>x.hp>0);const shield=Math.min(s.armor||0,left);s.armor=(s.armor||0)-shield;return left-shield;}

export function queueWeaponEvent(p:PlayerState,target:PlayerState,effect:string,damage:number){(weaponState(p).events??=[]).push({damage,effect:/^(dn|nw|mu):/.test(effect)?effect:'wu1:'+effect,target:target.id,text:p.name+' · '+effect+': '+damage+' damage.',textVi:p.name+' · '+effect+': '+damage+' sát thương.'});}
export function drainWeaponEvents(players:PlayerState[]){return players.flatMap(p=>{const events=(p.weaponUpdate?.events||[]).map(e=>({...e,caster:p.id}));if(p.weaponUpdate)p.weaponUpdate.events=[];return events;});}

export function advanceWeather(players:PlayerState[],round:number) {
  for (const player of players) {
    const weather = player.weaponUpdate?.weather;
    if (!weather) continue;
    weather.remainingTurns = weather.remainingTurns === undefined
      ? Math.max(0, weather.until - round)
      : weather.remainingTurns - (weather.fresh ? 0 : 1);
    weather.fresh = false;
    if (weather.remainingTurns <= 0) delete player.weaponUpdate!.weather;
  }
}
