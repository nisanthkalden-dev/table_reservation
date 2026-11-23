import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Html, OrbitControls, RoundedBox, useCursor } from '@react-three/drei';
import * as THREE from 'three';
import {
  ROOM,
  TABLES,
  footprint,
  seatPositions,
} from '../data/restaurantLayout';

const STATUS_COLOR = {
  available: '#45d488',
  booked: '#e0574b',
  selected: '#f4efe5',
};

const STATUS_TOP = {
  available: '#2d5c45',
  booked: '#4a2723',
  selected: '#a9a49a',
};

const TABLE_TOP = 0.74;

/* ------------------------------------------------------------------ */
/* Procedural materials & helper textures                              */
/* ------------------------------------------------------------------ */

function makeWoodTexture() {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#241a12';
  ctx.fillRect(0, 0, size, size);

  const tones = ['#33251a', '#3c2c20', '#37271c', '#423124', '#2e2218', '#38281d'];
  const plankH = 128;
  let seed = 7;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };

  for (let row = 0; row * plankH < size; row += 1) {
    const y = row * plankH;
    let x = -(row % 2) * 190;
    while (x < size) {
      const w = 260 + rnd() * 240;
      ctx.fillStyle = tones[Math.floor(rnd() * tones.length)];
      ctx.fillRect(x, y, w - 2, plankH - 2);

      ctx.save();
      ctx.globalAlpha = 0.16;
      for (let g = 0; g < 9; g += 1) {
        ctx.strokeStyle = rnd() > 0.5 ? '#0d0906' : '#513b28';
        ctx.lineWidth = 0.8 + rnd();
        const gy = y + 10 + rnd() * (plankH - 20);
        ctx.beginPath();
        ctx.moveTo(x + 4, gy);
        for (let px = x + 4; px < x + w - 4; px += 32) {
          ctx.lineTo(px, gy + Math.sin((px + x) * 0.011 + g) * 2.2 + (rnd() - 0.5) * 2);
        }
        ctx.stroke();
      }
      ctx.restore();

      ctx.fillStyle = 'rgba(0,0,0,.5)';
      ctx.fillRect(x + w - 2, y, 2, plankH);
      x += w;
    }
    ctx.fillStyle = 'rgba(0,0,0,.45)';
    ctx.fillRect(0, y + plankH - 2, size, 2);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4.5, 4.5);
  tex.anisotropy = 8;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeGlowTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 8, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,0.95)');
  g.addColorStop(0.42, 'rgba(255,255,255,0.34)');
  g.addColorStop(0.75, 'rgba(255,255,255,0.08)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* ------------------------------------------------------------------ */
/* Architecture                                                        */
/* ------------------------------------------------------------------ */

function Window({ side, z, width = 2.1, height = 1.8 }) {
  const x = side === 'left' ? -8.96 : 8.96;
  const rot = side === 'left' ? Math.PI / 2 : -Math.PI / 2;
  const frame = '#0b0908';
  return (
    <group position={[x, 1.55, z]} rotation={[0, rot, 0]}>
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial
          color="#202934"
          emissive="#2b3646"
          emissiveIntensity={0.85}
          roughness={0.18}
          metalness={0.45}
        />
      </mesh>
      {[-width / 2, width / 2].map((px) => (
        <mesh key={`v${px}`} position={[px, 0, 0.04]}>
          <boxGeometry args={[0.08, height + 0.16, 0.08]} />
          <meshStandardMaterial color={frame} roughness={0.7} metalness={0.3} />
        </mesh>
      ))}
      {[-height / 2, 0, height / 2].map((py) => (
        <mesh key={`h${py}`} position={[0, py, 0.04]}>
          <boxGeometry args={[width + 0.16, py === 0 ? 0.05 : 0.08, 0.08]} />
          <meshStandardMaterial color={frame} roughness={0.7} metalness={0.3} />
        </mesh>
      ))}
      {/* warm sheer curtain on one edge */}
      <mesh position={[-width / 2 + 0.26, 0, 0.06]}>
        <planeGeometry args={[0.42, height + 0.1]} />
        <meshStandardMaterial color="#2b2119" roughness={0.9} transparent opacity={0.75} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function WoodFloor({ texture }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[ROOM.width, ROOM.depth]} />
      <meshStandardMaterial map={texture} color="#e8d9c8" roughness={0.62} metalness={0.05} />
    </mesh>
  );
}

function RoomShell() {
  const wallMat = (
    <meshStandardMaterial color="#171310" roughness={0.94} metalness={0} />
  );
  return (
    <group>
      {/* back wall */}
      <mesh position={[0, ROOM.wallHeight / 2, -ROOM.depth / 2 - 0.05]} receiveShadow>
        <boxGeometry args={[ROOM.width + 0.2, ROOM.wallHeight, 0.14]} />
        {wallMat}
      </mesh>
      {/* side walls */}
      <mesh position={[-ROOM.width / 2 - 0.05, ROOM.wallHeight / 2, 0]} receiveShadow>
        <boxGeometry args={[0.14, ROOM.wallHeight, ROOM.depth + 0.2]} />
        {wallMat}
      </mesh>
      <mesh position={[ROOM.width / 2 + 0.05, ROOM.wallHeight / 2, 0]} receiveShadow>
        <boxGeometry args={[0.14, ROOM.wallHeight, ROOM.depth + 0.2]} />
        {wallMat}
      </mesh>

      {/* low wainscot line */}
      {[
        { pos: [0, 0.98, -ROOM.depth / 2 + 0.04], size: [ROOM.width, 0.05, 0.1] },
        { pos: [-ROOM.width / 2 + 0.04, 0.98, 0], size: [0.1, 0.05, ROOM.depth] },
        { pos: [ROOM.width / 2 - 0.04, 0.98, 0], size: [0.1, 0.05, ROOM.depth] },
      ].map((trim, i) => (
        <mesh key={i} position={trim.pos}>
          <boxGeometry args={trim.size} />
          <meshStandardMaterial color="#241c15" roughness={0.7} metalness={0.15} />
        </mesh>
      ))}

      {/* ceiling trim beams (frame the open doll-house view) */}
      <mesh position={[0, ROOM.wallHeight - 0.05, -ROOM.depth / 2 + 0.12]}>
        <boxGeometry args={[ROOM.width, 0.12, 0.24]} />
        <meshStandardMaterial color="#0e0c0a" roughness={0.8} />
      </mesh>
      <mesh position={[-ROOM.width / 2 + 0.12, ROOM.wallHeight - 0.05, 0]}>
        <boxGeometry args={[0.24, 0.12, ROOM.depth]} />
        <meshStandardMaterial color="#0e0c0a" roughness={0.8} />
      </mesh>
      <mesh position={[ROOM.width / 2 - 0.12, ROOM.wallHeight - 0.05, 0]}>
        <boxGeometry args={[0.24, 0.12, ROOM.depth]} />
        <meshStandardMaterial color="#0e0c0a" roughness={0.8} />
      </mesh>

      {/* windows */}
      {[-3.9, 0.8, 4.4].map((z) => (
        <Window key={`lw-${z}`} side="left" z={z} />
      ))}
      {[-2.6, 2.4].map((z) => (
        <Window key={`rw-${z}`} side="right" z={z} width={1.7} height={1.6} />
      ))}

      {/* vertical oak slats behind the bar */}
      {Array.from({ length: 27 }).map((_, i) => (
        <mesh key={`slat-${i}`} position={[-8.35 + i * 0.22, 1.45, -6.4]}>
          <boxGeometry args={[0.09, 2.55, 0.09]} />
          <meshStandardMaterial color="#231a13" roughness={0.72} metalness={0.1} />
        </mesh>
      ))}

      {/* entrance posts + mat */}
      {[-0.5, 3.7].map((x) => (
        <mesh key={`post-${x}`} position={[x, 1.32, 6.28]} castShadow>
          <boxGeometry args={[0.16, 2.64, 0.16]} />
          <meshStandardMaterial color="#1c1510" roughness={0.6} metalness={0.25} />
        </mesh>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[1.6, 0.014, 5.86]}>
        <planeGeometry args={[2.6, 1.05]} />
        <meshStandardMaterial color="#14100d" roughness={0.95} />
      </mesh>
      {[-0.2, 3.4].map((x) => (
        <mesh key={`matlight-${x}`} position={[x, 0.05, 5.55]}>
          <sphereGeometry args={[0.045, 10, 10]} />
          <meshBasicMaterial color="#e7b071" />
        </mesh>
      ))}
    </group>
  );
}

function Bar() {
  const bottles = useMemo(() => {
    let seed = 21;
    const rnd = () => {
      seed = (seed * 48271) % 2147483647;
      return seed / 2147483647;
    };
    const colors = ['#b9823a', '#7d9a5b', '#8c4b3a', '#c9a05a', '#5c7a7c'];
    const out = [];
    [1.62, 2.06].forEach((shelfY) => {
      for (let i = 0; i < 13; i += 1) {
        const h = 0.24 + rnd() * 0.12;
        out.push({
          x: -2.5 + i * 0.42 + rnd() * 0.06,
          y: shelfY + 0.025 + h / 2,
          z: -0.58,
          h,
          r: 0.038 + rnd() * 0.012,
          color: colors[Math.floor(rnd() * colors.length)],
          key: `${shelfY}-${i}`,
        });
      }
    });
    return out;
  }, []);

  return (
    <group position={[-5.45, 0, -5.72]}>
      <RoundedBox args={[5.7, 1.0, 0.8]} radius={0.05} smoothness={2} position={[0, 0.5, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#241a13" roughness={0.55} metalness={0.18} />
      </RoundedBox>
      <mesh position={[0, 1.05, 0]} castShadow>
        <boxGeometry args={[5.95, 0.07, 0.96]} />
        <meshStandardMaterial color="#4a3524" roughness={0.32} metalness={0.15} />
      </mesh>
      {/* brass foot rail */}
      <mesh position={[0, 0.22, 0.58]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.025, 0.025, 5.4, 10]} />
        <meshStandardMaterial color="#9a7434" roughness={0.28} metalness={0.9} />
      </mesh>
      {/* back shelves */}
      {[1.62, 2.06].map((y) => (
        <mesh key={y} position={[0.05, y, -0.55]}>
          <boxGeometry args={[5.3, 0.05, 0.28]} />
          <meshStandardMaterial color="#171310" roughness={0.6} metalness={0.2} />
        </mesh>
      ))}
      {bottles.map((b) => (
        <mesh key={b.key} position={[b.x, b.y + b.h / 2, b.z]} castShadow>
          <cylinderGeometry args={[b.r, b.r * 0.92, b.h, 8]} />
          <meshStandardMaterial
            color={b.color}
            roughness={0.25}
            metalness={0.15}
            emissive={b.color}
            emissiveIntensity={0.12}
          />
        </mesh>
      ))}
      {/* stools */}
      {[-2.3, -1.2, -0.1, 1.0, 2.1].map((x) => (
        <group key={`stool-${x}`} position={[x, 0, 0.82]}>
          <mesh position={[0, 0.72, 0]} castShadow>
            <cylinderGeometry args={[0.25, 0.25, 0.09, 18]} />
            <meshStandardMaterial color="#2a221c" roughness={0.85} />
          </mesh>
          <mesh position={[0, 0.38, 0]} castShadow>
            <cylinderGeometry args={[0.035, 0.035, 0.68, 8]} />
            <meshStandardMaterial color="#3b3128" metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.03, 0]}>
            <cylinderGeometry args={[0.19, 0.21, 0.04, 16]} />
            <meshStandardMaterial color="#2b241d" metalness={0.5} roughness={0.4} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function KitchenPass() {
  return (
    <group position={[4.95, 0, -5.8]}>
      <RoundedBox args={[6.8, 1.0, 0.9]} radius={0.04} smoothness={2} position={[0, 0.5, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#21201e" roughness={0.6} metalness={0.25} />
      </RoundedBox>
      <mesh position={[0, 1.04, 0.02]} castShadow>
        <boxGeometry args={[7.0, 0.07, 1.04]} />
        <meshStandardMaterial color="#5a554e" roughness={0.28} metalness={0.7} />
      </mesh>
      {/* tiled kitchen wall */}
      <mesh position={[0, 1.75, -0.45]}>
        <planeGeometry args={[6.9, 1.3]} />
        <meshStandardMaterial color="#1b1a18" roughness={0.5} metalness={0.25} />
      </mesh>
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={`tile-${i}`} position={[-3.15 + i * 0.9, 1.75, -0.44]}>
          <boxGeometry args={[0.012, 1.3, 0.01]} />
          <meshStandardMaterial color="#302d28" roughness={0.5} />
        </mesh>
      ))}
      {/* pass hood */}
      <mesh position={[0, 2.45, -0.2]} castShadow>
        <boxGeometry args={[6.5, 0.32, 0.95]} />
        <meshStandardMaterial color="#151311" roughness={0.55} metalness={0.55} />
      </mesh>
      {/* heat lamps */}
      {[-2.1, 0, 2.1].map((x) => (
        <group key={`lamp-${x}`} position={[x, 0, 0]}>
          <mesh position={[0, 2.12, 0]}>
            <coneGeometry args={[0.2, 0.2, 18, 1, true]} />
            <meshStandardMaterial color="#24201b" metalness={0.7} roughness={0.3} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 2.02, 0]}>
            <sphereGeometry args={[0.055, 12, 12]} />
            <meshBasicMaterial color="#ffb168" />
          </mesh>
        </group>
      ))}
      {/* pots & pans silhouettes */}
      {[-2.6, -1.4, 1.5, 2.7].map((x, i) => (
        <mesh key={`pot-${x}`} position={[x, 1.15, 0.1]} castShadow>
          <cylinderGeometry args={[0.16 + (i % 2) * 0.04, 0.15, 0.12, 14]} />
          <meshStandardMaterial color="#3a3835" roughness={0.35} metalness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

function Reception() {
  return (
    <group position={[7.4, 0, 5.62]} rotation={[0, -0.32, 0]}>
      <RoundedBox args={[1.55, 1.0, 0.66]} radius={0.05} smoothness={2} position={[0, 0.5, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#1f1914" roughness={0.55} metalness={0.2} />
      </RoundedBox>
      <mesh position={[0, 1.04, 0]} castShadow>
        <boxGeometry args={[1.68, 0.06, 0.8]} />
        <meshStandardMaterial color="#4a3524" roughness={0.3} metalness={0.2} />
      </mesh>
      {/* little host lamp */}
      <mesh position={[0.5, 1.22, 0]}>
        <cylinderGeometry args={[0.03, 0.05, 0.24, 10]} />
        <meshStandardMaterial color="#8f6f36" metalness={0.9} roughness={0.25} />
      </mesh>
      <mesh position={[0.5, 1.38, 0]}>
        <sphereGeometry args={[0.09, 14, 14]} />
        <meshStandardMaterial color="#f2c98a" emissive="#ffb765" emissiveIntensity={1.6} roughness={0.4} />
      </mesh>
      <mesh position={[0.5, 1.3, 0]}>
        <pointLight color="#ffb877" intensity={3.2} distance={3.2} decay={2} />
      </mesh>
    </group>
  );
}

function Armchair({ position, rotation = 0, color = '#2b241e' }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <RoundedBox args={[0.78, 0.24, 0.8]} radius={0.07} smoothness={2} position={[0, 0.36, 0]} castShadow>
        <meshStandardMaterial color={color} roughness={0.9} />
      </RoundedBox>
      <RoundedBox args={[0.78, 0.55, 0.16]} radius={0.06} smoothness={2} position={[0, 0.66, -0.33]} castShadow>
        <meshStandardMaterial color={color} roughness={0.9} />
      </RoundedBox>
      {[-0.32, 0.32].map((x) => (
        <RoundedBox key={x} args={[0.12, 0.3, 0.72]} radius={0.04} smoothness={2} position={[x, 0.5, 0]} castShadow>
          <meshStandardMaterial color={color} roughness={0.9} />
        </RoundedBox>
      ))}
      {[[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]].map(([x, z]) => (
        <mesh key={`${x}-${z}`} position={[x, 0.13, z]}>
          <cylinderGeometry args={[0.022, 0.018, 0.26, 8]} />
          <meshStandardMaterial color="#151210" metalness={0.6} roughness={0.35} />
        </mesh>
      ))}
    </group>
  );
}

function Lounge() {
  return (
    <group>
      {/* rug */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[7.35, 0.009, 1.5]}>
        <planeGeometry args={[4.0, 5.2]} />
        <meshStandardMaterial color="#221a14" roughness={1} />
      </mesh>
      {/* sofa against the right wall, facing the room */}
      <group position={[8.25, 0, 1.4]} rotation={[0, -Math.PI / 2, 0]}>
        <RoundedBox args={[3.0, 0.34, 1.0]} radius={0.06} smoothness={2} position={[0, 0.34, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#2c241d" roughness={0.92} />
        </RoundedBox>
        <RoundedBox args={[3.0, 0.62, 0.2]} radius={0.06} smoothness={2} position={[0, 0.68, -0.42]} castShadow>
          <meshStandardMaterial color="#312820" roughness={0.92} />
        </RoundedBox>
        {[-0.82, 0, 0.82].map((x) => (
          <RoundedBox key={x} args={[0.75, 0.12, 0.84]} radius={0.05} smoothness={2} position={[x, 0.56, 0.03]} castShadow>
            <meshStandardMaterial color="#3a2f25" roughness={0.95} />
          </RoundedBox>
        ))}
        {[-1.42, 1.42].map((x) => (
          <RoundedBox key={`arm-${x}`} args={[0.16, 0.34, 0.98]} radius={0.05} smoothness={2} position={[x, 0.6, 0]} castShadow>
            <meshStandardMaterial color="#2c241d" roughness={0.92} />
          </RoundedBox>
        ))}
        {/* cushion */}
        <mesh position={[0.9, 0.64, -0.29]} rotation={[0.2, 0.2, 0.1]}>
          <boxGeometry args={[0.34, 0.34, 0.12]} />
          <meshStandardMaterial color="#8a6438" roughness={0.85} />
        </mesh>
      </group>

      {/* coffee table */}
      <group position={[6.85, 0, 1.45]}>
        <mesh position={[0, 0.4, 0]} castShadow>
          <cylinderGeometry args={[0.5, 0.5, 0.06, 32]} />
          <meshStandardMaterial color="#3b2b1d" roughness={0.35} metalness={0.1} />
        </mesh>
        <mesh position={[0, 0.2, 0]}>
          <cylinderGeometry args={[0.055, 0.055, 0.4, 12]} />
          <meshStandardMaterial color="#1b1611" metalness={0.6} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.02, 0]}>
          <cylinderGeometry args={[0.24, 0.26, 0.04, 20]} />
          <meshStandardMaterial color="#1b1611" metalness={0.6} roughness={0.4} />
        </mesh>
      </group>

      <Armchair position={[6.7, 0, -0.25]} rotation={Math.PI / 2 + 0.18} />
      <Armchair position={[6.7, 0, 3.15]} rotation={Math.PI / 2 - 0.18} />
    </group>
  );
}

function Plant({ position, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.17, 0.4, 16]} />
        <meshStandardMaterial color="#2a211a" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.42, 0]}>
        <cylinderGeometry args={[0.19, 0.19, 0.04, 16]} />
        <meshStandardMaterial color="#171310" roughness={1} />
      </mesh>
      {[
        [0, 0.92, 0, 0.26],
        [0.16, 0.78, 0.08, 0.2],
        [-0.14, 0.8, -0.1, 0.19],
        [0.04, 0.7, -0.18, 0.16],
        [-0.06, 0.72, 0.2, 0.15],
      ].map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]} castShadow>
          <icosahedronGeometry args={[r, 0]} />
          <meshStandardMaterial
            color={i % 2 ? '#2f4735' : '#38533d'}
            roughness={0.85}
            flatShading
          />
        </mesh>
      ))}
    </group>
  );
}

/*
 * Warm light pools only — no visible fixture geometry above the dining floor.
 * In a top-down seat map a hanging lamp would sit in front of the very table
 * it lights, so the fixtures are intentionally left out of the view.
 */
function Pendant({ x, z }) {
  return (
    <pointLight position={[x, 2.55, z]} color="#ffb877" intensity={11} distance={8} decay={2} />
  );
}

/* ------------------------------------------------------------------ */
/* Furniture                                                           */
/* ------------------------------------------------------------------ */

function Chair({ x, z, rotation }) {
  return (
    <group position={[x, 0, z]} rotation={[0, rotation, 0]}>
      <RoundedBox args={[0.46, 0.07, 0.44]} radius={0.02} smoothness={2} position={[0, 0.46, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#251e18" roughness={0.92} />
      </RoundedBox>
      <RoundedBox args={[0.44, 0.48, 0.07]} radius={0.025} smoothness={2} position={[0, 0.7, -0.2]} castShadow>
        <meshStandardMaterial color="#1d1815" roughness={0.88} />
      </RoundedBox>
      {[[-0.19, -0.17], [0.19, -0.17], [-0.19, 0.17], [0.19, 0.17]].map(([lx, lz]) => (
        <mesh key={`${lx}-${lz}`} position={[lx, 0.22, lz]} castShadow>
          <cylinderGeometry args={[0.018, 0.016, 0.44, 7]} />
          <meshStandardMaterial color="#141110" metalness={0.45} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

function TableLegs({ table, y = TABLE_TOP, color = '#171310' }) {
  if (table.shape === 'round') {
    return (
      <group>
        <mesh position={[0, 0.36, 0]} castShadow>
          <cylinderGeometry args={[0.07, 0.08, 0.68, 12]} />
          <meshStandardMaterial color={color} metalness={0.55} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.03, 0]} castShadow>
          <cylinderGeometry args={[0.3, 0.33, 0.05, 24]} />
          <meshStandardMaterial color={color} metalness={0.55} roughness={0.38} />
        </mesh>
      </group>
    );
  }
  const lx = table.w / 2 - 0.13;
  const lz = table.d / 2 - 0.1;
  return (
    <group>
      {[[-lx, -lz], [lx, -lz], [-lx, lz], [lx, lz]].map(([x, z]) => (
        <mesh key={`${x}-${z}`} position={[x, (y - 0.04) / 2, z]} castShadow>
          <cylinderGeometry args={[0.035, 0.028, y - 0.04, 8]} />
          <meshStandardMaterial color={color} metalness={0.5} roughness={0.4} />
        </mesh>
      ))}
      <mesh position={[0, 0.12, 0]}>
        <boxGeometry args={[table.w - 0.34, 0.05, table.d - 0.3]} />
        <meshStandardMaterial color="#15110e" roughness={0.7} />
      </mesh>
    </group>
  );
}

function DiningTable({
  table,
  status,
  selected,
  index,
  glowTexture,
  onSelect,
  onHover,
  onHoverEnd,
  onBooked,
}) {
  const body = useRef();
  const group = useRef();
  const [hovered, setHovered] = useState(false);
  const introStart = useRef(null);

  const state = selected ? 'selected' : status;
  const accent = STATUS_COLOR[state];
  const actionable = status === 'available';
  useCursor(hovered, actionable ? 'pointer' : 'not-allowed');

  const chairs = useMemo(() => seatPositions(table), [table]);
  const fp = footprint(table);

  useEffect(() => {
    introStart.current = performance.now() + index * 45;
  }, [index]);

  useFrame((scene, dt) => {
    if (!group.current) return;
    let introOffset = 0;
    let introScale = 1;
    if (introStart.current != null) {
      const p = Math.min(1, Math.max(0, (performance.now() - introStart.current) / 700));
      const eased = 1 - Math.pow(1 - p, 3);
      introOffset = (1 - eased) * -0.5;
      introScale = 0.9 + 0.1 * eased;
    }
    const lift = selected ? 0.24 : hovered ? 0.06 : 0;
    group.current.position.y = THREE.MathUtils.damp(group.current.position.y, lift + introOffset, 10, dt);
    const s = THREE.MathUtils.damp(group.current.scale.x, introScale, 10, dt);
    group.current.scale.setScalar(s);

    if (body.current) {
      const t = scene.clock.elapsedTime;
      const idle = state === 'booked' ? 0.14 : 0.22;
      const target = selected ? 0.5 + Math.sin(t * 2.2) * 0.12 : hovered ? 0.38 : idle;
      body.current.material.opacity = THREE.MathUtils.damp(body.current.material.opacity, target, 6, dt);
      const pulse = selected ? 1 + Math.sin(t * 2.2) * 0.03 : 1;
      body.current.scale.setScalar(pulse);
    }
  });

  const topColor = STATUS_TOP[state];

  return (
    <group position={[table.x, 0, table.z]} rotation={[0, table.rot || 0, 0]}>
      {/* floor glow */}
      <mesh
        ref={body}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.042, 0]}
        scale={[1, 1, 1]}
      >
        <planeGeometry args={[(fp + 0.55) * 2, (fp + 0.55) * 2]} />
        <meshBasicMaterial
          map={glowTexture}
          color={accent}
          transparent
          opacity={0.24}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* crisp status ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <ringGeometry args={[fp + 0.2, fp + 0.235, 56]} />
        <meshBasicMaterial
          color={accent}
          transparent
          opacity={selected ? 0.95 : status === 'available' ? 0.6 : 0.25}
          depthWrite={false}
        />
      </mesh>

      {/* bright outer halo on the selected table */}
      {selected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.052, 0]}>
          <ringGeometry args={[fp + 0.28, fp + 0.3, 64]} />
          <meshBasicMaterial color="#fffdf7" transparent opacity={0.5} depthWrite={false} />
        </mesh>
      )}

      {/* hit target */}
      <mesh
        position={[0, 0.52, 0]}
        visible={true}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          onHover?.(table.id, e.nativeEvent?.clientX ?? 0, e.nativeEvent?.clientY ?? 0);
        }}
        onPointerOut={() => {
          setHovered(false);
          onHoverEnd?.();
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (actionable) {
            onSelect(table.id);
          } else if (status === 'booked') {
            onBooked?.(table.id, e.nativeEvent?.clientX ?? 0, e.nativeEvent?.clientY ?? 0);
          }
        }}
      >
        {table.shape === 'round' ? (
          <cylinderGeometry args={[fp + 0.14, fp + 0.14, 1.0, 20]} />
        ) : (
          <boxGeometry args={[table.w + 0.2, 1.0, table.d + 0.2]} />
        )}
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <group ref={group}>
        {/* table top */}
        {table.shape === 'round' ? (
          <mesh position={[0, TABLE_TOP, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[table.radius, table.radius, 0.075, 40]} />
            <meshStandardMaterial color={topColor} roughness={0.42} metalness={0.12} />
          </mesh>
        ) : (
          <RoundedBox
            args={[table.w, 0.08, table.d]}
            radius={0.05}
            smoothness={3}
            position={[0, TABLE_TOP, 0]}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial color={topColor} roughness={0.4} metalness={0.12} />
          </RoundedBox>
        )}

        {/* brass inlay ring on round tables */}
        {table.shape === 'round' && (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, TABLE_TOP + 0.04, 0]}>
            <ringGeometry args={[table.radius - 0.1, table.radius - 0.075, 40]} />
            <meshStandardMaterial color="#8a6a33" roughness={0.3} metalness={0.9} />
          </mesh>
        )}

        <TableLegs table={table} />

        {/* candle */}
        <group position={[0, TABLE_TOP + 0.04, 0]}>
          <mesh position={[0, 0.05, 0]}>
            <cylinderGeometry args={[0.085, 0.1, 0.02, 14]} />
            <meshStandardMaterial color="#6d5127" metalness={0.85} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.12, 0]}>
            <cylinderGeometry args={[0.022, 0.026, 0.13, 8]} />
            <meshStandardMaterial color="#e8ddc8" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.2, 0]}>
            <sphereGeometry args={[0.014, 8, 8]} />
            <meshBasicMaterial color="#ffc27a" />
          </mesh>
        </group>

        {chairs.map((seat, i) => (
          <Chair key={i} x={seat.x} z={seat.z} rotation={seat.rot} />
        ))}

        <Html position={[0, 1.42, 0]} center zIndexRange={[24, 0]} style={{ pointerEvents: 'none' }}>
          <div className={`rsv-tag is-${state}`} style={{ '--tag': accent }}>
            <span className="rsv-tag-dot" />
            {table.id}
            {selected && <em>Selected</em>}
          </div>
        </Html>

      </group>

      {selected && (
        <pointLight position={[0, 2.1, 0]} color="#fff1d6" intensity={4.5} distance={3.6} decay={2} />
      )}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Camera                                                              */
