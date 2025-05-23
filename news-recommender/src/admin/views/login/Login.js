import React from 'react';
import { Form, Input, Button, message, Card } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import adminAxios from '../../utils/Request'; // 使用管理员专用axios实例
import './Login.css';

export default function Login() {
    const navigate = useNavigate();

    const onFinish = async (values) => {
        try {
            // 调用管理员登录API
            const response = await adminAxios.post('/login', {
                username: values.username,
                password: values.password,
            });

            if (response.data.success) {
                // 在管理员登录成功后存储 token
                localStorage.setItem('adminToken', JSON.stringify({
                    token: response.data.token,
                    id: response.data.id,
                    username: response.data.username,
                    role: response.data.role
                }));

                message.success('管理员登录成功！');
                // 跳转到管理后台首页
                navigate('/admin/home');
            } else {
                message.error(response.data.message || '管理员账号或密码错误！');
            }
        } catch (error) {
            console.error('管理员登录失败：', error);
            message.error('登录失败，请检查账号权限或稍后再试！');
        }
    };

    return (
        <div className="admin-login-page">
            <Card
                className="login-card"
                bordered={true}
                style={{ width: 400 }}
            >
                <Form
                    name="adminLogin"
                    className="login-form"
                    initialValues={{ remember: true }}
                    onFinish={onFinish}
                >
                    <h2 style={{ textAlign: 'center', marginBottom: 24 }}>新闻推荐系统管理后台</h2>
                    <Form.Item
                        name="username"
                        rules={[{ required: true, message: '请输入管理员账号！' }]}
                    >
                        <Input
                            prefix={<UserOutlined className="site-form-item-icon" />}
                            placeholder="管理员账号"
                        />
                    </Form.Item>
                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: '请输入管理员密码！' }]}
                    >
                        <Input.Password
                            prefix={<LockOutlined className="site-form-item-icon" />}
                            placeholder="管理员密码"
                        />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" className="login-form-button" block>
                            管理员登录
                        </Button>
                        <div style={{ textAlign: 'center', marginTop: 12 }}>
                            <a onClick={() => navigate('/')}>返回前台</a>
                        </div>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
}