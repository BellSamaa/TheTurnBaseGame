'use client';
import {useEffect,useRef,useState,type MutableRefObject} from 'react';
import {createClient,type RealtimeChannel} from '@supabase/supabase-js';
import {interpolateLobbyPose,validLobbyPose,type LobbyPeer,type LobbyPose} from '@/lib/lobbyRealtime';
import type {CharacterCustomization} from '@/types/game';

type Identity={id:string;username:string;avatar:CharacterCustomization};
/** No HTTP position fallback: movement is sent only on a subscribed WebSocket. */
export function useLobbyRealtime(identity:Identity|null,position:MutableRefObject<LobbyPose>,onChat:()=>void){
 const [players,setPlayers]=useState<LobbyPeer[]>([]),[error,setError]=useState('');
 const channelRef=useRef<RealtimeChannel|null>(null),identityRef=useRef(identity),chatRef=useRef(onChat);
 identityRef.current=identity;chatRef.current=onChat;
 const notifyChat=()=>{const c=channelRef.current;if(c?.state==='joined')void c.send({type:'broadcast',event:'chat_changed',payload:{}});};
 useEffect(()=>{
  if(!identity?.id)return;let disposed=false,subscribed=false,seq=0,raf=0,previous=performance.now();
  let client:ReturnType<typeof createClient>|undefined,channel:RealtimeChannel|undefined;
  const session=crypto.randomUUID(),targets=new Map<string,LobbyPeer>(),drawn=new Map<string,LobbyPeer>(),lastSeq=new Map<string,number>(),members=new Set<string>();
  let membershipReady=false,lastSent='',lastAt=0;
  const sendPose=(force=false)=>{
   if(!subscribed||channel?.state!=='joined'||!identityRef.current)return;
   const pose=position.current,serialized=JSON.stringify(pose),now=performance.now();
   if(!force&&serialized===lastSent&&now-lastAt<1000)return;
   lastSent=serialized;lastAt=now;void channel.send({type:'broadcast',event:'pose',payload:{...pose,session,user_id:identityRef.current.id,seq:++seq}});
  };
  const syncMembers=()=>{
   if(!channel)return;membershipReady=true;const state=channel.presenceState();members.clear();
   for(const [key,values]of Object.entries(state)){
    if(key===session)continue;
    const v=values[0] as unknown as LobbyPeer;if(!v||!validLobbyPose(v)||typeof v.user_id!=='string'||!v.users?.username)continue;
    members.add(key);if(!targets.has(key))targets.set(key,{...v,session:key,seq:0});
   }
   for(const key of targets.keys())if(!members.has(key)){targets.delete(key);drawn.delete(key);lastSeq.delete(key);}
   sendPose(true);
  };
  const animate=(now:number)=>{
   const dt=(now-previous)/1000;previous=now;
   for(const [key,target]of targets){const old=drawn.get(key);drawn.set(key,old?{...target,...interpolateLobbyPose(old,target,dt)}:target);}
   // Dedupe multiple tabs of one account in the visual roster.
   const unique=new Map<string,LobbyPeer>();for(const p of drawn.values())if(p.user_id!==identityRef.current?.id)unique.set(p.user_id,p);
   if(!disposed)setPlayers([...unique.values()]);raf=requestAnimationFrame(animate);
  };
  const timer=setInterval(()=>sendPose(),100);
  (async()=>{try{
   const r=await fetch('/api/lobby/realtime',{cache:'no-store'}),config=await r.json();if(!r.ok)throw Error(config.error||'Realtime unavailable');if(disposed)return;
   client=createClient(config.url,config.key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},realtime:{params:{eventsPerSecond:20}}});
   channel=client.channel('game-lobby:v2',{config:{broadcast:{self:false,ack:false},presence:{key:session}}});channelRef.current=channel;
   channel.on('presence',{event:'sync'},syncMembers).on('broadcast',{event:'pose'},({payload:raw})=>{
    const payload=raw as LobbyPeer;
    if(!validLobbyPose(payload)||typeof payload.session!=='string'||!Number.isSafeInteger(payload.seq)||payload.session===session||!membershipReady||!members.has(payload.session))return;
    if(payload.seq<=(lastSeq.get(payload.session)??-1))return;const old=targets.get(payload.session);if(!old||old.user_id!==payload.user_id)return;
    lastSeq.set(payload.session,payload.seq);targets.set(payload.session,{...old,...payload,users:old.users});
   }).on('broadcast',{event:'chat_changed'},()=>chatRef.current()).subscribe(async status=>{
    if(disposed)return;subscribed=status==='SUBSCRIBED';
    if(subscribed){setError('');const id=identityRef.current!;await channel!.track({...position.current,session,user_id:id.id,users:{username:id.username,avatar_config:id.avatar},seq:0});sendPose(true);chatRef.current();}
    else if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'){setError('Lobby Realtime disconnected · reconnecting…');}
   });
   raf=requestAnimationFrame(animate);
  }catch(e){if(!disposed)setError((e as Error).message);}})();
  return()=>{disposed=true;subscribed=false;clearInterval(timer);cancelAnimationFrame(raf);channelRef.current=null;if(client&&channel)void client.removeChannel(channel);setPlayers([]);};
 },[identity?.id,position]);
 return {players,error,notifyChat};
}
