import { Application, Texture } from 'pixi.js'
import type { Tile } from '../view/Tile'
import { SLOT_CONFIG } from '../logic/config'
import { getOriginalTexture } from '@/utils/preloadAssets'
import { LayoutSystem } from './layout'

export class AnimationSystem {
  private stopStartY: number = 0
  private stopTargetY: number = 0
  private stopStartTime: number = 0
  private app: Application
  private tiles: Tile[]

  constructor(app: Application, tiles: Tile[]) {
    this.app = app
    this.tiles = tiles
  }

  start(resultIndex: number): void {
    const { SYMBOL_SIZE } = SLOT_CONFIG

    // Start slightly above for landing effect
    const BOUNCE_HEIGHT = -SYMBOL_SIZE * 0.5

    this.stopStartY = BOUNCE_HEIGHT
    this.stopTargetY = 0
    this.stopStartTime = Date.now()

    // Store initial tile positions
    this.tiles.forEach(tile => {
      ;(tile as any).initialY = tile.sprite.y
    })

    // Ensure we have the correct texture at the center
    this.ensureResultTexture(resultIndex)
  }

  update = (): boolean => {
    const { STOP_DURATION } = SLOT_CONFIG
    const elapsed = Date.now() - this.stopStartTime
    const progress = Math.min(elapsed / STOP_DURATION, 1)

    // Back Out Easing
    const c1 = 1.70158
    const c3 = c1 + 1
    const x = progress
    const easedProgress = 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2)

    // Calculate current offset with easing
    const currentOffset = this.stopStartY + (this.stopTargetY - this.stopStartY) * easedProgress

    // Move all tiles from their initial positions
    this.tiles.forEach(tile => {
      const initialY = (tile as any).initialY
      if (initialY !== undefined) {
        tile.sprite.y = initialY + currentOffset
      }
    })

    // Return true if animation is complete
    if (progress >= 1) {
      this.finalize()
      return true
    }

    return false
  }

  private ensureResultTexture(resultIndex: number): void {
    const screenHeight = this.app.screen.height
    const centerY = screenHeight / 2

    // Find center tile and update texture
    const targetTile = LayoutSystem.findClosestTileToCenter(this.tiles, centerY)

    const texture = getOriginalTexture(resultIndex) as Texture
    if (texture) {
      targetTile.updateTexture(texture, resultIndex)
    }
  }

  private finalize(): void {
    const screenHeight = this.app.screen.height
    const centerY = screenHeight / 2

    // Align tiles to exact positions
    LayoutSystem.alignTilesToCenter(this.tiles, centerY)

    // Clean up temporary properties
    this.tiles.forEach(tile => {
      delete (tile as any).initialY
    })
  }
}
