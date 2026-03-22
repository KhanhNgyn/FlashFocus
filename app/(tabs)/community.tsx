import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import io from 'socket.io-client';
import api, { API_URL } from '@/src/services/api';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useFlashcardStore } from '@/src/store/flashcardStore';

interface Message {
    _id: string;
    content: string;
    created_at: string;
    userId: string;
    username?: string;
}

export default function CommunityScreen() {
    const [activeTab, setActiveTab] = useState<'chat' | 'decks'>('chat');
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [socket, setSocket] = useState<any>(null);
    const { user, publicDecks, fetchPublicDecks, cloneDeck, isLoading } = useFlashcardStore();

    useEffect(() => {
        // Connect to Socket.io
        const newSocket = io(API_URL);
        setSocket(newSocket);

        // Fetch initial data
        fetchMessages();
        fetchPublicDecks();

        // Listen for new messages
        newSocket.on('receive_message', (msg: Message) => {
            setMessages(prev => [msg, ...prev]);
        });

        return () => {
            newSocket.disconnect();
        };
    }, []);

    const fetchMessages = async () => {
        try {
            const response = await api.get('/api/messages');
            setMessages(response.data);
        } catch (error) {
            console.error("Lỗi khi tải tin nhắn:", error);
        }
    };

    const sendMessage = () => {
        if (!inputText.trim() || !socket || !user) return;

        socket.emit('send_message', { 
            content: inputText, 
            userId: user.id,
            username: user.username 
        });
        setInputText('');
    };

    const renderMessage = ({ item }: { item: Message }) => (
        <View style={styles.messageBubble}>
            <Text style={styles.messageUser}>{item.username || 'Guest'}</Text>
            <Text style={styles.messageText}>{item.content}</Text>
            <Text style={styles.messageTime}>{new Date(item.created_at).toLocaleTimeString()}</Text>
        </View>
    );

    const renderPublicDeck = ({ item }: { item: any }) => (
        <View style={styles.deckCard}>
            <View style={styles.deckInfo}>
                <Ionicons name="book" size={24} color={Colors.light.tint} style={styles.deckIcon} />
                <View>
                    <Text style={styles.deckTitle}>{item.title}</Text>
                    <Text style={styles.deckAuthor}>Chia sẻ bởi: {item.userId?.username || 'Người dùng'}</Text>
                </View>
            </View>
            <TouchableOpacity style={styles.cloneButton} onPress={() => cloneDeck(item._id)}>
                <Ionicons name="copy-outline" size={20} color="#fff" />
                <Text style={styles.cloneButtonText}>Lưu về</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Cộng đồng FlashFocus</Text>
                <View style={styles.tabContainer}>
                    <TouchableOpacity 
                        style={[styles.tab, activeTab === 'chat' && styles.activeTab]} 
                        onPress={() => setActiveTab('chat')}
                    >
                        <Text style={[styles.tabText, activeTab === 'chat' && styles.activeTabText]}>Trò chuyện</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.tab, activeTab === 'decks' && styles.activeTab]} 
                        onPress={() => {
                            setActiveTab('decks');
                            fetchPublicDecks();
                        }}
                    >
                        <Text style={[styles.tabText, activeTab === 'decks' && styles.activeTabText]}>Khám phá</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {activeTab === 'chat' ? (
                <>
                    <FlatList
                        data={messages}
                        renderItem={renderMessage}
                        keyExtractor={item => item._id}
                        inverted
                        contentContainerStyle={styles.listContent}
                    />
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
                        style={styles.inputContainer}
                    >
                        <TextInput
                            style={styles.input}
                            placeholder="Nhập tin nhắn..."
                            value={inputText}
                            onChangeText={setInputText}
                        />
                        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
                            <Ionicons name="send" size={24} color="#fff" />
                        </TouchableOpacity>
                    </KeyboardAvoidingView>
                </>
            ) : (
                <FlatList
                    data={publicDecks}
                    renderItem={renderPublicDeck}
                    keyExtractor={item => (item as any)._id}
                    contentContainerStyle={styles.listContent}
                    onRefresh={fetchPublicDecks}
                    refreshing={isLoading}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="search-outline" size={60} color="#ccc" />
                            <Text style={styles.emptyText}>Chưa có bộ thẻ nào được chia sẻ.</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        paddingTop: 50,
        paddingBottom: 20,
        backgroundColor: Colors.light.tint,
        alignItems: 'center',
    },
    headerTitle: {
        color: '#fff',
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 25,
        padding: 4,
        width: '90%',
    },
    tab: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 21,
    },
    activeTab: {
        backgroundColor: '#fff',
    },
    tabText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    activeTabText: {
        color: Colors.light.tint,
    },
    listContent: {
        padding: 15,
        paddingBottom: 100,
    },
    messageBubble: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 15,
        marginBottom: 10,
        alignSelf: 'flex-start',
        maxWidth: '80%',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    messageUser: {
        fontSize: 12,
        color: Colors.light.tint,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    messageText: {
        fontSize: 16,
        color: '#333',
    },
    messageTime: {
        fontSize: 10,
        color: '#999',
        marginTop: 5,
        textAlign: 'right',
    },
    deckCard: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 15,
        marginBottom: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    deckInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    deckIcon: {
        marginRight: 12,
    },
    deckTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    deckAuthor: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    cloneButton: {
        backgroundColor: Colors.light.tint,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
    },
    cloneButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
    },
    emptyText: {
        color: '#999',
        marginTop: 10,
        fontSize: 14,
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 10,
        backgroundColor: '#fff',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#eee',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    input: {
        flex: 1,
        backgroundColor: '#f0f0f0',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 8,
        marginRight: 10,
        fontSize: 16,
    },
    sendButton: {
        backgroundColor: Colors.light.tint,
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
