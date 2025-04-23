import express from 'express';
import bcrypt from 'bcrypt';
import { pool } from './connect.js'; // 引入数据库连接池

const router = express.Router();


// 登录接口
router.post('/api/login', async (req, res) => {


    const { username, password } = req.body;

    // 检查用户名和密码是否为空
    if (!username || !password) {
        return res.status(400).json({ success: false, message: '用户名和密码不能为空！' });
    }

    try {
        // 查询用户信息
        const userQuery = 'SELECT * FROM users WHERE username = $1';
        const userResult = await pool.query(userQuery, [username]);

        if (userResult.rows.length === 0) {
            return res.status(400).json({ success: false, message: '用户名不存在！' });
        }

        const user = userResult.rows[0];

        // 验证密码
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ success: false, message: '密码错误！' });
        }

        // 登录成功
        res.status(200).json({ success: true, message: '登录成功！' });
    } catch (error) {
        console.error('登录失败：', error);
        res.status(500).json({ success: false, message: '登录失败，请稍后再试！' });
    }
});

// 注册接口
router.post('/api/register', async (req, res) => {
    const { username, password } = req.body;

    // 检查用户名和密码是否为空
    if (!username || !password) {
        return res.status(400).json({ success: false, message: '用户名和密码不能为空！' });
    }

    try {
        // 检查用户名是否已存在
        const userCheckQuery = 'SELECT * FROM users WHERE username = $1';
        const userCheckResult = await pool.query(userCheckQuery, [username]);

        if (userCheckResult.rows.length > 0) {
            return res.status(400).json({ success: false, message: '用户名已存在！' });
        }

        // 使用 bcrypt 加密密码
        const hashedPassword = await bcrypt.hash(password, 10); // 10 是加密强度

        // 插入用户信息到数据库
        const insertUserQuery = `
            INSERT INTO users (user_id, username, password)
            VALUES ($1, $2, $3)
        `;
        await pool.query(insertUserQuery, [username, username, hashedPassword]);

        res.status(201).json({ success: true, message: '注册成功！' });
    } catch (error) {
        console.error('注册失败：', error);
        res.status(500).json({ success: false, message: '注册失败，请稍后再试！' });
    }
});

export default router;