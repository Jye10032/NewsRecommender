import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

// 定义用户类型
interface User {
    userId: string;
    username: string;
    preferences?: string[];
    email?: string;
    token?: string; // 添加token属性
}

// 修改接口定义
interface AuthContextType {
    user: User | null;
    isLoggedIn: boolean;
    login: (userData: User) => void;
    register: (username: string, password: string, email: string) => Promise<boolean>;
    logout: () => void;
    loading: boolean;
}


// 创建认证上下文
const AuthContext = createContext<AuthContextType>({
    user: null,
    isLoggedIn: false,
    login: async () => { },
    register: async () => false,
    logout: () => { },
    loading: true,
});

// 认证提供者组件
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loading, setLoading] = useState(true);

    // 从本地存储加载用户信息
    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const userData = JSON.parse(storedUser);
                setUser(userData);
                setIsLoggedIn(true);
            } catch (error) {
                console.error('解析存储的用户数据失败:', error);
                localStorage.removeItem('user');
            }
        }
        setLoading(false);
    }, []);

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

    // 登出方法 - 保留现有逻辑
    const logout = () => {
        setUser(null);
        setIsLoggedIn(false);
        localStorage.removeItem('user');
        localStorage.removeItem('token'); // 同时清除JWT令牌
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