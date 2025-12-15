import { Application } from 'pixi.js'
import type { ReelManager } from '../reel/ReelManager'

export class AnimationLoop {
  private app: Application
  private reelManager: ReelManager
  private animationId: number | null = null
  private isPaused: boolean = false

  constructor(app: Application, reelManager: ReelManager) {
    this.app = app
    this.reelManager = reelManager
  }

  start() {
    if (this.animationId !== null) return

    let lastTime = performance.now()
    
    const animate = (currentTime: number) => {
      if (!this.isPaused) {
        const delta = (currentTime - lastTime) / 16.67 // 标准化到 60fps 的 delta
        this.reelManager.update(delta)
      }
      lastTime = currentTime
      this.animationId = requestAnimationFrame(animate)
    }

    animate()
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

