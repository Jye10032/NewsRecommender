import express from 'express';
import { pool } from '../../connect.js';
import bcrypt from 'bcrypt';
import { verifyAdminToken as authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// 所有用户路由都需要身份验证
router.use(authMiddleware);

// 获取带有角色信息的用户列表
router.get('/users/with-roles', async (req, res) => {
    try {
        // 执行JOIN查询，获取用户及其对应的角色
        const result = await pool.query(`
            SELECT u.id, u.username, u.email, u.role_id, u.status, u.category_id, u.created_at, u.last_login,
                r.role_name, r.role_code,
                c.name as category_name, c.code as category_code
            FROM admin_users u
            LEFT JOIN roles r ON u.role_id = r.id
            LEFT JOIN categories c ON u.category_id = c.id
            ORDER BY u.id
        `);

        // 转换结果为前端期望的格式
        const usersWithRoles = result.rows.map(user => ({
            id: user.id,
            username: user.username,
            email: user.email,
            roleState: user.status === 1,
            default: user.id === 1,
            category: user.category_id ? {
                id: user.category_id,
                name: user.category_name,
                code: user.category_code
            } : null,
            createdAt: user.created_at,
            lastLogin: user.last_login,
            role: {
                id: user.role_id,
                roleName: user.role_name,
                roleCode: user.role_code
            }
        }));

        res.json(usersWithRoles);
    } catch (error) {
        console.error('获取用户列表失败:', error);
        res.status(500).json({ success: false, message: '获取用户列表失败' });
    }
});

// 获取区域列表
router.get('/categories/main', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT * FROM categories 
            WHERE level = 1 
            ORDER BY sort_order, name
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('获取主分类失败:', error);
        res.status(500).json({ success: false, message: '获取主分类失败' });
    }
});

// 获取角色列表
router.get('/roles', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM roles ORDER BY id');

        // 转换字段名以匹配前端期望
        const formattedRoles = result.rows.map(role => ({
            id: role.id,
            roleName: role.role_name,
            roleCode: role.role_code,
            rights: role.rights || []
        }));

        res.json(formattedRoles);
    } catch (error) {
        console.error('获取角色列表失败:', error);
        res.status(500).json({ success: false, message: '获取角色列表失败' });
    }
});
// 添加新用户
router.post('/users', async (req, res) => {
    try {
        // 将region替换为category_id
        const { username, password, email, role_id, category_id } = req.body;

        // 检查用户名是否已存在
        const checkUser = await pool.query('SELECT * FROM admin_users WHERE username = $1', [username]);
        if (checkUser.rows.length > 0) {
            return res.status(400).json({ success: false, message: '用户名已存在' });
        }

        // 加密密码
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // 插入新用户
        const result = await pool.query(
            `INSERT INTO admin_users (username, password, email, role_id, category_id, status, created_at)
            VALUES ($1, $2, $3, $4, $5, 1, NOW()) RETURNING id, username, email, role_id, category_id, status`,
            [username, hashedPassword, email, role_id, category_id]
        );

        // 其他代码保持不变...
    } catch (error) {
        console.error('创建用户失败:', error);
        res.status(500).json({ success: false, message: '创建用户失败' });
    }
});

// 更新用户信息
router.patch('/users/:id', async (req, res) => {
    try {
        // ... 其他代码保持不变

        // 获取更新后的用户信息
        const userResult = await pool.query(`
            SELECT u.id, u.username, u.email, u.role_id, u.status, u.category_id,
                r.role_name, r.role_code,
                c.name as category_name
            FROM admin_users u
            LEFT JOIN roles r ON u.role_id = r.id
            LEFT JOIN categories c ON u.category_id = c.id
            WHERE u.id = $1
        `, [id]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: '用户不存在' });
        }

        const user = userResult.rows[0];

        res.json({
            success: true,
            message: '用户更新成功',
            data: {
                id: user.id,
                username: user.username,
                email: user.email,
                roleState: user.status === 1,
                category: user.category_id ? {
                    id: user.category_id,
                    name: user.category_name
                } : null,
                role: {
                    id: user.role_id,
                    roleName: user.role_name,
                    roleCode: user.role_code
                }
            }
        });
    } catch (error) {
        console.error('更新用户失败:', error);
        res.status(500).json({ success: false, message: '更新用户失败' });
    }
});

// 更新用户状态（启用/禁用）
router.patch('/users/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        // 接收 roleState 参数而不是 status
        const { roleState } = req.body;

        // 更新用户状态
        await pool.query('UPDATE admin_users SET status = $1, updated_at = NOW() WHERE id = $2',
            [roleState ? 1 : 0, id]);

        res.json({
            success: true,
            message: `用户已${roleState ? '启用' : '禁用'}`
        });
    } catch (error) {
        console.error('更新用户状态失败:', error);
        res.status(500).json({ success: false, message: '更新用户状态失败' });
    }
});

// 删除用户
router.delete('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // 检查是否为默认管理员
        const checkResult = await pool.query('SELECT id FROM admin_users WHERE id = $1', [id]);
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: '用户不存在' });
        }

        if (id === '1') {
            return res.status(403).json({ success: false, message: '不能删除默认管理员' });
        }

        // 删除用户
        await pool.query('DELETE FROM admin_users WHERE id = $1', [id]);

        res.json({
            success: true,
            message: '用户删除成功'
        });
    } catch (error) {
        console.error('删除用户失败:', error);
        res.status(500).json({ success: false, message: '删除用户失败' });
    }
});

export default router;