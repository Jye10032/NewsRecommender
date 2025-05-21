// import React from 'react'
// import SideMenu from '../../components/sandbox/SideMenu'
// import TopHeader from '../../components/sandbox/TopHead'
// import './NewsSandBox.css'

// import Home from './home/Home'
// import UserList from './user-manage/UserList'
// import RoleList from './right-manage/RoleList'
// import RightList from './right-manage/RightList'
// import Nopermission from './nopermission/Nopermission'

// import { BrowserRouter, Routes, Route, Navigate, redirect } from 'react-router-dom'
// import { Layout } from 'antd'
// import { Content } from 'antd/es/layout/layout'

// export default function NewsSandBox() {
//     return (
//         <Layout>
//             <SideMenu></SideMenu>
//             <Layout className="site-layout">
//                 <TopHeader></TopHeader>
//                 <Content>

//                     <Routes>
//                         <Route path="/home" element={<Home />}></Route>
//                         <Route path="/user-manage/list" element={<UserList />}></Route>
//                         <Route path="/right-manage/role/list" element={<RoleList />}></Route>
//                         <Route path="/right-manage/right/list" element={<RightList />}></Route>

//                         <Route path="/" element={<Home />}></Route>
//                         <Route path="*" element={<Nopermission />} />
//                     </Routes>

//                 </Content>
//             </Layout>
//         </Layout>
//     )
// }

import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import SideMenu from '../../components/sandbox/SideMenu'
import TopHead from '../../components/sandbox/TopHead'
import NewsRouter from '../../components/sandbox/NewsRouter'
import './NewsSandBox.css'
import React, { useEffect, useState } from 'react'
import { Layout, ConfigProvider, theme } from 'antd'
import Home from './home/Home'
const { Content } = Layout

export default function NewsSandBox() {
    // 使用state管理是否折叠侧边栏
    const [collapsed, setCollapsed] = useState(false);

    // 定义自定义主题
    const customTheme = {
        token: {
            // 设置主色调
            colorPrimary: '#1890ff', // 蓝色，你可以使用任何颜色代码
            colorLink: '#1890ff',

            // 背景色
            colorBgContainer: '#ffffff',
            colorBgLayout: '#f0f2f5',

            // 文字颜色
            colorText: 'rgba(0, 0, 0, 0.85)',
            colorTextSecondary: 'rgba(0, 0, 0, 0.45)',

            // 边框颜色
            colorBorder: '#d9d9d9',

            // 其他你想自定义的颜色
            borderRadius: 4,
            fontSize: 14,
        },
        // 对于特定组件的定制
        components: {
            Layout: {
                siderBg: '#ffffff', // 侧边栏背景
                headerBg: '#ffffff', // 顶部栏背景
            },
            Menu: {
                itemSelectedBg: '#e6f7ff', // 菜单选中背景
                itemHoverBg: '#f5f5f5',    // 菜单悬停背景
            },
            Button: {
                // 按钮相关样式
            },
            Card: {
                // 卡片相关样式
            }
        }
    };

    // 进度条
    NProgress.start();
    useEffect(() => {
        NProgress.done();
    });

    return (
        <ConfigProvider theme={customTheme}>
            <Layout style={{ minHeight: '100vh' }}>
                <SideMenu collapsed={collapsed}></SideMenu>
                <Layout className="site-layout">
                    <TopHead collapsed={collapsed} setCollapsed={setCollapsed}></TopHead>
                    <Content
                        style={{
                            margin: '24px 16px',
                            padding: 24,
                            minHeight: 280,
                            background: 'white',
                            overflow: 'auto'
                        }}
                    >
                        <Home></Home>
                        <NewsRouter></NewsRouter>
                    </Content>
                </Layout>
            </Layout>
        </ConfigProvider>
    );
}