import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';
import * as db from '../services/Database';
import api from '../services/api';

interface User {
    id: string;
    username: string;
    isPremium: boolean;
    isAdmin: boolean;
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
    isAdmin: boolean;
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
    isAdmin: false,

    setPremium: (status: boolean) => set({ isPremium: status }),

    fetchPublicDecks: async () => {
        try {
            const response = await api.get('/api/decks/public');
            set({ publicDecks: response.data });
        } catch (e) {
            console.error('Fetch public decks failed:', e);
        }
    },

    cloneDeck: async (mongodbId: string) => {
        const publicDeck = get().publicDecks.find(d => (d as any)._id === mongodbId || d.mongodb_id === mongodbId);
        if (!publicDeck) {
            console.log('Public deck not found in current state, fetching...');
            return;
        }

        set({ isLoading: true });
        try {
            // 1. Create locally
            const localDeckId = await db.addDeck(publicDeck.title + " (Clone)");
            
            // 2. Create on Server for current user
            const resDeck = await api.post('/api/decks', { 
                title: publicDeck.title + " (Clone)",
                is_public: false 
            });
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
        } finally {
            set({ isLoading: false });
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
            set({ 
                token, 
                user, 
                isLoggedIn: true, 
                isPremium: !!user.isPremium,
                isAdmin: !!user.isAdmin 
            });
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
        console.log('Logging out, clearing local data and admin state...');
        await SecureStore.deleteItemAsync('token');
        await SecureStore.deleteItemAsync('user');
        await db.clearAllData();
        delete api.defaults.headers.common['Authorization'];
        set({ 
            user: null, 
            token: null, 
            isLoggedIn: false, 
            isAdmin: false,
            decks: [], 
            activeCards: [], 
            publicDecks: [] 
        });
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
                        isPremium: !!userData.isPremium,
                        isAdmin: !!userData.isAdmin
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
            console.log('Starting backend sync...');
            const response = await api.get('/api/decks');
            const serverDecks = response.data;
            const localDecks = await db.getDecks();
            console.log(`Synced ${serverDecks.length} decks from server. Local has ${localDecks.length}.`);

            // 1. Add server decks to local if missing
            for (const sDeck of serverDecks) {
                const localMatch = localDecks.find(ld => ld.mongodb_id === sDeck._id || ld.title === sDeck.title);
                if (!localMatch) {
                    console.log(`Adding missing server deck to local: ${sDeck.title}`);
                    await db.addDeck(sDeck.title, sDeck._id, sDeck.is_public);
                } else if (!localMatch.mongodb_id) {
                    console.log(`Updating local deck with missing mongodb_id: ${sDeck.title}`);
                    await db.updateDeckMongoId(localMatch.id, sDeck._id);
                }
            }

            // 2. Sync local decks to server if missing mongodb_id
            for (const lDeck of localDecks) {
                if (!lDeck.mongodb_id) {
                    console.log(`Syncing local-only deck to server: ${lDeck.title}`);
                    try {
                        const res = await api.post('/api/decks', { 
                            title: lDeck.title, 
                            is_public: lDeck.is_public 
                        });
                        await db.updateDeckMongoId(lDeck.id, res.data._id);
                    } catch (e) {
                        console.error(`Failed to sync deck ${lDeck.title}:`, e);
                    }
                }
            }
            
            await get().loadDecks();
            console.log('Backend sync complete');
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
        const deck = get().decks.find(d => d.id === id);
        console.log('Attempting to delete deck locally:', id, 'mongodb_id:', deck?.mongodb_id);
        await db.deleteDeck(id);
        await get().loadDecks();
        
        // Delete from Node.js Backend
        if (deck?.mongodb_id) {
            console.log('Attempting to delete deck from backend:', deck.mongodb_id);
            try {
                const res = await api.delete(`/api/decks/${deck.mongodb_id}`);
                console.log('Backend deletion result:', res.data);
            } catch (e) {
                console.error('Failed to delete deck from backend:', e);
            }
        } else {
            console.log('No mongodb_id found for deck, skipping backend deletion');
        }
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
        const localId = await db.addCard(deckId, front, back, tags);
        
        try {
            const deck = get().decks.find(d => d.id === deckId);
            if (deck?.mongodb_id) {
                const res = await api.post('/api/cards', { 
                    deck_id: deck.mongodb_id, 
                    front, 
                    back, 
                    tags 
                });
                await db.updateCardMongoId(localId, res.data._id);
            }
        } catch (e) {
            console.error('Failed to sync card to backend:', e);
        }
        
        await get().loadCards(deckId);
    },

    deleteCard: async (id: number) => {
        const { activeCards } = get();
        const card = activeCards.find(c => c.id === id);
        
        await db.deleteCard(id);
        set({ activeCards: activeCards.filter(c => c.id !== id) });
        
        // Delete from backend if exists
        if (card?.mongodb_id) {
            try {
                await api.delete(`/api/cards/${card.mongodb_id}`);
            } catch (e) {
                console.error('Failed to delete card from backend:', e);
            }
        }
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
