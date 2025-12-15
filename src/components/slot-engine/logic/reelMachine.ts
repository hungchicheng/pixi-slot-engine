import { setup, assign } from 'xstate'

/**
 * Reel State Machine
 * 
 * The state machine manages the reel's state transitions, not the physical movement.
 * Physical movement (Y coordinate updates) is handled by Pixi Ticker based on current state.
 * 
 * State flow:
 * idle -> accelerating -> spinning -> pre_stop -> decelerating -> bounce -> idle
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
  | { type: 'READY_TO_DECEL' }
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
    // Record the time when spinning starts
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
      // Acceleration phase: wait for speed to reach maximum
      // When speed reaches MaxSpeed, Pixi will send 'SPEED_REACHED' event
      on: {
        SPEED_REACHED: {
          target: 'spinning',
        },
      },
    },
    spinning: {
      // Spinning phase: wait for server response
      // Guard will check if minimum spin duration has been met
      on: {
        STOP_COMMAND: {
          target: 'pre_stop',
          guard: 'hasSpunMinDuration',
          actions: 'setTargetIndex',
        },
      },
    },
    pre_stop: {
      // Pre-stop phase: calculate remaining distance needed for alignment
      // After calculation, Pixi will send 'READY_TO_DECEL' event
      on: {
        READY_TO_DECEL: {
          target: 'decelerating',
        },
      },
    },
    decelerating: {
      // Deceleration phase: execute deceleration animation
      // After deceleration completes, Pixi will send 'STOPPED' event
      on: {
        STOPPED: {
          target: 'bounce',
        },
      },
    },
    bounce: {
      // Bounce animation phase
      // After animation completes, Pixi will send 'ANIMATION_DONE' event
      on: {
        ANIMATION_DONE: {
          target: 'idle',
        },
      },
    },
  },
})

