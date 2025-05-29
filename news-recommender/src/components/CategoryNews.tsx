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
    sortOrder?: string; // 添加sortOrder属性
}
const IconText = ({ icon, text }: { icon: React.FC; text: string }) => (
    <Space>
        {React.createElement(icon)}
        {text}
    </Space>
);

const CategoryNews: React.FC<CategoryNewsProps> = ({ category, subcategory, sortOrder = 'latest' }) => {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchNews = async () => {
            setLoading(true);
            try {
                let url = subcategory
                    ? `/api/news/category/${category}/${subcategory}`
                    : `/api/news/category/${category}`;

                // 添加排序参数
                url += `?sort=${sortOrder}`;

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
    }, [category, subcategory, sortOrder]);

    const handleNewsClick = (newsId: string) => {
        navigate(`/news/${newsId}`);
    };

    return (
        <><div style={{
            padding: '20px 0',
            borderBottom: '1px solid #f0f0f0',
            marginBottom: '20px'
        }}>
            {/* <Title
                level={2}
                style={{
                    fontWeight: 'bold',
                    color: '#262626',
                    marginBottom: '5px'
                }}
            >
                {subcategory ? `${category} - ${subcategory}` : category}
            </Title> */}
            {/* <Typography.Text type="secondary">
                最新{subcategory || category}相关新闻
            </Typography.Text> */}
        </div>
            {/* <Title level={2}>
                {subcategory ? `${category} - ${subcategory}` : category}
            </Title> */}
            <Spin spinning={loading}>
                <List
                    itemLayout="vertical"
                    size="large"
                    pagination={{
                        onChange: page => {
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        },
                        pageSize: 5,
                        align: 'center',
                        showSizeChanger: true,
                        pageSizeOptions: ['5', '10', '20'],
                        showTotal: (total) => `共 ${total} 条新闻`,
                        style: { marginTop: '20px' }
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
                                    style={{ borderRadius: '8px' }}
                                />
                            }
                            style={{
                                padding: '16px',
                                transition: 'all 0.3s',
                                borderRadius: '8px',
                                cursor: 'pointer'
                            }}
                            className="news-item-hover" // 添加自定义类名用于CSS悬停效果
                            onClick={() => handleNewsClick(item.news_id)}
                        >

                            <List.Item.Meta
                                avatar={<Avatar src={item.avatar} />}
                                title={
                                    <a onClick={() => handleNewsClick(item.news_id)}>
                                        {item.title}
                                    </a>
                                }
                            // description={`Category: ${item.category}${item.subcategory ? ` - ${item.subcategory}` : ''}`}
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