import {onlineDb} from './onlineRuntime';

type ChatAction='join'|'touch'|'leave'|'read'|'send';
type ChatError={code?:string;message:string};
/** Use the full signature: omitting the optional message can select an older overload. */
export async function lobbyChatRequest(actor:string,session:string|null,action:ChatAction,message:string|null=null){
 try{
  const {data,error}=await onlineDb().rpc('game_lobby_chat_session',{
   p_actor:actor,p_session:session,p_action:action,p_message:message,
  });
  if(error)return chatFailure(error);
  return {data,error:null,status:200};
 }catch{
  return chatFailure({code:'CONNECTION',message:'Chat connection failed'});
 }
}
function chatFailure(error:ChatError){
 const code=error.code||'UNKNOWN';
 // Do not label permission, connection, or SQL runtime errors as missing migrations.
 const descriptions:Record<string,string>={
  PGRST202:'Chat function is missing from the Supabase schema cache',
  PGRST203:'Conflicting versions of the Supabase chat function',
  '21000':'Chat database needs the safe-delete repair: sql/20261105-lobby-chat-safe-delete.sql',
  '42501':'Supabase denied permission to the chat database',
  '42P01':'A required chat database table is missing',
  '42703':'A required chat database column is missing',
  '23503':'Your account is missing from the chat database',
  CONNECTION:'Cannot connect to the chat server',
 };
 const status=error.message==='Please wait a second'?429:error.code==='P0001'?400:503;
 const message=error.code==='P0001'?error.message:descriptions[code]||'Lobby chat is temporarily unavailable';
 console.error('[lobby-chat]',{code,message:error.message});
 return {data:null,error:{error:message+' ('+code+')',code},status};
}
