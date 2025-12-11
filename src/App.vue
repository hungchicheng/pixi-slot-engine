<template>
  <div class="w-full h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col">
    <header class="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 p-4">
      <h1 class="text-3xl font-bold text-white text-center">Slot Engine</h1>
      <p class="text-gray-300 text-center mt-2">Vue 3 + Pinia + Tailwind CSS + Pixi.js</p>
    </header>
    
    <main class="flex-1 flex items-center justify-center p-4">
      <div class="w-full max-w-4xl">
        <PixiCanvas />
      </div>
    </main>
    
    <footer class="bg-gray-800/50 backdrop-blur-sm border-t border-gray-700 p-4">
      <div class="text-center text-gray-400 text-sm">
        <p>Status: {{ gameStore.status }}</p>
        <button 
          @click="gameStore.toggleStatus"
          class="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Toggle Status
        </button>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { useGameStore } from './stores/game'
import PixiCanvas from './components/PixiCanvas.vue'

const gameStore = useGameStore()
</script>
