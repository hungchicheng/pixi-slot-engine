import { Application, Texture } from 'pixi.js'
import { ReelTile } from './ReelTile'
import { SLOT_CONFIG } from '../config/slotConfig'
import { getOriginalTexture } from '@/utils/preloadAssets'
import { ReelPositioning } from './ReelPositioning'

export class ReelStopAnimation {
  private stopStartY: number = 0
  private stopTargetY: number = 0
  private stopStartTime: number = 0
  private app: Application
  private tiles: ReelTile[]

  constructor(app: Application, tiles: ReelTile[]) {
    this.app = app
    this.tiles = tiles
  }

  start(resultIndex: number): void {
    const { SYMBOL_SIZE } = SLOT_CONFIG
    const screenHeight = this.app.screen.height
    const centerY = screenHeight / 2

    // Find the tile currently closest to center (should be Tile 2 - middle visible)
    const centerTile = ReelPositioning.findClosestTileToCenter(this.tiles, centerY)

    // Calculate how much we need to move all tiles
    // resultIndex: 0 = top visible, 1 = middle visible, 2 = bottom visible
    // We want the result symbol at center (middle visible position)
    const currentCenterTileY = centerTile.sprite.y
    const targetCenterTileY = centerY - (resultIndex - 1) * SYMBOL_SIZE
    const totalOffset = targetCenterTileY - currentCenterTileY

    // Store initial positions for animation
    this.stopStartY = 0
    this.stopTargetY = totalOffset
    this.stopStartTime = Date.now()

    // Store initial tile positions
    this.tiles.forEach((tile) => {
      ;(tile as any).initialY = tile.sprite.y
    })

    // Ensure we have the correct texture at the target position
    this.ensureResultTexture(resultIndex)
  }

  update = (): boolean => {
    const { STOP_DURATION } = SLOT_CONFIG
    const elapsed = Date.now() - this.stopStartTime
    const progress = Math.min(elapsed / STOP_DURATION, 1)
    const easedProgress = progress // Linear easing (back.out temporarily disabled)

    // Calculate current offset with easing
    const currentOffset = this.stopStartY + (this.stopTargetY - this.stopStartY) * easedProgress

    // Move all tiles from their initial positions
    this.tiles.forEach((tile) => {
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
    const { SYMBOL_SIZE } = SLOT_CONFIG
    const screenHeight = this.app.screen.height
    const centerY = screenHeight / 2

    // resultIndex: 0 = top visible (Tile 1), 1 = middle visible (Tile 2), 2 = bottom visible (Tile 3)
    // We need to set the texture on the tile that will be at the target position
    const targetY = centerY - (resultIndex - 1) * SYMBOL_SIZE

    // Find the tile closest to target position
    let targetTile = this.tiles[0]
    let minDistance = Math.abs(this.tiles[0].sprite.y - targetY)

    this.tiles.forEach((tile) => {
      const distance = Math.abs(tile.sprite.y - targetY)
      if (distance < minDistance) {
        minDistance = distance
        targetTile = tile
      }
    })

    // Set the result texture
    const texture = getOriginalTexture(resultIndex) as Texture
    if (texture) {
      targetTile.updateTexture(texture, resultIndex)
    }
  }

  private finalize(): void {
    const screenHeight = this.app.screen.height
    const centerY = screenHeight / 2

    // Align tiles to exact positions
    ReelPositioning.alignTilesToCenter(this.tiles, centerY)

    // Clean up temporary properties
    this.tiles.forEach((tile) => {
      delete (tile as any).initialY
    })
  }
}

