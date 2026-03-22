import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useFlashcardStore } from '../src/store/flashcardStore';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';

export default function RegisterScreen() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { register, isLoading } = useFlashcardStore();
    const router = useRouter();

    const handleRegister = async () => {
        if (!username || !email || !password) return Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
        try {
            await register(username, email, password);
            Alert.alert('Thành công', 'Đăng ký thành công! Vui lòng đăng nhập.', [{ text: 'OK', onPress: () => router.back() }]);
        } catch (error: any) {
            Alert.alert('Lỗi', error.message);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Tạo tài khoản</Text>
            <Text style={styles.subtitle}>Bắt đầu hành trình học tập mới</Text>

            <View style={styles.form}>
                <TextInput
                    style={styles.input}
                    placeholder="Tên người dùng"
                    value={username}
                    onChangeText={setUsername}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />
                <TextInput
                    style={styles.input}
                    placeholder="Mật khẩu"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />
                
                <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={isLoading}>
                    {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Đăng ký</Text>}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.linkText}>Đã có tài khoản? Đăng nhập</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff', padding: 20, justifyContent: 'center' },
    title: { fontSize: 32, fontWeight: 'bold', color: '#333' },
    subtitle: { fontSize: 16, color: '#666', marginBottom: 40 },
    form: { width: '100%' },
    input: { backgroundColor: '#f5f5f5', padding: 15, borderRadius: 10, marginBottom: 15, fontSize: 16 },
    button: { backgroundColor: Colors.light.tint, padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    linkText: { color: Colors.light.tint, textAlign: 'center', marginTop: 20, fontSize: 14 }
});
