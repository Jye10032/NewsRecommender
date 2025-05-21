import React, { useState, useEffect } from 'react'
import { Table, Tag, Button, Modal, Popover, Switch } from 'antd'
import { DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { ExclamationCircleFilled } from '@ant-design/icons';
import axios from 'axios'

const { confirm } = Modal;

export default function RightList() {
    const [dataSource, setdataSource] = useState([])

    useEffect(() => {
        axios.get("/rights?_embed=children").then(res => {
            const list = res.data
            list.forEach(item => {
                if (item.children.length === 0) {
                    item.children = ""
                }
            })
            setdataSource(list)
        })
    }, [])

    const [modal, contextHolder] = Modal.useModal();




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
            title: '权限名称',
            dataIndex: 'title',
        },
        {
            title: '权限路径',
            dataIndex: 'key',
            //key: 'address',
            render: (key) => {
                return <Tag color="orange">{key}</Tag>
            }
        },
        {
            title: '操作',
            //key: 'age',

            render: (item) => {
                return <div>
                    <Button danger shape="circle" icon={<DeleteOutlined />}
                        onClick={() => showConfirm(item)} />
                    <Popover content={<div style={{ textAlign: "center" }}>
                        <Switch checked={item.pagepermisson} onChange={() => switchMethod(item)}></Switch>
                    </div>} title="配置项" trigger={item.pagepermisson === undefined ? '' : 'click'}>
                        <Button type="primary" shape="circle" icon={<EditOutlined />} disabled={item.pagepermisson === undefined} />
                    </Popover>

                </div>
            }
        },
    ];

    const switchMethod = (item) => {
        item.pagepermisson = Number(!item.pagepermisson)
        setdataSource([...dataSource])
        //console.log(item)
        if (item.grade === 1) {
            axios.patch(`/rights/${item.id}`, {
                pagepermisson: item.pagepermisson
                //console.log(res.data)
            })
        } else {
            axios.patch(`/children/${item.id}`, {
                pagepermisson: item.pagepermisson
                //console.log(res.data)
            })
        }
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


    //删除
    const deleteMethod = (item) => {//实现当前页面同步状态+后端同步删除
        //console.log("delete")
        if (item.grade === 1) {//如果是一级，直接删除

            //遍历data，找到id相同的项，删除
            setdataSource(dataSource.filter(data => data.id !== item.id))

            axios.delete(`/rights/${item.id}`).then(res => {
                //console.log(res.data)
            })
        } else {//否则，找到父级，删除父级的children中的项

            //找到父级
            let list = dataSource.filter(data => data.id === item.rightId)

            //删除父级的children中的项
            list[0].children = list[0].children.filter(data => data.id !== item.id)

            //实现页面同步
            setdataSource([...dataSource])

            //更新后端数据
            axios.delete(`/children/${item.id}`).then(res => {
                //console.log(res.data)
            })
        }

    }

    return (
        <div>

            <Table dataSource={dataSource} columns={columns}
                pagination={{ pageSize: 5 }} />
        </div>
    )
}
