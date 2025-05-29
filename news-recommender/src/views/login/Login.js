import React, { useState } from 'react';
import { Form, Input, Button, Checkbox, message, Card, Alert } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext.tsx';
import './Login.css';

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    // Add error state
    const [loginError, setLoginError] = useState('');
    // Add loading state
    const [loading, setLoading] = useState(false);

    const onFinish = async (values) => {
        // Reset error message
        setLoginError('');
        // Set loading state
        setLoading(true);

        try {
            // Send login request to backend
            const response = await axios.post('/api/login', {
                username: values.username,
                password: values.password,
            });

            if (response.data.success) {
                // Check if token is included in response
                if (response.data.token) {
                    // Save token to localStorage
                    localStorage.setItem('token', response.data.token);

                    // Save user info and token after successful login
                    login({
                        userId: response.data.user?.userId || values.username,
                        username: response.data.user?.username || values.username,
                        token: response.data.token
                    });

                    message.success('Login successful!');
                    // Navigate to homepage or other page
                    navigate('/');
                } else {
                    setLoginError('Login successful but no token returned, please contact administrator');
                    console.warn('Login successful but no token returned');
                }
            } else {
                setLoginError(response.data.message || 'Incorrect username or password!');
                message.error(response.data.message || 'Incorrect username or password!');
            }
        } catch (error) {
            console.error('Login failed:', error);

            // 根据错误代码显示不同的错误信息
            if (error.response && error.response.data) {
                const { errorCode, message } = error.response.data;

                switch (errorCode) {
                    case 'USER_NOT_FOUND':
                        setLoginError('This username does not exist in our system');
                        break;
                    case 'INVALID_PASSWORD':
                        setLoginError('The password you entered is incorrect');
                        break;
                    case 'ACCOUNT_LOCKED':
                        setLoginError('Your account has been locked. Please contact support.');
                        break;
                    default:
                        setLoginError(message || 'Login failed, please try again later');
                }
            } else {
                setLoginError('Unable to connect to the server. Please check your network.');
            }

            setLoading(false);
        }
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
                    <h2 style={{ textAlign: 'center', marginBottom: 24 }}>Sign In</h2>

                    {/* Display error message */}
                    {loginError && (
                        <Form.Item>
                            <Alert
                                message="Login Error"
                                description={loginError}
                                type="error"
                                showIcon
                                closable
                                onClose={() => setLoginError('')}
                            />
                        </Form.Item>
                    )}

                    <Form.Item
                        name="username"
                        rules={[{ required: true, message: 'Please enter your username!' }]}
                    >
                        <Input
                            prefix={<UserOutlined className="site-form-item-icon" />}
                            placeholder="Username"
                        />
                    </Form.Item>
                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: 'Please enter your password!' }]}
                    >
                        <Input.Password
                            prefix={<LockOutlined className="site-form-item-icon" />}
                            placeholder="Password"
                        />
                    </Form.Item>
                    <Form.Item>
                        <Form.Item name="remember" valuePropName="checked" noStyle>
                            <Checkbox>Remember me</Checkbox>
                        </Form.Item>
                        <a className="login-form-forgot" href="/forgot-password" style={{ float: 'right' }}>
                            Forgot password?
                        </a>
                    </Form.Item>
                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            className="login-form-button"
                            block
                            loading={loading}
                        >
                            Sign In
                        </Button>
                        <div style={{ textAlign: 'center', marginTop: 12 }}>
                            Or <a onClick={() => navigate('/register')}>Sign Up</a>
                        </div>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
}