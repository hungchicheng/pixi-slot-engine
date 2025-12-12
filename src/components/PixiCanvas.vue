<template>
  <div class="w-full aspect-video bg-black rounded-lg shadow-2xl overflow-hidden">
    <canvas ref="canvasRef" class="w-full h-full"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Application, Container, Sprite, Cache, Texture } from 'pixi.js'
import { useGameStore } from '../stores/game'
import {
  preloadSymbolImages,
  getOriginalTexture,
  getBlurredTexture,
  clearSymbolCache,
  symbolImages,
} from '../utils/preloadAssets'

interface SymbolSprite {
  original: Sprite
  blurred: Sprite
}

const canvasRef = ref<HTMLCanvasElement | null>(null)
const gameStore = useGameStore()
let app: Application | null = null
let animationId: number | null = null
let symbolSprites: SymbolSprite[] = []
let container: Container | null = null

const SYMBOLS_PER_ROW = 3
const SYMBOL_SIZE = 75
const SPACING = 25

// Display all symbols on canvas
function displaySymbols(): void {
  if (!app || !container) return

  symbolSprites = symbolImages
    .map((_, index) => {
      // Get cached textures
      const originalTexture = getOriginalTexture(index) as Texture
      const blurredTexture = getBlurredTexture(index)

      if (!originalTexture || !blurredTexture || !app || !container) {
        console.warn(`Texture not found for symbol ${index + 1}`)
        return null
      }

      // Create original sprite
      const originalSprite = new Sprite(originalTexture)
      originalSprite.anchor.set(0.5)
      originalSprite.width = SYMBOL_SIZE
      originalSprite.height = SYMBOL_SIZE

      // Create blurred sprite
      const blurredSprite = new Sprite(blurredTexture)
      blurredSprite.anchor.set(0.5)
      blurredSprite.width = SYMBOL_SIZE
      blurredSprite.height = SYMBOL_SIZE
      blurredSprite.alpha = 0.7 // Make blurred version more visible

      // Position sprites - show blurred version on left, original on right
      const row = Math.floor(index / SYMBOLS_PER_ROW)
      const col = index % SYMBOLS_PER_ROW
      const startX =
        (app.screen.width - (SYMBOLS_PER_ROW * (SYMBOL_SIZE + SPACING) - SPACING)) / 2
      const startY = app.screen.height / 2 - SYMBOL_SIZE
      const baseX = startX + col * (SYMBOL_SIZE + SPACING) + SYMBOL_SIZE / 2
      const y = startY + row * (SYMBOL_SIZE + SPACING) + SYMBOL_SIZE / 2

      // Position blurred version slightly to the left
      blurredSprite.x = baseX - SYMBOL_SIZE * 0.3
      blurredSprite.y = y

      // Position original version slightly to the right
      originalSprite.x = baseX + SYMBOL_SIZE * 0.3
      originalSprite.y = y

      // Add to container (blurred first, then original)
      container.addChild(blurredSprite)
      container.addChild(originalSprite)

      return {
        original: originalSprite,
        blurred: blurredSprite,
      }
    })
    .filter((sprite): sprite is SymbolSprite => sprite !== null)
}

// Reposition symbols on window resize
function repositionSymbols(): void {
  if (!app) return

  const startX =
    (app.screen.width - (SYMBOLS_PER_ROW * (SYMBOL_SIZE + SPACING) - SPACING)) / 2
  const startY = app.screen.height / 2 - SYMBOL_SIZE

  symbolSprites.forEach((symbol, index) => {
    const row = Math.floor(index / SYMBOLS_PER_ROW)
    const col = index % SYMBOLS_PER_ROW
    const baseX = startX + col * (SYMBOL_SIZE + SPACING) + SYMBOL_SIZE / 2
    const y = startY + row * (SYMBOL_SIZE + SPACING) + SYMBOL_SIZE / 2

    // Position blurred version slightly to the left
    symbol.blurred.x = baseX - SYMBOL_SIZE * 0.3
    symbol.blurred.y = y

    // Position original version slightly to the right
    symbol.original.x = baseX + SYMBOL_SIZE * 0.3
    symbol.original.y = y
  })
}

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
    autoDensity: true,
  })

  // Create container
  container = new Container()
  app.stage.addChild(container)

  // Preload all images and create blur versions
  await preloadSymbolImages(app)

  // Display all symbols
  displaySymbols()

  // Animation loop
  const animate = (): void => {
    if (!app) return

    if (gameStore.status === 'Paused') {
      animationId = requestAnimationFrame(animate)
      return
    }

    // Add subtle rotation and scale animation to symbols
    symbolSprites.forEach((symbol, index) => {
      const time = Date.now() * 0.001
      symbol.original.rotation = Math.sin(time + index) * 0.1
      symbol.blurred.rotation = Math.sin(time + index) * 0.1

      const scale = 1 + Math.sin(time * 2 + index) * 0.05
      symbol.original.scale.set(scale)
      symbol.blurred.scale.set(scale)
    })

    animationId = requestAnimationFrame(animate)
  }

  animate()

  // Handle window resize
  const handleResize = (): void => {
    if (app && canvasRef.value) {
      app.renderer.resize(canvasRef.value.clientWidth, canvasRef.value.clientHeight)
      repositionSymbols()
    }
  }

  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (animationId !== null) {
    cancelAnimationFrame(animationId)
  }
  if (app) {
    clearSymbolCache()
    Cache.reset()
    app.destroy(true)
  }
})
</script>
