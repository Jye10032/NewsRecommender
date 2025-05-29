import React, { useState, useEffect } from 'react';
import { Layout, Typography, List, Avatar, Space, Tag, Spin, message } from 'antd';
import { StarOutlined, LikeOutlined, MessageOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { NewsItem } from '../types/types.ts'; // 确保路径正确

const { Content } = Layout;
const { Title } = Typography;


const IconText = ({ icon, text }: { icon: React.FC; text: string }) => (
    <Space>
        {React.createElement(icon)}
        {text}
    </Space>
);

const TrendingNewsPage: React.FC = () => {
    const [trendingNews, setTrendingNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTrendingNews = async () => {
            try {
                setLoading(true);
                const response = await axios.get('/api/news/trending', {
                    params: { limit: 20 }
                });

                if (response.data.success) {
                    // 处理API返回的新闻数据
                    const processedNews = response.data.data.map((item: any, index: number) => ({
                        ...item,
                        avatar: `https://api.dicebear.com/7.x/miniavs/svg?seed=${index}`,
                        imageUrl: "https://gw.alipayobjects.com/zos/rmsportal/mqaQswcyDLcXyDKnZfES.png"
                    }));
                    setTrendingNews(processedNews);
                } else {
                    message.error('获取热门新闻失败');
                }
            } catch (error) {
                console.error('获取热门新闻失败:', error);
                message.error('无法加载热门新闻');
            } finally {
                setLoading(false);
            }
        };

        fetchTrendingNews();
    }, []);

    const handleNewsClick = (newsId: string) => {
        navigate(`/news/${newsId}`);
    };

    return (
        <>
            <Title level={2}>Top Trending</Title>

            <Spin spinning={loading}>
                <List
                    itemLayout="vertical"
                    size="large"
                    pagination={{
                        onChange: page => {
                            window.scrollTo(0, 0);
                        },
                        pageSize: 5,
                        align: 'center',
                    }}
                    dataSource={trendingNews}
                    renderItem={(item) => (
                        <List.Item
                            key={item.news_id}
                            actions={[
                                <IconText icon={StarOutlined} text={String(item.click_count || 0)} key="list-vertical-star-o" />,
                                <IconText icon={LikeOutlined} text="156" key="list-vertical-like-o" />,
                                <IconText icon={MessageOutlined} text="2" key="list-vertical-message" />,
                                <Tag color="blue">{item.category}</Tag>
                            ]}
                            extra={
                                <img
                                    width={272}
                                    alt="logo"
                                    src={item.imageUrl}
                                />
                            }
                        >
                            <List.Item.Meta
                                avatar={<Avatar src={item.avatar} />}
                                title={
                                    <a onClick={() => handleNewsClick(item.news_id)}>
                                        {item.title}
                                    </a>
                                }
                                description={item.author ? `author: ${item.author}` : '未知作者'}
                            />
                            {item.abstract}
                        </List.Item>
                    )}
                />
            </Spin>
        </>
    );
};

export default TrendingNewsPage;