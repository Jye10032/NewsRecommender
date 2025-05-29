//新闻列表组件  


import React, { useState, useEffect, useCallback } from 'react';
import { LikeOutlined, MessageOutlined, StarOutlined } from '@ant-design/icons';
import { Avatar, List, Pagination, Spin, Space, message, Image } from 'antd';
import { News } from '../types/types.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import { debounce } from 'lodash'; // 导入debounce
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './NewsList.css'; // 导入样式表

// const data = Array.from({ length: 23 }).map((_, i) => ({
//     href: 'https://ant.design',
//     title: `ant design part ${i}`,
//     avatar: `https://api.dicebear.com/7.x/miniavs/svg?seed=${i}`,
//     description:
//         'Ant Design, a design language for background applications, is refined by Ant UED Team.',
//     content:
//         'We supply a series of design principles, practical patterns and high quality design resources (Sketch and Axure), to help people create their product prototypes beautifully and efficiently.',
// }));

// 默认图片URL
const DEFAULT_IMAGE = "https://gw.alipayobjects.com/zos/rmsportal/mqaQswcyDLcXyDKnZfES.png";

interface DisplayNews extends News {
    avatar?: string;
    actions?: React.ReactNode[];
    imageUrl?: string;
}


interface NewsListProps {
    sortOrder?: string;
    category?: string;
    subcategory?: string;
}



const IconText = ({ icon, text }: { icon: React.FC; text: string }) => (
    <Space>
        {React.createElement(icon)}
        {text}
    </Space>
);

