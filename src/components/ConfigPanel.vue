<script setup lang="ts">
import { ref } from 'vue'
import { useGameStore } from '../stores/game'

const gameStore = useGameStore()
const isOpen = ref(true)

const groups = {
  Layout: [
    { key: 'COLUMNS', label: 'Columns', min: 1, max: 10, step: 1 },
    { key: 'ROWS', label: 'Rows', min: 1, max: 10, step: 1 },
    { key: 'SYMBOL_SIZE', label: 'Symbol Size', min: 50, max: 200, step: 10 },
    { key: 'SPACING', label: 'Tile Spacing', min: 0, max: 50, step: 1 },
    { key: 'COLUMN_SPACING', label: 'Col Spacing', min: 0, max: 100, step: 1 },
    { key: 'TILES_PER_COLUMN', label: 'Buffer Tiles', min: 3, max: 10, step: 1 },
  ],
  Speed: [
    { key: 'SCROLL_SPEED', label: 'Scroll Speed', min: 1, max: 50, step: 1 },
    { key: 'SPIN_SPEED', label: 'Spin Speed', min: 1, max: 100, step: 1 },
    { key: 'START_DELAY', label: 'Start Delay', min: 0, max: 1000, step: 50 },
  ],
  Animation: [
    { key: 'ANTICIPATION_DURATION', label: 'Anticipation Time', min: 0, max: 1000, step: 50 },
    { key: 'ANTICIPATION_OFFSET', label: 'Anticipation Dist', min: -200, max: 200, step: 10 },
    { key: 'IMPACT_DURATION', label: 'Impact Time', min: 0, max: 1000, step: 10 },
    { key: 'IMPACT_OFFSET', label: 'Impact Dist', min: 0, max: 200, step: 10 },
    { key: 'RECOVER_DURATION', label: 'Recover Time', min: 0, max: 1000, step: 50 },
  ],
} as const
</script>

<template>
  <div 
    class="fixed top-4 right-4 max-h-[90vh] overflow-y-auto bg-gray-900/90 backdrop-blur-md border border-gray-700 rounded-lg shadow-xl text-white transition-all duration-300 z-50 w-80"
    :class="{ 'translate-x-full opacity-50': !isOpen }"
  >
    <button 
      @click="isOpen = !isOpen"
      class="absolute left-0 top-0 -translate-x-full bg-gray-800 p-2 rounded-l-lg border-y border-l border-gray-700 hover:bg-gray-700 transition-colors"
    >
      <span v-if="isOpen">→</span>
      <span v-else>⚙️</span>
    </button>

    <div v-show="isOpen" class="p-4 space-y-6">
      <div class="flex justify-between items-center">
        <h2 class="text-lg font-bold text-yellow-500">Config Panel</h2>
        <button 
          @click="gameStore.resetSlotConfig"
          class="text-xs px-2 py-1 bg-red-600/20 text-red-400 hover:bg-red-600/40 rounded transition-colors"
        >
          Reset
        </button>
      </div>

      <div v-for="(fields, groupName) in groups" :key="groupName" class="space-y-3">
        <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-700 pb-1">
          {{ groupName }}
        </h3>
        
        <div v-for="field in fields" :key="field.key" class="space-y-1">
          <div class="flex justify-between text-xs">
            <label :for="field.key" class="text-gray-300">{{ field.label }}</label>
            <span class="font-mono text-yellow-500">{{ gameStore.slotConfig[field.key as keyof typeof gameStore.slotConfig] }}</span>
          </div>
          <input
            :id="field.key"
            type="range"
            v-model.number="gameStore.slotConfig[field.key as keyof typeof gameStore.slotConfig]"
            :min="field.min"
            :max="field.max"
            :step="field.step"
            class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-500 hover:accent-yellow-400"
          >
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom scrollbar for webkit */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
}
::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>
