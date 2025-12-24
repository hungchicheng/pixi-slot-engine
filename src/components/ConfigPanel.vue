<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { useGameStore } from '../stores/game'

const gameStore = useGameStore()
const isOpen = ref(true)

// Floating window state
const position = ref({ x: window.innerWidth - 350, y: 20 })
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })
const panelRef = ref<HTMLElement | null>(null)

const handleMouseDown = (e: MouseEvent) => {
  if (!panelRef.value) return
  isDragging.value = true
  const rect = panelRef.value.getBoundingClientRect()
  dragOffset.value = {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  }
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mouseup', handleMouseUp)
}

const handleMouseMove = (e: MouseEvent) => {
  if (!isDragging.value) return
  let newX = e.clientX - dragOffset.value.x
  let newY = e.clientY - dragOffset.value.y
  
  // Boundary checks
  const maxX = window.innerWidth - (panelRef.value?.offsetWidth || 300)
  const maxY = window.innerHeight - (panelRef.value?.offsetHeight || 400)
  
  newX = Math.max(0, Math.min(newX, maxX))
  newY = Math.max(0, Math.min(newY, maxY))
  
  position.value = { x: newX, y: newY }
}

const handleMouseUp = () => {
  isDragging.value = false
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mouseup', handleMouseUp)
}

// Clean up listeners if component unmounts while dragging
onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mouseup', handleMouseUp)
})

const groups = {
  Layout: [
    { key: 'COLUMNS', label: 'Columns', min: 1, max: 10, step: 1 },
    { key: 'ROWS', label: 'Rows', min: 1, max: 10, step: 1 },
    { key: 'SYMBOL_SIZE', label: 'Symbol Size', min: 50, max: 200, step: 10 },
    { key: 'SPACING', label: 'Tile Spacing', min: 0, max: 50, step: 1 },
    { key: 'COLUMN_SPACING', label: 'Col Spacing', min: 0, max: 100, step: 1 },
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
  <div>
    <Transition name="panel-scale" mode="out-in">
      <!-- Collapsed State: Side Button -->
      <button 
        v-if="!isOpen"
        @click="isOpen = true"
        class="fixed right-0 top-1/4 z-50 bg-gray-900/90 text-yellow-500 p-3 rounded-l-xl shadow-xl border-y border-l border-yellow-500/30 hover:bg-gray-800 transition-all hover:pr-4 group"
        title="Open Config"
      >
        <span class="text-xl group-hover:scale-110 block transition-transform">⚙️</span>
      </button>

      <!-- Expanded State: Draggable Window -->
      <div 
        v-else
        ref="panelRef"
        class="fixed flex flex-col max-h-[80vh] w-80 bg-gray-900/95 backdrop-blur-md border border-gray-700 rounded-xl shadow-2xl text-white z-50 overflow-hidden"
        :style="{ left: `${position.x}px`, top: `${position.y}px` }"
      >
        <!-- Header / Drag Handle -->
        <div 
          @mousedown="handleMouseDown"
          class="flex justify-between items-center p-3 bg-gray-800/80 border-b border-gray-700 cursor-grab active:cursor-grabbing select-none"
        >
          <div class="flex items-center gap-2">
            <span class="text-lg">⚙️</span>
            <h2 class="font-bold text-yellow-500 text-sm tracking-wide">Config Panel</h2>
          </div>
          <div class="flex items-center gap-2">
            <button 
              @click="gameStore.resetSlotConfig"
              class="text-[10px] px-2 py-0.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 rounded transition-colors uppercase tracking-wider"
            >
              Reset
            </button>
            <button 
              @click="isOpen = false"
              class="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"
              title="Minimize"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        <!-- Scrollable Content -->
        <div class="p-4 space-y-6 overflow-y-auto custom-scrollbar flex-1">
          <div v-for="(fields, groupName) in groups" :key="groupName" class="space-y-3">
            <h3 class="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1 border-l-2 border-yellow-500/50">
              {{ groupName }}
            </h3>
            
            <div v-for="field in fields" :key="field.key" class="space-y-1.5 bg-gray-800/30 p-2 rounded-lg border border-gray-700/30 hover:border-gray-600/50 transition-colors">
              <div class="flex justify-between text-xs items-center">
                <label :for="field.key" class="text-gray-300 font-medium">{{ field.label }}</label>
                <span class="font-mono text-yellow-500 bg-black/30 px-1.5 py-0.5 rounded">{{ (gameStore.slotConfig as any)[field.key] }}</span>
              </div>
              <input
                :id="field.key"
                type="range"
                v-model.number="(gameStore.slotConfig as any)[field.key]"
                :min="field.min"
                :max="field.max"
                :step="field.step"
                class="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-500 hover:accent-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-500/20"
              >
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.panel-scale-enter-active,
.panel-scale-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.panel-scale-enter-from,
.panel-scale-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(10px);
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
