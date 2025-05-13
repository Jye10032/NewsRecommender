import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import { tokenEvents } from '../utils/axiosConfig';
// 导入类型定义
import { User, AuthContextType, JwtPayload } from '../types/types.ts';

// 创建认证上下文
const AuthContext = createContext<AuthContextType>({
    user: null,
    isLoggedIn: false,
    login: async () => { },
    register: async () => false,
    logout: () => { },
    loading: true,
});

// 在组件顶部添加这个函数
function isTokenExpired(token: string) {
    if (!token) return true;

    try {
        const decoded = jwtDecode<JwtPayload>(token); // 使用jwtDecode而不是jwt_decode
        // JWT的exp字段是以秒为单位的时间戳
        return decoded.exp * 1000 < Date.now();
    } catch (error) {
        console.error('令牌解析失败:', error);
        return true;
    }
}


// 认证提供者组件
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loading, setLoading] = useState(true);

    const navigate = useNavigate();

    // 清除登录状态的函数
    const clearAuthState = () => {
        setUser(null);
        setIsLoggedIn(false);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };

    // 登出方法 - 保留现有结构，但调用clearAuthState
    const logout = () => {
        clearAuthState();
        navigate('/'); // 可选：导航到首页
    };


    // 从本地存储加载用户信息
    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        // 检查令牌是否存在且未过期
        if (token && !isTokenExpired(token) && storedUser) {
            try {
                const userData = JSON.parse(storedUser);
                setUser(userData);
                setIsLoggedIn(true);
            } catch (error) {
                console.error('解析存储的用户数据失败:', error);
                clearAuthState();
            }
        } else if (token && isTokenExpired(token)) {
            // 如果令牌过期，清除状态
            console.log('登录令牌已过期，已自动退出');
            clearAuthState();
        }
        setLoading(false);
        // 订阅令牌过期事件
        const unsubscribe = tokenEvents.subscribe(() => {
            console.log('收到令牌过期通知，执行自动退出');
            clearAuthState();
            navigate('/login');
        });

        return () => {
            unsubscribe(); // 组件卸载时取消订阅
        };
    }, [navigate]);

    // 定期检查令牌是否过期
    useEffect(() => {
        if (isLoggedIn) {
            const checkTokenInterval = setInterval(() => {
                const token = localStorage.getItem('token');
                if (token && isTokenExpired(token)) {
                    console.log('定期检查：令牌已过期，执行自动退出');
                    clearAuthState();
                    navigate('/login');
                }
            }, 60000); // 每分钟检查一次

            return () => {
                clearInterval(checkTokenInterval);
            };
        }
    }, [isLoggedIn, navigate]);

    // 登录方法
    const login = (userData: User) => {
        setUser(userData);

        setIsLoggedIn(true);
        // 保存token
        if (userData.token) {
            localStorage.setItem('token', userData.token);
        }

        localStorage.setItem('user', JSON.stringify(userData));

        // 如果Login.js中返回了token，可以添加此处理
        // if (userData.token) {
        //     localStorage.setItem('token', userData.token);
        // }
    };

    // 注册方法
    const register = async (username: string, password: string, email: string): Promise<boolean> => {
        try {
            const response = await axios.post('http://localhost:3001/api/auth/register', {
                username,
                password,
                email
            });

            if (response.data.success) {
                // 注册成功后不自动登录，返回true表示注册成功
                return true;
            }
            return false;
        } catch (error) {
            console.error('注册失败:', error);
            return false;
        }
    };



    return (
        <AuthContext.Provider value={{
            user,
            isLoggedIn,
            login,
            register,
            logout,
            loading
        }}>
            {children}
        </AuthContext.Provider>
    );
};

// 自定义 hook 方便使用 AuthContext
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};