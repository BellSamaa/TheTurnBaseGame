import json, struct, math, random, pathlib, copy
import numpy as np
from PIL import Image, ImageDraw

ROOT=pathlib.Path(__file__).resolve().parents[1]
R=random.Random(20261105)
def rgb(h):
    h=h.lstrip('#');return [int(h[i:i+2],16)/255 for i in (0,2,4)]
def mesh(v,f):
    v=np.array(v,float);f=np.array(f,int)
    area=np.linalg.norm(np.cross(v[f[:,1]]-v[f[:,0]],v[f[:,2]]-v[f[:,0]]),axis=1)
    return v,f[area>1e-9]
def box():
    v=[[-.5,-.5,-.5],[.5,-.5,-.5],[.5,.5,-.5],[-.5,.5,-.5],[-.5,-.5,.5],[.5,-.5,.5],[.5,.5,.5],[-.5,.5,.5]]
    return mesh(v,[(0,2,1),(0,3,2),(4,5,6),(4,6,7),(0,1,5),(0,5,4),(3,7,6),(3,6,2),(0,4,7),(0,7,3),(1,2,6),(1,6,5)])
def cone(n=12,top=0):
    v=[]
    for y,r in [(0,1),(1,top)]:
        v += [[math.cos(i*2*math.pi/n)*r,y,math.sin(i*2*math.pi/n)*r] for i in range(n)]
    v += [[0,0,0],[0,1,0]];f=[]
    for i in range(n):
        j=(i+1)%n;f += [(i,n+j,j),(i,n+i,n+j),(2*n,j,i),(2*n+1,n+i,n+j)]
    return mesh(v,f)
def sphere(n=10,m=6):
    v=[[math.sin(j*math.pi/m)*math.cos(i*2*math.pi/n),math.cos(j*math.pi/m),math.sin(j*math.pi/m)*math.sin(i*2*math.pi/n)] for j in range(m+1) for i in range(n)]
    f=[]
    for j in range(m):
        for i in range(n):
            a=j*n+i;b=j*n+(i+1)%n;c=b+n;d=a+n;f += [(a,b,c),(a,c,d)]
    return mesh(v,f)
SHAPES={'box':box(),'cone':cone(),'cylinder':cone(top=1),'crystal':cone(6),'sphere':sphere(),'pyramid':cone(4),'rock':sphere(7,4)}
def rotation(a):
    x,y,z=a;cx,sx=math.cos(x),math.sin(x);cy,sy=math.cos(y),math.sin(y);cz,sz=math.cos(z),math.sin(z)
    return np.array([[cy*cz,-cy*sz,sy],[cx*sz+sx*sy*cz,cx*cz-sx*sy*sz,-sx*cy],[sx*sz-cx*sy*cz,sx*cz+cx*sy*sz,cx*cy]])
