import React, { useState, useEffect } from 'react'
import { Table, Button, Modal, Tree, message } from 'antd'
import { DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { ExclamationCircleFilled } from '@ant-design/icons';

import adminAxios from '../../../utils/Request'
import RightList from './RightList';

const { confirm } = Modal;

export default function RoleList() {

    const [dataSource, setdataSource] = useState([])
    const [rightList, setRightList] = useState([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [currentRights, setcurrentRights] = useState([])
    const [currentId, setcurrentId] = useState([])

    //删除
    const deleteMethod = (item) => {//实现当前页面同步状态+后端同步删除
        setdataSource(dataSource.filter(data => data.id !== item.id))

        // 使用adminAxios，路径为/roles/${item.id}
        adminAxios.delete(`/roles/${item.id}`).then(res => {
            //console.log(res.data)
        })
    }

    const showConfirm = (item) => {
        confirm({
            title: 'Do you Want to delete these items?',
            icon: <ExclamationCircleFilled />,
            content: 'Some descriptions',
            onOk() {
                deleteMethod(item);
                console.log('OK');
            },
            onCancel() {
                console.log('Cancel');
            },
        });
    };



    // 获取角色列表 - 添加详细的调试日志
    useEffect(() => {
        console.log("开始请求角色列表...")
        adminAxios.get(`/roles`)
            .then(res => {
                console.log("角色列表API响应:", res)
                console.log("角色列表数据:", res.data)

                if (res.data && Array.isArray(res.data)) {
                    // 转换字段名称以匹配前端组件预期
                    const formattedRoles = res.data.map(role => {
                        console.log("处理角色:", role)
                        // 检查数据格式是否符合预期
                        if (!role.id || !role.role_name) {
                            console.warn("角色数据格式不完整:", role)
                        }

                        return {
                            id: role.id,
                            roleName: role.roleName || role.role_name, // 支持两种格式
                            roleCode: role.roleCode || role.role_code,
                            rights: role.rights || []
                        }
                    })

                    console.log("格式化后的角色数据:", formattedRoles)
                    setdataSource(formattedRoles)
                } else {
                    console.error("角色数据不是数组格式:", res.data)
                    message.error("角色数据格式不正确")
                    setdataSource([])
                }
            })
            .catch(err => {
                console.error("获取角色列表失败:", err)
                console.error("错误详情:", err.response?.data || err.message)
                message.error("获取角色列表失败: " + (err.response?.data?.message || err.message))
            })
    }, [])

    // 获取权限树 - 添加详细的调试日志
    useEffect(() => {
        console.log("开始请求权限树...")
        adminAxios.get(`/rights/tree`)
            .then(res => {
                console.log("权限树API响应:", res)
                console.log("权限树数据:", res.data)

                if (res.data && Array.isArray(res.data)) {
                    setRightList(res.data)
                } else {
                    console.error("权限树数据格式不正确:", res.data)
                    message.error("权限树数据格式不正确")
                    setRightList([])
                }
            })
            .catch(err => {
                console.error("获取权限树失败:", err)
                console.error("错误详情:", err.response?.data || err.message)
                message.error("获取权限树失败: " + (err.response?.data?.message || err.message))
            })
    }, [])

    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            //key: 'name',
            render: (id) => {
                return <b>{id}</b>
            }
        },
        {
            title: '角色名称',
            dataIndex: 'roleName',
        },
        {
            title: '操作',
            //key: 'address',
            render: (item) => {
                return (
                    <div>
                        <Button danger shape="circle" icon={<DeleteOutlined />}
                            onClick={() => showConfirm(item)} />
                        <Button type="primary" shape="circle" icon={<EditOutlined />}
                            onClick={() => {
                                setIsModalOpen(true)
                                setcurrentRights(item.rights)
                                setcurrentId(item.id)
                            }} />
                    </div>
                )
            }
        },
    ]



    // const showModal = () => {
    //     setIsModalOpen(true);
    // };
    const handleOk = () => {
        setIsModalOpen(false);

        //同步datasource
        setdataSource(dataSource.map(item => {
            if (item.id === currentId) {
                return {
                    ...item,
                    rights: currentRights
                }
            }
            return item
        }))

        //同步后端

        adminAxios.patch(`/roles/${currentId}/rights`, {
            rights: currentRights
        })
    };
    const handleCancel = () => {
        setIsModalOpen(false);
    };

    const onCheck = (checkedKeys) => {
        setcurrentRights(checkedKeys.checked)
        //console.log(checkedKeys);
    };

    return (
        <div>
            <Table dataSource={dataSource} columns={columns} pagination={{ pageSize: 5 }} rowKey={(item) => item.id}/*item.id充当key值*/ />

            <Modal title="权限分配" open={isModalOpen} onOk={handleOk} onCancel={handleCancel}>
                <Tree
                    checkable
                    checkedKeys={currentRights}
                    onCheck={onCheck}
                    checkStrictly={true}
                    treeData={rightList}
                />
            </Modal>

        </div>
    )
}
