import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { useThreeScene } from './useThreeScene'

const SHAPES = 9
const PARTICLES = 220

/** Gerador determinístico (mesma composição a cada carga). */
function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
}

/**
 * Fundo do hero (SPEC §0-bis): formas de vidro e partículas branco/cinza-azulado flutuando devagar,
 * opacidade baixa, parallax leve com o mouse. Carregado lazy pelo ImmersiveSlot (só desktop).
 */
export default function HeroBackdrop() {
  const ref = useThreeScene(({ renderer, scene, camera, pointer }) => {
    const rand = rng(7)
    const pmrem = new THREE.PMREMGenerator(renderer)
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = env
    pmrem.dispose()

    const glass = new THREE.MeshPhysicalMaterial({
      color: 0xdfe8f5,
      roughness: 0.12,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      iridescence: 0.35,
      transparent: true,
      opacity: 0.32,
      envMapIntensity: 1.1,
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
      // espalha pelas bordas e pelo fundo; o miolo (texto/crachá) fica limpo
      const side = i % 2 ? 1 : -1
      mesh.position.set(side * (3 + rand() * 4), (rand() - 0.5) * 6, -2 - rand() * 5)
      mesh.scale.setScalar(0.35 + rand() * 0.55)
      mesh.rotation.set(rand() * Math.PI, rand() * Math.PI, 0)
      group.add(mesh)
      return { mesh, base: mesh.position.clone(), speed: 0.15 + rand() * 0.25, phase: rand() * Math.PI * 2 }
    })

    const positions = new Float32Array(PARTICLES * 3)
    for (let i = 0; i < PARTICLES; i++) {
      positions[i * 3] = (rand() - 0.5) * 18
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
        opacity: 0.45,
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
        for (const s of shapes) {
          s.mesh.position.y = s.base.y + Math.sin(t * s.speed + s.phase) * 0.35
          s.mesh.rotation.x += dt * s.speed * 0.3
          s.mesh.rotation.y += dt * s.speed * 0.4
        }
        dots.rotation.y = Math.sin(t * 0.05) * 0.08
        dots.position.y = Math.sin(t * 0.1) * 0.15
        // parallax suave seguindo o mouse
        group.rotation.y += (pointer.x * 0.08 - group.rotation.y) * 0.04
        group.rotation.x += (-pointer.y * 0.05 - group.rotation.x) * 0.04
        camera.position.x += (pointer.x * 0.3 - camera.position.x) * 0.03
        camera.lookAt(0, 0, -4)
      },
      dispose() {
        env.dispose()
        geometries.forEach((g) => g.dispose())
      },
    }
  })

  return <div ref={ref} className="h-full w-full" />
}
