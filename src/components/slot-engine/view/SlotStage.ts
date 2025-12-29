import { Application, Container } from 'pixi.js'
import { Reel } from './Reel'
import type { SlotConfig } from '../logic/types'
import { WinDetectionSystem, type WinningLine } from '../systems/winDetection'
import { WinLineSystem } from '../systems/winLine'
import type { SoundPlayer } from '../logic/soundPlayer'

export class SlotStage {
  private app: Application
  private container: Container
  private reels: Reel[] = []
  private resultIndices: number[] = []
  private currentStopIndex: number = -1
  private config: SlotConfig
  private winLineSystem: WinLineSystem
  private currentWinningLines: WinningLine[] = []
  private lastWinCheckState: string = ''
  private soundPlayer: SoundPlayer | null
  private spinningSoundId: number | null = null

  constructor(app: Application, container: Container, config: SlotConfig, soundPlayer?: SoundPlayer) {
    this.app = app
    this.container = container
    this.config = { ...config }
    this.soundPlayer = soundPlayer || null
    this.winLineSystem = new WinLineSystem(app, container, config)
    
    this.winLineSystem.setOnLineChangeCallback((currentLine) => {
      this.updateWinEffectsForCurrentLine(currentLine)
    })
  }

  updateConfig(config: SlotConfig) {
    const resetRequired =
      this.config.COLUMNS !== config.COLUMNS ||
      this.config.ROWS !== config.ROWS ||
      this.config.SYMBOL_SIZE !== config.SYMBOL_SIZE ||
      this.config.SPACING !== config.SPACING ||
      this.config.COLUMN_SPACING !== config.COLUMN_SPACING

    this.config = { ...config }
    
    this.winLineSystem.destroy()
    this.winLineSystem = new WinLineSystem(this.app, this.container, this.config)
    
    this.winLineSystem.setOnLineChangeCallback((currentLine) => {
      this.updateWinEffectsForCurrentLine(currentLine)
    })

    if (resetRequired) {
      this.destroy()
      this.initialize()
    } else {
      this.reels.forEach(reel => reel.updateConfig(this.config))
      this.winLineSystem.updateConfig(this.config)
      if (this.currentWinningLines.length > 0) {
        this.winLineSystem.updateLines()
      }
    }
  }

  setSoundPlayer(soundPlayer: SoundPlayer | null): void {
    this.soundPlayer = soundPlayer
    this.reels.forEach(reel => reel.setSoundPlayer(soundPlayer))
  }

  initialize() {
    for (let col = 0; col < this.config.COLUMNS; col++) {
      const reel = new Reel(this.app, this.container, col, this.config, this.soundPlayer || undefined)
      reel.initialize()
      this.reels.push(reel)
    }
  }

  update = (delta: number = 1) => {
    this.reels.forEach(reel => {
      reel.update(delta)
    })

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
          // All reels stopped, stop spinning sound and play stop sound
          if (this.soundPlayer && this.spinningSoundId !== null) {
            this.soundPlayer.stop('spinning', this.spinningSoundId)
            this.spinningSoundId = null
          }
          if (this.soundPlayer) {
            this.soundPlayer.play('spin-stop')
          }
          this.checkAndDisplayWins()
          this.currentStopIndex = -1
          this.resultIndices = []
        }
      }
    } else {
      const allIdle = this.reels.every(reel => reel.getState() === 'idle')
      const currentState = this.reels.map(reel => reel.getState()).join('|')
      
      if (allIdle && currentState !== this.lastWinCheckState) {
        this.checkAndDisplayWins()
        this.lastWinCheckState = currentState
      }
    }
  }

  startSpin() {
    this.currentStopIndex = -1
    this.resultIndices = []
    this.lastWinCheckState = ''

    this.clearWinEffects()

    // Start spinning sound
    if (this.soundPlayer) {
      this.spinningSoundId = this.soundPlayer.play('spinning', { loop: true })
    }

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

    this.resultIndices = resultIndices
    this.currentStopIndex = 0

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
    return this.reels.every(reel => reel.canStop())
  }

  private checkAndDisplayWins(): void {
    const allIdle = this.reels.every(reel => reel.getState() === 'idle')
    if (!allIdle) {
      return
    }

    const winningLines = WinDetectionSystem.checkWinningLines(this.reels, this.config)
    this.currentWinningLines = winningLines

    if (winningLines.length > 0) {
      if (this.winLineSystem) {
        this.winLineSystem.drawWinLines(winningLines)

        const currentLine = this.winLineSystem.getCurrentLine()
        this.updateWinEffectsForCurrentLine(currentLine)
      }
    } else {
      this.clearWinEffects()
    }
  }

  private updateWinEffectsForCurrentLine(currentLine: WinningLine | null): void {
    const currentLinePositions = new Set<string>()
    if (currentLine) {
      currentLine.tiles.forEach(({ column, row }) => {
        currentLinePositions.add(`${column}-${row}`)
      })
    }

    this.reels.forEach((reel, column) => {
      const tiles = reel.getTiles()
      const { ROWS, SYMBOL_SIZE, SPACING } = this.config
      const screenHeight = this.app.screen.height
      const centerY = screenHeight / 2

      tiles.forEach(tile => {
        for (let row = 0; row < ROWS; row++) {
          const targetY = centerY + (row - (ROWS - 1) / 2) * (SYMBOL_SIZE + SPACING)
          const dist = Math.abs(tile.sprite.y - targetY)

          if (dist < SYMBOL_SIZE / 2) {
            const positionKey = `${column}-${row}`
            if (currentLinePositions.has(positionKey)) {
              tile.resetTint()
            } else {
              tile.setTint(0x333333)
            }
            break
          }
        }
      })
    })
  }

  private clearWinEffects(): void {
    if (this.winLineSystem) {
      this.winLineSystem.clearLines()
    }
    this.currentWinningLines = []

    this.reels.forEach(reel => {
      reel.getTiles().forEach(tile => {
        tile.resetTint()
      })
    })
  }

  destroy() {
    this.winLineSystem.destroy()
    this.reels.forEach(reel => {
      reel.destroy()
    })
    this.reels = []
  }
}
