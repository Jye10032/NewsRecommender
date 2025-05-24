import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, message } from 'antd';
import { ExclamationCircleFilled, StopOutlined } from '@ant-design/icons';
import adminAxios from '../../../utils/Request';

const { confirm } = Modal;

export default function NewsOffline() {
    const [dataSource, setDataSource] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchPublishedNews();
    }, []);

    // 获取已发布的新闻
    const fetchPublishedNews = async () => {
        setLoading(true);
        try {
            const res = await adminAxios.get('/news', {
                params: { status: 2 } // 状态2为已发布
            });
            setDataSource(res.data.items || []);
        } catch (error) {
            console.error('获取已发布新闻失败:', error);
            message.error('获取已发布新闻失败');
        } finally {
            setLoading(false);
        }
    };

    // 下架新闻
    const handleOffline = (id) => {
        confirm({
            title: '确定要下架该新闻吗?',
            icon: <ExclamationCircleFilled />,
            content: '下架后，该新闻将不再对用户可见',
            onOk: async () => {
                try {
                    await adminAxios.patch(`/news/${id}`, { status: 3 }); // 状态3为已下架
                    message.success('新闻已下架');
                    fetchPublishedNews();
                } catch (error) {
                    console.error('下架失败:', error);
                    message.error('下架失败');
                }
            }
        });
    };

    const columns = [
        {
            title: '新闻标题',
            dataIndex: 'title',
            render: (text, record) => <a href={`/news/${record.news_id}`} target="_blank" rel="noreferrer">{text}</a>
        },
        {
            title: '作者',
            dataIndex: 'author_name'
        },
        {
            title: '分类',
            dataIndex: 'category_name'
        },
        {
            title: '发布时间',
            dataIndex: 'published_at',
            render: (date) => new Date(date).toLocaleString()
        },
        {
            title: '操作',
            render: (_, record) => (
                <Button
                    danger
                    icon={<StopOutlined />}
                    onClick={() => handleOffline(record.news_id)}
                >
                    下架
                </Button>
            )
        }
    ];

    return (
        <div>
            <h2>新闻下架</h2>
            <Table
                dataSource={dataSource}
                columns={columns}
                rowKey="news_id"
                loading={loading}
                pagination={{ pageSize: 10 }}
            />
        </div>
    );
}