import { Application } from 'pixi.js'
import { Back } from 'gsap'
import type { Tile } from '../view/Tile'
import type { SlotConfig } from '../logic/types'
import { LayoutSystem } from './layout'

export class AnimationSystem {
  private stopStartY: number = 0
  private stopTargetY: number = 0
  private stopStartTime: number = 0
  private app: Application
  private tiles: Tile[]
  private config: SlotConfig

  constructor(app: Application, tiles: Tile[], config: SlotConfig) {
    this.app = app
    this.tiles = tiles
    this.config = config
  }

  start(startOffset: number = 0): void {
    const { IMPACT_OFFSET } = this.config

    this.stopStartY = startOffset
    this.stopTargetY = IMPACT_OFFSET
    this.stopStartTime = Date.now()

    this.tiles.forEach(tile => {
      ;(tile as any).initialY = tile.sprite.y
    })
  }

  update = (): boolean => {
    const { IMPACT_DURATION, RECOVER_DURATION } = this.config
    const elapsed = Date.now() - this.stopStartTime

    if (elapsed <= IMPACT_DURATION) {
      // Impact phase: linear movement to target position
      const progress = elapsed / IMPACT_DURATION
      const currentOffset = this.stopStartY + (this.stopTargetY - this.stopStartY) * progress
      this.applyOffset(currentOffset)
    } else if (elapsed <= IMPACT_DURATION + RECOVER_DURATION) {
      // Recovery phase: use Back.out easing for bounce effect
      const recoverElapsed = elapsed - IMPACT_DURATION
      const progress = recoverElapsed / RECOVER_DURATION
      // Use Back.out easing function
      const easedProgress = Back.easeOut.config(0.5)(progress)
      const currentOffset = this.stopTargetY * (1 - easedProgress)

      this.applyOffset(currentOffset)
    } else {
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

    LayoutSystem.alignTilesToCenter(this.tiles, centerY, this.config)

    this.tiles.forEach(tile => {
      delete (tile as any).initialY
    })
  }
}
