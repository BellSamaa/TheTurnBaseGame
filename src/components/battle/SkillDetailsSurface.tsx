'use client';
import {useEffect,useRef,type ReactNode} from 'react';
import {createPortal} from 'react-dom';

/** Touch details belong to the viewport, not to a narrow/scaled command cell. */
export default function SkillDetailsSurface({touch,en,onClose,children}:{touch:boolean;en:boolean;onClose:()=>void;children:ReactNode}){
 const dialog=useRef<HTMLElement>(null);
 const backdropPress=useRef(false);
 useEffect(()=>{
  if(!touch)return;
  const previous=document.activeElement,overflow=document.body.style.overflow;
  document.body.style.overflow='hidden';dialog.current?.focus({preventScroll:true});
  return()=>{document.body.style.overflow=overflow;if(previous instanceof HTMLElement&&previous.isConnected)previous.focus({preventScroll:true});};
 },[touch]);
 if(!touch)return children;
 return createPortal(<div className="skill-touch-overlay" onPointerDown={e=>{backdropPress.current=e.target===e.currentTarget;}} onClick={e=>{if(backdropPress.current&&e.target===e.currentTarget)onClose();}}>
  <section ref={dialog} tabIndex={-1} role="dialog" lang={en?'en':'vi'} aria-modal="true" aria-label={en?'Skill details and forms':'Thông tin và dạng kỹ năng'} className="skill-touch-dialog" onKeyDown={e=>{e.stopPropagation();if(e.key==='Escape')onClose();}}>
   <header><b>{en?'DETAILS / FORMS':'CHI TIẾT / DẠNG'}</b><button type="button" aria-label={en?'Close skill details':'Đóng chi tiết kỹ năng'} onClick={onClose}>X</button></header>
   {children}
  </section>
 </div>,document.body);
}
