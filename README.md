# Slot Engine

A modern project built with Vue 3 + Pinia + Tailwind CSS + Pixi.js.

## Tech Stack

- **Vue 3** - Progressive JavaScript framework
- **TypeScript** - Type-safe JavaScript superset
- **Pinia** - Vue state management library
- **Tailwind CSS** - Utility-first CSS framework
- **Pixi.js** - High-performance 2D WebGL rendering engine
- **Vite** - Next-generation frontend build tool
- **pnpm** - Fast, disk space efficient package manager
- **Prettier** - Code formatter

## Getting Started

### Install Dependencies

```bash
pnpm install
```

### Development Mode

```bash
pnpm dev
```

### Build for Production

```bash
pnpm build
```

### Preview Production Build

```bash
pnpm preview
```

### Code Formatting

Format all code:

```bash
pnpm format
```

Check code format:

```bash
pnpm format:check
```

## Project Structure

```
slotEngine/
├── src/
│   ├── assets/          # Static assets
│   │   └── images/      # Image files
│   ├── components/      # Vue components
│   │   ├── slot-engine/  # Slot engine core
│   │   │   ├── config/  # Engine configuration
│   │   │   │   └── slotConfig.ts
│   │   │   ├── reel/    # Reel system
│   │   │   │   ├── Reel.ts
│   │   │   │   ├── ReelTile.ts
│   │   │   │   └── ReelManager.ts
│   │   │   ├── animation/  # Animation system
│   │   │   │   └── AnimationLoop.ts
│   │   │   ├── types/   # Type definitions
│   │   │   │   └── index.ts
│   │   │   ├── SlotEngine.ts  # Main engine class
│   │   │   └── index.ts  # Engine exports
│   │   └── PixiCanvas.vue
│   ├── stores/          # Pinia stores
│   │   └── game.ts
│   ├── utils/           # Utility functions
│   │   └── preloadAssets.ts  # Asset preloading utilities
│   ├── App.vue          # Root component
│   ├── main.ts          # Application entry
│   ├── env.d.ts         # TypeScript environment type definitions
│   └── style.css        # Global styles
├── index.html           # HTML template
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript configuration
├── tsconfig.node.json   # TypeScript Node configuration
├── tailwind.config.js   # Tailwind configuration
├── .prettierrc          # Prettier configuration
├── .prettierignore      # Prettier ignore file
└── package.json         # Project configuration
```

## Features

- ✅ Vue 3 Composition API
- ✅ TypeScript type safety
- ✅ Pinia state management
- ✅ Tailwind CSS styling
- ✅ Pixi.js animation rendering
- ✅ Responsive design
- ✅ Hot Module Replacement (HMR)
- ✅ Prettier code formatting
- ✅ Seamless infinite scrolling slot machine
- ✅ Object pooling for optimal performance

## Architecture

### Slot Machine Reel System

The slot machine uses an optimized **5-tile object pooling** architecture for seamless infinite scrolling.

#### Why 5 Tiles?

Although only 3 tiles are visible on screen, we need buffer zones to achieve seamless infinite scrolling:

- **Tile 0 (Top Buffer)**: Located above the visible area, ready to enter the screen
- **Tile 1 (Visible)**: Top row (visible)
- **Tile 2 (Visible)**: Middle row (visible)
- **Tile 3 (Visible)**: Bottom row (visible)
- **Tile 4 (Bottom Buffer)**: Located below the visible area, just left the screen (prevents visual glitches during fast scrolling)

**Summary**: 3 reels × 5 tiles = Only 15 Sprite objects to maintain

#### Object Pooling Logic

Instead of generating hundreds of tiles for spinning, we reuse these 5 objects:

1. **Translation**: Each frame, move all tiles downward (assuming top-to-bottom spinning)
2. **Boundary Check**: When the bottommost Tile 4 completely exits the screen boundary
3. **Instant Relocation**: Immediately teleport it to the top (to Tile 0's position)
4. **Texture Swap**: Change its texture to the next required symbol
5. **Loop**: Repeat this process, creating the visual illusion of infinite scrolling

#### Visual Structure

Assuming window height is 300px (each tile is 100px):

```
       [ Y: -100 ]  <-- Tile 0 (Hidden, ready to enter)
--------------------------  <-- Window Top Edge (Mask Top)
       [ Y:   0  ]  <-- Tile 1 (Visible)
       [ Y:  100 ]  <-- Tile 2 (Visible)
       [ Y:  200 ]  <-- Tile 3 (Visible)
--------------------------  <-- Window Bottom Edge (Mask Bottom)
       [ Y:  300 ]  <-- Tile 4 (Hidden, just left, ready to teleport back to top)
```

#### Alternative Approaches Comparison

| Approach | Tile Count (per reel) | Pros | Cons | Rating |
|----------|----------------------|------|------|--------|
| Exactly 3 | 3 | Most memory efficient | Cannot spin. Moving will create blank gaps | ❌ Not feasible |
| 4 Tiles | 4 (1 buffer + 3 visible) | Works | Logic is tight. If speed is too fast or frame drops (Lag), edge glitches are likely | ⚠️ Barely usable |
| **5 Tiles** | **5 (1 top + 3 visible + 1 bottom)** | **Best balance** | - | ✅ **Recommended** |
| Strip Texture | N/A (controlled by texture) | Suitable for blur effects | Complex implementation, requires UV Offset or Tiling Sprite handling, difficult to animate individual symbols (e.g., win flash) | ⚠️ Advanced usage |

#### Performance Benefits

- **Memory Efficient**: Only 15 Sprite objects for a 3×3 slot machine
- **Smooth Animation**: No gaps or visual glitches even at high speeds
- **Flexible**: Allows for bounce effects (Back.out easing) and other animations
- **Scalable**: Easy to adjust speed without performance degradation

## Development Guide

### Using Pinia Store

```typescript
import { useGameStore } from '@/stores/game'

const gameStore = useGameStore()
gameStore.incrementScore()
```

### Using Pixi.js

In the `PixiCanvas.vue` component, you can see how to:
- Initialize Pixi.js application
- Create graphics and animations
- Handle responsive adjustments

### Using Tailwind CSS

The project is configured with Tailwind CSS, you can directly use Tailwind utility classes:

```vue
<div class="bg-blue-500 text-white p-4 rounded-lg">
  Content
</div>
```

## License

MIT
