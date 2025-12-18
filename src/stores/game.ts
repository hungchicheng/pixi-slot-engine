import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import type { SlotConfig } from '../components/slot-engine'
export type { SlotConfig }

const defaultSlotConfig: SlotConfig = {
  COLUMNS: 3,
  ROWS: 3,
  SYMBOL_SIZE: 100,
  SPACING: 0,
  COLUMN_SPACING: 20,
  SCROLL_SPEED: 3,
  SPIN_SPEED: 8,
  TILES_PER_COLUMN: 5,
  STOP_DURATION: 0,
  ANTICIPATION_DURATION: 200,
  ANTICIPATION_OFFSET: -70,
  IMPACT_DURATION: 60,
  IMPACT_OFFSET: 70,
  RECOVER_DURATION: 200,
  START_DELAY: 200,
}

export const useGameStore = defineStore('game', () => {
  const status = ref<'Running' | 'Paused'>('Running')
  const score = ref<number>(0)
  const slotConfig = reactive<SlotConfig>({ ...defaultSlotConfig })

  function toggleStatus() {
    status.value = status.value === 'Running' ? 'Paused' : 'Running'
  }

  function incrementScore() {
    score.value++
  }

  function resetScore() {
    score.value = 0
  }

  function updateSlotConfig(updates: Partial<SlotConfig>) {
    Object.assign(slotConfig, updates)
  }

  function resetSlotConfig() {
    Object.assign(slotConfig, defaultSlotConfig)
  }

  return {
    status,
    score,
    slotConfig,
    toggleStatus,
    incrementScore,
    resetScore,
    updateSlotConfig,
    resetSlotConfig,
  }
})
