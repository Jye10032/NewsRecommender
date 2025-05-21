import React, { useEffect, useState } from 'react'
import { PageHeader } from '@ant-design/pro-layout'
import { Card, Col, Row, List } from 'antd'
import { Link } from 'react-router-dom'
import axios from 'axios'
import _ from 'lodash'

export default function News() {
  const [newsList, setNewsList] = useState([])
  useEffect(() => {
    axios.get('/news?publishState=2&_expand=category').then((res) => {
      setNewsList(Object.entries(_.groupBy(res.data, (item) => item.category.title)))
    })
  }, [])
  return (
    <div style={{ padding: '15px 30px' }}>
      <PageHeader
        className="site-page-header"
        title="全球大新闻"
        subTitle="查看新闻"
      >
        <Row gutter={[16, 16]}>
          {newsList.map((item) => {
            return (
              <Col
                span={8}
                key={item[0]}
              >
                <Card
                  title={item[0]}
                  bordered={true}
                  hoverable={true}
                >
                  <List
                    size="small"
                    dataSource={item[1]}
                    pagination={{ pageSize: 3 }}
                    renderItem={(news) => (
                      <List.Item>
                        <Link to={{ pathname: `/detail/${news.id}` }}>{news.title}</Link>
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>
            )
          })}
        </Row>
      </PageHeader>
    </div>
  )
}
