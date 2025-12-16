import { Application } from 'pixi.js'
import type { Tile } from '../view/Tile'
import { SLOT_CONFIG } from '../logic/config'
import { LayoutSystem } from './layout'

export class AnimationSystem {
  private stopStartY: number = 0
  private stopTargetY: number = 0
  private stopStartTime: number = 0
  private app: Application
  private tiles: Tile[]

  constructor(app: Application, tiles: Tile[]) {
    this.app = app
    this.tiles = tiles
  }

  start(startOffset: number = 0): void {
    const IMPACT_POINT = 70

    this.stopStartY = startOffset
    this.stopTargetY = IMPACT_POINT
    this.stopStartTime = Date.now()

    this.tiles.forEach(tile => {
      ;(tile as any).initialY = tile.sprite.y
    })
  }

  update = (): boolean => {
    const { IMPACT_DURATION, RECOVER_DURATION } = SLOT_CONFIG
    const elapsed = Date.now() - this.stopStartTime

    if (elapsed <= IMPACT_DURATION) {
      const progress = elapsed / IMPACT_DURATION
      const currentOffset = this.stopStartY + (this.stopTargetY - this.stopStartY) * progress
      this.applyOffset(currentOffset)
    }
    else if (elapsed <= IMPACT_DURATION + RECOVER_DURATION) {
      const recoverElapsed = elapsed - IMPACT_DURATION
      const progress = recoverElapsed / RECOVER_DURATION
      const currentOffset = this.stopTargetY * (1 - progress)
      this.applyOffset(currentOffset)
    }
    else {
      this.finalize()
      return true
    }

    return false
  }

  private applyOffset(offset: number): void {
    this.tiles.forEach(tile => {
      const initialY = (tile as any).initialY
      if (initialY !== undefined) {
        tile.sprite.y = initialY - this.stopStartY + offset
      }
    })
  }

  private finalize(): void {
    const screenHeight = this.app.screen.height
    const centerY = screenHeight / 2

    LayoutSystem.alignTilesToCenter(this.tiles, centerY)

    this.tiles.forEach(tile => {
      delete (tile as any).initialY
    })
  }
}
