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

  update = () => {
    this.reels.forEach((reel) => {
      reel.update()
    })
  }

  startSpin() {
    this.reels.forEach((reel) => {
      reel.startSpin()
    })
  }

  stopSpin(resultIndices: number[]) {
    if (resultIndices.length !== this.reels.length) {
      console.warn(
        `Result indices length (${resultIndices.length}) doesn't match reels count (${this.reels.length})`
      )
      return
    }

    this.reels.forEach((reel, index) => {
      reel.stopSpin(resultIndices[index])
    })
  }

  updatePositions() {
    this.reels.forEach((reel) => {
      reel.updatePositions()
    })
  }

  destroy() {
    this.reels.forEach((reel) => {
      reel.destroy()
    })
    this.reels = []
  }
}

