import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, message, App } from 'antd';
import { ExclamationCircleFilled } from '@ant-design/icons';
import adminAxios from '../../../utils/Request';

const { confirm } = Modal;

export default function Sunset() {
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const { modal, message } = App.useApp();

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

  // 重新发布新闻 - 修改API端点
  const handleReactivate = (id) => {
    modal.confirm({
      title: '确定要重新发布该新闻吗?',
      icon: <ExclamationCircleFilled />,
      content: '重新发布后，新闻将再次显示在前台页面',
      onOk: async () => {
        try {
          // 添加详细日志
          console.log(`尝试重新发布新闻ID: ${id}`);

          // 使用正确的API端点和请求格式
          const res = await adminAxios.patch(`/news/${id}/status`, {
            status: 2  // 状态2表示已发布
          });

          // 添加更详细的响应处理
          if (res.data && res.data.success) {
            message.success('新闻重新发布成功');
            fetchSunsetNews(); // 刷新列表
          } else {
            message.error(res.data?.message || '重新发布失败');
          }
        } catch (error) {
          // 更详细的错误记录
          console.error('重新发布新闻失败:', error);
          console.error('错误详情:', error.response?.data || error.message);
          message.error(`重新发布新闻失败: ${error.response?.data?.message || error.message}`);
        }
      }
    });
  };



  // 删除新闻
  const handleDelete = (id) => {
    modal.confirm({
      title: '确定要删除该新闻吗?',
      icon: <ExclamationCircleFilled />,
      content: '删除后不可恢复',
      okType: 'danger',
      onOk: async () => {
        try {
          const res = await adminAxios.delete(`/news/${id}`);
          if (res.data && res.data.success) {
            message.success('新闻删除成功');
            fetchSunsetNews();
          } else {
            message.error(res.data?.message || '删除失败');
          }
        } catch (error) {
          console.error('删除新闻失败:', error);
          console.error('错误详情:', error.response?.data || error.message);
          message.error(`删除新闻失败: ${error.response?.data?.message || error.message}`);
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
      title: '下线时间',
      dataIndex: 'updated_at',
      render: (date) => new Date(date).toLocaleString()
    },
    {
      title: '操作',
      render: (_, record) => (
        <>
          <Button
            type="primary"
            style={{ marginRight: '8px' }}
            onClick={() => handleReactivate(record.news_id)}
          >
            重新发布
          </Button>
          <Button
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