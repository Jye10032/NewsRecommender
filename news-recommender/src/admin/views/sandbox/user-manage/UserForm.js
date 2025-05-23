import React, { forwardRef, useState, useEffect } from 'react'
import { Form, Input, Select } from 'antd'

import adminAxios from '../../../utils/Request'
const { Option } = Select


const UserForm = forwardRef((props, ref) => {
    const [categoryList, setCategoryList] = useState([]);
    const [form] = Form.useForm()
    const [isDisabled, setIsDisabled] = useState()
    const rank = {
        1: 'superAdmin',
        2: 'admin',
        3: 'editor'
    }
    useEffect(() => {
        // 加载分类列表
        adminAxios.get('/categories/main')
            .then(res => {
                setCategoryList(res.data);
            })
            .catch(err => {
                console.error('获取分类列表失败:', err);
            });
    }, []);
    useEffect(() => {
        // 若打开的是超级管理员的编辑对话框，不使用下列方法会导致区域可选框可选
        setIsDisabled(props.isSelectDisabled)
    }, [props])
    // 选择角色的回调函数
    function handleSetRole(value) {
        if (value === 1) {
            setIsDisabled(true)
            ref.current.setFieldsValue({
                category: ''
            })
        } else {
            setIsDisabled(false)
        }
    }
    // 根据登录用户的权限来显示可选的区域
    // 根据登录用户的权限来显示可选的分类
    function checkCategoryDisable(item) {
        // 添加防御性检查
        const adminTokenStr = localStorage.getItem('adminToken');
        if (!adminTokenStr) {
            return false; // 如果没有token，默认不禁用任何选项
        }

        try {
            const { role, category_id } = JSON.parse(adminTokenStr);
            const roleId = role?.id; // 使用可选链

            // 若打开的是编辑对话框
            if (props.isUpdate) {
                // 除超级管理员，其他角色不能进行其他分类选择
                if (rank[roleId] === 'superAdmin') {
                    return false;
                } else {
                    return true;
                }
            } else {
                // 若打开的是添加对话框，除超级管理员，其他角色只能选择自己所在分类
                if (rank[roleId] === 'superAdmin') {
                    return false;
                } else {
                    return item.id !== category_id;
                }
            }
        } catch (error) {
            console.error('解析管理员令牌失败:', error);
            return false; // 解析失败时不禁用任何选项
        }
    }

    // 根据登录用户的权限来显示可选的角色
    function checkRoleDisable(item) {
        // 添加防御性检查
        const adminTokenStr = localStorage.getItem('adminToken');
        if (!adminTokenStr) {
            return false; // 如果没有token，默认不禁用任何选项
        }

        try {
            const { role } = JSON.parse(adminTokenStr);
            const roleId = role?.id; // 使用可选链

            // 若打开的是编辑对话框
            if (props.isUpdate) {
                // 除超级管理员，其他角色只不能修改角色
                if (rank[roleId] === 'superAdmin') {
                    return false;
                } else {
                    return true;
                }
            } else {
                // 若打开的是添加对话框，除超级管理员，其他角色只能选择比自己低一级的角色
                if (rank[roleId] === 'superAdmin') {
                    return false;
                } else {
                    return rank[item.id] !== 'editor';
                }
            }
        } catch (error) {
            console.error('解析管理员令牌失败:', error);
            return false; // 解析失败时不禁用任何选项
        }
    }
    return (
        <div>
            <Form
                ref={ref}
                form={form}
                layout="vertical"
                name="form_in_modal"
                initialValues={{
                    modifier: 'public'
                }}
            >
                <Form.Item
                    name="username"
                    label="用户名"
                    rules={[
                        {
                            required: true,
                            message: 'Please input the title of collection!'
                        }
                    ]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    name="password"
                    label="密码"
                    rules={[
                        {
                            required: true,
                            message: 'Please input the title of collection!'
                        }
                    ]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    name="category_id"
                    label="所属分类"
                    rules={[{ required: true, message: '请选择所属分类!' }]}
                >
                    <Select>
                        {categoryList.map(item => (
                            <Option key={item.id} value={item.id}>{item.name}</Option>
                        ))}
                    </Select>
                </Form.Item>
                <Form.Item
                    name="roleId"
                    label="角色"
                    rules={[
                        {
                            required: true,
                            message: 'Please input the title of collection!'
                        }
                    ]}
                >
                    <Select onChange={(value) => handleSetRole(value)}>
                        {props.roleList.map((role) => {
                            return (
                                <Option
                                    key={role.id}
                                    value={role.id}
                                    disabled={checkRoleDisable(role)}
                                >
                                    {role.roleName}
                                </Option>
                            )
                        })}
                    </Select>
                </Form.Item>
            </Form>
        </div>
    )
})

export default UserForm
