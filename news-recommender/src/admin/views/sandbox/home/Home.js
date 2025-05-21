import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic } from 'antd';
import { UserOutlined, FormOutlined, EyeOutlined } from '@ant-design/icons';

export default function Home() {
    // 1. 确保静态数据已初始化
    const [viewData] = useState({
        userCount: 120,
        newsCount: 450,
        todayViews: 1320
    });

    // 2. 安全地从本地存储获取用户名，提供默认值
    let username = "管理员";
    try {
        const adminTokenStr = localStorage.getItem('adminToken');
        if (adminTokenStr) {
            const adminData = JSON.parse(adminTokenStr);
            if (adminData && adminData.username) {
                username = adminData.username;
            }
        }
    } catch (error) {
        console.error("获取用户名时出错:", error);
        // 保持默认用户名
    }

    // 3. 添加调试日志
    useEffect(() => {
        console.log("Home组件已渲染");
        console.log("数据:", viewData);
        console.log("用户名:", username);
    }, []);

    return (
        <div>
            {/* 4. 添加检查以确保内容显示 */}
            {console.log("渲染Home组件内容")}

            <div style={{ padding: '0 0 20px 0' }}>
                <h2 style={{ color: '#333' }}>管理员仪表盘</h2>
                <p style={{ color: '#666' }}>欢迎回来，{username}</p>
            </div>

            <Row gutter={16}>
                <Col span={8}>
                    <Card>
                        <Statistic
                            title="用户总数"
                            value={viewData.userCount}
                            prefix={<UserOutlined />}
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card>
                        <Statistic
                            title="新闻总数"
                            value={viewData.newsCount}
                            prefix={<FormOutlined />}
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card>
                        <Statistic
                            title="今日浏览量"
                            value={viewData.todayViews}
                            prefix={<EyeOutlined />}
                        />
                    </Card>
                </Col>
            </Row>

            {/* 5. 添加更多可见内容 */}
            <div style={{ marginTop: '20px', padding: '20px', background: '#f0f2f5', borderRadius: '4px' }}>
                <h3>系统公告</h3>
                <p>欢迎使用新闻管理系统。这里是管理员仪表盘，您可以查看系统概况。</p>
            </div>
        </div>
    );
}