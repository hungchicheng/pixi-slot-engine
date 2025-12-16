import { setup, assign } from 'xstate'

/**
 * Reel State Machine
 * Manages state transitions (idle -> accelerating -> spinning -> pre_stop -> bounce -> idle)
 * Physical movement is handled by Pixi Ticker.
 */
export interface ReelContext {
  targetIndex: number | null // Target symbol index from server
  spinStartTime: number // Timestamp when spinning started
  minSpinDuration: number // Minimum spin duration (ensures at least a certain amount of time)
}

export type ReelEvent =
  | { type: 'START' }
  | { type: 'SPEED_REACHED' }
  | { type: 'STOP_COMMAND'; resultIndex: number }
  | { type: 'READY_TO_STOP' }
  | { type: 'STOPPED' }
  | { type: 'ANIMATION_DONE' }

export const reelMachine = setup({
  types: {
    context: {} as ReelContext,
    events: {} as ReelEvent,
  },
  guards: {
    // Ensure minimum spin duration before allowing stop
    hasSpunMinDuration: ({ context }) => {
      if (context.spinStartTime === 0) return false
      const elapsed = Date.now() - context.spinStartTime
      return elapsed >= context.minSpinDuration
    },
  },
  actions: {
    recordSpinStart: assign({
      spinStartTime: () => Date.now(),
    }),
    // Update target index
    setTargetIndex: assign({
      targetIndex: ({ event }) => {
        if (event.type === 'STOP_COMMAND') {
          return event.resultIndex
        }
        return null
      },
    }),
  },
}).createMachine({
  id: 'reel',
  initial: 'idle',
  context: {
    targetIndex: null,
    spinStartTime: 0,
    minSpinDuration: 2000, // Minimum spin duration: 2 seconds
  },
  states: {
    idle: {
      on: {
        START: {
          target: 'accelerating',
          actions: 'recordSpinStart',
        },
      },
    },
    accelerating: {
      on: {
        SPEED_REACHED: {
          target: 'spinning',
        },
      },
    },
    spinning: {
      on: {
        STOP_COMMAND: {
          target: 'pre_stop',
          guard: 'hasSpunMinDuration',
          actions: 'setTargetIndex',
        },
      },
    },
    pre_stop: {
      on: {
        READY_TO_STOP: {
          target: 'bounce',
        },
      },
    },
    decelerating: {
      on: {
        STOPPED: {
          target: 'bounce',
        },
      },
    },
    bounce: {
      on: {
        ANIMATION_DONE: {
          target: 'idle',
        },
      },
    },
  },
})
