import { pool } from '../../connect.js'; // 数据库连接

// 获取管理员菜单
export const getAdminMenus = async (req, res) => {
    try {
        const user = req.user; // 从JWT中获取的用户信息

        // 如果用户有超级管理员角色，返回所有菜单
        const isAdmin = user.roles.includes('admin');

        let menus = [];
        if (isAdmin) {
            // 获取所有菜单 - 修改为 pool.query
            const allMenusResult = await pool.query(`
                SELECT id, parent_id, title, key_path as key, icon 
                FROM menus 
                ORDER BY parent_id, sort_order
            `);
            // PostgreSQL结果在rows属性中
            menus = allMenusResult.rows;
        } else {
            // 获取用户有权限的菜单
            const permissionCodes = user.permissions;

            if (permissionCodes && permissionCodes.length > 0) {
                // 使用PostgreSQL风格的参数占位符
                const placeholders = permissionCodes.map((_, i) => `$${i + 1}`).join(',');

                const authMenusResult = await pool.query(`
                    SELECT id, parent_id, title, key_path as key, icon 
                    FROM menus 
                    WHERE permission_code IN (${placeholders})
                    ORDER BY parent_id, sort_order
                `, permissionCodes);

                // PostgreSQL结果在rows属性中
                menus = authMenusResult.rows;
            } else {
                // 如果没有权限，则返回空数组
                menus = [];
            }
        }

        // 构建菜单树结构
        const menuTree = buildMenuTree(menus);

        return res.json({
            success: true,
            data: menuTree
        });

    } catch (error) {
        console.error('获取菜单失败:', error);
        return res.status(500).json({
            success: false,
            message: '服务器错误，请稍后再试'
        });
    }
};

// 构建菜单树的辅助函数
function buildMenuTree(menus, parentId = 0) {
    return menus
        .filter(menu => menu.parent_id === parentId)
        .map(menu => {
            const children = buildMenuTree(menus, menu.id);
            return {
                ...menu,
                children: children.length > 0 ? children : undefined
            };
        });
}