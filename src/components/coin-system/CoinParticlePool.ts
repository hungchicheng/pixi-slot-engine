import { CoinParticle } from './CoinParticle'

export class CoinParticlePool {
  private pool: CoinParticle[] = []
  private activeParticles: CoinParticle[] = []
  private initialSize: number

  constructor(initialSize: number = 50) {
    this.initialSize = initialSize
    this.initializePool()
  }

  private initializePool() {
    for (let i = 0; i < this.initialSize; i++) {
      const particle = new CoinParticle()
      this.pool.push(particle)
    }
  }

  acquire() {
    let particle = this.pool.pop()
    if (!particle) {
      particle = new CoinParticle()
    }
    this.activeParticles.push(particle)
    return particle
  }

  release(particle: CoinParticle) {
    const index = this.activeParticles.indexOf(particle)
    if (index > -1) {
      this.activeParticles.splice(index, 1)
      particle.deactivate()
      this.pool.push(particle)
    }
  }

  getActiveParticles() {
    return this.activeParticles
  }

  releaseAll() {
    while (this.activeParticles.length > 0) {
      this.release(this.activeParticles[0])
    }
  }

  destroy() {
    this.releaseAll()
    this.pool.forEach(particle => particle.destroy())
    this.pool = []
    this.activeParticles = []
  }
}

