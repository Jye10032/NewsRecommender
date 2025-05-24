import { pool } from '../../connect.js';

async function updateAllNewsToPublished() {
    try {
        console.log('开始将所有新闻设置为已发布状态...');

        // 更新所有新闻的状态为2（已发布）
        const updateResult = await pool.query(`
            UPDATE news
            SET status = 2,
                published_at = COALESCE(published_at, CURRENT_TIMESTAMP)
            WHERE status != 2
            RETURNING news_id, title
        `);

        console.log(`已更新 ${updateResult.rowCount} 条新闻为已发布状态:`);
        updateResult.rows.forEach(news => {
            console.log(`ID: ${news.news_id}, 标题: ${news.title}`);
        });

        console.log('所有新闻已成功设置为已发布状态!');
    } catch (error) {
        console.error('更新新闻状态失败:', error);
    } finally {
        await pool.end();
    }
}

updateAllNewsToPublished();