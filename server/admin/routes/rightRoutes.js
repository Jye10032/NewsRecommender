import express from 'express';
import { pool } from '../../connect.js';
import { verifyAdminToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// 所有路由都需要验证
router.use(verifyAdminToken);

// 获取所有权限（包括子权限）
router.get('/rights/all', async (req, res) => {
    try {
        // 获取一级权限
        const result = await pool.query(`
            SELECT * FROM rights WHERE grade = 1 ORDER BY id
        `);

        // 获取二级权限
        const childrenResult = await pool.query(`
            SELECT * FROM rights WHERE grade = 2 ORDER BY rightId, id
        `);

        // 组合结果
        const rights = result.rows.map(right => {
            const children = childrenResult.rows.filter(child =>
                child.rightId === right.id
            );

            return {
                ...right,
                children: children || []
            };
        });

        res.json(rights);
    } catch (error) {
        console.error('获取权限列表失败:', error);
        res.status(500).json({ success: false, message: '获取权限列表失败' });
    }
});

// 获取权限树
router.get('/rights/tree', async (req, res) => {
    try {
        // 获取一级权限（父权限）
        const parentsResult = await pool.query(`
      SELECT * FROM rights WHERE grade = 1 ORDER BY id
    `);

        // 获取二级权限（子权限）
        const childrenResult = await pool.query(`
      SELECT * FROM rights WHERE grade = 2 ORDER BY rightId, id
    `);

        // 构建权限树
        const rightsTree = parentsResult.rows.map(parent => {
            return {
                ...parent,
                key: parent.key,
                title: parent.title,
                children: childrenResult.rows
                    .filter(child => child.rightId === parent.id)
                    .map(child => ({
                        ...child,
                        key: child.key,
                        title: child.title
                    }))
            };
        });

        res.json(rightsTree);
    } catch (error) {
        console.error('获取权限树失败:', error);
        res.status(500).json({ success: false, message: '获取权限树失败' });
    }
});

// 删除角色
router.delete('/roles/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // 不允许删除ID为1的超级管理员角色
        if (id === '1') {
            return res.status(403).json({ success: false, message: '无法删除超级管理员角色' });
        }

        await pool.query('DELETE FROM roles WHERE id = $1', [id]);
        res.json({ success: true, message: '角色删除成功' });
    } catch (error) {
        console.error('删除角色失败:', error);
        res.status(500).json({ success: false, message: '删除角色失败' });
    }
});


// 获取角色列表
router.get('/roles', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM roles ORDER BY id');
        res.json(result.rows);
    } catch (error) {
        console.error('获取角色列表失败:', error);
        res.status(500).json({ success: false, message: '获取角色列表失败' });
    }
});



// 获取单个角色的权限
router.get('/roles/:id/rights', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query('SELECT rights FROM roles WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: '角色不存在' });
        }

        res.json(result.rows[0].rights || []);
    } catch (error) {
        console.error('获取角色权限失败:', error);
        res.status(500).json({ success: false, message: '获取角色权限失败' });
    }
});

export default router;