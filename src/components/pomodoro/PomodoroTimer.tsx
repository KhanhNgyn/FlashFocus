import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, AppState, AppStateStatus } from 'react-native';
import { useColorScheme } from '../../../hooks/use-color-scheme';
import { useFlashcardStore } from '../../store/flashcardStore';
import { usePomodoroStore } from '../../store/pomodoroStore';
import { useRouter } from 'expo-router';
import { ScrollView } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

export default function PomodoroTimer() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const router = useRouter();
    const { decks } = useFlashcardStore();

    const {
        timeLeft,
        isRunning,
        selectedDeckId,
        startTimer,
        giveUp,
        setSelectedDeckId
    } = usePomodoroStore();

    useEffect(() => {
        let backgroundTime: Date | null = null;
        const handleAppStateChange = (nextAppState: AppStateStatus) => {
            if (nextAppState === 'background' && isRunning) {
                backgroundTime = new Date();
            } else if (nextAppState === 'active' && isRunning && backgroundTime) {
                const timeAway = Math.floor((new Date().getTime() - backgroundTime.getTime()) / 1000);
                usePomodoroStore.getState().setTimeLeft((prev) => Math.max(0, prev - timeAway));
                backgroundTime = null;
            }
        };
        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => subscription.remove();
    }, [isRunning]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const handleGiveUp = () => {
        Alert.alert(
            "Bạn muốn bỏ cuộc?",
            "Nếu bạn dừng lại bây giờ, thời gian sẽ bị hủy bỏ và phiên tập trung này sẽ không được ghi nhận.",
            [
                { text: "Tiếp tục học", style: "cancel" },
                {
                    text: "Bỏ cuộc",
                    style: "destructive",
                    onPress: () => {
                        giveUp();
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <View style={[styles.timerCircle, isDark ? styles.timerCircleDark : styles.timerCircleLight]}>
                <Text style={[styles.timeText, { color: isDark ? '#FFFFFF' : '#1F2937' }]}>
                    {formatTime(timeLeft)}
                </Text>
                <Text style={[styles.statusText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                    {isRunning ? 'Tập trung cao độ...' : 'Sẵn sàng'}
                </Text>
            </View>

            <View style={styles.controls}>
                {!isRunning ? (
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => {
                            if (selectedDeckId) {
                                router.push(`/flashcard/study/${selectedDeckId}` as any);
                            }
                            startTimer();
                        }}
                    >
                        <LinearGradient
                            colors={['#4F46E5', '#3B82F6']}
                            style={styles.gradientButton}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Text style={styles.buttonText}>Bắt đầu</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={handleGiveUp}
                    >
                        <LinearGradient
                            colors={['#EF4444', '#DC2626']}
                            style={styles.gradientButton}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Text style={styles.buttonText}>Từ bỏ</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.deckSelectorContainer}>
                <Text style={[styles.deckTitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                    Ghép nối với phiên học Flashcard:
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 10 }}>
                    {decks.map(deck => (
                        <TouchableOpacity
                            key={deck.id}
                            style={[
                                styles.deckBadge,
                                selectedDeckId === deck.id && styles.deckBadgeActive,
                                { backgroundColor: selectedDeckId !== deck.id ? (isDark ? '#374151' : '#E5E7EB') : undefined }
                            ]}
                            onPress={() => !isRunning && setSelectedDeckId(selectedDeckId === deck.id ? null : deck.id)}
                            disabled={isRunning}
                        >
                            <Text style={[
                                styles.deckBadgeText,
                                selectedDeckId === deck.id && styles.deckBadgeTextActive,
                                { color: selectedDeckId !== deck.id ? (isDark ? '#D1D5DB' : '#4B5563') : undefined }
                            ]}>
                                {deck.title}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { alignItems: 'center', justifyContent: 'center', padding: 20, width: '100%' },
    timerCircle: {
        width: 280,
        height: 280,
        borderRadius: 140,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 40,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
    },
    timerCircleLight: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000000',
    },
    timerCircleDark: {
        backgroundColor: '#1F2937',
        shadowColor: '#000000',
    },
    timeText: {
        fontSize: 72,
        fontWeight: '800',
        letterSpacing: 2,
    },
    statusText: {
        fontSize: 18,
        fontWeight: '500',
        marginTop: 10,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    controls: {
        flexDirection: 'row',
        gap: 20
    },
    gradientButton: {
        paddingHorizontal: 25,
        paddingVertical: 15,
        borderRadius: 25,
        minWidth: 140,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 0.5
    },
    deckSelectorContainer: {
        marginTop: 40,
        width: '100%',
        alignItems: 'center'
    },
    deckTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 5
    },
    deckBadge: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20
    },
    deckBadgeActive: {
        backgroundColor: '#4F46E5'
    },
    deckBadgeText: {
        fontSize: 14,
        fontWeight: '600'
    },
    deckBadgeTextActive: {
        color: '#FFF'
    }
});
