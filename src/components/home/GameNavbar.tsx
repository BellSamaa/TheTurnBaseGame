'use client';
import {useGameStore} from '@/stores/gameStore';
import {WalletBar,useProgress} from '@/components/progression/AccountPanel';
import {AudioToolbarControls} from '@/components/audio/AudioManager';
import HudButton,{NAV_ART} from '@/components/ui/HudButton';
import GameSettingsButton from '@/components/ui/GameSettingsButton';
import PlayerAvatar from '@/components/ui/PlayerAvatar';
import {rankProgress} from '@/lib/progression';
import {tx} from '@/lib/uiLocale';
import {playClickSound} from '@/lib/soundEffects';
export default function GameNavbar(){
 const {currentUser,setAuthModal,logoutUser,settings,updateSettings}=useGameStore(),p=useProgress();
 const en=settings.language==='en';
 return <header className="game-navbar" aria-label={en?'Game toolbar':'Thanh công cụ game'}>
  <WalletBar/>
  <div className="game-navbar-actions"><AudioToolbarControls/>
   <div className="hud-language" role="group" aria-label={en?'Language':'Ngôn ngữ'}>{(['en','vi'] as const).map(lang=><button key={lang} type="button" aria-pressed={settings.language===lang} aria-label={lang==='en'?'English':'Tiếng Việt'} onClick={()=>{playClickSound();updateSettings({language:lang});}}><span className={'hud-language-art lang-'+lang}/><span className="sr-only">{lang.toUpperCase()}</span></button>)}</div>
   <HudButton art="global" label="Global" onClick={()=>{playClickSound();setAuthModal('global');}}/>
   {currentUser?<><button className="hud-profile" type="button" onClick={()=>setAuthModal('profile')} aria-label={en?'Open profile':'Mở hồ sơ'}><img className="hud-profile-frame" src={NAV_ART+'profile.webp'} alt=""/><PlayerAvatar character={currentUser.avatarConfig} frame={p.equipped_frame} size={32}/><span><b>{currentUser.username}</b><small>{tx(rankProgress(p.rankPoints).name)}</small></span></button><HudButton art="close" label={en?'Sign out':'Đăng xuất'} title={en?'Sign out':'Đăng xuất'} onClick={logoutUser}/></>:<><button className="hud-text-button" onClick={()=>setAuthModal('login')}>{en?'LOGIN':'ĐĂNG NHẬP'}</button><button className="hud-text-button" onClick={()=>setAuthModal('signup')}>{en?'SIGN UP':'ĐĂNG KÝ'}</button></>}
   <GameSettingsButton/>
  </div>
 </header>;
}
