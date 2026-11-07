const sharp=require('sharp'),fs=require('fs'),path=require('path');
const source=path.resolve('Picture/Frame'),output=path.resolve('public/assets/ui/navbar');
const files={bgm:'Nút BGM pixel art hắc ám-4.png',sfx:'Nút SFX pixel art viền cyan-6.png',language:'Nút chuyển ngôn ngữ pixel EN_VI-10.png',close:'Nút đóng X pixel art hắc ám-8.png',global:'Nút GLOBAL pixel fantasy cổ điển-9.png',level:'Thanh cấp độ RPG pixel art-5.png',gem:'Biểu tượng kim cương ngọc lam pixel-3.png',ruby:'Ruby đỏ pixel lấp lánh-7.png',profile:'Khung hồ sơ người chơi pixel art-11.png','gem-counter':'Thanh đếm ngọc lam RPG pixel-1.png','ruby-counter':'Khung đếm hồng ngọc pixel-2.png'};
(async()=>{
 fs.mkdirSync(output,{recursive:true});
 for(const [name,file]of Object.entries(files)){
  let data=await sharp(path.join(source,file)).trim().toBuffer();
  if(name==='level'){
   const m=await sharp(data).metadata(),left=530,right=430,middle=350;
   const pieces=await Promise.all([{x:0,w:left,d:0},{x:650,w:middle,d:left},{x:m.width-right,w:right,d:left+middle}].map(async part=>({input:await sharp(data).extract({left:part.x,top:0,width:part.w,height:m.height}).toBuffer(),left:part.d,top:0})));
   data=await sharp({create:{width:left+middle+right,height:m.height,channels:4,background:'#00000000'}}).composite(pieces).png().toBuffer();
  }
  if(name.endsWith('-counter')){
   const m=await sharp(data).metadata(),x=Math.round(m.width*.033),y=Math.round(m.height*.12),w=Math.round(m.width*.18),h=Math.round(m.height*.78);
   const patch=await sharp(data).extract({left:Math.round(m.width*.35),top:y,width:w,height:h}).toBuffer();
   data=await sharp(data).composite([{input:patch,left:x,top:y}]).toBuffer();
  }
  await sharp(data).resize({width:['gem','ruby'].includes(name)?96:800,withoutEnlargement:true}).webp({lossless:true}).toFile(path.join(output,name+'.webp'));
 }
 const hud=path.join(source,'Bộ HUD chiến đấu xúc xắc-6.png');
 const gear=await sharp(hud).extract({left:50,top:565,width:145,height:135}).png().toBuffer();
 await sharp(gear).resize(96,96,{fit:'contain'}).webp({lossless:true}).toFile(path.join(output,'settings.webp'));
 console.log('Navbar: trimmed pixel buttons, blank currency counters, icons and profile frame exported.');
})().catch(e=>{console.error(e);process.exitCode=1});
