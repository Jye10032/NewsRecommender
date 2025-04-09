-- 创建数据库（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'NewsRecommender') THEN
        CREATE DATABASE "NewsRecommender";
    END IF;
END $$;



-- -- 创建用户表（如果不存在）
-- CREATE TABLE IF NOT EXISTS users (
--     id INT AUTO_INCREMENT PRIMARY KEY,
--     username VARCHAR(50) NOT NULL UNIQUE,
--     email VARCHAR(100) NOT NULL UNIQUE,
--     password VARCHAR(255) NOT NULL,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- -- 创建文章表（如果不存在）
-- CREATE TABLE IF NOT EXISTS articles (
--     id INT AUTO_INCREMENT PRIMARY KEY,
--     title VARCHAR(255) NOT NULL,
--     content TEXT NOT NULL,
--     category VARCHAR(50),
--     published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );