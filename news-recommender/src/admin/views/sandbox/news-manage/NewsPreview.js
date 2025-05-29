import React, { useEffect, useState } from 'react';
import { Descriptions, Spin, Button, message } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import adminAxios from '../../../utils/Request';
import moment from 'moment';

export default function NewsPreview() {
    const [news, setNews] = useState(null);
    const [loading, setLoading] = useState(true);
    const { id } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchNewsDetail = async () => {
            try {
                setLoading(true);
                const res = await adminAxios.get(`/news/${id}`);
                setNews(res.data.data);
            } catch (error) {
                console.error('获取新闻详情失败:', error);
                message.error('获取新闻详情失败');
            } finally {
                setLoading(false);
            }
        };

        fetchNewsDetail();
    }, [id]);

    // 渲染状态标签
    const getStatusText = (status) => {
        switch (status) {
            case 0: return '草稿';
            case 1: return '待审核';
            case 2: return '已发布';
            case 3: return '已下线/未通过';
            case 4: return '已删除';
            default: return '未知';
        }
    };

    return (
        <div>
            {loading ? <Spin size="large" /> : (
                <>
                    <h2>新闻预览</h2>
                    {news && (
                        <>
                            <Descriptions title={news.title} bordered>
                                <Descriptions.Item label="作者">{news.author_name}</Descriptions.Item>
                                <Descriptions.Item label="创建时间">
                                    {news.created_at ? moment(news.created_at).format('YYYY-MM-DD HH:mm:ss') : '未知'}
                                </Descriptions.Item>
                                <Descriptions.Item label="发布时间">
                                    {news.published_at ? moment(news.published_at).format('YYYY-MM-DD HH:mm:ss') : '未发布'}
                                </Descriptions.Item>
                                <Descriptions.Item label="分类">{news.category_name}</Descriptions.Item>
                                <Descriptions.Item label="子分类">{news.subcategory_name}</Descriptions.Item>
                                <Descriptions.Item label="状态">{getStatusText(news.status)}</Descriptions.Item>
                            </Descriptions>

                            <div style={{ margin: '20px 0', padding: '20px', border: '1px solid #e8e8e8' }}>
                                <h3>新闻内容</h3>
                                <div
                                    className="news-content"
                                    dangerouslySetInnerHTML={{ __html: news.content }}
                                />
                            </div>

                            <div style={{ marginTop: '20px' }}>
                                <Button onClick={() => navigate('/admin/news-manage/sunset')}>返回</Button>
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
}