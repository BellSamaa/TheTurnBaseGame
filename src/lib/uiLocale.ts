'use client';
import {useGameStore} from '@/stores/gameStore';
import {translateText} from './localeText';
export function tx(text:string|null|undefined){return translateText(text||'',useGameStore.getState().settings.language);}

export function phaseLabel(phase:string){const vi:Record<string,string>={charge:'SẠC D6',target:'CHỌN MỤC TIÊU',attack:'TẤN CÔNG',defense:'PHÒNG THỦ',clash:'CAN THIỆP',end:'KẾT THÚC LƯỢT',finished:'KẾT THÚC'};return useGameStore.getState().settings.language==='vi'?vi[phase]||phase:phase.toUpperCase();}
