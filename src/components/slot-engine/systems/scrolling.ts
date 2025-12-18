import { Application, Texture } from 'pixi.js'
import type { Tile } from '../view/Tile'
import type { SlotConfig } from '../logic/types'
import { getOriginalTexture } from '@/utils/preloadAssets'

export class ScrollingSystem {
  private app: Application
  private tiles: Tile[]
  private getRandomTextureId: () => number
  private config: SlotConfig

  private targetIndex: number | null = null
  private tilesToStop: number = -1

  constructor(
    app: Application,
    tiles: Tile[],
    getRandomTextureId: () => number,
    config: SlotConfig
  ) {
    this.app = app
    this.tiles = tiles
    this.getRandomTextureId = getRandomTextureId
    this.config = config
  }

  updateConfig(config: SlotConfig) {
    this.config = config
  }

  setTargetIndex(index: number, minimumRemainingSpins: number = 5): void {
    this.targetIndex = index
    // Number of tiles to spawn before forcing the target
    this.tilesToStop = minimumRemainingSpins
  }

  /**
   * Update with fixed speed (backward compatible)
   */
  update(): void {
    const { SPIN_SPEED } = this.config
    this.updateWithSpeed(SPIN_SPEED)
  }

  /**
   * Update with variable speed (supports acceleration/deceleration)
   * @param speed Current speed (pixels per frame)
   * @returns number | null: The overshoot amount if stopped, null otherwise
   */
  updateWithSpeed(speed: number): number | null {
    const { SYMBOL_SIZE } = this.config
    const screenHeight = this.app.screen.height
    const centerY = screenHeight / 2

    let overshoot: number | null = null
    const boundaryY = screenHeight + SYMBOL_SIZE // Allow one full symbol below screen before recycling

    // Move all tiles down
    // Since we maintain 'tiles' array in physical order (Top -> Bottom),
    // we only need to iterate normally.
    for (let i = 0; i < this.tiles.length; i++) {
      this.tiles[i].sprite.y += speed
    }

    // Check the last tile (bottom-most)
    const bottomTile = this.tiles[this.tiles.length - 1]

    // If bottom tile goes out of bounds
    if (bottomTile.sprite.y > boundaryY) {
      // 1. Remove from bottom
      const recycledTile = this.tiles.pop()!

      // 2. Determine new Y position: precisely one SYMBOL_SIZE above the current top tile
      const currentTopTile = this.tiles[0]
      recycledTile.sprite.y = currentTopTile.sprite.y - SYMBOL_SIZE

      // 3. Determine new texture
      let newTextureId: number

      if (this.targetIndex !== null) {
        if (this.tilesToStop > 0) {
          this.tilesToStop--
          newTextureId = this.getRandomTextureId()
        } else if (this.tilesToStop === 0) {
          // Target!
          newTextureId = this.targetIndex
          ;(recycledTile as any).isTarget = true
          this.tilesToStop = -1
        } else {
          newTextureId = this.getRandomTextureId()
        }
      } else {
        newTextureId = this.getRandomTextureId()
      }

      // Update texture
      const newTexture = getOriginalTexture(newTextureId) as Texture
      if (newTexture) {
        recycledTile.updateTexture(newTexture, newTextureId)
      }

      // 4. Add to top
      this.tiles.unshift(recycledTile)
    }

    // Check stop condition
    // We iterate to find if the target tile has passed the center
    // Note: We only check tiles that are marked as target
    for (const tile of this.tiles) {
      if ((tile as any).isTarget) {
        if (tile.sprite.y >= centerY) {
          overshoot = tile.sprite.y - centerY
          break // Found it
        }
      }
    }

    if (overshoot !== null) {
      // Reset
      this.targetIndex = null
      this.tilesToStop = -1
      this.tiles.forEach(t => delete (t as any).isTarget)
      return overshoot
    }

    return null
  }
}