class World:
    def __init__(self,name): self.name=name;self.parts=[];self.anchors={}
    def add(self,name,shape,pos,scale,color,rot=(0,0,0),emit=0):
        self.parts.append(dict(name=name,shape=shape,pos=list(pos),scale=list(scale),color=color,rot=list(rot),emit=emit));return self
    def B(self,n,p,s,c,rot=(0,0,0),emit=0):return self.add(n,'box',p,s,c,rot,emit)
    def C(self,n,p,s,c,rot=(0,0,0),emit=0):return self.add(n,'cylinder',p,s,c,rot,emit)
    def S(self,n,p,s,c):return self.add(n,'sphere',p,s,c)
    def place(self,prop,x,z,scale=1,angle=0,y=0):
        mat=rotation((0,angle,0))
        for i,p in enumerate(prop.parts):
            q=copy.deepcopy(p);q['name']=prop.name+'_'+str(len(self.parts));q['pos']=(mat@(np.array(p['pos'])*scale)+[x,y,z]).tolist();q['scale']=(np.array(p['scale'])*scale).tolist();q['rot'][1]+=angle;self.parts.append(q)
    def vertices(self,p):
        v,f=SHAPES[p['shape']];return (v*np.array(p['scale']))@rotation(p['rot']).T+np.array(p['pos']),f
    def glb(self,path):
        doc={'asset':{'version':'2.0','generator':'Dice Maniac procedural low-poly environment kit'},'scene':0,'scenes':[{'name':self.name,'nodes':[]}],'nodes':[],'meshes':[],'materials':[],'accessors':[],'bufferViews':[]};buf=bytearray();mats={};geos={}
        def acc(arr,typ,comp):
            while len(buf)%4:buf.append(0)
            off=len(buf);buf.extend(arr.tobytes());vi=len(doc['bufferViews']);doc['bufferViews'].append({'buffer':0,'byteOffset':off,'byteLength':arr.nbytes})
            a={'bufferView':vi,'componentType':comp,'count':len(arr),'type':typ}
            if typ=='VEC3':a.update(min=arr.min(axis=0).tolist(),max=arr.max(axis=0).tolist())
            doc['accessors'].append(a);return len(doc['accessors'])-1
        for p in self.parts:
            key=(p['color'],p['emit'])
            if key not in mats:
                c=rgb(p['color']);mats[key]=len(doc['materials']);mat={'name':p['color'],'pbrMetallicRoughness':{'baseColorFactor':c+[1],'roughnessFactor':.82,'metallicFactor':.08},'doubleSided':True}
                if p['emit']:mat['emissiveFactor']=[t*min(p['emit'],1) for t in c]
                doc['materials'].append(mat)
            gkey=(p['shape'],key)
            if gkey not in geos:
                v,f=SHAPES[p['shape']];vs=v[f].reshape(-1,3);ns=np.cross(v[f[:,1]]-v[f[:,0]],v[f[:,2]]-v[f[:,0]]);ns/=np.maximum(np.linalg.norm(ns,axis=1)[:,None],1e-8);ns=np.repeat(ns,3,axis=0)
                va=acc(vs.astype('<f4'),'VEC3',5126);na=acc(ns.astype('<f4'),'VEC3',5126)
                geos[gkey]=len(doc['meshes']);doc['meshes'].append({'name':p['shape'],'primitives':[{'attributes':{'POSITION':va,'NORMAL':na},'material':mats[key]}]})
            transform=np.eye(4);transform[:3,:3]=rotation(p['rot'])@np.diag(p['scale']);transform[:3,3]=p['pos']
            doc['scenes'][0]['nodes'].append(len(doc['nodes']));doc['nodes'].append({'name':p['name'],'mesh':geos[gkey],'matrix':transform.T.flatten().tolist()})
        for name,pos in self.anchors.items():
            doc['scenes'][0]['nodes'].append(len(doc['nodes']));doc['nodes'].append({'name':name,'translation':pos,'extras':{'role':name}})
        doc['buffers']=[{'byteLength':len(buf)}];js=json.dumps(doc,separators=(',',':')).encode();js+=b' '*((-len(js))%4);buf+=b'\0'*((-len(buf))%4)
        data=struct.pack('<III',0x46546c67,2,12+8+len(js)+8+len(buf))+struct.pack('<II',len(js),0x4e4f534a)+js+struct.pack('<II',len(buf),0x004e4942)+buf
        path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(data)
    def render(self,path,yaw=0,tilt=.65,extent=23,center=(0,1,0),size=(960,640),bg='#172438'):
        # Deterministic orthographic model preview, rendering the actual exported geometry.
        forward=np.array([math.sin(yaw)*math.cos(tilt),-math.sin(tilt),-math.cos(yaw)*math.cos(tilt)]);right=np.cross(forward,[0,1,0]);right/=np.linalg.norm(right);up=np.cross(right,forward)
        polys=[];light=np.array([-.4,.85,.35]);light/=np.linalg.norm(light)
        for p in self.parts:
            v,f=self.vertices(p);vv=v-np.array(center);proj=np.stack((vv@right,vv@up,vv@forward),axis=1);c=np.array(rgb(p['color']))*255
            for face in f:
                pts=v[face];normal=np.cross(pts[1]-pts[0],pts[2]-pts[0]);ln=np.linalg.norm(normal)
                if ln<1e-8:continue
                normal/=ln
                if normal@forward>0:normal=-normal
                shade=.48+.52*max(0,normal@light);shade=max(shade,.9 if p['emit'] else 0)
                pp=proj[face];xy=[(size[0]/2+x*size[0]/extent,size[1]/2-y*size[0]/extent) for x,y,_ in pp]
                if max(x for x,y in xy)<0 or min(x for x,y in xy)>size[0] or max(y for x,y in xy)<0 or min(y for x,y in xy)>size[1]:continue
                polys.append((pp[:,2].mean(),xy,tuple(np.clip(c*shade,0,255).astype(int))))
        # Z-buffer is essential: a large floor triangle must not hide props.
        rgba=bg is None
        image=np.zeros((size[1],size[0],4 if rgba else 3),dtype=np.uint8)
        if not rgba:image[:]=np.array(rgb(bg))*255
        depth=np.full((size[1],size[0]),np.inf)
        for p in self.parts:
            v,f=self.vertices(p);vv=v-np.array(center);proj=np.stack((size[0]/2+(vv@right)*size[0]/extent,size[1]/2-(vv@up)*size[0]/extent,vv@forward),axis=1)
            c=np.array(rgb(p['color']))*255
            for face in f:
                pts=v[face];normal=np.cross(pts[1]-pts[0],pts[2]-pts[0]);ln=np.linalg.norm(normal)
                if ln<1e-8:continue
                normal/=ln
                if normal@forward>0:normal=-normal
                shade=max(.48+.52*max(0,normal@light),.9 if p['emit'] else 0)
                q=proj[face];x0,y0=q[0,:2];x1,y1=q[1,:2];x2,y2=q[2,:2]
                den=(y1-y2)*(x0-x2)+(x2-x1)*(y0-y2)
                if abs(den)<1e-6:continue
                xa=max(0,int(np.floor(q[:,0].min())));xb=min(size[0]-1,int(np.ceil(q[:,0].max())))
                ya=max(0,int(np.floor(q[:,1].min())));yb=min(size[1]-1,int(np.ceil(q[:,1].max())))
                if xa>xb or ya>yb:continue
                xx,yy=np.meshgrid(np.arange(xa,xb+1)+.5,np.arange(ya,yb+1)+.5)
                aa=((y1-y2)*(xx-x2)+(x2-x1)*(yy-y2))/den;bb=((y2-y0)*(xx-x2)+(x0-x2)*(yy-y2))/den;cc=1-aa-bb
                zz=aa*q[0,2]+bb*q[1,2]+cc*q[2,2];region=depth[ya:yb+1,xa:xb+1];mask=(aa>=-1e-6)&(bb>=-1e-6)&(cc>=-1e-6)&(zz<region)
                region[mask]=zz[mask];col=list(np.clip(c*shade,0,255).astype(np.uint8))
                if rgba:col.append(255)
                image[ya:yb+1,xa:xb+1][mask]=col
        path.parent.mkdir(parents=True,exist_ok=True);Image.fromarray(image).save(path)

