import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Hardcode IP from Expo Terminal for reliability
let API_URL = 'http://192.168.0.103:5000';

// if (Constants?.expoConfig?.hostUri) {
//     const hostIp = Constants.expoConfig.hostUri.split(':')[0];
//     API_URL = `http://${hostIp}:5000`;
// } else if (Platform.OS === 'web') {
//     API_URL = 'http://localhost:5000';
// }

// Fallback for user's specific network if detection fails
// API_URL = 'http://172.20.10.3:5000'; 

export { API_URL };

const api = axios.create({
    baseURL: API_URL,
    timeout: 45000,
});

export default api;
