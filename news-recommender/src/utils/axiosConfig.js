import axios from 'axios';

// 设置基础URL
axios.defaults.baseURL = 'http://localhost:3001';

// 请求拦截器
axios.interceptors.request.use(
    config => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    error => Promise.reject(error)
);