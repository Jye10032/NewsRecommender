// 修复 token 获取方式

import axios from 'axios';

const adminAxios = axios.create({
    baseURL: '/admin',
    timeout: 10000
});

// 请求拦截器
adminAxios.interceptors.request.use(
    config => {
        // 获取纯token字符串
        const token = localStorage.getItem('adminToken');
        if (token) {
            // 确保不要尝试解析JSON
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

export default adminAxios;

// import axios from 'axios';
// import { message } from 'antd';

// // 创建一个axios实例
// const adminAxios = axios.create({
//     baseURL: 'http://localhost:3001/admin', // 管理员API的基础路径
//     timeout: 10000,
// });

// // 请求拦截器 - 添加认证令牌
// adminAxios.interceptors.request.use(
//     (config) => {
//         // 从localStorage获取管理员令牌
//         const adminTokenStr = localStorage.getItem('adminToken');
//         if (adminTokenStr) {
//             try {
//                 const adminToken = JSON.parse(adminTokenStr);
//                 // 如果存在token，则添加到请求头中
//                 if (adminToken.token) {
//                     config.headers.Authorization = `Bearer ${adminToken.token}`;
//                 }
//             } catch (error) {
//                 console.error('解析admin token失败:', error);
//             }
//         }
//         return config; // 确保这里返回config对象
//     },
//     (error) => {
//         return Promise.reject(error);
//     }
// );

// // 响应拦截器
// adminAxios.interceptors.response.use(
//     (response) => {
//         return response;
//     },
//     (error) => {
//         // 处理错误响应
//         if (error.response) {
//             switch (error.response.status) {
//                 case 401:
//                     // 未授权，可能是token过期
//                     message.error('登录已过期，请重新登录');
//                     // 清除失效的token，并跳转到登录页
//                     localStorage.removeItem('adminToken');
//                     window.location.href = '/admin/login';
//                     break;
//                 case 403:
//                     message.error('没有权限访问该资源');
//                     break;
//                 case 404:
//                     message.error('请求的资源不存在');
//                     break;
//                 case 500:
//                     message.error('服务器错误，请稍后再试');
//                     break;
//                 default:
//                     message.error(error.response.data.message || '请求失败');
//             }
//         } else if (error.request) {
//             message.error('无法连接到服务器，请检查网络');
//         } else {
//             message.error('请求配置错误');
//         }
//         return Promise.reject(error);
//     }
// );

// export default adminAxios;

