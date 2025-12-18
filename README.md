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

## Architecture

### Directory Structure Philosophy

The slot engine follows a **"Brain (Logic) vs Muscle (View) vs Skeleton (Core)"** separation strategy:

- **`core/`** - Core infrastructure that coordinates the entire engine
- **`logic/`** - Pure logic layer (XState machines, math calculations) - can run unit tests without rendering
- **`view/`** - Pure visual layer (Pixi Sprite/Container) - only handles visual representation
- **`systems/`** - Behavior systems that make views move - scrolling, layout, animation calculations

This separation ensures:

- **Testability**: Logic layer has no Pixi dependencies
- **Maintainability**: Clear responsibilities for each layer
- **Performance**: Physical variables stay in systems, not in state machine context

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

| Approach      | Tile Count (per reel)                | Pros                      | Cons                                                                                                                            | Rating             |
| ------------- | ------------------------------------ | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| Exactly 3     | 3                                    | Most memory efficient     | Cannot spin. Moving will create blank gaps                                                                                      | ❌ Not feasible    |
| 4 Tiles       | 4 (1 buffer + 3 visible)             | Works                     | Logic is tight. If speed is too fast or frame drops (Lag), edge glitches are likely                                             | ⚠️ Barely usable   |
| **5 Tiles**   | **5 (1 top + 3 visible + 1 bottom)** | **Best balance**          | -                                                                                                                               | ✅ **Recommended** |
| Strip Texture | N/A (controlled by texture)          | Suitable for blur effects | Complex implementation, requires UV Offset or Tiling Sprite handling, difficult to animate individual symbols (e.g., win flash) | ⚠️ Advanced usage  |

#### Performance Benefits

- **Memory Efficient**: Only 15 Sprite objects for a 3×3 slot machine
- **Smooth Animation**: No gaps or visual glitches even at high speeds
- **Flexible**: Allows for bounce effects (Back.out easing) and other animations
- **Scalable**: Easy to adjust speed without performance degradation

### XState State Machine

The slot engine uses **XState** to manage complex state transitions, ensuring robust and maintainable state management. The state machine acts as the "brain" that controls state flow, while Pixi.js handles the physical rendering (the "muscle").

#### Architecture Principle: Brain vs Muscle Separation

- **XState (Brain)**: Manages state transitions and commands
- **Pixi.js Ticker (Muscle)**: Executes physical movement (Y coordinate updates)
- **Physical Variables**: Speed and position are kept in the class, NOT in XState context for high performance

This separation ensures:

- **High Performance**: No reactivity overhead from state changes affecting 60fps rendering
- **Maintainability**: State logic is clearly defined and easy to modify
- **Debuggability**: State transitions can be visualized and tracked

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

#### Guards

- **`hasSpunMinDuration`**: Ensures the reel has spun for at least the minimum duration (default: 2000ms) before allowing stop. This prevents the reel from stopping too quickly and provides a better user experience.

#### Context

The state machine context stores:

```typescript
{
  targetIndex: number | null,      // Target symbol index from server
  spinStartTime: number,           // Timestamp when spinning started
  minSpinDuration: number         // Minimum spin duration (2000ms default)
}
```

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

#### Benefits of XState Integration

1. **Decoupling**: Change game logic by modifying state machine config, without touching Pixi rendering code
2. **Visualization**: Use XState Visualizer to debug state transitions
3. **Async Handling**: Guards ensure proper timing (e.g., minimum spin duration)
4. **Extensibility**: Easy to add new states (e.g., Free Game mode, Bonus rounds)
5. **Type Safety**: Full TypeScript support for states, events, and context

## License

MIT
