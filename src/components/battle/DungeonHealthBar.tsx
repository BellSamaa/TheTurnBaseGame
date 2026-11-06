'use client';
import HealthBar from '@/components/ui/HealthBar';
export default function DungeonHealthBar({current,max,armor=0,judgement}:{current:number;max:number;armor?:number;judgement?:{hits:number;attacksLeft:number}}){
 if(judgement)return <HealthBar judgement={judgement} current={current} max={max}/>;
 const percent=Math.max(0,Math.min(100,current/Math.max(1,max)*100));
 return <div className="dungeon-health-frame" role="progressbar" aria-label="Dungeon HP" aria-valuenow={Math.max(0,current)} aria-valuemin={0} aria-valuemax={max}>
  <div className="dungeon-health-track"><div className={'dungeon-health-fill '+(percent<30?'hp-low':'')} style={{width:percent+'%'}}/>{armor>0&&<div className="dungeon-health-shield" style={{width:Math.min(40,armor/Math.max(1,max)*100)+'%'}}/>}</div>
  <span>{Math.max(0,current)}/{max}{armor>0&&<b> +{armor}</b>}</span>
  <svg viewBox="0 135 2172 410" aria-hidden="true"><image href="/assets/sprites/ui/frames/dungeon-health.png" width="2172" height="724"/></svg>
 </div>;
}
