import React, { useState, useEffect } from 'react';
import { Card, Checkbox, Button, message, Row, Col } from 'antd';
import type { GetProp } from 'antd'; // 使用正确的类型导入
import { useAuth } from '../../contexts/AuthContext.tsx';
import axios from 'axios';

// 使用GetProp获取Checkbox.Group的onChange属性类型
type CheckboxValueType = GetProp<typeof Checkbox.Group, 'value'>[number];

const Settings: React.FC = () => {
    const { user } = useAuth();
    const [preferences, setPreferences] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);


    // 预设的新闻分类
    const newsCategories = [
        '国内', '国际', '财经', '科技', '体育',
        '娱乐', '教育', '健康', '军事', '文化'
    ];

    // 加载用户现有偏好设置
    useEffect(() => {
        const fetchPreferences = async () => {
            if (!user) return;

            try {
                // 获取令牌
                const token = localStorage.getItem('token');
                // console.log('当前令牌:', token); // 调试用

                // if (!token) {
                //     console.error('找不到令牌');
                //     return;
                // }
                const response = await axios.get('/api/user/preferences', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });

                if (response.data.success) {
                    setPreferences(response.data.preferences || []);
                }
            } catch (error) {
                console.error('获取偏好设置失败:', error);
            }
        };

        fetchPreferences();
    }, [user]);

    // 保存偏好设置
    const savePreferences = async () => {
        if (!user) {
            message.error('请先登录');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post('/api/user/preferences',
                { preferences },
                { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );

            if (response.data.success) {
                message.success('偏好设置已保存');
            }
        } catch (error) {
            message.error('保存偏好设置失败');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // 处理选择变化
    const handlePreferenceChange = (checkedValues: CheckboxValueType[]) => {
        setPreferences(checkedValues as string[]);
    };
    return (
        <Card title="个人设置" style={{ margin: '24px' }}>
            <Card type="inner" title="新闻偏好设置">
                <p>选择您感兴趣的新闻类别，我们将优先为您推荐这些类别的新闻</p>

                <Checkbox.Group
                    value={preferences}
                    onChange={handlePreferenceChange}
                    style={{ width: '100%' }}
                >
                    <Row>
                        {newsCategories.map(category => (
                            <Col span={8} key={category}>
                                <Checkbox value={category}>{category}</Checkbox>
                            </Col>
                        ))}
                    </Row>
                </Checkbox.Group>

                <Button
                    type="primary"
                    onClick={savePreferences}
                    loading={loading}
                    style={{ marginTop: 20 }}
                >
                    保存设置
                </Button>
            </Card>
        </Card>
    );
};

export default Settings;