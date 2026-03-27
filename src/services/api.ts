import axios from 'axios';

import Constants from 'expo-constants';

let API_URL = 'https://flashfocus-1.onrender.com';

// if (Constants?.expoConfig?.hostUri) {
//     const hostIp = Constants.expoConfig.hostUri.split(':')[0];
//     API_URL = `http://${hostIp}:5000`;
// }

export { API_URL };

const api = axios.create({
    baseURL: API_URL,
    timeout: 45000, // Tăng lên 45s cho Render free tier
});

export default api;
