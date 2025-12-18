# Slot Engine

A modern project built with Pixi.js + Vue 3 + Pinia + Tailwind CSS.

## Live Demo

[Play Demo](https://hungchicheng.github.io/pixi-slot-engine/)

## Tech Stack

- **Pixi.js** - High-performance 2D WebGL rendering engine
- **Vue 3** - Progressive JavaScript framework
- **TypeScript** - Type-safe JavaScript superset
- **Pinia** - Vue state management library
- **XState** - State machine library for complex state management
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Next-generation frontend build tool
- **pnpm** - Fast, disk space efficient package manager
- **Prettier** - Code formatter

## Getting Started

```bash
pnpm install
pnpm dev
pnpm build
```

## Project Structure

```
slotEngine/
├── src/
│   ├── assets/          # Static assets
│   │   └── images/      # Image files
│   ├── components/      # Vue components
│   │   ├── slot-engine/  # Slot engine core
│   │   │   ├── core/    # Core engine (skeleton)
│   │   │   │   ├── GameLoop.ts      # Unified Pixi Ticker management
│   │   │   │   └── SlotEngine.ts    # Main engine class
│   │   │   ├── logic/   # Brain (Logic layer)
│   │   │   │   ├── config.ts        # Slot configuration
│   │   │   │   ├── reelMachine.ts   # XState state machine
│   │   │   │   └── types.ts         # Logic type definitions
│   │   │   ├── systems/ # Behavior systems
│   │   │   │   ├── scrolling.ts     # Y-axis movement & tile reuse logic
│   │   │   │   ├── layout.ts        # Initial position calculations
│   │   │   │   └── animation.ts     # Bounce animation formulas
│   │   │   ├── view/    # Muscle (View layer - Pixi components)
│   │   │   │   ├── SlotStage.ts     # Main slot stage (manages 3 reels)
│   │   │   │   ├── Reel.ts          # Single reel container
│   │   │   │   ├── Tile.ts           # Single symbol sprite
│   │   │   │   └── types.ts          # View type definitions
│   │   │   └── index.ts             # Engine exports
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

### Architecture: Brain vs Muscle vs Skeleton Separation

The slot engine follows a clear separation of concerns:

- **`core/` (Skeleton)**: Core infrastructure - GameLoop and SlotEngine coordination
- **`logic/` (Brain)**: Pure logic layer - XState machines, configuration, no Pixi dependencies
- **`view/` (Muscle)**: Pure visual layer - Pixi components (Sprite, Container), no complex movement logic
- **`systems/` (Behavior)**: Systems that make views move - scrolling, layout, animation calculations

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
- ✅ XState state machine for robust state management
- ✅ Accelerating, spinning, and bounce animations

### Key Technical Implementations

#### 1. Pre-generated Blur Textures (Optimization)

To ensure 60fps performance during high-speed spinning, we do NOT apply real-time blur filters (which are expensive). Instead, we pre-generate blurred versions of all symbols at application startup.

- **Process**: At app launch, we generate a `symbol_blur.png` for each symbol.
- **Storage**: These textures are stored in a global Cache.
- **Usage**: When the reel spins fast, we simply swap the texture from `symbol.png` to `symbol_blur.png`. This is a cheap O(1) operation compared to calculating Gaussian blur every frame.

#### 2. Infinite Scrolling Logic (Recycle System)

The infinite scrolling illusion is achieved by checking the Y-position of each tile in the `ScrollingSystem`:

```typescript
// Pseudo-code logic
if (tile.y > limits.bottom) {
  // 1. Move tile to the very top (above buffer)
  tile.y = limits.top

  // 2. Assign a new Texture ID (Symbol)
  tile.textureId = getNextSymbol()
}
```

This ensures we only ever need 5 Sprite objects per reel to simulate an infinitely long strip of potential symbols.

#### 3. Bounce-back Effect (GSAP Integration)

For the premium "mechanical feel" when the reel stops, we use **GSAP (GreenSock Animation Platform)** instead of writing custom physics implementations.

- **Easing**: We use `Back.out(0.5)` to create the characteristic recoil/overshoot effect when the reel lands on the target.
- **Implementation**: The `AnimationSystem` calculates the final resting position and delegates the tweening math to GSAP for silky smooth 60fps easing curves.

### XState State Machine

The slot engine uses **XState** to manage complex state transitions, ensuring robust and maintainable state management. The state machine acts as the "brain" that controls state flow, while Pixi.js handles the physical rendering (the "muscle").

#### State Flow

```
idle → accelerating → spinning → pre_stop → bounce → idle
```

#### State Descriptions

| State            | Description                                                                          | Trigger                                        | Next State     |
| ---------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------- | -------------- |
| **idle**         | Initial state, reel is stationary                                                    | `START` event                                  | `accelerating` |
| **accelerating** | Reel is speeding up                                                                  | `SPEED_REACHED` event (when max speed reached) | `spinning`     |
| **spinning**     | Reel is spinning at maximum speed, waiting for server response                       | `STOP_COMMAND` event (with Guard check)        | `pre_stop`     |
| **pre_stop**     | Positioning to target location                                                       | `READY_TO_STOP` event                          | `bounce`       |
| **decelerating** | (Deprecated) Reel is slowing down - no longer used, pre_stop goes directly to bounce | `STOPPED` event (when speed < threshold)       | `bounce`       |
| **bounce**       | Final bounce animation                                                               | `ANIMATION_DONE` event                         | `idle`         |

#### Events

| Event            | Description                                                       | Sent By                                   |
| ---------------- | ----------------------------------------------------------------- | ----------------------------------------- |
| `START`          | Begin spinning                                                    | User action / `startSpin()`               |
| `SPEED_REACHED`  | Speed has reached maximum                                         | Pixi ticker (when `speed >= MAX_SPEED`)   |
| `STOP_COMMAND`   | Request to stop with target index                                 | Server response / `stopSpin(resultIndex)` |
| `READY_TO_STOP`  | Positioned to target location, ready to stop                      | Pixi ticker (after positioning to target) |
| `STOPPED`        | (Deprecated) Deceleration complete, reel stopped - no longer used | Pixi ticker (when `speed < MIN_SPEED`)    |
| `ANIMATION_DONE` | Bounce animation complete                                         | Pixi ticker (after animation finishes)    |

#### Usage Example

```typescript
// Start spinning
reel.startSpin() // Sends START event

// Stop spinning (state machine checks Guard before accepting)
reel.stopSpin(resultIndex) // Sends STOP_COMMAND event

// The update loop automatically handles state transitions
// Physical variables (speed, position) are updated in the ticker
// based on the current state
```

## License

MIT