/* ------------------------------------------------------------------ */

const HOME_TARGET = new THREE.Vector3(0, 0.15, 0);
const HOME_ELEVATION = 1.45; // screen height / depth of the default isometric view

function CameraRig({ resetKey }) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const controls = useThree((s) => s.controls);
  const flying = useRef(true);

  const goal = useMemo(() => {
    // Pull back on portrait viewports so the full 18 m room always fits.
    const aspect = Math.max(0.5, size.width / Math.max(size.height, 1));
    const fit = Math.min(2.15, Math.max(1, 1.62 / aspect));
    return {
      pos: new THREE.Vector3(0, 14.2 * fit, (14.2 / HOME_ELEVATION) * fit),
      look: HOME_TARGET.clone(),
    };
  }, [size.width, size.height]);

  useEffect(() => {
    flying.current = true;
  }, [goal, resetKey]);

  useEffect(() => {
    if (!controls) return undefined;
    const stop = () => {
      flying.current = false;
    };
    controls.addEventListener('start', stop);
    return () => controls.removeEventListener('start', stop);
  }, [controls]);

  useFrame((_, dt) => {
    if (!controls || !flying.current) return;
    const k = 1 - Math.exp(-3.4 * dt);
    camera.position.lerp(goal.pos, k);
    controls.target.lerp(goal.look, k);
    controls.update();
    if (camera.position.distanceTo(goal.pos) < 0.06) flying.current = false;
  });

  return null;
}

