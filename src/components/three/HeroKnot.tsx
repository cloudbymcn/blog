import { useState } from 'react'
import * as THREE from 'three'
import { useThreeScene } from './useThreeScene'

/** Parâmetros do Photon Knot (React Bits Pro), com os nomes das props de lá. */
const K = {
  size: 0.72, // do contêiner
  ribbonWidth: 0.34,
  loop: 0.42,
  twists: 4, // meias-voltas ao longo da fita
  flowSpeed: 0.5,
  rotationSpeed: 0.5,
  tilt: 32, // graus
  depth: 0.6,
  parallax: 0.5,
  maxHeight: 360, // px da área do nó
  colors: ['#0071e3', '#9fb3cc'] as const, // tintas no fundo claro
}
const FOV = 30
const CAMERA_Z = 10
const SEGMENTS = 720
const ACROSS = 6
const INTERACTIVE = 'a, button, input, textarea, select, label, [role="button"]'

/** Trefoil como nó tórico (2,3): anel de raio 1 com laço `loop`; normalizado pra raio ~1. */
function knot(t: number, out: THREE.Vector3) {
  const a = t * Math.PI * 2
  const r = 1 + K.loop * Math.cos(3 * a)
  return out
    .set(r * Math.cos(2 * a), r * Math.sin(2 * a), K.loop * Math.sin(3 * a))
    .multiplyScalar(1 / (1 + K.loop))
}

/** Pontos, tangentes e normais por transporte paralelo (com a holonomia distribuída pra fechar o laço). */
function buildFrames(n: number) {
  const pts = Array.from({ length: n }, (_, i) => knot(i / n, new THREE.Vector3()))
  const tan = pts.map((_, i) =>
    pts[(i + 1) % n]
      .clone()
      .sub(pts[(i - 1 + n) % n])
      .normalize(),
  )
  const nor: THREE.Vector3[] = []
  let nv = new THREE.Vector3(0, 0, 1).cross(tan[0]).normalize()
  for (let i = 0; i < n; i++) {
    if (i > 0) {
      const q = new THREE.Quaternion().setFromUnitVectors(tan[i - 1], tan[i])
      nv = nv.clone().applyQuaternion(q)
      nv.sub(tan[i].clone().multiplyScalar(nv.dot(tan[i]))).normalize()
    }
    nor.push(nv)
  }
  // ângulo que sobra ao voltar no começo: espalha ao longo da fita
  const end = nor[n - 1]
    .clone()
    .applyQuaternion(new THREE.Quaternion().setFromUnitVectors(tan[n - 1], tan[0]))
  const b0 = tan[0].clone().cross(nor[0])
  const gap = Math.atan2(end.dot(b0), end.dot(nor[0]))
  return pts.map((p, i) => {
    const t = tan[i]
    const b = t.clone().cross(nor[i])
    const ang = (-gap * i) / n
    const nn = nor[i]
      .clone()
      .multiplyScalar(Math.cos(ang))
      .add(b.multiplyScalar(Math.sin(ang)))
    return { p, t, n: nn }
  })
}

function buildRibbon() {
  const frames = buildFrames(SEGMENTS)
  const rows = SEGMENTS + 1
  const count = rows * ACROSS
  const pos = new Float32Array(count * 3)
  const tan = new Float32Array(count * 3)
  const nor = new Float32Array(count * 3)
  const uv = new Float32Array(count * 2)
  for (let i = 0; i < rows; i++) {
    const f = frames[i % SEGMENTS]
    for (let j = 0; j < ACROSS; j++) {
      const k = i * ACROSS + j
      f.p.toArray(pos, k * 3)
      f.t.toArray(tan, k * 3)
      f.n.toArray(nor, k * 3)
      uv[k * 2] = i / SEGMENTS
      uv[k * 2 + 1] = (j / (ACROSS - 1)) * 2 - 1
    }
  }
  const index: number[] = []
  for (let i = 0; i < SEGMENTS; i++)
    for (let j = 0; j < ACROSS - 1; j++) {
      const a = i * ACROSS + j
      const b = a + ACROSS
      index.push(a, b, a + 1, b, b + 1, a + 1)
    }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setAttribute('aTan', new THREE.BufferAttribute(tan, 3))
  g.setAttribute('aNor', new THREE.BufferAttribute(nor, 3))
  g.setAttribute('aUv', new THREE.BufferAttribute(uv, 2))
  g.setIndex(index)
  return { geometry: g, centers: frames.map((f) => f.p) }
}

