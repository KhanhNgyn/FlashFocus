import { View, Platform, StyleSheet, Dimensions, TouchableOpacity, Text } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import PomodoroTimer from '../../src/components/pomodoro/PomodoroTimer';
import { setupNotifications } from '../../src/services/Notifications';
import { useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useThemeStore } from '../../src/store/themeStore';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useFlashcardStore } from '../../src/store/flashcardStore';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { mode, setMode } = useThemeStore();
  const { isPremium, user, logout } = useFlashcardStore();

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const toggleTheme = () => {
    if (mode === 'light' || (mode === 'system' && !isDark)) {
      setMode('dark');
    } else {
      setMode('light');
    }
  };

  useEffect(() => {
    setupNotifications();
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#0F172A' : '#F3F4F6' }]} edges={['top']}>
      <LinearGradient
        colors={isDark ? ['#1E293B', '#0F172A'] : ['#FFFFFF', '#F3F4F6']}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <ThemedText type="title" style={styles.greeting}>Xin chào, {user?.username || 'Bạn'}</ThemedText>
              {isPremium && (
                <View style={styles.premiumBadge}>
                  <Text style={styles.premiumText}>PREMIUM</Text>
                </View>
              )}
            </View>
            <ThemedText style={styles.subGreeting}>Hôm nay bạn muốn học gì?</ThemedText>
          </View>
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={toggleTheme}
              style={[styles.avatar, { backgroundColor: isDark ? '#334155' : '#E5E7EB', marginRight: 10 }]}
            >
              <Ionicons name={isDark ? "moon" : "sunny"} size={22} color={isDark ? '#FACC15' : '#F59E0B'} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleLogout}
              style={[styles.avatar, { backgroundColor: isDark ? '#334155' : '#FEE2E2' }]}
            >
              <Ionicons name="log-out-outline" size={22} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <PomodoroTimer />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingHorizontal: 25,
    paddingTop: Platform.OS === 'android' ? 20 : 10,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 15,
    opacity: 0.7,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingTop: 40,
    alignItems: 'center',
  },
  premiumBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 5,
    marginLeft: 10,
  },
  premiumText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
  }
});
