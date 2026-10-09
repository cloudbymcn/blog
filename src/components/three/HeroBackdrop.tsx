import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { heroRibbonsEnabled } from '../../lib/flags'
import { createRibbons } from './ribbons'
import { useThreeScene } from './useThreeScene'

const SHAPES = 9
const PARTICLES = 180
const FOV = 35
const CAMERA_Z = 10

/** Gerador determinístico (mesma composição a cada carga). */
function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
}

/** Meia largura/altura visível no plano z (pra posicionar em coordenadas de tela). */
function halfExtents(z: number, aspect: number) {
  const h = Math.tan((FOV * Math.PI) / 360) * (CAMERA_Z - z)
  return { w: h * aspect, h }
}

/**
 * Fundo do hero (SPEC §0-bis): vidro fosco quase branco e partículas cinza-azuladas flutuando devagar,
 * opacidade baixa, parallax leve com o mouse. Formas em coordenadas de tela (u, v em -1..1):
 * a maioria na metade direita e o resto nos cantos, longe da coluna de texto (x < ~44% no desktop).
 * Carregado lazy pelo ImmersiveSlot (só desktop, depois do load + requestIdleCallback).
 */
export default function HeroBackdrop() {
  const ref = useThreeScene(
    ({ renderer, scene, camera, pointer }) => {
      camera.position.set(0, 0, CAMERA_Z)
      const rand = rng(7)
      // experimento: fitas de interferência atrás do crachá (flag HERO_RIBBONS / ?ribbons=0|1)
      const ribbons = heroRibbonsEnabled() ? createRibbons() : null
      if (ribbons) scene.add(ribbons.mesh)
      const pmrem = new THREE.PMREMGenerator(renderer)
      const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
      scene.environment = env
      pmrem.dispose()

      // vidro fosco quase branco: rugoso, sem iridescência, bem translúcido
      const glass = new THREE.MeshPhysicalMaterial({
        color: 0xf3f6fa,
        roughness: 0.5,
        metalness: 0,
        clearcoat: 0.6,
        clearcoatRoughness: 0.35,
        sheen: 0.3,
        sheenColor: new THREE.Color(0xdfe8f5),
        transparent: true,
        opacity: 0.2,
        envMapIntensity: 0.9,
        depthWrite: false,
      })
      const geometries = [
        new THREE.IcosahedronGeometry(1, 3),
        new THREE.TorusGeometry(0.8, 0.28, 24, 64),
        new THREE.CapsuleGeometry(0.45, 0.9, 8, 24),
        new THREE.BoxGeometry(1.1, 1.1, 1.1, 2, 2, 2),
      ]

      const group = new THREE.Group()
      scene.add(group)
      const shapes = Array.from({ length: SHAPES }, (_, i) => {
        const mesh = new THREE.Mesh(geometries[i % geometries.length], glass)
        // 7 na metade direita (u 0.15..0.95); 2 nos cantos da esquerda (acima/abaixo do texto)
        const right = i < 7
        const u = right ? 0.15 + rand() * 0.8 : -0.97 + rand() * 0.12
        const v = right ? (rand() - 0.5) * 1.7 : (i === 7 ? 1 : -1) * (0.82 + rand() * 0.12)
        const z = -2 - rand() * 5
        mesh.scale.setScalar((0.35 + rand() * 0.55) * 0.65)
        mesh.rotation.set(rand() * Math.PI, rand() * Math.PI, 0)
        group.add(mesh)
        return { mesh, u, v, z, speed: (0.15 + rand() * 0.25) * 0.6, phase: rand() * Math.PI * 2 }
      })

      const positions = new Float32Array(PARTICLES * 3)
      for (let i = 0; i < PARTICLES; i++) {
        // 70% das partículas no lado direito
        positions[i * 3] = (rand() < 0.7 ? rand() * 0.5 : -rand() * 0.5) * 18
        positions[i * 3 + 1] = (rand() - 0.5) * 11
        positions[i * 3 + 2] = -1 - rand() * 8
      }
      const dotsGeometry = new THREE.BufferGeometry()
      dotsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      const dots = new THREE.Points(
        dotsGeometry,
        new THREE.PointsMaterial({
          color: 0x9fb3cc,
          size: 0.05,
          transparent: true,
          opacity: 0.3,
          depthWrite: false,
          sizeAttenuation: true,
        }),
      )
      scene.add(dots)

      scene.add(new THREE.AmbientLight(0xffffff, 0.6))
      const key = new THREE.DirectionalLight(0xffffff, 1.2)
      key.position.set(-3, 4, 6)
      scene.add(key)

      return {
        update(t, dt) {
          ribbons?.update(t, renderer)
          for (const s of shapes) {
            const { w, h } = halfExtents(s.z, camera.aspect)
            s.mesh.position.set(s.u * w, s.v * h + Math.sin(t * s.speed + s.phase) * 0.25, s.z)
            s.mesh.rotation.x += dt * s.speed * 0.25
            s.mesh.rotation.y += dt * s.speed * 0.3
          }
          dots.rotation.y = Math.sin(t * 0.03) * 0.06
          dots.position.y = Math.sin(t * 0.06) * 0.12
          // parallax suave seguindo o mouse
          group.rotation.y += (pointer.x * 0.05 - group.rotation.y) * 0.03
          group.rotation.x += (-pointer.y * 0.03 - group.rotation.x) * 0.03
          camera.position.x += (pointer.x * 0.2 - camera.position.x) * 0.02
          camera.lookAt(camera.position.x, 0, -4)
        },
        dispose() {
          env.dispose()
          geometries.forEach((g) => g.dispose())
        },
      }
    },
    { fov: FOV },
  )

  return <div ref={ref} className="h-full w-full" />
}
