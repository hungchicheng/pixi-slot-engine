import { Application, Texture } from 'pixi.js'
import type { Tile } from '../view/Tile'
import type { SlotConfig } from '../logic/types'
import { BUFFER_COUNT } from '../logic/config'
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

    // Move all tiles down
    for (let i = 0; i < this.tiles.length; i++) {
      this.tiles[i].sprite.y += speed
    }

    // Recycle tiles that moved off-screen
    const tilesPerColumn = this.config.ROWS + BUFFER_COUNT
    const unitSize = SYMBOL_SIZE + this.config.SPACING

    // limitY: slightly above the exact half-point to correct downward drift
    // Adjust by -0.5 unit to match the Idle Bottom position exactly
    const limitY = centerY + (tilesPerColumn * unitSize) / 2 - unitSize / 2

    for (let i = this.tiles.length - 1; i >= 0; i--) {
      if (this.tiles[i].sprite.y > limitY) {
        const tile = this.tiles.splice(i, 1)[0]

        // Find top-most tile position
        let minY = Infinity
        this.tiles.forEach(t => (minY = Math.min(minY, t.sprite.y)))

        // Place new tile above the top-most one
        tile.sprite.y = minY - SYMBOL_SIZE - this.config.SPACING

        // Determine texture
        let textureId: number

        if (this.targetIndex !== null) {
          if (this.tilesToStop > 0) {
            this.tilesToStop--
            textureId = this.getRandomTextureId()
          } else if (this.tilesToStop === 0) {
            // Target!
            textureId = this.targetIndex
            ;(tile as any).isTarget = true
            this.tilesToStop = -1
          } else {
            textureId = this.getRandomTextureId()
          }
        } else {
          textureId = this.getRandomTextureId()
        }

        // Update texture
        const newTexture = getOriginalTexture(textureId) as Texture
        if (newTexture) {
          tile.updateTexture(newTexture, textureId)
        }

        this.tiles.unshift(tile)
      }
    }

    // Check stop condition
    // Calculate the Y position where the "Target Tile" should land.
    const centerIndex = (tilesPerColumn - 1) / 2
    const stopIndex = Math.floor(tilesPerColumn / 2)

    // The precise Y position where the target tile should stop to align the grid correctly
    const stopY = centerY + (stopIndex - centerIndex) * unitSize

    // We iterate to find if the target tile has passed the stop line
    for (const tile of this.tiles) {
      if ((tile as any).isTarget) {
        if (tile.sprite.y >= stopY) {
          overshoot = tile.sprite.y - stopY
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

  setBlur(enabled: boolean) {
    this.tiles.forEach(tile => {
      if (enabled) {
        tile.blur()
      } else {
        tile.unblur()
      }
    })
  }
}
