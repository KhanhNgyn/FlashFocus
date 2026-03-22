import { Redirect } from 'expo-router';
import { useFlashcardStore } from '../src/store/flashcardStore';

export default function Index() {
    const isLoggedIn = useFlashcardStore((state) => state.isLoggedIn);

    if (!isLoggedIn) {
        return <Redirect href="/login" />;
    }

    return <Redirect href="/(tabs)" />;
}
