import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../../connect.js';

// 管理员登录
export const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // 查询管理员用户 - 使用query而不是execute
        const usersResult = await pool.query(
            'SELECT * FROM admin_users WHERE username = $1 AND status = 1',
            [username]
        );

        // PostgreSQL返回结果在rows属性中
        const users = usersResult.rows;

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: '用户名或密码错误'
            });
        }

        const user = users[0];

        // 验证密码
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: '用户名或密码错误'
            });
        }

        // 获取用户角色和权限
        const rolesResult = await pool.query(`
      SELECT r.* FROM roles r
      JOIN admin_user_roles aur ON r.id = aur.role_id
      WHERE aur.admin_user_id = $1
    `, [user.id]);

        // PostgreSQL结果在rows属性中
        const roles = rolesResult.rows;

        // 获取权限
        const permissions = [];
        if (roles.length > 0) {
            const roleIds = roles.map(r => r.id);

            // 使用参数化查询代替字符串拼接
            const placeholders = roleIds.map((_, i) => `$${i + 1}`).join(',');

            const permsResult = await pool.query(`
        SELECT p.permission_code FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        WHERE rp.role_id IN (${placeholders})
      `, roleIds);

            permissions.push(...permsResult.rows.map(p => p.permission_code));
        }

        // 更新最后登录时间
        await pool.query(
            'UPDATE admin_users SET last_login = NOW() WHERE id = $1',
            [user.id]
        );

        // 生成JWT令牌
        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                roles: roles.map(r => r.role_code),
                permissions
            },
            process.env.JWT_SECRET || 'your_jwt_secret_key', // 添加默认密钥，但生产环境应当使用环境变量
            { expiresIn: '1d' }
        );

        // 返回成功响应
        return res.json({
            success: true,
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                role: roles.map(r => r.role_name).join(',')
            }
        });

    } catch (error) {
        console.error('登录失败:', error);
        return res.status(500).json({
            success: false,
            message: '服务器错误，请稍后再试'
        });
    }
};