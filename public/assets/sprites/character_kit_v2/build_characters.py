"""Original code-native pixel artwork, drawn on a shared 64x96 coordinate grid.
Does not resize, edit or reuse pixels from the earlier generated image sheets.
"""
from PIL import Image, ImageDraw
from pathlib import Path
import json, base64, io, zipfile, hashlib, sys

HERE=Path(__file__).resolve().parent
ROOT=Path(sys.argv[1]) if len(sys.argv)>1 else (HERE if HERE.name=='DiceManiac_CharacterKit_v2' else HERE/'DiceManiac_CharacterKit_v2')
ROOT.mkdir(exist_ok=True)
O=(28,27,40,255); H=(244,239,226,255); M=(184,181,174,255); S=(110,108,115,255)
def canvas(): return Image.new('RGBA',(64,96))
def rect(im,box,c): ImageDraw.Draw(im).rectangle(box,fill=c)
def poly(im,pts,c,outline=None): ImageDraw.Draw(im).polygon(pts,fill=c,outline=outline)
def line(im,pts,c=O,w=1): ImageDraw.Draw(im).line(pts,fill=c,width=w)
def save(im,path):
    p=ROOT/path;p.parent.mkdir(parents=True,exist_ok=True);im.save(p)
    return path
def tint(im,color):
    rgb=tuple(int(color[i:i+2],16) for i in (1,3,5)); out=im.copy()
    out.putdata([((r,g,b,a) if max(r,g,b)<55 else tuple(round(c*max(r,g,b)/244) for c in rgb)+(a,)) for r,g,b,a in im.getdata()])
    return out
def geo(g,b):
    shoulder=8+b*2; waist=shoulder-(3 if g=='female' else 1); hip=shoulder-1
    return shoulder,waist,hip
def torso(im,g,b,c=M):
    s,w,h=geo(g,b)
    poly(im,[(32-s,36),(27,34),(37,34),(32+s,36),(32+w,58),(32+h,64),(32-h,64),(32-w,58)],c,O)
    return s,w,h
def body(g,b):
    im=canvas();s,w,h=geo(g,b)
    # Skin, hands and legs. Head and face anchors are identical for all eight forms.
    for sign in (-1,1):
        poly(im,[(32+sign*(s-2),37),(32+sign*(s+2),38),(32+sign*(s+5),53),(32+sign*(s+5),58),(32+sign*(s+1),59),(32+sign*s,51)],M,O)
    torso(im,g,b,S)
    rect(im,(28,30,36,36),O);rect(im,(29,30,35,36),M)
    # The two trouser legs share a fixed crotch gap and variable hip width.
    for l,r in [(32-h,30),(34,32+h)]:
        poly(im,[(l,62),(r,62),(r,84),(l+1,84)],M,O)
        rect(im,(l+2,68,min(r-1,l+3),81),H)
        rect(im,(l,84,r,89),O);rect(im,(l+1,85,r-1,87),S)
    poly(im,[(24,8),(39,8),(42,11),(42,24),(39,29),(35,32),(28,32),(22,27),(21,23),(21,12)],M,O)
    rect(im,(23,13,25,24),H);rect(im,(23,16,24,22),H)
    rect(im,(20,19,21,23),M);rect(im,(42,19,43,23),S)
    return im

