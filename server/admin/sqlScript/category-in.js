//导入分类脚本
import fs from 'fs';
import path from 'path';
import { pool } from '../../connect.js';

async function importCategories() {
    try {
        // 读取分类文件
        const categoriesFile = path.join(process.cwd(), 'categories');
        const content = fs.readFileSync(categoriesFile, 'utf8');

        // 解析主分类和子分类
        const lines = content.split('\n');
        const mainCategories = [];
        const subCategories = [];

        let isMain = false;
        let isSub = false;

        for (const line of lines) {
            if (line.trim() === '主分类:') {
                isMain = true;
                isSub = false;
                continue;
            }

            if (line.trim() === '子分类:') {
                isMain = false;
                isSub = true;
                continue;
            }

            const match = line.match(/- (.+)/);
            if (match) {
                const code = match[1].trim();
                if (isMain) {
                    mainCategories.push({
                        code,
                        name: getChineseName(code) // 将英文代码转为中文名称的函数
                    });
                } else if (isSub) {
                    subCategories.push({
                        code,
                        name: getChineseName(code)
                    });
                }
            }
        }

        // 插入主分类
        console.log('导入主分类...');
        for (let i = 0; i < mainCategories.length; i++) {
            const { name, code } = mainCategories[i];
            await pool.query(`
        INSERT INTO categories (name, code, level, sort_order)
        VALUES ($1, $2, 1, $3)
        ON CONFLICT (code) DO UPDATE SET name = $1
      `, [name, code, (i + 1) * 10]);
        }

        // 获取所有主分类的ID
        const mainCategoriesResult = await pool.query('SELECT id, code FROM categories WHERE level = 1');
        const mainCategoryMap = {};
        for (const row of mainCategoriesResult.rows) {
            mainCategoryMap[row.code] = row.id;
        }

        // 插入子分类
        console.log('导入子分类...');
        for (let i = 0; i < subCategories.length; i++) {
            const { name, code } = subCategories[i];
            let parentId = null;

            // 尝试确定父分类ID
            for (const mainCode in mainCategoryMap) {
                if (code.startsWith(mainCode)) {
                    parentId = mainCategoryMap[mainCode];
                    break;
                }
            }

            await pool.query(`
        INSERT INTO categories (name, code, parent_id, level, sort_order)
        VALUES ($1, $2, $3, 2, $4)
        ON CONFLICT (code) DO UPDATE SET name = $1, parent_id = $3
      `, [name, code, parentId, (i + 1) * 5]);
        }

        console.log('分类导入完成!');
    } catch (error) {
        console.error('导入分类失败:', error);
    } finally {
        await pool.end();
    }
}

// 英文代码转中文名称的简单映射
function getChineseName(code) {
    const nameMap = {
        'autos': '汽车',
        'entertainment': '娱乐',
        'finance': '财经',
        'foodanddrink': '美食',
        'health': '健康',
        'lifestyle': '生活方式',
        'news': '新闻',
        'sports': '体育',
        'travel': '旅游',
        // 添加更多映射...
    };

    return nameMap[code] || code;
}

importCategories();