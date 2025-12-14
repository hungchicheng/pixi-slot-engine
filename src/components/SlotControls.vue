<script setup lang="ts">
import { inject } from 'vue'
import { useGameStore } from '../stores/game'
import type PixiCanvas from './PixiCanvas.vue'

const gameStore = useGameStore()
const pixiCanvasRef = inject<{ value: InstanceType<typeof PixiCanvas> | null }>('pixiCanvasRef')

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
      <p>Status: {{ gameStore.status }}</p>
      <div class="mt-4 flex gap-4 justify-center">
        <button
          @click="handleStartSpin"
          class="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-semibold"
        >
          Start Spin
        </button>
        <button
          @click="handleStopSpin"
          class="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-semibold"
        >
          Stop Spin
        </button>
        <button
          @click="gameStore.toggleStatus"
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Toggle Status
        </button>
      </div>
    </div>
  </div>
</template>
