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

// 添加这些导入
import NewsManage from '../../views/sandbox/news-manage/NewsManage';
import AuditManage from '../../views/sandbox/audit-manage/AuditManage';
//import PublishManage from '../../views/sandbox/publish-manage/PublishManage';
// 导入新组件
import NewsAudit from '../../views/sandbox/news-manage/NewsAudit';
import NewsOffline from '../../views/sandbox/news-manage/NewsOffline';

// // 新闻管理
// import NewsList from '../../views/sandbox/news-manage/NewsList'
// import NewsEdit from '../../views/sandbox/news-manage/NewsEdit'
// import NewsDraft from '../../views/sandbox/news-manage/NewsDraft'
// import NewsCategory from '../../views/sandbox/news-manage/NewsCategory'

// 审核管理
import AuditNews from '../../views/sandbox/audit-manage/AuditNews'
import AuditList from '../../views/sandbox/audit-manage/AuditList'
import NewsPreview from '../../views/sandbox/news-manage/NewsPreview';

// 发布管理
import Published from '../../views/sandbox/publish-manage/Published'
import Unpublished from '../../views/sandbox/publish-manage/Unpublished'
import Sunset from '../../views/sandbox/publish-manage/Sunset'


import React, { useEffect, useState } from 'react'
import { Route, Routes, Navigate, Outlet } from 'react-router-dom'
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

                        {/* 新闻管理路由 - 整合了审核和发布功能 */}
                        <Route path="news-manage" element={<NewsManage />}>
                            <Route path="audit" element={<NewsAudit />} />
                            <Route path="offline" element={<NewsOffline />} />
                            <Route path="preview/:id" element={<NewsPreview />} />

                            {/* 移动发布管理功能到新闻管理下 */}
                            <Route path="published" element={<Published />} />
                            <Route path="unpublished" element={<Unpublished />} />
                            <Route path="sunset" element={<Sunset />} />
                        </Route>

                        <Route path="" element={<Navigate to="home" />} />
                        <Route path="*" element={<Nopermission />} />
                    </Routes>
                )}
            </Content>
        </AdminContext.Provider>
    );
}