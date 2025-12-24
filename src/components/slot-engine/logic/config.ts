import type { SlotConfig } from './types'

export const SLOT_CONFIG: SlotConfig = {
  COLUMNS: 3,
  ROWS: 3,
  SYMBOL_SIZE: 70,
  SPACING: 0,
  COLUMN_SPACING: 20,
  SCROLL_SPEED: 3,
  SPIN_SPEED: 15,
  STOP_DURATION: 1000,
  ANTICIPATION_DURATION: 200,
  ANTICIPATION_OFFSET: -70,
  IMPACT_DURATION: 60,
  IMPACT_OFFSET: 70,
  RECOVER_DURATION: 200,
  START_DELAY: 200,
  WILD_SYMBOL_ID: 0,
  LINE_DISPLAY_DURATION: 1500,
} as const

// Internal constant for buffer tiles (1 top, 1 bottom)
export const BUFFER_COUNT = 2
