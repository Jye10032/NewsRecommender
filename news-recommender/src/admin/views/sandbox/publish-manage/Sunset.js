import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, message } from 'antd';
import { ExclamationCircleFilled } from '@ant-design/icons';
import adminAxios from '../../../utils/Request';

const { confirm } = Modal;

export default function Sunset() {
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSunsetNews();
  }, []);

  // 获取已下线新闻列表
  const fetchSunsetNews = async () => {
    setLoading(true);
    try {
      const res = await adminAxios.get('/news', {
        params: { status: 3 } // 状态3表示已下线
      });

      if (res.data && res.data.items) {
        setNewsList(res.data.items);
      } else {
        setNewsList([]);
      }
    } catch (error) {
      console.error('获取已下线新闻失败:', error);
      message.error('获取已下线新闻失败');
    } finally {
      setLoading(false);
    }
  };

  // 重新发布新闻
  const handleRePublish = (id) => {
    confirm({
      title: '确定要重新发布该新闻吗?',
      icon: <ExclamationCircleFilled />,
      content: '重新发布后，新闻将再次显示在前台页面',
      onOk: async () => {
        try {
          await adminAxios.patch(`/news/${id}`, { status: 2 }); // 状态2表示已发布
          message.success('新闻重新发布成功');
          fetchSunsetNews(); // 刷新列表
        } catch (error) {
          console.error('重新发布新闻失败:', error);
          message.error('重新发布新闻失败');
        }
      }
    });
  };

  // 删除新闻
  const handleDelete = (id) => {
    confirm({
      title: '确定要删除该新闻吗?',
      icon: <ExclamationCircleFilled />,
      content: '删除后不可恢复',
      okType: 'danger',
      onOk: async () => {
        try {
          await adminAxios.delete(`/news/${id}`);
          message.success('新闻删除成功');
          fetchSunsetNews(); // 刷新列表
        } catch (error) {
          console.error('删除新闻失败:', error);
          message.error('删除新闻失败');
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
      title: '下线时间',
      dataIndex: 'updated_at', // 假设下线时间记录在updated_at字段
      render: (date) => new Date(date).toLocaleString()
    },
    {
      title: '操作',
      render: (_, record) => (
        <>
          <Button
            type="primary"
            style={{ marginRight: '8px' }}
            onClick={() => handleRePublish(record.news_id)}
          >
            重新发布
          </Button>
          <Button
            type="primary"
            danger
            onClick={() => handleDelete(record.news_id)}
          >
            删除
          </Button>
        </>
      )
    }
  ];

  return (
    <div>
      <h2>已下线新闻</h2>
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