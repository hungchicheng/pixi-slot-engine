import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { SLOT_CONFIG } from '../components/slot-engine'

const defaultSlotConfig = SLOT_CONFIG

export const useGameStore = defineStore('game', () => {
  const score = ref<number>(0)
  const slotConfig = reactive<typeof SLOT_CONFIG>({
    ...defaultSlotConfig,
  })

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
    score,
    slotConfig,

    incrementScore,
    resetScore,
    updateSlotConfig,
    resetSlotConfig,
  }
})
