//新闻推荐系统首页


import React, { useState, useEffect } from 'react';
import { Breadcrumb, Layout, Menu, theme, Radio, Space } from 'antd';
import { CalendarOutlined, FireOutlined } from '@ant-design/icons'; // 添加缺少的图标导入
import NewsList from './NewsList.tsx';
import { AutoComplete, Input } from 'antd';
import type { AutoCompleteProps } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import TrendingNewsPage from './Trending.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';
import UserAuth from './UserAuth.tsx';
import './BreadcrumbStyles.css';
import { HomeOutlined } from '@ant-design/icons';


import CategoryNews from './CategoryNews.tsx'; // 导入分类新闻组件
// import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const { Header, Content, Footer } = Layout;
const { Search } = Input;

const getRandomInt = (max: number, min = 0) => Math.floor(Math.random() * (max - min + 1)) + min;

// const items = Array.from({ length: 3 }).map((_, index) => ({

//     // key: String(index + 1),
//     // label: `nav ${index + 1}`,
// }));

// 在文件顶部添加接口定义
interface CategoryResponse {
    success: boolean;
    data: {
        [category: string]: string[];
    };
}

// 定义要放在前面的特定分类
const priorityCategories = [
    'politics',
    'society',
    'diplomacy',
    'military',
    'science',
    'odd',
    'graphic',
    "Stories-of-China's-high-quality-development"
];

