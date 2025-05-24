import { pool } from '../../connect.js';

async function addRightItems() {
    try {
        console.log('开始创建基本权限项...');

        // 清空原有权限数据（如果需要）
        // await pool.query('TRUNCATE TABLE rights CASCADE');

        // 创建基本权限项
        const rightItems = [
            { key: '/home', title: '首页' },
            { key: '/user-manage', title: '用户管理' },
            { key: '/user-manage/list', title: '用户列表' },
            { key: '/user-manage/add', title: '添加用户' },
            { key: '/user-manage/delete', title: '删除用户' },
            { key: '/user-manage/update', title: '修改用户' },

            { key: '/right-manage', title: '权限管理' },
            { key: '/right-manage/role/list', title: '角色列表' },
            { key: '/right-manage/right/list', title: '权限列表' },
            { key: '/right-manage/role/update', title: '修改角色' },
            { key: '/right-manage/role/delete', title: '删除角色' },
            { key: '/right-manage/right/update', title: '修改权限' },
            { key: '/right-manage/right/delete', title: '删除权限' },

            { key: '/news-manage', title: '新闻管理' },
            { key: '/news-manage/audit', title: '新闻审核' },
            { key: '/news-manage/offline', title: '新闻下架' },
            { key: '/news-manage/preview/:id', title: '新闻预览' },
            { key: '/news-manage/published', title: '已发布新闻' },
            { key: '/news-manage/unpublished', title: '待发布新闻' },
            { key: '/news-manage/sunset', title: '已下线新闻' }
        ];

        // 插入权限项
        for (const item of rightItems) {
            // 检查权限项是否已存在
            const rightCheck = await pool.query(
                `SELECT COUNT(*) FROM rights WHERE key = $1`,
                [item.key]
            );

            if (rightCheck.rows[0].count === '0') {
                await pool.query(
                    `INSERT INTO rights (key, title) VALUES ($1, $2)`,
                    [item.key, item.title]
                );
                console.log(`创建权限项: ${item.title}`);
            } else {
                await pool.query(
                    `UPDATE rights SET title = $2 WHERE key = $1`,
                    [item.key, item.title]
                );
                console.log(`更新权限项: ${item.title}`);
            }
        }

        console.log('权限项创建完成!');
    } catch (error) {
        console.error('创建权限项失败:', error);
    } finally {
        await pool.end();
    }
}

addRightItems();