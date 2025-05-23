// 测试用户账号密码：
// ------------------------------
//     管理员账号：admin / admin123
// 分类管理员：editor / editor123
// 分类编辑：writer / writer123
// ------------------------------

import { pool } from '../../connect.js';
import bcrypt from 'bcrypt';

async function addTestUsers() {
    try {
        console.log('开始创建测试用户...');

        // 生成密码哈希
        const saltRounds = 10;
        const editorPassword = await bcrypt.hash('editor123', saltRounds);
        const writerPassword = await bcrypt.hash('writer123', saltRounds);

        // 检查editor用户是否存在
        const editorCheck = await pool.query(`
            SELECT COUNT(*) FROM admin_users WHERE username = 'editor'
        `);

        if (editorCheck.rows[0].count === '0') {
            console.log('创建editor用户...');
            await pool.query(`
                INSERT INTO admin_users (
                    username, 
                    password, 
                    email, 
                    role_id, 
                    category_id, 
                    status
                ) VALUES (
                    'editor', 
                    $1, 
                    'editor@example.com', 
                    2, 
                    1, 
                    1
                )
            `, [editorPassword]);
            console.log('editor用户创建成功!');
        } else {
            console.log('editor用户已存在，更新密码...');
            await pool.query(`
                UPDATE admin_users 
                SET password = $1, 
                    role_id = 2,
                    status = 1,
                    email = 'editor@example.com'
                WHERE username = 'editor'
            `, [editorPassword]);
            console.log('editor用户更新成功!');
        }

        // 检查writer用户是否存在
        const writerCheck = await pool.query(`
            SELECT COUNT(*) FROM admin_users WHERE username = 'writer'
        `);

        if (writerCheck.rows[0].count === '0') {
            console.log('创建writer用户...');
            await pool.query(`
                INSERT INTO admin_users (
                    username, 
                    password, 
                    email, 
                    role_id, 
                    category_id, 
                    status
                ) VALUES (
                    'writer', 
                    $1, 
                    'writer@example.com', 
                    3, 
                    2, 
                    1
                )
            `, [writerPassword]);
            console.log('writer用户创建成功!');
        } else {
            console.log('writer用户已存在，更新密码...');
            await pool.query(`
                UPDATE admin_users 
                SET password = $1, 
                    role_id = 3,
                    status = 1,
                    email = 'writer@example.com'
                WHERE username = 'writer'
            `, [writerPassword]);
            console.log('writer用户更新成功!');
        }

        console.log('所有测试用户创建完成!');

        // 输出所有测试用户账号密码信息
        console.log('\n测试用户账号密码：');
        console.log('------------------------------');
        console.log('管理员账号：admin / admin123');
        console.log('分类管理员：editor / editor123');
        console.log('分类编辑：writer / writer123');
        console.log('------------------------------\n');

    } catch (error) {
        console.error('创建测试用户失败:', error);
    } finally {
        await pool.end();
    }
}

addTestUsers();