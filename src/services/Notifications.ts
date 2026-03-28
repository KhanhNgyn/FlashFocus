import { Platform } from 'react-native';

// Stub out notifications for Expo Go compatibility in SDK 53
// This avoids the "remote notifications removed" crash

export async function setupNotifications() {
    console.log('Notifications setup disabled for Expo Go compatibility');
    return false;
}

export async function schedulePomodoroFinishNotification() {
    console.log('Notification scheduled (stub)');
}
