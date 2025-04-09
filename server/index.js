import fs from 'fs/promises';
import pkg from 'pg';

const { Client } = pkg;

import { pool, testConnection } from './db.js'; // 导入测试连接函数

import express from 'express';

const app = express();
const PORT = 3000; // 设置后端服务的端口


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


// 测试数据库连接的 API
app.get('/api/test-db', async (req, res) => {
    try {
        const resDb = await pool.query('SELECT NOW()');
        res.json({ message: 'Database connected successfully', time: resDb.rows[0] });
    } catch (err) {
        console.error('Database connection error:', err);
        res.status(500).json({ error: 'Failed to connect to the database' });
    }
});


// 启动服务器
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});