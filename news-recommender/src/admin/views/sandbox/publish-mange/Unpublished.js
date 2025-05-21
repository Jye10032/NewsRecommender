import React from 'react'
import { Button } from 'antd'
import NewsPublish from '../../../components/publish-manage/NewsPublish'
import usePublish from '../../../components/publish-manage/usePublish'

export default function Unpublished() {
  const { newsList, confirmMethod } = usePublish(1)
  return (
    <div>
      <NewsPublish
        newsList={newsList}
        button={(id) => (
          <Button
            type="primary"
            onClick={() => confirmMethod(id, 1)}
          >
            发布
          </Button>
        )}
      ></NewsPublish>
    </div>
  )
}
