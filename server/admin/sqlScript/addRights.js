
//创建角色权限初始化脚本
import { pool } from '../../connect.js';

// 角色权限配置
// 修改超级管理员的权限，将新闻管理相关的子项改为审核和下架

// 将审核管理和发布管理的权限整合到新闻管理下

const roleRights = [
    {
        id: 1,
        roleName: "超级管理员",
        roleCode: "superadmin",
        rights: [
            // 用户和权限管理权限
            "/user-manage/add",
            "/user-manage/delete",
            "/user-manage/update",
            "/user-manage/list",
            "/right-manage",
            "/right-manage/role/list",
            "/right-manage/right/list",
            "/right-manage/role/update",
            "/right-manage/role/delete",
            "/right-manage/right/update",
            "/right-manage/right/delete",

            // 新闻管理模块 - 整合了审核和发布功能
            "/news-manage",
            "/news-manage/audit",     // 新闻审核功能
            "/news-manage/offline",   // 新闻下架功能
            "/news-manage/preview/:id", // 新闻预览功能
            "/news-manage/published",   // 已发布新闻
            "/news-manage/unpublished", // 待发布新闻
            "/news-manage/sunset",      // 已下线新闻

            "/user-manage",
            "/home"
        ]
    },
    {
        id: 2,
        roleName: "分类管理员",
        roleCode: "admin",
        rights: [
            "/home",
            "/user-manage",
            "/user-manage/add",
            "/user-manage/delete",
            "/user-manage/update",
            "/user-manage/list",

            // 新闻管理模块 - 整合了审核和发布功能
            "/news-manage",
            "/news-manage/audit",     // 新闻审核功能
            "/news-manage/offline",   // 新闻下架功能
            "/news-manage/preview/:id", // 新闻预览功能
            "/news-manage/published",   // 已发布新闻
            "/news-manage/unpublished", // 待发布新闻
            "/news-manage/sunset"       // 已下线新闻
        ]
    },
    {
        id: 3,
        roleName: "分类编辑",
        roleCode: "editor",
        rights: [
            "/home",

            // 新闻管理模块 - 整合了审核和发布功能
            "/news-manage",
            "/news-manage/audit",     // 新闻审核功能
            "/news-manage/offline",   // 新闻下架功能
            "/news-manage/preview/:id", // 新闻预览功能
            "/news-manage/published",   // 已发布新闻
            "/news-manage/unpublished", // 待发布新闻
            "/news-manage/sunset"       // 已下线新闻
        ]
    }
];

async function initRoleRights() {
    try {
        console.log('开始初始化角色权限...');

        // 检查roles表是否有rights字段，如果没有则添加
        const checkColumn = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'roles' AND column_name = 'rights'
        `);

        if (checkColumn.rows.length === 0) {
            console.log('添加rights字段到roles表...');
            await pool.query(`ALTER TABLE roles ADD COLUMN rights JSONB DEFAULT '[]'::jsonb`);
        }

        // 更新每个角色的权限
        for (const role of roleRights) {
            console.log(`更新角色 ${role.roleName} 的权限...`);

            // 首先确保角色存在
            const roleCheck = await pool.query(`
                SELECT id FROM roles WHERE id = $1 OR role_code = $2
            `, [role.id, role.roleCode]);

            if (roleCheck.rows.length === 0) {
                console.log(`创建角色 ${role.roleName}...`);
                await pool.query(`
                    INSERT INTO roles (id, role_name, role_code, rights)
                    VALUES ($1, $2, $3, $4)
                `, [role.id, role.roleName, role.roleCode, JSON.stringify(role.rights)]);
            } else {
                console.log(`更新角色 ${role.roleName} 权限...`);
                await pool.query(`
                    UPDATE roles 
                    SET role_name = $2, role_code = $3, rights = $4
                    WHERE id = $1
                `, [role.id, role.roleName, role.roleCode, JSON.stringify(role.rights)]);
            }
        }

        console.log('角色权限初始化完成!');
    } catch (error) {
        console.error('初始化角色权限失败:', error);
    } finally {
        await pool.end();
    }
}

initRoleRights();