import React from 'react';
import { Form, Input, Button, message, Card } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import axios from 'axios'; // 用于发送请求
import './Register.css';

// import './Register.css'; // 可选：用于自定义样式

export default function Register() {

    const [messageApi, contextHolder] = message.useMessage();

    const onFinish = async (values) => {
        console.log('Received values of form: ', values);


        try {
            // 发送注册请求到后端
            const response = await axios.post('/api/register', {
                username: values.username,
                password: values.password,
            });
            // 只有服务器返回 2xx 状态码时才会执行到这里
            if (response.data.success) {
                messageApi.open({
                    type: 'success',
                    content: '注册成功！请返回登录页面登录。',
                });
                // message('注册成功！请返回登录页面登录。');
            } else {
                // 服务器返回 2xx，但操作失败（如后端逻辑错误）
                messageApi.open({
                    type: 'error',
                    content: response.data.message || '注册失败！',
                });
                // message.error(response.data.message || '注册失败！');
            }
        } catch (error) {
            // 在这里处理 HTTP 错误状态码
            if (error.response) {
                // 服务器返回了错误状态码
                if (error.response.status === 400) {
                    messageApi.error(error.response.data.message || '用户名已存在！');
                } else if (error.response.status === 500) {
                    messageApi.error('服务器错误，请稍后再试！');
                } else {
                    messageApi.error(`请求错误: ${error.response.status}`);
                }
            } else if (error.request) {
                // 请求已发送但没有收到响应
                messageApi.warning('服务器无响应，请检查网络连接！');
            } else {
                // 请求配置出错
                messageApi.warning('请求失败，请稍后再试！');
            }
            // message.error('注册失败，请稍后再试！');
        }
    };

    return (
        <div className="register-page">
            {contextHolder}
            <Card
                className="register-card"
                bordered={true}
                style={{ width: 400 }}
            >
                <Form
                    name="register"
                    className="register-form"
                    onFinish={onFinish}
                >
                    <h2 style={{ textAlign: 'center' }}>注册</h2>
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
                        <Button type="primary" htmlType="submit" className="register-form-button" block>
                            注册
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
}