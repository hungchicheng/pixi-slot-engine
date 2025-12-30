import { Application, Assets, Sprite, BlurFilter, Cache, Texture, RenderTexture } from 'pixi.js'
import { soundManager } from './soundManager'

// Import images
import symbol1 from '@/assets/images/slot-engine/symbol-1.png'
import symbol2 from '@/assets/images/slot-engine/symbol-2.png'
import symbol3 from '@/assets/images/slot-engine/symbol-3.png'
import symbol4 from '@/assets/images/slot-engine/symbol-4.png'
import symbol5 from '@/assets/images/slot-engine/symbol-5.png'
import symbol6 from '@/assets/images/slot-engine/symbol-6.png'

// Import audio files
import spinningAudio from '@/assets/audio/spinning.mp3'
import buttonPressAudio from '@/assets/audio/button-press.mp3'
import spinStopAudio from '@/assets/audio/spin-stop.mp3'
import coinCollectAudio from '@/assets/audio/coin-collect.mp3'

export const symbolImages = [symbol1, symbol2, symbol3, symbol4, symbol5, symbol6]

export interface PreloadedTextures {
  original: Texture
  blurred: RenderTexture
}

/**
 * Preload all symbol images and create blurred versions
 */
export async function preloadSymbolImages(app: Application) {
  const blurFilter = new BlurFilter(20)
  blurFilter.blurX = 0
  blurFilter.blurY = 20

  async function loadImage(imagePath: string, index: number) {
    const texture = await Assets.load(imagePath)
    Cache.set(`symbol-${index + 1}-original`, texture)

    // Create blurred version
    const tempSprite = new Sprite(texture)
    tempSprite.filters = [blurFilter]

    // Render blurred version to a new texture
    const renderTexture = RenderTexture.create({
      width: texture.width,
      height: texture.height,
    })
    app.renderer.render(tempSprite, { renderTexture })
    Cache.set(`symbol-${index + 1}-blurred`, renderTexture)

    return {
      original: texture,
      blurred: renderTexture,
    }
  }

  const loadPromises = symbolImages.map(loadImage)

  const results = await Promise.all(loadPromises)
  console.log('All images preloaded and cached with blur versions')
  return results
}

/**
 * Get cached original texture by index
 */
export function getOriginalTexture(index: number) {
  return Cache.get(`symbol-${index + 1}-original`) as Texture | undefined
}

/**
 * Get cached blurred texture by index
 */
export function getBlurredTexture(index: number) {
  return Cache.get(`symbol-${index + 1}-blurred`) as RenderTexture | undefined
}

/**
 * Clear all cached symbol textures
 */
export function clearSymbolCache() {
  function removeCache(_: string, index: number) {
    Cache.remove(`symbol-${index + 1}-original`)
    Cache.remove(`symbol-${index + 1}-blurred`)
  }

  symbolImages.forEach(removeCache)
}

export async function preloadSounds() {
  soundManager.register({
    id: 'spinning',
    src: spinningAudio,
    volume: 0.5,
    loop: true,
  })

  soundManager.register({
    id: 'button-press',
    src: buttonPressAudio,
    volume: 0.6,
  })

  soundManager.register({
    id: 'spin-stop',
    src: spinStopAudio,
    volume: 0.7,
  })

  soundManager.register({
    id: 'coin-collect',
    src: coinCollectAudio,
    volume: 0.6,
  })

  console.log('All sounds preloaded and registered')
}

export async function preloadAllAssets(app: Application) {
  await Promise.all([
    preloadSymbolImages(app),
    preloadSounds(),
  ])
  console.log('All assets preloaded')
}
