import UserForm from './UserForm'
import React, { useEffect, useState, useRef } from 'react'
import { Table, Switch, Button, Modal, message } from 'antd'
import axios from 'axios'
import { EditOutlined, DeleteOutlined, ExclamationCircleFilled } from '@ant-design/icons'
const { confirm } = Modal

export default function UserList() {
    const addForm = useRef()
    const editForm = useRef()
    const [userList, setUserList] = useState([])
    const [regionList, setRegionList] = useState([])
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
        axios.get('http://localhost:8000/users?_expand=role').then((res) => {
            //过滤权限比登录用户大的用户
            const { roleId, username, region } = JSON.parse(localStorage.getItem('token'))
            const list = res.data
            setUserList(
                rank[roleId] === 'superAdmin'
                    ? list
                    : [
                        ...list.filter((user) => {
                            return user.username === username
                        }),
                        ...list.filter((user) => {
                            return user.region === region && rank[user.roleId] === 'editor'
                        })
                    ]
            )
            setUserList(res.data)
        })
        axios.get('http://localhost:8000/regions').then((res) => {
            setRegionList(res.data)
        })
        axios.get('http://localhost:8000/roles').then((res) => {
            setRoleList(res.data)
        })
    }, [])
    // table表格要渲染的数据
    const columns = [
        {
            title: '区域',
            dataIndex: 'region',
            render: (region) => {
                if (region === '') {
                    return <p>全球</p>
                } else {
                    return <p>{region}</p>
                }
            },
            filters: [
                ...regionList.map((region) => {
                    return {
                        value: region.value,
                        text: region.title
                    }
                }),
                {
                    text: '全球',
                    value: '全球'
                }
            ],
            onFilter: (value, item) => {
                if (value === '全球') {
                    return item.region === ''
                }
                return item.region === value
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
        axios.patch(`http://localhost:8000/users/${item.id}`, { roleState: !item.roleState })
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
        axios.delete(`http://localhost:8000/users/${item.id}`).then(
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
                axios
                    .post('http://localhost:8000/users', {
                        ...value,
                        default: false,
                        roleState: true
                    })
                    .then(
                        (res) => {
                            message.success('成功添加用户')
                            axios.get('http://localhost:8000/users?_expand=role').then((res) => {
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
                ...user,
                roleName: user.role.roleName
            })
        }, 10)
        setCurrentId(user.id)
    }
    // 提交编辑后的用户信息
    function editUser() {
        editForm.current.validateFields().then(
            (value) => {
                axios
                    .patch(`http://localhost:8000/users/${currentId}`, {
                        ...value
                    })
                    .then(
                        (res) => {
                            message.success('成功编辑用户')
                            axios.get('http://localhost:8000/users?_expand=role').then((res) => {
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
                style={{ marginBottom: '15px' }}
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
                    regionList={regionList}
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
                    regionList={regionList}
                    ref={editForm}
                    isSelectDisabled={isSelectDisabled}
                ></UserForm>
            </Modal>
        </div>
    )
}
