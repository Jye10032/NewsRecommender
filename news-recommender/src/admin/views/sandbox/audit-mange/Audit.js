// filepath: c:\Users\Ming Gy\Desktop\graduate\NewsRecommender\news-recommender\src\admin\views\sandbox\audit-mange\Audit.js
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Table, Button, notification, message } from 'antd'
import adminAxios from '../../../utils/Request'

export default function Audit() {
  const [newsList, setNewsList] = useState([])
  const adminTokenStr = localStorage.getItem('adminToken');
  const { role, username, category_id } = adminTokenStr ? JSON.parse(adminTokenStr) : {};
  const roleId = role?.id || 1;

  useEffect(() => {
    getNewsList();
  }, [roleId, username, category_id])

  // 请求新闻数据
  function getNewsList() {
    adminAxios.get(`/news?auditState=1&_expand=category`).then((res) => {
      if (roleId === 1) {
        // 超级管理员可以看到所有新闻
        return setNewsList(res.data)
      } else if (roleId === 2) {
        // 分类管理员只能看到自己分类下的编辑和自己的新闻
        const list = res.data.filter((item) => {
          if ((item.roleId === 3 && item.category_id === category_id) || item.author === username) {
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
    adminAxios
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
      dataIndex: 'category_id',
      render: (_, item) => {
        return item.category.name
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