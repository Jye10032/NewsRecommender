-- 为所有用户创建偏好表记录
-- 你需要将已有用户表中的所有用户ID插入到user_preferences表中。在PostgreSQL中，可以使用INSERT INTO ... SELECT语法，结合ON CONFLICT子句来实现这一功能。

-- 解决方案
-- 为所有用户创建偏好表记录，默认为空数组
INSERT INTO user_preferences (user_id, preferences)
SELECT user_id, '{}'::TEXT[] 
FROM users
ON CONFLICT (user_id) DO NOTHING;
-- 详细解释
-- 这段SQL代码的工作原理：

-- SELECT user_id FROM users：从users表中查询所有用户ID
-- '{}'::TEXT[]：创建一个空的文本数组作为默认偏好值
-- INSERT INTO user_preferences：将这些值插入偏好表
-- ON CONFLICT (user_id) DO NOTHING：如果用户ID已存在于偏好表中，则跳过不做修改
-- 验证结果
-- 执行后，可以通过以下查询验证结果：
-- 检查每个用户是否都有偏好记录
SELECT u.user_id, 
       CASE WHEN p.user_id IS NULL THEN 'Missing' ELSE 'Exists' END AS preference_status,
       p.preferences
FROM users u
LEFT JOIN user_preferences p ON u.user_id = p.user_id;
-- 注意事项
-- 此SQL语句是幂等的，可以多次运行而不会出错
-- 表定义中已包含默认时间戳，无需指定
-- 如果用户表中有大量用户，可能需要分批处理
-- 这样，每个用户都会在user_preferences表中拥有一条记录，偏好设置默认为空数组。