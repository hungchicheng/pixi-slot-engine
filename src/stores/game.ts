import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { SLOT_CONFIG } from '../components/slot-engine'

const defaultSlotConfig = SLOT_CONFIG

export const useGameStore = defineStore('game', () => {
  const score = ref<number>(0)
  const slotConfig = reactive<typeof SLOT_CONFIG>({
    ...defaultSlotConfig,
  })

  const isSpinning = ref<boolean>(false)
  const pendingSpin = ref<boolean>(false)

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

  function requestSpin() {
    if (isSpinning.value) return false
    pendingSpin.value = true
    return true
  }

  function startSpin() {
    isSpinning.value = true
    pendingSpin.value = false
    return true
  }

  function completeSpin() {
    isSpinning.value = false
  }

  function setIsSpinning(value: boolean) {
    isSpinning.value = value
  }

  return {
    score,
    slotConfig,
    isSpinning,
    pendingSpin,

    incrementScore,
    resetScore,
    updateSlotConfig,
    resetSlotConfig,
    requestSpin,
    startSpin,
    completeSpin,
    setIsSpinning,
  }
})
