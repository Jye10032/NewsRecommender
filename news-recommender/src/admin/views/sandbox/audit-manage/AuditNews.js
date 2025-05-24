import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Space, message, Modal, Input } from 'antd';
import { CheckOutlined, CloseOutlined, EyeOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import adminAxios from '../../../utils/Request';

const { TextArea } = Input;

export default function AuditNews() {
    const [newsList, setNewsList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0
    });
    const [rejectModal, setRejectModal] = useState({
        visible: false,
        newsId: null,
        reason: ''
    });

    // 获取待审核新闻
    const fetchAuditNews = async (page = 1, pageSize = 10) => {
        setLoading(true);
        try {
            const res = await adminAxios.get('/news', {
                params: {
                    page,
                    size: pageSize,
                    status: 1 // 审核中状态
                }
            });

            if (res.data && res.data.items) {
                setNewsList(res.data.items);
                setPagination({
                    current: res.data.page,
                    pageSize: res.data.size,
                    total: res.data.total
                });
            }
        } catch (error) {
            console.error('获取待审核新闻失败:', error);
            message.error('获取待审核新闻失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAuditNews();
    }, []);

    // 处理表格变化
    const handleTableChange = (pagination) => {
        fetchAuditNews(pagination.current, pagination.pageSize);
    };

    // 通过审核
    const handleApprove = async (id) => {
        try {
            await adminAxios.patch(`/news/${id}`, { status: 2 }); // 状态2为已发布
            message.success('审核通过');
            fetchAuditNews(pagination.current, pagination.pageSize);
        } catch (error) {
            console.error('审核操作失败:', error);
            message.error('审核操作失败: ' + (error.response?.data?.message || error.message));
        }
    };

    // 打开拒绝模态框
    const showRejectModal = (id) => {
        setRejectModal({
            visible: true,
            newsId: id,
            reason: ''
        });
    };

    // 处理拒绝原因变更
    const handleReasonChange = (e) => {
        setRejectModal({
            ...rejectModal,
            reason: e.target.value
        });
    };

    // 确认拒绝
    const handleRejectConfirm = async () => {
        try {
            await adminAxios.patch(`/news/${rejectModal.newsId}`, {
                status: 3, // 状态3为拒绝/已下线
                reject_reason: rejectModal.reason
            });
            message.success('已拒绝该新闻');
            setRejectModal({ visible: false, newsId: null, reason: '' });
            fetchAuditNews(pagination.current, pagination.pageSize);
        } catch (error) {
            console.error('拒绝操作失败:', error);
            message.error('拒绝操作失败: ' + (error.response?.data?.message || error.message));
        }
    };

    // 表格列定义
    const columns = [
        {
            title: '新闻标题',
            dataIndex: 'title',
            key: 'title',
            render: (text, record) => (
                <Link to={`/admin/news-manage/preview/${record.news_id}`}>{text}</Link>
            )
        },
        {
            title: '作者',
            dataIndex: 'author_name',
            key: 'author'
        },
        {
            title: '分类',
            dataIndex: 'category_name',
            key: 'category'
        },
        {
            title: '提交时间',
            dataIndex: 'updated_at',
            key: 'updated_at',
            render: (date) => new Date(date).toLocaleString()
        },
        {
            title: '操作',
            key: 'action',
            render: (_, record) => (
                <Space size="small">
                    <Button
                        type="primary"
                        icon={<CheckOutlined />}
                        size="small"
                        onClick={() => handleApprove(record.news_id)}
                    >
                        通过
                    </Button>

                    <Button
                        danger
                        icon={<CloseOutlined />}
                        size="small"
                        onClick={() => showRejectModal(record.news_id)}
                    >
                        拒绝
                    </Button>

                    <Button
                        type="default"
                        icon={<EyeOutlined />}
                        size="small"
                        onClick={() => window.open(`/news/${record.news_id}`, '_blank')}
                    >
                        预览
                    </Button>
                </Space>
            )
        }
    ];

    return (
        <div>
            <h2>待审核新闻</h2>

            <Table
                rowKey="news_id"
                columns={columns}
                dataSource={newsList}
                pagination={pagination}
                loading={loading}
                onChange={handleTableChange}
            />

            <Modal
                title="拒绝原因"
                open={rejectModal.visible}
                onOk={handleRejectConfirm}
                onCancel={() => setRejectModal({ ...rejectModal, visible: false })}
                okText="确认"
                cancelText="取消"
            >
                <TextArea
                    rows={4}
                    value={rejectModal.reason}
                    onChange={handleReasonChange}
                    placeholder="请输入拒绝原因..."
                />
            </Modal>
        </div>
    );
}