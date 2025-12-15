import { Application, Container } from 'pixi.js'
import { SlotStage } from '../view/SlotStage'
import { GameLoop } from './GameLoop'

export class SlotEngine {
  private app: Application
  private container: Container
  private slotStage: SlotStage
  private gameLoop: GameLoop

  constructor(app: Application) {
    this.app = app
    this.container = new Container()
    this.app.stage.addChild(this.container)

    this.slotStage = new SlotStage(this.app, this.container)
    this.gameLoop = new GameLoop(this.app, this.slotStage)
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

  destroy() {
    this.gameLoop.stop()
    this.slotStage.destroy()
    this.container.destroy()
  }
}