HAIRS=['crop','side_part','spiky','messy','curtain','quiff','bob','pixie','long_straight','long_wavy','ponytail','twin_tails','double_buns','braid','side_braid','afro','mohawk','shag','undercut','swept']
def hair(i):
    back=canvas();front=canvas()
    if i in (6,8,9,10,11,12,13,14,17):
        length={6:34,8:48,9:47,10:43,11:45,12:28,13:46,14:44,17:36}[i]
        poly(back,[(22,11),(41,11),(45,20),(44,length),(38,length+2),(26,length+2),(19,length),(18,20)],S,O)
        for x in (21,24,40,43):line(back,[(x,23),(x,length-2)],M)
    if i in (10,11):
        xs=[43] if i==10 else [17,43]
        for x in xs:poly(back,[(x,14),(x+5,17),(x+5,37),(x+2,45),(x-2,38),(x-3,22)],M,O)
    if i in (13,14):
        x=43 if i==14 else 31
        for y in range(25,48,4):poly(back,[(x,y),(x+3,y+2),(x,y+5),(x-3,y+2)],M,O)
    if i==15:
        for x,y in [(19,9),(25,6),(33,5),(40,7),(44,12),(18,17),(44,18)]:
            rect(front,(x-3,y-3,x+3,y+3),O);rect(front,(x-2,y-2,x+2,y+2),M)
    top=[(21,14),(21,10),(25,6),(38,6),(42,10),(43,16),(39,16),(38,13),(34,15),(30,13),(26,15)]
    if i==0:top=[(22,13),(22,10),(25,8),(39,8),(41,10),(41,14)]
    if i in (2,3,16):top=[(21,15),(19,10),(24,11),(24,5),(29,8),(32,3),(35,8),(40,5),(40,10),(45,9),(42,16),(37,15),(33,13),(28,15)]
    if i in (1,5,18,19):top=[(21,16),(21,10),(27,6),(38,6),(42,10),(42,14),(36,11),(30,14),(24,17)]
    if i in (4,8,9,13,14):top=[(21,17),(21,10),(26,6),(38,6),(42,10),(42,17),(38,16),(34,11),(32,9),(29,13),(25,17)]
    poly(front,top,M,O)
    line(front,[(24,11),(27,8),(36,8)],H,1)
    if i in (6,7,8,9,17):
        rect(front,(20,14,23,26 if i!=7 else 20),M);rect(front,(40,14,43,27 if i!=7 else 20),S)
    if i==12:
        for x in (20,43):rect(front,(x-3,4,x+3,10),O);rect(front,(x-2,5,x+2,9),M)
    if i==3:poly(front,[(20,13),(17,16),(23,16)],M,O)
    if i==5:poly(front,[(25,8),(27,3),(38,3),(41,7),(34,6)],M,O)
    if i==18:rect(front,(20,17,22,22),S)
    if i==19:poly(front,[(24,13),(30,10),(37,11),(33,16),(27,18)],M,O)
    if i==16:rect(front,(29,4,34,12),M);line(front,[(29,4),(34,4)],H)
    return back,front

def face(i):
    im=canvas()
    for x in (26,35):
        if i in (3,9):line(im,[(x,21),(x+3,21)],O)
        elif i==8 and x==35:line(im,[(x,21),(x+3,21)],O)
        else:
            rect(im,(x,19,x+3,22),O);rect(im,(x,19,x,20),H)
        if i in (2,7):line(im,[(x,16 if x==26 else 17),(x+3,17 if x==26 else 16)],O)
        elif i==5:line(im,[(x,16),(x+3,16)],O)
    rect(im,(31,23,32,24),S)
    if i in (1,9):poly(im,[(29,26),(35,26),(33,28),(31,28)],O)
    elif i==5:rect(im,(31,26,33,28),O)
    elif i==6:
        rect(im,(24,24,27,25),S);rect(im,(36,24,39,25),S);line(im,[(30,27),(34,27)],O)
    elif i==4:line(im,[(30,27),(34,27),(35,26)],O)
    else:line(im,[(30,27),(34,27)],O)
    if i==7:rect(im,(29,26,35,27),O);rect(im,(30,26,34,26),H)
    return im

