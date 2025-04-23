import pkg from 'pg';
import fs from 'fs';
import dotenv from 'dotenv';


dotenv.config(); // 加载环境变量

const { Pool } = pkg;

// 创建连接池
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT, 10),
    database: 'NewsRecommender', // 默认数据库
});


// 测试连接
async function testConnection() {
    try {
        const res = await pool.query('SELECT NOW()');
        console.log('Database connected:', res.rows[0]);
    } catch (err) {
        console.error('Database connection error:', err);
    }
}

export { pool, testConnection };