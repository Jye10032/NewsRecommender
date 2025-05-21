import axios from 'axios'
import React, { useEffect, useState, useRef, useContext } from 'react'
import { DeleteOutlined, ExclamationCircleFilled } from '@ant-design/icons'
import { Table, Button, message, Modal, Input, Form } from 'antd'
const { confirm } = Modal
const EditableContext = React.createContext(null)

export default function NewsCategory() {
  const EditableRow = ({ index, ...props }) => {
    const [form] = Form.useForm()
    return (
      <Form
        form={form}
        component={false}
      >
        <EditableContext.Provider value={form}>
          <tr {...props} />
        </EditableContext.Provider>
      </Form>
    )
  }
  const EditableCell = ({ title, editable, children, dataIndex, record, handleSave, ...restProps }) => {
    const [editing, setEditing] = useState(false)
    const inputRef = useRef(null)
    const form = useContext(EditableContext)
    useEffect(() => {
      if (editing) {
        inputRef.current.focus()
      }
    }, [editing])
    const toggleEdit = () => {
      setEditing(!editing)
      form.setFieldsValue({
        [dataIndex]: record[dataIndex]
      })
    }
    const save = async () => {
      try {
        const values = await form.validateFields()
        toggleEdit()
        handleSave({
          ...record,
          ...values
        })
      } catch (errInfo) {
        console.log('Save failed:', errInfo)
      }
    }
    let childNode = children
    if (editable) {
      childNode = editing ? (
        <Form.Item
          style={{
            margin: 0
          }}
          name={dataIndex}
          rules={[
            {
              required: true,
              message: `${title} is required.`
            }
          ]}
        >
          <Input
            ref={inputRef}
            onPressEnter={save}
            onBlur={save}
          />
        </Form.Item>
      ) : (
        <div
          className="editable-cell-value-wrap"
          style={{
            paddingRight: 24
          }}
          onClick={toggleEdit}
        >
          {children}
        </div>
      )
    }
    return <td {...restProps}>{childNode}</td>
  }

  const [categoryList, setCategoryList] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const addForm = useRef()
  useEffect(() => {
    axios.get('/categories').then((res) => setCategoryList(res.data))
  }, [])
  // 删除前的确认框
  function confirmMethod(item) {
    confirm({
      title: '警告',
      icon: <ExclamationCircleFilled />,
      content: '是否删除该分类?',
      okText: '确认',
      cancelText: '取消',
      onOk() {
        deleteCateogry(item)
      },
      onCancel() {}
    })
  }
  // 删除分类
  function deleteCateogry(item) {
    let list = categoryList.filter((category) => {
      return category.id !== item.id
    })
    axios.delete(`/categories/${item.id}`).then(
      (res) => {
        setCategoryList([...list])
        message.success('删除成功')
      },
      (err) => {
        message.error('删除失败')
      }
    )
  }
  // 修改分类
  function handleSave(item) {
    axios
      .post(`/categories/${item.id}`, {
        title: item.title,
        value: item.title
      })
      .then(
        (res) => {
          axios.get('/categories').then((res) => setCategoryList(res.data))
          message.success('修改成功！')
        },
        (err) => message.error('修改失败！')
      )
  }
  // 添加分类
  function handleOk() {
    addForm.current.validateFields().then((info) => {
      axios
        .post('/categories', {
          title: info.title,
          value: info.title
        })
        .then(
          (res) => {
            message.success('添加成功！')
            axios.get('/categories').then((res) => setCategoryList(res.data))
            setIsModalOpen(false)
          },
          (err) => message.error('添加失败！请稍后再试')
        )
    })
  }
  // 取消添加分类
  function handleCancel() {
    addForm.current.resetFields()
    setIsModalOpen(false)
  }
  // table表格要渲染的数据
  const columns = [
    {
      title: 'Id',
      dataIndex: 'id'
    },
    {
      title: '栏目名称',
      dataIndex: 'title',
      onCell: (record) => ({
        record,
        editable: true,
        dataIndex: 'title',
        title: '栏目名称',
        handleSave
      })
    },
    {
      title: '操作',
      dataIndex: 'auditState',
      render: (_, item) => {
        return (
          <div>
            <Button
              danger
              shape="circle"
              icon={<DeleteOutlined />}
              onClick={() => {
                confirmMethod(item)
              }}
              style={{
                marginRight: '10px'
              }}
            />
          </div>
        )
      }
    }
  ]
  return (
    <div>
      <Button
        type="primary"
        style={{ marginBottom: '15px' }}
        onClick={() => {
          setIsModalOpen(true)
        }}
      >
        添加分类
      </Button>
      <Table
        components={{
          body: {
            row: EditableRow,
            cell: EditableCell
          }
        }}
        dataSource={categoryList}
        columns={columns}
        rowKey={(item) => {
          return item.id
        }}
        pagination={{
          pageSize: 5
        }}
      />
      <Modal
        title="添加分类"
        okText="添加"
        cancelText="取消"
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <Form ref={addForm}>
          <Form.Item
            label="分类名称"
            name="title"
            rules={[
              {
                required: true,
                message: '请输入分类!'
              }
            ]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