SHIRTS=['crew_tee','vneck','polo','long_sleeve','tank','hoodie','zip_hoodie','sweatshirt','cardigan','denim_jacket','bomber','leather_jacket','formal','vest','turtleneck','striped','baseball','tunic','light_armor','raincoat']
def shirt(g,b,i):
    im=canvas();s,w,h=geo(g,b)
    torso(im,g,b,M)
    # A top must not hide the hands. Long sleeves end at y53; hands start below.
    if i!=4:
        end=45 if i in (0,1,2,15,16) else 53
        for sign in (-1,1):
            poly(im,[(32+sign*(s-1),36),(32+sign*(s+2),38),(32+sign*(s+4),end),(32+sign*(s-1),end)],M,O)
            line(im,[(32+sign*s,end-2),(32+sign*(s+3),end-2)],S)
    poly(im,[(27,34),(28,38),(35,38),(37,34)],O)
    line(im,[(28,35),(29,37),(34,37),(36,35)],H)
    line(im,[(32-s+2,40),(32-w+2,56)],H)
    line(im,[(32+w-1,42),(32+w-1,56)],S,2)
    line(im,[(32-w,59),(32+w,59)],S)
    if i==1:poly(im,[(28,35),(32,42),(36,35)],O)
    if i in (2,12):
        poly(im,[(27,34),(31,40),(28,41),(25,36)],H,O);poly(im,[(37,34),(33,40),(36,41),(39,36)],H,O)
    if i in (5,6):
        line(im,[(26,35),(24,38),(27,42)],S,2);line(im,[(38,35),(40,38),(37,42)],S,2)
        line(im,[(29,39),(29,45)],H);line(im,[(35,39),(35,45)],H)
        rect(im,(28,51,36,56),S);line(im,[(28,51),(36,51)],O)
    if i in (6,8,9,10,11,12,13,19):
        line(im,[(32,39),(32,59)],O)
        for y in (43,49,55):rect(im,(33,y,33,y),H)
    if i in (9,11,19):
        for x in (32-s+4,32+s-7):rect(im,(x,44,x+3,48),S)
    if i==13:
        poly(im,[(27,35),(32,45),(37,35),(38,59),(26,59)],S,O)
    if i==14:rect(im,(28,32,36,37),M);line(im,[(28,33),(36,33)],H)
    if i==15:
        for y in (43,49,55):line(im,[(32-w+1,y),(32+w-1,y)],S,2)
    if i==16:line(im,[(32,39),(32,59)],S,2)
    if i==17:poly(im,[(32-w,58),(32+w,58),(32+h,68),(32-h,68)],M,O);line(im,[(32-w,59),(32+w,59)],O,2)
    if i==18:
        poly(im,[(32-s+2,39),(32+s-2,39),(32+w-2,53),(32,57),(32-w+2,53)],H,O)
        line(im,[(32,40),(32,54)],S)
    if i==3:line(im,[(32-s+1,52),(32+s-1,52)],S)
    if i==7:poly(im,[(30,39),(34,39),(32,42)],S)
    if i==10:rect(im,(32-s+3,44,32-s+5,47),H);line(im,[(32-w,57),(32+w,57)],O,2)
    if i==11:line(im,[(28,39),(35,47),(35,58)],H)
    if i==19:line(im,[(32,39),(32,58)],H);line(im,[(32-w,57),(32+w,57)],H)
    return im

