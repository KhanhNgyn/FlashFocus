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
  initialRouteName: 'login',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const initializeDb = useFlashcardStore((state) => state.initialize);
  const isLoggedIn = useFlashcardStore((state) => state.isLoggedIn);

  const { isRunning, tick } = usePomodoroStore();

  useEffect(() => {
    console.log('RootLayout Render - isLoggedIn:', isLoggedIn);
    initializeDb();
  }, [initializeDb, isLoggedIn]);

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
        {!isLoggedIn ? (
          <>
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="register" options={{ title: 'Đăng ký', headerTintColor: '#3b82f6' }} />
          </>
        ) : (
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        )}
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
