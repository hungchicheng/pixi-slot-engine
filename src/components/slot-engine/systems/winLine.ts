import { Graphics, Container, type Application } from 'pixi.js'
import type { SlotConfig } from '../logic/types'
import type { WinningLine } from './winDetection'

export class WinLineSystem {
  private container: Container
  private graphics: Graphics
  private config: SlotConfig
  private activeLines: WinningLine[] = []
  private currentLineIndex: number = 0
  private animationTimer: number | null = null
  private onLineChangeCallback?: (currentLine: WinningLine | null) => void

  constructor(_app: Application, container: Container, config: SlotConfig) {
    this.container = container
    this.config = config

    this.graphics = new Graphics()
    this.container.addChild(this.graphics)
  }

  updateConfig(config: SlotConfig) {
    this.config = config
  }

  setOnLineChangeCallback(callback: (currentLine: WinningLine | null) => void) {
    this.onLineChangeCallback = callback
  }

  drawWinLines(winningLines: WinningLine[]) {
    this.stopAnimation()

    this.activeLines = winningLines
    this.currentLineIndex = 0

    if (winningLines.length === 0) {
      this.clearLines()
      return
    }

    this.startAnimation()
  }

  private startAnimation() {
    this.drawCurrentLine()

    if (this.activeLines.length > 1) {
      this.animationTimer = window.setInterval(() => {
        if (!this.isGraphicsValid()) {
          this.stopAnimation()
          return
        }
        this.currentLineIndex = (this.currentLineIndex + 1) % this.activeLines.length
        this.drawCurrentLine()
      }, this.config.LINE_DISPLAY_DURATION)
    }
  }

  private isGraphicsValid() {
    return this.graphics !== null && !this.graphics.destroyed
  }

  private stopAnimation() {
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

  private drawCurrentLine() {
    if (!this.isGraphicsValid()) {
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

    if (this.onLineChangeCallback) {
      this.onLineChangeCallback(line)
    }
  }

  clearLines() {
    this.stopAnimation()
    
    if (this.isGraphicsValid()) {
      this.graphics.clear()
    }
    
    this.activeLines = []
    this.currentLineIndex = 0
  }

  updateLines() {
    if (!this.isGraphicsValid()) {
      return
    }
    
    if (this.activeLines.length > 0) {
      this.drawCurrentLine()
    }
  }

  destroy() {
    this.stopAnimation()
    
    if (this.isGraphicsValid()) {
      this.graphics.clear()
      if (this.graphics.parent === this.container) {
        this.container.removeChild(this.graphics)
      }
      this.graphics.destroy()
    }
    
    this.graphics = null as any
  }
}

