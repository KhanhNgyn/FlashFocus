import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Linking, ActivityIndicator, AppState } from 'react-native';
import { useFlashcardStore } from '@/src/store/flashcardStore';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import ConfettiCannon from 'react-native-confetti-cannon';
import api from '@/src/services/api';

export default function PremiumScreen() {
    const { isPremium, processPayment, setPremium } = useFlashcardStore();
    const [showConfetti, setShowConfetti] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const router = useRouter();
    const appState = useRef(AppState.currentState);

    // Re-check premium status when app returns from VNPay browser
    useEffect(() => {
        const subscription = AppState.addEventListener('change', async (nextAppState) => {
            if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
                // App came back to foreground - check if user is now premium
                try {
                    const res = await api.get('/api/auth/me');
                    if (res.data?.isPremium) {
                        setPremium(true);
                        setShowConfetti(true);
                    }
                } catch (e) {
                    console.log('Premium check failed:', e);
                }
            }
            appState.current = nextAppState;
        });
        return () => subscription.remove();
    }, []);

    const handleVNPayPayment = async () => {
        setIsProcessing(true);
        try {
            const result = await processPayment(199000, '');
            if (result?.paymentUrl) {
                // Open VNPay payment page in browser
                await Linking.openURL(result.paymentUrl);
                Alert.alert(
                    'Thanh toán VNPay',
                    'Trang thanh toán VNPay đã được mở trong trình duyệt. Sau khi thanh toán xong, hãy quay lại ứng dụng.',
                    [{ text: 'OK' }]
                );
            }
        } catch (e) {
            Alert.alert('Lỗi', 'Không thể kết nối tới cổng thanh toán. Vui lòng thử lại sau.');
        } finally {
            setIsProcessing(false);
        }
    };

    if (isPremium) {
        return (
            <View style={styles.container}>
                {showConfetti && <ConfettiCannon count={200} origin={{ x: -10, y: 0 }} />}
                <Ionicons name="checkmark-circle" size={100} color="#4CAF50" />
                <Text style={styles.title}>Bạn đang là Premium!</Text>
                <Text style={styles.subtitle}>Tận hưởng đầy đủ các tính năng đồng bộ và thống kê chuyên sâu.</Text>
                <TouchableOpacity style={styles.button} onPress={() => router.back()}>
                    <Text style={styles.buttonText}>Quay lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Ionicons name="star" size={80} color="#FFD700" style={{ marginBottom: 20 }} />
            <Text style={styles.title}>Nâng cấp Premium</Text>
            <Text style={styles.description}>
                Mở khóa tất cả tính năng, đồng bộ đám mây và ủng hộ đội ngũ phát triển FlashFocus!
            </Text>

            {/* Features list */}
            <View style={styles.featureCard}>
                <View style={styles.featureRow}>
                    <Ionicons name="cloud-outline" size={24} color="#3b82f6" />
                    <Text style={styles.featureText}>Đồng bộ đám mây không giới hạn</Text>
                </View>
                <View style={styles.featureRow}>
                    <Ionicons name="stats-chart-outline" size={24} color="#3b82f6" />
                    <Text style={styles.featureText}>Thống kê học tập chuyên sâu</Text>
                </View>
                <View style={styles.featureRow}>
                    <Ionicons name="people-outline" size={24} color="#3b82f6" />
                    <Text style={styles.featureText}>Chia sẻ bộ thẻ cộng đồng</Text>
                </View>
                <View style={styles.featureRow}>
                    <Ionicons name="sparkles-outline" size={24} color="#3b82f6" />
                    <Text style={styles.featureText}>Hỗ trợ ưu tiên & cập nhật sớm</Text>
                </View>
            </View>

            {/* Price */}
            <View style={styles.priceContainer}>
                <Text style={styles.priceLabel}>Chỉ với</Text>
                <Text style={styles.price}>199.000đ</Text>
                <Text style={styles.pricePeriod}>trọn đời</Text>
            </View>

            {/* VNPay Button */}
            <TouchableOpacity 
                style={[styles.vnpayButton, { opacity: isProcessing ? 0.7 : 1 }]} 
                onPress={handleVNPayPayment}
                disabled={isProcessing}
            >
                {isProcessing ? (
                    <ActivityIndicator color="#fff" style={{ marginRight: 10 }} />
                ) : (
                    <Ionicons name="card-outline" size={22} color="#fff" style={{ marginRight: 10 }} />
                )}
                <Text style={styles.vnpayButtonText}>
                    {isProcessing ? 'Đang kết nối VNPay...' : 'Thanh toán qua VNPay'}
                </Text>
            </TouchableOpacity>

            <Text style={styles.secureText}>
                🔒 Thanh toán an toàn qua cổng VNPay
            </Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 30,
    },
    description: {
        fontSize: 16,
        color: '#444',
        textAlign: 'center',
        marginBottom: 30,
        paddingHorizontal: 20,
    },
    button: {
        backgroundColor: Colors.light.tint,
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 25,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    featureCard: {
        width: '100%',
        backgroundColor: '#f8fafc',
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 24,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    featureText: {
        fontSize: 15,
        color: '#334155',
        marginLeft: 12,
    },
    priceContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    priceLabel: {
        fontSize: 14,
        color: '#94a3b8',
    },
    price: {
        fontSize: 42,
        fontWeight: '900',
        color: '#1e293b',
    },
    pricePeriod: {
        fontSize: 14,
        color: '#94a3b8',
    },
    vnpayButton: {
        backgroundColor: '#0066CC',
        width: '100%',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        shadowColor: '#0066CC',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    vnpayButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    secureText: {
        marginTop: 16,
        fontSize: 13,
        color: '#94a3b8',
    },
});