PROPS={}
def reg(w):PROPS[w.name]=w;return w
def tree(name,leaf,snow=False,palm=False):
    w=World(name);w.C('trunk',(0,0,0),(.22,2.3,.22),'#765234')
    if palm:
        for i in range(7):
            a=i*math.tau/7;w.add('leaf','cone',(math.cos(a)*.6,2.1,math.sin(a)*.6),(.5,2,.18),leaf,(.8,a,1.0))
    elif snow:
        for y,r in [(1,1.1),(1.8,.86),(2.5,.55)]:
            w.add('pine','cone',(0,y,0),(r,1.65,r),leaf);w.add('snow','cone',(0,y+.45,0),(r*.78,1.25,r*.78),'#e4f8ff')
    else:
        w.S('canopy',(0,2.5,0),(1.25,1.2,1.15),leaf);w.S('canopy',(1,2.2,0),(.8,.9,.85),leaf);w.S('canopy',(-.8,2.4,.3),(.8,1,.8),leaf)
    return reg(w)
tree('oak_tree','#67b43b');tree('ancient_tree','#236958');tree('snow_pine','#255e77',True);tree('palm_tree','#558b35',palm=True);tree('swamp_tree','#466657')
for name,c in [('moss_rock','#6f8d67'),('basalt_rock','#393646'),('snow_rock','#a5c5df'),('sandstone_rock','#bd8e58'),('marble_rock','#ddd2d8')]:
    w=World(name);w.add('rock','rock',(0,.55,0),(1,.7,.8),c);reg(w)
for name,c in [('ice_crystals','#54dcfa'),('violet_crystals','#ab63ee')]:
    w=World(name)
    for x,z,h in [(0,0,1.8),(.6,.2,1.2),(-.5,-.1,.85)]:
        w.C('body',(x,0,z),(.3,h,.3),c);w.add('tip','crystal',(x,h,z),(.3,.6,.3),c)
    reg(w)
