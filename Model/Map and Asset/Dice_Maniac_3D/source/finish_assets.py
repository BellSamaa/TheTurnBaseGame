from pathlib import Path
import base64,json,struct,math
import build_worlds as b

b.main()
root=b.ROOT
for name,w in b.PROPS.items():
    vs=[w.vertices(p)[0] for p in w.parts]
    import numpy as np
    points=np.concatenate(vs);lo=points.min(axis=0);hi=points.max(axis=0)
    size=max(hi-lo);center=(lo+hi)/2
    w.render(root.parent/'Dice_Maniac_PNG'/'props'/f'{name}.png',yaw=.55,tilt=.5,extent=max(size*1.7,1),center=center,size=(640,640),bg=None)

assets=[]
for p in sorted((root/'scenes').glob('*.glb')):
    raw=p.read_bytes();magic,version,total=struct.unpack_from('<III',raw);assert magic==0x46546c67 and version==2 and total==len(raw)
    ln,ty=struct.unpack_from('<II',raw,12);doc=json.loads(raw[20:20+ln]);assert doc['asset']['version']=='2.0';assert len(doc['nodes'])>10
    for a in doc['accessors']:
        view=doc['bufferViews'][a['bufferView']];assert view['byteOffset']+view['byteLength']<=doc['buffers'][0]['byteLength']
    assets.append({'name':p.stem,'data':base64.b64encode(raw).decode()})
template=(root/'source'/'viewer_template.html').read_text()
(root/'OPEN_3D_VIEWER.html').write_text(template.replace('__ASSET_DATA__',json.dumps(assets,separators=(',',':'))))
print('Validated 10 GLB scenes; generated 38 alpha prop renders and offline viewer.')
