import { Sprite, Texture, Text, TextStyle } from 'pixi.js'
import type { ReelTile as IReelTile } from '../types'

export class ReelTile implements IReelTile {
  sprite: Sprite
  textureId: number
  column: number
  private sequenceNumber: number
  private sequenceText: Text

  constructor(
    texture: Texture,
    textureId: number,
    column: number,
    x: number,
    y: number,
    size: number,
    sequenceNumber: number
  ) {
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
    this.sprite.texture = texture
    this.textureId = textureId
  }

  destroy() {
    if (this.sequenceText) {
      this.sequenceText.destroy()
    }
    this.sprite.destroy()
  }
}

