import { Application, Texture } from 'pixi.js'
import type { Tile } from '../view/Tile'
import type { SlotConfig } from '../logic/types'
import { BUFFER_COUNT } from '../logic/config'
import { getOriginalTexture } from '@/utils/preloadAssets'
import type { TileWithTarget } from '../view/types'

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
    this.tilesToStop = minimumRemainingSpins
  }

  update(): void {
    const { SPIN_SPEED } = this.config
    this.updateWithSpeed(SPIN_SPEED)
  }

  updateWithSpeed(speed: number): number | null {
    const { SYMBOL_SIZE } = this.config
    const screenHeight = this.app.screen.height
    const centerY = screenHeight / 2

    let overshoot: number | null = null

    for (let i = 0; i < this.tiles.length; i++) {
      this.tiles[i].sprite.y += speed
    }

    const tilesPerColumn = this.config.ROWS + BUFFER_COUNT
    const unitSize = SYMBOL_SIZE + this.config.SPACING
    const limitY = centerY + (tilesPerColumn * unitSize) / 2 - unitSize / 2

    for (let i = this.tiles.length - 1; i >= 0; i--) {
      if (this.tiles[i].sprite.y > limitY) {
        const tile = this.tiles.splice(i, 1)[0]

        let minY = Infinity
        this.tiles.forEach(t => (minY = Math.min(minY, t.sprite.y)))
        tile.sprite.y = minY - SYMBOL_SIZE - this.config.SPACING

        let textureId: number

        if (this.targetIndex !== null) {
          if (this.tilesToStop > 0) {
            this.tilesToStop--
            textureId = this.getRandomTextureId()
          } else if (this.tilesToStop === 0) {
            textureId = this.targetIndex
            ;(tile as TileWithTarget).isTarget = true
            this.tilesToStop = -1
          } else {
            textureId = this.getRandomTextureId()
          }
        } else {
          textureId = this.getRandomTextureId()
        }

        const newTexture = getOriginalTexture(textureId) as Texture
        if (newTexture) {
          tile.updateTexture(newTexture, textureId)
        }

        this.tiles.unshift(tile)
      }
    }

    const centerIndex = (tilesPerColumn - 1) / 2
    const stopIndex = Math.floor(tilesPerColumn / 2)
    const stopY = centerY + (stopIndex - centerIndex) * unitSize
    for (const tile of this.tiles) {
      if ((tile as TileWithTarget).isTarget) {
        if (tile.sprite.y >= stopY) {
          overshoot = tile.sprite.y - stopY
          break
        }
      }
    }

    if (overshoot !== null) {
      this.targetIndex = null
      this.tilesToStop = -1
      this.tiles.forEach(t => delete (t as TileWithTarget).isTarget)
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
