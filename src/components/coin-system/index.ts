import { Container, Application } from 'pixi.js'
import { CoinParticlePool } from './CoinParticlePool'
import type { ParticleConfig } from './CoinParticle'
import type { WinningLine } from '../slot-engine'
import type { SlotConfig } from '../slot-engine/logic/types'

export class CoinParticleSystem {
  private container: Container
  private pool: CoinParticlePool
  private defaultConfig: ParticleConfig
  private app: Application | null = null
  private getConfig: (() => SlotConfig) | null = null
  private getWinningLines: (() => WinningLine[]) | null = null
  private winCheckInterval: ReturnType<typeof setInterval> | null = null
  private lastWinningLines: WinningLine[] = []

  constructor(container: Container) {
    this.container = container
    this.pool = new CoinParticlePool(100)
    this.defaultConfig = {
      minSpeed: 2,
      maxSpeed: 5,
      spreadAngle: 120,
      initialUpwardVelocity: 8,
      gravity: 0.3,
      rotationSpeed: 0.2,
      minLife: 60,
      maxLife: 120,
      minScale: 0.5,
      maxScale: 1.0,
    }
  }

  /**
   * Initialize winning line monitoring
   */
  initializeWinLineMonitoring(
    app: Application,
    getConfig: () => SlotConfig,
    getWinningLines: () => WinningLine[]
  ) {
    this.app = app
    this.getConfig = getConfig
    this.getWinningLines = getWinningLines
    this.startWinLineMonitoring()
  }

  /**
   * Start monitoring winning line changes
   */
  private startWinLineMonitoring() {
    if (this.winCheckInterval) {
      return
    }

    this.winCheckInterval = setInterval(() => {
      if (!this.getWinningLines) return

      const winningLines = this.getWinningLines()
      // Check if winning lines have changed (by comparing length and content)
      const hasChanged = 
        winningLines.length !== this.lastWinningLines.length ||
        winningLines.some((line, index) => {
          const lastLine = this.lastWinningLines[index]
          return !lastLine || 
            line.index !== lastLine.index ||
            line.symbolId !== lastLine.symbolId ||
            line.tiles.length !== lastLine.tiles.length
        })

      if (winningLines.length > 0 && hasChanged) {
        this.triggerCoinBurst(winningLines)
        this.lastWinningLines = [...winningLines]
      } else if (winningLines.length === 0) {
        this.lastWinningLines = []
      }
    }, 100)
  }

  /**
   * Stop monitoring winning line changes
   */
  private stopWinLineMonitoring() {
    if (this.winCheckInterval) {
      clearInterval(this.winCheckInterval)
      this.winCheckInterval = null
    }
    this.lastWinningLines = []
  }

  /**
   * Trigger coin particle burst effect based on winning lines
   */
  private triggerCoinBurst(winningLines: WinningLine[]) {
    if (!this.app || !this.getConfig) return

    const screenWidth = this.app.screen.width

    // Only trigger once, regardless of how many winning lines
    if (winningLines.length === 0) return

    // Fall from top of screen downward
    const centerX = screenWidth / 2 // Center horizontally
    const startY = 20 // Start from top with small offset

    const particleCount = 20 + Math.floor(Math.random() * 15)
    this.burst(centerX, startY, particleCount, {
      minSpeed: 1,
      maxSpeed: 3,
      spreadAngle: 120, // Wider spread angle for more horizontal spread
      initialUpwardVelocity: 0, // No initial upward velocity
      gravity: 0.2, // Reduced gravity for slower falling speed
    })
  }

  burst(x: number, y: number, count: number, config?: Partial<ParticleConfig>) {
    const finalConfig = { ...this.defaultConfig, ...config }

    for (let i = 0; i < count; i++) {
      const particle = this.pool.acquire()
      // Add more random offset in X direction for wider particle spread
      const startX = x + (Math.random() - 0.5) * 300
      const startY = y
      particle.reset(startX, startY, finalConfig)
      this.container.addChild(particle.graphics)
    }
  }

  update(delta: number) {
    const activeParticles = this.pool.getActiveParticles()
    
    for (let i = activeParticles.length - 1; i >= 0; i--) {
      const particle = activeParticles[i]
      const isAlive = particle.update(delta)
      
      if (!isAlive) {
        this.container.removeChild(particle.graphics)
        this.pool.release(particle)
      }
    }
  }

  clear() {
    const activeParticles = this.pool.getActiveParticles()
    activeParticles.forEach(particle => {
      this.container.removeChild(particle.graphics)
      this.pool.release(particle)
    })
  }

  destroy() {
    this.stopWinLineMonitoring()
    this.clear()
    this.pool.destroy()
    this.app = null
    this.getConfig = null
    this.getWinningLines = null
  }
}

