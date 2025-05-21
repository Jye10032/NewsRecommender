// middleware/authMiddleware.js
import jwt from 'jsonwebtoken';

// 验证管理员JWT令牌
export const verifyAdminToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: '未授权，请登录'
            });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 将用户信息添加到请求对象
        req.user = decoded;
        next();
    } catch (error) {
        console.error('token验证失败:', error);
        return res.status(401).json({
            success: false,
            message: '令牌无效或已过期，请重新登录'
        });
    }
};

// 检查特定权限
export const hasPermission = (permissionCode) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: '未授权，请登录'
            });
        }

        // 超级管理员拥有所有权限
        if (req.user.roles.includes('admin')) {
            return next();
        }

        // 检查是否有特定权限
        if (req.user.permissions.includes(permissionCode)) {
            return next();
        }

        return res.status(403).json({
            success: false,
            message: '您没有执行此操作的权限'
        });
    };
};