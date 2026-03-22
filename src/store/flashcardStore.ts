import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';
import * as db from '../services/Database';
import api from '../services/api';

interface User {
    id: string;
    username: string;
    isPremium: boolean;
}

interface FlashcardState {
    decks: db.Deck[];
    publicDecks: db.Deck[];
    activeCards: db.Card[];
    isLoading: boolean;
    isPremium: boolean;
    user: User | null;
    token: string | null;
    isLoggedIn: boolean;
    initialize: () => Promise<void>;
    fetchPublicDecks: () => Promise<void>;
    cloneDeck: (mongodbId: string) => Promise<void>;
    loadDecks: () => Promise<void>;
    addDeck: (title: string) => Promise<void>;
    deleteDeck: (id: number) => Promise<void>;
    loadCards: (deckId: number) => Promise<void>;
    loadCardsToReview: (deckId: number) => Promise<void>;
    addCard: (deckId: number, front: string, back: string, tags: string) => Promise<void>;
    deleteCard: (id: number) => Promise<void>;
    reviewCard: (cardId: number, quality: number) => Promise<void>;
    setPremium: (status: boolean) => void;
    syncData: () => Promise<void>;
    login: (email: string, password: string) => Promise<void>;
    register: (username: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    togglePublic: (deckId: number, isPublic: boolean) => Promise<void>;
}

export const useFlashcardStore = create<FlashcardState>((set, get) => ({
    decks: [],
    publicDecks: [],
    activeCards: [],
    isLoading: false,
    isPremium: false,
    user: null,
    token: null,
    isLoggedIn: false,

    setPremium: (status: boolean) => set({ isPremium: status }),

    fetchPublicDecks: async () => {
        try {
            const response = await api.get('/api/decks');
            // Filter out user's own decks if they are public
            const currentUserId = get().user?.id;
            const publicDecks = response.data.filter((d: any) => d.is_public && d.user_id !== currentUserId);
            set({ publicDecks });
        } catch (e) {
            console.error('Fetch public decks failed:', e);
        }
    },

    cloneDeck: async (mongodbId: string) => {
        const publicDeck = get().publicDecks.find(d => d.mongodb_id === mongodbId);
        if (!publicDeck) return;

        try {
            // 1. Create locally
            const localDeckId = await db.addDeck(publicDeck.title + " (Clone)");
            
            // 2. Create on Server for current user
            const resDeck = await api.post('/api/decks', { title: publicDeck.title + " (Clone)" });
            await db.updateDeckMongoId(localDeckId, resDeck.data._id);

            // 3. Fetch cards
            const resCards = await api.get(`/api/cards/${mongodbId}`);
            const cards = resCards.data;

            // 4. Save cards locally and on server
            for (const card of cards) {
                await db.addCard(localDeckId, card.front, card.back, card.tags);
                await api.post('/api/cards', {
                    deck_id: resDeck.data._id,
                    front: card.front,
                    back: card.back,
                    tags: card.tags
                });
            }

            await get().loadDecks();
            Alert.alert("Thành công", `Đã copy bộ thẻ "${publicDeck.title}" vào thư viện của bạn!`);
        } catch (e) {
            console.error('Clone failed:', e);
            Alert.alert("Lỗi", "Không thể copy bộ thẻ này.");
        }
    },

    login: async (email, password) => {
        set({ isLoading: true });
        try {
            const response = await api.post('/api/auth/login', { email, password });
            const { token, user } = response.data;
            
            try {
                await SecureStore.setItemAsync('token', token);
                await SecureStore.setItemAsync('user', JSON.stringify(user));
            } catch (e) {
                console.warn('SecureStore set failed:', e);
            }
            
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            set({ token, user, isLoggedIn: true, isPremium: user.isPremium });
        } catch (error: any) {
            console.error('Login error details:', error.response?.data || error.message);
            throw new Error(error.response?.data?.error || 'Đăng nhập thất bại');
        } finally {
            set({ isLoading: false });
        }
    },

    register: async (username, email, password) => {
        set({ isLoading: true });
        try {
            await api.post('/api/auth/register', { username, email, password });
        } catch (error: any) {
            console.error('Register error details:', error.response?.data || error.message);
            throw new Error(error.response?.data?.error || 'Đăng ký thất bại');
        } finally {
            set({ isLoading: false });
        }
    },

    logout: async () => {
        await SecureStore.deleteItemAsync('token');
        await SecureStore.deleteItemAsync('user');
        delete api.defaults.headers.common['Authorization'];
        set({ user: null, token: null, isLoggedIn: false, decks: [], activeCards: [] });
    },

    initialize: async () => {
        set({ isLoading: true });
        try {
            const token = await SecureStore.getItemAsync('token');
            const userJson = await SecureStore.getItemAsync('user');
            
            if (token && userJson) {
                const userData = JSON.parse(userJson);
                if (userData && userData.id) {
                    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                    set({ 
                        token, 
                        user: userData, 
                        isLoggedIn: true, 
                        isPremium: !!userData.isPremium 
                    });
                } else {
                    await SecureStore.deleteItemAsync('token');
                    await SecureStore.deleteItemAsync('user');
                    set({ isLoggedIn: false, user: null, token: null });
                }
            } else {
                set({ isLoggedIn: false, user: null, token: null });
            }
        } catch (e) {
            console.warn('Initialize auth failed:', e);
            set({ isLoggedIn: false });
        }

        try {
            await db.initDb();
            await get().loadDecks();
        } catch (e) {
            console.error('Database init failed:', e);
        }
        
        set({ isLoading: false });
        get().syncData().catch(console.error);
    },

    syncData: async () => {
        try {
            // 1. Fetch from Server
            const response = await api.get('/api/decks');
            const serverDecks = response.data;
            const localDecks = await db.getDecks();

            // 2. Add server decks to local if missing
            for (const sDeck of serverDecks) {
                const exists = localDecks.find(d => d.mongodb_id === sDeck._id);
                if (!exists) {
                    await db.addDeck(sDeck.title, sDeck._id);
                }
            }

            // 3. Post local decks to server if missing mongodb_id
            for (const lDeck of localDecks) {
                if (!lDeck.mongodb_id) {
                    const res = await api.post('/api/decks', { title: lDeck.title });
                    await db.updateDeckMongoId(lDeck.id, res.data._id);
                }
            }

            console.log('Backend sync complete');
            await get().loadDecks();
        } catch (e) {
            console.error('Sync failed:', e);
        }
    },

    loadDecks: async () => {
        const decks = await db.getDecks();
        set({ decks });
    },

    addDeck: async (title: string) => {
        // Add locally first
        const localId = await db.addDeck(title);
        await get().loadDecks();
        
        try {
            // Post to Node.js Backend
            const res = await api.post('/api/decks', { title });
            await db.updateDeckMongoId(localId, res.data._id);
            await get().loadDecks();
        } catch (e) {
            console.error('Failed to sync new deck to backend', e);
        }
    },

    togglePublic: async (deckId: number, isPublic: boolean) => {
        const deck = get().decks.find(d => d.id === deckId);
        if (!deck || !deck.mongodb_id) return;

        try {
            await api.patch(`/api/decks/${deck.mongodb_id}`, { is_public: isPublic });
            await db.updateDeckPublicStatus(deckId, isPublic);
            await get().loadDecks();
        } catch (e) {
            console.error('Failed to toggle public status', e);
        }
    },

    deleteDeck: async (id: number) => {
        await db.deleteDeck(id);
        await get().loadDecks();
        
        // Delete from Node.js Backend
        // Note: In a real app, you'd need the MongoDB ID here. 
        // For simplicity, we assume IDs match or find by title.
        // await api.delete(`/api/decks/${id}`);
    },

    loadCards: async (deckId: number) => {
        set({ isLoading: true });
        const cards = await db.getCards(deckId);
        set({ activeCards: cards, isLoading: false });
    },

    loadCardsToReview: async (deckId: number) => {
        set({ isLoading: true });
        const cards = await db.getCardsToReview(deckId);
        set({ activeCards: cards, isLoading: false });
    },

    addCard: async (deckId: number, front: string, back: string, tags: string = "") => {
        await db.addCard(deckId, front, back, tags);
        await get().loadCards(deckId);
        
        // Post to Node.js Backend
        await api.post('/api/cards', { deck_id: deckId, front, back, tags });
    },

    deleteCard: async (id: number) => {
        const { activeCards } = get();
        await db.deleteCard(id);
        set({ activeCards: activeCards.filter(c => c.id !== id) });
        
        // await api.delete(`/api/cards/${id}`);
    },

    reviewCard: async (cardId: number, quality: number) => {
        const { activeCards } = get();
        const cardIndex = activeCards.findIndex(c => c.id === cardId);
        if (cardIndex === -1) return;

        const card = activeCards[cardIndex];
        let { easiness, interval, repetitions } = card;

        if (quality >= 3) {
            if (repetitions === 0) {
                interval = 1;
            } else if (repetitions === 1) {
                interval = 6;
            } else {
                interval = Math.round(interval * easiness);
            }
            repetitions += 1;
        } else {
            repetitions = 0;
            interval = 1;
        }

        easiness = easiness + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
        if (easiness < 1.3) easiness = 1.3;

        const now = new Date();
        now.setDate(now.getDate() + interval);
        const nextReviewDate = now.toISOString();

        await db.updateCardSM2(cardId, nextReviewDate, easiness, interval, repetitions);
        await db.addReviewLog(cardId, quality);

        // Update card on Node.js Backend
        // await api.put(`/api/cards/${cardId}`, { 
        //     next_review_date: nextReviewDate, 
        //     easiness, 
        //     interval, 
        //     repetitions 
        // });
        
        set({ activeCards: activeCards.filter((_, i) => i !== cardIndex) });
    }
}));
