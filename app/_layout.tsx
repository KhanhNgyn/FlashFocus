import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useFlashcardStore } from '../src/store/flashcardStore';
import { usePomodoroStore } from '../src/store/pomodoroStore';
import { useInterval } from '../src/hooks/useInterval';
import { schedulePomodoroFinishNotification } from '../src/services/Notifications';
import { useEffect } from 'react';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const initializeDb = useFlashcardStore((state) => state.initialize);

  const { isRunning, tick, timeLeft } = usePomodoroStore();

  useEffect(() => {
    initializeDb();
  }, [initializeDb]);

  useInterval(() => {
    const wasRunning = usePomodoroStore.getState().isRunning;
    tick();
    const isRunningNow = usePomodoroStore.getState().isRunning;

    // Timer just finished
    if (wasRunning && !isRunningNow) {
      schedulePomodoroFinishNotification();
    }
  }, isRunning ? 1000 : null);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
