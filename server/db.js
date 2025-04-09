import pkg from 'pg';

const { Pool } = pkg;

// 创建连接池
const pool = new Pool({
    user: 'postgres',          // 数据库用户名
    host: 'localhost',         // 数据库地址
    database: 'NewsRecommender', // 数据库名称
    password: '123456',  // 数据库密码
    port: 5432,                // PostgreSQL 默认端口
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