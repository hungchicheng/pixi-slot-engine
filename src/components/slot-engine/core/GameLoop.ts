import type { Application } from 'pixi.js'
import type { SlotStage } from '../view/SlotStage'

export class GameLoop {
  private slotStage: SlotStage
  private animationId: number | null = null
  private isPaused: boolean = false

  constructor(_app: Application, slotStage: SlotStage) {
    this.slotStage = slotStage
  }

  start() {
    if (this.animationId !== null) return

    let lastTime = performance.now()
    
    const animate = (currentTime: number) => {
      if (!this.isPaused) {
        const delta = (currentTime - lastTime) / 16.67 // 60FPS
        this.slotStage.update(delta)
      }
      lastTime = currentTime
      this.animationId = requestAnimationFrame(animate)
    }

    animate(performance.now())
  }

  pause() {
    this.isPaused = true
  }

  resume() {
    this.isPaused = false
  }

  stop() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }
}

