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
    content TEXT, --新闻内容（新增字段）
    author TEXT, --作者名称（新增字段）
    url TEXT, --新闻 URL
    
    title_entities JSONB, --新闻标题中的实体信息（存储为 JSON 格式）
    abstract_entities JSONB, --新闻摘要中的实体信息（存储为 JSON 格式）
    published_at TIMESTAMP, --发布时间
    status INTEGER DEFAULT 2, --状态(0:草稿,1:待审核,2:已发布,3:已下线,4:已删除)
    
    created_by VARCHAR(50), --创建者ID
    audit_by VARCHAR(50), --审核者ID
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, --创建时间
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, --更新时间
    deleted_at TIMESTAMP, --删除时间（用于软删除）
    
    cover_image_url TEXT --封面图片URL
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

-- 用户偏好表
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id VARCHAR(255) PRIMARY KEY,
  preferences TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS news_views (
    view_id SERIAL PRIMARY KEY,
    news_id VARCHAR(100) NOT NULL,
    user_id VARCHAR(255),  -- 可为NULL，表示匿名用户
    view_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45) -- 可选，记录IP地址
);

-- 创建索引以提高查询效率
CREATE INDEX IF NOT EXISTS idx_news_category ON news(category);
CREATE INDEX IF NOT EXISTS idx_news_status ON news(status);
CREATE INDEX IF NOT EXISTS idx_news_created_at ON news(created_at);

-- 为提高查询效率创建索引
CREATE INDEX IF NOT EXISTS idx_news_views_news_id ON news_views(news_id);
CREATE INDEX IF NOT EXISTS idx_news_views_user_id ON news_views(user_id);