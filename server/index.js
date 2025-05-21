import fs from 'fs/promises';
import pkg from 'pg';
import dotenv from 'dotenv';
import { pool, testConnection } from './connect.js'; // 导入测试连接函数
import express from 'express';
import { corsMiddleware } from './cors.js';
import newsdb from './api/db.js'; // 引入新闻路由
import loginRoutes from './api/loginRoutes.js'; // 引入登录路由
import userRoutes from './api/userRoutes.js'; // 引入用户路由
import newsViewRoutes from './api/newsRoutes.js'; // 引入新闻点击记录路由
import { getRecommendations } from './controllers/recommendController.js';

import { verifyToken } from './middleware/auth.js'; // 引入验证中间件s

const { Pool } = pkg;

const { Client } = pkg;

import adminRoutes from './admin/routes/adminRoutes.js'; // 引入管理员API路由



const app = express();
const PORT = 3001; // 设置后端服务的端口

// 使用 dotenv 加载环境变量
dotenv.config();




async function initializeDatabase() {
    const client = new Client({
        user: process.env.DB_USER || 'default_user', // 如果环境变量不存在，使用默认值
        host: process.env.DB_HOST || 'localhost',
        password: process.env.DB_PASSWORD || 'default_password',
        port: parseInt(process.env.DB_PORT, 10) || 5432,
        database: process.env.DB_NAME || 'postgres', // 默认数据库
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


        // await targetClient.connect();
        // const sql = await fs.readFile('./init.sql', 'utf-8');
        // await targetClient.query(sql);
        // console.log('Tables initialized successfully');
        // await targetClient.end();
    } catch (err) {
        console.error('Error initializing database:', err);
    }

    const targetClient = new Client({
        user: process.env.DB_USER || 'default_user',
        host: process.env.DB_HOST || 'localhost',
        password: process.env.DB_PASSWORD || 'default_password',
        port: parseInt(process.env.DB_PORT, 10) || 5432,
        database: process.env.DB_NAME || 'NewsRecommender', // 目标数据库
    });

    try {
        await targetClient.connect();

        //初始化表结构
        const sql = await fs.readFile('./init.sql', 'utf-8');
        await targetClient.query(sql);
        console.log('Tables initialized successfully');

        //初始化管理员表
        const adminsql = await fs.readFile('./admin/init-admin.sql', 'utf-8');
        await targetClient.query(adminsql);
        console.log('Admin tables initialized successfully');

        //初始化管理员数据
        const initAdmin = await import('./init-admin.js');
        await initAdmin.default(targetClient);

        console.log('Connected to target database successfully');

    } catch (err) {
        console.error('Error connecting to target database:', err);
    } finally {
        await targetClient.end();
    }


    await testConnection(); // 调用测试连接函数
}

initializeDatabase();

app.use(corsMiddleware); // 使用 CORS 中间件
app.use(express.json()); // 解析 JSON 请求体


// 新闻列表接口
// ...existing code...
//待修改：
// 1. 考虑添加适当的排序
// 2. 根据实际需求选择返回的字段
// 3. 如果数据量很大，建议还是实现分页或流式加载
// 4. 可以考虑添加缓存机制
// 5. 考虑添加安全措施，使用jwt等进行身份验证和授权
// 6. 考虑使用更好的错误处理机制，返回更友好的错误信息


// 使用新闻路由
app.use('/', newsdb);
app.use('/', loginRoutes);
// 添加用户路由
app.use('/api', userRoutes);
// 使用新闻点击记录路由
app.use('/', newsViewRoutes);
// 定义推荐路由
app.get('/api/recommendations', verifyToken, getRecommendations);
// 管理员API路由
app.use('/admin', adminRoutes);

// 启动服务器
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});