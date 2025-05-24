import jwt from 'jsonwebtoken';
import { pool } from '../../connect.js';

// 验证管理员JWT令牌
export const verifyAdminToken = async (req, res, next) => {
    try {
        // 开发环境可临时跳过认证
        if (process.env.NODE_ENV === 'development' && process.env.SKIP_AUTH === 'true') {
            console.log('开发模式：跳过认证');
            req.admin = {
                id: 1,
                username: 'admin',
                role: {
                    id: 1,
                    code: 'superadmin',
                    name: '超级管理员'
                }
            };
            return next();
        }

        // 从请求头获取token
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: '未提供认证令牌'
            });
        }

        const token = authHeader.split(' ')[1];

        try {
            // 验证token
            const secret = process.env.JWT_SECRET || 'your-secret-key';
            const decoded = jwt.verify(token, secret);

            // 设置基本信息
            req.user = decoded;  // 保持向后兼容
            req.admin = {        // 新的统一接口
                id: decoded.id,
                username: decoded.username
            };

            // 如果token中包含role信息，直接使用
            if (decoded.role) {
                req.admin.role = {
                    code: decoded.role
                };
            }

            // 如果需要，可以从数据库获取更详细的用户信息
            // 但不强制依赖数据库，避免数据库问题导致认证失败

            next();
        } catch (jwtError) {
            console.error('Token验证失败:', jwtError);
            return res.status(401).json({
                success: false,
                message: '认证令牌无效或已过期'
            });
        }
    } catch (error) {
        console.error('认证中间件错误:', error);
        return res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
};

// 检查特定权限 - 更健壮的实现
export const hasPermission = (permissionCode) => {
    return (req, res, next) => {
        // 统一使用req.admin
        const user = req.admin || req.user;

        if (!user) {
            return res.status(401).json({
                success: false,
                message: '未授权，请登录'
            });
        }

        // 安全地访问角色
        const roles = user.roles || [];
        const permissions = user.permissions || [];

        // 超级管理员拥有所有权限
        if (Array.isArray(roles) && roles.includes('admin')) {
            return next();
        }

        // 检查用户的角色代码
        if (user.role && user.role.code === 'superadmin') {
            return next();
        }

        // 检查是否有特定权限
        if (Array.isArray(permissions) && permissions.includes(permissionCode)) {
            return next();
        }

        return res.status(403).json({
            success: false,
            message: '您没有执行此操作的权限'
        });
    };
};