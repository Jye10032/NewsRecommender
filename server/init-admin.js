// scripts/init-admin.js
import bcrypt from 'bcrypt';
import { pool } from './connect.js'; // 数据库连接池

export default async function initAdminData(client = null) {
    let useExternalClient = !!client;
    let dbPool = client;

    try {
        // 如果没有传入客户端参数，则使用自己的连接
        if (!dbPool) {
            const { pool: dbPool } = await import('./connect.js');
            dbPool = dbPool;
        }

        // 1. 创建默认角色
        await dbPool.query(`
      INSERT INTO roles (role_name, role_code, description) 
      VALUES 
        ('超级管理员', 'admin', '拥有所有权限'),
        ('内容编辑', 'editor', '管理新闻内容'),
        ('普通用户管理员', 'user_manager', '管理普通用户')
      ON CONFLICT (role_code) DO NOTHING
    `);

        // 2. 创建权限
        await dbPool.query(`
      INSERT INTO permissions (permission_name, permission_code, description) 
      VALUES
        ('用户查看', 'user:read', '查看用户列表'),
        ('用户创建', 'user:create', '创建新用户'),
        ('用户编辑', 'user:update', '编辑用户信息'),
        ('用户删除', 'user:delete', '删除用户'),
        ('角色查看', 'role:read', '查看角色列表'),
        ('角色创建', 'role:create', '创建新角色'),
        ('角色编辑', 'role:update', '编辑角色信息'),
        ('角色删除', 'role:delete', '删除角色'),
        ('新闻查看', 'news:read', '查看新闻列表'),
        ('新闻创建', 'news:create', '创建新闻'),
        ('新闻编辑', 'news:update', '编辑新闻'),
        ('新闻删除', 'news:delete', '删除新闻'),
        ('新闻分类管理', 'news_category:*', '管理新闻分类')
      ON CONFLICT (permission_code) DO NOTHING
    `);

        // 3. 关联角色和权限
        // 获取角色和权限ID
        const rolesResult = await dbPool.query('SELECT id, role_code FROM roles');
        const roles = rolesResult.rows;

        const permissionsResult = await dbPool.query('SELECT id, permission_code FROM permissions');
        const permissions = permissionsResult.rows;

        const adminRole = roles.find(r => r.role_code === 'admin');
        const editorRole = roles.find(r => r.role_code === 'editor');
        const userManagerRole = roles.find(r => r.role_code === 'user_manager');

        // 为超级管理员添加所有权限
        for (const perm of permissions) {
            await dbPool.query(
                'INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT (role_id, permission_id) DO NOTHING',
                [adminRole.id, perm.id]
            );
        }

        // 为编辑添加新闻相关权限
        const newsPerms = permissions.filter(p => p.permission_code.startsWith('news'));
        for (const perm of newsPerms) {
            await dbPool.query(
                'INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT (role_id, permission_id) DO NOTHING',
                [editorRole.id, perm.id]
            );
        }

        // 为用户管理员添加用户相关权限
        const userPerms = permissions.filter(p => p.permission_code.startsWith('user'));
        for (const perm of userPerms) {
            await dbPool.query(
                'INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT (role_id, permission_id) DO NOTHING',
                [userManagerRole.id, perm.id]
            );
        }

        // 4. 创建菜单
        await dbPool.query(`
      INSERT INTO menus (parent_id, title, key_path, icon, sort_order, permission_code) 
      VALUES
        (0, '首页', '/home', 'home', 1, NULL),
        (0, '用户管理', '/user-manage', 'user', 2, 'user:read'),
        (2, '用户列表', '/user-manage/list', NULL, 1, 'user:read'),
        (0, '权限管理', '/right-manage', 'setting', 3, 'role:read'),
        (4, '角色列表', '/right-manage/role/list', NULL, 1, 'role:read'),
        (4, '权限列表', '/right-manage/right/list', NULL, 2, 'role:read'),
        (0, '新闻管理', '/news-manage', 'file-text', 4, 'news:read'),
        (7, '添加新闻', '/news-manage/add', NULL, 1, 'news:create'),
        (7, '草稿箱', '/news-manage/draft', NULL, 2, 'news:read'),
        (7, '新闻分类', '/news-manage/category', NULL, 3, 'news_category:*')
      ON CONFLICT (id) DO NOTHING
    `);

        // 5. 创建超级管理员账户
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await dbPool.query(`
      INSERT INTO admin_users (username, password, email, status)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (username) DO NOTHING
    `, ['admin', hashedPassword, 'admin@example.com', 1]);

        // 获取管理员ID
        const adminUsersResult = await dbPool.query("SELECT id FROM admin_users WHERE username = $1", ['admin']);
        const adminId = adminUsersResult.rows[0].id;

        // 关联管理员和超级管理员角色
        await dbPool.query(`
      INSERT INTO admin_user_roles (admin_user_id, role_id)
      VALUES ($1, $2)
      ON CONFLICT (admin_user_id, role_id) DO NOTHING
    `, [adminId, adminRole.id]);

        console.log('管理后台初始化数据完成!');
        console.log('默认账号: admin');
        console.log('默认密码: admin123');

    } catch (error) {
        console.error('初始化管理员数据失败:', error);
        throw error;
    } finally {
        // 只在内部创建的连接时才关闭
        if (!useExternalClient && dbPool && typeof dbPool.end === 'function') {
            await dbPool.end();
        }
    }
}