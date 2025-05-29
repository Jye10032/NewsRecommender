import React, { useState, useEffect, CSSProperties } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { Image, Typography, Card, Skeleton, Button, Tag, Space, Divider, message, Row, Col, Empty, Breadcrumb } from 'antd';
import { ArrowLeftOutlined, CalendarOutlined, TagOutlined, HomeOutlined } from '@ant-design/icons';
import axios from 'axios';
import { News } from '../types/types.ts';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext.tsx';
import './BreadcrumbStyles.css';


const { Title, Paragraph } = Typography;

// 默认图片URL
const DEFAULT_IMAGE = `https://picsum.photos/800/400?random=default`;

// 样式配置


// 样式配置
// 样式配置部分的修改
const styles: Record<string, CSSProperties> = {
    container: {
        padding: '20px 150px 150px', // 减小顶部padding
        maxWidth: '1200px',
        margin: '0 auto',
    },
    newsTitle: {
        fontFamily: '"Times New Roman", Times, serif',
        textAlign: 'center',
        fontSize: '32px',
        fontWeight: 'bold',
        marginTop: '10px', // 减小顶部间距
        marginBottom: '15px'
    },
    breadcrumb: {
        marginBottom: '15px',
    },
    contentWrapper: {
        fontFamily: '"Times New Roman", Times, serif',
        fontSize: '20px',
        lineHeight: '2.2',
        color: '#333',
        width: '100%',
    },
    abstractContainer: {
        background: '#f5f5f5',
        padding: '15px 85px', // 增加左右内边距为100px
        borderRadius: 4,
        marginBottom: 20,
        width: 'calc(100% - 300px)', // 调整宽度计算方式与内边距匹配
        margin: '0 auto 20px',
        overflowWrap: 'break-word',
        wordWrap: 'break-word',
    },
    abstractText: {
        fontWeight: 'bold',
        fontSize: 17,
        fontFamily: '"Times New Roman", Times, serif',
        padding: '0',
        whiteSpace: 'pre-wrap', // 保留空格并允许自动换行
    },
    paragraph: {
        fontFamily: '"Times New Roman", Times, serif',
        fontSize: '25px',
        marginBottom: '1.8em',
        textAlign: 'justify',
        letterSpacing: '0.3px',
    },
    imageContainer: {
        marginBottom: 30,
        textAlign: 'center',
        padding: '0', // 确保图片容器没有内边距
        width: '100%',
    },
    imageStyle: {
        width: '100%',
        height: '400px', // 添加固定高度
        maxHeight: '500px',
        objectFit: 'contain',
        background: '#f5f5f5', // 添加背景色
    },
    mainContent: {
        padding: '0', // 移除mainContent的内边距
        width: '100%',
        margin: '0 auto',
    },
    articleContainer: {
        padding: '0 150px', // 增加左右内边距为100px，与摘要一致
        width: 'calc(100% - 300px)', // 调整宽度计算方式与内边距匹配
        margin: '0 auto',
    },
    metaInfoContainer: {
        marginTop: 50,
        borderTop: '1px solid #eee',
        paddingTop: 20,
        padding: '0 150px', // 增加左右内边距为100px，与文章内容一致
        width: 'calc(100% - 300px)', // 调整宽度计算方式与内边距匹配
        margin: '0 auto',
    },
    metaInfoCard: {
        marginBottom: 16,
        backgroundColor: '#f9f9f9',
        borderRadius: 4,
    }

};


const NewsDetail: React.FC = () => {
    const { newsId } = useParams<{ newsId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [news, setNews] = useState<News | null>(null);
    const [loading, setLoading] = useState(true);
    const [viewStartTime, setViewStartTime] = useState<number>(Date.now());
    const [imageError, setImageError] = useState(false);

    // 获取图片URL
    // const getImageUrl = () => {
    //     // 图片加载错误处理函数
    //     // const handleImageError = (newsId: string) => {
    //     //     setImageLoadErrors(prev => ({
    //     //         ...prev,
    //     //         [newsId]: true
    //     //     }));
    //     // };

    // 获取图片URL的函数
    const getImageUrl = () => {
        // 添加调试信息
        console.log("图片URL信息:", {
            hasNews: !!news,
            coverImageUrl: news?.cover_image_url,
            imageError: imageError
        });

        if (imageError) return DEFAULT_IMAGE;
        return news?.cover_image_url || `https://picsum.photos/800/400?random=${newsId}`;
    };




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
        <div style={styles.container}>
            <Breadcrumb className="news-breadcrumb">
                <Breadcrumb.Item>
                    <Link to="/"><HomeOutlined /> Home</Link>
                </Breadcrumb.Item>
                {news && news.category && (
                    <Breadcrumb.Item>
                        <Link to={`/category/${news.category}`}>{news.category}</Link>
                    </Breadcrumb.Item>
                )}
                {news && news.subcategory && (
                    <Breadcrumb.Item>
                        <Link to={`/category/${news.category}/${news.subcategory}`}>{news.subcategory}</Link>
                    </Breadcrumb.Item>
                )}
                <Breadcrumb.Item>News Detail</Breadcrumb.Item>
            </Breadcrumb>

            <Skeleton loading={loading} active paragraph={{ rows: 10 }}>
                {news && (
                    <Card bordered={false} style={{ marginBottom: 20 }}>
                        <div style={styles.newsTitle}>{news.title}</div>

                        <Space style={{ marginBottom: 20, display: 'flex', justifyContent: 'center' }}>
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


                        <div style={styles.imageContainer}>
                            {/* 添加图片加载状态 */}
                            <Image
                                src={getImageUrl()}
                                alt={news.title}
                                style={styles.imageStyle}
                                fallback={DEFAULT_IMAGE}
                                onError={() => setImageError(true)}
                                preview={true}
                                placeholder={
                                    <div style={{
                                        width: '100%',
                                        height: '400px',
                                        background: '#f5f5f5',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center'
                                    }}>
                                        <Skeleton.Image active={true} style={{ width: '100%', height: '400px' }} />
                                    </div>
                                }
                            />
                        </div>

                        <Divider />

                        {news.abstract && (
                            <div style={styles.abstractContainer}>
                                <Paragraph style={styles.abstractText}>
                                    {news.abstract}
                                </Paragraph>
                            </div>
                        )}

                        <div style={styles.mainContent}>
                            <div className="news-content" style={styles.contentWrapper}>
                                <div style={styles.articleContainer}>
                                    {news.content ? (
                                        // 正文内容
                                        news.content.split('\n').map((paragraph, index) => (
                                            <Paragraph key={index} style={styles.paragraph}>
                                                {paragraph}
                                            </Paragraph>
                                        ))
                                    ) : (
                                        // 无内容时的显示
                                        <>
                                            <Empty
                                                description="No content available"
                                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                                style={{ marginBottom: 20 }}
                                            />

                                        </>
                                    )}
                                </div>


                                {/* 在内容下方显示元信息 */}
                                <div style={styles.metaInfoContainer}>
                                    {news.author && (
                                        <Card
                                            size="small"
                                            title="Author"
                                            style={styles.metaInfoCard}
                                        >
                                            {news.author}
                                        </Card>
                                    )}
                                    {news.url && (
                                        <Card
                                            size="small"
                                            title="Original link"
                                            style={styles.metaInfoCard}
                                        >
                                            <a href={news.url} target="_blank" rel="noopener noreferrer">
                                                link
                                            </a>
                                        </Card>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>
                )}
            </Skeleton>
        </div>
    );
};

export default NewsDetail;