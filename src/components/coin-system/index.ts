import { Container, Application } from 'pixi.js'
import { CoinParticlePool } from './CoinParticlePool'
import type { ParticleConfig } from './CoinParticle'
import type { WinningLine } from '../slot-engine'
import type { SlotConfig } from '../slot-engine/logic/types'
import { soundManager } from '@/utils/soundManager'

export class CoinParticleSystem {
  private container: Container
  private pool: CoinParticlePool
  private defaultConfig: ParticleConfig
  private app: Application | null = null
  private getWinningLines: (() => WinningLine[]) | null = null
  private hasJustWon: (() => boolean) | null = null
  private winCheckInterval: ReturnType<typeof setInterval> | null = null
  private lastHasJustWon: boolean = false

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

  initializeWinLineMonitoring(
    app: Application,
    _getConfig: () => SlotConfig,
    getWinningLines: () => WinningLine[],
    hasJustWon: () => boolean
  ) {
    this.app = app
    this.getWinningLines = getWinningLines
    this.hasJustWon = hasJustWon
    if (this.hasJustWon) {
      this.lastHasJustWon = this.hasJustWon()
    }
    this.startWinLineMonitoring()
  }

  private startWinLineMonitoring() {
    if (this.winCheckInterval) {
      return
    }

    this.winCheckInterval = setInterval(() => {
      if (!this.hasJustWon) return

      const justWon = this.hasJustWon()
      if (justWon && !this.lastHasJustWon) {
        const winningLines = this.getWinningLines?.() || []
        if (winningLines.length > 0) {
          this.triggerCoinBurst(winningLines)
        }
      }
      this.lastHasJustWon = justWon
    }, 100)
  }

  private stopWinLineMonitoring() {
    if (this.winCheckInterval) {
      clearInterval(this.winCheckInterval)
      this.winCheckInterval = null
    }
    this.lastHasJustWon = false
  }

  private triggerCoinBurst(winningLines: WinningLine[]) {
    if (!this.app || winningLines.length === 0) return

    const centerX = this.app.screen.width / 2
    const startY = 20
    const particleCount = 20 + Math.floor(Math.random() * 15)

    this.burst(centerX, startY, particleCount, {
      minSpeed: 1,
      maxSpeed: 3,
      spreadAngle: 120,
      initialUpwardVelocity: 0,
      gravity: 0.2,
    })

    soundManager.play('coin-collect')
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
    this.getWinningLines = null
    this.hasJustWon = null
    this.lastHasJustWon = false
  }
}
