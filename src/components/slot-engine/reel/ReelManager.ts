import { Application, Container } from 'pixi.js'
import { Reel } from './Reel'
import { SLOT_CONFIG } from '../config/slotConfig'

export class ReelManager {
  private app: Application
  private container: Container
  private reels: Reel[] = []

  constructor(app: Application, container: Container) {
    this.app = app
    this.container = container
  }

  initialize() {
    // Create a reel for each column
    for (let col = 0; col < SLOT_CONFIG.COLUMNS; col++) {
      const reel = new Reel(this.app, this.container, col)
      reel.initialize()
      this.reels.push(reel)
    }
  }

  update() {
    function updateReel(reel: Reel) {
      reel.update()
    }

    this.reels.forEach(updateReel)
  }

  startSpin() {
    function startReelSpin(reel: Reel) {
      reel.startSpin()
    }

    this.reels.forEach(startReelSpin)
  }

  stopSpin(resultIndices: number[]) {
    if (resultIndices.length !== this.reels.length) {
      console.warn(
        `Result indices length (${resultIndices.length}) doesn't match reels count (${this.reels.length})`
      )
      return
    }

    function stopReelSpin(reel: Reel, index: number) {
      reel.stopSpin(resultIndices[index])
    }

    this.reels.forEach(stopReelSpin)
  }

  updatePositions() {
    function updatePosition(reel: Reel) {
      reel.updatePositions()
    }

    this.reels.forEach(updatePosition)
  }

  destroy() {
    function destroyReel(reel: Reel) {
      reel.destroy()
    }

    this.reels.forEach(destroyReel)
    this.reels = []
  }
}

