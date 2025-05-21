import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '@ant-design/pro-layout'
import { Descriptions, message } from 'antd'
import { HeartTwoTone } from '@ant-design/icons'
import axios from 'axios'
import moment from 'moment'

export default function Detail(props) {
  const [newsInfo, setNewsInfo] = useState(null);
  const navigate = useNavigate();
  const params = useParams();
  useEffect(() => {
    axios
      .get(`/news/${params.id}?_expand=category&_expand=role`)
      .then((res) => {
        setNewsInfo({ ...res.data, view: res.data.view + 1 })
        return res.data
      })
      .then((res) =>
        axios.patch(`/news/${params.id}`, {
          view: res.view + 1
        })
      )
  }, [params.id])
  function handleStar() {
    const list = JSON.parse(localStorage.getItem('isStar'))
    if (list.includes(params.id)) {
      message.info('您已经为该新闻点过赞')
    } else {
      setNewsInfo({
        ...newsInfo,
        star: newsInfo.star + 1
      })
      message.success('成功点赞')
      axios.patch(`/news/${params.id}`, {
        star: newsInfo.star + 1
      })
      if (list) {
        localStorage.setItem('isStar', JSON.stringify([...list, params.id]))
      } else {
        localStorage.setItem('isStar', JSON.stringify([params.id]))
      }
    }
  }
  return (
    <div>
      {newsInfo && (
        <div style={{ padding: '15px 30px' }}>
          <PageHeader
            onBack={() => navigate(-1)}
            title={newsInfo.title}
            subTitle={
              <div>
                <span style={{ marginRight: '5px' }}>{newsInfo.category.title}</span>
                <HeartTwoTone
                  twoToneColor="#eb2f96"
                  onClick={handleStar}
                />
              </div>
            }
          >
            <Descriptions
              size="small"
              column={3}
            >
              <Descriptions.Item label="创建者">{newsInfo.author}</Descriptions.Item>
              <Descriptions.Item label="发布时间">
                {newsInfo.publishTime ? moment(newsInfo.publishTime).format('YYYY-MM-DD HH:mm:ss') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="区域">{newsInfo.region}</Descriptions.Item>
              <Descriptions.Item label="访问数量">
                <span style={{ color: 'green' }}>{newsInfo.view}</span>
              </Descriptions.Item>
              <Descriptions.Item label="点赞数量">
                <span style={{ color: 'green' }}>{newsInfo.star}</span>
              </Descriptions.Item>
              <Descriptions.Item label="评论数量">
                <span style={{ color: 'green' }}>0</span>
              </Descriptions.Item>
            </Descriptions>
          </PageHeader>
          <div
            dangerouslySetInnerHTML={{ __html: newsInfo.content }}
            style={{
              padding: '0 20px',
              border: '1px solid #ddd'
            }}
          ></div>
        </div>
      )}
    </div>
  )
}
