import React, { useState, useEffect } from 'react';
import { PageHeader } from '@ant-design/pro-layout';
import { Form, Input, Button, Select, message, Spin } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import adminAxios from '../../../utils/Request';
// import ReactQuill from 'react-quill';
// import 'react-quill/dist/quill.snow.css';

const { Option } = Select;

export default function NewsEdit() {
  const [form] = Form.useForm();
  const [categoryList, setCategoryList] = useState([]);
  const [subcategoryList, setSubcategoryList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newsData, setNewsData] = useState(null);

  const { id } = useParams();
  const navigate = useNavigate();
  const isUpdate = !!id;

  // 获取分类列表
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await adminAxios.get('/categories');
        if (res.data) {
          // 过滤出主分类
          const mainCategories = res.data.filter(cat => cat.level === 1);
          setCategoryList(mainCategories);
        }
      } catch (error) {
        console.error('获取分类列表失败:', error);
        message.error('获取分类列表失败');
      }
    };

    fetchCategories();
  }, []);

  // 如果是编辑模式，获取新闻数据
  useEffect(() => {
    if (isUpdate) {
      const fetchNewsDetail = async () => {
        setLoading(true);
        try {
          const res = await adminAxios.get(`/news/${id}`);
          if (res.data) {
            setNewsData(res.data);

            // 加载子分类
            if (res.data.category) {
              handleCategoryChange(res.data.category);
            }

            // 设置表单初始值
            form.setFieldsValue({
              title: res.data.title,
              category: res.data.category,
              subcategory: res.data.subcategory,
              abstract: res.data.abstract,
              url: res.data.url
            });
          }
        } catch (error) {
          console.error('获取新闻详情失败:', error);
          message.error('获取新闻详情失败');
        } finally {
          setLoading(false);
        }
      };

      fetchNewsDetail();
    }
  }, [id, isUpdate, form]);

  // 处理分类变化，加载对应的子分类
  const handleCategoryChange = async (categoryCode) => {
    if (!categoryCode) {
      setSubcategoryList([]);
      return;
    }

    try {
      // 获取所选分类的子分类
      const res = await adminAxios.get(`/categories/children/${categoryCode}`);
      if (res.data) {
        setSubcategoryList(res.data);
      }
    } catch (error) {
      console.error('获取子分类失败:', error);
      setSubcategoryList([]);
    }
  };

  // 提交表单
  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      if (isUpdate) {
        // 更新新闻
        await adminAxios.patch(`/news/${id}`, values);
        message.success('新闻更新成功');
      } else {
        // 创建新闻
        await adminAxios.post('/news', values);
        message.success('新闻创建成功');
      }
      // 返回列表页
      navigate('/admin/news-manage/list');
    } catch (error) {
      console.error('操作失败:', error);
      message.error('操作失败: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // 保存为草稿
  const saveAsDraft = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      if (isUpdate) {
        await adminAxios.patch(`/news/${id}`, {
          ...values,
          status: 0 // 草稿状态
        });
        message.success('草稿保存成功');
      } else {
        await adminAxios.post('/news', {
          ...values,
          status: 0 // 草稿状态
        });
        message.success('草稿创建成功');
      }
      navigate('/admin/news-manage/draft');
    } catch (error) {
      console.error('保存草稿失败:', error);
      message.error('保存草稿失败: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // 提交审核
  const submitForReview = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      if (isUpdate) {
        await adminAxios.patch(`/news/${id}`, {
          ...values,
          status: 1 // 审核中状态
        });
        message.success('提交审核成功');
      } else {
        await adminAxios.post('/news', {
          ...values,
          status: 1 // 审核中状态
        });
        message.success('提交审核成功');
      }
      navigate('/admin/audit-manage/list');
    } catch (error) {
      console.error('提交审核失败:', error);
      message.error('提交审核失败: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        className="site-page-header"
        title={isUpdate ? "编辑新闻" : "添加新闻"}
        onBack={() => navigate(-1)}
      />

      <Spin spinning={loading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          style={{ maxWidth: 800, margin: '0 auto' }}
        >
          <Form.Item
            name="title"
            label="新闻标题"
            rules={[{ required: true, message: '请输入新闻标题' }]}
          >
            <Input placeholder="请输入新闻标题" />
          </Form.Item>

          <Form.Item
            name="category"
            label="分类"
            rules={[{ required: true, message: '请选择分类' }]}
          >
            <Select
              placeholder="请选择分类"
              onChange={handleCategoryChange}
            >
              {categoryList.map(category => (
                <Option key={category.code} value={category.code}>
                  {category.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="subcategory"
            label="子分类"
          >
            <Select
              placeholder="请选择子分类"
              allowClear
              disabled={subcategoryList.length === 0}
            >
              {subcategoryList.map(category => (
                <Option key={category.code} value={category.code}>
                  {category.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="abstract"
            label="新闻摘要"
            rules={[{ required: true, message: '请输入新闻摘要' }]}
          >
            {/* <ReactQuill
              theme="snow"
              style={{ height: 200, marginBottom: 50 }}
            /> */}
          </Form.Item>

          <Form.Item
            name="url"
            label="新闻URL"
          >
            <Input placeholder="请输入新闻URL(可选)" />
          </Form.Item>

          <Form.Item>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button onClick={() => navigate(-1)}>
                取消
              </Button>

              <div>
                <Button onClick={saveAsDraft} style={{ marginRight: 8 }}>
                  保存草稿
                </Button>

                <Button onClick={submitForReview} style={{ marginRight: 8 }} type="primary">
                  提交审核
                </Button>

                {newsData?.status === 2 && (
                  <Button onClick={() => handleSubmit(form.getFieldsValue())} type="primary">
                    更新已发布
                  </Button>
                )}
              </div>
            </div>
          </Form.Item>
        </Form>
      </Spin>
    </div>
  );
}