import jwt from 'jsonwebtoken';

// JWT令牌验证中间件
export const verifyToken = (req, res, next) => {
    try {
        // 从请求头中获取Authorization字段
        const authHeader = req.headers.authorization;

        // 检查Authorization头是否存在
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: '未提供访问令牌'
            });
        }

        // 提取令牌 (Bearer token格式)
        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({
                success: false,
                message: '令牌格式错误'
            });
        }

        // 验证JWT令牌
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 将解码后的用户信息添加到请求对象中
        req.user = decoded;

        // 继续下一步处理
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: '令牌已过期'
            });
        }

        return res.status(401).json({
            success: false,
            message: '无效的令牌'
        });
    }
};