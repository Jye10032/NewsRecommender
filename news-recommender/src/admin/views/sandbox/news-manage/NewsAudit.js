import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, message, Tag } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, ExclamationCircleFilled } from '@ant-design/icons';
import adminAxios from '../../../utils/Request';

const { confirm } = Modal;

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
                params: { status: 1 }  // 状态1表示待审核
            });

            if (res.data && res.data.items) {
                setDataSource(res.data.items);
            } else {
                setDataSource([]);
            }
        } catch (error) {
            console.error('获取待审核新闻失败:', error);
            message.error('获取待审核新闻失败');
        } finally {
            setLoading(false);
        }
    };

    // 审核通过
    const handleApprove = (id) => {
        confirm({
            title: '确认通过审核?',
            icon: <CheckCircleOutlined />,
            content: '通过后，新闻将被发布到前台',
            onOk: async () => {
                try {
                    const res = await adminAxios.patch(`/news/${id}/status`, {
                        status: 2  // 状态2表示已发布
                    });

                    if (res.data.success) {
                        message.success('新闻已通过审核并发布');
                        fetchPendingNews();  // 刷新列表
                    } else {
                        message.error(res.data.message || '操作失败');
                    }
                } catch (error) {
                    console.error('审核操作失败:', error);
                    message.error('审核操作失败: ' + (error.response?.data?.message || error.message));
                }
            }
        });
    };

    // 审核不通过
    const handleReject = (id) => {
        confirm({
            title: '确认驳回此新闻?',
            icon: <CloseCircleOutlined />,
            content: '驳回后，新闻将不会发布',
            okType: 'danger',
            onOk: async () => {
                try {
                    const res = await adminAxios.patch(`/news/${id}/status`, {
                        status: 3  // 状态3表示已下线/未通过
                    });

                    if (res.data.success) {
                        message.success('新闻已驳回');
                        fetchPendingNews();  // 刷新列表
                    } else {
                        message.error(res.data.message || '操作失败');
                    }
                } catch (error) {
                    console.error('审核操作失败:', error);
                    message.error('审核操作失败: ' + (error.response?.data?.message || error.message));
                }
            }
        });
    };

    const columns = [
        {
            title: '新闻标题',
            dataIndex: 'title',
            render: (text, record) => (
                <a href={`/admin/news-manage/preview/${record.news_id}`} target="_blank" rel="noreferrer">
                    {text}
                </a>
            )
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
                <>
                    <Button
                        type="primary"
                        style={{ marginRight: '8px' }}
                        onClick={() => handleApprove(record.news_id)}
                    >
                        <CheckCircleOutlined /> 通过
                    </Button>
                    <Button
                        type="primary"
                        danger
                        onClick={() => handleReject(record.news_id)}
                    >
                        <CloseCircleOutlined /> 驳回
                    </Button>
                </>
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
                locale={{ emptyText: '暂无待审核的新闻' }}
            />
        </div>
    );
}