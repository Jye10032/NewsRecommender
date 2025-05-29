import { pool } from '../../connect.js';

async function checkNewsData() {
    try {
        console.log('检查新闻数据...');

        // 获取总记录数
        const countResult = await pool.query('SELECT COUNT(*) FROM news');
        console.log(`数据库中共有 ${countResult.rows[0].count} 条新闻记录`);

        // 检查图片URL
        const imageResult = await pool.query(`
      SELECT news_id, title, cover_image_url 
      FROM news 
      LIMIT 10
    `);

        console.log('\n新闻图片URL示例:');
        imageResult.rows.forEach(row => {
            console.log(`${row.news_id} | ${row.title.substring(0, 30)}... | ${row.cover_image_url || '无图片'}`);
        });

        // 检查无图片记录数量
        const noImageResult = await pool.query(`
      SELECT COUNT(*) 
      FROM news 
      WHERE cover_image_url IS NULL OR cover_image_url = ''
    `);

        console.log(`\n无图片URL的新闻: ${noImageResult.rows[0].count} 条`);

    } catch (error) {
        console.error('查询失败:', error);
    } finally {
        await pool.end();
    }
}

checkNewsData();