import { Application, Container, Texture } from 'pixi.js'
import { createActor } from 'xstate'
import { ReelTile } from './ReelTile'
import { SLOT_CONFIG } from '../config/slotConfig'
import { getOriginalTexture, symbolImages } from '@/utils/preloadAssets'
import { ReelPositioning } from './ReelPositioning'
import { ReelStopAnimation } from './ReelStopAnimation'
import { ReelScrolling } from './ReelScrolling'
import { reelMachine } from './reelMachine'

export class Reel {
  private app: Application
  private container: Container
  private tiles: ReelTile[] = []
  private column: number
  private stopAnimation: ReelStopAnimation | null = null
  private scrolling: ReelScrolling
  
  // XState state machine instance (brain)
  private stateMachine = createActor(reelMachine)
  
  // Physical variables (muscle) - not in XState context for high performance
  private speed: number = 0
  private readonly MAX_SPEED: number = SLOT_CONFIG.SPIN_SPEED
  private readonly ACCELERATION: number = 0.5 // Acceleration per frame
  private readonly DECELERATION_FACTOR: number = 0.95 // Deceleration factor
  private readonly MIN_SPEED: number = 0.1 // Minimum speed threshold
  
  // Pre-stop phase calculation variables
  private preStopDistance: number = 0
  private preStopCalculated: boolean = false
  
  // Time tracking (for Guard checks)
  private spinStartTime: number = 0

  constructor(app: Application, container: Container, column: number) {
    this.app = app
    this.container = container
    this.column = column
    this.scrolling = new ReelScrolling(app, this.tiles, () => this.getRandomTextureId())
    
    // Start the state machine
    this.stateMachine.start()
  }

  initialize(): void {
    const { SYMBOL_SIZE, TILES_PER_COLUMN } = SLOT_CONFIG
    const x = ReelPositioning.calculateXPosition(this.app, this.column)
    const screenHeight = this.app.screen.height
    const centerY = screenHeight / 2

    // Create 5 tiles: 1 top buffer + 3 visible + 1 bottom buffer
    // Layout: Tile 0 (top buffer) -> Tile 1-3 (visible) -> Tile 4 (bottom buffer)
    for (let row = 0; row < TILES_PER_COLUMN; row++) {
      const textureId = this.getRandomTextureId()
      const texture = getOriginalTexture(textureId) as Texture
      if (!texture) continue

      // Calculate Y position:
      // Tile 0: top buffer (above screen)
      // Tile 1-3: visible area (centered around screen center)
      // Tile 4: bottom buffer (below screen)
      // All tiles should be spaced exactly SYMBOL_SIZE apart (center to center)
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

      const tile = new ReelTile(texture, textureId, this.column, x, y, SYMBOL_SIZE, sequenceNumber)
      this.tiles.push(tile)
      this.container.addChild(tile.sprite)
    }
  }

  startSpin(): void {
    // Send START event to state machine (will automatically call recordSpinStart action)
    this.stateMachine.send({ type: 'START' })
    this.speed = 0
    this.preStopCalculated = false
    this.spinStartTime = Date.now()
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
          this.calculatePreStopDistance(targetIndex)
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
        // Notify state machine: stopped
        this.stateMachine.send({ type: 'STOPPED' })
      } else {
        this.scrolling.updateWithSpeed(this.speed)
      }
    } else if (stateValue === 'bounce') {
      // Bounce animation phase
      if (!this.stopAnimation) {
        const targetIndex = currentState.context.targetIndex
        if (targetIndex !== null) {
          this.stopAnimation = new ReelStopAnimation(this.app, this.tiles)
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
   * Calculate the distance needed to move in pre-stop phase
   */
  private calculatePreStopDistance(targetIndex: number): void {
    const { SYMBOL_SIZE } = SLOT_CONFIG
    const screenHeight = this.app.screen.height
    const centerY = screenHeight / 2
    
    // Find the tile currently closest to center
    const centerTile = ReelPositioning.findClosestTileToCenter(this.tiles, centerY)
    
    // Calculate target position
    // targetIndex: 0 = top visible, 1 = middle visible, 2 = bottom visible
    // We want the result symbol at center (middle visible position)
    const currentCenterTileY = centerTile.sprite.y
    const targetCenterTileY = centerY - (targetIndex - 1) * SYMBOL_SIZE
    this.preStopDistance = targetCenterTileY - currentCenterTileY
  }
  
  /**
   * Force alignment to grid
   */
  private snapToGrid(): void {
    const screenHeight = this.app.screen.height
    const centerY = screenHeight / 2
    ReelPositioning.alignTilesToCenter(this.tiles, centerY)
  }

  updatePositions(): void {
    ReelPositioning.updateTileXPositions(this.tiles, this.app, this.column)
  }

  private getRandomTextureId(): number {
    return Math.floor(Math.random() * symbolImages.length)
  }

  destroy(): void {
    // Stop the state machine
    this.stateMachine.stop()
    
    this.tiles.forEach((tile) => {
      tile.destroy()
    })
    this.tiles = []
  }
}
