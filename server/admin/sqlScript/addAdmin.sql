-- 创建超级管理员用户（如果不存在）
DO $$
DECLARE
    admin_exists BOOLEAN;
BEGIN
    -- 检查超级管理员是否存在
    SELECT EXISTS(SELECT 1 FROM admin_users WHERE username = 'admin') INTO admin_exists;
    
    IF NOT admin_exists THEN
        -- 创建超级管理员用户 (密码为admin123的bcrypt哈希)
        INSERT INTO admin_users (username, password, role_id, status)
        VALUES ('admin', '$2b$10$X/RtYDyPWMkqB.dCQB9w0OyQFK51FiJkExP5qFEmNvMFBnNMaUASe', 1, 1);
    ELSE
        -- 确保存在的admin用户有超级管理员角色
        UPDATE admin_users SET role_id = 1 WHERE username = 'admin';
    END IF;
END $$;

-- 将角色ID设置为1 (超级管理员)
UPDATE admin_users SET role_id = 1 WHERE username = 'admin';