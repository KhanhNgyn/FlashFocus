import { create } from 'zustand';
import * as db from '../services/Database';

interface FlashcardState {
    decks: db.Deck[];
    activeCards: db.Card[];
    isLoading: boolean;
    initialize: () => Promise<void>;
    loadDecks: () => Promise<void>;
    addDeck: (title: string) => Promise<void>;
    deleteDeck: (id: number) => Promise<void>;
    loadCards: (deckId: number) => Promise<void>;
    loadCardsToReview: (deckId: number) => Promise<void>;
    addCard: (deckId: number, front: string, back: string, tags: string) => Promise<void>;
    deleteCard: (id: number) => Promise<void>;
    reviewCard: (cardId: number, quality: number) => Promise<void>;
}

export const useFlashcardStore = create<FlashcardState>((set, get) => ({
    decks: [],
    activeCards: [],
    isLoading: false,

    initialize: async () => {
        set({ isLoading: true });
        await db.initDb();
        await get().loadDecks();
        set({ isLoading: false });
    },

    loadDecks: async () => {
        const decks = await db.getDecks();
        set({ decks });
    },

    addDeck: async (title: string) => {
        await db.addDeck(title);
        await get().loadDecks(); // Refresh list
    },

    deleteDeck: async (id: number) => {
        await db.deleteDeck(id);
        await get().loadDecks();
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
        await get().loadCards(deckId); // Refresh list
    },

    deleteCard: async (id: number) => {
        const { activeCards } = get();
        await db.deleteCard(id);
        set({ activeCards: activeCards.filter(c => c.id !== id) });
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

        // Tính toán timestamp cho ngày tiếp theo
        const now = new Date();
        now.setDate(now.getDate() + interval);
        const nextReviewDate = now.toISOString();

        await db.updateCardSM2(cardId, nextReviewDate, easiness, interval, repetitions);
        await db.addReviewLog(cardId, quality);

        const newActiveCards = [...activeCards];
        // Xóa thẻ khỏi vị trí hiện tại
        newActiveCards.splice(cardIndex, 1);

        // Nếu ấn Khó (1) hoặc Tạm (3), đẩy thẻ về cuối mảng để học lại trong session này
        if (quality < 5) {
            newActiveCards.push({ ...card, easiness, interval, repetitions });
        }

        set({ activeCards: newActiveCards });
    }
}));
