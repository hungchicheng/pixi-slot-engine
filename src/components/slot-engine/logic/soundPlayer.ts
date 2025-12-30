export interface SoundPlayer {
  play(id: string, options?: { volume?: number; loop?: boolean }): number | null
  stop(id: string, soundId?: number): void
  isPlaying(id: string, soundId?: number): boolean
  stopAll(): void
}

