import { Application, Container, Texture } from 'pixi.js'
import { ReelTile } from './ReelTile'
import { SLOT_CONFIG } from '../config/slotConfig'
import { getOriginalTexture, symbolImages } from '../../../utils/preloadAssets'

export class Reel {
  private app: Application
  private container: Container
  private tiles: ReelTile[] = []
  private column: number

  constructor(app: Application, container: Container, column: number) {
    this.app = app
    this.container = container
    this.column = column
  }

  initialize() {
    const { SYMBOL_SIZE, SPACING, TILES_PER_COLUMN } = SLOT_CONFIG
    const tileHeight = SYMBOL_SIZE + SPACING

    // Calculate x position for this column
    const totalWidth = SLOT_CONFIG.COLUMNS * SYMBOL_SIZE + (SLOT_CONFIG.COLUMNS - 1) * SPACING
    const startX = (this.app.screen.width - totalWidth) / 2
    const x = startX + this.column * (SYMBOL_SIZE + SPACING) + SYMBOL_SIZE / 2

    // Create tiles for this column
    for (let row = 0; row < TILES_PER_COLUMN; row++) {
      const textureId = this.getRandomTextureId()
      const texture = getOriginalTexture(textureId) as Texture
      if (!texture) continue

      // Position tiles starting from above screen for seamless scrolling
      const y = row * tileHeight + SYMBOL_SIZE / 2 - tileHeight * 2

      const tile = new ReelTile(texture, textureId, this.column, x, y, SYMBOL_SIZE)
      this.tiles.push(tile)
      this.container.addChild(tile.sprite)
    }
  }

  update() {
    const { SYMBOL_SIZE, SPACING, SCROLL_SPEED } = SLOT_CONFIG
    const tileHeight = SYMBOL_SIZE + SPACING
    const screenHeight = this.app.screen.height
    const self = this

    function updateTile(tile: ReelTile) {
      const sprite = tile.sprite

      // Move tile down
      sprite.y += SCROLL_SPEED

      // Check if tile moved out of bottom (y > height)
      if (sprite.y > screenHeight + SYMBOL_SIZE / 2) {
        // Find the topmost tile in this column
        function findTopmost(top: ReelTile, current: ReelTile) {
          return current.sprite.y < top.sprite.y ? current : top
        }

        const topmostTile = self.tiles.reduce(findTopmost)

        // Move to top (above the topmost tile)
        sprite.y = topmostTile.sprite.y - tileHeight

        // Change texture ID (Tile Swapping) - get random new texture
        const newTextureId = self.getRandomTextureId()
        const newTexture = getOriginalTexture(newTextureId) as Texture
        if (newTexture) {
          tile.updateTexture(newTexture, newTextureId)
        }
      }
    }

    this.tiles.forEach(updateTile)
  }

  updatePositions() {
    const { SYMBOL_SIZE, SPACING } = SLOT_CONFIG
    const totalWidth = SLOT_CONFIG.COLUMNS * SYMBOL_SIZE + (SLOT_CONFIG.COLUMNS - 1) * SPACING
    const startX = (this.app.screen.width - totalWidth) / 2
    const x = startX + this.column * (SYMBOL_SIZE + SPACING) + SYMBOL_SIZE / 2

    function updatePosition(tile: ReelTile) {
      tile.sprite.x = x
    }

    this.tiles.forEach(updatePosition)
  }

  private getRandomTextureId() {
    return Math.floor(Math.random() * symbolImages.length)
  }

  destroy() {
    function destroyTile(tile: ReelTile) {
      tile.destroy()
    }

    this.tiles.forEach(destroyTile)
    this.tiles = []
  }
}

