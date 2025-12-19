import { Application, Container } from 'pixi.js'
import { Reel } from './Reel'
import type { SlotConfig } from '../logic/types'

export class SlotStage {
  private app: Application
  private container: Container
  private reels: Reel[] = []
  private resultIndices: number[] = []
  private currentStopIndex: number = -1 // -1 means no stop sequence in progress
  private config: SlotConfig

  constructor(app: Application, container: Container, config: SlotConfig) {
    this.app = app
    this.container = container
    this.config = { ...config } // Store a copy to detect changes later
  }

  updateConfig(config: SlotConfig) {
    // Check if layout parameters changed
    const resetRequired =
      this.config.COLUMNS !== config.COLUMNS ||
      this.config.ROWS !== config.ROWS ||
      this.config.SYMBOL_SIZE !== config.SYMBOL_SIZE ||
      this.config.SPACING !== config.SPACING ||
      this.config.COLUMN_SPACING !== config.COLUMN_SPACING

    this.config = { ...config }

    // Reinitialize reels if layout changed
    if (resetRequired) {
      this.destroy()
      this.initialize()
    } else {
      // Update existing reels (for speed/timing changes)
      this.reels.forEach(reel => reel.updateConfig(this.config))
    }
  }

  initialize() {
    for (let col = 0; col < this.config.COLUMNS; col++) {
      const reel = new Reel(this.app, this.container, col, this.config)
      reel.initialize()
      this.reels.push(reel)
    }
  }

  update = (delta: number = 1) => {
    this.reels.forEach(reel => {
      reel.update(delta)
    })

    // Sequential stopping logic
    if (this.currentStopIndex >= 0 && this.currentStopIndex < this.reels.length) {
      const currentReel = this.reels[this.currentStopIndex]
      const currentState = currentReel.getState()

      if (currentState === 'idle') {
        this.currentStopIndex++

        if (
          this.currentStopIndex < this.reels.length &&
          this.currentStopIndex < this.resultIndices.length
        ) {
          this.reels[this.currentStopIndex].stopSpin(this.resultIndices[this.currentStopIndex])
        } else {
          this.currentStopIndex = -1
          this.resultIndices = []
        }
      }
    }
  }

  startSpin() {
    // Reset stop sequence when starting new spin
    this.currentStopIndex = -1
    this.resultIndices = []

    this.reels.forEach(reel => {
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

    // Store result indices for sequential stopping
    this.resultIndices = resultIndices
    this.currentStopIndex = 0

    // Start stopping the first reel
    this.reels[0].stopSpin(resultIndices[0])
  }

  updatePositions() {
    this.reels.forEach(reel => {
      reel.updatePositions()
    })
  }

  getStates(): string[] {
    return this.reels.map(reel => reel.getState())
  }

  canStop(): boolean {
    // Return true if ALL reels are ready to stop
    return this.reels.every(reel => reel.canStop())
  }

  destroy() {
    this.reels.forEach(reel => {
      reel.destroy()
    })
    this.reels = []
  }
}
