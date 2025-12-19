<script setup lang="ts">
import { inject, computed } from 'vue'
import { useGameStore } from '../stores/game'
import type PixiCanvas from './PixiCanvas.vue'

const gameStore = useGameStore()
const pixiCanvasRef = inject<{ 
  value: InstanceType<typeof PixiCanvas> | null 
}>('pixiCanvasRef')

const reelStates = computed(() => {
  return pixiCanvasRef?.value?.reelStates || Array(gameStore.slotConfig.COLUMNS).fill('idle')
})

const canStop = computed(() => {
  return pixiCanvasRef?.value?.canStop ?? false
})

const statesDisplay = computed(() => {
  return reelStates.value.join(' | ')
})

const isSpinning = computed(() => {
  return reelStates.value.some(state => state === 'accelerating' || state === 'spinning')
})

const isStopping = computed(() => {
  return reelStates.value.some(state => state === 'pre_stop' || state === 'bounce' || state === 'decelerating')
})

function handleStartSpin() {
  if (pixiCanvasRef?.value) {
    pixiCanvasRef.value.startSpin()
  }
}

function handleStopSpin() {
  if (pixiCanvasRef?.value) {
    pixiCanvasRef.value.stopSpin()
  }
}
</script>

<template>
  <div class="bg-gray-800/50 backdrop-blur-sm border-t border-gray-700 p-4">
    <div class="text-center text-gray-400 text-sm">
      <p class="mt-2 text-yellow-400 font-mono text-xs">
        XState: {{ statesDisplay }}
      </p>
      <div class="mt-4 flex gap-4 justify-center">
        <button
          @click="isSpinning ? handleStopSpin() : handleStartSpin()"
          :disabled="isStopping || (isSpinning && !canStop)"
          class="px-8 py-3 rounded-lg transition-all font-bold text-lg shadow-lg flex items-center gap-2"
          :class="{
            'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white': !isSpinning && !isStopping,
            'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white': isSpinning && canStop,
            'bg-gray-700 text-gray-400 cursor-not-allowed': isStopping || (isSpinning && !canStop)
          }"
        >
          <span v-if="isStopping">Stopping...</span>
          <span v-else-if="isSpinning && !canStop">Starting...</span>
          <span v-else-if="isSpinning">Stop Spin</span>
          <span v-else>Start Spin</span>
        </button>

      </div>
    </div>
  </div>
</template>
