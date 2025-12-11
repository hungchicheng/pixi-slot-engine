import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useGameStore = defineStore('game', () => {
  const status = ref<'Running' | 'Paused'>('Running')
  const score = ref<number>(0)

  function toggleStatus(): void {
    status.value = status.value === 'Running' ? 'Paused' : 'Running'
  }

  function incrementScore(): void {
    score.value++
  }

  function resetScore(): void {
    score.value = 0
  }

  return {
    status,
    score,
    toggleStatus,
    incrementScore,
    resetScore
  }
})


