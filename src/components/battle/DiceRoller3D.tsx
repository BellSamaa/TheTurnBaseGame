'use client';
import {tx} from '@/lib/uiLocale';

import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

interface DiceRoller3DProps {
  diceType: 'd20' | 'd6';
  isRolling: boolean;
  targetValue: number | null;
  onRollComplete?: () => void;
  label?: string;
}

export default function DiceRoller3D({
  diceType,
  isRolling,
  targetValue,
  onRollComplete,
  label = 'D20',
}: DiceRoller3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [displayedNumber, setDisplayedNumber] = useState<number | null>(null);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const diceMeshRef = useRef<THREE.Group | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  const rollingStateRef = useRef({
    isRolling: false,
    rollTime: 0,
    maxTime: 1.8,
    rotSpeedX: 0,
    rotSpeedY: 0,
    rotSpeedZ: 0,
  });

  // Setup Three.js Scene
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 200;
    const height = container.clientHeight || 200;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 5);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffd700, 2.5);
    dirLight1.position.set(5, 8, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x00e5ff, 1.8);
    dirLight2.position.set(-5, -5, 4);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0xffffff, 2, 10);
    pointLight.position.set(0, 0, 3);
    scene.add(pointLight);

    // Load GLB Model
    const loader = new GLTFLoader();
    const modelPath =
      diceType === 'd20'
        ? '/assets/models/dice_d20.glb'
        : '/assets/models/dice_d6.glb';

    loader.load(
      modelPath,
      (gltf) => {
        const root = gltf.scene;

        // Auto-fit & scale
        const box = new THREE.Box3().setFromObject(root);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const targetScale = (diceType === 'd20' ? 2.4 : 2.0) / maxDim;

        root.scale.setScalar(targetScale);
        root.position.sub(center.multiplyScalar(targetScale));

        // Enhance materials
        root.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            if (mesh.material) {
              const mat = mesh.material as THREE.MeshStandardMaterial;
              mat.roughness = 0.25;
              mat.metalness = 0.4;
            }
          }
        });

        const diceGroup = new THREE.Group();
        diceGroup.add(root);
        scene.add(diceGroup);
        diceMeshRef.current = diceGroup;
        setModelLoaded(true);
      },
      undefined,
      (err) => {
        // Fallback procedural dice geometry if GLB loading fails
        const geom =
          diceType === 'd20'
            ? new THREE.IcosahedronGeometry(1.2, 0)
            : new THREE.BoxGeometry(1.5, 1.5, 1.5);
        const mat = new THREE.MeshStandardMaterial({
          color: diceType === 'd20' ? 0xffb703 : 0x00b4d8,
          roughness: 0.2,
          metalness: 0.3,
          wireframe: false,
        });
        const mesh = new THREE.Mesh(geom, mat);
        const group = new THREE.Group();
        group.add(mesh);
        scene.add(group);
        diceMeshRef.current = group;
        setModelLoaded(true);
      }
    );

    // Render loop
    let lastTime = performance.now();
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      const now = performance.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      if (diceMeshRef.current) {
        const state = rollingStateRef.current;

        if (state.isRolling) {
          state.rollTime += delta;
          const progress = Math.min(1, state.rollTime / state.maxTime);
          const speedMultiplier = Math.pow(1 - progress, 1.2);

          diceMeshRef.current.rotation.x += state.rotSpeedX * speedMultiplier * delta;
          diceMeshRef.current.rotation.y += state.rotSpeedY * speedMultiplier * delta;
          diceMeshRef.current.rotation.z += state.rotSpeedZ * speedMultiplier * delta;

          // Slight bouncing hop while rolling
          const bounce = Math.sin(progress * Math.PI * 4) * (1 - progress) * 0.4;
          diceMeshRef.current.position.y = bounce;

          if (progress >= 1) {
            state.isRolling = false;
            diceMeshRef.current.position.y = 0;
            if (onRollComplete) onRollComplete();
          }
        } else {
          // Idle gentle hover rotation
          diceMeshRef.current.rotation.y += 0.015;
          diceMeshRef.current.rotation.x = Math.sin(now * 0.001) * 0.15;
        }
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();

    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth || 200;
      const h = containerRef.current.clientHeight || 200;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current) resizeObserver.observe(containerRef.current);
    window.addEventListener('resize', handleResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      if (rendererRef.current?.domElement && container) {
        container.innerHTML = '';
      }
    };
  }, [diceType]);

  // Trigger Rolling Animation
  useEffect(() => {
    if (isRolling) {
      rollingStateRef.current = {
        isRolling: true,
        rollTime: 0,
        maxTime: 1.8,
        rotSpeedX: 18 + Math.random() * 12,
        rotSpeedY: 22 + Math.random() * 14,
        rotSpeedZ: 14 + Math.random() * 10,
      };
      setDisplayedNumber(null);
    } else {
      setDisplayedNumber(targetValue);
    }
  }, [isRolling, targetValue]);

  return (
    <div className="relative flex flex-col items-center justify-center">
      {/* 3D Canvas Box */}
      <div
        ref={containerRef}
        className={`
          relative w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center
          ${isRolling ? 'animate-dice-shake' : ''}
        `}
      />

      {/* Result Badge */}
      <div className="mt-1 flex flex-col items-center">
        <span className="text-[9px] font-pixel text-slate-400 uppercase tracking-widest">
          {label}
        </span>

        {isRolling ? (
          <span className="text-xs font-pixel text-yellow-400 animate-pulse mt-0.5">{tx("ĐANG TUNG...")}</span>
        ) : displayedNumber !== null ? (
          <div className="mt-0.5 px-3 py-1 bg-yellow-500 text-black font-pixel text-sm sm:text-base font-bold shadow-[0_0_15px_rgba(234,179,8,0.9)] border border-yellow-200">
            {displayedNumber}
          </div>
        ) : (
          <span className="text-[9px] font-pixel text-slate-500 mt-0.5">{tx("SẴN SÀNG")}</span>
        )}
      </div>
    </div>
  );
}
