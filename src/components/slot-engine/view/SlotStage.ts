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
    this.config = config
  }

  updateConfig(config: SlotConfig) {
    this.config = config
    // Reinitialize reels if column count changed
    if (this.reels.length !== config.COLUMNS) {
      this.destroy()
      this.initialize()
    } else {
      // Update existing reels
      this.reels.forEach(reel => reel.updateConfig(config))
    }
  }

  initialize() {
    // Create a reel for each column
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

    // Check if we need to stop the next reel in sequence
    if (this.currentStopIndex >= 0 && this.currentStopIndex < this.reels.length) {
      const currentReel = this.reels[this.currentStopIndex]
      const currentState = currentReel.getState()

      // If current reel has finished stopping (returned to idle), stop the next one
      // Only check if the reel was in a stopping state before (not already idle from start)
      if (currentState === 'idle') {
        // Move to next reel
        this.currentStopIndex++

        if (
          this.currentStopIndex < this.reels.length &&
          this.currentStopIndex < this.resultIndices.length
        ) {
          // Stop the next reel
          this.reels[this.currentStopIndex].stopSpin(this.resultIndices[this.currentStopIndex])
        } else {
          // All reels have been stopped, reset
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

  destroy() {
    this.reels.forEach(reel => {
      reel.destroy()
    })
    this.reels = []
  }
}
