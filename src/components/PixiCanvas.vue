<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { Application, Cache } from 'pixi.js'
import { useGameStore } from '../stores/game'
import { preloadSymbolImages, clearSymbolCache } from '@/utils/preloadAssets'
import { SlotEngine } from './slot-engine/SlotEngine'

const canvasRef = ref<HTMLCanvasElement | null>(null)
const gameStore = useGameStore()
let app: Application | null = null
let slotEngine: SlotEngine | null = null

// Expose methods for parent component
function startSpin() {
  if (slotEngine) {
    slotEngine.startSpin()
  }
}

function stopSpin() {
  if (slotEngine) {
    // Generate random result indices (0-5 for each column)
    const resultIndices = Array.from({ length: 3 }, () =>
      Math.floor(Math.random() * 6)
    )
    slotEngine.stopSpin(resultIndices)
  }
}

// Expose methods to parent
defineExpose({
  startSpin,
  stopSpin,
})

async function handleMounted() {
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

  // Preload all images
  await preloadSymbolImages(app)

  // Initialize slot engine
  slotEngine = new SlotEngine(app)
  await slotEngine.initialize()

  // Watch game status for pause/resume
  function getStatus() {
    return gameStore.status
  }

  function handleStatusChange(status: 'Running' | 'Paused') {
    if (slotEngine) {
      if (status === 'Paused') {
        slotEngine.pause()
      } else {
        slotEngine.resume()
      }
    }
  }

  watch(getStatus, handleStatusChange)

  // Handle window resize
  function handleResize() {
    if (app && canvasRef.value && slotEngine) {
      app.renderer.resize(canvasRef.value.clientWidth, canvasRef.value.clientHeight)
      slotEngine.handleResize()
    }
  }

  window.addEventListener('resize', handleResize)
}

onMounted(handleMounted)

function handleUnmounted() {
  if (slotEngine) {
    slotEngine.destroy()
    slotEngine = null
  }
  if (app) {
    clearSymbolCache()
    Cache.reset()
    app.destroy(true)
    app = null
  }
}

onUnmounted(handleUnmounted)
</script>

<template>
  <div class="w-full aspect-video bg-black rounded-lg shadow-2xl overflow-hidden">
    <canvas ref="canvasRef" class="w-full h-full"></canvas>
  </div>
</template>
