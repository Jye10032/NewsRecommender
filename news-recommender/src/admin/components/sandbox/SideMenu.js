import React, { useContext, useState, useEffect } from 'react';
import { Layout, Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserOutlined, HomeOutlined, FileTextOutlined, TeamOutlined, SettingOutlined, BarChartOutlined, FormOutlined } from '@ant-design/icons';
import { AdminContext } from '../../views/sandbox/NewsSandBox';
import adminAxios from '../../utils/Request';

import './index.css';

const { Sider } = Layout;
const { SubMenu } = Menu;

// 图标映射
const iconMap = {
    '/home': <HomeOutlined />,
    '/user-manage': <UserOutlined />,
    '/right-manage': <SettingOutlined />,
    '/news-manage': <FormOutlined />,
    '/audit-manage': <TeamOutlined />,
    '/publish-manage': <BarChartOutlined />
};

// 如果后端API还没准备好，可以使用静态菜单数据
// 实际使用时可调用真实API
const staticMenu = [
    {
        key: '/home',
        title: '首页',
        icon: 'home'
    },
    {
        key: '/user-manage',
        title: '用户管理',
        icon: 'user',
        children: [
            {
                key: '/user-manage/list',
                title: '用户列表',
            }
        ]
    },
    {
        key: '/news-manage',
        title: '新闻管理',
        icon: 'file-text',
        children: [
            {
                key: '/news-manage/add',
                title: '添加新闻',
            },
            {
                key: '/news-manage/draft',
                title: '草稿箱',
            },
            {
                key: '/news-manage/category',
                title: '新闻分类',
            }
        ]
    },
    {
        key: '/right-manage',
        title: '权限管理',
        icon: 'setting',
        children: [
            {
                key: '/right-manage/role/list',
                title: '角色列表',
            },
            {
                key: '/right-manage/right/list',
                title: '权限列表',
            }
        ]
    }
];

// 从props中直接获取collapsed
export default function SideMenu({ collapsed }) {
    const [menu, setMenu] = useState([]);
    const navigate = useNavigate();
    const location = useLocation();

    // 修改useEffect，添加更好的错误处理
    useEffect(() => {
        // 检查是否已登录
        const adminTokenStr = localStorage.getItem('adminToken');
        if (!adminTokenStr) {
            console.log('未登录，使用静态菜单数据');
            setMenu(staticMenu);
            return;
        }

        // 已登录，尝试获取菜单数据
        adminAxios.get('/menu')
            .then(res => {
                if (res.data.success && res.data.data) {
                    setMenu(res.data.data);
                } else {
                    setMenu(staticMenu);
                }
            })
            .catch(err => {
                console.error('获取菜单失败，使用静态菜单数据', err);
                setMenu(staticMenu);
            });
    }, []);
    // 处理菜单点击事件
    const handleMenuClick = (e) => {
        // 添加前缀，确保导航到 /admin 开头的路径
        navigate(`/admin${e.key}`);
    };

    // 递归渲染菜单的函数
    const renderMenu = (menuList) => {
        return menuList.map(item => {
            if (item.children && item.children.length > 0) {
                // 有子菜单的情况，使用SubMenu
                return (
                    <SubMenu
                        key={item.key}
                        icon={iconMap[item.key] || <FileTextOutlined />}
                        title={item.title}
                    >
                        {renderMenu(item.children)}
                    </SubMenu>
                );
            }
            // 无子菜单，直接返回MenuItem
            return (
                <Menu.Item
                    key={item.key}
                    icon={iconMap[item.key] || <FileTextOutlined />}
                >
                    {item.title}
                </Menu.Item>
            );
        });
    };

    return (
        <Sider trigger={null} collapsible collapsed={collapsed}>
            <div style={{ display: 'flex', height: "100%", flexDirection: "column" }}>
                <div className="logo">{!collapsed && '新闻管理系统'}</div>
                <div style={{ flex: 1, overflow: 'auto' }}>
                    <Menu
                        onClick={handleMenuClick}
                        mode="inline"
                        // 从 location.pathname 中移除 /admin 前缀以匹配菜单项的 key
                        selectedKeys={[location.pathname.replace('/admin', '')]}
                        // 同样修改 defaultOpenKeys 的计算方式
                        defaultOpenKeys={['/' + location.pathname.replace('/admin', '').split('/')[1]]}
                    >
                        {renderMenu(menu)}
                    </Menu>
                </div>
            </div>
        </Sider>
    );
}