const vertexShader = /* glsl */ `
  attribute vec3 aTan;
  attribute vec3 aNor;
  attribute vec2 aUv;
  uniform float uTime;
  uniform float uWidth;
  uniform float uTwists;
  uniform float uFlow;
  uniform float uFlipU;
  uniform float uFlipT;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vView;
  varying float vDepth;

  void main() {
    float u = aUv.x;
    // torção que flui ao longo da fita + a "virada" do clique viajando a partir do ponto clicado
    float a = 3.14159 * uTwists * (u - uTime * uFlow * 0.04);
    float age = uTime - uFlipT;
    if (age >= 0.0 && age < 3.0) {
      float du = fract(u - uFlipU - age * 0.12 + 0.5) - 0.5;
      a += 3.14159 * exp(-age * 1.4) * exp(-du * du / 0.004);
    }
    vec3 b = cross(aTan, aNor);
    vec3 w = cos(a) * aNor + sin(a) * b;
    vec3 n = cross(aTan, w);
    vec3 p = position + w * (aUv.y * uWidth * 0.5);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vec4 c = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    vUv = aUv;
    vNormal = normalize(normalMatrix * n);
    vView = normalize(-mv.xyz);
    vDepth = clamp((mv.z - c.z) / length((modelMatrix * vec4(1.0, 0.0, 0.0, 0.0)).xyz), -1.0, 1.0);
    gl_Position = projectionMatrix * mv;
  }
`

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uFlow;
  uniform float uIntro;
  uniform float uDepthFade;
  uniform vec3 uInkA;
  uniform vec3 uInkB;
  uniform vec3 uLight;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vView;
  varying float vDepth;

  void main() {
    if (vUv.x > uIntro) discard; // intro: a fita se desenha ao longo do nó
    // tinta ao longo da fita, fluindo
    float k = 0.5 + 0.5 * sin(6.28318 * (vUv.x * 2.0 - uTime * uFlow * 0.05));
    vec3 ink = mix(uInkA, uInkB, k);
    vec3 n = normalize(vNormal) * (gl_FrontFacing ? 1.0 : -1.0);
    float facing = abs(dot(n, vView));
    float fold = pow(1.0 - facing, 3.0); // onde a fita fica de lado
    float edgeW = fwidth(vUv.y) * 1.4;
    float edge = smoothstep(1.0 - edgeW, 1.0, abs(vUv.y)); // linhas finas nas bordas
    vec3 h = normalize(uLight + vView);
    float sheen = pow(max(dot(n, h), 0.0), 28.0); // reflexo sedoso (o ponteiro move a luz)
    float depth = mix(1.0 - uDepthFade, 1.0, vDepth * 0.5 + 0.5); // lado de trás esmaece
    float alpha = 0.06 + fold * 0.28 + edge * 0.5 + sheen * 0.22;
    vec3 col = mix(ink, uInkA, sheen * 0.5);
    gl_FragColor = vec4(col, clamp(alpha * depth, 0.0, 0.8));
  }
