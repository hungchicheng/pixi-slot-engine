import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { SLOT_CONFIG } from '../components/slot-engine'

const defaultSlotConfig = SLOT_CONFIG

export const useGameStore = defineStore('game', () => {
  const status = ref<'Running' | 'Paused'>('Running')
  const score = ref<number>(0)
  const slotConfig = reactive<typeof SLOT_CONFIG>({
    ...defaultSlotConfig,
  })

  function toggleStatus() {
    status.value = status.value === 'Running' ? 'Paused' : 'Running'
  }

  function incrementScore() {
    score.value++
  }

  function resetScore() {
    score.value = 0
  }

  function updateSlotConfig(updates: Partial<typeof SLOT_CONFIG>) {
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
