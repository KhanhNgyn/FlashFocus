import { useState } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, FlatList, Alert } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemedText } from '@/components/themed-text';
import { useFlashcardStore } from '../../src/store/flashcardStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DecksScreen() {
  const { decks, addDeck, deleteDeck, togglePublic } = useFlashcardStore();
  const [newDeckTitle, setNewDeckTitle] = useState('');
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handleAddDeck = () => {
    if (!newDeckTitle.trim()) {
      Alert.alert("Thông báo", "Vui lòng nhập tên bộ thẻ trước khi thêm nhé!");
      return;
    }
    addDeck(newDeckTitle.trim());
    setNewDeckTitle('');
  };

  const confirmDelete = (id: number, title: string) => {
    Alert.alert(
      "Xóa bộ thẻ",
      `Bạn có chắc chắn muốn xóa bộ "${title}" cùng toàn bộ thẻ bên trong không?`,
      [
        { text: "Hủy", style: "cancel" },
        { text: "Xóa", onPress: () => deleteDeck(id), style: "destructive" }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#0F172A' : '#F3F4F6' }]}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>Bộ Thẻ Của Tôi</ThemedText>
        <ThemedText style={styles.headerSubtitle}>Bạn có {decks.length} bộ thẻ để ôn tập</ThemedText>
      </View>

      <View style={[styles.inputContainer, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
        <TextInput
          style={[styles.input, { color: isDark ? '#FFFFFF' : '#1F2937' }]}
          placeholder="Tên chủ đề mới..."
          placeholderTextColor={isDark ? '#64748B' : '#9CA3AF'}
          value={newDeckTitle}
          onChangeText={setNewDeckTitle}
        />
        <TouchableOpacity
          onPress={handleAddDeck}
          activeOpacity={newDeckTitle.trim() ? 0.8 : 1}
          disabled={!newDeckTitle.trim()}
        >
          <LinearGradient
            colors={newDeckTitle.trim() ? ['#4F46E5', '#3B82F6'] : [isDark ? '#334155' : '#D1D5DB', isDark ? '#334155' : '#D1D5DB']}
            style={styles.addButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="add" size={24} color={newDeckTitle.trim() ? "#FFF" : (isDark ? "#475569" : "#9CA3AF")} />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <FlatList
        data={decks}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="library" size={60} color={isDark ? '#334155' : '#D1D5DB'} />
            <ThemedText style={styles.emptyText}>Chưa có bộ thẻ nào.</ThemedText>
            <ThemedText style={styles.emptySubtext}>Hãy tạo mới ở phía trên để bắt đầu!</ThemedText>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push(`/flashcard/${item.id}` as any)}
          >
            <LinearGradient
              colors={isDark ? ['#1E293B', '#1E293B'] : ['#FFFFFF', '#FFFFFF']}
              style={styles.deckCard}
            >
              <View style={styles.deckContent}>
                <View style={[styles.deckIconHolder, { backgroundColor: isDark ? '#334155' : '#F3F4F6' }]}>
                  <Ionicons name="book" size={24} color={isDark ? '#818CF8' : '#4F46E5'} />
                </View>
                <View style={styles.deckInfo}>
                  <ThemedText style={[styles.deckTitle, { color: isDark ? '#F8FAFC' : '#111827' }]}>
                    {item.title}
                  </ThemedText>
                  <ThemedText style={styles.deckDate}>
                    Tạo lúc: {new Date(item.created_at).toLocaleDateString()}
                  </ThemedText>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity 
                  style={[styles.smallButton, { backgroundColor: item.is_public ? 'rgba(59, 130, 246, 0.1)' : 'rgba(100, 116, 139, 0.1)', marginRight: 8 }]} 
                  onPress={() => togglePublic(item.id, !item.is_public)}
                >
                  <Ionicons 
                    name={item.is_public ? "earth" : "lock-closed"} 
                    size={18} 
                    color={item.is_public ? "#3B82F6" : "#64748B"} 
                  />
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteButton} onPress={() => confirmDelete(item.id, item.title)}>
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  header: { marginTop: 20, marginBottom: 25 },
  headerTitle: { fontSize: 32, fontWeight: '800' },
  headerSubtitle: { fontSize: 16, opacity: 0.7, marginTop: 5 },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
    borderRadius: 16,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  input: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '500'
  },
  addButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 45,
    height: 45,
    borderRadius: 12,
  },

  listContainer: { paddingBottom: 50 },
  deckCard: {
    padding: 18,
    borderRadius: 20,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  deckContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  deckIconHolder: {
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  deckInfo: { flex: 1 },
  deckTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  deckDate: { fontSize: 13, color: '#94A3B8', fontWeight: '500' },
  deleteButton: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.1)'
  },
  smallButton: {
    padding: 8,
    borderRadius: 10,
  },

  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  emptyText: { fontSize: 18, fontWeight: '700', marginTop: 15, marginBottom: 5 },
  emptySubtext: { fontSize: 14, opacity: 0.6 }
});
