import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Dimensions, ActivityIndicator } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { getReviewStats, getTodayReviewCount, DailyStats } from '../../src/services/Database';
import { useIsFocused } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function StatsScreen() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const isFocused = useIsFocused();

    const [isLoading, setIsLoading] = useState(true);
    const [todayCount, setTodayCount] = useState(0);
    const [chartData, setChartData] = useState<{ labels: string[], datasets: [{ data: number[] }] }>({
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{ data: [0, 0, 0, 0, 0, 0, 0] }]
    });

    const loadStats = async () => {
        setIsLoading(true);
        try {
            const today = await getTodayReviewCount();
            setTodayCount(today);

            const stats = await getReviewStats(7);

            // Prepare 7 days labels
            const labels: string[] = [];
            const data: number[] = [];
            const now = new Date();
            for (let i = 6; i >= 0; i--) {
                const d = new Date(now);
                d.setDate(d.getDate() - i);
                // "YYYY-MM-DD" local format approx
                const dateStr = d.toLocaleDateString('en-CA');
                labels.push(d.getDate().toString()); // only show day number

                const statForDay = stats.find(s => s.dateStr === dateStr);
                data.push(statForDay ? statForDay.count : 0);
            }

            setChartData({
                labels,
                datasets: [{ data }]
            });

        } catch (error) {
            console.error("Lỗi khi tải thống kê:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isFocused) {
            loadStats();
        }
    }, [isFocused]);

    const chartConfig = {
        backgroundGradientFrom: isDark ? '#1E293B' : '#FFFFFF',
        backgroundGradientTo: isDark ? '#1E293B' : '#FFFFFF',
        color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`,
        labelColor: (opacity = 1) => isDark ? `rgba(148, 163, 184, ${opacity})` : `rgba(107, 114, 128, ${opacity})`,
        strokeWidth: 3,
        barPercentage: 0.5,
        useShadowColorFromDataset: false
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#0F172A' : '#F3F4F6' }]}>
            <View style={styles.header}>
                <ThemedText type="title" style={styles.headerTitle}>Thống Kê</ThemedText>
                <ThemedText style={styles.headerSubtitle}>Theo dõi quá trình học tập</ThemedText>
            </View>

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4F46E5" />
                </View>
            ) : (
                <>
                    <View style={styles.cardsRow}>
                        <LinearGradient
                            colors={['#4F46E5', '#3B82F6']}
                            style={styles.statCard}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Ionicons name="flame" size={32} color="#FFF" />
                            <Text style={styles.statNumber}>{todayCount}</Text>
                            <Text style={styles.statLabel}>Thẻ ôn hôm nay</Text>
                        </LinearGradient>
                    </View>

                    <View style={[styles.chartContainer, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
                        <ThemedText style={[styles.chartTitle, { color: isDark ? '#F8FAFC' : '#111827' }]}>
                            HOẠT ĐỘNG 7 NGÀY QUA
                        </ThemedText>
                        <LineChart
                            data={chartData}
                            width={width - 40}
                            height={220}
                            chartConfig={chartConfig}
                            fromZero
                            bezier
                            style={{
                                marginVertical: 8,
                                borderRadius: 16,
                            }}
                        />
                    </View>
                </>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 20 },
    header: { marginTop: 20, marginBottom: 25 },
    headerTitle: { fontSize: 32, fontWeight: '800' },
    headerSubtitle: { fontSize: 16, opacity: 0.7, marginTop: 5 },

    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    cardsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
    statCard: {
        flex: 1,
        padding: 20,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    statNumber: { fontSize: 40, fontWeight: '800', color: '#FFF', marginVertical: 8 },
    statLabel: { fontSize: 14, color: '#E0E7FF', fontWeight: '600' },

    chartContainer: {
        paddingVertical: 20,
        borderRadius: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    chartTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10, letterSpacing: 0.5 }
});
