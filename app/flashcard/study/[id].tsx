import { useEffect, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Dimensions } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useFlashcardStore } from '../../../src/store/flashcardStore';
import { usePomodoroStore } from '../../../src/store/pomodoroStore';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    interpolate,
    Extrapolation
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { soundManager } from '../../../src/services/SoundManager';
import ConfettiCannon from 'react-native-confetti-cannon';

const { width } = Dimensions.get('window');

export default function StudyScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const deckId = Number(id);
    const router = useRouter();
    const { activeCards, loadCardsToReview, reviewCard, loadCards } = useFlashcardStore();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isReverse, setIsReverse] = useState(false);

    const { isRunning, timeLeft, selectedDeckId } = usePomodoroStore();

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    // Animation values
    const spin = useSharedValue(0);

    useEffect(() => {
        if (deckId) {
            loadCardsToReview(deckId);
        }
    }, [deckId]);

    const handleFlip = () => {
        soundManager.playFlip();
        spin.value = isFlipped ? withTiming(0, { duration: 400 }) : withTiming(1, { duration: 400 });
        setIsFlipped(!isFlipped);
    };

    const handleReview = async (quality: number) => {
        const currentCard = activeCards[currentIndex];
        if (!currentCard) return;

        if (quality === 1) soundManager.playFail();
        else if (quality === 3) soundManager.playWarning();
        else soundManager.playSuccess();

        await reviewCard(currentCard.id, quality);

        // Reset thẻ về mặt trước
        spin.value = 0;
        setIsFlipped(false);
    };

    const frontAnimatedStyle = useAnimatedStyle(() => {
        const spinVal = interpolate(spin.value, [0, 1], [0, 180], Extrapolation.CLAMP);
        return {
            transform: [
                { perspective: 1200 },
                { rotateY: `${spinVal}deg` }
            ],
            opacity: interpolate(spin.value, [0, 0.5, 1], [1, 0, 0]),
            zIndex: isFlipped ? 0 : 1
        };
    });

    const backAnimatedStyle = useAnimatedStyle(() => {
        const spinVal = interpolate(spin.value, [0, 1], [180, 360], Extrapolation.CLAMP);
        return {
            transform: [
                { perspective: 1200 },
                { rotateY: `${spinVal}deg` }
            ],
            opacity: interpolate(spin.value, [0, 0.5, 1], [0, 0, 1]),
            zIndex: isFlipped ? 1 : 0
        };
    });

    if (activeCards.length === 0) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#0F172A' : '#F3F4F6' }]} edges={['top', 'bottom']}>
                <Stack.Screen options={{ headerShown: false }} />
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
                        <Ionicons name="chevron-down" size={28} color={isDark ? '#FFF' : '#111827'} />
                    </TouchableOpacity>
                    <ThemedText type="title" style={styles.headerTitle}>Hoàn thành!</ThemedText>
                    <View style={{ width: 44 }} />
                </View>
                <ConfettiCannon count={100} origin={{ x: width / 2, y: 0 }} />
                <View style={styles.centerBox}>
                    <View style={styles.successIconWrapper}>
                        <Ionicons name="checkmark-done" size={90} color="#10B981" />
                    </View>
                    <ThemedText style={[styles.emptyText, { color: isDark ? '#FFF' : '#111827' }]}>Tuyệt vời!</ThemedText>
                    <ThemedText style={styles.subText}>Bạn đã hoàn thành mục tiêu ôn tập thẻ.</ThemedText>

                    <TouchableOpacity activeOpacity={0.8} onPress={() => router.back()} style={{ width: '100%', marginTop: 50 }}>
                        <LinearGradient
                            colors={['#4F46E5', '#3B82F6']}
                            style={styles.goBackBtn}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <ThemedText style={{ color: '#FFF', fontWeight: '800', fontSize: 18 }}>Quay lại</ThemedText>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity activeOpacity={0.8} onPress={() => loadCards(deckId)} style={{ width: '100%', marginTop: 15 }}>
                        <LinearGradient
                            colors={['#10B981', '#059669']}
                            style={styles.goBackBtn}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <ThemedText style={{ color: '#FFF', fontWeight: '800', fontSize: 18 }}>Học lại toàn bộ thẻ</ThemedText>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const currentCard = activeCards[0];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#0F172A' : '#F3F4F6' }]} edges={['top', 'bottom']}>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
                    <Ionicons name="close" size={26} color={isDark ? '#FFF' : '#111827'} />
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <TouchableOpacity
                        onPress={() => setIsReverse(!isReverse)}
                        style={[styles.reverseBtn, { backgroundColor: isReverse ? '#4F46E5' : (isDark ? '#1E293B' : '#E5E7EB') }]}
                    >
                        <Ionicons name="repeat" size={20} color={isReverse ? '#FFF' : (isDark ? '#94A3B8' : '#4B5563')} />
                    </TouchableOpacity>

                    {isRunning && selectedDeckId === deckId && (
                        <View style={[styles.progressBadge, { backgroundColor: '#FEE2E2', flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
                            <Ionicons name="timer" size={16} color="#DC2626" />
                            <ThemedText style={{ fontSize: 15, fontWeight: '700', color: '#DC2626' }}>
                                {formatTime(timeLeft)}
                            </ThemedText>
                        </View>
                    )}

                    <View style={[styles.progressBadge, { backgroundColor: isDark ? '#1E293B' : '#E5E7EB' }]}>
                        <ThemedText style={{ fontSize: 15, fontWeight: '700', color: isDark ? '#94A3B8' : '#4B5563' }}>
                            Cần ôn: {activeCards.length}
                        </ThemedText>
                    </View>
                </View>
            </View>

            <View style={styles.cardContainer}>
                <Animated.View style={[styles.card, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', shadowColor: isDark ? '#000' : '#475569' }, frontAnimatedStyle]}>
                    <Text style={[styles.cardText, { color: isDark ? '#F8FAFC' : '#111827' }]}>
                        {isReverse ? currentCard?.back : currentCard?.front}
                    </Text>
                </Animated.View>

                <Animated.View style={[styles.card, { backgroundColor: isDark ? '#334155' : '#E0E7FF', shadowColor: isDark ? '#000' : '#4F46E5', borderWidth: isDark ? 0 : 2, borderColor: isDark ? 'transparent' : '#C7D2FE' }, backAnimatedStyle]}>
                    <Text style={[styles.cardText, { color: isDark ? '#F8FAFC' : '#1E40AF', fontSize: 28 }]}>
                        {isReverse ? currentCard?.front : currentCard?.back}
                    </Text>
                </Animated.View>
            </View>

            <View style={styles.bottomArea}>
                {!isFlipped ? (
                    <TouchableOpacity activeOpacity={0.8} onPress={handleFlip} style={{ width: '100%' }}>
                        <LinearGradient
                            colors={['#4F46E5', '#3B82F6']}
                            style={styles.flipBtn}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <ThemedText style={styles.flipBtnText}>Hiển thị đáp án</ThemedText>
                        </LinearGradient>
                    </TouchableOpacity>
                ) : (
                    <View style={styles.actionRow}>
                        <TouchableOpacity activeOpacity={0.8} style={styles.actionBtnWrapper} onPress={() => handleReview(1)}>
                            <LinearGradient colors={['#EF4444', '#DC2626']} style={styles.actionBtn}>
                                <Text style={styles.actionBtnText}>Khó</Text>
                                <Text style={styles.actionBtnSub}>Học lại</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity activeOpacity={0.8} style={styles.actionBtnWrapper} onPress={() => handleReview(3)}>
                            <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.actionBtn}>
                                <Text style={styles.actionBtnText}>Tạm</Text>
                                <Text style={styles.actionBtnSub}>Nhớ 1 phần</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity activeOpacity={0.8} style={styles.actionBtnWrapper} onPress={() => handleReview(5)}>
                            <LinearGradient colors={['#10B981', '#059669']} style={styles.actionBtn}>
                                <Text style={styles.actionBtnText}>Dễ</Text>
                                <Text style={styles.actionBtnSub}>Nhớ lâu</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 20 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 15, marginBottom: 30 },
    headerTitle: { fontSize: 24, fontWeight: '800' },
    backBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
    reverseBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    progressBadge: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },

    centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
    successIconWrapper: { width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(16, 185, 129, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
    emptyText: { fontSize: 32, fontWeight: '800', marginTop: 10 },
    subText: { fontSize: 16, color: '#94A3B8', marginTop: 15, textAlign: 'center', lineHeight: 24 },
    goBackBtn: { paddingVertical: 18, borderRadius: 16, alignItems: 'center', shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },

    cardContainer: {
        flex: 1,
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    card: {
        position: 'absolute',
        width: width - 40,
        height: '80%',
        maxHeight: 500,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        backfaceVisibility: 'hidden',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
        padding: 30
    },
    cardText: { fontSize: 36, fontWeight: '800', textAlign: 'center', lineHeight: 46 },

    bottomArea: { paddingBottom: 40, paddingTop: 20 },
    flipBtn: {
        paddingVertical: 20,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6
    },
    flipBtnText: { color: '#FFF', fontSize: 20, fontWeight: '800', letterSpacing: 1 },

    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12
    },
    actionBtnWrapper: { flex: 1 },
    actionBtn: {
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 4
    },
    actionBtnText: { color: '#FFF', fontSize: 18, fontWeight: '800' },
    actionBtnSub: { color: '#FFF', fontSize: 13, opacity: 0.9, marginTop: 4, fontWeight: '600' }
});
