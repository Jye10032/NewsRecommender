import React, { useState, useEffect } from 'react';
import { Table, Button, notification, Modal, message } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import adminAxios from '../../../utils/Request';

export default function NewsAudit() {
    const [dataSource, setDataSource] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchPendingNews();
    }, []);

    // 获取待审核的新闻
    const fetchPendingNews = async () => {
        setLoading(true);
        try {
            const res = await adminAxios.get('/news', {
                params: { status: 1 } // 假设状态1是待审核
            });
            setDataSource(res.data.items || []);
        } catch (error) {
            console.error('获取待审核新闻失败:', error);
            message.error('获取待审核新闻失败');
        } finally {
            setLoading(false);
        }
    };

    // 审核通过
    const handleApprove = async (id) => {
        try {
            await adminAxios.patch(`/news/${id}`, { status: 2 }); // 状态2为已发布
            message.success('审核通过');
            fetchPendingNews();
        } catch (error) {
            console.error('操作失败:', error);
            message.error('操作失败');
        }
    };

    // 审核不通过
    const handleReject = async (id) => {
        try {
            await adminAxios.patch(`/news/${id}`, { status: 3 }); // 状态3为已拒绝
            message.success('已拒绝');
            fetchPendingNews();
        } catch (error) {
            console.error('操作失败:', error);
            message.error('操作失败');
        }
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
            title: '提交时间',
            dataIndex: 'created_at',
            render: (date) => new Date(date).toLocaleString()
        },
        {
            title: '操作',
            render: (_, record) => (
                <div>
                    <Button
                        type="primary"
                        icon={<CheckOutlined />}
                        style={{ marginRight: '8px' }}
                        onClick={() => handleApprove(record.news_id)}
                    >
                        通过
                    </Button>
                    <Button
                        danger
                        icon={<CloseOutlined />}
                        onClick={() => handleReject(record.news_id)}
                    >
                        拒绝
                    </Button>
                </div>
            )
        }
    ];

    return (
        <div>
            <h2>新闻审核</h2>
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