for name,c in [('stone_arch','#8a91a4'),('sandstone_arch','#cf9d60'),('marble_arch','#e9dfe2')]:
    w=World(name)
    for x in [-1.2,1.2]:
        w.B('base',(x,.18,0),(.85,.36,.85),c);w.B('column',(x,1.7,0),(.52,3,.52),c);w.B('capital',(x,3.15,0),(.8,.3,.8),c)
    w.B('lintel',(0,3.45,0),(3.3,.48,.75),c);reg(w)
for name,c in [('banner_crimson','#a52d4e'),('banner_violet','#694196')]:
    w=World(name);w.C('pole',(0,0,0),(.06,3.2,.06),'#cba65b');w.B('cloth',(.45,2.15,0),(.85,1.5,.06),c);w.B('crossbar',(.45,2.94,0),(1.1,.08,.08),'#dfb45b');reg(w)
w=World('warm_lantern');w.C('post',(0,0,0),(.08,1.8,.08),'#3c3545');w.B('glow',(0,2,0),(.42,.55,.42),'#ffd182',emit=1);w.add('cap','pyramid',(0,2.29,0),(.42,.32,.42),'#916939');reg(w)
w=World('glow_mushrooms')
for x,z,h in [(0,0,.6),(.48,.2,.4),(-.38,.1,.3)]:
    w.C('stem',(x,0,z),(.08,h,.08),'#a1ded5');w.S('cap',(x,h,z),(.42,.18,.42),'#4ee7db')
reg(w)
w=World('glow_reeds')
for i in range(5):
    x=(i-2)*.2;w.C('stem',(x,0,0),(.035,.9+abs(x),.035),'#337b78');w.S('light',(x,1+abs(x),0),(.08,.2,.08),'#71ffe4')
reg(w)
w=World('lily_pad');w.C('pad',(0,0,0),(.55,.04,.55),'#4d975c');w.add('flower','cone',(0,.08,0),(.19,.23,.19),'#f58ec4');reg(w)
w=World('obelisk');w.B('base',(0,.15,0),(1,.3,1),'#c18b4e');w.B('column',(0,1.55,0),(.58,2.6,.58),'#e0ad65');w.add('tip','pyramid',(0,2.85,0),(.41,.65,.41),'#f4c97f',(0,math.pi/4,0));reg(w)
w=World('wood_fence')
for x in [-1.2,0,1.2]:w.B('post',(x,.65,0),(.16,1.3,.16),'#95663d')
for y in [.4,.95]:w.B('rail',(0,y,0),(2.6,.12,.12),'#b78d57')
reg(w)
w=World('windmill');w.C('tower',(0,0,0),(.8,3,.8),'#f0dfb9');w.add('roof','cone',(0,3,0),(1,1,1),'#ad6545')
for a in [0,math.pi/2]:w.B('sail',(0,2.8,.88),(.2,3.6,.08),'#d8c19b',(0,0,a+.65))
reg(w)
w=World('cottage');w.B('walls',(0,1,0),(2,2,1.6),'#dec8a3');w.add('roof','pyramid',(0,2,0),(1.7,1.1,1.4),'#a6674b',(0,math.pi/4,0));w.B('door',(0,.55,.81),(.5,1.1,.04),'#72523e');reg(w)
w=World('wood_pier')
for i in range(8):w.B('plank',(0,.35,(i-3.5)*.35),(2,.15,.32),'#8d7262')
for x in [-.8,.8]:
    for z in [-1.1,1.1]:w.C('leg',(x,-.65,z),(.08,1,.08),'#635544')
reg(w)
w=World('swamp_hut');w.B('hut',(0,1.2,0),(2.2,1.8,1.8),'#756350');w.add('roof','pyramid',(0,2.1,0),(2,1.2,1.65),'#58764b',(0,math.pi/4,0));w.B('door',(0,.95,.91),(.6,1.3,.06),'#3b353d');reg(w)
w=World('hvac_unit');w.B('case',(0,.6,0),(1.6,1.2,1.1),'#47546e')
for i in range(6):w.B('vent',(0,.25+i*.13,.56),(1.25,.045,.04),'#1d2a42')
w.B('neon',(.65,.65,.58),(.07,.8,.04),'#44e7f3',emit=1);reg(w)
w=World('neon_console');w.B('base',(0,.65,0),(1,1.3,.6),'#343856');w.B('screen',(0,1,.32),(.8,.42,.04),'#f34fe6',emit=1);reg(w)
w=World('pipe');w.C('vertical',(0,0,0),(.17,1.8,.17),'#73869a');w.C('band',(0,.4,0),(.22,.22,.22),'#45cfe4');reg(w)
w=World('bench')
w.B('seat',(0,.55,0),(2,.2,.65),'#a67546');w.B('back',(0,1,-.25),(2,.75,.12),'#ad7b4d')
for x in [-.8,.8]:w.B('legs',(x,.25,0),(.16,.5,.48),'#664a39')
reg(w)
w=World('sofa');w.B('base',(0,.45,0),(2.5,.6,1),'#af674b');w.B('back',(0,1,-.4),(2.5,1,.25),'#ca8960')
for x in [-1.1,1.1]:w.B('arm',(x,.78,0),(.3,.5,1),'#c17c55')
for x in [-.55,.55]:w.B('cushion',(x,.8,.04),(.95,.15,.8),'#edbd7e')
reg(w)
w=World('table');w.B('top',(0,.8,0),(1.8,.15,1.2),'#ad7949')
for x in [-.7,.7]:
    for z in [-.4,.4]:w.B('leg',(x,.38,z),(.13,.76,.13),'#795336')
