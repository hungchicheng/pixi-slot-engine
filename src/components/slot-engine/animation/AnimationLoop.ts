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

    const animate = () => {
      if (!this.isPaused) {
        this.reelManager.update()
      }

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

