import { pool } from '../../connect.js';

/**
 * 获取新闻列表 - 支持按状态、分类和作者过滤
 */
// 修复 getNewsList 函数的错误处理

export const getNewsList = async (req, res) => {
    try {
        const { status, category_id, author_id, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT n.*, c.category_name, u.username as author_name
            FROM news n
            LEFT JOIN categories c ON n.category_id = c.id
            LEFT JOIN admin_users u ON n.author_id = u.id
            WHERE 1=1
        `;

        const queryParams = [];
        let paramIndex = 1;

        // 添加过滤条件
        if (status !== undefined) {
            query += ` AND n.status = $${paramIndex++}`;
            queryParams.push(status);
        }

        if (category_id) {
            query += ` AND n.category_id = $${paramIndex++}`;
            queryParams.push(category_id);
        }

        if (author_id) {
            query += ` AND n.author_id = $${paramIndex++}`;
            queryParams.push(author_id);
        }

        // 添加排序和分页
        query += ` ORDER BY n.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        queryParams.push(limit, offset);

        try {
            // 执行查询
            const result = await pool.query(query, queryParams);

            // 获取总数量
            let countQuery = `
                SELECT COUNT(*) FROM news n WHERE 1=1
            `;

            paramIndex = 1;
            if (status !== undefined) {
                countQuery += ` AND n.status = $${paramIndex++}`;
            }

            if (category_id) {
                countQuery += ` AND n.category_id = $${paramIndex++}`;
            }

            if (author_id) {
                countQuery += ` AND n.author_id = $${paramIndex++}`;
            }

            const countResult = await pool.query(countQuery, queryParams.slice(0, paramIndex - 1));
            const total = parseInt(countResult.rows[0].count);

            res.json({
                success: true,
                items: result.rows,
                pagination: {
                    current: parseInt(page),
                    pageSize: parseInt(limit),
                    total
                }
            });
        } catch (dbError) {
            console.error('数据库查询失败:', dbError);
            return res.status(500).json({
                success: false,
                message: '获取新闻列表失败: 数据库查询错误'
            });
        }
    } catch (error) {
        console.error('获取新闻列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取新闻列表失败: ' + error.message
        });
    }
};

/**
 * 获取单个新闻详情
 */
export const getNewsById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
            SELECT n.*, c.category_name, u.username as author_name
            FROM news n
            LEFT JOIN categories c ON n.category_id = c.id
            LEFT JOIN admin_users u ON n.author_id = u.id
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
            message: '获取新闻详情失败: ' + error.message
        });
    }
};

/**
 * 创建新闻
 */
export const createNews = async (req, res) => {
    try {
        const {
            title,
            content,
            abstract,
            category_id,
            status = 0, // 默认为草稿状态
            cover_image,
            url
        } = req.body;

        // 获取当前登录用户作为作者
        const author_id = req.admin.id;

        // 验证必填字段
        if (!title || !content || !category_id) {
            return res.status(400).json({
                success: false,
                message: '标题、内容和分类为必填项'
            });
        }

        // 创建新闻
        const result = await pool.query(`
            INSERT INTO news (
                title,
                content,
                abstract,
                category_id,
                author_id,
                status,
                cover_image,
                url,
                created_at,
                updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING *
        `, [title, content, abstract, category_id, author_id, status, cover_image, url]);

        res.status(201).json({
            success: true,
            message: '新闻创建成功',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('创建新闻失败:', error);
        res.status(500).json({
            success: false,
            message: '创建新闻失败: ' + error.message
        });
    }
};

/**
 * 更新新闻
 */
export const updateNews = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            title,
            content,
            abstract,
            category_id,
            status,
            cover_image,
            url
        } = req.body;

        // 先检查新闻是否存在
        const checkResult = await pool.query(
            'SELECT * FROM news WHERE news_id = $1',
            [id]
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '新闻不存在'
            });
        }

        // 准备更新字段
        const updates = [];
        const values = [];
        let paramIndex = 1;

        if (title !== undefined) {
            updates.push(`title = $${paramIndex++}`);
            values.push(title);
        }

        if (content !== undefined) {
            updates.push(`content = $${paramIndex++}`);
            values.push(content);
        }

        if (abstract !== undefined) {
            updates.push(`abstract = $${paramIndex++}`);
            values.push(abstract);
        }

        if (category_id !== undefined) {
            updates.push(`category_id = $${paramIndex++}`);
            values.push(category_id);
        }

        if (status !== undefined) {
            updates.push(`status = $${paramIndex++}`);
            values.push(status);

            // 如果状态变为已发布，设置published_at
            if (status == 2) {
                updates.push(`published_at = CURRENT_TIMESTAMP`);
            }
        }

        if (cover_image !== undefined) {
            updates.push(`cover_image = $${paramIndex++}`);
            values.push(cover_image);
        }

        if (url !== undefined) {
            updates.push(`url = $${paramIndex++}`);
            values.push(url);
        }

        // 添加更新时间
        updates.push(`updated_at = CURRENT_TIMESTAMP`);

        // 如果没有要更新的字段，直接返回成功
        if (updates.length === 1) {
            return res.json({
                success: true,
                message: '没有更新任何字段',
                data: checkResult.rows[0]
            });
        }

        // 构建更新SQL
        const updateQuery = `
            UPDATE news
            SET ${updates.join(', ')}
            WHERE news_id = $${paramIndex}
            RETURNING *
        `;

        values.push(id);

        // 执行更新
        const result = await pool.query(updateQuery, values);

        res.json({
            success: true,
            message: '新闻更新成功',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('更新新闻失败:', error);
        res.status(500).json({
            success: false,
            message: '更新新闻失败: ' + error.message
        });
    }
};

