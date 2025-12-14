export const SLOT_CONFIG = {
  COLUMNS: 3,
  ROWS: 3,
  SYMBOL_SIZE: 100,
  SPACING: 0, // No spacing between tiles in reel
  COLUMN_SPACING: 20, // Spacing between columns
  SCROLL_SPEED: 3, // Pixels per frame
  SPIN_SPEED: 8, // Faster speed when spinning
  TILES_PER_COLUMN: 5, // 1 top buffer + 3 visible + 1 bottom buffer (optimal for seamless scrolling)
  STOP_DURATION: 1000, // Duration for stop animation in ms
} as const

