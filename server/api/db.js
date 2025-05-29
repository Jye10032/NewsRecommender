import express from 'express';
import { pool } from '../connect.js'; // 导入数据库连接池

const db = express.Router();

// 新闻列表接口
db.get('/api/news', async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const query = `
        SELECT news_id, category, subcategory, title, abstract,author, published_at, cover_image_url
        FROM news
        ORDER BY published_at DESC NULLS LAST
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

// 获取所有新闻分类和子分类
db.get('/api/categories', async (req, res) => {
    try {
        // 获取主分类
        const categoryQuery = `
            SELECT DISTINCT category 
            FROM news 
            WHERE category IS NOT NULL 
            ORDER BY category
        `;

        // 获取子分类
        const subcategoryQuery = `
            SELECT DISTINCT category, subcategory 
            FROM news 
            WHERE subcategory IS NOT NULL 
            ORDER BY category, subcategory
        `;

        const [categoryResult, subcategoryResult] = await Promise.all([
            pool.query(categoryQuery),
            pool.query(subcategoryQuery)
        ]);

        // 将结果组织成树形结构
        const categories = {};

        categoryResult.rows.forEach(row => {
            categories[row.category] = [];
        });

        subcategoryResult.rows.forEach(row => {
            if (categories[row.category]) {
                categories[row.category].push(row.subcategory);
            }
        });

        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error('获取新闻分类失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

// 获取特定分类的新闻
db.get('/api/news/category/:category', async (req, res) => {
    try {
        const { category } = req.params;
        const limit = parseInt(req.query.limit) || 20;
        const offset = parseInt(req.query.offset) || 0;

        const query = `
            SELECT * FROM news 
            WHERE category = $1 
            ORDER BY published_at DESC NULLS LAST  
            LIMIT $2 OFFSET $3
        `;
        const result = await pool.query(query, [category, limit, offset]);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('获取分类新闻失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

// 获取特定子分类的新闻
db.get('/api/news/category/:category/:subcategory', async (req, res) => {
    try {
        const { category, subcategory } = req.params;
        const limit = parseInt(req.query.limit) || 20;
        const offset = parseInt(req.query.offset) || 0;

        const query = `
            SELECT * FROM news 
            WHERE category = $1 AND subcategory = $2
            ORDER BY published_at DESC NULLS LAST
            LIMIT $3 OFFSET $4
        `;

        const result = await pool.query(query, [category, subcategory, limit, offset]);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('获取子分类新闻失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

// 热门新闻接口 - 放在参数路由前面！调整路由顺序，确保更具体的路由先于通用路由定义。
db.get('/api/news/trending', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const days = parseInt(req.query.days) || 7; // 添加一个时间范围筛选，默认获取最近7天的数据

        // 查询点击率最高的新闻
        const query = `
            SELECT n.news_id, n.title, n.category, n.subcategory, n.abstract, 
                COUNT(v.news_id) as click_count
            FROM news n
            LEFT JOIN news_views v ON n.news_id = v.news_id
            WHERE v.view_time > NOW() - INTERVAL '${days} days'
            GROUP BY n.news_id, n.title, n.category, n.subcategory, n.abstract
            ORDER BY click_count DESC
            LIMIT $1
        `;

        const result = await pool.query(query, [limit]);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('获取热门新闻失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

// 获取单个新闻详情
db.get('/api/news/:newsId', async (req, res) => {
    try {
        const { newsId } = req.params;
        const query = `
            SELECT news_id, category, subcategory, title, abstract, 
                   content, author, url, published_at, status, 
                   cover_image_url
            FROM news 
            WHERE news_id = $1
        `;
        const result = await pool.query(query, [newsId]);


        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '新闻不存在'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('获取新闻详情失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});


// router.get('/api/users', async (req, res) => {
//     try {
//         const { page = 1, limit = 10 } = req.query; // 默认值为1和10
//         const offset = (page - 1) * limit;

//         const query = ` 
//             SELECT user_id,username,password
//             FROM users
//             LIMIT $1 OFFSET $2
//         `;

//         const result = await pool.query(query, [limit, offset]);
//         const countResult = await pool.query('SELECT COUNT(*) FROM users');

//         res.json({
//             total: parseInt(countResult.rows[0].count),
//             page: parseInt(page),
//             limit: parseInt(limit),
//             data: result.rows
//         });
//     } catch (err) {
//         console.error('Error fetching users:', err);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// })


export default db;