/**
 * 删除新闻
 */
export const deleteNews = async (req, res) => {
    try {
        const { id } = req.params;

        // 先检查新闻是否存在
        const checkResult = await pool.query(
            'SELECT * FROM news WHERE news_id = $1',
            [id]
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '新闻不存在'
            });
        }

        // 执行删除
        await pool.query('DELETE FROM news WHERE news_id = $1', [id]);

        res.json({
            success: true,
            message: '新闻删除成功'
        });
    } catch (error) {
        console.error('删除新闻失败:', error);
        res.status(500).json({
            success: false,
            message: '删除新闻失败: ' + error.message
        });
    }
};

/**
 * 更新新闻状态 - 用于审核、发布、下线等操作
 */
export const updateNewsStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (status === undefined) {
            return res.status(400).json({
                success: false,
                message: '状态参数为必填项'
            });
        }

        // 验证状态值
        if (![0, 1, 2, 3].includes(Number(status))) {
            return res.status(400).json({
                success: false,
                message: '无效的状态值，有效值为：0(草稿), 1(待审核), 2(已发布), 3(已下线)'
            });
        }

        // 准备SQL
        let updateQuery = `
            UPDATE news
            SET status = $1, updated_at = CURRENT_TIMESTAMP
        `;

        const params = [status];

        // 如果状态为已发布，设置published_at
        if (Number(status) === 2) {
            updateQuery += `, published_at = CURRENT_TIMESTAMP`;
        }

        updateQuery += ` WHERE news_id = $2 RETURNING *`;
        params.push(id);

        // 执行更新
        const result = await pool.query(updateQuery, params);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '新闻不存在'
            });
        }

        // 返回状态消息
        const statusMessages = {
            0: '新闻已保存为草稿',
            1: '新闻已提交审核',
            2: '新闻已发布',
            3: '新闻已下线'
        };

        res.json({
            success: true,
            message: statusMessages[status] || '新闻状态已更新',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('更新新闻状态失败:', error);
        res.status(500).json({
            success: false,
            message: '更新新闻状态失败: ' + error.message
        });
    }
};

/**
 * 审核新闻
 */
export const auditNews = async (req, res) => {
    try {
        const { id } = req.params;
        const { approved, reason } = req.body;

        if (approved === undefined) {
            return res.status(400).json({
                success: false,
                message: '审核结果为必填项'
            });
        }

        // 设置新状态：审核通过(2-已发布) 或 审核拒绝(3-已下线)
        const newStatus = approved ? 2 : 3;

        // 更新新闻状态
        const updateQuery = `
            UPDATE news
            SET 
                status = $1, 
                audit_reason = $2,
                ${approved ? 'published_at = CURRENT_TIMESTAMP,' : ''}
                updated_at = CURRENT_TIMESTAMP
            WHERE news_id = $3 AND status = 1
            RETURNING *
        `;

        const result = await pool.query(updateQuery, [newStatus, reason || null, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '新闻不存在或不是待审核状态'
            });
        }

        res.json({
            success: true,
            message: approved ? '新闻审核通过，已发布' : '新闻审核拒绝',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('审核新闻失败:', error);
        res.status(500).json({
            success: false,
            message: '审核新闻失败: ' + error.message
        });
    }
};

/**
 * 下线新闻
 */
export const offlineNews = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        // 更新新闻状态为已下线
        const updateQuery = `
            UPDATE news
            SET 
                status = 3, 
                offline_reason = $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE news_id = $2 AND status = 2
            RETURNING *
        `;

        const result = await pool.query(updateQuery, [reason || null, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '新闻不存在或不是已发布状态'
            });
        }

        res.json({
            success: true,
            message: '新闻已成功下线',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('下线新闻失败:', error);
        res.status(500).json({
            success: false,
            message: '下线新闻失败: ' + error.message
        });
    }
};

/**
 * 更新所有新闻为已发布状态（一次性工具函数）
 */
export const updateAllNewsToPublished = async (req, res) => {
    try {
        // 添加防御性检查
        if (!req.admin) {
            return res.status(401).json({
                success: false,
                message: '未授权，请先登录'
            });
        }

        // 安全地检查角色 - 使用可选链和默认值
        const roleCode = req.admin?.role?.roleCode || '';
        const isAdmin = roleCode === 'superadmin' || roleCode === 'admin';

        if (!isAdmin) {
            return res.status(403).json({
                success: false,
                message: '只有管理员可以执行此操作'
            });
        }

        // 更新所有新闻状态为已发布
        const updateResult = await pool.query(`
            UPDATE news
            SET status = 2,
                published_at = COALESCE(published_at, CURRENT_TIMESTAMP)
            WHERE status != 2
            RETURNING news_id, title
        `);

        res.json({
            success: true,
            message: `已成功将 ${updateResult.rowCount} 条新闻设置为已发布状态`,
            updatedNews: updateResult.rows
        });
    } catch (error) {
        console.error('批量更新新闻状态失败:', error);
        res.status(500).json({
            success: false,
            message: '批量更新新闻状态失败: ' + error.message
        });
    }
};