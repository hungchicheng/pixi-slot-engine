import { Howl, HowlOptions } from 'howler'

export type SoundId = string

export interface SoundConfig {
  id: SoundId
  src: string | string[]
  volume?: number
  loop?: boolean
  preload?: boolean
}

export class SoundManager {
  private sounds: Map<SoundId, Howl> = new Map()
  private masterVolume: number = 1.0
  private muted: boolean = false

  register(config: SoundConfig) {
    if (this.sounds.has(config.id)) {
      console.warn(`Sound "${config.id}" is already registered. Overwriting...`)
    }

    const howlOptions: HowlOptions = {
      src: Array.isArray(config.src) ? config.src : [config.src],
      volume: config.volume ?? 1.0,
      loop: config.loop ?? false,
      preload: config.preload ?? true,
    }

    const howl = new Howl(howlOptions)
    this.sounds.set(config.id, howl)
  }

  registerMultiple(configs: SoundConfig[]) {
    configs.forEach(config => this.register(config))
  }

  play(id: SoundId, options?: { volume?: number; loop?: boolean }): number | null {
    const sound = this.sounds.get(id)
    if (!sound) {
      console.warn(`Sound "${id}" not found`)
      return null
    }

    if (options?.volume !== undefined) {
      sound.volume(options.volume * this.masterVolume)
    }
    if (options?.loop !== undefined) {
      sound.loop(options.loop)
    }

    return sound.play()
  }

  stop(id: SoundId, soundId?: number) {
    const sound = this.sounds.get(id)
    if (!sound) {
      console.warn(`Sound "${id}" not found`)
      return
    }

    if (soundId !== undefined) {
      sound.stop(soundId)
    } else {
      sound.stop()
    }
  }

  pause(id: SoundId, soundId?: number) {
    const sound = this.sounds.get(id)
    if (!sound) {
      console.warn(`Sound "${id}" not found`)
      return
    }

    if (soundId !== undefined) {
      sound.pause(soundId)
    } else {
      sound.pause()
    }
  }

  resume(id: SoundId, soundId?: number): number | null {
    const sound = this.sounds.get(id)
    if (!sound) {
      console.warn(`Sound "${id}" not found`)
      return null
    }

    if (soundId !== undefined) {
      return sound.play(soundId)
    } else {
      return sound.play()
    }
  }

  setVolume(id: SoundId, volume: number) {
    const sound = this.sounds.get(id)
    if (!sound) {
      console.warn(`Sound "${id}" not found`)
      return
    }

    sound.volume(volume * this.masterVolume)
  }

  getVolume(id: SoundId): number {
    const sound = this.sounds.get(id)
    if (!sound) {
      console.warn(`Sound "${id}" not found`)
      return 0
    }

    return sound.volume() / this.masterVolume
  }

  setMasterVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume))
    this.sounds.forEach(sound => {
      const currentVolume = sound.volume() / (this.masterVolume || 1)
      sound.volume(currentVolume * this.masterVolume)
    })
  }

  getMasterVolume(): number {
    return this.masterVolume
  }

  mute() {
    this.muted = true
    this.sounds.forEach(sound => sound.mute(true))
  }

  unmute() {
    this.muted = false
    this.sounds.forEach(sound => sound.mute(false))
  }

  isMuted(): boolean {
    return this.muted
  }

  stopAll() {
    this.sounds.forEach(sound => sound.stop())
  }

  isPlaying(id: SoundId, soundId?: number): boolean {
    const sound = this.sounds.get(id)
    if (!sound) {
      return false
    }

    if (soundId !== undefined) {
      return sound.playing(soundId)
    }
    return sound.playing()
  }

  unload(id: SoundId) {
    const sound = this.sounds.get(id)
    if (sound) {
      sound.unload()
      this.sounds.delete(id)
    }
  }

  unloadAll() {
    this.sounds.forEach(sound => sound.unload())
    this.sounds.clear()
  }

  getRegisteredSounds(): SoundId[] {
    return Array.from(this.sounds.keys())
  }
}

export const soundManager = new SoundManager()