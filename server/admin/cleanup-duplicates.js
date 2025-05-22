import { pool } from '../connect.js';

async function cleanupDuplicates() {
    try {
        console.log('开始清理重复菜单项...');

        // 使用CTE和窗口函数删除重复的菜单项，保留ID最小的一条
        await pool.query(`
      WITH duplicates AS (
        SELECT id, 
               ROW_NUMBER() OVER (PARTITION BY key_path ORDER BY id) as row_num
        FROM menus
      )
      DELETE FROM menus
      WHERE id IN (
        SELECT id FROM duplicates WHERE row_num > 1
      );
    `);

        // 清理角色权限关联表中的重复项
        await pool.query(`
      WITH duplicates AS (
        SELECT id, 
               ROW_NUMBER() OVER (PARTITION BY role_id, permission_id ORDER BY id) as row_num
        FROM role_permissions
      )
      DELETE FROM role_permissions
      WHERE id IN (
        SELECT id FROM duplicates WHERE row_num > 1
      );
    `);

        // 清理管理员角色关联表中的重复项
        await pool.query(`
      WITH duplicates AS (
        SELECT id, 
               ROW_NUMBER() OVER (PARTITION BY admin_user_id, role_id ORDER BY id) as row_num
        FROM admin_user_roles
      )
      DELETE FROM admin_user_roles
      WHERE id IN (
        SELECT id FROM duplicates WHERE row_num > 1
      );
    `);

        console.log('重复数据清理完成！');
    } catch (error) {
        console.error('清理重复数据时出错:', error);
    } finally {
        await pool.end();
    }
}

cleanupDuplicates();