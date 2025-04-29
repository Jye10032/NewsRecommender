//新闻推荐系统首页


import React, { useState, useEffect } from 'react';
import { Breadcrumb, Layout, Menu, theme } from 'antd';
import NewsList from './NewsList.tsx';
import { AutoComplete, Input } from 'antd';
import type { AutoCompleteProps } from 'antd';
import { Link, useLocation } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext.tsx';
import UserAuth from './UserAuth.tsx';

const { Header, Content, Footer } = Layout;
const { Search } = Input;

const getRandomInt = (max: number, min = 0) => Math.floor(Math.random() * (max - min + 1)) + min;

// const items = Array.from({ length: 3 }).map((_, index) => ({

//     // key: String(index + 1),
//     // label: `nav ${index + 1}`,
// }));

const items = [
    {
        key: '/',
        label: <Link to="/">Home</Link>,
    },
];

const searchResult = (query: string) =>
    Array.from({ length: getRandomInt(5) })
        .join('.')
        .split('.')
        .map((_, idx) => {
            const category = `${query}${idx}`;
            return {
                value: category,
                label: (
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                        }}
                    >
                        <span>
                            Found {query} on{' '}
                            <a
                                href={`https://s.taobao.com/search?q=${query}`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {category}
                            </a>
                        </span>
                        <span>{getRandomInt(200, 100)} results</span>
                    </div>
                ),
            };
        });


const HomePage: React.FC = () => {

    const location = useLocation(); // 获取当前路径
    const [selectedKeys, setSelectedKeys] = useState<string[]>(['']);
    const { user } = useAuth();

    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();

    const [options, setOptions] = useState<AutoCompleteProps['options']>([]);


    // 根据路径更新选中的菜单项
    useEffect(() => {
        // 默认选中首页
        let activeKey = '/';

        // 查找匹配的导航项
        const matchedItem = items.find(item =>
            location.pathname === item.key ||
            (item.key !== '/' && location.pathname.startsWith(item.key))
        );

        if (matchedItem) {
            activeKey = matchedItem.key;
        }

        setSelectedKeys([activeKey]);
    }, [location.pathname]);

    const handleSearch = (value: string) => {
        setOptions(value ? searchResult(value) : []);
    };

    const onSelect = (value: string) => {
        console.log('onSelect', value);
    };
    return (
        <Layout>
            <Header
                style={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 1,
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                }}
            >
                <div className="demo-logo" />
                <Menu
                    theme="dark"
                    mode="horizontal"
                    selectedKeys={selectedKeys} // 使用动态selectedKeys替代defaultSelectedKeys
                    //defaultSelectedKeys={['2']}
                    items={items}
                    style={{ flex: 1, minWidth: 0 }}
                />
                <AutoComplete
                    popupMatchSelectWidth={252}
                    style={{ width: 300 }}
                    options={options}
                    onSelect={onSelect}
                    onSearch={handleSearch}
                    size="large"
                >
                    <Input.Search size="large" placeholder="input here" enterButton />
                </AutoComplete>
                <UserAuth />
            </Header>
            <Content style={{ padding: '0 48px' }}>
                <Breadcrumb style={{ margin: '16px 0' }}>
                    <Breadcrumb.Item>Home</Breadcrumb.Item>
                    <Breadcrumb.Item>List</Breadcrumb.Item>
                    <Breadcrumb.Item>App</Breadcrumb.Item>
                </Breadcrumb>
                <div
                    style={{
                        padding: 24,
                        minHeight: 380,
                        background: colorBgContainer,
                        borderRadius: borderRadiusLG,
                    }}
                >
                    <NewsList />
                    Content
                </div>
            </Content>
            <Footer style={{ textAlign: 'center' }}>
                Ant Design ©{new Date().getFullYear()} Created by Ant UED
            </Footer>
        </Layout>
    );
};

export default HomePage;