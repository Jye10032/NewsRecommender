// export interface News {
//     news_id: string;
//     category: string;
//     subcategory: string;
//     title: string;
//     abstract: string;
//     url: string;
// }

export interface News {
    news_id: string;
    category: string;
    subcategory: string;
    title: string;
    abstract: string;
    url: string;
    title_entities?: any;
    abstract_entities?: any;
    published_at?: string;
    //new
    author?: string;
    view_count?: number; // 添加这一行
    source?: string;     // 还应添加这个，因为你也在使用 item.source
    content?: string;    // 添加这个，因为你在使用 item.content
}

// 定义用户类型
export interface User {
    userId: string;
    username: string;
    preferences?: string[];
    email?: string;
    token?: string; // 添加token属性
}

// 认证上下文类型
export interface AuthContextType {
    user: User | null;
    isLoggedIn: boolean;
    login: (userData: User) => void;
    register: (username: string, password: string, email: string) => Promise<boolean>;
    logout: () => void;
    loading: boolean;
}

// JWT令牌解码后的类型定义
export interface JwtPayload {
    id: string;         // 用户ID - 使用id而不是userId!
    username: string;   // 用户名
    exp: number;        // 过期时间戳
    iat: number;        // 颁发时间戳
}


export interface NewsItem {
    news_id: string;
    title: string;
    abstract: string;
    category: string;
    subcategory?: string;
    author?: string;
    publish_date?: string;
    click_count: number;
    avatar?: string;
    imageUrl?: string;
}