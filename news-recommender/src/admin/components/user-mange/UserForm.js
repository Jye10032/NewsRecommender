import React, { forwardRef, useState, useEffect } from 'react'
import { Form, Input, Select } from 'antd'
const { Option } = Select

const UserForm = forwardRef((props, ref) => {
  const [form] = Form.useForm()
  const [isDisabled, setIsDisabled] = useState()
  const rank = {
    1: 'superAdmin',
    2: 'admin',
    3: 'editor'
  }
  useEffect(() => {
    // 若打开的是超级管理员的编辑对话框，不使用下列方法会导致分类可选框可选
    setIsDisabled(props.isSelectDisabled)
  }, [props])
  // 选择角色的回调函数
  function handleSetRole(value) {
    if (value === 1) {
      setIsDisabled(true)
      ref.current.setFieldsValue({
        category_id: null
      })
    } else {
      setIsDisabled(false)
    }
  }
  // 根据登录用户的权限来显示可选的分类
  function checkCategoryDisable(item) {
    const { roleId, category_id } = JSON.parse(localStorage.getItem('adminToken'))
    // 若打开的是编辑对话框
    if (props.isUpdate) {
      // 除超级管理员，其他角色不能进行其他分类选择
      if (rank[roleId] === 'superAdmin') {
        return false
      } else {
        return true
      }
    } else {
      // 若打开的是添加对话框，除超级管理员，其他角色只能选择自己所在分类
      if (rank[roleId] === 'superAdmin') {
        return false
      } else {
        return item.id !== category_id
      }
    }
  }
  // 根据登录用户的权限来显示可选的角色
  function checkRoleDisable(item) {
    const { roleId } = JSON.parse(localStorage.getItem('adminToken'))
    // 若打开的是编辑对话框
    if (props.isUpdate) {
      // 除超级管理员，其他角色只不能修改角色
      if (rank[roleId] === 'superAdmin') {
        return false
      } else {
        return true
      }
    } else {
      // 若打开的是添加对话框，除超级管理员，其他角色只能选择比自己低一级的角色（即只分类管理员能选分类编辑，分类编辑什么也不能选）
      if (rank[roleId] === 'superAdmin') {
        return false
      } else {
        return rank[item.id] !== 'editor'
      }
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
              message: '请输入用户名！'
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
              message: '请输入密码！'
            }
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="category_id"
          label="分类"
          rules={
            isDisabled
              ? []
              : [
                {
                  required: true,
                  message: '请选择分类！'
                }
              ]
          }
        >
          <Select disabled={isDisabled}>
            {props.categoryList?.map((category) => {
              return (
                <Option
                  key={category.id}
                  value={category.id}
                  disabled={checkCategoryDisable(category)}
                >
                  {category.name}
                </Option>
              )
            })}
          </Select>
        </Form.Item>
        <Form.Item
          name="roleId"
          label="角色"
          rules={[
            {
              required: true,
              message: '请选择角色！'
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