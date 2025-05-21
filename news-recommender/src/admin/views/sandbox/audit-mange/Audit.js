import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Table, Button, notification, message } from 'antd'

export default function Audit() {
  const [newsList, setNewsList] = useState([])
  const { roleId, username, region } = JSON.parse(localStorage.getItem('token'))
  useEffect(() => {
    axios.get(`/news?auditState=1&_expand=category`).then((res) => {
      if (roleId === 1) {
        return setNewsList(res.data)
      } else if (roleId === 2) {
        const list = res.data.filter((item) => {
          if ((item.roleId === 3 && item.region === region) || item.author === username) {
            return item
          }
          return null
        })
        return setNewsList(list)
      }
    })
  }, [roleId, username, region])
  // 请求新闻数据
  function getNewsList() {
    axios.get(`/news?auditState=1&_expand=category`).then((res) => {
      if (roleId === 1) {
        return setNewsList(res.data)
      } else if (roleId === 2) {
        const list = res.data.filter((item) => {
          if ((item.roleId === 3 && item.region === region) || item.author === username) {
            return item
          }
          return null
        })
        return setNewsList(list)
      }
    })
  }
  // 审核操作
  function handleAudit(item, auditState, publishState) {
    axios
      .patch(`/news/${item.id}`, {
        auditState,
        publishState
      })
      .then(
        (res) => {
          notification.info({
            message: `通知`,
            description: `您可以到[审核管理/审核列表]中查看您的新闻的审核状态`,
            placement: 'bottomRight'
          })
          getNewsList()
        },
        (err) => {
          console.log(err)
          message.error('出错了，请再次进行操作')
        }
      )
  }
  // table表格要渲染的数据
  const columns = [
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
      render: (_, item) => {
        return item.category.title
      }
    },
    {
      title: '操作',
      dataIndex: 'auditState',
      render: (_, item) => {
        return (
          <div>
            <Button
              type="primary"
              style={{ marginRight: '15px' }}
              onClick={() => {
                handleAudit(item, 2, 1)
              }}
            >
              通过
            </Button>
            <Button
              danger
              onClick={() => {
                handleAudit(item, 3, 0)
              }}
            >
              驳回
            </Button>
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
