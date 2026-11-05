const fs=require('fs'),path=require('path'),ts=require('typescript'),Module=require('module'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),originalLoad=Module._load;let response={data:{messages:[]},error:null},requests=[],url;
Module._load=function(id,parent,...rest){
 if(id==='@/lib/onlineRuntime'||(id==='./onlineRuntime'&&parent.filename.endsWith('lobbyChat.ts')))return {onlineDb:()=>({rpc:async(name,args)=>{requests.push({name,args});return response;}})};
 if(id==='@/lib/serverAuth')return {sessionUser:async()=>actor,sameOrigin:()=>origin};
 if(id==='@supabase/supabase-js')return {createClient:(value)=>{url=value;return {};}};
 if(id==='./serverDb'&&parent.filename.endsWith('onlineRuntime.ts'))return {};
 return originalLoad.call(this,id.startsWith('@/')?path.join(root,'src',id.slice(2)):id,parent,...rest);
};
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,f);
let actor='user-a',origin=true;const chat=require('../src/app/api/lobby/chat/route.ts'),session=require('../src/app/api/lobby/chat/session/route.ts');const req=body=>new Request('http://localhost/api/lobby/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
(async()=>{
 await chat.GET();await session.POST(req({session:'00000000-0000-0000-0000-000000000001',action:'join'}));await chat.POST(req({message:' hello '}));
 assert.deepEqual(requests.map(r=>r.args.p_message),[null,null,'hello']);assert.deepEqual(requests.map(r=>r.args.p_action),['read','join','send']);
 for(const r of requests)assert.deepEqual(Object.keys(r.args).sort(),['p_action','p_actor','p_message','p_session']);
 assert.equal((await session.POST(req({session:'------------------------------------',action:'join'}))).status,400);
 const log=console.error;console.error=()=>{};
 try{for(const [code,expected]of [['21000','safe-delete'],['42501','permission'],['PGRST202','schema cache'],['PGRST203','Conflicting'],['23503','account'],['42P01','table']]){response={data:null,error:{code,message:'diagnostic'}};const r=await chat.GET(),b=await r.json();assert.equal(r.status,503);assert.equal(b.code,code);assert.ok(b.error.includes(expected));assert.ok(!b.error.includes('Apply sql'));}
 response={data:null,error:{code:'P0001',message:'Please wait a second'}};assert.equal((await chat.POST(req({message:'hello'}))).status,429);
 }finally{console.error=log;}
 actor=null;assert.equal((await chat.GET()).status,401);actor='user-a';origin=false;assert.equal((await chat.POST(req({message:'hello'}))).status,403);
 process.env.NEXT_PUBLIC_SUPABASE_URL='https://active-project.supabase.co';process.env.SUPABASE_URL='https://stale-project.supabase.co';process.env.SUPABASE_SERVICE_ROLE_KEY='test-only';require('../src/lib/onlineRuntime.ts').onlineDb();assert.equal(url,process.env.NEXT_PUBLIC_SUPABASE_URL);
 console.log('PASS: full chat RPC signature resolves overload selection; read/join/send; permission/schema/cache errors distinguished; rate limit, auth/origin and UUID guards; chat uses the same Supabase project as accounts');
})().catch(e=>{console.error(e);process.exit(1)});
