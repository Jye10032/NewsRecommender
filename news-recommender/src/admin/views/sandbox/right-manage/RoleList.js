import React, { useState, useEffect } from 'react'
import { Table, Button, Modal, Tree } from 'antd'
import { DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { ExclamationCircleFilled } from '@ant-design/icons';
import axios from 'axios'
import RightList from './RightList';

const { confirm } = Modal;

export default function RoleList() {

    const [dataSource, setdataSource] = useState([])
    const [rightList, setRightList] = useState([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [currentRights, setcurrentRights] = useState([])
    const [currentId, setcurrentId] = useState([])


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

    //删除
    const deleteMethod = (item) => {//实现当前页面同步状态+后端同步删除
        //console.log("delete")
        setdataSource(dataSource.filter(data => data.id !== item.id))

        axios.delete(`http://localhost:8000/roles/${item.id}`).then(res => {
            //console.log(res.data)
        })

    }


    useEffect(() => {
        axios.get("http://localhost:8000/roles").then(res => {
            setdataSource(res.data)
        })

    }, [])

    useEffect(() => {
        axios.get("http://localhost:8000/rights?_embed=children").then(res => {
            setRightList(res.data)
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

        axios.patch(`http://localhost:8000/roles/${currentId}`, {
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