reg(w)
w=World('bookshelf');w.B('back',(0,1,-.2),(1.8,2,.15),'#734c34')
for x in [-.86,.86]:w.B('side',(x,1,0),(.12,2,.55),'#a57041')
for y in [.08,.7,1.35,1.97]:w.B('shelf',(0,y,0),(1.8,.1,.58),'#b17c47')
for j in range(3):
    for i in range(8):w.B('book',(-.7+i*.19,j*.63+.34,.02),(.13,.42,.3),['#558b91','#b85d52','#ceab5e','#81679a'][i%4])
reg(w)
w=World('potted_plant');w.C('pot',(0,0,0),(.35,.55,.35),'#b9714c');w.S('leaves',(0,1,0),(.6,.65,.5),'#538c53');reg(w)
w=World('fireplace');w.B('chimney',(0,1.3,-.3),(2.2,2.6,.7),'#8b7970');w.B('black opening',(0,.65,.09),(1.45,1.25,.12),'#352c30');w.add('flame','cone',(0,.15,.28),(.35,.85,.27),'#ffaf4f',emit=1);w.B('mantel',(0,1.5,.05),(2.6,.2,1),'#b3997d');reg(w)
w=World('wood_door');w.B('door',(0,1.25,0),(1.55,2.5,.12),'#9f7048')
for x in [-.87,.87]:w.B('frame',(x,1.35,0),(.2,2.7,.28),'#d4ac71')
w.B('lintel',(0,2.75,0),(1.95,.2,.3),'#d4ac71');w.S('knob',(.5,1.15,.13),(.075,.075,.075),'#e6bf68');reg(w)
w=World('treasure_chest');w.B('base',(0,.35,0),(1.2,.7,.8),'#975d38');w.B('lid',(0,.8,0),(1.2,.2,.8),'#bc8a4b')
for x in [-.48,.48]:w.B('band',(x,.5,.415),(.12,.8,.04),'#e1b653')
reg(w)

def tile_floor(w,c,edge):
    w.B('Arena_Base',(0,-.4,0),(16,.8,16),edge)
    for x in range(-7,8,2):
        for z in range(-7,8,2):w.B('Ground_Tile',(x,-.04,z),(1.96,.1,1.96),c)
    w.anchors={'SPAWN_1':[-3.5,.1,3.5],'SPAWN_2':[3.5,.1,3.5],'SPAWN_3':[3.5,.1,-3.5],'SPAWN_4':[-3.5,.1,-3.5],'ARENA_CENTER':[0,0,0]}
def mountain(w,x,z,h,c):w.add('mountain','cone',(x,-2,z),(h*.7,h,h*.6),c)
def tower(w,x,z,c,roof):
    w.C('tower',(x,0,z),(.85,4,.85),c);w.add('roof','cone',(x,4,z),(1.15,1.7,1.15),roof)
    w.B('window',(x,2.9,z+.86),(.3,.6,.06),'#ffcf7a',emit=1)
WORLDS=[]
def world(name,c,e):
    w=World(name);tile_floor(w,c,e);WORLDS.append(w);return w
