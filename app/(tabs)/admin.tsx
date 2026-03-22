import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import api from '@/src/services/api';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useFlashcardStore } from '@/src/store/flashcardStore';

export default function AdminScreen() {
    const { user } = useFlashcardStore();
    const [decks, setDecks] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user?.isAdmin) {
            fetchDecks();
        }
    }, [user]);

    const fetchDecks = async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/admin/decks');
            setDecks(response.data);
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu:", error);
        }
        setLoading(false);
    };

    const deleteDeck = async (id: string) => {
        Alert.alert('Xác nhận', 'Bạn có chắc muốn xóa bộ thẻ này khỏi hệ thống?', [
            { text: 'Hủy' },
            { 
                text: 'Xóa', 
                style: 'destructive',
                onPress: async () => {
                    try {
                        await api.delete(`/api/admin/decks/${id}`);
                        fetchDecks();
                    } catch (error) {
                        Alert.alert('Lỗi', 'Không thể xóa bộ thẻ.');
                    }
                }
            }
        ]);
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardInfo}>Tác giả: {item.userId?.username || 'N/A'} ({item.userId?.email || 'N/A'})</Text>
                <Text style={styles.cardInfo}>ID: {item._id.substring(0, 8)}...</Text>
            </View>
            <TouchableOpacity onPress={() => deleteDeck(item._id)}>
                <Ionicons name="trash" size={24} color="#FF5252" />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Hệ quản trị Admin</Text>
                <TouchableOpacity onPress={fetchDecks}>
                    <Ionicons name="refresh" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {!user?.isAdmin ? (
                <View style={styles.noAccess}>
                    <Ionicons name="lock-closed" size={80} color="#ccc" />
                    <Text style={styles.noAccessText}>Bạn không có quyền truy cập trang này.</Text>
                </View>
            ) : (
                <>
                    <Text style={styles.sectionTitle}>Quản lý Decks (Tất cả người dùng)</Text>
                    
                    {loading ? (
                        <ActivityIndicator size="large" color="#333" style={{ marginTop: 50 }} />
                    ) : (
                        <FlatList
                            data={decks}
                            renderItem={renderItem}
                            keyExtractor={item => item._id}
                            contentContainerStyle={styles.list}
                        />
                    )}
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
        backgroundColor: '#333',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        padding: 20,
        color: '#555',
    },
    list: {
        paddingHorizontal: 20,
    },
    card: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        elevation: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    cardInfo: {
        fontSize: 12,
        color: '#999',
    },
    noAccess: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    noAccessText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginTop: 20,
    }
});
