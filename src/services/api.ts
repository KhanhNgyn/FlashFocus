import axios from 'axios';

import Constants from 'expo-constants';

let API_URL = 'http://localhost:5000'; // Mặc định

if (Constants?.expoConfig?.hostUri) {
    const hostIp = Constants.expoConfig.hostUri.split(':')[0];
    API_URL = `http://${hostIp}:5000`;
}

export { API_URL };

const api = axios.create({
    baseURL: API_URL,
});

export default api;
