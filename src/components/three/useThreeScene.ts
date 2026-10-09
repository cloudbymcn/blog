import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export interface SceneContext {
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  /** posição do mouse na janela, -1..1 (pra parallax) */
  pointer: THREE.Vector2
}

/**
 * Cena three.js decorativa com o ciclo de vida resolvido: renderer transparente, resize pelo container,
 * loop pausado fora da viewport e com a aba oculta, DPR limitado e dispose de tudo no unmount.
 * `setup` monta a cena e devolve o update por frame (+ cleanup opcional).
 * `animate: false` (reduced-motion): sem loop, um frame parado a cada resize.
 */
export function useThreeScene(
  setup: (ctx: SceneContext) => { update: (t: number, dt: number) => void; dispose?: () => void },
  { fov = 35, maxDpr = 1.5, animate = true } = {},
) {
  const ref = useRef<HTMLDivElement>(null)
  const setupRef = useRef(setup)

  useEffect(() => {
    const container = ref.current
    if (!container) return
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' })
    } catch {
      return
    }
    renderer.setClearColor(0x000000, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.NeutralToneMapping
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr))
    renderer.domElement.className = 'block h-full w-full'
    container.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 100)
    camera.position.set(0, 0, 10)
    const pointer = new THREE.Vector2()
    const { update, dispose } = setupRef.current({ renderer, scene, camera, pointer })

    let raf = 0
    let visible = true
    let last = performance.now()
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      update(now / 1000, dt)
      renderer.render(scene, camera)
      raf = requestAnimationFrame(loop)
    }
    const play = () => {
      if (!animate || raf || !visible || document.hidden) return
      last = performance.now()
      raf = requestAnimationFrame(loop)
    }
    const pause = () => {
      cancelAnimationFrame(raf)
      raf = 0
    }

    const resize = () => {
      const w = Math.max(1, container.clientWidth)
      const h = Math.max(1, container.clientHeight)
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      if (!animate) update(0, 0)
      renderer.render(scene, camera)
    }
    const ro = new ResizeObserver(resize)
    ro.observe(container)
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      if (visible) play()
      else pause()
    })
    io.observe(container)
    const onVisibility = () => (document.hidden ? pause() : play())
    document.addEventListener('visibilitychange', onVisibility)
    const onPointer = (e: PointerEvent) => {
      pointer.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1)
    }
    window.addEventListener('pointermove', onPointer, { passive: true })

    resize()
    play()

    return () => {
      pause()
      ro.disconnect()
      io.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pointermove', onPointer)
      dispose?.()
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh
        mesh.geometry?.dispose()
        const mats = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : []
        mats.forEach((m) => m.dispose())
      })
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [fov, maxDpr, animate])

  return ref
}
