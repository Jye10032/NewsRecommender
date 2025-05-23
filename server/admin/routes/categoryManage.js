// 获取管理员负责的分类
router.get('/admin/categories/my', verifyAdminToken, async (req, res) => {
    try {
        const adminId = req.admin.id;

        // 检查是否是超级管理员
        const roleResult = await pool.query(`
      SELECT r.role_code FROM admin_users au
      JOIN roles r ON au.role_id = r.id
      WHERE au.id = $1
    `, [adminId]);

        // 超级管理员可以看到所有分类
        if (roleResult.rows[0]?.role_code === 'superadmin') {
            const result = await pool.query('SELECT * FROM categories ORDER BY level, sort_order');
            return res.json(result.rows);
        }

        // 查询管理员负责的分类
        const result = await pool.query(`
      SELECT c.* FROM categories c
      JOIN admin_category_permissions acp ON c.id = acp.category_id
      WHERE acp.admin_id = $1
      ORDER BY c.level, c.sort_order
    `, [adminId]);

        res.json(result.rows);
    } catch (error) {
        console.error('获取管理员分类失败:', error);
        res.status(500).json({ success: false, message: '获取管理员分类失败' });
    }
});

// 获取分类下的新闻
router.get('/categories/:code/news', verifyAdminToken, async (req, res) => {
    try {
        const { code } = req.params;
        const { page = 1, size = 10 } = req.query;
        const offset = (page - 1) * size;

        // 检查管理员是否有权限管理该分类
        const categoryResult = await pool.query('SELECT id FROM categories WHERE code = $1', [code]);
        if (categoryResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: '分类不存在' });
        }

        const categoryId = categoryResult.rows[0].id;
        const adminId = req.admin.id;

        // 检查权限 (除非是超级管理员)
        const hasPermission = await checkCategoryPermission(adminId, categoryId);
        if (!hasPermission) {
            return res.status(403).json({ success: false, message: '没有权限管理此分类' });
        }

        // 获取该分类下的新闻
        const result = await pool.query(`
      SELECT * FROM news
      WHERE category = $1 OR subcategory = $1
      ORDER BY published_at DESC
      LIMIT $2 OFFSET $3
    `, [code, size, offset]);

        // 获取总数
        const countResult = await pool.query(`
      SELECT COUNT(*) FROM news
      WHERE category = $1 OR subcategory = $1
    `, [code]);

        res.json({
            data: result.rows,
            total: parseInt(countResult.rows[0].count),
            page: parseInt(page),
            size: parseInt(size)
        });
    } catch (error) {
        console.error('获取分类新闻失败:', error);
        res.status(500).json({ success: false, message: '获取分类新闻失败' });
    }
});

// 辅助函数：检查分类权限
async function checkCategoryPermission(adminId, categoryId) {
    // 检查是否超级管理员
    const roleResult = await pool.query(`
    SELECT r.role_code FROM admin_users au
    JOIN roles r ON au.role_id = r.id
    WHERE au.id = $1
  `, [adminId]);

    if (roleResult.rows[0]?.role_code === 'superadmin') {
        return true;
    }

    // 检查是否有该分类的权限
    const permResult = await pool.query(`
    SELECT id FROM admin_category_permissions
    WHERE admin_id = $1 AND category_id = $2
  `, [adminId, categoryId]);

    return permResult.rows.length > 0;
}

// 分配分类权限
router.post('/users/:id/categories', verifyAdminToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { categoryIds } = req.body;

        // 验证用户ID
        const userResult = await pool.query('SELECT id FROM admin_users WHERE id = $1', [id]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: '用户不存在' });
        }

        // 清除现有权限
        await pool.query('DELETE FROM admin_category_permissions WHERE admin_id = $1', [id]);

        // 添加新权限
        if (categoryIds && categoryIds.length > 0) {
            const values = categoryIds.map(categoryId => `(${id}, ${categoryId})`).join(', ');
            await pool.query(`
        INSERT INTO admin_category_permissions (admin_id, category_id)
        VALUES ${values}
      `);
        }

        res.json({ success: true, message: '分类权限分配成功' });
    } catch (error) {
        console.error('分配分类权限失败:', error);
        res.status(500).json({ success: false, message: '分配分类权限失败' });
    }
});

// 获取用户的分类权限
router.get('/users/:id/categories', verifyAdminToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
      SELECT c.* FROM categories c
      JOIN admin_category_permissions acp ON c.id = acp.category_id
      WHERE acp.admin_id = $1
      ORDER BY c.level, c.sort_order
    `, [id]);

        res.json(result.rows);
    } catch (error) {
        console.error('获取用户分类权限失败:', error);
        res.status(500).json({ success: false, message: '获取用户分类权限失败' });
    }
});