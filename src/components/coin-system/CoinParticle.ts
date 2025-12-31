import { Graphics } from 'pixi.js'

export class CoinParticle {
  graphics: Graphics
  vx: number = 0
  vy: number = 0
  rotationSpeed: number = 0
  gravity: number = 0
  life: number = 0
  maxLife: number = 0
  scale: number = 1
  alpha: number = 1
  active: boolean = false
  private radius: number = 15

  constructor() {
    this.graphics = new Graphics()
    this.drawCircle()
    this.graphics.visible = false
  }

  private drawCircle() {
    this.graphics.clear()
    // Draw yellow circle with gradient effect
    this.graphics.beginFill(0xffd700) // Gold color
    this.graphics.drawCircle(0, 0, this.radius)
    this.graphics.endFill()

    // Add highlight effect
    this.graphics.beginFill(0xffff99, 0.6) // Light yellow highlight
    this.graphics.drawCircle(-this.radius * 0.3, -this.radius * 0.3, this.radius * 0.4)
    this.graphics.endFill()
  }

  reset(x: number, y: number, config: ParticleConfig) {
    this.graphics.x = x
    this.graphics.y = y
    this.graphics.visible = true
    this.graphics.alpha = 1
    this.graphics.scale.set(1)
    this.graphics.rotation = 0

    // Fall downward, main direction is downward (90 degrees), then spread around this direction
    const baseAngle = Math.PI / 2 // Downward (90 degrees)
    const spreadAngleRad = (config.spreadAngle / 2) * (Math.PI / 180)
    const angle = baseAngle + (Math.random() * spreadAngleRad * 2 - spreadAngleRad)
    const speed = config.minSpeed + Math.random() * (config.maxSpeed - config.minSpeed)

    this.vx = Math.cos(angle) * speed
    // Initial velocity should be positive (downward in screen coordinates)
    this.vy = Math.sin(angle) * speed + config.initialUpwardVelocity
    this.rotationSpeed = (Math.random() - 0.5) * config.rotationSpeed
    this.gravity = config.gravity
    this.maxLife = config.minLife + Math.random() * (config.maxLife - config.minLife)
    this.life = this.maxLife
    this.scale = config.minScale + Math.random() * (config.maxScale - config.minScale)
    this.graphics.scale.set(this.scale)
    this.active = true
  }

  update(delta: number) {
    if (!this.active) return false

    this.life -= delta
    if (this.life <= 0) {
      this.deactivate()
      return false
    }

    this.vy += this.gravity * delta
    this.graphics.x += this.vx * delta
    this.graphics.y += this.vy * delta
    this.graphics.rotation += this.rotationSpeed * delta

    const lifeRatio = this.life / this.maxLife
    this.graphics.alpha = lifeRatio
    this.graphics.scale.set(this.scale * (0.5 + lifeRatio * 0.5))

    return true
  }

  deactivate() {
    this.active = false
    this.graphics.visible = false
  }

  destroy() {
    this.graphics.destroy()
  }
}

export interface ParticleConfig {
  minSpeed: number
  maxSpeed: number
  spreadAngle: number
  initialUpwardVelocity: number
  gravity: number
  rotationSpeed: number
  minLife: number
  maxLife: number
  minScale: number
  maxScale: number
}
