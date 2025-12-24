import { Sprite, Texture } from 'pixi.js'
import type { ReelTile as IReelTile } from './types'
import { getOriginalTexture, getBlurredTexture } from '@/utils/preloadAssets'

export class Tile implements IReelTile {
  sprite: Sprite
  textureId: number
  column: number
  private isBlurred: boolean = false
  private size: number
  constructor(
    texture: Texture,
    textureId: number,
    column: number,
    x: number,
    y: number,
    size: number
  ) {
    this.size = size
    this.sprite = new Sprite(texture)
    this.sprite.anchor.set(0.5)
    this.sprite.width = size
    this.sprite.height = size
    this.sprite.x = x
    this.sprite.y = y

    this.textureId = textureId
    this.column = column
  }

  updateTexture(texture: Texture, textureId: number) {
    this.textureId = textureId
    if (this.isBlurred) {
      const blurred = getBlurredTexture(textureId)
      if (blurred) {
        this.sprite.texture = blurred
        this.sprite.height = this.size * 1.2
        return
      }
    }
    this.sprite.texture = texture
    this.sprite.height = this.size
  }

  blur() {
    if (this.isBlurred) return
    this.isBlurred = true
    const blurred = getBlurredTexture(this.textureId)
    if (blurred) {
      this.sprite.texture = blurred
      this.sprite.height = this.size * 1.2
    }
  }

  unblur() {
    if (!this.isBlurred) return
    this.isBlurred = false
    const original = getOriginalTexture(this.textureId)
    if (original) {
      this.sprite.texture = original
      this.sprite.height = this.size
    }
  }

  /**
   * Apply tint to darken the tile (for non-winning symbols)
   * @param tint - Tint value (0x000000 = black/dark, 0xffffff = no tint)
   */
  setTint(tint: number = 0x666666): void {
    this.sprite.tint = tint
  }

  /**
   * Reset tint to normal (white = no tint)
   */
  resetTint(): void {
    this.sprite.tint = 0xffffff
  }

  destroy() {
    this.sprite.destroy()
  }
}
