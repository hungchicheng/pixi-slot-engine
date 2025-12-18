import { Application, Container, Texture } from 'pixi.js'
import { createActor } from 'xstate'
import { Tile } from './Tile'
import type { SlotConfig } from '../logic/types'
import { getOriginalTexture, symbolImages } from '@/utils/preloadAssets'
import { BUFFER_COUNT } from '../logic/config'
import { LayoutSystem } from '../systems/layout'
import { AnimationSystem } from '../systems/animation'
import { ScrollingSystem } from '../systems/scrolling'
import { reelMachine } from '../logic/reelMachine'

export class Reel {
  private app: Application
  private container: Container
  private tiles: Tile[] = []
  private column: number
  private stopAnimation: AnimationSystem | null = null
  private scrolling: ScrollingSystem
  private config: SlotConfig

  private stateMachine = createActor(reelMachine)

  private speed: number = 0
  private get MAX_SPEED(): number {
    return this.config.SPIN_SPEED
  }
  private readonly ACCELERATION: number = 0.5

  private preStopCalculated: boolean = false
  private stopOvershoot: number = 0

  constructor(app: Application, container: Container, column: number, config: SlotConfig) {
    this.app = app
    this.container = container
    this.column = column
    this.config = config
    this.scrolling = new ScrollingSystem(app, this.tiles, () => this.getRandomTextureId(), config)

    this.stateMachine.start()
  }

  updateConfig(config: SlotConfig) {
    this.config = config
    this.scrolling.updateConfig(config)
  }

  initialize(): void {
    const { SYMBOL_SIZE, ROWS, SPACING } = this.config
    const tilesPerColumn = ROWS + BUFFER_COUNT
    const x = LayoutSystem.calculateXPosition(this.app, this.column, this.config)
    const screenHeight = this.app.screen.height
    const centerY = screenHeight / 2
    // Center index pivot (can be fractional for even rows, e.g. 2.5 for 6 tiles)
    const centerIndex = (tilesPerColumn - 1) / 2

    // Create tiles: 1 top buffer + N visible + 1 bottom buffer
    for (let row = 0; row < tilesPerColumn; row++) {
      const textureId = this.getRandomTextureId()
      const texture = getOriginalTexture(textureId) as Texture
      if (!texture) continue

      // Calculate Y position relative to center
      // row 0 is top-most. centerIndex is the tile at the center.
      const y = centerY + (row - centerIndex) * (SYMBOL_SIZE + SPACING)

      const tile = new Tile(texture, textureId, this.column, x, y, SYMBOL_SIZE)
      this.tiles.push(tile)
      this.container.addChild(tile.sprite)
    }
  }

  startSpin(): void {
    this.stateMachine.send({ type: 'START' })
    this.speed = 0
    this.preStopCalculated = false
  }

  stopSpin(resultIndex: number): void {
    // Send STOP_COMMAND event to state machine
    // State machine will check Guard (e.g., minimum spin duration) to decide whether to accept
    this.stateMachine.send({ type: 'STOP_COMMAND', resultIndex })
  }

  update = (delta: number = 1): void => {
    const currentState = this.stateMachine.getSnapshot()
    const stateValue = currentState.value as string

    // Execute corresponding physics logic based on XState state
    if (stateValue === 'idle') {
      this.speed = 0
    } else if (stateValue === 'accelerating') {
      // Acceleration phase
      this.speed += this.ACCELERATION * delta
      if (this.speed >= this.MAX_SPEED) {
        this.speed = this.MAX_SPEED
        // Notify state machine: speed has reached maximum
        this.stateMachine.send({ type: 'SPEED_REACHED' })
        // Apply blur when reaching high speed
        this.scrolling.setBlur(true)
      }
      // Execute scrolling
      this.scrolling.updateWithSpeed(this.speed)
    } else if (stateValue === 'spinning') {
      // Spinning phase: maintain maximum speed
      this.speed = this.MAX_SPEED
      this.scrolling.updateWithSpeed(this.speed)
      // Note: Spin duration is checked by Guard on STOP_COMMAND event, using Date.now() - context.spinStartTime
    } else if (stateValue === 'pre_stop') {
      // Pre-stop phase: Spin to target symbol
      if (!this.preStopCalculated) {
        const targetIndex = currentState.context.targetIndex
        if (targetIndex !== null) {
          // Tell scrolling system to prepare to stop at this index
          this.scrolling.setTargetIndex(targetIndex)
          this.preStopCalculated = true
        }
      }

      // Continue spinning until target arrives and passes center
      const overshoot = this.scrolling.updateWithSpeed(this.MAX_SPEED)

      if (overshoot !== null) {
        this.stopOvershoot = overshoot
        this.stateMachine.send({ type: 'READY_TO_STOP' })
      }
    } else if (stateValue === 'bounce') {
      // Bounce animation phase
      if (!this.stopAnimation) {
        const targetIndex = currentState.context.targetIndex
        if (targetIndex !== null) {
          // Unblur before starting stop animation
          this.scrolling.setBlur(false)
          this.stopAnimation = new AnimationSystem(this.app, this.tiles, this.config)
          this.stopAnimation.start(this.stopOvershoot)
        }
      }

      if (this.stopAnimation) {
        const isComplete = this.stopAnimation.update()
        if (isComplete) {
          this.stopAnimation = null
          // Notify state machine: animation complete
          this.stateMachine.send({ type: 'ANIMATION_DONE' })
        }
      }
    }
  }

  updatePositions(): void {
    LayoutSystem.updateTileXPositions(this.tiles, this.app, this.column, this.config)
  }

  private getRandomTextureId(): number {
    return Math.floor(Math.random() * symbolImages.length)
  }

  getState(): string {
    return this.stateMachine.getSnapshot().value as string
  }

  destroy(): void {
    // Stop the state machine
    this.stateMachine.stop()

    this.tiles.forEach(tile => {
      tile.destroy()
    })
    this.tiles = []
  }
}
