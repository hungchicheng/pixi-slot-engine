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
