import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Card, Skeleton, Button, Tag, Space, Divider, message, Row, Col } from 'antd';
import { ArrowLeftOutlined, CalendarOutlined, TagOutlined } from '@ant-design/icons';
import axios from 'axios';
import { News } from '../types/types.ts';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext.tsx';

const { Title, Paragraph } = Typography;

const NewsDetail: React.FC = () => {
    const { newsId } = useParams<{ newsId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [news, setNews] = useState<News | null>(null);
    const [loading, setLoading] = useState(true);
    const [viewStartTime, setViewStartTime] = useState<number>(Date.now());

    // 添加新函数：记录新闻点击
    const recordNewsView = async (newsId: string) => {
        try {
            await axios.post(`/api/news/view/${newsId}`);
            console.log('已记录新闻点击');
        } catch (error) {
            console.error('记录新闻点击失败:', error);
        }
    };
    // 随机图片URL（实际项目中应该从新闻数据中获取）
    const imageUrl = `https://picsum.photos/800/400?random=${newsId}`;

    // 获取新闻详情
    useEffect(() => {
        const fetchNewsDetail = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`http://localhost:3001/api/news/${newsId}`);
                if (response.data.success) {
                    setNews(response.data.data);
                } else {
                    message.error('获取新闻详情失败');
                }
            } catch (error) {
                console.error('Error fetching news detail:', error);
                message.error('获取新闻详情失败');
            } finally {
                setLoading(false);
            }
        };

        if (newsId) {
            fetchNewsDetail();
            // 添加这一行：记录点击
            recordNewsView(newsId);
            setViewStartTime(Date.now());
        }

        // 组件卸载时记录浏览时间
        return () => {
            if (user && newsId) {
                const duration = Math.floor((Date.now() - viewStartTime) / 1000); // 秒
                if (duration > 2) { // 只记录超过2秒的有效浏览
                    recordViewDuration(user.userId, newsId, duration);
                }
            }
        };
    }, [newsId, user]);

    // 记录浏览时长
    const recordViewDuration = async (userId: string, newsId: string, duration: number) => {
        try {
            await axios.post('http://localhost:3001/api/user/view', {
                userId,
                newsId,
                duration,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Failed to record view duration:', error);
        }
    };

    // 返回新闻列表
    const handleBack = () => {
        navigate(-1);
    };

    // 渲染新闻发布时间
    const renderPublishTime = (publishDate: string) => {
        try {
            const date = new Date(publishDate);
            return formatDistanceToNow(date, { addSuffix: true, locale: zhCN });
        } catch (e) {
            return '未知时间';
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <Button
                icon={<ArrowLeftOutlined />}
                onClick={handleBack}
                style={{ marginBottom: 20 }}
            >
                返回
            </Button>

            <Skeleton loading={loading} active paragraph={{ rows: 10 }}>
                {news && (
                    <Card bordered={false} style={{ marginBottom: 20 }}>
                        <Title level={2}>{news.title}</Title>

                        <Space style={{ marginBottom: 20 }}>
                            {news.published_at && (
                                <Space>
                                    <CalendarOutlined />
                                    {renderPublishTime(news.published_at)}
                                </Space>
                            )}
                            {news.category && (
                                <Tag color="blue">
                                    <TagOutlined /> {news.category}
                                </Tag>
                            )}
                            {news.subcategory && (
                                <Tag color="cyan">
                                    {news.subcategory}
                                </Tag>
                            )}
                        </Space>

                        <Divider />

                        {news.abstract && (
                            <div style={{ background: '#f5f5f5', padding: 15, borderRadius: 4, marginBottom: 20 }}>
                                <Paragraph style={{ fontWeight: 'bold', fontSize: 16 }}>
                                    {news.abstract}
                                </Paragraph>
                            </div>
                        )}

                        <Row gutter={[16, 16]}>
                            <Col xs={24} lg={16}>
                                <div className="news-content">
                                    <Paragraph>
                                        这是新闻的详细内容，目前由于后端数据可能不包含完整内容，
                                        我们暂时显示摘要信息。后续可以扩展数据库，添加完整的新闻内容。
                                    </Paragraph>
                                    <Paragraph>
                                        {news.abstract}
                                    </Paragraph>
                                </div>
                            </Col>
                            <Col xs={24} lg={8}>
                                {news.url && (
                                    <Card size="small" title="原文链接">
                                        <a href={news.url} target="_blank" rel="noopener noreferrer">
                                            查看原文
                                        </a>
                                    </Card>
                                )}
                            </Col>
                        </Row>
                    </Card>
                )}
            </Skeleton>
        </div>
    );
};

export default NewsDetail;