`

const srgb = (hex: string) => {
  const c = parseInt(hex.slice(1), 16)
  return new THREE.Vector3(((c >> 16) & 255) / 255, ((c >> 8) & 255) / 255, (c & 255) / 255)
}

/**
 * Photon Knot (SPEC §0-bis, reproduzido do React Bits Pro) no vazio abaixo dos botões do hero: fita
 * translúcida amarrada num trefoil, girando devagar, em tintas suaves (#0071e3 → #9fb3cc) sobre o branco.
 * A torção e a cor fluem ao longo da fita; bordas finas, brilho nas dobras de lado, reflexo que segue o
 * ponteiro, inclinação pro ponteiro (parallax) e clique perto da fita manda uma virada pelo nó.
 * O canvas cobre o hero (transparente); o nó se encaixa entre o fim dos botões e a base, na coluna da
 * esquerda, até 360px, e some se não couber. Lazy pelo ImmersiveSlot (desktop, depois do load);
 * reduced-motion = parado.
 */
export default function HeroKnot() {
  const [reduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const ref = useThreeScene(
    ({ renderer, scene, camera }) => {
      camera.position.set(0, 0, CAMERA_Z)
      const { geometry, centers } = buildRibbon()
      const uniforms = {
        uTime: { value: 0 },
        uWidth: { value: K.ribbonWidth },
        uTwists: { value: K.twists },
        uFlow: { value: K.flowSpeed },
        uFlipU: { value: 0 },
        uFlipT: { value: -100 },
        uIntro: { value: reduced ? 1.01 : 0 },
        uDepthFade: { value: K.depth },
        uInkA: { value: srgb(K.colors[0]) },
        uInkB: { value: srgb(K.colors[1]) },
        uLight: { value: new THREE.Vector3(0.3, 0.5, 1).normalize() },
      }
      const mesh = new THREE.Mesh(
        geometry,
        new THREE.ShaderMaterial({
          uniforms,
          vertexShader,
          fragmentShader,
          transparent: true,
          side: THREE.DoubleSide,
          depthTest: false,
          depthWrite: false,
        }),
      )
      mesh.frustumCulled = false
      const tiltGroup = new THREE.Group() // inclinação + parallax
      const spin = new THREE.Group() // giro lento
      spin.add(mesh)
      tiltGroup.add(spin)
      scene.add(tiltGroup)

      const canvas = renderer.domElement
      const hero = canvas.closest('section')
      const ptr = new THREE.Vector2()
      let inside = false
      let now = 0
      let start = -1
      let fits = true

      // encaixa o nó entre o fim dos botões e a base do hero, centrado na coluna da esquerda
      const layout = () => {
        const actions = hero?.querySelector<HTMLElement>('[data-hero-actions]')
        if (!hero || !actions) return
        const cr = canvas.getBoundingClientRect()
        const ar = actions.getBoundingClientRect()
        const col = (actions.parentElement ?? actions).getBoundingClientRect()
        const top = ar.bottom - cr.top + 24
        const bottom = cr.height - 16
        const area = Math.min(K.maxHeight, bottom - top, col.width)
        fits = area >= 180
        const cx = col.left - cr.left + col.width / 2
        const cy = top + (bottom - top) / 2
        const h = Math.tan((FOV * Math.PI) / 360) * CAMERA_Z
        const pxToWorld = (2 * h) / cr.height
        tiltGroup.position.set((cx - cr.width / 2) * pxToWorld, -(cy - cr.height / 2) * pxToWorld, 0)
        // raio do nó ≈ size × metade da área (com folga da largura da fita)
        tiltGroup.scale.setScalar(((K.size * area) / 2 / (1 + K.ribbonWidth / 2)) * pxToWorld)
        tiltGroup.visible = fits
      }
      const ro = new ResizeObserver(layout)
      if (hero) ro.observe(hero)

      const onMove = (e: PointerEvent) => {
        const r = canvas.getBoundingClientRect()
        inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom
        ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
      }
      // clique perto da fita: vira a fita no ponto mais próximo
      const onDown = (e: PointerEvent) => {
        if (!fits || e.button !== 0 || (e.target as Element | null)?.closest?.(INTERACTIVE)) return
        const r = canvas.getBoundingClientRect()
        const v = new THREE.Vector3()
        let best = Infinity
        let bu = 0
        mesh.updateMatrixWorld()
        for (let i = 0; i < centers.length; i += 4) {
          v.copy(centers[i]).applyMatrix4(mesh.matrixWorld).project(camera)
          const d = Math.hypot(
            ((v.x + 1) / 2) * r.width + r.left - e.clientX,
            ((1 - v.y) / 2) * r.height + r.top - e.clientY,
          )
          if (d < best) {
            best = d
            bu = i / centers.length
          }
        }
        if (best > 40) return
        uniforms.uFlipU.value = bu
        uniforms.uFlipT.value = now
      }
      if (!reduced) {
        window.addEventListener('pointermove', onMove, { passive: true })
        window.addEventListener('pointerdown', onDown, { passive: true })
      }

      const tilt = (K.tilt * Math.PI) / 180
      tiltGroup.rotation.x = -tilt
      spin.rotation.z = 0.6

      return {
        update(t, dt) {
          layout()
          now = t
          uniforms.uTime.value = reduced ? 8 : t
          if (reduced) return
          if (start < 0) start = t
          uniforms.uIntro.value = Math.min(1.01, (t - start) / 1.4)
          spin.rotation.z += dt * K.rotationSpeed * 0.25
          // parallax: inclina pro ponteiro; a luz do reflexo acompanha
          const k = 1 - Math.exp(-dt * 2)
          const tx = inside ? ptr.x : 0
          const ty = inside ? ptr.y : 0
          tiltGroup.rotation.y += (tx * 0.35 * K.parallax - tiltGroup.rotation.y) * k
          tiltGroup.rotation.x += (-tilt - ty * 0.25 * K.parallax - tiltGroup.rotation.x) * k
          uniforms.uLight.value.set(tx * 0.8 + 0.2, ty * 0.8 + 0.4, 1).normalize()
        },
        dispose() {
          ro.disconnect()
          window.removeEventListener('pointermove', onMove)
          window.removeEventListener('pointerdown', onDown)
        },
      }
    },
    { fov: FOV, animate: !reduced, maxDpr: 1.5 },
  )

  return <div ref={ref} className="h-full w-full" />
}
