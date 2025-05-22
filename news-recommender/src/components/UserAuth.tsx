import React from 'react';
import { Button, Avatar, Dropdown, Space, message } from 'antd';
import { UserOutlined, DownOutlined, LogoutOutlined, SettingOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';
import type { MenuProps } from 'antd';

// 用户认证组件，处理登录/注册和用户状态显示
const UserAuth: React.FC = () => {
    const navigate = useNavigate();
    const { user, isLoggedIn, logout } = useAuth();

    // 用户下拉菜单项
    const userMenuItems: MenuProps['items'] = [
        {
            key: 'profile',
            label: '个人中心',
            icon: <UserOutlined />,
            onClick: () => navigate('/profile')
        },
        {
            key: 'settings',
            label: '设置',
            icon: <SettingOutlined />,
            onClick: () => navigate('/settings')
        },
        {
            type: 'divider'
        },
        {
            key: 'logout',
            label: '退出登录',
            icon: <LogoutOutlined />,
            onClick: () => {
                logout();
                message.success('已成功退出登录');
                navigate('/');
            }
        }
    ];

    // 处理登录按钮点击
    const handleLoginClick = () => {
        navigate('/login');
    };

    // 处理注册按钮点击
    const handleRegisterClick = () => {
        navigate('/register');
    };

    return (
        <div style={{ marginLeft: 16 }}>
            {isLoggedIn ? (
                <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                    <Space style={{ cursor: 'pointer', color: '#fff' }}>
                        <Avatar
                            style={{ backgroundColor: '#87d068' }}
                            icon={<UserOutlined />}
                        />
                        <span style={{ color: 'white' }}>{user?.username || '用户'}</span>
                        <DownOutlined />
                    </Space>
                </Dropdown>
            ) : (
                <Space>
                    <Button
                        type="default"  // 将type从"primary"改为"default"
                        onClick={handleLoginClick}
                        style={{

                            color: '#595959',
                            marginLeft: '15px'
                        }}
                    >
                        登录
                    </Button>
                    <Button onClick={handleRegisterClick}>
                        注册
                    </Button>
                </Space>
            )
            }
        </div >
    );
};

export default UserAuth;