// 在items数组中添加热门新闻链接
const items = [
    {
        key: '/',
        label: <Link to="/ " className=" category-menu-item">Home</Link>,
    },
    // 添加优先显示的分类
    ...priorityCategories.map(category => ({
        key: `/category/${category}`,
        label: <Link to={`/category/${category}`} className="category-menu-item">{
            category === ""
                ? ""
                : category.charAt(0).toUpperCase() + category.slice(1)
        }</Link>
    })),
    {
        key: '/trending',
        label: <Link to="/trending" className="category-menu-item">Top News</Link>,
    }
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
    const [menuItems, setMenuItems] = useState(items);
    const { user } = useAuth();

    const sortOrder = 'latest';

    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();

    const [options, setOptions] = useState<AutoCompleteProps['options']>([]);
    // 在useEffect中使用类型化的axios请求
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await axios.get<CategoryResponse>('/api/categories');
                if (response.data.success) {
                    const categories = response.data.data;

                    // 转换分类数据为菜单项格式，但排除已经在前面显示的分类
                    const categoryItems = Object.entries(categories)
                        .filter(([category]) => !priorityCategories.includes(category)) // 排除优先分类
                        .map(([category, subcategories]) => {
                            // 如果有子分类，创建子菜单
                            if (subcategories.length > 0) {
                                return {
                                    key: `/category/${category}`,
                                    label: <Link to={`/category/${category}`} className="category-menu-item">{category}</Link>,
                                    children: subcategories.map((subcategory) => ({
                                        key: `/category/${category}/${subcategory}`,
                                        label: <Link to={`/category/${category}/${subcategory}`} className="category-menu-item">{subcategory}</Link>
                                    }))
                                };
                            }

                            // 没有子分类，直接创建菜单项
                            return {
                                key: `/category/${category}`,
                                label: <Link to={`/category/${category}`}>{category}</Link>
                            };
                        });

                    // 合并静态菜单项和过滤后的分类菜单项
                    setMenuItems([...items, ...categoryItems]);
                }
            } catch (error) {
                console.error('获取分类失败:', error);
            }
        };

        fetchCategories();
    }, []);
    // 获取分类数据并设置菜单项
    // useEffect(() => {
    //     const fetchCategories = async () => {
    //         try {
    //             const response = await axios.get('/api/categories');
    //             if (response.data.success) {
    //                 const categories = response.data.data;

    //                 // 转换分类数据为菜单项格式
    //                 const categoryItems = Object.entries(categories).map(([category, subcategories]) => {
    //                     // 如果有子分类，创建子菜单
    //                     if (subcategories.length > 0) {
    //                         return {
    //                             key: `/category/${category}`,
    //                             label: category,
    //                             children: subcategories.map((subcategory) => ({
    //                                 key: `/category/${category}/${subcategory}`,
    //                                 label: <Link to={`/category/${category}/${subcategory}`}>{subcategory}</Link>
    //                             }))
    //                         };
    //                     }

    //                     // 没有子分类，直接创建菜单项
    //                     return {
    //                         key: `/category/${category}`,
    //                         label: <Link to={`/category/${category}`}>{category}</Link>
    //                     };
    //                 });

    //                 // 合并静态菜单项和分类菜单项
    //                 setMenuItems([...items, ...categoryItems]);
    //             }
    //         } catch (error) {
    //             console.error('获取分类失败:', error);
    //         }
    //     };

    //     fetchCategories();
    // }, []);
    // 根据路径更新选中的菜单项
    useEffect(() => {
        // if (location.pathname === '/') {
        //     setSelectedKeys(['/']);
        // } else if (location.pathname === '/trending') {
        //     setSelectedKeys(['/trending']);
        // } else {
        //     setSelectedKeys(['']);
        // }
        //  默认选中首页
        let activeKey = '/';

        //  查找匹配的导航项
        const matchedItem = menuItems.find(item =>
            location.pathname === item.key ||
            (item.key !== '/' && location.pathname.startsWith(item.key))
        );

        if (matchedItem) {
            activeKey = matchedItem.key;
        }

        setSelectedKeys([activeKey]);
    }, [location.pathname, menuItems]);

    const handleSearch = (value: string) => {
        setOptions(value ? searchResult(value) : []);
    };

    const onSelect = (value: string) => {
        console.log('onSelect', value);
    };

    // // 根据当前路径渲染不同内容的函数
    // const renderContent = () => {
    //     if (location.pathname === '/trending') {
    //         return <TrendingNewsPage />;
    //     }
    //     return <NewsList />;
    // };

    // 修改renderContent函数，传递排序参数
    const renderContent = () => {
        if (location.pathname === '/trending') {
            return <TrendingNewsPage />;
        } else if (location.pathname.startsWith('/category/')) {
            const pathParts = location.pathname.split('/');
            const category = pathParts[2];
            const subcategory = pathParts.length > 3 ? pathParts[3] : undefined;

            return <CategoryNews category={category} subcategory={subcategory} sortOrder={sortOrder} />;
        }
        return <NewsList sortOrder={sortOrder} />;
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
                    backgroundColor: '#fff', // 改为白色背景
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)' // 添加阴影提升层次感
                }}
            >
                <div className="demo-logo" />
                {/* <Menu
                    theme="dark"
                    mode="horizontal"
                    selectedKeys={selectedKeys} // 使用动态selectedKeys替代defaultSelectedKeys
                    //defaultSelectedKeys={['2']}
                    items={items}
                    style={{ flex: 1, minWidth: 0 }}
                /> */}
                <Menu
                    theme="light"
                    mode="horizontal"
                    selectedKeys={selectedKeys}
                    items={menuItems} // 使用menuItems替代items
                    style={{
                        flex: 1,
                        minWidth: 0,
                        fontSize: '16px',  // 增大字体
                        fontWeight: '500'  // 增加字重使其更清晰
                    }}
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
                <Breadcrumb className="news-breadcrumb">
                    <Breadcrumb.Item>
                        <Link to="/"><HomeOutlined /> Home</Link>
                    </Breadcrumb.Item>

                    {location.pathname === '/trending' ? (
                        <Breadcrumb.Item>Top News</Breadcrumb.Item>
                    ) : location.pathname.startsWith('/category/') ? (
                        <>
                            <Breadcrumb.Item>
                                <Link to="/categories">Category</Link>
                            </Breadcrumb.Item>

                            <Breadcrumb.Item>
                                <Link to={`/category/${location.pathname.split('/')[2]}`}>
                                    {location.pathname.split('/')[2]}
                                </Link>
                            </Breadcrumb.Item>

                            {location.pathname.split('/').length > 3 && (
                                <Breadcrumb.Item>
                                    {location.pathname.split('/')[3]}
                                </Breadcrumb.Item>
                            )}
                        </>
                    ) : (
                        <Breadcrumb.Item>News</Breadcrumb.Item>
                    )}
                </Breadcrumb>


                {location.pathname.startsWith('/category/') && (
                    <div style={{ margin: '0 0 16px 0' }}>
                        <h1 style={{
                            fontSize: '28px',
                            fontWeight: 'bold',
                            margin: 0,
                            color: '#262626'
                        }}>
                            {location.pathname.split('/')[2]}
                            {location.pathname.split('/').length > 3 &&
                                ` - ${location.pathname.split('/')[3]}`}
                        </h1>
                        <p style={{
                            fontSize: '16px',
                            color: '#8c8c8c',
                            margin: '8px 0 0 0'
                        }}>
                            {/* 最新{location.pathname.split('/').length > 3 ?
                                location.pathname.split('/')[3] :
                                location.pathname.split('/')[2]}相关新闻 */}
                        </p>
                    </div>
                )}

                <div
                    style={{
                        padding: 24,
                        minHeight: 380,
                        background: colorBgContainer,
                        borderRadius: borderRadiusLG,
                    }}
                >
                    {renderContent()}
                    {/* <NewsList /> */}
                    {/* Content */}
                </div>
            </Content>
            <Footer style={{ textAlign: 'center' }}>
                Ant Design ©{new Date().getFullYear()} Created by Ant UED
            </Footer>
        </Layout>
    );
};

export default HomePage;