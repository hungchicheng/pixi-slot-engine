import { Sprite, Texture, Text, TextStyle } from 'pixi.js'
import type { ReelTile as IReelTile } from './types'
import { getOriginalTexture, getBlurredTexture } from '@/utils/preloadAssets'

export class Tile implements IReelTile {
  sprite: Sprite
  textureId: number
  column: number
  private sequenceNumber: number
  private sequenceText: Text
  private isBlurred: boolean = false

  private size: number

  constructor(
    texture: Texture,
    textureId: number,
    column: number,
    x: number,
    y: number,
    size: number,
    sequenceNumber: number
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
    this.sequenceNumber = sequenceNumber

    // Create sequence number text
    const textStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 24,
      fill: 0xffffff,
      stroke: 0x000000,
      strokeThickness: 2,
      align: 'center',
    })

    this.sequenceText = new Text(sequenceNumber.toString(), textStyle)
    this.sequenceText.anchor.set(0.5)
    this.sequenceText.x = 0
    this.sequenceText.y = 0

    // Add text to sprite container
    this.sprite.addChild(this.sequenceText)
  }

  getSequenceNumber(): number {
    return this.sequenceNumber
  }

  updateTexture(texture: Texture, textureId: number) {
    this.textureId = textureId
    if (this.isBlurred) {
      const blurred = getBlurredTexture(textureId)
      if (blurred) {
        this.sprite.texture = blurred
        this.sprite.height = this.size * 1.2 // Scale up to cover vertical gaps
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
      this.sprite.height = this.size * 1.2 // Scale up to cover vertical gaps
    }
  }

  unblur() {
    if (!this.isBlurred) return
    this.isBlurred = false
    const original = getOriginalTexture(this.textureId)
    if (original) {
      this.sprite.texture = original
      this.sprite.height = this.size // Reset height
    }
  }

  destroy() {
    if (this.sequenceText) {
      this.sequenceText.destroy()
    }
    this.sprite.destroy()
  }
}
