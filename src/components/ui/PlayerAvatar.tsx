'use client';
import CharacterRenderer from '@/components/character/CharacterRenderer';
import type {CharacterCustomization} from '@/types/game';
export default function PlayerAvatar({character,frame=0,size=64}:{character:CharacterCustomization;frame?:number;size?:number}){
 return <div className="player-avatar" style={{width:size,height:size}}>
   <div className="avatar-portrait">
     <CharacterRenderer character={character} className="avatar-character" animation="still" showShadow={false}/>
   </div>
   {frame>0?<img className="avatar-frame" src={'/assets/progression/frame-'+frame+'.webp'} alt="Khung rank"/>:<span className="avatar-default"/>}
 </div>;
}
