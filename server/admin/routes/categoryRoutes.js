import express from 'express';
import { pool } from '../../connect.js';
import { verifyAdminToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// 所有路由都需要验证
router.use(verifyAdminToken);

// 获取所有分类
router.get('/categories', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT * FROM categories 
            ORDER BY level, sort_order, id
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('获取分类失败:', error);
        res.status(500).json({ success: false, message: '获取分类失败' });
    }
});

// 获取主分类（level=1的分类）
router.get('/categories/main', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT * FROM categories 
            WHERE level = 1 
            ORDER BY sort_order, name
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('获取主分类失败:', error);
        res.status(500).json({ success: false, message: '获取主分类失败' });
    }
});

// 获取管理员可管理的分类
router.get('/admin/categories/my', async (req, res) => {
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

        // 分类管理员只能看到自己负责的分类
        // 先检查用户的category_id
        const userResult = await pool.query('SELECT category_id FROM admin_users WHERE id = $1', [adminId]);
        const categoryId = userResult.rows[0]?.category_id;

        if (categoryId) {
            const result = await pool.query(`
                SELECT * FROM categories WHERE id = $1 OR parent_id = $1
                ORDER BY level, sort_order
            `, [categoryId]);
            return res.json(result.rows);
        }

        // 没有分配分类的用户
        res.json([]);
    } catch (error) {
        console.error('获取管理员分类失败:', error);
        res.status(500).json({ success: false, message: '获取管理员分类失败' });
    }
});

// 添加分类
router.post('/categories', async (req, res) => {
    try {
        const { name, code, parent_id, level, sort_order } = req.body;

        // 检查分类代码是否已存在
        const checkResult = await pool.query('SELECT id FROM categories WHERE code = $1', [code]);
        if (checkResult.rows.length > 0) {
            return res.status(400).json({ success: false, message: '分类代码已存在' });
        }

        const result = await pool.query(`
            INSERT INTO categories (name, code, parent_id, level, sort_order)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `, [name, code, parent_id, level, sort_order]);

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('创建分类失败:', error);
        res.status(500).json({ success: false, message: '创建分类失败' });
    }
});

// 更新分类
router.patch('/categories/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, code, parent_id, level, sort_order } = req.body;

        // 检查分类是否存在
        const checkResult = await pool.query('SELECT id FROM categories WHERE id = $1', [id]);
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: '分类不存在' });
        }

        // 检查代码是否已被其他分类使用
        const codeResult = await pool.query('SELECT id FROM categories WHERE code = $1 AND id != $2', [code, id]);
        if (codeResult.rows.length > 0) {
            return res.status(400).json({ success: false, message: '分类代码已被使用' });
        }

        const result = await pool.query(`
            UPDATE categories 
            SET name = $1, code = $2, parent_id = $3, level = $4, sort_order = $5, updated_at = NOW()
            WHERE id = $6
            RETURNING *
        `, [name, code, parent_id, level, sort_order, id]);

        res.json(result.rows[0]);
    } catch (error) {
        console.error('更新分类失败:', error);
        res.status(500).json({ success: false, message: '更新分类失败' });
    }
});

// 删除分类
router.delete('/categories/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // 检查是否有子分类
        const childrenResult = await pool.query('SELECT id FROM categories WHERE parent_id = $1', [id]);
        if (childrenResult.rows.length > 0) {
            return res.status(400).json({ success: false, message: '请先删除该分类下的所有子分类' });
        }

        // 检查是否有新闻使用此分类
        const newsResult = await pool.query(`
            SELECT id FROM news 
            WHERE category = (SELECT code FROM categories WHERE id = $1) 
            OR subcategory = (SELECT code FROM categories WHERE id = $1)
            LIMIT 1
        `, [id]);

        if (newsResult.rows.length > 0) {
            return res.status(400).json({ success: false, message: '该分类下有新闻，无法删除' });
        }

        // 检查是否有管理员使用此分类
        const adminResult = await pool.query('SELECT id FROM admin_users WHERE category_id = $1 LIMIT 1', [id]);
        if (adminResult.rows.length > 0) {
            return res.status(400).json({ success: false, message: '有管理员关联到此分类，无法删除' });
        }

        await pool.query('DELETE FROM categories WHERE id = $1', [id]);

        res.json({ success: true, message: '分类删除成功' });
    } catch (error) {
        console.error('删除分类失败:', error);
        res.status(500).json({ success: false, message: '删除分类失败' });
    }
});

export default router;