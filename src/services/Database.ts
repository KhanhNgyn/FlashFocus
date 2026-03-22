import * as SQLite from 'expo-sqlite';

export interface Deck {
    id: number;
    title: string;
    mongodb_id?: string;
    is_public?: boolean;
    created_at: string;
}

export interface Card {
    id: number;
    deck_id: number;
    mongodb_id?: string;
    front: string;
    back: string;
    next_review_date: string;
    tags?: string;
    easiness: number;
    interval: number;
    repetitions: number;
    created_at: string;
}

// Hàm khởi tạo Database bất đồng bộ mới của Expo SQLite
export async function getDb() {
    return await SQLite.openDatabaseAsync('flashcards.db');
}

export async function initDb() {
    const db = await getDb();

    // Tạo bảng Decks
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS decks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            mongodb_id TEXT,
            is_public INTEGER DEFAULT 0,
            created_at TEXT NOT NULL
        );
    `);

    // Tạo bảng Cards (mặc định thông số cho thuật toán SM-2)
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS cards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            deck_id INTEGER NOT NULL,
            mongodb_id TEXT,
            front TEXT NOT NULL,
            back TEXT NOT NULL,
            tags TEXT,
            next_review_date TEXT,
            easiness REAL DEFAULT 2.5,
            interval INTEGER DEFAULT 0,
            repetitions INTEGER DEFAULT 0,
            created_at TEXT NOT NULL,
            FOREIGN KEY (deck_id) REFERENCES decks (id) ON DELETE CASCADE
        );
    `);

    // Tạo bảng review_logs cho tính năng Thống Kê
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS review_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            card_id INTEGER NOT NULL,
            quality INTEGER NOT NULL,
            review_date TEXT NOT NULL,
            FOREIGN KEY (card_id) REFERENCES cards (id) ON DELETE CASCADE
        );
    `);

    // Thực hiện Migration nhẹ
    try {
        await db.runAsync('ALTER TABLE cards ADD COLUMN tags TEXT;');
    } catch (e) {}
    try {
        await db.runAsync('ALTER TABLE decks ADD COLUMN mongodb_id TEXT;');
    } catch (e) {}
    try {
        await db.runAsync('ALTER TABLE decks ADD COLUMN is_public INTEGER DEFAULT 0;');
    } catch (e) {}
    try {
        await db.runAsync('ALTER TABLE cards ADD COLUMN mongodb_id TEXT;');
    } catch (e) {}
}

// --- Thao tác với Decks ---
export async function getDecks(): Promise<Deck[]> {
    const db = await getDb();
    const result = await db.getAllAsync<any>('SELECT * FROM decks ORDER BY id DESC');
    return result.map(row => ({
        ...row,
        is_public: !!row.is_public
    }));
}

export async function addDeck(title: string, mongodb_id?: string, isPublic: boolean = false): Promise<number> {
    const db = await getDb();
    const result = await db.runAsync(
        'INSERT INTO decks (title, mongodb_id, is_public, created_at) VALUES (?, ?, ?, ?)',
        [title, mongodb_id || null, isPublic ? 1 : 0, new Date().toISOString()]
    );
    return result.lastInsertRowId;
}

export async function updateDeckMongoId(id: number, mongodb_id: string): Promise<void> {
    const db = await getDb();
    await db.runAsync('UPDATE decks SET mongodb_id = ? WHERE id = ?', [mongodb_id, id]);
}

export async function updateDeckPublicStatus(id: number, isPublic: boolean): Promise<void> {
    const db = await getDb();
    await db.runAsync('UPDATE decks SET is_public = ? WHERE id = ?', [isPublic ? 1 : 0, id]);
}

export async function deleteDeck(id: number): Promise<void> {
    const db = await getDb();
    await db.runAsync('DELETE FROM decks WHERE id = ?', [id]);
}

// --- Thao tác với Cards ---
export async function getCards(deckId: number): Promise<Card[]> {
    const db = await getDb();
    return await db.getAllAsync<Card>('SELECT * FROM cards WHERE deck_id = ? ORDER BY id DESC', [deckId]);
}

export async function addCard(deckId: number, front: string, back: string, tags: string = "", mongodb_id?: string): Promise<number> {
    const db = await getDb();
    const result = await db.runAsync(
        `INSERT INTO cards (deck_id, mongodb_id, front, back, tags, next_review_date, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [deckId, mongodb_id || null, front, back, tags, new Date().toISOString(), new Date().toISOString()]
    );
    return result.lastInsertRowId;
}

export async function updateCardMongoId(id: number, mongodb_id: string): Promise<void> {
    const db = await getDb();
    await db.runAsync('UPDATE cards SET mongodb_id = ? WHERE id = ?', [mongodb_id, id]);
}

export async function deleteCard(id: number): Promise<void> {
    const db = await getDb();
    await db.runAsync('DELETE FROM cards WHERE id = ?', [id]);
}

export async function updateCardSM2(
    id: number,
    nextReviewDate: string,
    easiness: number,
    interval: number,
    repetitions: number
): Promise<void> {
    const db = await getDb();
    await db.runAsync(
        `UPDATE cards 
         SET next_review_date = ?, easiness = ?, interval = ?, repetitions = ? 
         WHERE id = ?`,
        [nextReviewDate, easiness, interval, repetitions, id]
    );
}

export async function getCardsToReview(deckId: number): Promise<Card[]> {
    const db = await getDb();
    const now = new Date().toISOString();
    return await db.getAllAsync<Card>(
        'SELECT * FROM cards WHERE deck_id = ? AND next_review_date <= ? ORDER BY next_review_date ASC',
        [deckId, now]
    );
}

// --- Tracking & Statistics ---
export async function addReviewLog(cardId: number, quality: number): Promise<void> {
    const db = await getDb();
    await db.runAsync(
        'INSERT INTO review_logs (card_id, quality, review_date) VALUES (?, ?, ?)',
        [cardId, quality, new Date().toISOString()]
    );
}

export interface DailyStats {
    dateStr: string;
    count: number;
}

export async function getReviewStats(days: number = 7): Promise<DailyStats[]> {
    const db = await getDb();
    // SQLite localtime and date grouping
    const result = await db.getAllAsync<any>(`
        SELECT date(review_date, 'localtime') as dateStr, COUNT(*) as count 
        FROM review_logs 
        WHERE review_date >= date('now', 'localtime', '-' || ? || ' days')
        GROUP BY date(review_date, 'localtime')
        ORDER BY dateStr ASC
    `, [days]);

    return result as DailyStats[];
}

export async function getTodayReviewCount(): Promise<number> {
    const db = await getDb();
    const result = await db.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM review_logs WHERE date(review_date, 'localtime') = date('now', 'localtime')"
    );
    return result?.count || 0;
}

export async function getTotalDecksCount(): Promise<number> {
    const db = await getDb();
    const result = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM decks');
    return result?.count || 0;
}

export async function getTotalCardsCount(): Promise<number> {
    const db = await getDb();
    const result = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM cards');
    return result?.count || 0;
}

export async function clearAllData(): Promise<void> {
    const db = await getDb();
    await db.execAsync('DELETE FROM decks;');
    await db.execAsync('DELETE FROM cards;');
    await db.execAsync('DELETE FROM review_logs;');
}
