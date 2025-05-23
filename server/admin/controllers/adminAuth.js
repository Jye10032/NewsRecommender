import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../../connect.js';

// 管理员登录
export const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // 查询管理员用户 - 使用query而不是execute
        // 查询用户，包括角色和分类信息
        const userResult = await pool.query(`
            SELECT u.*, r.role_name, r.role_code, c.name as category_name
            FROM admin_users u
            LEFT JOIN roles r ON u.role_id = r.id
            LEFT JOIN categories c ON u.category_id = c.id
            WHERE u.username = $1
        `, [username]);

        if (userResult.rows.length === 0) {
            return res.status(401).json({ success: false, message: '用户名或密码错误' });
        }

        const admin = userResult.rows[0];


        // 验证密码
        res.json({
            success: true,
            message: '登录成功',
            token: token,
            id: admin.id,
            username: admin.username,
            role: {
                id: admin.role_id,
                roleName: admin.role_name,
                roleCode: admin.role_code
            },
            category_id: admin.category_id,
            category: admin.category_id ? {
                id: admin.category_id,
                name: admin.category_name
            } : null
        });

        // 返回成功响应
        return res.json({
            success: true,
            message: '登录成功',
            token: token,
            id: admin.id,
            username: admin.username,
            role: {
                id: admin.role_id,
                roleName: admin.role_name,
                roleCode: admin.role_code
            },
            category_id: admin.category_id,
            category: admin.category_id ? {
                id: admin.category_id,
                name: admin.category_name
            } : null
        });

    } catch (error) {
        console.error('登录失败:', error);
        return res.status(500).json({
            success: false,
            message: '服务器错误，请稍后再试'
        });
    }
};