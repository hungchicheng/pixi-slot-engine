import { Application, Container, Texture } from 'pixi.js'
import { ReelTile } from './ReelTile'
import { SLOT_CONFIG } from '../config/slotConfig'
import { getOriginalTexture, symbolImages } from '@/utils/preloadAssets'
import { ReelPositioning } from './ReelPositioning'
import { ReelStopAnimation } from './ReelStopAnimation'
import { ReelScrolling } from './ReelScrolling'

export class Reel {
  private app: Application
  private container: Container
  private tiles: ReelTile[] = []
  private column: number
  private isSpinning: boolean = false
  private isStopping: boolean = false
  private stopAnimation: ReelStopAnimation | null = null
  private scrolling: ReelScrolling

  constructor(app: Application, container: Container, column: number) {
    this.app = app
    this.container = container
    this.column = column
    this.scrolling = new ReelScrolling(app, this.tiles, () => this.getRandomTextureId())
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
    this.isSpinning = true
    this.isStopping = false
    this.stopAnimation = null
  }

  stopSpin(resultIndex: number): void {
    if (!this.isSpinning) return

    this.isStopping = true
    this.isSpinning = false
    this.stopAnimation = new ReelStopAnimation(this.app, this.tiles)
    this.stopAnimation.start(resultIndex)
  }

  update = (): void => {
    if (this.isStopping && this.stopAnimation) {
      const isComplete = this.stopAnimation.update()
      if (isComplete) {
        this.isStopping = false
        this.stopAnimation = null
      }
    } else if (this.isSpinning) {
      this.scrolling.update()
    }
    // If not spinning and not stopping, do nothing (static display)
  }

  updatePositions(): void {
    ReelPositioning.updateTileXPositions(this.tiles, this.app, this.column)
  }

  private getRandomTextureId(): number {
    return Math.floor(Math.random() * symbolImages.length)
  }

  destroy(): void {
    this.tiles.forEach((tile) => {
      tile.destroy()
    })
    this.tiles = []
  }
}
