import Home from '../../views/sandbox/home/Home'
import RightList from '../../views/sandbox/right-manage/RightList'
import RoleList from '../../views/sandbox/right-manage/RoleList'
import UserList from '../../views/sandbox/user-manage/UserList'
import Nopermission from '../../views/sandbox/nopermission/Nopermission'
// import Audit from '../../views/sandbox/audit-mange/Audit'
// import AuditList from '../../views/sandbox/audit-mange/AuditList'
// import NewAdd from '../../views/sandbox//news-mange/NewsAdd'
// import NewsCategory from '../../views/sandbox/news-mange/NewsCategory'
// import NewsDraft from '../../views/sandbox/news-mange/NewsDraft'
// import NewsPreivew from '../../views/sandbox/news-mange/NewsPreivew'
// import NewsUpdate from '../../views/sandbox/news-mange/NewsUpdate'
// import Published from '../../views/sandbox/publish-mange/Published'
// import Unpublished from '../../views/sandbox/publish-mange/Unpublished'
// import Sunset from '../../views/sandbox/publish-mange/Sunset'
import React, { useEffect, useState } from 'react'
import { Route, Routes, Navigate } from 'react-router-dom'
import { Spin } from 'antd'
import axios from 'axios'
import { Layout } from 'antd';
import SideMenu from './SideMenu';
import TopHeader from './TopHead';

import './index.css';
/**
 * 对应页面的路由导航
 * 1.判断用户是否具有访问权限
 * 2.判断路由是否存在
 * 3.Spin：进度条加载指示器
 * 4.在backRouteList中,由于LocalRouterMap[item.key] 是一个组件，
 * 应该返回 <LocalRouterMap[item.key] />，而不是 LocalRouterMap[item.key]，
 * 但是因为 item.key 是一个变量，
 * 不能直接在 JSX 中使用它来创建一个组件实例。
 * 需要先获取到组件，然后再使用 React.createElement() 来创建一个组件实例
 */

const { Content } = Layout;

// 创建全局Context替代Redux
export const AdminContext = React.createContext({
    collapsed: false,
    setCollapsed: () => { },
    loading: false,
    setLoading: () => { }
});

export default function NewsSandBox() {
    // 使用useState替代Redux状态
    const [collapsed, setCollapsed] = useState(false);
    const [loading, setLoading] = useState(false);

    // // 检查用户是否登录
    // useEffect(() => {
    //     const adminToken = localStorage.getItem('adminToken');
    //     if (!adminToken) {
    //         // 重定向到登录页
    //         window.location.href = '/admin/login';
    //     }
    // }, []);

    return (
        // 使用Context Provider提供状态
        <AdminContext.Provider value={{ collapsed, setCollapsed, loading, setLoading }}>
            <Content
                className="site-layout-background"
                style={{
                    margin: '24px 16px',
                    padding: 24,
                    minHeight: 280,
                    background: '#fff', // 确保背景色与文字颜色形成对比
                    overflow: 'auto'
                }}
            >
                {loading ? (
                    <div style={{ textAlign: 'center', paddingTop: '100px' }}>
                        <span className="ant-spin-dot ant-spin-dot-spin">
                            <i className="ant-spin-dot-item"></i>
                            <i className="ant-spin-dot-item"></i>
                            <i className="ant-spin-dot-item"></i>
                            <i className="ant-spin-dot-item"></i>
                        </span>
                    </div>
                ) : (

                    <Routes>

                        <Route path="home" element={<Home />} />
                        <Route path="user-manage/list" element={<UserList />} />
                        <Route path="right-manage/role/list" element={<RoleList />} />
                        <Route path="right-manage/right/list" element={<RightList />} />
                        {/* <Route path="news-manage/add" element={<NewsAdd />} />
                                <Route path="news-manage/draft" element={<NewsDraft />} />
                                <Route path="news-manage/category" element={<NewsCategory />} /> */}
                        <Route path="" element={<Navigate to="home" />} />
                        <Route path="*" element={<Nopermission />} />
                    </Routes>
                )}
            </Content>
        </AdminContext.Provider>
    );
}