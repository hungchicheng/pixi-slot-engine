import { Application, Container } from 'pixi.js'
import { ReelManager } from './reel/ReelManager'
import { AnimationLoop } from './animation/AnimationLoop'

export class SlotEngine {
  private app: Application
  private container: Container
  private reelManager: ReelManager
  private animationLoop: AnimationLoop

  constructor(app: Application) {
    this.app = app
    this.container = new Container()
    this.app.stage.addChild(this.container)

    this.reelManager = new ReelManager(this.app, this.container)
    this.animationLoop = new AnimationLoop(this.app, this.reelManager)
  }

  async initialize() {
    this.reelManager.initialize()
    this.animationLoop.start()
  }

  pause() {
    this.animationLoop.pause()
  }

  resume() {
    this.animationLoop.resume()
  }

  handleResize() {
    if (this.app) {
      this.reelManager.updatePositions()
    }
  }

  destroy() {
    this.animationLoop.stop()
    this.reelManager.destroy()
    this.container.destroy()
  }
}