w=world('01_Meadow','#81b44a','#79945a');w.B('surrounding_terrain',(0,-.6,-8),(40,1.1,48),'#68904d')
for x,z in [(-6,-5),(6,-5),(-6,5),(6,5),(-7,0),(7,0)]:w.place(PROPS['oak_tree'],x,z,.9)
for x in [-5,5]:w.place(PROPS['wood_fence'],x,7);w.place(PROPS['moss_rock'],x,-6,.7)
w.place(PROPS['windmill'],3,-11,1.5);w.place(PROPS['cottage'],6,-10);w.B('river',(-10,-.2,0),(3,.1,20),'#51bcd4')
for x in [-12,-5,4,12]:mountain(w,x,-22,10,'#649b96')

w=world('02_Moon_Forest','#52745f','#3b5962');w.B('forest_ground',(0,-.6,-4),(36,1.1,36),'#365c51')
for x,z in [(-7,-6),(7,-6),(-7,6),(7,6),(-9,0),(9,0)]:w.place(PROPS['ancient_tree'],x,z,1.5)
for x in [-6,6]:w.place(PROPS['stone_arch'],x,-6,.8);w.place(PROPS['glow_mushrooms'],x,4,1.2)
for x,z in [(-6,0),(6,0),(-3,-7),(3,7)]:w.place(PROPS['moss_rock'],x,z);w.place(PROPS['glow_mushrooms'],x+.8,z,.7)
w.B('pool',(0,-.3,-10),(8,.1,5),'#2e9eab');w.B('waterfall',(0,2,-12),(.8,4,.3),'#70dcd9')

w=world('03_Desert','#d8ad6b','#ad8154');w.B('desert_ground',(0,-.6,-9),(50,1.1,60),'#b9925e')
for x in [-6,6]:w.place(PROPS['obelisk'],x,5,1.2);w.place(PROPS['sandstone_arch'],x,-6,.85);w.place(PROPS['palm_tree'],x,-9)
for x,z in [(-7,0),(7,1),(-5,7),(5,-7)]:w.place(PROPS['sandstone_rock'],x,z)
for x,z,s in [(-7,-19,7),(7,-22,9),(0,-28,11)]:w.add('pyramid','pyramid',(x,-1,z),(s,s,s),'#deb777',(0,math.pi/4,0))

w=world('04_Ice','#9cbcd7','#5882aa');w.B('snow_ground',(0,-.6,-8),(45,1.1,50),'#c6e0eb')
for x,z in [(-7,-5),(7,-5),(-8,4),(8,4)]:w.place(PROPS['snow_pine'],x,z,1.1);w.place(PROPS['ice_crystals'],x*.85,z+1,.8)
for x in [-7,7]:w.place(PROPS['snow_rock'],x,7)
for x in [-3,0,3]:tower(w,x,-13,'#a7c7e0','#55c3e8')
for x in [-13,13]:mountain(w,x,-23,14,'#a1c6dc')

w=world('05_Lava','#50424e','#312f40');w.B('lava_sea',(0,-1.4,0),(38,.15,38),'#fa7839',emit=1)
for x,z in [(-7,-6),(7,-6),(-8,3),(8,3),(-6,7),(6,7)]:
    w.place(PROPS['basalt_rock'],x,z,1.3);w.add('basalt_spire','cone',(x,-.2,z),(1,3.5,1),'#34313f')
w.place(PROPS['stone_arch'],0,-8,1.1);w.add('volcano','cone',(0,-2,-22),(9,12,9),'#514151');w.C('crater',(0,9,-22),(1.1,.15,1.1),'#ff9943',emit=1)

w=world('06_Castle','#a4a5b9','#727b95');w.B('courtyard_surroundings',(0,-.6,-9),(36,1.1,44),'#666f89')
for x,z in [(-6,-6),(6,-6)]:w.place(PROPS['stone_arch'],x,z);w.place(PROPS['banner_crimson'],x-1.3,z+.6)
for x in [-7,7]:
    for z in [-3,2,6]:w.place(PROPS['warm_lantern'],x,z);w.place(PROPS['potted_plant'],x+.4,z)
for x in [-5,-2,2,5]:tower(w,x,-16,'#7b8dab','#454f85')
w.B('castle_keep',(0,2,-16),(8,4,3),'#8495ae')

w=world('07_Swamp','#7a7a85','#525768');w.B('swamp_water',(0,-.65,0),(32,.1,32),'#357d83')
for x,z in [(-8,-6),(8,-6),(-9,4),(9,4)]:
    w.add('tree_islet','rock',(x,-.25,z),(1.7,.4,1.5),'#4e685b');w.place(PROPS['swamp_tree'],x,z,1.3)
