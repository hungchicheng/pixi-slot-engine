import { Application } from 'pixi.js'
import { Back } from 'gsap'
import type { Tile } from '../view/Tile'
import type { SlotConfig } from '../logic/types'

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
      const progress = elapsed / IMPACT_DURATION
      const currentOffset = this.stopStartY + (this.stopTargetY - this.stopStartY) * progress
      this.applyOffset(currentOffset)
    } else if (elapsed <= IMPACT_DURATION + RECOVER_DURATION) {
      const recoverElapsed = elapsed - IMPACT_DURATION
      const progress = recoverElapsed / RECOVER_DURATION
      // Use Back.out easing function
      const easedProgress = Back.easeOut.config(0.5)(progress)
      const currentOffset = this.stopTargetY * (1 - easedProgress)

      this.applyOffset(currentOffset)
    } else {
      // Ensure we land exactly on the target (offset 0 relative to logical center)
      this.applyOffset(0)
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
    // 1. Cleanup state
    this.tiles.forEach(tile => {
      delete (tile as any).initialY
    })

    // Rebalance tiles to ensure proper buffer distribution
    const { SYMBOL_SIZE, SPACING } = this.config
    const centerY = this.app.screen.height / 2

    this.tiles.sort((a, b) => a.sprite.y - b.sprite.y)

    // Find the tile closest to center
    let closestTile = this.tiles[0]
    let minDiff = Math.abs(closestTile.sprite.y - centerY)

    for (let i = 1; i < this.tiles.length; i++) {
      const diff = Math.abs(this.tiles[i].sprite.y - centerY)
      if (diff < minDiff) {
        minDiff = diff
        closestTile = this.tiles[i]
      }
    }

    const centerIndex = this.tiles.indexOf(closestTile)
    const expectedIndex = Math.floor(this.tiles.length / 2)

    if (centerIndex < expectedIndex) {
      // Shift Down
      const diff = expectedIndex - centerIndex
      for (let i = 0; i < diff; i++) {
        const t = this.tiles.pop()
        if (t) {
          t.sprite.y = this.tiles[0].sprite.y - SYMBOL_SIZE - SPACING
          this.tiles.unshift(t)
        }
      }
    } else if (centerIndex > expectedIndex) {
      // Shift Up
      const diff = centerIndex - expectedIndex
      for (let i = 0; i < diff; i++) {
        const t = this.tiles.shift()
        if (t) {
          t.sprite.y = this.tiles[this.tiles.length - 1].sprite.y + SYMBOL_SIZE + SPACING
          this.tiles.push(t)
        }
      }
    }
  }
}
