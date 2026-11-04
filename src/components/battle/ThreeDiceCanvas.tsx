'use client';

import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

interface ThreeDiceCanvasProps {
  diceType: 'd20' | 'd6' | 'd12';
  isRolling: boolean;
  value: number | null;
  theme?: 'red' | 'cyan' | 'gold' | 'purple';
  size?: number;
  className?: string;
}

// Module-level GLTF cache so we only load each GLB once
let d20SceneCache: THREE.Group | null = null;
let d6SceneCache: THREE.Group | null = null;
let loader: GLTFLoader | null = null;

function getLoader(): GLTFLoader {
  if (!loader) loader = new GLTFLoader();
  return loader;
}

export default function ThreeDiceCanvas({
  diceType,
  isRolling,
  value,
  theme = 'gold',
  size = 72,
  className = '',
}: ThreeDiceCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const diceGroupRef = useRef<THREE.Group | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Rotation speed and angle state
  const rollStateRef = useRef({
    isRolling: false,
    speedX: 0,
    speedY: 0,
    speedZ: 0,
    time: 0,
    maxTime: 1.0,
  });

  const themeColors = {
    red: { light: 0xff4d4d, ambient: 0x330000, emissive: 0x330000 },
    cyan: { light: 0x38bdf8, ambient: 0x002233, emissive: 0x002233 },
    gold: { light: 0xfacc15, ambient: 0x332200, emissive: 0x332200 },
    purple: { light: 0xc084fc, ambient: 0x220033, emissive: 0x220033 },
  }[theme];

  useEffect(() => {
    if (!containerRef.current || typeof window === 'undefined') return;
    const container = containerRef.current;

    // Scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0, 4.2);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(themeColors.light, 2.5);
    dirLight.position.set(3, 4, 3);
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 1.2);
    fillLight.position.set(-3, -2, 2);
    scene.add(fillLight);

    const group = new THREE.Group();
    scene.add(group);
    diceGroupRef.current = group;

    const setupMesh = (loadedScene: THREE.Group) => {
      const clone = loadedScene.clone(true);
      // Compute bounding box to normalize scale
      const box = new THREE.Box3().setFromObject(clone);
      const center = box.getCenter(new THREE.Vector3());
      const bboxSize = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(bboxSize.x, bboxSize.y, bboxSize.z) || 1;
      const targetScale = (diceType === 'd20' ? 2.3 : 1.9) / maxDim;

      clone.scale.setScalar(targetScale);
      clone.position.sub(center.clone().multiplyScalar(targetScale));

      // Tint materials based on theme
      clone.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          if (mesh.material) {
            const origMat = mesh.material as THREE.MeshStandardMaterial;
            mesh.material = origMat.clone();
            const mat = mesh.material as THREE.MeshStandardMaterial;
            mat.roughness = 0.3;
            mat.metalness = 0.35;
          }
        }
      });

      group.clear();
      group.add(clone);
      setLoaded(true);
    };

    if (diceType === 'd12') {
      // 3D Dodecahedron (12-sided Die)
      const geom = new THREE.DodecahedronGeometry(1.2, 0);
      const mat = new THREE.MeshStandardMaterial({
        color: themeColors.light,
        roughness: 0.25,
        metalness: 0.45,
        wireframe: false,
      });
      const d12Mesh = new THREE.Mesh(geom, mat);
      
      // Wireframe overlay for crisp edge definition
      const wireGeom = new THREE.EdgesGeometry(geom);
      const wireMat = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
      const wire = new THREE.LineSegments(wireGeom, wireMat);
      d12Mesh.add(wire);

      group.clear();
      group.add(d12Mesh);
      setLoaded(true);
    } else {
      const cached = diceType === 'd20' ? d20SceneCache : d6SceneCache;
      if (cached) {
        setupMesh(cached);
      } else {
        const gltfLoader = getLoader();
        const modelPath =
          diceType === 'd20'
            ? '/assets/models/dice_d20.glb'
            : '/assets/models/dice_d6.glb';

        gltfLoader.load(
          modelPath,
          (gltf) => {
            if (diceType === 'd20') d20SceneCache = gltf.scene;
            else d6SceneCache = gltf.scene;
            setupMesh(gltf.scene);
          },
          undefined,
          () => {
            // Fallback procedural geometry if GLB fails
            const geom =
              diceType === 'd20'
                ? new THREE.IcosahedronGeometry(1.2, 0)
                : new THREE.BoxGeometry(1.4, 1.4, 1.4);
            const mat = new THREE.MeshStandardMaterial({
              color: themeColors.light,
              roughness: 0.25,
              metalness: 0.4,
            });
            const fallbackMesh = new THREE.Mesh(geom, mat);
            group.clear();
            group.add(fallbackMesh);
            setLoaded(true);
          }
        );
      }
    }

    // Animation Loop
    let lastTime = performance.now();
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      const now = performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const state = rollStateRef.current;
      if (group) {
        if (state.isRolling) {
          state.time += delta;
          const progress = Math.min(1, state.time / state.maxTime);
          const decay = Math.pow(1 - progress, 1.3);

          group.rotation.x += state.speedX * decay * delta;
          group.rotation.y += state.speedY * decay * delta;
          group.rotation.z += state.speedZ * decay * delta;

          // Vertical hop
          group.position.y = Math.sin(progress * Math.PI * 3) * (1 - progress) * 0.35;

          if (progress >= 1) {
            state.isRolling = false;
            group.position.y = 0;
          }
        } else {
          // Gentle resting hover angle - stays at its landed orientation
          group.rotation.y += 0.005;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      try {
        renderer.forceContextLoss();
        renderer.dispose();
      } catch {
        // ignore
      }
      if (container) container.innerHTML = '';
    };
  }, [diceType, size, themeColors.light]);

  // Trigger Rolling animation when isRolling becomes true
  useEffect(() => {
    if (isRolling) {
      rollStateRef.current = {
        isRolling: true,
        time: 0,
        maxTime: 0.9,
        speedX: 20 + Math.random() * 15,
        speedY: 24 + Math.random() * 18,
        speedZ: 16 + Math.random() * 12,
      };
    }
  }, [isRolling]);

  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      {/* 3D WebGL Canvas */}
      <div ref={containerRef} className="absolute inset-0 flex items-center justify-center pointer-events-none" />

      {/* Floating Pixel Number Display overlaid on 3D die */}
      <div className="relative z-10 flex flex-col items-center justify-center pointer-events-none">
        <span
          className={`
            font-pixel font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]
            ${diceType === 'd20' ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'}
            ${
              theme === 'red'
                ? 'text-red-300'
                : theme === 'cyan'
                ? 'text-cyan-300'
                : 'text-yellow-300'
            }
          `}
          style={{
            textShadow:
              theme === 'red'
                ? '0 0 8px rgba(239,68,68,0.9), 1px 1px 0 #000'
                : theme === 'cyan'
                ? '0 0 8px rgba(56,189,248,0.9), 1px 1px 0 #000'
                : '0 0 8px rgba(250,204,21,0.9), 1px 1px 0 #000',
          }}
        >
          {value !== null && value > 0 ? value : '?'}
        </span>
      </div>
    </div>
  );
}
