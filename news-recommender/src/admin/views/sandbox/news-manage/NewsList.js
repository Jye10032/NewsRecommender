import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Space, Tag, message, Tooltip, Input } from 'antd';
import { DeleteOutlined, EditOutlined, EyeOutlined, UploadOutlined, CloudDownloadOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import adminAxios from '../../../utils/Request';
import { ExclamationCircleFilled } from '@ant-design/icons';

const { confirm } = Modal;
const { Search } = Input;

export default function NewsList() {
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [searchTitle, setSearchTitle] = useState('');
  const [categoryList, setCategoryList] = useState([]);

  // 获取管理员信息
  const adminTokenStr = localStorage.getItem('adminToken');
  const adminInfo = adminTokenStr ? JSON.parse(adminTokenStr) : {};

  // 状态标签映射
  const statusMap = {
    0: { color: 'default', text: '草稿' },
    1: { color: 'processing', text: '审核中' },
    2: { color: 'success', text: '已发布' },
    3: { color: 'warning', text: '已下线' },
    4: { color: 'error', text: '已删除' }
  };

  // 加载数据
  const fetchNews = async (page = 1, pageSize = 10, title = '') => {
    setLoading(true);
    try {
      const res = await adminAxios.get('/news', {
        params: {
          page,
          size: pageSize,
          title
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
      console.error('获取新闻列表失败:', error);
      message.error('获取新闻列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取分类列表
  const fetchCategories = async () => {
    try {
      const res = await adminAxios.get('/categories');
      if (res.data) {
        setCategoryList(res.data);
      }
    } catch (error) {
      console.error('获取分类列表失败:', error);
    }
  };

  useEffect(() => {
    fetchNews(pagination.current, pagination.pageSize, searchTitle);
    fetchCategories();
  }, []);

  // 处理表格分页、筛选、排序
  const handleTableChange = (pagination, filters, sorter) => {
    fetchNews(pagination.current, pagination.pageSize, searchTitle);
  };

  // 处理搜索
  const handleSearch = (value) => {
    setSearchTitle(value);
    fetchNews(1, pagination.pageSize, value);
  };

  // 处理删除
  const handleDelete = (id) => {
    confirm({
      title: '确定要删除这条新闻吗?',
      icon: <ExclamationCircleFilled />,
      content: '删除后可以在回收站中找到',
      okText: '确认',
      okType: 'danger',
      cancelText: '取消',
      async onOk() {
        try {
          await adminAxios.delete(`/news/${id}`);
          message.success('删除成功');
          fetchNews(pagination.current, pagination.pageSize, searchTitle);
        } catch (error) {
          console.error('删除新闻失败:', error);
          message.error('删除新闻失败: ' + (error.response?.data?.message || error.message));
        }
      }
    });
  };

  // 发布/下线新闻
  const handlePublishStatus = async (id, status) => {
    try {
      await adminAxios.patch(`/news/${id}`, { status });
      message.success(status === 2 ? '发布成功' : '下线成功');
      fetchNews(pagination.current, pagination.pageSize, searchTitle);
    } catch (error) {
      console.error('操作失败:', error);
      message.error('操作失败: ' + (error.response?.data?.message || error.message));
    }
  };

  // 表格列定义
  const columns = [
    {
      title: 'ID',
      dataIndex: 'news_id',
      key: 'news_id',
      width: 100,
      ellipsis: true
    },
    {
      title: '新闻标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text, record) => (
        <Link to={`/admin/news-manage/preview/${record.news_id}`}>{text}</Link>
      )
    },
    {
      title: '分类',
      dataIndex: 'category_name',
      key: 'category',
      width: 120,
      filters: categoryList.map(category => ({
        text: category.name,
        value: category.code
      })),
      onFilter: (value, record) => record.category === value
    },
    {
      title: '作者',
      dataIndex: 'author_name',
      key: 'author',
      width: 100
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={statusMap[status]?.color || 'default'}>
          {statusMap[status]?.text || '未知'}
        </Tag>
      ),
      filters: Object.entries(statusMap).map(([key, value]) => ({
        text: value.text,
        value: parseInt(key)
      })),
      onFilter: (value, record) => record.status === value
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 160,
      render: (date) => new Date(date).toLocaleString()
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="预览">
            <Button
              type="primary"
              shape="circle"
              icon={<EyeOutlined />}
              size="small"
              onClick={() => window.open(`/news/${record.news_id}`, '_blank')}
            />
          </Tooltip>

          {/* <Tooltip title="编辑">
            <Button
              type="default"
              shape="circle"
              icon={<EditOutlined />}
              size="small"
              onClick={() => window.location.href = `/admin/news-manage/update/${record.news_id}`}
            />
          </Tooltip> */}

          {record.status !== 2 && (
            <Tooltip title="发布">
              <Button
                type="default"
                shape="circle"
                icon={<UploadOutlined />}
                size="small"
                onClick={() => handlePublishStatus(record.news_id, 2)}
              />
            </Tooltip>
          )}

          {record.status === 2 && (
            <Tooltip title="下线">
              <Button
                type="default"
                shape="circle"
                icon={<CloudDownloadOutlined />}
                size="small"
                onClick={() => handlePublishStatus(record.news_id, 3)}
              />
            </Tooltip>
          )}

          <Tooltip title="删除">
            <Button
              type="danger"
              shape="circle"
              icon={<DeleteOutlined />}
              size="small"
              onClick={() => handleDelete(record.news_id)}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Search
          placeholder="搜索新闻标题"
          allowClear
          enterButton="搜索"
          size="large"
          style={{ width: 300 }}
          onSearch={handleSearch}
        />

        <Link to="/admin/news-manage/add">
          <Button type="primary" size="large">
            添加新闻
          </Button>
        </Link>
      </div>

      <Table
        rowKey="news_id"
        columns={columns}
        dataSource={newsList}
        pagination={pagination}
        loading={loading}
        onChange={handleTableChange}
        bordered
      />
    </div>
  );
}