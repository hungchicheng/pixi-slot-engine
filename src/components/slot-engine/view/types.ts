import { Sprite } from 'pixi.js'

export interface ReelTile {
  sprite: Sprite
  textureId: number
  column: number
}

export interface TileWithInitialY extends ReelTile {
  initialY?: number
}

export interface TileWithTarget extends ReelTile {
  isTarget?: boolean
}
