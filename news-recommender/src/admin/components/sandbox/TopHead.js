// filepath: c:\Users\Ming Gy\Desktop\graduate\NewsRecommender\news-recommender\src\admin\components\sandbox\TopHeader.js
import React from 'react';
import { Layout, Dropdown, Menu, Avatar } from 'antd';
import {
    MenuUnfoldOutlined,
    MenuFoldOutlined,
    UserOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Header } = Layout;

// 直接从props接收collapsed和setCollapsed
export default function TopHeader({ collapsed, setCollapsed }) {
    const navigate = useNavigate();

    const changeCollapsed = () => {
        setCollapsed(!collapsed);
    };

    // 处理菜单点击
    const handleMenuClick = (e) => {
        if (e.key === 'logout') {
            localStorage.removeItem('adminToken');
            navigate('/admin/login');
        }
    };

    // 下拉菜单
    const menu = (
        <Menu onClick={handleMenuClick}>
            <Menu.Item key="profile">个人信息</Menu.Item>
            <Menu.Item key="logout">退出登录</Menu.Item>
        </Menu>
    );


    return (
        <Header className="site-layout-background" style={{
            padding: '0 16px',
            display: 'flex',          // 添加flex布局
            justifyContent: 'space-between', // 两端对齐
            alignItems: 'center'      // 垂直居中
        }}>
            {/* 左侧折叠按钮 */}
            <div>
                {collapsed ? (
                    <MenuUnfoldOutlined onClick={changeCollapsed} />
                ) : (
                    <MenuFoldOutlined onClick={changeCollapsed} />
                )}
            </div>

            {/* 右侧用户信息 - 不再需要float:right */}
            <div>
                <span style={{ marginRight: '12px' }}>
                    欢迎回来，管理员
                </span>
                <Dropdown overlay={menu}>
                    <Avatar size="small" icon={<UserOutlined />} />
                </Dropdown>
            </div>
        </Header>
    );
}