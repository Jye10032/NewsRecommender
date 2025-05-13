import React, { useState, useEffect } from 'react';
import { List, Card, Avatar, Space, Typography, Spin } from 'antd';
import { StarOutlined, LikeOutlined, MessageOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { NewsItem } from '../types/types';

const { Title } = Typography;

interface CategoryNewsProps {
    category: string;
    subcategory?: string;
}
const IconText = ({ icon, text }: { icon: React.FC; text: string }) => (
    <Space>
        {React.createElement(icon)}
        {text}
    </Space>
);

const CategoryNews: React.FC<CategoryNewsProps> = ({ category, subcategory }) => {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchNews = async () => {
            setLoading(true);
            try {
                const url = subcategory
                    ? `/api/news/category/${category}/${subcategory}`
                    : `/api/news/category/${category}`;

                const response = await axios.get(url);
                if (response.data.success) {
                    const processedNews = response.data.data.map((item: any, index: number) => ({
                        ...item,
                        avatar: `https://api.dicebear.com/7.x/miniavs/svg?seed=${index}`,
                        imageUrl: "https://gw.alipayobjects.com/zos/rmsportal/mqaQswcyDLcXyDKnZfES.png"
                    }));
                    setNews(processedNews);
                }
            } catch (error) {
                console.error('获取分类新闻失败:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchNews();
    }, [category, subcategory]);

    const handleNewsClick = (newsId: string) => {
        navigate(`/news/${newsId}`);
    };

    return (
        <>
            <Title level={2}>
                {subcategory ? `${category} - ${subcategory}` : category}
            </Title>
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
                    dataSource={news}
                    renderItem={(item) => (
                        <List.Item
                            key={item.news_id}
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
                                description={`分类: ${item.category}${item.subcategory ? ` - ${item.subcategory}` : ''}`}
                            />
                            {item.abstract}
                        </List.Item>
                    )}
                />
            </Spin>
        </>
    );
};

export default CategoryNews;