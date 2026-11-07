'use client';
import type {ComponentPropsWithRef,ReactNode} from 'react';
export const NAV_ART='/assets/ui/navbar/';
export default function HudButton({art,label,muted=false,children,className='',...props}:ComponentPropsWithRef<'button'>&{art:string;label:string;muted?:boolean;children?:ReactNode}){
 return <button type="button" {...props} aria-label={props['aria-label']||label} className={'hud-image-button hud-'+art+(muted?' is-muted':'')+' '+className}>
  <img src={NAV_ART+art+'.webp'} alt="" draggable={false}/>{muted&&<span className="hud-muted-badge">OFF</span>}{children}
 </button>;
}
