import { useEffect, useState } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, FlatList, Alert, ScrollView } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { useFlashcardStore } from '../../src/store/flashcardStore';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

export default function DeckDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const deckId = Number(id);
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const { activeCards, loadCards, addCard, deleteCard } = useFlashcardStore();
    const [frontText, setFrontText] = useState('');
    const [backText, setBackText] = useState('');
    const [tagsText, setTagsText] = useState('');
    const [filterTag, setFilterTag] = useState<string | null>(null);

    const allTags = Array.from(
        new Set(
            activeCards
                .filter(c => c.tags)
                .flatMap(c => c.tags!.split(',').map(t => t.trim()))
                .filter(t => t.length > 0)
        )
    );

    const displayedCards = filterTag
        ? activeCards.filter(c => c.tags && c.tags.split(',').map(t => t.trim()).includes(filterTag))
        : activeCards;

    useEffect(() => {
        if (deckId) {
            loadCards(deckId);
        }
    }, [deckId]);

    const handleAddCard = () => {
        if (!frontText.trim() || !backText.trim()) {
            Alert.alert("Lỗi", "Vui lòng nhập đủ 2 mặt của thẻ!");
            return;
        }
        addCard(deckId, frontText.trim(), backText.trim(), tagsText.trim());
        setFrontText('');
        setBackText('');
        setTagsText('');
    };

    const confirmDelete = (cardId: number) => {
        Alert.alert("Xóa thẻ", "Bạn có chắc chắn muốn xóa thẻ này?", [
            { text: "Hủy", style: "cancel" },
            { text: "Xóa", onPress: () => deleteCard(cardId), style: "destructive" }
        ]);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#0F172A' : '#F3F4F6' }]} edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
                    <Ionicons name="chevron-back" size={24} color={isDark ? '#FFFFFF' : '#111827'} />
                </TouchableOpacity>
                <ThemedText type="title" style={styles.title}>Quản lý thẻ</ThemedText>
                <View style={{ width: 44 }} /> {/* Fake View for middle alignment */}
            </View>

            <View style={[styles.addCardForm, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
                <TextInput
                    style={[styles.input, { color: isDark ? '#FFFFFF' : '#111827', backgroundColor: isDark ? '#334155' : '#F9FAFB' }]}
                    placeholder="Mặt trước (Câu hỏi / Từ mới)..."
                    placeholderTextColor={isDark ? '#94A3B8' : '#9CA3AF'}
                    value={frontText}
                    onChangeText={setFrontText}
                />
                <TextInput
                    style={[styles.input, { color: isDark ? '#FFFFFF' : '#111827', backgroundColor: isDark ? '#334155' : '#F9FAFB' }]}
                    placeholder="Mặt sau (Đáp án / Nghĩa)..."
                    placeholderTextColor={isDark ? '#94A3B8' : '#9CA3AF'}
                    value={backText}
                    onChangeText={setBackText}
                />
                <TextInput
                    style={[styles.input, { color: isDark ? '#FFFFFF' : '#111827', backgroundColor: isDark ? '#334155' : '#F9FAFB', marginBottom: 20 }]}
                    placeholder="Tags (phân cách bằng dấu phẩy)..."
                    placeholderTextColor={isDark ? '#94A3B8' : '#9CA3AF'}
                    value={tagsText}
                    onChangeText={setTagsText}
                />
                <TouchableOpacity activeOpacity={0.8} onPress={handleAddCard}>
                    <LinearGradient
                        colors={['#4F46E5', '#3B82F6']}
                        style={styles.addButton}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Ionicons name="add" size={20} color="#FFF" />
                        <ThemedText style={styles.addBtnText}>Thêm Thẻ ({activeCards.length})</ThemedText>
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {activeCards.length > 0 && (
                <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.studyButtonContainer}
                    onPress={() => router.push(`/flashcard/study/${deckId}` as any)}
                >
                    <LinearGradient
                        colors={['#10B981', '#059669']}
                        style={styles.studyButton}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Ionicons name="play-circle" size={24} color="#FFF" />
                        <ThemedText style={styles.studyBtnText}>BẮT ĐẦU ÔN TẬP</ThemedText>
                    </LinearGradient>
                </TouchableOpacity>
            )}

            {allTags.length > 0 && (
                <View style={styles.filterContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 20 }}>
                        <TouchableOpacity
                            style={[styles.filterBadge, filterTag === null && styles.filterBadgeActive]}
                            onPress={() => setFilterTag(null)}
                        >
                            <ThemedText style={[styles.filterText, filterTag === null && styles.filterTextActive]}>Tất cả</ThemedText>
                        </TouchableOpacity>
                        {allTags.map((tag, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[styles.filterBadge, filterTag === tag && styles.filterBadgeActive, { backgroundColor: isDark && filterTag !== tag ? '#334155' : undefined }]}
                                onPress={() => setFilterTag(tag === filterTag ? null : tag)}
                            >
                                <ThemedText style={[styles.filterText, filterTag === tag && styles.filterTextActive, { color: isDark && filterTag !== tag ? '#94A3B8' : undefined }]}>#{tag}</ThemedText>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            <FlatList
                data={displayedCards}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="layers-outline" size={50} color={isDark ? '#334155' : '#D1D5DB'} />
                        <ThemedText style={styles.emptyText}>Chưa có thẻ nào trong bộ này.</ThemedText>
                    </View>
                }
                renderItem={({ item }) => (
                    <View style={[styles.cardItem, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
                        <View style={styles.cardContent}>
                            <ThemedText style={[styles.cardFront, { color: isDark ? '#F8FAFC' : '#111827' }]}>{item.front}</ThemedText>
                            {item.tags ? (
                                <View style={styles.tagsContainer}>
                                    {item.tags.split(',').map((tag, index) => (
                                        <View key={index} style={[styles.tagBadge, { backgroundColor: isDark ? '#334155' : '#E5E7EB' }]}>
                                            <ThemedText style={[styles.tagText, { color: isDark ? '#94A3B8' : '#4B5563' }]}>{tag.trim()}</ThemedText>
                                        </View>
                                    ))}
                                </View>
                            ) : null}
                            <View style={styles.divider} />
                            <ThemedText style={[styles.cardBack, { color: isDark ? '#94A3B8' : '#6B7280' }]}>{item.back}</ThemedText>
                        </View>
                        <TouchableOpacity style={styles.deleteBtn} onPress={() => confirmDelete(item.id)}>
                            <Ionicons name="trash-outline" size={20} color="#EF4444" />
                        </TouchableOpacity>
                    </View>
                )}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 20 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 15, marginBottom: 25 },
    backBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
    title: { fontSize: 24, fontWeight: '800' },

    addCardForm: { padding: 18, borderRadius: 20, marginBottom: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 4 },
    input: { padding: 15, borderRadius: 12, marginBottom: 15, fontSize: 16, fontWeight: '500' },
    addButton: { flexDirection: 'row', padding: 15, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    addBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16, marginLeft: 8 },

    studyButtonContainer: { marginBottom: 25 },
    studyButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 18, borderRadius: 16, shadowColor: '#10B981', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
    studyBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 18, marginLeft: 10, letterSpacing: 1 },

    listContainer: { paddingBottom: 50 },
    cardItem: { padding: 20, borderRadius: 16, marginBottom: 15, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
    cardContent: { flex: 1, marginRight: 15 },
    cardFront: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
    divider: { height: 1, backgroundColor: 'rgba(150, 163, 184, 0.2)', marginBottom: 8 },
    cardBack: { fontSize: 15, fontWeight: '500' },
    deleteBtn: { padding: 12, borderRadius: 12, backgroundColor: 'rgba(239, 68, 68, 0.1)' },

    emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 40 },
    emptyText: { textAlign: 'center', marginTop: 15, fontSize: 15, color: '#888', fontStyle: 'italic' },
    tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8, gap: 6 },
    tagBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    tagText: { fontSize: 12, fontWeight: '600' },

    filterContainer: { marginBottom: 15 },
    filterBadge: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#E5E7EB' },
    filterBadgeActive: { backgroundColor: '#4F46E5' },
    filterText: { fontSize: 14, fontWeight: '600', color: '#4B5563' },
    filterTextActive: { color: '#FFF' }
});
