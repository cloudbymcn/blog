import { useState } from 'react'
import * as THREE from 'three'
import { useThreeScene } from './useThreeScene'

const vertexShader = /* glsl */ `
  void main() {
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

/**
 * Sombras de folhagem numa parede ensolarada: 3 camadas de fbm (perto = nítida e escura, longe = suave
 * e clara), balanço de vento lento (0,045–0,07 Hz) + warp orgânico, nuvem que passa e amacia a luz,
 * grão de filme leve. O ponteiro empurra as folhas (vento local). Luz quente #fff8ec, sombra #eef1f5.
 */
const fragmentShader = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform vec2 uRes;
  uniform float uDpr;
  uniform vec2 uPtr;
  uniform vec2 uWind;
  uniform float uIntro;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float a = 0.5;
    float s = 0.0;
    mat2 r = mat2(0.8, 0.6, -0.6, 0.8);
    for (int i = 0; i < 4; i++) {
      s += a * noise(p);
      p = r * p * 2.03 + 11.7;
      a *= 0.5;
    }
    return s;
  }

  // 1 = folha (sombra). Cada camada balança com fase própria; galhos mais longe balançam menos.
  float canopy(vec2 p, float scale, float phase, float sway, float soft, float thr) {
    float t = uTime;
    vec2 q = p * scale + phase * 7.0;
    float s = sin(t * 0.44 + phase) * 0.6 + sin(t * 0.28 + phase * 1.7) * 0.4; // ~0,07 e ~0,045 Hz
    q += vec2(s, s * 0.35) * sway;
    q += vec2(fbm(q * 0.5 + t * 0.03), fbm(q * 0.5 - t * 0.025 + 3.1)) * 0.9;
    return smoothstep(thr - soft, thr + soft, fbm(q));
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / uRes;
    vec2 px = gl_FragCoord.xy / uDpr;

    // vento local do ponteiro: desloca o campo perto dele, na direção do movimento
    vec2 d = px - uPtr;
    float near = exp(-dot(d, d) / (140.0 * 140.0));
    vec2 p = (px - uWind * near) / 58.0;

    // nuvem passando de vez em quando: amacia bordas e baixa o contraste
    float cloud = smoothstep(0.62, 0.95, noise(vec2(uTime * 0.035, 4.2)));
    float soft = mix(3.5, 1.0, uIntro) * (1.0 + cloud * 1.2);

    float s1 = canopy(p, 1.7, 0.0, 0.3, 0.018 * soft, 0.54); // folhas perto da parede: nítidas
    float s2 = canopy(p + 5.3, 0.9, 2.1, 0.22, 0.05 * soft, 0.52);
    float s3 = canopy(p - 9.1, 0.35, 4.3, 0.12, 0.12 * soft, 0.47); // massa do galho, longe e suave
    float shadow = 1.0 - (1.0 - s1 * 0.95) * (1.0 - s2 * 0.6) * (1.0 - s3 * 0.35);
    shadow *= 1.0 - cloud * 0.45;

    // quente só nas frestas de luz cercadas de folha (sun-flecks); parede aberta fica branca
    float fleck = (1.0 - shadow) * smoothstep(0.2, 0.6, s3 + s2 * 0.5);
    vec3 warm = mix(vec3(1.0), vec3(1.0, 0.973, 0.925), fleck); // #fff8ec
    vec3 cool = vec3(0.933, 0.945, 0.961); // #eef1f5
    vec3 col = mix(warm, cool, shadow);
    col += (hash(gl_FragCoord.xy + fract(uTime) * 61.0) - 0.5) * 0.012;

    // some antes dos botões (topo) e antes do centro da tela (direita); base e esquerda com feather curto
    float m = 1.0 - smoothstep(0.15, 0.62, uv.y);
    m *= 1.0 - smoothstep(0.5, 0.97, uv.x);
    m *= smoothstep(0.0, 0.1, uv.y);
    m *= smoothstep(0.0, 0.05, uv.x);
    gl_FragColor = vec4(col, m * uIntro);
  }
`

/**
 * Dappled Light (SPEC §0-bis, reproduzido do React Bits Pro): luz do sol atravessando folhas e caindo
 * na parede, no vazio abaixo dos botões do hero (coluna esquerda). Canvas WebGL próprio, lazy pelo
 * ImmersiveSlot (só desktop, depois do load). Entra desfocado e foca (~1,6s); reduced-motion = frame parado.
 */
export default function HeroDappled() {
  const [reduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const ref = useThreeScene(
    ({ renderer, scene }) => {
      const uniforms = {
        uTime: { value: 0 },
        uRes: { value: new THREE.Vector2(1, 1) },
        uDpr: { value: renderer.getPixelRatio() },
        uPtr: { value: new THREE.Vector2(-9999, -9999) },
        uWind: { value: new THREE.Vector2() },
        uIntro: { value: reduced ? 1 : 0 },
      }
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 2),
        new THREE.ShaderMaterial({
          uniforms,
          vertexShader,
          fragmentShader,
          transparent: true,
          depthTest: false,
          depthWrite: false,
        }),
      )
      mesh.frustumCulled = false
      scene.add(mesh)

      const canvas = renderer.domElement
      const vel = new THREE.Vector2()
      let last = { x: 0, y: 0, t: 0 }
      const onMove = (e: PointerEvent) => {
        const r = canvas.getBoundingClientRect()
        const x = e.clientX - r.left
        const y = r.height - (e.clientY - r.top) // origem embaixo, como gl_FragCoord
        const dt = (e.timeStamp - last.t) / 1000
        if (dt > 0 && dt < 0.1) vel.set((x - last.x) / dt, (y - last.y) / dt)
        last = { x, y, t: e.timeStamp }
        uniforms.uPtr.value.set(x, y)
      }
      if (!reduced) window.addEventListener('pointermove', onMove, { passive: true })

      let start = -1
      return {
        update(t, dt) {
          renderer.getDrawingBufferSize(uniforms.uRes.value)
          // reduced-motion: frame fixo num instante bonito do balanço
          uniforms.uTime.value = reduced ? 12 : t
          if (reduced) return
          if (start < 0) start = t
          uniforms.uIntro.value = Math.min(1, (t - start) / 1.6)
          // vento local: segue a velocidade do ponteiro (limitada) e assenta devagar
          const k = 1 - Math.exp(-dt * 3)
          const target = vel.clone().clampLength(0, 900).multiplyScalar(0.06)
          uniforms.uWind.value.lerp(target, k)
          vel.multiplyScalar(Math.exp(-dt * 4))
        },
        dispose() {
          window.removeEventListener('pointermove', onMove)
        },
      }
    },
    { animate: !reduced, maxDpr: 1.25 },
  )

  return <div ref={ref} className="h-full w-full" />
}
