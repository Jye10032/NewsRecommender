import UserForm from './UserForm'
import React, { useEffect, useState, useRef } from 'react'
import { Table, Switch, Button, Modal, message } from 'antd'
import adminAxios from '../../../utils/Request'
import { API_URL } from '../../../utils/api'
import { EditOutlined, DeleteOutlined, ExclamationCircleFilled } from '@ant-design/icons'
const { confirm } = Modal




export default function UserList() {
    const addForm = useRef()
    const editForm = useRef()
    const [userList, setUserList] = useState([])
    const [categoryList, setCategoryList] = useState([])
    const [roleList, setRoleList] = useState([])
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [currentId, setCurrentId] = useState(0)
    const [isSelectDisabled, setIsSelectDisabled] = useState(false)
    const [isUpdate, setIsUpdate] = useState(false)
    useEffect(() => {
        const rank = {
            1: 'superAdmin',
            2: 'admin',
            3: 'editor'
        }
        adminAxios.get('/users/with-roles').then((res) => {
            // 获取当前登录用户信息
            const adminTokenStr = localStorage.getItem('adminToken');
            if (adminTokenStr) {
                try {
                    const adminToken = JSON.parse(adminTokenStr);
                    const { role, username } = adminToken;
                    const roleId = role?.id || 1; // 默认为超级管理员
                    const category_id = adminToken.category_id; // 从token获取分类ID

                    const list = res.data;
                    const rank = {
                        1: 'superAdmin',
                        2: 'admin',
                        3: 'editor'
                    };

                    // 根据角色过滤用户列表
                    setUserList(
                        rank[roleId] === 'superAdmin'
                            ? list // 超级管理员可以看到所有用户
                            : [
                                ...list.filter(user => user.username === username), // 自己
                                ...list.filter(user =>
                                    user.category?.id === category_id && // 同一分类
                                    rank[user.role?.id] === 'editor' // 角色是编辑
                                )
                            ]
                    );
                } catch (error) {
                    console.error('解析token失败:', error);
                    setUserList(res.data);
                }
            } else {
                setUserList(res.data);
            }
        });
        // 获取分类列表（不是区域列表）
        adminAxios.get('/categories/main').then((res) => {
            setCategoryList(res.data);
        });
        adminAxios.get('/roles').then((res) => {
            setRoleList(res.data)
        })
    }, [])
    // table表格要渲染的数据
    const columns = [
        {
            title: '所属分类',
            dataIndex: 'category',
            render: (category) => {
                if (!category) {
                    return <p>全部</p>
                } else if (typeof category === 'object') {
                    return <p>{category.name}</p>  // 渲染对象的name属性
                } else {
                    return <p>{category}</p>  // 处理字符串情况
                }
            },
            filters: [
                ...categoryList.map((category) => {
                    return {
                        value: category.id,
                        text: category.name
                    }
                }),
                {
                    text: '全部',
                    value: '全部'
                }
            ],
            onFilter: (value, item) => {
                if (value === '全部') {
                    return !item.category || item.category === '';
                }
                // 检查category是否为对象
                if (typeof item.category === 'object') {
                    return item.category.id === value;
                }
                return item.category === value;
            }
        },
        {
            title: '角色名称',
            dataIndex: 'role',
            render: (role) => {
                return role?.roleName
            }
        },
        {
            title: '用户名',
            dataIndex: 'username'
        },
        {
            title: '用户状态',
            dataIndex: 'id',
            render: (id, user) => {
                return (
                    <div>
                        <Switch
                            checked={user.roleState}
                            disabled={user.default}
                            onChange={() => handleSwitch(user)}
                        />
                    </div>
                )
            }
        },
        {
            title: '操作',
            dataIndex: 'id',
            key: 'grade',
            render: (id, user) => {
                return (
                    <div>
                        <Button
                            danger
                            shape="circle"
                            icon={<DeleteOutlined />}
                            onClick={() => confirmMethod(user)}
                            style={{
                                marginRight: '10px'
                            }}
                            disabled={user.default}
                        />
                        <Button
                            type="primary"
                            shape="circle"
                            onClick={() => handleEditButton(user)}
                            icon={<EditOutlined />}
                            disabled={user.default}
                        />
                    </div>
                )
            }
        }
    ]
    // 更新用户状态
    function handleSwitch(item) {
        setUserList(
            userList.map((user) => {
                if (user.id === item.id) {
                    return {
                        ...user,
                        roleState: !user.roleState
                    }
                } else {
                    return user
                }
            })
        )
        adminAxios.patch(`/users/${item.id}/status`, { roleState: !item.roleState })
    }
    // 删除前的确认框
    function confirmMethod(user) {
        confirm({
            title: '警告',
            icon: <ExclamationCircleFilled />,
            content: '是否删除该用户?',
            okText: '确认',
            cancelText: '取消',
            onOk() {
                deleteUser(user)
            },
            onCancel() { }
        })
    }
    // 删除用户
    function deleteUser(item) {
        let list = userList.filter((user) => {
            return user.id !== item.id
        })
        adminAxios.delete(`/users/${item.id}`).then(
            (res) => {
                setUserList([...list])
                message.success('删除成功')
            },
            (err) => {
                message.error('删除失败')
            }
        )
        // setUserList([...list])
        // message.success('删除成功')
    }
    // 提交添加用户信息
    function handleAdd() {
        addForm.current.validateFields().then(
            (value) => {
                adminAxios
                    .post(`/users`, {
                        ...value,
                        default: false,
                        roleState: true
                    })
                    .then(
                        (res) => {
                            message.success('成功添加用户')
                            adminAxios.get(`/users/with-roles`).then((res) => {
                                setUserList(res.data)
                            })
                            setIsAddModalOpen(false)
                            addForm.current.resetFields()
                        },
                        (err) => message.error('出现错误了!添加用户失败！')
                    )
            },
            (err) => message.error('请确认所有信息已填写')
        )
    }
    // 点击编辑按钮的回调
    function handleEditButton(user) {
        setIsUpdate(true)
        setIsEditModalOpen(!isEditModalOpen)
        if (user.roleId === 1) {
            setIsSelectDisabled(true)
        } else {
            setIsSelectDisabled(false)
        }
        setTimeout(() => {
            editForm.current.setFieldsValue({
                username: user.username,
                password: user.password || '',
                roleId: user.role?.id,
                category_id: user.category?.id  // 使用category对象的id
            })
        }, 10)
        setCurrentId(user.id)
    }
    // 提交编辑后的用户信息
    function editUser() {
        editForm.current.validateFields().then(
            (value) => {
                adminAxios
                    .patch(`/users/${currentId}`, {
                        ...value
                    })
                    .then(
                        (res) => {
                            message.success('成功编辑用户')
                            adminAxios.get(`/users/with-roles`).then((res) => {
                                setUserList(res.data)
                            })
                            setIsEditModalOpen(false)
                        },
                        (err) => message.error('出现错误了!编辑用户失败！')
                    )
            },
            (err) => message.error('请确认所有信息已填写')
        )

        setIsUpdate(false)
    }
    return (
        <div>
            <Button
                type="primary"
                size="large"
                style={{ marginBottom: '15px', float: 'right' }}
                onClick={() => setIsAddModalOpen(!isAddModalOpen)}
            >
                添加用户
            </Button>
            <Table
                dataSource={userList}
                columns={columns}
                rowKey={(item) => {
                    return item.id
                }}
                pagination={{
                    pageSize: 5
                }}
            />
            {/* 添加用户的对话框 */}
            <Modal
                title="添加用户信息"
                open={isAddModalOpen}
                cancelText="取消"
                okText="确认"
                onCancel={() => setIsAddModalOpen(!isAddModalOpen)}
                onOk={handleAdd}
            >
                <UserForm
                    isUpdate={isUpdate}
                    roleList={roleList}
                    categoryList={categoryList}
                    ref={addForm}
                ></UserForm>
            </Modal>
            {/* 编辑用户的对话框 */}
            <Modal
                title="编辑用户信息"
                open={isEditModalOpen}
                cancelText="取消"
                okText="确认"
                onOk={editUser}
                onCancel={() => {
                    setIsEditModalOpen(!isEditModalOpen)
                    setIsUpdate(false)
                }}
            >
                <UserForm
                    isUpdate={isUpdate}
                    roleList={roleList}
                    categoryList={categoryList}
                    ref={editForm}
                    isSelectDisabled={isSelectDisabled}
                ></UserForm>
            </Modal>
        </div>
    )
}
