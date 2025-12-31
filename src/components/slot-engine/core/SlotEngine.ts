import { Application, Container, Graphics } from 'pixi.js'
import { SlotStage } from '../view/SlotStage'
import { GameLoop } from './GameLoop'
import type { SlotConfig } from '../logic/types'
import type { SoundPlayer } from '../logic/soundPlayer'

export class SlotEngine {
  private app: Application
  private container: Container
  private mask: Graphics
  private slotStage: SlotStage
  private gameLoop: GameLoop
  private config: SlotConfig
  private soundPlayer: SoundPlayer | null

  constructor(app: Application, config: SlotConfig, soundPlayer?: SoundPlayer) {
    this.app = app
    this.config = config
    this.soundPlayer = soundPlayer || null
    this.container = new Container()
    this.app.stage.addChild(this.container)

    this.mask = new Graphics()
    this.container.mask = this.mask
    this.app.stage.addChild(this.mask)

    this.slotStage = new SlotStage(this.app, this.container, config, this.soundPlayer || undefined)
    this.gameLoop = new GameLoop(this.app, this.slotStage)
  }

  getConfig() {
    return this.config
  }

  updateConfig(config: SlotConfig) {
    this.config = config
    this.slotStage.updateConfig(config)
    this.updateMask()
  }

  async initialize() {
    this.updateMask()
    this.slotStage.initialize()
    this.gameLoop.start()
  }

  pause() {
    this.gameLoop.pause()
  }

  resume() {
    this.gameLoop.resume()
  }

  handleResize() {
    if (this.app) {
      this.slotStage.updatePositions()
      this.updateMask()
    }
  }

  private updateMask() {
    const { SYMBOL_SIZE, ROWS, COLUMNS, COLUMN_SPACING } = this.config
    const screenWidth = this.app.screen.width
    const screenHeight = this.app.screen.height
    const centerY = screenHeight / 2

    // Calculate total width of the reel area
    const totalWidth = COLUMNS * SYMBOL_SIZE + (COLUMNS - 1) * COLUMN_SPACING
    const startX = (screenWidth - totalWidth) / 2

    // Calculate total height of the visible area
    const visibleHeight = ROWS * SYMBOL_SIZE
    const startY = centerY - visibleHeight / 2

    this.mask.clear()
    this.mask.beginFill(0xffffff)
    this.mask.drawRect(startX, startY, totalWidth, visibleHeight)
    this.mask.endFill()
  }

  startSpin() {
    this.slotStage.startSpin()
  }

  stopSpin(resultIndices: number[]) {
    this.slotStage.stopSpin(resultIndices)
  }

  getStates() {
    return this.slotStage.getStates()
  }

  canStop() {
    return this.slotStage.canStop()
  }

  getWinningLines() {
    return this.slotStage.getWinningLines()
  }

  hasJustWon() {
    return this.slotStage.getHasJustWon()
  }

  setOnSpinCompleteCallback(callback: (winningLines: any[]) => void) {
    this.slotStage.setOnSpinCompleteCallback(callback)
  }

  destroy() {
    this.gameLoop.stop()
    this.slotStage.destroy()
    this.container.destroy()
  }
}
