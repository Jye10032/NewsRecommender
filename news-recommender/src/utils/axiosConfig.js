import axios from 'axios';
import { message } from 'antd';

// 设置基础URL
axios.defaults.baseURL = 'http://localhost:3001';

// 创建全局事件，用于通知组件令牌已过期
export const tokenEvents = {
    listeners: [],
    subscribe: (callback) => {
        tokenEvents.listeners.push(callback);
        return () => {
            tokenEvents.listeners = tokenEvents.listeners.filter(cb => cb !== callback);
        };
    },
    emit: () => {
        tokenEvents.listeners.forEach(callback => callback());
    }
};


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

// 响应拦截器
axios.interceptors.response.use(
    response => response,
    error => {
        // 检查是否是令牌过期错误
        if (error.response &&
            error.response.status === 401 &&
            (error.response.data?.message === '令牌已过期' ||
                error.response.data?.message === '无效的令牌')) {

            // 清除本地存储的令牌和用户信息
            localStorage.removeItem('token');
            localStorage.removeItem('user');

            // 提示用户
            message.error('您的登录已过期，请重新登录');

            // 触发登出事件
            tokenEvents.emit();
        }

        return Promise.reject(error);
    }
);

export default axios;