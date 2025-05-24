import React, { useEffect, useState } from 'react';
import { Descriptions, Spin, message } from 'antd';
import { PageHeader } from '@ant-design/pro-components';
import { useParams, useNavigate } from 'react-router-dom';
import adminAxios from '../../../utils/Request';
import moment from 'moment';

export default function NewsPreview() {
    const [newsInfo, setNewsInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const { id } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        adminAxios.get(`/news/${id}`)
            .then(res => {
                setNewsInfo(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error('获取新闻详情失败:', err);
                message.error('获取新闻详情失败');
                setLoading(false);
            });
    }, [id]);

    return (
        <div>
            {loading ? (
                <Spin tip="加载中..." />
            ) : (
                <div>
                    <PageHeader
                        onBack={() => navigate(-1)}
                        title={newsInfo?.title}
                    />
                    <Descriptions bordered>
                        <Descriptions.Item label="作者">{newsInfo?.author_name || '未知'}</Descriptions.Item>
                        <Descriptions.Item label="分类">{newsInfo?.category_name || '未分类'}</Descriptions.Item>
                        <Descriptions.Item label="创建时间">
                            {newsInfo?.created_at ? moment(newsInfo.created_at).format('YYYY-MM-DD HH:mm:ss') : '未知'}
                        </Descriptions.Item>
                        {newsInfo?.published_at && (
                            <Descriptions.Item label="发布时间">
                                {moment(newsInfo.published_at).format('YYYY-MM-DD HH:mm:ss')}
                            </Descriptions.Item>
                        )}
                        <Descriptions.Item label="摘要" span={3}>
                            {newsInfo?.abstract || '无摘要'}
                        </Descriptions.Item>
                        {newsInfo?.url && (
                            <Descriptions.Item label="原文链接" span={3}>
                                <a href={newsInfo.url} target="_blank" rel="noreferrer">{newsInfo.url}</a>
                            </Descriptions.Item>
                        )}
                    </Descriptions>
                </div>
            )}
        </div>
    );
}