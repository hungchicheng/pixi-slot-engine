import { Application } from 'pixi.js'
import type { Tile } from '../view/Tile'
import { SLOT_CONFIG } from '../logic/config'

export class LayoutSystem {
  static calculateXPosition(app: Application, column: number): number {
    const { SYMBOL_SIZE, COLUMN_SPACING, COLUMNS } = SLOT_CONFIG
    const totalWidth = COLUMNS * SYMBOL_SIZE + (COLUMNS - 1) * COLUMN_SPACING
    const startX = (app.screen.width - totalWidth) / 2
    return startX + column * (SYMBOL_SIZE + COLUMN_SPACING) + SYMBOL_SIZE / 2
  }

  static findClosestTileToCenter(tiles: Tile[], centerY: number): Tile {
    return tiles.reduce((closest, current) => {
      const closestDist = Math.abs(closest.sprite.y - centerY)
      const currentDist = Math.abs(current.sprite.y - centerY)
      return currentDist < closestDist ? current : closest
    })
  }

  static alignTilesToCenter(tiles: Tile[], centerY: number): void {
    const { SYMBOL_SIZE } = SLOT_CONFIG

    // Re-align tiles to proper positions after stopping
    // Layout: Tile 0 (top buffer) -> Tile 1-3 (visible) -> Tile 4 (bottom buffer)
    // All tiles should be spaced exactly SYMBOL_SIZE apart (center to center)
    tiles.forEach((tile, index) => {
      if (index === 0) {
        // Tile 0: top buffer (above screen)
        tile.sprite.y = centerY - SYMBOL_SIZE * 2
      } else if (index === 1) {
        // Tile 1: first visible tile (top row)
        tile.sprite.y = centerY - SYMBOL_SIZE
      } else if (index === 2) {
        // Tile 2: second visible tile (middle row)
        tile.sprite.y = centerY
      } else if (index === 3) {
        // Tile 3: third visible tile (bottom row)
        tile.sprite.y = centerY + SYMBOL_SIZE
      } else {
        // Tile 4: bottom buffer (below screen)
        tile.sprite.y = centerY + SYMBOL_SIZE * 2
      }
    })
  }

  static updateTileXPositions(tiles: Tile[], app: Application, column: number): void {
    const x = this.calculateXPosition(app, column)

    tiles.forEach((tile) => {
      tile.sprite.x = x
    })
  }
}