for x,z in [(-7,1),(7,1),(-5,-7),(5,7)]:w.place(PROPS['glow_reeds'],x,z);w.place(PROPS['glow_mushrooms'],x,z+1)
w.place(PROPS['wood_pier'],3,-9,1.2);w.place(PROPS['swamp_hut'],3,-12,1.3)
for x,z in [(-10,0),(10,2),(8,-10),(-8,9)]:w.place(PROPS['lily_pad'],x,z,y=-.55)

w=world('08_Sky_Island','#e6dae2','#ad98b5');w.add('floating_island','cone',(0,-7,0),(0.1,6.3,.1),'#9a91b7')
# Tapered underside, broad at top, pointed at bottom.
w.add('island_underside','cone',(0,-7,0),(.01,6.4,.01),'#9685ad')
v,f=cone(16,top=.02);SHAPES['island_taper']=(v,f)
w.add('island_rock','island_taper',(0,-.6,0),(11,7,11),'#9b91ae',(math.pi,0,0))
for x,z in [(-6,-6),(6,-6),(-7,5),(7,5)]:w.place(PROPS['marble_arch'],x,z,.8);w.place(PROPS['banner_violet'],x,z-.4,.8)
for z in [.04]:
    w.B('gold_inlay_x',(0,z,0),(13,.03,.1),'#dbb15b');w.B('gold_inlay_z',(0,z,0),(.1,.03,13),'#dbb15b')
for x in [-16,16]:
    w.add('far_island','rock',(x,-1.6,-22),(5,2,4),'#bca3bc');tower(w,x,-22,'#f1e6dc','#d5b76b')

w=world('09_Cyberpunk','#3e4965','#28344f')
for x in [-7.7,7.7]:
    w.B('neon_edge',(x,.04,0),(.08,.06,15),'#4ce8e9',emit=1)
    for z in [-6,-2,2,6]:w.place(PROPS['hvac_unit'],x,z,.8);w.place(PROPS['pipe'],x-.4,z)
for z in [-7.7,7.7]:w.B('rail',(0,.8,z),(16,.1,.1),'#70839a');w.B('neon',(0,.6,z),(15,.1,.08),'#e752d6',emit=1)
for x in range(-16,17,4):
    h=R.uniform(7,15);w.B('city_tower',(x,h/2,-20),(2.5,h,3),'#303b5a')
    for yy in np.arange(2,h,1):w.B('neon_windows',(x,yy,-18.48),(1.7,.16,.03),'#49d9e5' if x%8==0 else '#d64ebc',emit=1)

LOBBY=World('10_Cozy_Lobby')
LOBBY.B('floor',(0,-.2,0),(20,.4,15),'#a87850')
for z in np.arange(-7.2,7.3,.6):LOBBY.B('plank_seam',(0,.006,z),(20,.008,.015),'#976742')
LOBBY.B('back_wall',(0,1.8,-7.5),(20,3.6,.25),'#e4c9a0');LOBBY.B('front_low_wall',(0,.35,7.5),(20,.7,.25),'#b88963')
# Two walkable door openings in opposite side walls, at z=0.
for x in [-10,10]:
    for z in [-4.4,4.4]:LOBBY.B('side_wall',(x,1.8,z),(.25,3.6,6.2),'#e1c49a')
    LOBBY.B('door_lintel',(x,3.22,0),(.3,.76,2.7),'#d1a16e')
LOBBY.place(PROPS['wood_door'],-9.96,0,1,math.pi/2);LOBBY.place(PROPS['wood_door'],9.96,0,1,math.pi/2)
LOBBY.place(PROPS['fireplace'],0,-7,1.3)
for x in [-7,-4,4,7]:LOBBY.place(PROPS['bookshelf'],x,-7)
LOBBY.B('rug',(0,.02,0),(8,.025,5.5),'#a9534e');LOBBY.B('rug_inset',(0,.04,0),(7.6,.02,5.1),'#d6a465')
LOBBY.place(PROPS['sofa'],-4,2.3,1.25,-.25);LOBBY.place(PROPS['sofa'],4,2.3,1.25,.25)
LOBBY.place(PROPS['table'],0,2,1.1);LOBBY.place(PROPS['treasure_chest'],7,-4)
for x,z in [(-8,5),(8,5),(-8,-4),(8,-4)]:LOBBY.place(PROPS['potted_plant'],x,z,1.3)
for x in [-7,7]:LOBBY.place(PROPS['table'],x,4.8);LOBBY.place(PROPS['bench'],x,6)
for x in [-5,5]:
    LOBBY.B('window_frame',(x,2.1,-7.32),(2.2,1.7,.16),'#825e45');LOBBY.B('window_glass',(x,2.1,-7.21),(1.9,1.4,.08),'#8fc0c0');LOBBY.B('window_cross',(x,2.1,-7.12),(.07,1.4,.08),'#cfab77')
