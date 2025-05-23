//新闻列表组件  


import React, { useState, useEffect, useCallback } from 'react';
import { LikeOutlined, MessageOutlined, StarOutlined } from '@ant-design/icons';
import { Avatar, List, Space, message } from 'antd';
import { News } from '../types/types.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import { debounce } from 'lodash'; // 导入debounce
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// const data = Array.from({ length: 23 }).map((_, i) => ({
//     href: 'https://ant.design',
//     title: `ant design part ${i}`,
//     avatar: `https://api.dicebear.com/7.x/miniavs/svg?seed=${i}`,
//     description:
//         'Ant Design, a design language for background applications, is refined by Ant UED Team.',
//     content:
//         'We supply a series of design principles, practical patterns and high quality design resources (Sketch and Axure), to help people create their product prototypes beautifully and efficiently.',
// }));

interface DisplayNews extends News {
    avatar?: string;
    actions?: React.ReactNode[];
    imageUrl?: string;
}


const IconText = ({ icon, text }: { icon: React.FC; text: string }) => (
    <Space>
        {React.createElement(icon)}
        {text}
    </Space>
);

const NewsList: React.FC = () => {
    const navigate = useNavigate();
    const { user, isLoggedIn } = useAuth();
    const [displayNews, setDisplayNews] = useState<DisplayNews[]>([]);
    const [loading, setLoading] = useState(false);


    // 1. 将fetchNews移到useEffect外面并使用useCallback包装
    const fetchNews = useCallback(
        debounce(async () => {
            try {
                setLoading(true);

                let response;

                // 根据登录状态决定获取普通新闻还是个性化推荐新闻
                if (isLoggedIn && user) {
                    // 确保令牌存在
                    const token = localStorage.getItem('token');
                    if (!token) {
                        throw new Error('找不到登录令牌');
                    }

                    // 已登录，获取个性化推荐
                    response = await axios.get('http://localhost:3001/api/recommendations', {
                        headers: {
                            Authorization: `Bearer ${token}`  // 使用JWT令牌
                        }
                    });
                    if (response.data.success) {
                        message.success('加载个性化推荐新闻');
                    } else {
                        message.warning('个性化推荐失败，加载普通新闻');
                        throw new Error('推荐服务返回失败');
                    }
                } else {
                    // 未登录，获取普通新闻列表
                    response = await axios.get('http://localhost:3001/api/news');
                }

                // 检查数据结构，兼容不同的返回格式
                const newsData = response.data.data ||
                    response.data.recommendations ||
                    [];

                // 将获取的新闻数据与固定展示数据合并
                const newsWithDisplay = newsData.map((item: News, index: number) => ({
                    ...item,
                    avatar: `https://api.dicebear.com/7.x/miniavs/svg?seed=${index}`,
                    imageUrl: "https://gw.alipayobjects.com/zos/rmsportal/mqaQswcyDLcXyDKnZfES.png"
                }));
                setDisplayNews(newsWithDisplay);
            } catch (error) {
                message.error('获取新闻列表失败');
                console.error('Error fetching news:', error);
            } finally {
                setLoading(false);
            }
        }, 300),  // 300ms的防抖时间
        [isLoggedIn, user]  // 依赖项
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
                onChange: (page) => {
                    console.log(page);
                },
                pageSize: 3,
                align: 'center',
            }}
            dataSource={displayNews}
            footer={
                <div>
                    <b>ant design</b> footer part
                </div>
            }
            renderItem={(item) => (
                <List.Item
                    key={item.title}
                    actions={[
                        <IconText icon={StarOutlined} text="156" key="list-vertical-star-o" />,
                        <IconText icon={LikeOutlined} text="156" key="list-vertical-like-o" />,
                        <IconText icon={MessageOutlined} text="2" key="list-vertical-message" />,
                    ]}
                    extra={
                        <img
                            width={272}
                            alt="logo"
                            src={item.imageUrl}
                            onClick={() => handleNewsClick(item.news_id)}
                        // src="https://gw.alipayobjects.com/zos/rmsportal/mqaQswcyDLcXyDKnZfES.png"
                        />
                    }
                >
                    <List.Item.Meta
                        avatar={<Avatar src={item.avatar} />}
                        // title={<a href={item.url}>{item.title}</a>}
                        title={
                            <a onClick={() => handleNewsClick(item.news_id)}>
                                {item.title}
                            </a>
                        }
                        description={item.author ? `作者: ${item.author}` : '未知作者'}

                    />
                    {item.abstract}
                </List.Item>
            )}
        />
    );
};

export default NewsList;