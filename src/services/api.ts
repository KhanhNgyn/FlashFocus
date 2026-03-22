import axios from 'axios';

// Thay thế bằng địa chỉ IP máy tính của bạn nếu chạy trên điện thoại thật
// Ví dụ: http://192.168.1.5:5000
export const API_URL = 'http://192.168.10.105:5000';

const api = axios.create({
    baseURL: API_URL,
});

export default api;
