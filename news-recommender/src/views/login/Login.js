import React from 'react';
import { Form, Input, Button, Checkbox, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import './Login.css'; // 可选：用于自定义样式

export default function Login() {
    const onFinish = (values) => {
        console.log('Received values of form: ', values);
        // 模拟登录逻辑
        if (values.username === 'admin' && values.password === '123456') {
            message.success('登录成功！');
        } else {
            message.error('用户名或密码错误！');
        }
    };

    return (
        <div className="login-container">
            <Form
                name="login"
                className="login-form"
                initialValues={{ remember: true }}
                onFinish={onFinish}
            >
                <h2 style={{ textAlign: 'center' }}>登录</h2>
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
                    或 <a href="/register">立即注册！</a>
                </Form.Item>
            </Form>
        </div>
    );
}