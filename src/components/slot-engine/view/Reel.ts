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
import type { SoundPlayer } from '../logic/soundPlayer'

export class Reel {
  private app: Application
  private container: Container
  private tiles: Tile[] = []
  private column: number
  private stopAnimation: AnimationSystem | null = null
  private scrolling: ScrollingSystem
  private config: SlotConfig
  private _soundPlayer: SoundPlayer | null // Reserved for future use (e.g., reel-specific sounds)

  private stateMachine = createActor(reelMachine)

  private speed: number = 0
  private get MAX_SPEED(): number {
    return this.config.SPIN_SPEED
  }
  private readonly ACCELERATION: number = 0.5

  private preStopCalculated: boolean = false
  private stopOvershoot: number = 0
  private previousState: string = 'idle'

  constructor(app: Application, container: Container, column: number, config: SlotConfig, soundPlayer?: SoundPlayer) {
    this.app = app
    this.container = container
    this.column = column
    this.config = config
    this._soundPlayer = soundPlayer || null
    this.scrolling = new ScrollingSystem(app, this.tiles, () => this.getRandomTextureId(), config)

    this.stateMachine.start()
    this.stateMachine.subscribe(this.handleStateChange.bind(this))
  }

  private handleStateChange(state: ReturnType<typeof this.stateMachine.getSnapshot>): void {
    const currentState = state.value as string
    
    if (currentState === 'idle' && this.previousState !== 'idle' && this._soundPlayer) {
      this._soundPlayer.play('spin-stop')
    }
    
    this.previousState = currentState
  }

  setSoundPlayer(soundPlayer: SoundPlayer | null): void {
    this._soundPlayer = soundPlayer
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
    const snapshot = this.stateMachine.getSnapshot()
    const stateValue = snapshot.value as string

    type StateHandler = (delta: number, snapshot: ReturnType<typeof this.stateMachine.getSnapshot>) => void
    const stateHandlers: Record<string, StateHandler> = {
      idle: () => this.handleIdleState(),
      accelerating: (d) => this.handleAcceleratingState(d),
      spinning: () => this.handleSpinningState(),
      pre_stop: (_d, s) => this.handlePreStopState(s),
      bounce: () => this.handleBounceState(),
    }

    const handler = stateHandlers[stateValue]
    if (handler) {
      handler(delta, snapshot)
    }
  }

  private handleIdleState(): void {
    this.speed = 0
  }

  private handleAcceleratingState(delta: number): void {
    this.speed += this.ACCELERATION * delta
    if (this.speed >= this.MAX_SPEED) {
      this.speed = this.MAX_SPEED
      this.stateMachine.send({ type: 'SPEED_REACHED' })
      this.scrolling.setBlur(true)
    }
    this.scrolling.updateWithSpeed(this.speed)
  }

  private handleSpinningState(): void {
    this.speed = this.MAX_SPEED
    this.scrolling.updateWithSpeed(this.speed)
  }

  private handlePreStopState(snapshot: ReturnType<typeof this.stateMachine.getSnapshot>): void {
    if (!this.preStopCalculated) {
      const targetIndex = snapshot.context.targetIndex
      if (targetIndex !== null) {
        this.scrolling.setTargetIndex(targetIndex)
        this.preStopCalculated = true
      }
    }

    const overshoot = this.scrolling.updateWithSpeed(this.MAX_SPEED)
    if (overshoot !== null) {
      this.stopOvershoot = overshoot
      this.stateMachine.send({ type: 'READY_TO_STOP' })
    }
  }

  private handleBounceState(): void {
    if (!this.stopAnimation) {
      const snapshot = this.stateMachine.getSnapshot()
      const targetIndex = snapshot.context.targetIndex
      if (targetIndex !== null) {
        this.scrolling.setBlur(false)
        this.stopAnimation = new AnimationSystem(this.app, this.tiles, this.config)
        this.stopAnimation.start(this.stopOvershoot)
      }
    }

    if (this.stopAnimation) {
      const isComplete = this.stopAnimation.update()
      if (isComplete) {
        this.stopAnimation = null
        this.stateMachine.send({ type: 'ANIMATION_DONE' })
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

  canStop(): boolean {
    const { context } = this.stateMachine.getSnapshot()
    if (context.spinStartTime === 0) return false
    return Date.now() - context.spinStartTime >= context.minSpinDuration
  }

  /**
   * Get center symbols (visible row symbols) for win detection
   * Returns array of textureIds for each visible row
   */
  getCenterSymbols(rows: number): number[] {
    const { SYMBOL_SIZE, SPACING } = this.config
    const centerY = this.app.screen.height / 2
    const symbols: number[] = []

    for (let row = 0; row < rows; row++) {
      const targetY = centerY + (row - (rows - 1) / 2) * (SYMBOL_SIZE + SPACING)
      const closestTile = this.tiles.reduce((closest, tile) => {
        const dist = Math.abs(tile.sprite.y - targetY)
        return dist < Math.abs(closest.sprite.y - targetY) ? tile : closest
      })
      symbols.push(closestTile.textureId)
    }

    return symbols
  }

  /**
   * Get all tiles
   */
  getTiles(): Tile[] {
    return this.tiles
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
