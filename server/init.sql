-- 创建数据库（如果不存在）



-- -- 创建用户表（如果不存在）
-- CREATE TABLE IF NOT EXISTS users (
--     id INT AUTO_INCREMENT PRIMARY KEY,
--     username VARCHAR(50) NOT NULL UNIQUE,
--     email VARCHAR(100) NOT NULL UNIQUE,
--     password VARCHAR(255) NOT NULL,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

CREATE TABLE IF NOT EXISTS news(
    news_id VARCHAR(50) PRIMARY KEY, --新闻 ID
    category VARCHAR(50), --新闻类别
    subcategory VARCHAR(50), --新闻子类别
    title TEXT NOT NULL, --新闻标题
    abstract TEXT, --新闻摘要
    url TEXT, --新闻 URL
    
    title_entities JSONB, --新闻标题中的实体信息（存储为 JSON 格式）
    abstract_entities JSONB-- 新闻摘要中的实体信息（存储为 JSON 格式）
    --content_path TEXT,  -- 新闻正文文件路径
    --published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- 发布时间
);

-- --导入新闻数据

-- NewsRecommender=# \copy news(news_id, category, subcategory, title, abstract, url, title_entities, abstract_entities)FROM 'C:/Users/Ming Gy/Desktop/graduate/NewsRecommender/data/processed/MINDdemo_train/news.tsv'WITH (FORMAT csv, DELIMITER E'\t',QUOTE E'\x01',ESCAPE E'\\', HEADER false); 
-- COPY 26740

CREATE TABLE IF NOT EXISTS users(
    user_id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,      -- 用户密码（加密存储）
    preferences JSONB,                   -- 用户偏好（如感兴趣的新闻类别，存储为 JSON 格式）
    last_login TIMESTAMP                 -- 用户最后登录时间
);

-- -- 为 username 和 password 设置默认值
-- UPDATE users
-- SET username = user_id, password = '$2b$10$q8dB6T6Z9Pl/t/1FqTFFQeXwQeC78Ch3vX7sjNUXlJs0OxKkhb2AC'
-- WHERE username IS NULL;

-- \copy users(user_id)FROM 'C:\Users\Ming Gy\Desktop\graduate\NewsRecommender\data\user_id_demo_dev.txt'WITH (FORMAT text);

-- -- 创建文章表（如果不存在）
-- CREATE TABLE IF NOT EXISTS articles (
--     id INT AUTO_INCREMENT PRIMARY KEY,
--     title VARCHAR(255) NOT NULL,
--     content TEXT NOT NULL,
--     category VARCHAR(50),
--     published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );