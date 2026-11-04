'use client';
import {Suspense,useEffect,useMemo,useRef} from 'react';
import {Canvas,useThree} from '@react-three/fiber';
import {useGLTF} from '@react-three/drei';
import {worldSceneUrl} from '@/lib/worldAssets';
import * as THREE from 'three';

function Scene({mapId}:{mapId:string}){
  const gltf=useGLTF(worldSceneUrl(mapId));
  const scene=useMemo(()=>gltf.scene.clone(true),[gltf.scene]);
  return <primitive object={scene}/>;
}
function Camera({seat=0,top=false}:{seat?:number;top?:boolean}){
 const {camera}=useThree();
 useEffect(()=>{const angle=seat*Math.PI/2;
  camera.position.set(top?0:Math.sin(angle)*19,top?24:13,top?12:Math.cos(angle)*19);
  camera.lookAt(0,0,0);camera.updateProjectionMatrix();
 },[camera,seat,top]);return null;
}
export default function WorldScene({mapId,seat=0,top=false}:{mapId:string;seat?:number;top?:boolean}){
 return <div className="world-scene" aria-hidden="true"><Canvas dpr={[1,1.5]} camera={{fov:45,near:.1,far:150}} gl={{antialias:true,alpha:false}}>
  <color attach="background" args={[mapId==='lobby'?'#151b2c':'#203248']}/>
  <ambientLight intensity={1.7}/><hemisphereLight args={['#d5eaff','#625038',1.5]}/><directionalLight position={[6,15,8]} intensity={2.2}/>
  <Camera seat={seat} top={top}/><Suspense fallback={null}><Scene mapId={mapId}/></Suspense>
 </Canvas></div>;
}
