import { Application, Container } from 'pixi.js'
import { SlotStage } from '../view/SlotStage'
import { GameLoop } from './GameLoop'
import type { SlotConfig } from '../logic/types'

export class SlotEngine {
  private app: Application
  private container: Container
  private slotStage: SlotStage
  private gameLoop: GameLoop
  private config: SlotConfig

  constructor(app: Application, config: SlotConfig) {
    this.app = app
    this.config = config
    this.container = new Container()
    this.app.stage.addChild(this.container)

    this.slotStage = new SlotStage(this.app, this.container, config)
    this.gameLoop = new GameLoop(this.app, this.slotStage)
  }

  getConfig(): SlotConfig {
    return this.config
  }

  updateConfig(config: SlotConfig) {
    this.config = config
    this.slotStage.updateConfig(config)
  }

  async initialize() {
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
    }
  }

  startSpin() {
    this.slotStage.startSpin()
  }

  stopSpin(resultIndices: number[]) {
    this.slotStage.stopSpin(resultIndices)
  }

  getStates(): string[] {
    return this.slotStage.getStates()
  }

  destroy() {
    this.gameLoop.stop()
    this.slotStage.destroy()
    this.container.destroy()
  }
}
