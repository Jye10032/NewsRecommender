import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Table, Button, notification, Modal, message } from 'antd'
import axios from 'axios'
import { EditOutlined, DeleteOutlined, VerticalAlignTopOutlined, ExclamationCircleFilled } from '@ant-design/icons'
const { confirm } = Modal

export default function NewsDraft(props) {
  const [newsList, setNewsList] = useState([])
  const [categoryList, setCategoryList] = useState([])
  const { username } = JSON.parse(localStorage.getItem('token'))
  useEffect(() => {
    axios.get(`/news?author=${username}&auditState=0&_expand=category`).then((res) => {
      setNewsList(res.data)
    })
    axios.get('/categories').then((res) => setCategoryList(res.data))
  }, [username])
  // 将新闻提交审核
  function handleCheck(id) {
    axios
      .patch(`news/${id}`, {
        auditState: 1
      })
      .then((res) => {
        props.history.push('/audit-manage/list')
        notification.info({
          message: '通知',
          description: '您可以到审核列表中查看该新闻',
          placement: 'bottomRight'
        })
      })
  }
  // 删除前的确认框
  function confirmMethod(news) {
    confirm({
      title: '警告',
      icon: <ExclamationCircleFilled />,
      content: '是否删除该新闻?',
      okText: '确认',
      cancelText: '取消',
      onOk() {
        deleteNews(news)
      },
      onCancel() {}
    })
  }
  // 将新闻删除
  function deleteNews(news) {
    let list = newsList.filter((item) => {
      return news.id !== item.id
    })
    axios.delete(`/news/${news.id}`).then(
      (res) => {
        setNewsList([...list])
        message.success('删除成功')
      },
      (err) => {
        message.error('删除失败')
      }
    )
  }
  // table表格要渲染的数据
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id'
    },
    {
      title: '新闻标题',
      dataIndex: 'title',
      render: (title, item) => {
        return <Link to={{ pathname: `/news-manage/preview/${item.id}` }}>{title}</Link>
      }
    },
    {
      title: '作者',
      dataIndex: 'author'
    },
    {
      title: '新闻分类',
      dataIndex: 'categoryId',
      render: (id) => {
        return categoryList.map((item) => {
          if (item.id === id) {
            return item.title
          }
          return null
        })
      }
    },
    {
      title: '操作',
      dataIndex: 'id',
      render: (_, item) => {
        return (
          <div>
            <Button
              danger
              shape="circle"
              icon={<DeleteOutlined />}
              style={{
                marginRight: '10px'
              }}
              onClick={() => confirmMethod(item)}
            />
            <Link to={{ pathname: `/news-manage/update/${item.id}` }}>
              <Button
                shape="circle"
                icon={<EditOutlined />}
                style={{
                  marginRight: '10px'
                }}
              />
            </Link>
            <Button
              type="primary"
              shape="circle"
              icon={<VerticalAlignTopOutlined />}
              onClick={() => handleCheck(item.id)}
            />
          </div>
        )
      }
    }
  ]
  return (
    <div>
      <Table
        dataSource={newsList}
        columns={columns}
        rowKey={(item) => {
          return item.id
        }}
        pagination={{
          pageSize: 5
        }}
      />
    </div>
  )
}
