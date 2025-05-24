import style from './NewsAdd.module.scss'
import NewsEditor from '../../../components/news-mange/NewsEditor'
import React, { useState, useEffect, useRef, useParams } from 'react'
import { PageHeader } from '@ant-design/pro-layout'
import { Steps, Button, Form, Input, Select, message, notification } from 'antd'
import axios from 'axios'
const { Option } = Select

export default function NewsUpdate(props) {
  const [current, setCurrent] = useState(0)
  const [content, setContent] = useState('')
  const [formInfo, setFormInfo] = useState({})
  const [categoryList, setCategoryList] = useState([])
  const NewsForm = useRef();
  const params = useParams();
  const userInfo = JSON.parse(localStorage.getItem('token'))
  useEffect(() => {
    axios.get('/categories').then((res) => setCategoryList(res.data))
    axios.get(`/news/${params.id}?_expand=category&_expand=role`).then((res) => {
      setContent(res.data.content)
      const { title, categoryId } = res.data
      NewsForm.current.setFieldsValue({
        title,
        categoryId
      })
    })
  }, [params.id])
  function handlerNext() {
    if (current === 0) {
      NewsForm.current
        .validateFields()
        .then((value) => {
          setCurrent(current + 1)
          setFormInfo(value)
        })
        .catch((err) => console.log(err))
    } else {
      if (content === '' || content.trim() === '<p></p>') {
        message.error('新闻内容不能为空！')
      } else {
        setCurrent(current + 1)
      }
    }
  }
  function handleSave(auditState) {
    axios
      .post('/news', {
        ...formInfo,
        content,
        region: userInfo.region ? userInfo.region : '全球',
        author: userInfo.username,
        roleId: userInfo.roleId,
        auditState: auditState,
        publishState: 0,
        createTime: Date.now(),
        star: 0,
        view: 0
      })
      .then(
        (res) => {
          props.history.push(auditState === 0 ? '/news-manage/draft' : '/audit-manage/list')
          notification.info({
            message: '提示',
            description: `您可以到${auditState === 0 ? '草稿箱' : '审核列表'}中查看您的新闻`,
            placement: 'bottomRight'
          })
        },
        (err) => {
          message.error('出错了，请联系管理号')
        }
      )
  }
  return (
    <div>
      <PageHeader
        title="更新新闻"
        onBack={() => window.history.back()}
      />
      {/* 步骤条 */}
      <Steps
        style={{ marginBottom: '20px' }}
        current={current}
        items={[
          {
            title: '基本信息',
            description: '新闻标题，新闻分类'
          },
          {
            title: '新闻内容',
            description: '新闻主体内容'
          },
          {
            title: '新闻提交',
            description: '保存草稿或提交审核'
          }
        ]}
      />
      {/* 新闻基本信息表单区域 */}
      <Form
        ref={NewsForm}
        style={{ marginBottom: '20px' }}
        className={current === 0 ? '' : style.hidden}
      >
        <Form.Item
          label="新闻标题"
          name="title"
          rules={[{ required: true, message: '请填写新闻标题' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label="新闻分类"
          name="categoryId"
          rules={[{ required: true, message: '请选择新闻分类' }]}
        >
          <Select>
            {categoryList.map((item) => {
              return (
                <Option
                  key={item.id}
                  value={item.id}
                >
                  {item.title}
                </Option>
              )
            })}
          </Select>
        </Form.Item>
      </Form>
      {/* 新闻内容区域 */}
      <div
        style={{ marginBottom: '20px' }}
        className={current === 1 ? '' : style.hidden}
      >
        <NewsEditor
          getContent={(value) => setContent(value)}
          content={content}
        ></NewsEditor>
      </div>
      {/* 按钮区域 */}
      {current > 0 && (
        <Button
          style={{
            marginRight: '15px'
          }}
          type="primary"
          onClick={() => setCurrent(current - 1)}
        >
          上一步
        </Button>
      )}
      {current < 2 && (
        <Button
          style={{
            marginRight: '15px'
          }}
          type="primary"
          onClick={handlerNext}
        >
          下一步
        </Button>
      )}
      {current === 2 && (
        <span>
          <Button
            type="primary"
            style={{
              marginRight: '15px'
            }}
            onClick={() => handleSave(0)}
          >
            保存草稿
          </Button>
          <Button
            danger
            onClick={() => handleSave(1)}
          >
            提交审核
          </Button>
        </span>
      )}
    </div>
  )
}
