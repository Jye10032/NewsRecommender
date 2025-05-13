import { pool } from './connect.js';

// 获取用户偏好设置
export const getUserPreferences = async (req, res) => {
    try {
        // 从验证中间件获取用户ID
        const userId = req.user.id;

        // 查询用户偏好
        const query = 'SELECT preferences FROM user_preferences WHERE user_id = $1';
        const result = await pool.query(query, [userId]);

        if (result.rows.length > 0) {
            return res.json({
                success: true,
                preferences: result.rows[0].preferences
            });
        } else {
            return res.json({
                success: true,
                preferences: [] // 没有设置偏好时返回空数组
            });
        }
    } catch (error) {
        console.error('获取用户偏好失败:', error);
        return res.status(500).json({
            success: false,
            message: '获取用户偏好失败'
        });
    }
};

// 保存用户偏好设置
export const saveUserPreferences = async (req, res) => {
    try {
        const userId = req.user.id;
        const { preferences } = req.body;

        if (!Array.isArray(preferences)) {
            return res.status(400).json({
                success: false,
                message: '偏好必须是数组格式'
            });
        }

        // 使用upsert操作 - 如果记录存在则更新，否则插入
        const query = `
      INSERT INTO user_preferences (user_id, preferences)
      VALUES ($1, $2)
      ON CONFLICT (user_id)
      DO UPDATE SET preferences = $2, updated_at = CURRENT_TIMESTAMP
    `;

        await pool.query(query, [userId, preferences]);

        return res.json({
            success: true,
            message: '用户偏好已保存'
        });
    } catch (error) {
        console.error('保存用户偏好失败:', error);
        return res.status(500).json({
            success: false,
            message: '保存用户偏好失败'
        });
    }
};