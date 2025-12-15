import { Application, Container, Texture } from 'pixi.js'
import { createActor } from 'xstate'
import { Tile } from './Tile'
import { SLOT_CONFIG } from '../logic/config'
import { getOriginalTexture, symbolImages } from '@/utils/preloadAssets'
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

  // State machine
  private stateMachine = createActor(reelMachine)

  // Physics variables
  private speed: number = 0
  private readonly MAX_SPEED: number = SLOT_CONFIG.SPIN_SPEED
  private readonly ACCELERATION: number = 0.5 // Acceleration per frame
  private readonly DECELERATION_FACTOR: number = 0.95 // Deceleration factor
  private readonly MIN_SPEED: number = 0.1 // Minimum speed threshold

  // Pre-stop phase calculation variables
  private preStopCalculated: boolean = false

  constructor(app: Application, container: Container, column: number) {
    this.app = app
    this.container = container
    this.column = column
    this.scrolling = new ScrollingSystem(app, this.tiles, () => this.getRandomTextureId())

    // Start the state machine
    this.stateMachine.start()
  }

  initialize(): void {
    const { SYMBOL_SIZE, TILES_PER_COLUMN } = SLOT_CONFIG
    const x = LayoutSystem.calculateXPosition(this.app, this.column)
    const screenHeight = this.app.screen.height
    const centerY = screenHeight / 2

    // Create tiles: 1 top buffer + 3 visible + 1 bottom buffer
    for (let row = 0; row < TILES_PER_COLUMN; row++) {
      const textureId = this.getRandomTextureId()
      const texture = getOriginalTexture(textureId) as Texture
      if (!texture) continue

      let y: number
      if (row === 0) {
        // Top buffer: above the visible area
        y = centerY - SYMBOL_SIZE * 2
      } else if (row === 1) {
        // First visible tile (top row)
        y = centerY - SYMBOL_SIZE
      } else if (row === 2) {
        // Second visible tile (middle row)
        y = centerY
      } else if (row === 3) {
        // Third visible tile (bottom row)
        y = centerY + SYMBOL_SIZE
      } else {
        // Bottom buffer: below the visible area
        y = centerY + SYMBOL_SIZE * 2
      }

      // Generate sequence number: column * 1000 + row (to ensure uniqueness)
      const sequenceNumber = this.column * 1000 + row

      const tile = new Tile(texture, textureId, this.column, x, y, SYMBOL_SIZE, sequenceNumber)
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
      }
      // Execute scrolling
      this.scrolling.updateWithSpeed(this.speed)
    } else if (stateValue === 'spinning') {
      // Spinning phase: maintain maximum speed
      this.speed = this.MAX_SPEED
      this.scrolling.updateWithSpeed(this.speed)
      // Note: Spin duration is checked by Guard on STOP_COMMAND event, using Date.now() - context.spinStartTime
    } else if (stateValue === 'pre_stop') {
      // Pre-stop phase: calculate distance needed for alignment
      if (!this.preStopCalculated) {
        const targetIndex = currentState.context.targetIndex
        if (targetIndex !== null) {
          // this.calculatePreStopDistance(targetIndex)
          this.preStopCalculated = true
          // Notify state machine: calculation complete, can start deceleration
          this.stateMachine.send({ type: 'READY_TO_DECEL' })
        }
      }
      // Continue scrolling at maximum speed until deceleration starts
      this.scrolling.updateWithSpeed(this.MAX_SPEED)
    } else if (stateValue === 'decelerating') {
      // Deceleration phase
      this.speed *= this.DECELERATION_FACTOR
      if (this.speed < this.MIN_SPEED) {
        this.speed = 0
        // Force alignment to grid
        this.snapToGrid()
        this.stateMachine.send({ type: 'STOPPED' })
      } else {
        this.scrolling.updateWithSpeed(this.speed)
      }
    } else if (stateValue === 'bounce') {
      // Bounce animation phase
      if (!this.stopAnimation) {
        const targetIndex = currentState.context.targetIndex
        if (targetIndex !== null) {
          this.stopAnimation = new AnimationSystem(this.app, this.tiles)
          this.stopAnimation.start(targetIndex)
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

  /**
   * Force alignment to grid
   */
  private snapToGrid(): void {
    const screenHeight = this.app.screen.height
    const centerY = screenHeight / 2
    LayoutSystem.alignTilesToCenter(this.tiles, centerY)
  }

  updatePositions(): void {
    LayoutSystem.updateTileXPositions(this.tiles, this.app, this.column)
  }

  private getRandomTextureId(): number {
    return Math.floor(Math.random() * symbolImages.length)
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
