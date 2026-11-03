import { createClient } from '@supabase/supabase-js';
export type Presence = 'online' | 'offline' | 'lobby' | 'battle' | 'unknown';
export function aggregatePresence(rows: {user_id:string;activity:string;last_seen:string}[], now=Date.now()) {
 const result: Record<string,Presence> = {};
 const priority: Record<string,number> = {online:1,lobby:2,battle:3};
 for (const row of rows) if (now-Date.parse(row.last_seen)<90000 && priority[row.activity]) {
   if (!result[row.user_id] || priority[row.activity]>priority[result[row.user_id]]) result[row.user_id]=row.activity as Presence;
 }
 return result;
}
export async function readPresence(ids: string[]) {
 const url=process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if (!url || !key) return null;
 const db=createClient(url,key,{auth:{persistSession:false}});
 const {data,error}=await db.from('player_presence').select('user_id,activity,last_seen').in('user_id',ids).gt('last_seen',new Date(Date.now()-90000).toISOString());
 if(error) return null;
 return aggregatePresence(data || []);
}
