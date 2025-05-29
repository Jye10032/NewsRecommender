import express from 'express';
import { pool } from '../../connect.js';
import { verifyAdminToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// 使用认证中间件
router.use(verifyAdminToken);

// 获取新闻列表(支持过滤和分页)
router.get('/', async (req, res) => {
    try {
        const {
            page = 1,
            size = 10,
            status,
            category,
            title,
            auditState  // 兼容前端的命名
        } = req.query;

        const offset = (page - 1) * size;

        // 构建基础查询
        let query = `
      SELECT n.*, c.name as category_name, sc.name as subcategory_name,
      au.username as author_name, ru.username as reviewer_name
      FROM news n
      LEFT JOIN categories c ON n.category = c.code
      LEFT JOIN categories sc ON n.subcategory = sc.code
      LEFT JOIN admin_users au ON n.created_by = au.id::text
      LEFT JOIN admin_users ru ON n.audit_by = ru.id::text
      WHERE deleted_at IS NULL
    `;

        const params = [];

        // 添加过滤条件
        if (status || auditState) {
            params.push(parseInt(status || auditState));
            query += ` AND n.status = $${params.length}`;
        }

        if (category) {
            params.push(category);
            query += ` AND n.category = $${params.length}`;
        }

        if (title) {
            params.push(`%${title}%`);
            query += ` AND n.title ILIKE $${params.length}`;
        }

        // 添加防御性检查
        if (!req.admin) {
            return res.status(401).json({
                success: false,
                message: '未授权，请先登录'
            });
        }

        // 检查用户权限，非超级管理员只能查看自己创建的或分类下的新闻
        if (req.admin.role && req.admin.role.code !== 'superadmin') {
            if (req.admin.role.code === 'admin') {
                // 分类管理员可以看到自己分类下的所有新闻
                if (req.admin.category_id) {
                    params.push(req.admin.category_id);
                    query += ` AND (n.created_by = $${params.length - 1} OR n.category IN (
              SELECT code FROM categories WHERE id = $${params.length} OR parent_id = $${params.length}
            ))`;
                }
            } else if (req.admin.id) {
                // 普通编辑只能看到自己创建的新闻
                params.push(req.admin.id);
                query += ` AND n.created_by = $${params.length}`;
            }
        }

        // 添加排序和分页
        query += ` ORDER BY n.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(parseInt(size), offset);

        // 执行查询
        const result = await pool.query(query, params);

        // 获取总记录数
        // 获取总记录数 - 使用更简单的计数查询
        let countQuery = 'SELECT COUNT(*) FROM news WHERE 1=1';
        const countParams = [];
        let countParamIndex = 1;

        if (status !== undefined) {
            countQuery += ` AND status = $${countParamIndex++}`;
            countParams.push(status);
        }

        if (category) {
            countQuery += ` AND category = $${countParamIndex++}`;
            countParams.push(category);
        }

        if (title) {
            countQuery += ` AND title ILIKE $${countParamIndex++}`;
            countParams.push(`%${title}%`);
        }

        try {
            const countResult = await pool.query(countQuery, countParams);
            const total = countResult && countResult.rows && countResult.rows[0] ?
                parseInt(countResult.rows[0].count) : 0;

            res.json({
                items: result.rows,
                total: total,
                page: parseInt(page),
                size: parseInt(size)
            });
        } catch (countError) {
            console.error('获取新闻计数失败:', countError);
            res.json({
                items: result.rows,
                total: 0,
                page: parseInt(page),
                size: parseInt(size)
            });
        }

    } catch (error) {
        console.error('获取新闻列表失败:', error);
        res.status(500).json({ success: false, message: '获取新闻列表失败' });
    }
});
// 添加新闻下线路由
router.patch('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // 验证状态值
        if (![0, 1, 2, 3].includes(Number(status))) {
            return res.status(400).json({
                success: false,
                message: '无效的状态值'
            });
        }

        // 更新新闻状态
        const result = await pool.query(`
            UPDATE news
            SET status = $1, updated_at = CURRENT_TIMESTAMP
            WHERE news_id = $2
            RETURNING *
        `, [status, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '新闻不存在'
            });
        }

        res.json({
            success: true,
            message: '新闻状态已更新',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('更新新闻状态失败:', error);
        res.status(500).json({
            success: false,
            message: '更新新闻状态失败'
        });
    }
});

// 获取单个新闻详情
// 获取单个新闻详情 
// 获取单个新闻详情
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // 修改查询，使用正确的字段名进行JOIN
        const result = await pool.query(`
            SELECT n.*, c.name as category_name, sc.name as subcategory_name,
            au.username as author_name, ru.username as reviewer_name
            FROM news n
            LEFT JOIN categories c ON n.category = c.code
            LEFT JOIN categories sc ON n.subcategory = sc.code
            LEFT JOIN admin_users au ON n.created_by = au.id::text
            LEFT JOIN admin_users ru ON n.audit_by = ru.id::text
            WHERE n.news_id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '新闻不存在'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('获取新闻详情失败:', error);
        res.status(500).json({
            success: false,
            message: '获取新闻详情失败'
        });
    }
});

// 创建新闻
router.post('/', async (req, res) => {
    try {
        const {
            title,
            abstract,
            category,
            subcategory,
            url,
            title_entities = {},
            abstract_entities = {}
        } = req.body;

        // 生成新闻ID
        const newsId = `N${Date.now()}${Math.floor(Math.random() * 1000)}`;

        const result = await pool.query(`
      INSERT INTO news (
        news_id, title, abstract, category, subcategory, url, 
        title_entities, abstract_entities, status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
            newsId, title, abstract, category, subcategory, url,
            title_entities, abstract_entities, 0, req.admin.id  // 状态0为草稿
        ]);

        res.status(201).json({
            success: true,
            message: '新闻创建成功',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('创建新闻失败:', error);
        res.status(500).json({ success: false, message: '创建新闻失败' });
    }
});

// 更新新闻
router.patch('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, abstract, category, subcategory, url, status, auditState } = req.body;

        // 查询新闻是否存在
        const newsCheck = await pool.query(
            'SELECT * FROM news WHERE news_id = $1',
            [id]
        );

        if (newsCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: '新闻不存在' });
        }

        // 检查权限
        if (req.admin.role.code !== 'superadmin') {
            if (req.admin.role.code === 'admin') {
                // 分类管理员需要检查新闻是否在自己的分类下
                const categoryCheck = await pool.query(
                    `SELECT COUNT(*) FROM categories WHERE 
           (code = $1 OR code = $2) AND 
           (id = $3 OR parent_id = $3)`,
                    [category || newsCheck.rows[0].category,
                    subcategory || newsCheck.rows[0].subcategory,
                    req.admin.category_id]
                );

                if (parseInt(categoryCheck.rows[0].count) === 0) {
                    return res.status(403).json({
                        success: false,
                        message: '您没有权限修改其他分类的新闻'
                    });
                }
            } else {
                // 编辑只能修改自己创建的新闻
                if (newsCheck.rows[0].created_by !== req.admin.id.toString()) {
                    return res.status(403).json({
                        success: false,
                        message: '您只能修改自己创建的新闻'
                    });
                }
            }
        }

        // 构建更新字段
        const updateFields = [];
        const params = [id];

        if (title !== undefined) {
            updateFields.push(`title = $${params.length + 1}`);
            params.push(title);
        }

        if (abstract !== undefined) {
            updateFields.push(`abstract = $${params.length + 1}`);
            params.push(abstract);
        }

        if (category !== undefined) {
            updateFields.push(`category = $${params.length + 1}`);
            params.push(category);
        }

        if (subcategory !== undefined) {
            updateFields.push(`subcategory = $${params.length + 1}`);
            params.push(subcategory);
        }

        if (url !== undefined) {
            updateFields.push(`url = $${params.length + 1}`);
            params.push(url);
        }

        // 处理状态更新
        const finalStatus = status || auditState || null;
        if (finalStatus !== null) {
            updateFields.push(`status = $${params.length + 1}`);
            params.push(finalStatus);

            // 如果状态变为已发布(2)，则更新发布时间
            if (finalStatus == 2) {
                updateFields.push(`published_at = NOW()`);
            }

            // 如果这是审核操作，记录审核人
            if (finalStatus == 2 || finalStatus == 3) {
                updateFields.push(`audit_by = $${params.length + 1}`);
                params.push(req.admin.id);
            }
        }

        // 添加更新时间
        updateFields.push(`updated_at = NOW()`);

        if (updateFields.length === 0) {
            return res.json({
                success: true,
                message: '没有要更新的字段',
                data: newsCheck.rows[0]
            });
        }

        const result = await pool.query(
            `UPDATE news SET ${updateFields.join(', ')} WHERE news_id = $1 RETURNING *`,
            params
        );

        res.json({
            success: true,
            message: '新闻更新成功',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('更新新闻失败:', error);
        res.status(500).json({ success: false, message: '更新新闻失败' });
    }
});

// 删除新闻(软删除)
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // 查询新闻是否存在
        const newsCheck = await pool.query(
            'SELECT * FROM news WHERE news_id = $1 AND deleted_at IS NULL',
            [id]
        );

        if (newsCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: '新闻不存在或已删除' });
        }

        // 检查权限
        if (req.admin.role.code !== 'superadmin') {
            if (req.admin.role.code === 'admin') {
                // 分类管理员需要检查新闻是否在自己的分类下
                const categoryCheck = await pool.query(
                    `SELECT COUNT(*) FROM categories WHERE 
           code = $1 AND 
           (id = $2 OR parent_id = $2)`,
                    [newsCheck.rows[0].category, req.admin.category_id]
                );

                if (parseInt(categoryCheck.rows[0].count) === 0) {
                    return res.status(403).json({
                        success: false,
                        message: '您没有权限删除其他分类的新闻'
                    });
                }
            } else {
                // 编辑只能删除自己创建的新闻
                if (newsCheck.rows[0].created_by !== req.admin.id.toString()) {
                    return res.status(403).json({
                        success: false,
                        message: '您只能删除自己创建的新闻'
                    });
                }
            }
        }

        // 软删除
        await pool.query(
            'UPDATE news SET deleted_at = NOW(), status = 4 WHERE news_id = $1',
            [id]
        );

        res.json({
            success: true,
            message: '新闻删除成功'
        });
    } catch (error) {
        console.error('删除新闻失败:', error);
        res.status(500).json({ success: false, message: '删除新闻失败' });
    }
});

export default router;