import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Chỉ định App cách hiển thị TB khi đang Mở App (Foreground)
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

// Hàm thiết lập khi mới vào app
export async function setupNotifications() {
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('pomodoro-alerts', {
            name: 'Pomodoro Alerts',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        // Xin quyền nếu chưa có
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            console.log('Không có quyền gởi thông báo!');
            return false;
        }
        return true;
    }
    return false;
}

// Hàm Local Push
export async function schedulePomodoroFinishNotification() {
    await Notifications.scheduleNotificationAsync({
        content: {
            title: "Hết giờ tập trung! 🎯",
            body: "Tuyệt vời! Hãy dành 5 phút nghỉ ngơi nhé.",
            sound: true,
            // data sẽ gửi vào app khi người dùng nhấn vào thông báo
            data: { action: 'START_BREAK' },
        },
        // Chạy thông báo vào ngay lập tức
        trigger: null,
    });
}
