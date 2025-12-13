import { Sprite, Texture } from 'pixi.js'
import type { ReelTile as IReelTile } from '../types'

export class ReelTile implements IReelTile {
  sprite: Sprite
  textureId: number
  column: number

  constructor(texture: Texture, textureId: number, column: number, x: number, y: number, size: number) {
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
    this.sprite.texture = texture
    this.textureId = textureId
  }

  destroy() {
    this.sprite.destroy()
  }
}