const NewsList: React.FC<NewsListProps> = ({ sortOrder = 'latest', category, subcategory }) => {
    const navigate = useNavigate();
    const { user, isLoggedIn } = useAuth();
    const [displayNews, setDisplayNews] = useState<DisplayNews[]>([]);
    const [loading, setLoading] = useState(false);
    const [imageLoadErrors, setImageLoadErrors] = useState<Record<string, boolean>>({});
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [total, setTotal] = useState(0);


    // 图片加载错误处理
    const handleImageError = (newsId: string) => {
        setImageLoadErrors(prev => ({
            ...prev,
            [newsId]: true
        }));
    };

    // 获取图片URL
    const getImageUrl = (news: DisplayNews) => {
        // 检查是否有加载错误记录
        if (imageLoadErrors[news.news_id]) {
            return DEFAULT_IMAGE;
        }
        // 优先使用新闻的封面图URL，没有则使用默认图片
        return news.cover_image_url || DEFAULT_IMAGE;
    };

    // 1. 将fetchNews移到useEffect外面并使用useCallback包装
    const fetchNews = useCallback(
        debounce(async () => {
            try {
                setLoading(true);

                let response;

                // 根据登录状态和是否有类别筛选决定API调用
                if (category || subcategory || sortOrder !== 'latest') {
                    // 构建请求参数
                    const params: any = {
                        page,
                        limit: pageSize,
                        sort: sortOrder
                    };

                    if (category) {
                        params.category = category;
                    }

                    if (subcategory) {
                        params.subcategory = subcategory;
                    }

                    response = await axios.get('http://localhost:3001/api/news', { params });

                    if (response.data) {
                        const newsData = response.data.data || [];
                        setTotal(response.data.total || 0);

                        // 将获取的新闻数据与固定展示数据合并
                        const newsWithDisplay = newsData.map((item: News, index: number) => ({
                            ...item,
                            avatar: `https://api.dicebear.com/7.x/miniavs/svg?seed=${index}`,
                        }));

                        setDisplayNews(newsWithDisplay);
                    }
                }
                else if (isLoggedIn && user) {
                    // 确保令牌存在
                    const token = localStorage.getItem('token');
                    if (!token) {
                        throw new Error('找不到登录令牌');
                    }

                    // 已登录，获取个性化推荐
                    response = await axios.get('http://localhost:3001/api/recommendations', {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });

                    if (response.data.success) {
                        message.success('加载个性化推荐新闻');

                        const newsData = response.data.recommendations || [];
                        // 将获取的新闻数据与固定展示数据合并
                        const newsWithDisplay = newsData.map((item: News, index: number) => ({
                            ...item,
                            avatar: `https://api.dicebear.com/7.x/miniavs/svg?seed=${index}`,
                        }));

                        setDisplayNews(newsWithDisplay);
                    } else {
                        message.warning('个性化推荐失败，加载普通新闻');
                        throw new Error('推荐服务返回失败');
                    }
                } else {
                    // 未登录，获取普通新闻列表
                    response = await axios.get('http://localhost:3001/api/news', {
                        params: {
                            page,
                            limit: pageSize,
                            sort: sortOrder
                        }
                    });

                    if (response.data) {
                        const newsData = response.data.data || [];
                        setTotal(response.data.total || 0);

                        // 将获取的新闻数据与固定展示数据合并
                        const newsWithDisplay = newsData.map((item: News, index: number) => ({
                            ...item,
                            avatar: `https://api.dicebear.com/7.x/miniavs/svg?seed=${index}`,
                        }));

                        setDisplayNews(newsWithDisplay);
                    }
                }

                // 重置图片加载错误状态
                setImageLoadErrors({});
            } catch (error) {
                message.error('获取新闻列表失败');
                console.error('Error fetching news:', error);
            } finally {
                setLoading(false);
            }
        }, 300),
        [isLoggedIn, user, category, subcategory, sortOrder, page, pageSize]
    );
    // 2. 简化useEffect，只负责调用和清理
    useEffect(() => {
        // 组件挂载时获取数据
        fetchNews();

        // 清理函数
        return () => {
            fetchNews.cancel(); // 取消未执行的防抖函数
        };
    }, [fetchNews]); // 依赖fetchNews

    // 3. 添加防抖的点击处理函数
    const handleNewsClick = useCallback(
        debounce(async (newsId: string) => {
            try {
                // 先记录点击
                await axios.post(`/api/news/view/${newsId}`);

                // 然后导航到新闻详情页
                navigate(`/news/${newsId}`);
            } catch (error) {
                console.error('记录点击失败:', error);
                // 即使记录失败，也继续导航
                navigate(`/news/${newsId}`);
            }
        }, 300),
        [navigate]
    );

    return (

        <List
            itemLayout="vertical"
            size="large"
            pagination={{
                current: page,
                pageSize: pageSize,
                total: total,
                onChange: (newPage) => {
                    setPage(newPage);
                },
                onShowSizeChange: (current, size) => {
                    setPageSize(size);
                    setPage(1);
                },
                showSizeChanger: true,
                align: 'center',
            }}
            dataSource={displayNews}
            renderItem={(item) => (
                <List.Item
                    key={item.title}
                    actions={[
                        <IconText icon={StarOutlined} text="156" key="list-vertical-star-o" />,
                        <IconText icon={LikeOutlined} text="156" key="list-vertical-like-o" />,
                        <IconText icon={MessageOutlined} text="2" key="list-vertical-message" />,
                    ]}
                    // extra={
                    //     <img
                    //         width={272}
                    //         alt="logo"
                    //         src={item.imageUrl}
                    //         onClick={() => handleNewsClick(item.news_id)}
                    //     // src="https://gw.alipayobjects.com/zos/rmsportal/mqaQswcyDLcXyDKnZfES.png"
                    //     />
                    extra={
                        <Image
                            width={272}
                            height={153}
                            alt={item.title}
                            src={getImageUrl(item)}
                            fallback={DEFAULT_IMAGE}
                            preview={false}
                            style={{ objectFit: 'cover', cursor: 'pointer' }}
                            onClick={() => handleNewsClick(item.news_id)}
                            onError={() => handleImageError(item.news_id)}
                        />
                    }
                >
                    <List.Item.Meta
                        avatar={<Avatar src={item.avatar} />}
                        title={
                            <a
                                onClick={() => handleNewsClick(item.news_id)}
                                className="news-title"
                            >
                                {item.title}
                            </a>
                        }
                        description={
                            <span className="news-author">
                                {item.author ? `Author: ${item.author}` : 'Author Unknown'}
                            </span>
                        }
                    />
                    <div className="news-abstract">
                        {item.abstract}
                    </div>
                </List.Item>
            )}
        />
    );
};

export default NewsList;