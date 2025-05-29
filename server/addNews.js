import fs from 'fs';
import path from 'path';
import xlsx from 'xlsx';
import { pool } from './connect.js';
import { v4 as uuidv4 } from 'uuid';

// 配置
const EXCEL_FILE = 'globaltimes_news_2025-05-29_crawl_by_gy.xls';
const DEFAULT_ADMIN_ID = 1; // 设置默认管理员ID，根据您的实际情况调整

// 类别映射
const categoryMapping = {
    '政治': { category: 'politics', subcategory: '' },
    '社会': { category: 'society', subcategory: '' },
    '外交': { category: 'diplomacy', subcategory: '' },
    '军事': { category: 'military', subcategory: '' },
    '科学': { category: 'science', subcategory: '' },
    '奇文': { category: 'odd', subcategory: '' },
    '图文': { category: 'graphic', subcategory: '' },
    '中国高质量发展': { category: "Stories-of-China's-high-quality-development", subcategory: '' }
};

// 主函数
async function main() {
    console.log('开始导入数据...');

    try {
        // 读取Excel文件
        const workbook = xlsx.readFile(path.join(process.cwd(), EXCEL_FILE));
        const sheetName = workbook.SheetNames[0];
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        console.log(`从Excel中读取了${data.length}条记录`);

        let successCount = 0;
        let errorCount = 0;

        // 逐条处理数据
        for (const item of data) {
            const client = await pool.connect();

            try {
                // 从Excel获取数据
                const title = item['标题'];
                const column = item['栏目'];
                const author = item['作者'];
                const publishTimeRaw = item['发布时间'];
                const url = item['链接'];
                const content = item['内容'];
                const coverImageUrl = item['封面图链接'] || item['封面图URL'];

                let pubDate;
                try {
                    if (publishTimeRaw) {
                        // 处理"May 14, 2025 01:23 PM"格式的日期
                        pubDate = new Date(publishTimeRaw);

                        // 验证日期是否有效
                        if (isNaN(pubDate.getTime())) {
                            console.warn(`无效的日期格式: ${publishTimeRaw}, 使用当前时间代替`);
                            pubDate = new Date();
                        }
                    } else {
                        pubDate = new Date();
                    }
                } catch (e) {
                    console.warn(`日期解析错误: ${publishTimeRaw}, 使用当前时间代替`);
                    pubDate = new Date();
                }

                // 检查标题
                if (!title) {
                    console.log('跳过无标题记录');
                    errorCount++;
                    continue;
                }

                // 映射类别
                const categoryInfo = categoryMapping[column] || { category: 'news', subcategory: 'general' };

                // 生成新闻ID和摘要
                const newsId = `N${uuidv4().substring(0, 8).toUpperCase()}`;
                const abstract = content ? content.substring(0, 200) : '';

                // 插入数据
                await client.query(`
                INSERT INTO news (
                    news_id, 
                    title, 
                    abstract, 
                    content,
                    category, 
                    subcategory, 
                    url, 
                    author,
                    cover_image_url,
                    status,
                    published_at,
                    created_by,
                    created_at,
                    updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                `, [
                    newsId,
                    title,
                    abstract,
                    content,
                    categoryInfo.category,
                    categoryInfo.subcategory,
                    url,
                    author,
                    coverImageUrl,
                    2, // 状态: 2（已发布）
                    pubDate, // 正确的发布时间参数 - 第11个位置
                    String(DEFAULT_ADMIN_ID), // 正确的创建者ID参数 - 第12个位置
                ]);
                successCount++;
                console.log(`成功导入: ${title}`);
            } catch (error) {
                errorCount++;
                console.error(`导入失败:`, error.message);
            } finally {
                client.release();
            }
        }

        console.log(`导入完成! 成功: ${successCount}, 失败: ${errorCount}`);
    } catch (error) {
        console.error('程序错误:', error);
    } finally {
        await pool.end();
    }
}

main();