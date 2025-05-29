import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, message, App } from 'antd';
import { ExclamationCircleFilled } from '@ant-design/icons';
import adminAxios from '../../../utils/Request';

const { confirm } = Modal;

export default function Unpublished() {
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const { modal, message } = App.useApp();

  useEffect(() => {
    fetchUnpublishedNews();
  }, []);

  // 获取待发布新闻列表
  const fetchUnpublishedNews = async () => {
    setLoading(true);
    try {
      const res = await adminAxios.get('/news', {
        params: { status: 1 } // 状态1表示待发布/审核通过
      });

      if (res.data && res.data.items) {
        setNewsList(res.data.items);
      } else {
        setNewsList([]);
      }
    } catch (error) {
      console.error('获取待发布新闻失败:', error);
      message.error('获取待发布新闻失败');
    } finally {
      setLoading(false);
    }
  };

  // 发布新闻
  const handlePublish = (id) => {
    modal.confirm({
      title: '确定要发布该新闻吗?',
      icon: <ExclamationCircleFilled />,
      content: '发布后，新闻将显示在前台页面',
      onOk: async () => {
        try {
          await adminAxios.patch(`/news/${id}`, { status: 2 }); // 状态2表示已发布
          message.success('新闻发布成功');
          fetchUnpublishedNews(); // 刷新列表
        } catch (error) {
          console.error('发布新闻失败:', error);
          message.error('发布新闻失败');
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
      title: '创建时间',
      dataIndex: 'created_at',
      render: (date) => new Date(date).toLocaleString()
    },
    {
      title: '操作',
      render: (_, record) => (
        <Button
          type="primary"
          onClick={() => handlePublish(record.news_id)}
        >
          发布
        </Button>
      )
    }
  ];

  return (
    <div>
      <h2>待发布新闻</h2>
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