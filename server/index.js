import fs from 'fs/promises';
import pkg from 'pg';

const { Client } = pkg;

import { pool, testConnection } from './db.js'; // 导入测试连接函数

import express from 'express';
import { corsMiddleware } from './cors.js';

const app = express();
const PORT = 3001; // 设置后端服务的端口


async function initializeDatabase() {
    // 连接到默认数据库（postgres）
    const client = new Client({
        user: 'postgres',
        host: 'localhost',
        password: '123456',
        port: 5432,
        database: 'postgres', // 默认数据库
    });

    try {
        await client.connect();

        // 检查数据库是否存在
        const dbCheckResult = await client.query(
            "SELECT 1 FROM pg_database WHERE datname = 'NewsRecommender';"
        );

        // 如果数据库不存在，则创建
        if (dbCheckResult.rowCount === 0) {
            await client.query('CREATE DATABASE "NewsRecommender";');
            console.log('Database "NewsRecommender" created successfully');
        } else {
            console.log('Database "NewsRecommender" already exists');
        }

        await client.end();

        // 连接到目标数据库并执行 init.sql
        const targetClient = new Client({
            user: 'postgres',
            host: 'localhost',
            password: '123456',
            port: 5432,
            database: 'NewsRecommender', // 切换到目标数据库
        });
        // await targetClient.connect();
        // const sql = await fs.readFile('./init.sql', 'utf-8');
        // await targetClient.query(sql);
        // console.log('Tables initialized successfully');
        // await targetClient.end();
    } catch (err) {
        console.error('Error initializing database:', err);
    }

    await testConnection(); // 调用测试连接函数
}

initializeDatabase();

app.use(corsMiddleware); // 使用 CORS 中间件

// // 测试数据库连接的 API
// app.get('/api/test-db', async (req, res) => {
//     try {
//         const resDb = await pool.query('SELECT NOW()');
//         res.json({ message: 'Database connected successfully', time: resDb.rows[0] });
//     } catch (err) {
//         console.error('Database connection error:', err);
//         res.status(500).json({ error: 'Failed to connect to the database' });
//     }
// });


// 新闻列表接口
// ...existing code...
//待修改：
// 1. 考虑添加适当的排序
// 2. 根据实际需求选择返回的字段
// 3. 如果数据量很大，建议还是实现分页或流式加载
// 4. 可以考虑添加缓存机制
// 5. 考虑添加安全措施，使用jwt等进行身份验证和授权
// 6. 考虑使用更好的错误处理机制，返回更友好的错误信息


app.get('/api/news', async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const query = `
            SELECT news_id, category, subcategory, title, abstract 
            FROM news 
            LIMIT $1 OFFSET $2
        `;

        const result = await pool.query(query, [limit, offset]);
        const countResult = await pool.query('SELECT COUNT(*) FROM news');

        res.json({
            total: parseInt(countResult.rows[0].count),
            page: parseInt(page),
            limit: parseInt(limit),
            data: result.rows
        });
    } catch (err) {
        console.error('Error fetching news:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});