import { pool } from '../connect.js'; // 假设使用PostgreSQL
import axios from 'axios';

// 推荐服务URL
const RECOMMEND_SERVICE_URL = process.env.RECOMMEND_SERVICE_URL || 'http://127.0.0.1:5001';

export const getRecommendations = async (req, res) => {

    const count = parseInt(req.query.count || 10);

    try {
        ///const { userId } = req.query;
        // 验证参数
        // if (!userId) {
        // return res.status(400).json({
        //         success: false,
        //         message: '缺少用户ID参数'
        //     });
        // }
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: '未授权访问'
            });
        }

        const userId = req.user.id;
        console.log(`为用户 ${userId} 获取个性化推荐`);

        // 1. 从数据库获取最近的新闻作为候选池
        const newsQuery = `
            SELECT news_id, category, subcategory, title, abstract, url, published_at
            FROM news
            -- WHERE published_at >= NOW() - INTERVAL '30 days'
            ORDER BY published_at DESC
            LIMIT 100
        `;
        const newsResult = await pool.query(newsQuery);
        const newsPool = newsResult.rows;

        if (newsPool.length === 0) {
            return res.json({
                success: true,
                recommendations: [],
                message: '没有可推荐的新闻'
            });
        }
        // // 在调用Python服务前，获取用户历史浏览记录
        // const userHistoryQuery = `
        //     SELECT n.* 
        //     FROM news n
        //     JOIN user_behaviors ub ON n.news_id = ub.news_id
        //     WHERE ub.user_id = $1 AND ub.action_type = 'view'
        //     ORDER BY ub.created_at DESC
        //     LIMIT 50
        // `;

        // const historyResult = await pool.query(userHistoryQuery, [userId]);
        // const userHistory = historyResult.rows;

        // console.log(`获取用户 ${userId} 的历史记录: ${userHistory.length} 条`);

        // 2. 调用Python推荐服务
        console.log(`调用推荐服务 ${RECOMMEND_SERVICE_URL}/recommend`);
        const response = await axios.post(`${RECOMMEND_SERVICE_URL}/recommend`, {
            userId,
            newsPool,
            // userHistory,// 添加用户历史记录
            count
        }, {
            timeout: 5000  // 5秒超时
        });

        // 3. 处理推荐结果
        if (response.data && response.data.success) {
            console.log(`为用户 ${userId} 生成了 ${response.data.recommendations.length} 条推荐`);

            // // 记录推荐日志
            // try {
            //     await pool.query(
            //         `INSERT INTO recommendation_logs 
            //          (user_id, recommendation_count, created_at)
            //          VALUES ($1, $2, NOW())`,
            //         [userId, response.data.recommendations.length]
            //     );
            // } catch (logErr) {
            //     console.error('记录推荐日志失败:', logErr);
            // }

            return res.json({
                success: true,
                recommendations: response.data.recommendations
            });
        } else {
            throw new Error('推荐服务返回失败结果');
        }
    } catch (error) {
        console.error('获取推荐失败:', error.message);

        // 尝试提供基于流行度的降级推荐
        try {
            // 按阅读量排序的热门新闻
            const fallbackQuery = `
                SELECT n.* FROM news n
                ORDER BY published_at DESC
                LIMIT $1
            `;

            const fallbackResult = await pool.query(fallbackQuery, [count]);

            return res.json({
                success: true,
                recommendations: fallbackResult.rows,
                message: '使用热门新闻作为推荐',
                isFallback: true
            });
        } catch (fallbackError) {
            console.error('降级推荐也失败了:', fallbackError);

            return res.status(500).json({
                success: false,
                message: '无法获取推荐'
            });
        }
    }
};

// // 记录用户对新闻的行为
// exports.recordUserBehavior = async (req, res) => {
//     try {
//         const { userId, newsId, actionType, duration } = req.body;

//         // 验证参数
//         if (!userId || !newsId || !actionType) {
//             return res.status(400).json({
//                 success: false,
//                 message: '缺少必要参数'
//             });
//         }

//         // 记录用户行为
//         await pool.query(
//             `INSERT INTO user_behaviors
//              (user_id, news_id, action_type, duration, created_at)
//              VALUES ($1, $2, $3, $4, NOW())`,
//             [userId, newsId, actionType, duration || 0]
//         );

//         res.json({
//             success: true,
//             message: '用户行为记录成功'
//         });

//     } catch (error) {
//         console.error('记录用户行为失败:', error);
//         res.status(500).json({
//             success: false,
//             message: '服务器错误'
//         });
//     }
// };