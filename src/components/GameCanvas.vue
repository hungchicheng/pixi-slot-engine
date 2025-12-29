<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { Application, Cache } from 'pixi.js'
import { useGameStore } from '../stores/game'
import { preloadAllAssets, clearSymbolCache } from '@/utils/preloadAssets'
import { SlotEngine } from './slot-engine'
import type { SoundPlayer } from './slot-engine'
import { soundManager } from '@/utils/soundManager'
import Stats from 'stats.js'

function createSoundPlayerAdapter(manager: typeof soundManager): SoundPlayer {
  return {
    play(id: string, options?: { volume?: number; loop?: boolean }): number | null {
      return manager.play(id, options)
    },
    stop(id: string, soundId?: number): void {
      manager.stop(id, soundId)
    },
    isPlaying(id: string, soundId?: number): boolean {
      return manager.isPlaying(id, soundId)
    },
  }
}

const canvasRef = ref<HTMLCanvasElement | null>(null)
const gameStore = useGameStore()
let app: Application | null = null
let slotEngine: SlotEngine | null = null
const reelStates = ref<string[]>(Array(gameStore.slotConfig.COLUMNS).fill('idle'))
const canStop = ref(false)
let stateInterval: ReturnType<typeof setInterval> | null = null
let stats: Stats | null = null


const updateStates = () => {
  if (slotEngine) {
    reelStates.value = slotEngine.getStates()
    canStop.value = slotEngine.canStop()
  }
}

function startSpin() {
  if (slotEngine) {
    slotEngine.startSpin()
    updateStates()
  }
}

function stopSpin() {
  if (slotEngine) {
    // Generate random result indices (0-5 for each column) based on current config
    const { COLUMNS } = slotEngine.getConfig()
    const resultIndices = Array.from({ length: COLUMNS }, () =>
      Math.floor(Math.random() * 6)
    )
    slotEngine.stopSpin(resultIndices)
    updateStates()
  }
}

const handleMounted = async () => {
  if (!canvasRef.value) return

  app = new Application({
    view: canvasRef.value!,
    width: canvasRef.value!.clientWidth,
    height: canvasRef.value!.clientHeight,
    backgroundColor: 0x1a1a2e,
    antialias: true,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
  })

  if (import.meta.env.DEV) {
    ;(window as any).__PIXI_APP__ = app
  }

  await preloadAllAssets(app)

  const soundPlayer = createSoundPlayerAdapter(soundManager)
  slotEngine = new SlotEngine(app, gameStore.slotConfig, soundPlayer)
  await slotEngine.initialize()

  stats = new Stats()
  stats.showPanel(0) // 0: fps, 1: ms, 2: mb
  stats.dom.style.position = 'fixed'
  stats.dom.style.top = 'auto'
  stats.dom.style.bottom = '0'
  stats.dom.style.left = '0'
  stats.dom.style.zIndex = '1000'
  document.body.appendChild(stats.dom)

  app.ticker.add(() => {
    if (stats) {
      stats.update()
    }
  })

  watch(() => gameStore.slotConfig, (newConfig) => {
    if (slotEngine) {
      slotEngine.updateConfig(newConfig)
    }
  }, { deep: true })

  stateInterval = setInterval(updateStates, 100)



  const handleResize = () => {
    if (app && canvasRef.value && slotEngine) {
      app.renderer.resize(canvasRef.value.clientWidth, canvasRef.value.clientHeight)
      slotEngine.handleResize()
    }
  }

  window.addEventListener('resize', handleResize)
}

onMounted(handleMounted)

const handleUnmounted = () => {
  if (stateInterval) {
    clearInterval(stateInterval)
    stateInterval = null
  }

  if (stats && stats.dom && stats.dom.parentNode) {
    stats.dom.parentNode.removeChild(stats.dom)
    stats = null
  }
  
  if (slotEngine) {
    slotEngine.destroy()
    slotEngine = null
  }
  
  soundManager.stopAll()
  
  if (app) {
    clearSymbolCache()
    Cache.reset()
    app.destroy(true)
    app = null
  }
}

defineExpose({
  startSpin,
  stopSpin,
  reelStates,
  canStop,
})

onUnmounted(handleUnmounted)
</script>

<template>
  <div class="w-full aspect-video bg-black rounded-lg shadow-2xl overflow-hidden">
    <canvas ref="canvasRef" class="w-full h-full"></canvas>
  </div>
</template>
