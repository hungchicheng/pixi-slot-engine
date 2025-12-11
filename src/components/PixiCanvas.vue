<template>
  <div class="w-full aspect-video bg-black rounded-lg shadow-2xl overflow-hidden">
    <canvas ref="canvasRef" class="w-full h-full"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Application, Graphics, Container, Text, TextStyle } from 'pixi.js'
import { useGameStore } from '../stores/game'

interface Circle {
  graphics: Graphics
  speedX: number
  speedY: number
  radius: number
}

const canvasRef = ref<HTMLCanvasElement | null>(null)
const gameStore = useGameStore()
let app: Application | null = null
let animationId: number | null = null
let helloText: Text | null = null
let subtitleText: Text | null = null

onMounted(async () => {
  if (!canvasRef.value) return

  // Create Pixi.js application
  app = new Application({
    view: canvasRef.value!,
    width: canvasRef.value!.clientWidth,
    height: canvasRef.value!.clientHeight,
    backgroundColor: 0x1a1a2e,
    antialias: true,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true
  })

  // Create container
  const container = new Container()
  app.stage.addChild(container)

  // Create Hello World text
  const helloStyle = new TextStyle({
    fontFamily: 'Arial',
    fontSize: 48,
    fontWeight: 'bold',
    fill: ['#ffffff', '#00ff00'], // Gradient color
    stroke: '#4a1850',
    strokeThickness: 5,
    dropShadow: true,
    dropShadowColor: '#000000',
    dropShadowBlur: 4,
    dropShadowAngle: Math.PI / 6,
    dropShadowDistance: 6,
  })

  helloText = new Text('Hello World!', helloStyle)
  helloText.anchor.set(0.5)
  helloText.x = app.screen.width / 2
  helloText.y = app.screen.height / 2 - 50
  container.addChild(helloText)

  // Create subtitle
  const subtitleStyle = new TextStyle({
    fontFamily: 'Arial',
    fontSize: 24,
    fill: '#ffffff',
    align: 'center',
  })

  subtitleText = new Text('Pixi.js + Vue 3 + TypeScript', subtitleStyle)
  subtitleText.anchor.set(0.5)
  subtitleText.x = app.screen.width / 2
  subtitleText.y = app.screen.height / 2 + 20
  container.addChild(subtitleText)

  // Create animated circles
  const circles: Circle[] = []
  const colors: number[] = [0xff6b6b, 0x4ecdc4, 0x45b7d1, 0xf9ca24, 0x6c5ce7]

  for (let i = 0; i < 20; i++) {
    const circle = new Graphics()
    const radius = Math.random() * 30 + 10
    const color = colors[Math.floor(Math.random() * colors.length)]

    circle.beginFill(color)
    circle.drawCircle(0, 0, radius)
    circle.endFill()
    circle.alpha = 0.7

    circle.x = Math.random() * app.screen.width
    circle.y = Math.random() * app.screen.height
    
    const speedX = (Math.random() - 0.5) * 2
    const speedY = (Math.random() - 0.5) * 2
    
    circles.push({
      graphics: circle,
      speedX,
      speedY,
      radius
    })
    
    container.addChild(circle)
  }

  // Animation loop
  const animate = (): void => {
    if (!app) return
    
    if (gameStore.status === 'Paused') {
      animationId = requestAnimationFrame(animate)
      return
    }

    // Add subtle pulsing effect to text
    if (helloText) {
      helloText.scale.x = 1 + Math.sin(Date.now() * 0.003) * 0.05
      helloText.scale.y = 1 + Math.sin(Date.now() * 0.003) * 0.05
    }

    circles.forEach(circle => {
      circle.graphics.x += circle.speedX
      circle.graphics.y += circle.speedY

      // Boundary bounce
      if (circle.graphics.x - circle.radius < 0 || circle.graphics.x + circle.radius > app!.screen.width) {
        circle.speedX *= -1
      }
      if (circle.graphics.y - circle.radius < 0 || circle.graphics.y + circle.radius > app!.screen.height) {
        circle.speedY *= -1
      }

      // Rotation
      circle.graphics.rotation += 0.01
    })

    animationId = requestAnimationFrame(animate)
  }

  animate()

  // Handle window resize
  const handleResize = (): void => {
    if (app && canvasRef.value) {
      app.renderer.resize(canvasRef.value.clientWidth, canvasRef.value.clientHeight)
      // Update text positions
      if (helloText) {
        helloText.x = app.screen.width / 2
        helloText.y = app.screen.height / 2 - 50
      }
      if (subtitleText) {
        subtitleText.x = app.screen.width / 2
        subtitleText.y = app.screen.height / 2 + 20
      }
    }
  }

  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (animationId !== null) {
    cancelAnimationFrame(animationId)
  }
  if (app) {
    app.destroy(true)
  }
})
</script>
