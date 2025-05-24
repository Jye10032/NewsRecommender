import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, message, App } from 'antd';
import { ExclamationCircleFilled } from '@ant-design/icons';
import adminAxios from '../../../utils/Request';

const { confirm } = Modal;

export default function Published() {
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const { modal } = App.useApp();

  useEffect(() => {
    fetchPublishedNews();
  }, []);

  // 获取已发布新闻列表
  const fetchPublishedNews = async () => {
    setLoading(true);
    try {
      const res = await adminAxios.get('/news', {
        params: { status: 2 } // 状态2表示已发布
      });

      if (res.data && res.data.items) {
        setNewsList(res.data.items);
      } else {
        setNewsList([]);
      }
    } catch (error) {
      console.error('获取已发布新闻失败:', error);
      message.error('获取已发布新闻失败');
    } finally {
      setLoading(false);
    }
  };

  // 下线新闻
  const handleOffline = (id) => {
    console.log('准备下线新闻:', id);

    modal.confirm({
      title: '确定要下线该新闻吗?',
      icon: <ExclamationCircleFilled />,
      content: '下线后，该新闻将不再显示在前台',
      onOk: async () => {
        try {
          // 移除/status子路径，直接使用/news/:id
          const res = await adminAxios.patch(`/news/${id}`, {
            status: 3 // 状态3表示已下线
          });

          console.log('下线响应:', res.data);

          if (res.data.success) {
            message.success('新闻已下线');
            fetchPublishedNews(); // 刷新列表
          } else {
            message.error(res.data.message || '下线失败');
          }
        } catch (error) {
          console.error('下线新闻失败:', error);
          message.error('下线新闻失败: ' + (error.response?.data?.message || error.message));
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
          type="primary"
          danger
          onClick={() => handleOffline(record.news_id)}
        >
          下线
        </Button>
      )
    }
  ];

  return (
    <div>
      <h2>已发布新闻</h2>
      <Table
        dataSource={newsList}
        columns={columns}
        rowKey="news_id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
}