'use client'

import { useEffect, useRef } from 'react'

export default function PolshiScene() {
  const canvasRef = useRef(null)
  const sceneRef = useRef(null)

  useEffect(() => {
    if (sceneRef.current) return
    sceneRef.current = true

    let animationId
    let renderer, scene, camera, torus, clock

    async function init() {
      const THREE = await import('three')
      const { FontLoader } = await import('three/examples/jsm/loaders/FontLoader.js')
      const { TextGeometry } = await import('three/examples/jsm/geometries/TextGeometry.js')

      const canvas = canvasRef.current
      if (!canvas) return

      scene = new THREE.Scene()

      const container = canvas.parentElement
      const w = container.clientWidth
      const h = container.clientHeight

      camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000)
      camera.position.z = 5

      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
      })
      renderer.setSize(w, h)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setClearColor(0x000000, 0)

      // Load font and create text
      const fontLoader = new FontLoader()
      fontLoader.load(
        'https://raw.githubusercontent.com/danielyl123/person/refs/heads/main/fonts/helvetiker_regular.typeface.json',
        (font) => {
          const textGeometry = new TextGeometry('POLSHI', {
            font,
            size: 1,
            depth: 0,
            curveSegments: 5,
            bevelEnabled: true,
            bevelThickness: 0,
            bevelSize: 0,
            bevelOffset: 0,
            bevelSegments: 4,
          })
          textGeometry.computeBoundingBox()
          textGeometry.center()

          const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff })
          const text = new THREE.Mesh(textGeometry, textMaterial)
          scene.add(text)
        }
      )

      // Iridescent torus
      const torusGeometry = new THREE.TorusGeometry(0.7, 0.4, 100, 60)
      const torusMaterial = new THREE.MeshPhysicalMaterial({
        metalness: 0,
        roughness: 0,
        iridescence: 1,
        iridescenceIOR: 1.5,
        iridescenceThicknessRange: [100, 324],
        transmission: 1,
        ior: 1.2,
        thickness: 0.8,
      })
      torus = new THREE.Mesh(torusGeometry, torusMaterial)
      torus.position.z = 1
      scene.add(torus)

      // Lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 10)
      scene.add(ambientLight)

      const positions = [[-1, 2, 0], [-1, -2, 0], [1, -2, 0], [1, 2, 0]]
      for (const pos of positions) {
        const pl = new THREE.PointLight(0xffffff, 10)
        pl.position.set(...pos)
        scene.add(pl)
      }

      clock = new THREE.Clock()

      function tick() {
        const elapsedTime = clock.getElapsedTime()
        if (torus) {
          torus.rotation.x = elapsedTime * 0.5
          torus.rotation.y = elapsedTime * 0.1
        }
        renderer.render(scene, camera)
        animationId = requestAnimationFrame(tick)
      }
      tick()

      function handleResize() {
        const cw = container.clientWidth
        const ch = container.clientHeight
        camera.aspect = cw / ch
        camera.updateProjectionMatrix()
        renderer.setSize(cw, ch)
      }
      window.addEventListener('resize', handleResize)

      // Store cleanup ref
      canvas._cleanup = () => {
        window.removeEventListener('resize', handleResize)
        cancelAnimationFrame(animationId)
        renderer.dispose()
      }
    }

    init()

    return () => {
      if (canvasRef.current?._cleanup) {
        canvasRef.current._cleanup()
      }
    }
  }, [])

  return (
    <section className="polshi-scene-section">
      <canvas ref={canvasRef} className="polshi-scene-canvas" />
    </section>
  )
}
