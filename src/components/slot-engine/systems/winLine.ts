import { Graphics, Container, Application } from 'pixi.js'
import type { SlotConfig } from '../logic/types'
import type { WinningLine } from './winDetection'
import { LayoutSystem } from './layout'

export class WinLineSystem {
  private app: Application
  private container: Container
  private graphics: Graphics
  private config: SlotConfig
  private activeLines: WinningLine[] = []
  private currentLineIndex: number = 0
  private animationTimer: number | null = null
  private onLineChangeCallback?: (currentLine: WinningLine | null) => void

  constructor(app: Application, container: Container, config: SlotConfig) {
    this.app = app
    this.container = container
    this.config = config

    this.graphics = new Graphics()
    this.container.addChild(this.graphics)
  }

  updateConfig(config: SlotConfig): void {
    this.config = config
  }

  setOnLineChangeCallback(callback: (currentLine: WinningLine | null) => void): void {
    this.onLineChangeCallback = callback
  }

  drawWinLines(winningLines: WinningLine[]): void {
    this.stopAnimation()

    this.activeLines = winningLines
    this.currentLineIndex = 0

    if (winningLines.length === 0) {
      this.clearLines()
      return
    }

    this.startAnimation()
  }

  private startAnimation(): void {
    this.drawCurrentLine()

    if (this.activeLines.length > 1) {
      this.animationTimer = window.setInterval(() => {
        if (!this.graphics || this.graphics.destroyed) {
          this.stopAnimation()
          return
        }
        this.currentLineIndex = (this.currentLineIndex + 1) % this.activeLines.length
        this.drawCurrentLine()
      }, this.config.LINE_DISPLAY_DURATION)
    }
  }

  private stopAnimation(): void {
    if (this.animationTimer !== null) {
      clearInterval(this.animationTimer)
      this.animationTimer = null
    }
  }

  getCurrentLine(): WinningLine | null {
    if (this.activeLines.length === 0) {
      return null
    }
    return this.activeLines[this.currentLineIndex]
  }

  private drawCurrentLine(): void {
    if (!this.graphics || this.graphics.destroyed) {
      return
    }

    this.graphics.clear()

    if (this.activeLines.length === 0) {
      if (this.onLineChangeCallback) {
        this.onLineChangeCallback(null)
      }
      return
    }

    const line = this.activeLines[this.currentLineIndex]
    const { SYMBOL_SIZE, ROWS, SPACING } = this.config
    const screenHeight = this.app.screen.height
    const centerY = screenHeight / 2
    const centerIndex = (ROWS - 1) / 2

    const colors = [
      0xffd700,
      0x00e5ff,
      0xff1493,
      0xff8c00,
      0x9370db,
      0x4169e1,
      0x32cd32,
    ]
    const color = colors[this.currentLineIndex % colors.length]

    if (this.onLineChangeCallback) {
      this.onLineChangeCallback(line)
    }

    if (line.tiles.length === 0) {
      return
    }

    const positions = line.tiles.map(({ column, row }) => {
      const x = LayoutSystem.calculateXPosition(this.app, column, this.config)
      const y = centerY + (row - centerIndex) * (SYMBOL_SIZE + SPACING)
      return { x, y }
    })

    this.graphics.lineStyle(5, color, 1)
    this.graphics.moveTo(positions[0].x, positions[0].y)
    for (let i = 1; i < positions.length; i++) {
      this.graphics.lineTo(positions[i].x, positions[i].y)
    }

    this.graphics.lineStyle(8, color, 0.4)
    this.graphics.moveTo(positions[0].x, positions[0].y)
    for (let i = 1; i < positions.length; i++) {
      this.graphics.lineTo(positions[i].x, positions[i].y)
    }

    positions.forEach(({ x, y }) => {
      this.graphics.lineStyle(0)
      this.graphics.beginFill(color, 0.3)
      this.graphics.drawCircle(x, y, SYMBOL_SIZE * 0.2)
      this.graphics.endFill()

      this.graphics.beginFill(color, 0.8)
      this.graphics.drawCircle(x, y, SYMBOL_SIZE * 0.15)
      this.graphics.endFill()

      this.graphics.beginFill(0xffffff, 0.5)
      this.graphics.drawCircle(x, y, SYMBOL_SIZE * 0.08)
      this.graphics.endFill()
    })
  }

  clearLines(): void {
    this.stopAnimation()
    
    if (this.graphics && !this.graphics.destroyed) {
      this.graphics.clear()
    }
    
    this.activeLines = []
    this.currentLineIndex = 0
  }

  updateLines(): void {
    if (!this.graphics || this.graphics.destroyed) {
      return
    }
    
    if (this.activeLines.length > 0) {
      this.drawCurrentLine()
    }
  }

  destroy(): void {
    this.stopAnimation()
    
    if (this.graphics && !this.graphics.destroyed) {
      this.graphics.clear()
      if (this.container && this.graphics.parent === this.container) {
        this.container.removeChild(this.graphics)
      }
      this.graphics.destroy()
    }
    
    this.graphics = null as any
  }
}