PANTS=['straight','slim','baggy','cargo','joggers','formal','chinos','cropped','sport_shorts','denim_shorts','cargo_shorts','knee_shorts','overalls','tactical','greaves','martial','bellbottom','patched','checked','harem']
def pants(g,b,i):
    im=canvas();s,w,h=geo(g,b)
    end=73 if i in (8,9,10) else 77 if i in (7,11) else 84
    poly(im,[(32-w,59),(32+w,59),(32+h,65),(32+h,end),(34,end),(33,68),(31,68),(30,end),(32-h,end),(32-h,65)],M,O)
    line(im,[(32-w+1,61),(32+w-1,61)],S,2);rect(im,(30,60,34,63),O);rect(im,(31,61,33,62),H)
    for sign in (-1,1):
        x=32+sign*(h-2)
        line(im,[(x,66),(x,end-2)],H)
        if i in (3,10,13):rect(im,(x-1,69,x+1,74),S);line(im,[(x-1,69),(x+1,69)],O)
        if i in (4,7,11):line(im,[(min(x,32+sign*3),end-2),(max(x,32+sign*3),end-2)],S,2)
        if i==14:rect(im,(x-1,73,x+1,80),H);line(im,[(x-1,76),(x+1,76)],S)
        if i==17:rect(im,(x-1,72,x+1,76),S)
    if i==12:
        rect(im,(27,47,37,61),M);rect(im,(27,38,28,49),S);rect(im,(36,38,37,49),S);rect(im,(29,51,35,55),S)
    if i==15:rect(im,(32-w,60,32+w,63),O);rect(im,(31,62,33,68),H)
    if i==18:
        for y in (67,72,77,82):line(im,[(32-h+1,y),(30,y)],S);line(im,[(34,y),(32+h-1,y)],S)
        for x in range(32-h+2,32+h,4):line(im,[(x,65),(x,end-1)],S)
    if i==1:
        for x in (29,35):line(im,[(x,68),(x,82)],S)
    if i==2:
        for x in (32-h+2,32+h-2):poly(im,[(x,68),(x+1,73),(x,78),(x-1,73)],S)
    if i==5:
        for x in (32-(h+2)//2,32+(h+2)//2):line(im,[(x,67),(x,82)],O)
    if i==6:
        line(im,[(32-h+1,64),(32-h+4,67)],O);line(im,[(32+h-1,64),(32+h-4,67)],O)
    if i==9:
        for x in (32-h+2,32+h-4):rect(im,(x,68,x+2,70),H)
    if i==11:line(im,[(32-h+1,75),(30,75)],H)
    if i==16:
        for l,r in [(32-h,30),(34,32+h)]:poly(im,[(l+2,75),(r-2,75),(r,83),(l,83)],H,O)
    if i==19:
        for x in (32-h+3,32+h-3):line(im,[(x,65),(x-1,73),(x,79)],S,2)
    if i==13:
        for y in (76,80):line(im,[(32-h+1,y),(30,y)],O);line(im,[(34,y),(32+h-1,y)],O)
    return im

ACCS=['round_glasses','square_glasses','sunglasses','monocle','hoops','studs','scarf','neckerchief','beanie','cap','headphones','crown','headband','eyepatch','mask','necklace','bowtie','backpack','wristbands','belt_pouch']
def accessory(g,b,i):
    back=canvas();im=canvas();s,w,h=geo(g,b)
    if i in (0,1,2):
        for x in (23,33):
            if i==0:poly(im,[(x+1,18),(x+6,18),(x+7,20),(x+7,23),(x+5,25),(x+1,25),(x,23),(x,20)],O)
            else:rect(im,(x,18,x+7,24),O)
            if i!=2:rect(im,(x+2,20,x+5,22),H)
        line(im,[(30,20),(33,20)],O);line(im,[(21,19),(23,20)],O);line(im,[(40,20),(43,19)],O)
    if i==3:
        ImageDraw.Draw(im).ellipse((33,18,40,25),outline=H,width=1);line(im,[(40,24),(41,32)],O)
    if i in (4,5):
        for x in (20,43):
            if i==4:ImageDraw.Draw(im).rectangle((x-1,24,x+1,28),outline=H)
            else:rect(im,(x,24,x+1,25),H)
    if i in (6,7):
        poly(im,[(26,32),(37,32),(39,36),(33,39),(25,36)],M,O)
        if i==6:poly(back,[(26,35),(24,48),(28,50),(30,37)],M,O)
    if i in (8,9):
        poly(im,[(21,12),(22,7),(26,4),(38,4),(42,8),(43,14)],M,O)
        rect(im,(21,12,43 if i==8 else 46,15),S)
    if i==10:
        line(im,[(20,20),(20,9),(25,5),(38,5),(44,10),(44,20)],O,2)
        rect(im,(18,17,22,25),S);rect(im,(42,17,46,25),S)
    if i==11:poly(im,[(22,12),(22,4),(27,8),(32,2),(37,8),(42,4),(42,12)],H,O);rect(im,(30,9,33,11),S)
    if i==12:rect(im,(21,13,42,16),M);rect(im,(28,13,35,16),H)
    if i==13:line(im,[(21,16),(42,24)],O);rect(im,(34,19,39,23),O)
    if i==14:poly(im,[(25,24),(38,24),(36,29),(29,29)],M,O);line(im,[(27,26),(36,26)],S)
    if i==15:line(im,[(27,35),(28,41),(32,44),(36,41),(37,35)],H);rect(im,(31,43,33,46),S)
    if i==16:poly(im,[(27,35),(31,37),(37,35),(37,40),(32,38),(27,40)],M,O)
    if i==17:
        rect(back,(32-s-3,38,32+s+3,60),S)
        for x in (32-s+3,32+s-3):line(im,[(x,36),(x,52)],S,2)
    if i==18:
        for sign in (-1,1):rect(im,(32+sign*(s+3)-1,53,32+sign*(s+3)+1,55),S)
    if i==19:
        line(im,[(32-w,60),(32+w,60)],O,2);rect(im,(33,60,39,66),S);rect(im,(35,61,37,62),H)
    return back,im

manifest={'version':2,'canvas':[64,96],'origin':[0,0],'anchors':{'head':[32,20],'eyes':[32,21],'neck':[32,34],'waist':[32,60],'feet':[32,90]},'layerOrder':['accessory_back','hair_back','body','pants','shirt','face','hair_front','accessory_front'],'hair':[],'faces':[],'bodies':[],'shirts':SHIRTS,'pants':PANTS,'accessories':ACCS}
for i in range(20):
    bk,fr=hair(i)
    manifest['hair'].append({'id':HAIRS[i],'back':save(bk,f'hair/{i:02}_back.png'),'front':save(fr,f'hair/{i:02}_front.png')})
for i in range(10):manifest['faces'].append(save(face(i),f'faces/{i:02}.png'))
for g in ('male','female'):
    for b in range(4):
        key=f'{g}_{b+1}'; path=save(body(g,b),f'bodies/{key}.png')
        manifest['bodies'].append({'id':key,'path':path,'shoulderHalfWidth':geo(g,b)[0]})
        for i in range(20):
            save(shirt(g,b,i),f'shirts/{key}/{i:02}.png');save(pants(g,b,i),f'pants/{key}/{i:02}.png')
            bk,fr=accessory(g,b,i);save(bk,f'accessories/{key}/{i:02}_back.png');save(fr,f'accessories/{key}/{i:02}_front.png')

def composite(g='male',b=1,ha=0,fa=0,sh=0,pa=0,ac=0):
    im=canvas();hb,hf=hair(ha);ab,af=accessory(g,b,ac)
    layers=[ab,tint(hb,'#87562e'),tint(body(g,b),'#e8b88b'),tint(pants(g,b,pa),'#526785'),tint(shirt(g,b,sh),'#38b4ad'),face(fa),tint(hf,'#87562e'),af]
    for layer in layers:im.alpha_composite(layer)
    return im
save(composite(),'preview_character.png')
sheet=Image.new('RGBA',(8*128,4*212),(19,24,38,255));d=ImageDraw.Draw(sheet)
for n in range(32):
    g='male' if n%8<4 else 'female';b=n%4
    im=composite(g,b,n%20,n%10,n%20,(n*3)%20,n%20).resize((128,192),Image.Resampling.NEAREST)
    x=n%8*128;y=n//8*212;sheet.alpha_composite(im,(x,y));d.text((x+4,y+193),f'{g} {b+1} / set {n}',fill=H)
save(sheet,'preview_32_combinations.png')
qa={'canvas':[64,96],'png_count':0,'wrong_size':[],'opaque_background':[],'partial_alpha':[],'edge_contact':[]}
for p in ROOT.rglob('*.png'):
    if p.name.startswith('preview'):continue
    im=Image.open(p);qa['png_count']+=1
    if im.size!=(64,96):qa['wrong_size'].append(str(p.relative_to(ROOT)))
    alpha=im.getchannel('A');values=set(alpha.getdata())
    if 0 not in values:qa['opaque_background'].append(str(p.relative_to(ROOT)))
    if not values.issubset({0,255}):qa['partial_alpha'].append(str(p.relative_to(ROOT)))
    if any(im.getpixel((x,y))[3] for x,y in [(x,0) for x in range(64)]+[(x,95) for x in range(64)]+[(0,y) for y in range(96)]+[(63,y) for y in range(96)]):qa['edge_contact'].append(str(p.relative_to(ROOT)))
assert not any(qa[k] for k in ('wrong_size','opaque_background','partial_alpha','edge_contact')),qa
(ROOT/'manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf8')
(ROOT/'qa.json').write_text(json.dumps(qa,indent=2),encoding='utf8')
# Embed all images in a single offline preview; no server, dependency or path setup needed.
embedded={str(p.relative_to(ROOT)):base64.b64encode(p.read_bytes()).decode() for p in ROOT.rglob('*.png') if not p.name.startswith('preview')}
html='''<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Dice Maniac Character Kit v2</title>
<style>*{box-sizing:border-box}body{background:#101725;color:#f2ead7;font:16px system-ui;margin:0;padding:24px}main{max-width:1000px;margin:auto}h1{color:#ffc65e}section{display:flex;gap:28px;flex-wrap:wrap}.preview{background:repeating-conic-gradient(#253346 0% 25%,#202c3e 0% 50%) 0/24px 24px;border:3px solid #e9b85b;padding:20px}canvas{width:256px;height:384px;image-rendering:pixelated}form{flex:1;min-width:290px}label{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:9px 0}select{width:200px;padding:8px;color:white;background:#26374e;border:1px solid #657791}button{padding:12px;background:#ffd16a;border:0;font-weight:bold;cursor:pointer}small{color:#b4c5dc}code{color:#66d6cf}</style>
<main><h1>DICE MANIAC · CHARACTER KIT V2</h1><p>Các lớp chung canvas 64×96; 8 thân; 20 tóc, 10 mặt, 20 áo, 20 quần, 20 phụ kiện. Trang này mở trực tiếp, không cần mạng.</p><section><div class="preview"><canvas width="64" height="96" id="view"></canvas></div><form id="controls"></form></section><p><button id="download">Tải PNG nhân vật</button> <button id="random">Ngẫu nhiên</button></p><small>Kiểu vẽ mới được dựng trên cùng lưới pixel. Không trộn trực tiếp với sprite v1. Có thể tắt phụ kiện để xem mặt. Quần áo mặc ngoài đồ lót có sẵn của thân; trang phục hở có giới hạn này.</small><p id="state"></p></main>
<script>const MANIFEST=__MANIFEST__,EMBEDDED=__EMBEDDED__;const images={};const controls=document.querySelector('#controls');const options={body:MANIFEST.bodies.map(x=>x.id),hair:MANIFEST.hair.map(x=>x.id),face:Array.from({length:10},(_,i)=>'face '+(i+1)),shirt:MANIFEST.shirts,pants:MANIFEST.pants,accessory:['none',...MANIFEST.accessories]};const labels={body:'Thân',hair:'Tóc',face:'Mặt',shirt:'Áo',pants:'Quần',accessory:'Phụ kiện'};
for(const [key,vals] of Object.entries(options)){let label=document.createElement('label');label.append(labels[key]);let select=document.createElement('select');select.id=key;vals.forEach((v,i)=>select.add(new Option(v,i)));select.onchange=render;label.append(select);controls.append(label)}
for(const [id,val] of [['skin','#e8b88b'],['hairColor','#87562e'],['shirtColor','#38b4ad'],['pantsColor','#526785']]){let l=document.createElement('label');l.append({skin:'Màu da',hairColor:'Màu tóc',shirtColor:'Màu áo',pantsColor:'Màu quần'}[id]);let inp=document.createElement('input');inp.type='color';inp.id=id;inp.value=val;inp.oninput=render;l.append(inp);controls.append(l)}
function pathNum(n){return String(n).padStart(2,'0')}function value(id){return document.getElementById(id).value}
function drawLayer(ctx,path,color){let src=images[path];if(!src)return;if(!color){ctx.drawImage(src,0,0);return}let tmp=document.createElement('canvas');tmp.width=64;tmp.height=96;let t=tmp.getContext('2d');t.drawImage(src,0,0);let data=t.getImageData(0,0,64,96);let rgb=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16));for(let i=0;i<data.data.length;i+=4){let lum=Math.max(data.data[i],data.data[i+1],data.data[i+2]);if(lum>=55)rgb.forEach((v,j)=>data.data[i+j]=Math.round(v*lum/244))}t.putImageData(data,0,0);ctx.drawImage(tmp,0,0)}
function render(){let ctx=document.getElementById('view').getContext('2d');ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,64,96);let body=options.body[+value('body')],h=MANIFEST.hair[+value('hair')],ac=+value('accessory')-1;let a=ac>=0?`accessories/${body}/${pathNum(ac)}`:null;
for(const [path,color] of [[a&&a+'_back.png',null],[h.back,value('hairColor')],[`bodies/${body}.png`,value('skin')],[`pants/${body}/${pathNum(+value('pants'))}.png`,value('pantsColor')],[`shirts/${body}/${pathNum(+value('shirt'))}.png`,value('shirtColor')],[MANIFEST.faces[+value('face')],null],[h.front,value('hairColor')],[a&&a+'_front.png',null]])if(path)drawLayer(ctx,path,color);document.querySelector('#state').textContent='Canvas: 64 × 96 | '+body+' | Không scale từng lớp; chỉ phóng cả nhân vật.'}
document.querySelector('#random').onclick=()=>{for(const k of Object.keys(options))document.getElementById(k).selectedIndex=Math.floor(Math.random()*options[k].length);render()};document.querySelector('#download').onclick=()=>{let a=document.createElement('a');a.download='dice-maniac-character.png';a.href=document.getElementById('view').toDataURL();a.click()};
Promise.all(Object.entries(EMBEDDED).map(([p,b])=>new Promise((ok,fail)=>{let img=new Image();img.onload=()=>{images[p]=img;ok()};img.onerror=fail;img.src='data:image/png;base64,'+b}))).then(render);
</script></html>'''.replace('__MANIFEST__',json.dumps(manifest)).replace('__EMBEDDED__',json.dumps(embedded))
(ROOT/'preview.html').write_text(html,encoding='utf8')
(ROOT/'README_VI.md').write_text('''# Dice Maniac Character Kit v2

Đây là bộ sprite MỚI, dựng trực tiếp trên cùng lưới pixel, không phải bản sửa pixel của bộ v1. Phong cách đơn giản hơn để ưu tiên khả năng ghép chính xác.

## Dùng nhanh
Mở preview.html bằng Chrome/Edge. Trang này nhúng toàn bộ sprite, không cần server hoặc mạng. Chọn thân, tóc, mặt, áo, quần, phụ kiện và màu; có thể tải PNG ghép.

## Quy tắc tích hợp
- Canvas logic của MỌI layer là 64×96; đặt mọi layer ở (0,0).
- Không trim riêng, không object-fit hay scale riêng từng món. Chỉ scale nhân vật đã ghép bằng nearest-neighbor.
- Chọn đúng thư mục male_1..4 hoặc female_1..4 cho áo, quần và phụ kiện. Các biến thể này được dựng theo hình học của thân tương ứng.
- Thứ tự layer trong manifest.json: accessory_back, hair_back, body, pants, shirt, face, hair_front, accessory_front.
- Tất cả điểm mắt, đầu và chân chung nhau; xem anchors trong manifest.json.
- Đổi màu bằng nhân màu theo độ sáng; giữ nguyên pixel viền tối và alpha. preview.html chứa mã tham khảo.
- Dùng CharacterRenderer chung cho preview và trận đấu.
- 20 phụ kiện bao gồm các kiểu kính, khuyên, khăn, mũ, tai nghe, vương miện, băng đầu, bịt mắt, khẩu trang, dây chuyền, nơ, balô, vòng tay và túi đeo hông.

## Giới hạn
- Chỉ tư thế đứng chính diện; chưa có animation đi/chém hoặc góc nghiêng.
- Các dạng thân nữ/nam là cách điệu; khác biệt hình thể được thể hiện bằng đường eo, không phải ảnh giải phẫu.
- Mỗi lần chọn 1 áo, 1 quần, 1 phụ kiện. Không hỗ trợ chồng nhiều phụ kiện cùng lúc.
- Một số phụ kiện chủ động che tóc/mặt (mũ, khẩu trang, bịt mắt). Đây là hành vi thiết kế.
- Thân có đồ lót nền; áo hở và quần ngắn không loại bỏ đồ lót nền.
- Đây là bộ khởi đầu code-native, không tái tạo toàn bộ mức chi tiết mỹ thuật của bộ v1.

## Kiểm tra
qa.json ghi số file và kiểm tra kỹ thuật: canvas, alpha nhị phân, không chạm biên. preview_32_combinations.png là 32 tổ hợp mẫu; không đại diện kiểm duyệt mọi tổ hợp có thể có.
''',encoding='utf8')
print(json.dumps(qa));print('Output:',ROOT)
