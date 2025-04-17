//新闻列表组件  


import React, { useState, useEffect } from 'react';
import { LikeOutlined, MessageOutlined, StarOutlined } from '@ant-design/icons';
import { Avatar, List, Space, message } from 'antd';
import { News } from '../types/news';
import axios from 'axios';

// const data = Array.from({ length: 23 }).map((_, i) => ({
//     href: 'https://ant.design',
//     title: `ant design part ${i}`,
//     avatar: `https://api.dicebear.com/7.x/miniavs/svg?seed=${i}`,
//     description:
//         'Ant Design, a design language for background applications, is refined by Ant UED Team.',
//     content:
//         'We supply a series of design principles, practical patterns and high quality design resources (Sketch and Axure), to help people create their product prototypes beautifully and efficiently.',
// }));

interface DisplayNews extends News {
    avatar?: string;
    actions?: React.ReactNode[];
    imageUrl?: string;
}


const IconText = ({ icon, text }: { icon: React.FC; text: string }) => (
    <Space>
        {React.createElement(icon)}
        {text}
    </Space>
);

const NewsList: React.FC = () => {

    const [displayNews, setDisplayNews] = useState<DisplayNews[]>([]);
    const [loading, setLoading] = useState(false);


    useEffect(() => {
        const fetchNews = async () => {
            try {
                setLoading(true);
                const response = await axios.get('http://localhost:3001/api/news');
                // 将获取的新闻数据与固定展示数据合并
                const newsWithDisplay = response.data.data.map((item: News, index: number) => ({
                    ...item,
                    avatar: `https://api.dicebear.com/7.x/miniavs/svg?seed=${index}`,
                    imageUrl: "https://gw.alipayobjects.com/zos/rmsportal/mqaQswcyDLcXyDKnZfES.png"
                }));
                setDisplayNews(newsWithDisplay);
            } catch (error) {
                message.error('获取新闻列表失败');
                console.error('Error fetching news:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchNews();
    }, []);

    return (

        <List
            itemLayout="vertical"
            size="large"
            pagination={{
                onChange: (page) => {
                    console.log(page);
                },
                pageSize: 3,
                align: 'center',
            }}
            dataSource={displayNews}
            footer={
                <div>
                    <b>ant design</b> footer part
                </div>
            }
            renderItem={(item) => (
                <List.Item
                    key={item.title}
                    actions={[
                        <IconText icon={StarOutlined} text="156" key="list-vertical-star-o" />,
                        <IconText icon={LikeOutlined} text="156" key="list-vertical-like-o" />,
                        <IconText icon={MessageOutlined} text="2" key="list-vertical-message" />,
                    ]}
                    extra={
                        <img
                            width={272}
                            alt="logo"
                            src={item.imageUrl}
                        // src="https://gw.alipayobjects.com/zos/rmsportal/mqaQswcyDLcXyDKnZfES.png"
                        />
                    }
                >
                    <List.Item.Meta
                        avatar={<Avatar src={item.avatar} />}
                        title={<a href={item.url}>{item.title}</a>}
                        description={item.abstract}
                    />
                </List.Item>
            )}
        />
    );
};

export default NewsList;