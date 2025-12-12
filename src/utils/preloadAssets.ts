import {
  Application,
  Assets,
  Sprite,
  BlurFilter,
  Cache,
  Texture,
  RenderTexture,
} from 'pixi.js'

// Import images
import symbol1 from '@/assets/images/symbol-1.png'
import symbol2 from '@/assets/images/symbol-2.png'
import symbol3 from '@/assets/images/symbol-3.png'
import symbol4 from '@/assets/images/symbol-4.png'
import symbol5 from '@/assets/images/symbol-5.png'
import symbol6 from '@/assets/images/symbol-6.png'

export const symbolImages = [symbol1, symbol2, symbol3, symbol4, symbol5, symbol6]

export interface PreloadedTextures {
  original: Texture
  blurred: RenderTexture
}

/**
 * Preload all symbol images and create blurred versions
 * @param app - Pixi.js Application instance
 * @returns Promise that resolves when all images are loaded and cached
 */
export async function preloadSymbolImages(
  app: Application
): Promise<PreloadedTextures[]> {
  const blurFilter = new BlurFilter(8)

  const loadPromises = symbolImages.map(async (imagePath, index) => {
    // Load original texture
    const texture = await Assets.load(imagePath)

    // Cache original texture
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
  })

  const results = await Promise.all(loadPromises)
  console.log('All images preloaded and cached with blur versions')
  return results
}

/**
 * Get cached original texture by index
 */
export function getOriginalTexture(index: number): Texture | undefined {
  return Cache.get(`symbol-${index + 1}-original`) as Texture | undefined
}

/**
 * Get cached blurred texture by index
 */
export function getBlurredTexture(index: number): RenderTexture | undefined {
  return Cache.get(`symbol-${index + 1}-blurred`) as RenderTexture | undefined
}

/**
 * Clear all cached symbol textures
 */
export function clearSymbolCache(): void {
  symbolImages.forEach((_, index) => {
    Cache.remove(`symbol-${index + 1}-original`)
    Cache.remove(`symbol-${index + 1}-blurred`)
  })
}