LOBBY.anchors={'SPAWN_LOBBY':[0,.1,5],'DOOR_SELECT_GAME_MODE':[-9,0,0],'DOOR_CREATE_ROOM':[9,0,0],'CAMERA_TOP':[0,22,12],'CAMERA_REVERSE':[0,22,-12]}
WORLDS.append(LOBBY)

# Landmark geometry and blank door signs, all part of the editable GLB scenes.
for x in [-9.72,9.72]:LOBBY.B('Blank_Door_Plaque',(x,3.12,0),(.08,.37,1.6),'#edcd8f')
for x in [-3.7,3.7]:LOBBY.B('rug_gold_border',(x,.06,0),(.07,.02,5),'#efce82')
for z in [-2.4,2.4]:LOBBY.B('rug_gold_border',(0,.06,z),(7.4,.02,.07),'#efce82')
for idx in [1,3,5]:
    WORLDS[idx].S('Moon',(-9,11,-23),(2,2,2),'#d9f1fa')
WORLDS[2].S('Sun',(-12,7,-28),(3.3,3.3,3.3),'#ffcd78')
WORLDS[8].S('Neon_Moon',(-9,12,-30),(3,3,3),'#d85fc3')
WORLDS[0].B('cliff_waterfall',(-10,1.4,-7),(4,3,3),'#8a9c86');WORLDS[0].B('waterfall',(-10,1.5,-5.45),(2.8,3,.12),'#75d4e9',emit=.2)
WORLDS[3].B('ice_castle_cliff',(0,.7,-13),(10,1.4,4),'#7fa7c6');WORLDS[3].B('frozen_waterfall',(0,.7,-10.96),(5.5,1.7,.12),'#6dd8f2',emit=.2)
for k in range(4):
    vs=[];ff=[]
    for j in range(21):
        x=-18+j*1.8;y=12+math.sin(j*.6+k)*1.5;z=-27+k*1.3
        vs.extend([[x,y,z],[x,y+2+math.cos(j*.8),z]])
        if j:ff.extend([(2*j-2,2*j-1,2*j),(2*j-1,2*j+1,2*j)])
    SHAPES['aurora_'+str(k)]=mesh(vs,ff)
    WORLDS[3].add('aurora_curtain','aurora_'+str(k),(0,0,0),(1,1,1),['#4bd8bd','#55bcd2','#638bd1','#74d3a8'][k],emit=.6)
for i in range(12):
    a=i*math.tau/12;x=math.cos(a)*9;z=math.sin(a)*9
    WORLDS[1].S('firefly',(x,1.5+(i%3),z),(.045,.045,.045),'#a8f5ba')
for x,z in [(-12,0),(12,0),(-10,-16),(10,-16)]:
    for dx in [-2,0,2]:WORLDS[7].S('cloud',(x+dx,-3,z),(3,1.1,1.8),'#f3d7e7')
WORLDS[7].B('falling_water',(16,-4,-19.5),(1.1,9,.14),'#9bd7ef',emit=.2)

def main():
    manifest={'format':'glTF 2.0 binary','up_axis':'Y','units':'meters','style':'procedural low-poly PBR solid-color geometry','arenas':[],'props':[]}
    for name,w in PROPS.items():w.glb(ROOT/'props'/f'{name}.glb');manifest['props'].append(name+'.glb')
    for w in WORLDS:
        w.glb(ROOT/'scenes'/f'{w.name}.glb')
        lobby=w is LOBBY;manifest['arenas'].append({'file':w.name+'.glb','anchors':w.anchors,'parts':len(w.parts),'is_lobby':lobby})
        for i,yaw in enumerate([0,math.pi/2,math.pi,math.pi*1.5]):
            w.render(ROOT/'previews'/f'{w.name}_view_{i+1}.png',yaw=yaw,tilt=.8 if lobby else .56,extent=30 if lobby else 37,center=(0,1,-2),bg='#293441' if lobby else '#293d58')
    (ROOT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
    print('Exported',len(WORLDS),'scenes and',len(PROPS),'props')
if __name__=='__main__':main()
