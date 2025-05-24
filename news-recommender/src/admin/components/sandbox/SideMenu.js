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
// 修改 staticMenu 中的新闻管理子菜单项

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
            // 审核和下架功能
            // {
            //     key: '/news-manage/audit',
            //     title: '新闻审核',
            // },
            // {
            //     key: '/news-manage/offline',
            //     title: '新闻下架',
            // },
            // 整合发布管理功能
            {
                key: '/news-manage/unpublished',
                title: '待发布新闻',
            },
            {
                key: '/news-manage/published',
                title: '已发布新闻',
            },
            {
                key: '/news-manage/sunset',
                title: '已下线新闻',
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
    // 删除审核管理和发布管理菜单
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
    // 修改 renderMenu 函数，增加对 hidden 属性的处理

    const renderMenu = (menuList) => {
        return menuList.map(item => {
            // 跳过标记为隐藏的菜单项
            if (item.hidden) return null;

            if (item.children && item.children.length > 0) {
                // 过滤掉子菜单中的隐藏项
                const visibleChildren = item.children.filter(child => !child.hidden);

                // 如果过滤后没有可见的子菜单，则跳过此菜单项
                if (visibleChildren.length === 0) return null;

                // 有子菜单的情况，使用SubMenu
                return (
                    <SubMenu
                        key={item.key}
                        icon={iconMap[item.key] || <FileTextOutlined />}
                        title={item.title}
                    >
                        {renderMenu(visibleChildren)}
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
        }).filter(Boolean); // 过滤掉null值
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