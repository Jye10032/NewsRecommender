import React from 'react';
import { Form, Input, Button, Checkbox, message, Card } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom'; // 用于页面跳转
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext.tsx';
import './Login.css'; // 可选：用于自定义样式

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const onFinish = async (values) => {
        try {
            // 发送登录请求到后端
            const response = await axios.post('/api/login', {
                username: values.username,
                password: values.password,
            });

            if (response.data.success) {
                // 检查返回的数据中是否包含token
                if (response.data.token) {
                    // 保存token到localStorage
                    localStorage.setItem('token', response.data.token);

                    // 登录成功后保存用户信息和token
                    login({
                        userId: response.data.user?.userId || values.username,
                        username: response.data.user?.username || values.username,
                        token: response.data.token
                    });
                } else {
                    console.warn('登录成功但未返回令牌');
                }
                message.success('登录成功！');
                // 跳转到主页或其他页面
                navigate('/');
            } else {
                message.error(response.data.message || '用户名或密码错误！');
            }
        } catch (error) {
            console.error('登录失败：', error);
            message.error('登录失败，请稍后再试！');
        }
        console.log(message);
    };

    return (
        <div className="login-page">
            <Card
                className="login-card"
                bordered={true}
                style={{ width: 400 }}
            >
                <Form
                    name="login"
                    className="login-form"
                    initialValues={{ remember: true }}
                    onFinish={onFinish}
                >
                    <h2 style={{ textAlign: 'center', marginBottom: 24 }}>登录</h2>
                    <Form.Item
                        name="username"
                        rules={[{ required: true, message: '请输入用户名！' }]}
                    >
                        <Input
                            prefix={<UserOutlined className="site-form-item-icon" />}
                            placeholder="用户名"
                        />
                    </Form.Item>
                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: '请输入密码！' }]}
                    >
                        <Input.Password
                            prefix={<LockOutlined className="site-form-item-icon" />}
                            placeholder="密码"
                        />
                    </Form.Item>
                    <Form.Item>
                        <Form.Item name="remember" valuePropName="checked" noStyle>
                            <Checkbox>记住我</Checkbox>
                        </Form.Item>
                        <a className="login-form-forgot" href="/forgot-password" style={{ float: 'right' }}>
                            忘记密码？
                        </a>
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" className="login-form-button" block>
                            登录
                        </Button>
                        <div style={{ textAlign: 'center', marginTop: 12 }}>
                            或 <a onClick={() => navigate('/register')}>立即注册！</a>
                        </div>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
}