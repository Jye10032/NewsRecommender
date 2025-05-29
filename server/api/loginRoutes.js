import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../connect.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev_fallback_secret_key';

// 登录接口
router.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    // 检查用户名和密码是否为空
    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: 'Username and password are required',
            errorCode: 'MISSING_FIELDS'
        });
    }

    try {
        // 查询用户信息
        const userQuery = 'SELECT * FROM users WHERE username = $1';
        const userResult = await pool.query(userQuery, [username]);

        if (userResult.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Username does not exist',
                errorCode: 'USER_NOT_FOUND'
            });
        }

        const user = userResult.rows[0];

        // 验证密码
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Incorrect password',
                errorCode: 'INVALID_PASSWORD'
            });
        }

        // 检查账户状态（可选，如果您有账户状态字段）
        if (user.status === 'locked') {
            return res.status(403).json({
                success: false,
                message: 'Your account has been locked. Please contact support.',
                errorCode: 'ACCOUNT_LOCKED'
            });
        }

        // 登录成功后生成令牌
        const token = jwt.sign(
            { id: user.user_id, username: user.username },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // 返回令牌和用户信息
        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                userId: user.user_id,
                username: user.username
            }
        });
    } catch (error) {
        console.error('Login failed:', error);
        res.status(500).json({
            success: false,
            message: 'Server error, please try again later',
            errorCode: 'SERVER_ERROR',
            detail: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// 注册接口
router.post('/api/register', async (req, res) => {
    const { username, password } = req.body;

    // 检查用户名和密码是否为空
    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: 'Username and password are required',
            errorCode: 'MISSING_FIELDS'
        });
    }

    // 验证密码强度
    if (password.length < 6) {
        return res.status(400).json({
            success: false,
            message: 'Password must be at least 6 characters long',
            errorCode: 'WEAK_PASSWORD'
        });
    }

    try {
        // 检查用户名是否已存在
        const userCheckQuery = 'SELECT * FROM users WHERE username = $1';
        const userCheckResult = await pool.query(userCheckQuery, [username]);

        if (userCheckResult.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Username already exists',
                errorCode: 'USERNAME_TAKEN'
            });
        }

        // 使用 bcrypt 加密密码
        const hashedPassword = await bcrypt.hash(password, 10);

        // 插入用户信息到数据库
        const insertUserQuery = `
            INSERT INTO users (user_id, username, password)
            VALUES ($1, $2, $3)
        `;
        await pool.query(insertUserQuery, [username, username, hashedPassword]);

        res.status(201).json({
            success: true,
            message: 'Registration successful'
        });
    } catch (error) {
        console.error('Registration failed:', error);
        res.status(500).json({
            success: false,
            message: 'Server error, please try again later',
            errorCode: 'SERVER_ERROR',
            detail: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

export default router;