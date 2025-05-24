import { pool } from '../../connect.js'; // 数据库连接

// 静态菜单作为备选
const staticMenu = [
    {
        key: '/home',
        title: '首页',
        icon: 'home'
    },
    {
        key: '/user-manage',
        title: '用户管理',
        icon: 'user',
        children: [
            {
                key: '/user-manage/list',
                title: '用户列表',
            }
        ]
    },
    {
        key: '/news-manage',
        title: '新闻管理',
        icon: 'file-text',
        children: [
            // {
            //     key: '/news-manage/audit',
            //     title: '新闻审核',
            // },
            // {
            //     key: '/news-manage/offline',
            //     title: '新闻下架',
            // },
            {
                key: '/news-manage/unpublished',
                title: '待发布新闻',
            },
            {
                key: '/news-manage/published',
                title: '已发布新闻',
            },
            {
                key: '/news-manage/sunset',
                title: '已下线新闻',
            }
        ]
    },
    {
        key: '/right-manage',
        title: '权限管理',
        icon: 'setting',
        children: [
            {
                key: '/right-manage/role/list',
                title: '角色列表',
            },
            {
                key: '/right-manage/right/list',
                title: '权限列表',
            }
        ]
    }
];

// 获取管理员菜单
export const getAdminMenus = async (req, res) => {
    try {
        // 检查用户信息 - 支持从req.user或req.admin获取
        const user = req.user || req.admin;

        // 检查用户信息是否存在
        if (!user) {
            console.log('未找到用户信息，返回静态菜单');
            return res.json({
                success: true,
                data: staticMenu
            });
        }

        // 安全地检查用户角色
        const hasRoles = user.roles && Array.isArray(user.roles);
        const isAdmin = hasRoles ? user.roles.includes('admin') : false;

        let menus = [];

        try {
            if (isAdmin) {
                // 获取所有菜单
                const allMenusResult = await pool.query(`
                    SELECT id, parent_id, title, key_path as key, icon 
                    FROM menus 
                    ORDER BY parent_id, sort_order
                `);
                menus = allMenusResult.rows || [];
            } else {
                // 安全地获取用户权限
                const permissionCodes = user.permissions || [];

                if (permissionCodes.length > 0) {
                    // 使用参数化查询
                    const placeholders = permissionCodes.map((_, i) => `$${i + 1}`).join(',');

                    const authMenusResult = await pool.query(`
                        SELECT id, parent_id, title, key_path as key, icon 
                        FROM menus 
                        WHERE permission_code IN (${placeholders})
                        ORDER BY parent_id, sort_order
                    `, permissionCodes);

                    menus = authMenusResult.rows || [];
                }
            }
        } catch (dbError) {
            console.error('数据库查询错误:', dbError);
            // 出现数据库错误时返回静态菜单
            return res.json({
                success: true,
                data: staticMenu
            });
        }

        // 检查菜单是否为空
        if (!menus || menus.length === 0) {
            console.log('未找到菜单数据，返回静态菜单');
            return res.json({
                success: true,
                data: staticMenu
            });
        }

        // 构建菜单树
        const menuTree = buildMenuTree(menus);

        // 再次检查构建的菜单树是否为空
        if (!menuTree || menuTree.length === 0) {
            return res.json({
                success: true,
                data: staticMenu
            });
        }

        return res.json({
            success: true,
            data: menuTree
        });

    } catch (error) {
        console.error('获取菜单失败:', error);
        // 任何错误都返回静态菜单，确保前端可用
        return res.json({
            success: true,
            data: staticMenu
        });
    }
};

// 构建菜单树的辅助函数不变
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