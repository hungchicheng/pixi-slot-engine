import type { SlotConfig } from './types'

export const SLOT_CONFIG: SlotConfig = {
  COLUMNS: 3,
  ROWS: 3,
  SYMBOL_SIZE: 100,
  SPACING: 0, // No spacing between tiles in reel
  COLUMN_SPACING: 20, // Spacing between columns
  SCROLL_SPEED: 3, // Pixels per frame
  SPIN_SPEED: 15, // Faster speed when spinning
  STOP_DURATION: 1000, // Duration for stop animation in ms
  ANTICIPATION_DURATION: 200,
  ANTICIPATION_OFFSET: -70,
  IMPACT_DURATION: 60,
  IMPACT_OFFSET: 70,
  RECOVER_DURATION: 200,
  START_DELAY: 200,
} as const

// Internal constant for buffer tiles (1 top, 1 bottom)
export const BUFFER_COUNT = 2
