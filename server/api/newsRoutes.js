import express from 'express';
import { pool } from '../connect.js'; // 引入数据库连接池


const router = express.Router();
// 记录新闻点击
router.post('/api/news/view/:newsId', async (req, res) => {
    try {
        const { newsId } = req.params;
        let userId = null;

        // 获取用户ID（如果已登录）
        if (req.user) {
            userId = req.user.id;
        }

        // 获取IP地址
        const ipAddress = req.headers['x-forwarded-for'] ||
            req.connection.remoteAddress;

        // 防止重复点击：同一用户/IP在短时间内对同一新闻的多次点击只计一次
        const checkQuery = userId
            ? 'SELECT * FROM news_views WHERE news_id = $1 AND user_id = $2 AND view_time > NOW() - INTERVAL \'5 minutes\''
            : 'SELECT * FROM news_views WHERE news_id = $1 AND ip_address = $2 AND view_time > NOW() - INTERVAL \'5 minutes\'';

        const checkParams = userId ? [newsId, userId] : [newsId, ipAddress];
        const checkResult = await pool.query(checkQuery, checkParams);

        if (checkResult.rows.length > 0) {
            return res.json({
                success: true,
                message: '最近已记录过此点击'
            });
        }

        // 记录新点击
        await pool.query(
            'INSERT INTO news_views (news_id, user_id, ip_address) VALUES ($1, $2, $3)',
            [newsId, userId, ipAddress]
        );

        res.json({
            success: true,
            message: '点击已记录'
        });
    } catch (error) {
        console.error('记录点击失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

export default router;