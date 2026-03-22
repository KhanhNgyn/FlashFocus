# Project Analysis: Database Upgrade Potential

## Current State
- **Framework**: Expo (React Native)
- **Current Storage**: Local SQLite database using `expo-sqlite`.
- **Database Schema**:
  - `decks`: Stores collections of flashcards.
  - `cards`: Stores individual flashcards with SM-2 algorithm properties (easiness, interval, repetitions).
  - `review_logs`: Stores history of reviews for statistics.
- **State Management**: Zustand.

## Potential for Upgrade
Connecting to a remote database (Cloud DB) is definitely possible and highly recommended for:
1. **Multi-device Sync**: Users can access their flashcards on any device.
2. **Data Backup**: Data won't be lost if the app is deleted.
3. **Collaboration**: Sharing decks with other users.

## Proposed Options
1. **BaaS (Backend as a Service)**: Supabase or Firebase.
   - *Pros*: Easiest to integrate with Expo, handles auth, sync, and storage.
2. **Custom Backend**: Node.js + PostgreSQL/MongoDB.
   - *Pros*: Maximum control.
   - *Cons*: More effort to maintain.
