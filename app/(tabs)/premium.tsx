import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { useFlashcardStore } from '@/src/store/flashcardStore';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import ConfettiCannon from 'react-native-confetti-cannon';

export default function PremiumScreen() {
    const { isPremium, setPremium } = useFlashcardStore();
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');
    const [showConfetti, setShowConfetti] = useState(false);
    const router = useRouter();

    const handlePayment = () => {
        if (cardNumber.length < 16 || !expiry.includes('/') || cvv.length < 3) {
            Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin thẻ giả lập.');
            return;
        }

        // Simulate payment processing
        Alert.alert('Đang xử lý', 'Đang thực hiện giao dịch an toàn...', [
            {
                text: 'OK',
                onPress: () => {
                    setPremium(true);
                    setShowConfetti(true);
                    setTimeout(() => {
                        Alert.alert('Thành công', 'Chúc mừng! Bạn đã nâng cấp lên bản Premium chuyên nghiệp.', [
                            { text: 'Bắt đầu ngay', onPress: () => router.replace('/') }
                        ]);
                    }, 1000);
                }
            }
        ]);
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

            <View style={styles.cardContainer}>
                <Text style={styles.label}>Số thẻ (16 chữ số)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="4242 4242 4242 4242"
                    keyboardType="numeric"
                    maxLength={16}
                    value={cardNumber}
                    onChangeText={setCardNumber}
                />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View style={{ width: '60%' }}>
                        <Text style={styles.label}>Hết hạn (MM/YY)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="12/26"
                            value={expiry}
                            onChangeText={setExpiry}
                        />
                    </View>
                    <View style={{ width: '35%' }}>
                        <Text style={styles.label}>CVV</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="***"
                            secureTextEntry
                            keyboardType="numeric"
                            maxLength={3}
                            value={cvv}
                            onChangeText={setCvv}
                        />
                    </View>
                </View>
            </View>

            <TouchableOpacity style={styles.payButton} onPress={handlePayment}>
                <Text style={styles.payButtonText}>Thanh toán 199.000đ</Text>
            </TouchableOpacity>
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
        marginBottom: 40,
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
    cardContainer: {
        width: '100%',
        backgroundColor: '#f9f9f9',
        padding: 20,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#eee',
        marginBottom: 30,
    },
    label: {
        fontSize: 14,
        color: '#777',
        marginBottom: 5,
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 15,
    },
    payButton: {
        backgroundColor: '#000',
        width: '100%',
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    payButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
