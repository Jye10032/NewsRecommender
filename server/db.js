import express from 'express';
import { pool } from './connect.js'; // 导入数据库连接池

const db = express.Router();

// 新闻列表接口
db.get('/api/news', async (req, res) => {
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

// /// 增强的推荐新闻列表接口
// db.get('/api/news/recommended', async (req, res) => {
//     try {
//         const { userId } = req.query;

//         if (!userId) {
//             return res.status(400).json({ success: false, message: '用户ID不能为空' });
//         }

//         // 1. 获取用户信息和偏好
//         const userQuery = 'SELECT preferences FROM users WHERE user_id = $1';
//         const userResult = await pool.query(userQuery, [userId]);

//         if (userResult.rows.length === 0) {
//             return res.status(404).json({ success: false, message: '用户不存在' });
//         }

//         // 2. 获取候选新闻池
//         const newsPoolQuery = `
//             SELECT * FROM news 
//             ORDER BY publish_date DESC 
//             LIMIT 100
//         `;
//         const newsPoolResult = await pool.query(newsPoolQuery);
//         const newsPool = newsPoolResult.rows;

//         // 3. 使用模型获取个性化推荐
//         const recommendedNews = await recommender.getRecommendations(userId, newsPool);

//         // 4. 返回推荐结果
//         res.json({
//             success: true,
//             data: recommendedNews.slice(0, 20) // 返回前20条最相关的新闻
//         });
//     } catch (error) {
//         console.error('获取推荐新闻失败：', error);

//         // 如果模型推荐失败，回退到基于规则的推荐
//         try {
//             const userPreferences = userResult.rows[0].preferences || {};
//             let recommendedNewsQuery;

//             if (userPreferences.categories && userPreferences.categories.length > 0) {
//                 // 如果用户有偏好类别，按偏好获取新闻
//                 recommendedNewsQuery = `
//                     SELECT * FROM news 
//                     WHERE category = ANY($1) 
//                     ORDER BY publish_date DESC 
//                     LIMIT 20
//                 `;
//                 const result = await pool.query(recommendedNewsQuery, [userPreferences.categories]);
//                 res.json({ success: true, data: result.rows });
//             } else {
//                 // 如果用户没有偏好，提供一般推荐
//                 recommendedNewsQuery = `
//                     SELECT * FROM news 
//                     ORDER BY view_count DESC, publish_date DESC 
//                     LIMIT 20
//                 `;
//                 const result = await pool.query(recommendedNewsQuery);
//                 res.json({ success: true, data: result.rows });
//             }
//         } catch (fallbackError) {
//             res.status(500).json({ success: false, message: '服务器错误' });
//         }
//     }
// });



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