import { Application, Texture } from 'pixi.js'
import type { Tile } from '../view/Tile'
import { SLOT_CONFIG } from '../logic/config'
import { getOriginalTexture } from '@/utils/preloadAssets'

export class ScrollingSystem {
  private app: Application
  private tiles: Tile[]
  private getRandomTextureId: () => number

  constructor(app: Application, tiles: Tile[], getRandomTextureId: () => number) {
    this.app = app
    this.tiles = tiles
    this.getRandomTextureId = getRandomTextureId
  }

  /**
   * Update with fixed speed (backward compatible)
   */
  update(): void {
    const { SPIN_SPEED } = SLOT_CONFIG
    this.updateWithSpeed(SPIN_SPEED)
  }

  /**
   * Update with variable speed (supports acceleration/deceleration)
   * @param speed Current speed (pixels per frame)
   */
  updateWithSpeed(speed: number): void {
    const { SYMBOL_SIZE } = SLOT_CONFIG
    const screenHeight = this.app.screen.height

    // Process each tile: move down and check boundary
    this.tiles.forEach((tile) => {
      const sprite = tile.sprite

      // Move tile down with current speed
      sprite.y += speed

      // Check if tile's bottom edge has completely passed the screen bottom
      // Since anchor is 0.5, bottom edge = sprite.y + SYMBOL_SIZE / 2
      const tileBottom = sprite.y + SYMBOL_SIZE / 2
      if (tileBottom > screenHeight) {
        // Find the topmost tile (the one with smallest y value)
        const topmostTile = this.tiles.reduce((top, current) => {
          return current.sprite.y < top.sprite.y ? current : top
        }, this.tiles[0])

        // Move to top (above the topmost tile by exactly SYMBOL_SIZE)
        // This ensures seamless connection: center-to-center distance = SYMBOL_SIZE
        sprite.y = topmostTile.sprite.y - SYMBOL_SIZE

        // Texture Swap: Change to random new texture for seamless infinite scrolling
        const newTextureId = this.getRandomTextureId()
        const newTexture = getOriginalTexture(newTextureId) as Texture
        if (newTexture) {
          tile.updateTexture(newTexture, newTextureId)
        }
      }
    })

    // Realign tiles every frame to maintain exact spacing (critical for high speeds)
    // This prevents gaps from appearing when speed is high
    this.realignTiles()
  }

  private realignTiles(): void {
    const { SYMBOL_SIZE } = SLOT_CONFIG

    // Sort tiles by Y position (ascending)
    const sortedTiles = [...this.tiles].sort((a, b) => a.sprite.y - b.sprite.y)

    // Realign tiles to maintain exact SYMBOL_SIZE spacing
    // Use the topmost tile as reference point
    const topmostY = sortedTiles[0].sprite.y

    sortedTiles.forEach((tile, index) => {
      // Calculate expected position: topmost + index * SYMBOL_SIZE
      const expectedY = topmostY + index * SYMBOL_SIZE
      const currentY = tile.sprite.y
      const drift = Math.abs(currentY - expectedY)

      // Only realign if drift is significant (more than 0.5px)
      // This prevents unnecessary position updates while maintaining precision
      if (drift > 0.5) {
        tile.sprite.y = expectedY
      }
    })
  }
}

