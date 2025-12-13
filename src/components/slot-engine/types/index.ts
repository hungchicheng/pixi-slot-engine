import { Sprite } from 'pixi.js'

export interface ReelTile {
  sprite: Sprite
  textureId: number
  column: number
}

export interface ReelConfig {
  columns: number
  rows: number
  symbolSize: number
  spacing: number
  scrollSpeed: number
}

