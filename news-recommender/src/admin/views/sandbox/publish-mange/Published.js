import React from 'react'
import { Button } from 'antd'
import NewsPublish from '../../../components/publish-manage/NewsPublish'
import usePublish from '../../../components/publish-manage/usePublish'

export default function Published() {
  const { newsList, confirmMethod } = usePublish(2)
  return (
    <div>
      <NewsPublish
        newsList={newsList}
        button={(id) => (
          <Button
            type="primary"
            onClick={() => confirmMethod(id, 2)}
          >
            下线
          </Button>
        )}
      ></NewsPublish>
    </div>
  )
}
