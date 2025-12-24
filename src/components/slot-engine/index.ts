// Slot Engine exports
export { SlotEngine } from './core/SlotEngine'

// Core
export { GameLoop } from './core/GameLoop'

// Logic
export { reelMachine } from './logic/reelMachine'
export type { ReelContext, ReelEvent } from './logic/reelMachine'
export { SLOT_CONFIG } from './logic/config'

// View
export { SlotStage } from './view/SlotStage'
export { Reel } from './view/Reel'
export { Tile } from './view/Tile'

// Systems
export { ScrollingSystem } from './systems/scrolling'
export { LayoutSystem } from './systems/layout'
export { AnimationSystem } from './systems/animation'
export { WinDetectionSystem } from './systems/winDetection'
export { WinLineSystem } from './systems/winLine'
export type { WinningLine } from './systems/winDetection'

// Types
export type { ReelTile as IReelTile } from './view/types'
