<script setup lang="ts">
import { ref, provide } from 'vue'
import PixiCanvas from '../components/PixiCanvas.vue'
import SlotControls from '../components/SlotControls.vue'
import ConfigPanel from '../components/ConfigPanel.vue'
import GitHubCorner from '../components/GitHubCorner.vue'

const pixiCanvasRef = ref<InstanceType<typeof PixiCanvas> | null>(null)
provide('pixiCanvasRef', pixiCanvasRef)
</script>

<template>
  <div class="w-full h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col relative overflow-hidden">
    <GitHubCorner repoUrl="https://github.com/hungchicheng/pixi-slot-engine" />
    <ConfigPanel />
    
    <header class="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 p-4">
      <h1 class="text-3xl font-bold text-white text-center">Pixi Slot Engine</h1>
      <p class="text-gray-300 text-center mt-2">Pixi.js + Vue 3 + Pinia + Tailwind CSS</p>
    </header>
    
    <main class="flex-1 flex items-center justify-center p-4">
      <div class="w-full max-w-4xl">
        <PixiCanvas ref="pixiCanvasRef" />
      </div>
    </main>
    
    <footer>
      <SlotControls />
    </footer>
  </div>
</template>
