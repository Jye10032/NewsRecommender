import { pool } from '../../connect.js';

async function removeDuplicateNews() {
    const client = await pool.connect();

    try {
        console.log('开始删除重复新闻...');
        await client.query('BEGIN');

        // 查询数据库中的记录总数
        const countBefore = await client.query('SELECT COUNT(*) FROM news');
        console.log(`删除前总记录数: ${countBefore.rows[0].count}`);

        // 创建临时表存储要保留的记录
        await client.query(`
      CREATE TEMP TABLE news_to_keep AS
      WITH ranked_news AS (
        SELECT 
          news_id,
          title,
          url,
          ROW_NUMBER() OVER (
            PARTITION BY title, url 
            ORDER BY created_at DESC
          ) AS rn
        FROM news
      )
      SELECT news_id FROM ranked_news WHERE rn = 1
    `);

        // 删除重复记录
        const deleteResult = await client.query(`
      DELETE FROM news 
      WHERE news_id NOT IN (SELECT news_id FROM news_to_keep)
    `);

        // 查询删除后的记录总数
        const countAfter = await client.query('SELECT COUNT(*) FROM news');

        await client.query('COMMIT');

        console.log(`删除了 ${deleteResult.rowCount} 条重复记录`);
        console.log(`删除后总记录数: ${countAfter.rows[0].count}`);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('删除重复记录时出错:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

// 执行函数
removeDuplicateNews();