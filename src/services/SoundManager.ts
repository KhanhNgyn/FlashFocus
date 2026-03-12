import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

class SoundManager {
    private flipSound: Audio.Sound | null = null;
    private successSound: Audio.Sound | null = null;
    private failSound: Audio.Sound | null = null;
    private finishSound: Audio.Sound | null = null;

    // Call this early to pre-load sounds if you have local assets
    // For now we will use system sounds / generic bleeps if no local assets exist,
    // or we can just rely on Haptics if audio files aren't provided.
    // Since we don't have actual .mp3 files in the repo, we will handle audio gracefully 
    // or rely purely on Haptics until assets are added.

    async playFlip() {
        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            // If we had a flip.mp3:
            // const { sound } = await Audio.Sound.createAsync(require('../../assets/sounds/flip.mp3'));
            // await sound.playAsync();
        } catch (e) {
            console.log("Audio play error", e);
        }
    }

    async playSuccess() {
        try {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e) { }
    }

    async playWarning() {
        try {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        } catch (e) { }
    }

    async playFail() {
        try {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } catch (e) { }
    }
}

export const soundManager = new SoundManager();
