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

const canvasRef = ref<HTMLCanvasElement | null>(null)
const gameStore = useGameStore()
let app: Application | null = null
let animationId: number | null = null
let symbolSprites: Sprite[] = []
let container: Container | null = null

const SYMBOLS_PER_ROW = 4
const SYMBOL_SIZE = 60
const SPACING = 60
const ROW_SPACING = 60

// Display all symbols on canvas (both original and blurred versions)
function displaySymbols(): void {
  if (!app || !container) return

  symbolSprites = []

  // First, add all original symbols
  symbolImages.forEach((_, index) => {
    const originalTexture = getOriginalTexture(index) as Texture
    if (!originalTexture || !app || !container) {
      console.warn(`Original texture not found for symbol ${index + 1}`)
      return
    }

    const sprite = new Sprite(originalTexture)
    sprite.anchor.set(0.5)
    sprite.width = SYMBOL_SIZE
    sprite.height = SYMBOL_SIZE
    symbolSprites.push(sprite)
    container.addChild(sprite)
  })

  // Then, add all blurred symbols
  symbolImages.forEach((_, index) => {
    const blurredTexture = getBlurredTexture(index)
    if (!blurredTexture || !app || !container) {
      console.warn(`Blurred texture not found for symbol ${index + 1}`)
      return
    }

    const sprite = new Sprite(blurredTexture)
    sprite.anchor.set(0.5)
    sprite.width = SYMBOL_SIZE
    sprite.height = SYMBOL_SIZE
    symbolSprites.push(sprite)
    container.addChild(sprite)
  })

  // Position all symbols in a grid
  repositionSymbols()
}

// Reposition symbols on window resize
function repositionSymbols(): void {
  if (!app) return

  const totalRowWidth = SYMBOLS_PER_ROW * SYMBOL_SIZE + (SYMBOLS_PER_ROW - 1) * SPACING
  const totalRows = Math.ceil(symbolSprites.length / SYMBOLS_PER_ROW)
  const totalHeight = totalRows * SYMBOL_SIZE + (totalRows - 1) * ROW_SPACING

  const startX = (app.screen.width - totalRowWidth) / 2
  const startY = (app.screen.height - totalHeight) / 2

  symbolSprites.forEach((sprite, index) => {
    const row = Math.floor(index / SYMBOLS_PER_ROW)
    const col = index % SYMBOLS_PER_ROW
    const x = startX + col * (SYMBOL_SIZE + SPACING) + SYMBOL_SIZE / 2
    const y = startY + row * (SYMBOL_SIZE + ROW_SPACING) + SYMBOL_SIZE / 2

    sprite.x = x
    sprite.y = y
    sprite.rotation = 0 // Ensure no rotation
    // Maintain width/height instead of resetting scale
    sprite.width = SYMBOL_SIZE
    sprite.height = SYMBOL_SIZE
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

  // Expose app to window for Pixi.js DevTools
  if (import.meta.env.DEV) {
    ;(window as any).__PIXI_APP__ = app
  }

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

    // Keep symbols static and aligned - no rotation or scale animation
    symbolSprites.forEach((sprite) => {
      sprite.rotation = 0
      // Maintain width/height instead of resetting scale
      sprite.width = SYMBOL_SIZE
      sprite.height = SYMBOL_SIZE
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
