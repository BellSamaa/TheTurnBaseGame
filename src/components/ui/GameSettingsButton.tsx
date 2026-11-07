'use client';
import {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import SettingsPanel from '@/components/settings/SettingsPanel';
import {useGameStore} from '@/stores/gameStore';
import HudButton from './HudButton';
export default function GameSettingsButton(){
 const [open,setOpen]=useState(false),dialog=useRef<HTMLDivElement>(null),trigger=useRef<HTMLButtonElement>(null);
 const en=useGameStore(s=>s.settings.language)==='en';
 useEffect(()=>{if(!open)return;const overflow=document.body.style.overflow;document.body.style.overflow='hidden';window.dispatchEvent(new Event('blur'));dialog.current?.focus();return()=>{document.body.style.overflow=overflow;trigger.current?.focus();};},[open]);
 return <><HudButton ref={trigger} art="settings" label={en?'Settings':'Cài đặt'} title={en?'Settings':'Cài đặt'} onClick={()=>setOpen(true)}/>{open&&createPortal(<div className="game-settings-overlay" onClick={e=>{if(e.target===e.currentTarget)setOpen(false);}}><div ref={dialog} tabIndex={-1} className="game-settings-dialog" role="dialog" aria-modal="true" aria-label={en?'Game settings':'Cài đặt game'} onKeyDown={e=>{e.stopPropagation();if(e.key==='Escape')setOpen(false);}} onKeyUp={e=>e.stopPropagation()}><SettingsPanel onClose={()=>setOpen(false)}/></div></div>,document.body)}</>;
}