/* ------------------------------------------------------------------ */
/* Scene                                                               */
/* ------------------------------------------------------------------ */

function Scene({
  availability,
  selectedId,
  onSelectTable,
  onHoverTable,
  onHoverEnd,
  onBookedTable,
  resetKey,
}) {
  const wood = useMemo(makeWoodTexture, []);
  const glow = useMemo(makeGlowTexture, []);

  return (
    <>
      <color attach="background" args={['#090807']} />

      <ambientLight intensity={0.5} color="#6b5844" />
      <hemisphereLight args={['#7b6450', '#0a0705', 0.9]} />
      <directionalLight
        position={[7.5, 12, 6]}
        intensity={2.6}
        color="#ffd7ad"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0004}
        shadow-camera-left={-14}
        shadow-camera-right={14}
        shadow-camera-top={13}
        shadow-camera-bottom={-13}
        shadow-camera-near={0.5}
        shadow-camera-far={45}
      />
      <directionalLight position={[-9, 6, 9]} intensity={0.45} color="#9db4d6" />

      <WoodFloor texture={wood} />
      <RoomShell />
      <Bar />
      <KitchenPass />
      <Reception />
      <Lounge />
      <Plant position={[-8.25, 0, 4.9]} scale={1.05} />
      <Plant position={[-8.3, 0, -5.15]} scale={0.9} />
      <Plant position={[8.3, 0, -4.9]} scale={1.15} />
      <Plant position={[-8.2, 0, 5.55]} scale={0.95} />

      {[
        [-6.9, -2.4],
        [-3.5, -2.4],
        [0.2, -2.4],
        [-5.2, 2.9],
        [-1.6, 2.9],
        [2.6, 2.9],
      ].map(([x, z]) => (
        <Pendant key={`${x}-${z}`} x={x} z={z} />
      ))}

      {TABLES.map((table, i) => (
        <DiningTable
          key={table.id}
          table={table}
          index={i}
          status={availability[table.id] ?? 'available'}
          selected={selectedId === table.id}
          glowTexture={glow}
          onSelect={onSelectTable}
          onHover={onHoverTable}
          onHoverEnd={onHoverEnd}
          onBooked={onBookedTable}
        />
      ))}

      <ContactShadows
        position={[0, 0.018, 0]}
        opacity={0.6}
        scale={[20, 15]}
        resolution={512}
        blur={2.6}
        far={5}
        color="#000000"
      />

      <OrbitControls
        makeDefault
        enablePan
        screenSpacePanning
        panSpeed={0.75}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.55}
        zoomSpeed={0.85}
        minDistance={6}
        maxDistance={46}
        minPolarAngle={0.12}
        maxPolarAngle={1.34}
        touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }}
        target={HOME_TARGET}
      />
      <CameraRig resetKey={resetKey} />
    </>
  );
}

export default function RestaurantScene({ onMiss, ...props }) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.8]}
      gl={{ antialias: true, alpha: false }}
      camera={{ position: [0, 14.2, 9.8], fov: 38, near: 0.1, far: 120 }}
      onPointerMissed={onMiss}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.12;
        gl.shadowMap.type = THREE.PCFSoftShadowMap;
      }}
    >        <Scene {...props} />
    </Canvas>
  );
}
