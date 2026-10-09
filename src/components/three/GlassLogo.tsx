import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { useThreeScene } from './useThreeScene'

/**
 * Seção Sobre (SPEC §0-bis): cubo de vidro (MeshPhysicalMaterial com transmission) com o logo
 * flutuando dentro, girando devagar e inclinando de leve com o mouse. Lazy via ImmersiveSlot.
 */
export default function GlassLogo() {
  const ref = useThreeScene(
    ({ renderer, scene, camera, pointer }) => {
      const pmrem = new THREE.PMREMGenerator(renderer)
      const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
      scene.environment = env
      pmrem.dispose()
      camera.position.set(0, 0, 6)

      const cube = new THREE.Mesh(
        new RoundedBoxGeometry(2, 2, 2, 6, 0.28),
        new THREE.MeshPhysicalMaterial({
          color: 0xffffff,
          transmission: 1,
          thickness: 1.2,
          roughness: 0.06,
          ior: 1.45,
          clearcoat: 1,
          clearcoatRoughness: 0.05,
          iridescence: 0.25,
          envMapIntensity: 1.2,
          attenuationColor: new THREE.Color(0xdfe8f5),
          attenuationDistance: 4,
        }),
      )

      // logo nas duas faces de um plano no miolo do cubo (a refração do vidro distorce ele ao girar)
      const logoTexture = new THREE.TextureLoader().load('/img/logo-mcn.png')
      logoTexture.colorSpace = THREE.SRGBColorSpace
      logoTexture.anisotropy = 4
      const logo = new THREE.Mesh(
        new THREE.PlaneGeometry(1.25, 1.25),
        // alphaTest (opaco) em vez de transparent: o passe de transmission só enxerga objetos opacos
        new THREE.MeshBasicMaterial({ map: logoTexture, alphaTest: 0.5, side: THREE.DoubleSide }),
      )

      const group = new THREE.Group()
      group.add(logo, cube)
      group.rotation.set(0.35, -0.6, 0)
      scene.add(group)

      scene.add(new THREE.AmbientLight(0xffffff, 0.8))
      const key = new THREE.DirectionalLight(0xffffff, 1.4)
      key.position.set(-3, 5, 5)
      scene.add(key)

      return {
        update(t, dt) {
          group.rotation.y += dt * 0.25
          const tiltX = 0.35 + Math.sin(t * 0.4) * 0.08 - pointer.y * 0.15
          group.rotation.x += (tiltX - group.rotation.x) * 0.05
          group.position.y = Math.sin(t * 0.6) * 0.08
        },
        dispose() {
          env.dispose()
          logoTexture.dispose()
        },
      }
    },
    { fov: 30 },
  )

  return <div ref={ref} className="h-full w-full" />
}
