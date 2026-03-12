import { create } from 'zustand';

const POMODORO_TIME = 25 * 60; // 25 Min
const SHORT_BREAK_TIME = 5 * 60; // 5 Min

export type PomodoroMode = 'pomodoro' | 'short_break';

interface PomodoroState {
    timeLeft: number;
    isRunning: boolean;
    mode: PomodoroMode;
    selectedDeckId: number | null;

    // Actions
    startTimer: () => void;
    stopTimer: () => void;
    tick: () => void; // Called every second by the global interval
    resetTimer: () => void;
    setMode: (mode: PomodoroMode) => void;
    setSelectedDeckId: (id: number | null) => void;
    setTimeLeft: (time: number | ((prev: number) => number)) => void;
    giveUp: () => void; // Stops timer and unselects deck
}

export const usePomodoroStore = create<PomodoroState>((set, get) => ({
    timeLeft: POMODORO_TIME,
    isRunning: false,
    mode: 'pomodoro',
    selectedDeckId: null,

    startTimer: () => set({ isRunning: true }),

    stopTimer: () => set({ isRunning: false }),

    tick: () => {
        const { isRunning, timeLeft } = get();
        if (!isRunning) return;

        if (timeLeft <= 1) {
            set({ isRunning: false, timeLeft: 0 });
            // The notification or side-effects will be handled by the UI / hook listener
        } else {
            set({ timeLeft: timeLeft - 1 });
        }
    },

    resetTimer: () => {
        const { mode } = get();
        set({
            timeLeft: mode === 'pomodoro' ? POMODORO_TIME : SHORT_BREAK_TIME,
            isRunning: false
        });
    },

    setMode: (mode) => set({
        mode,
        timeLeft: mode === 'pomodoro' ? POMODORO_TIME : SHORT_BREAK_TIME,
        isRunning: false
    }),

    setSelectedDeckId: (id) => set({ selectedDeckId: id }),

    setTimeLeft: (time) => set((state) => ({
        timeLeft: typeof time === 'function' ? time(state.timeLeft) : time
    })),

    giveUp: () => {
        set({
            isRunning: false,
            timeLeft: POMODORO_TIME,
            mode: 'pomodoro',
            selectedDeckId: null
        });
    }
}));
