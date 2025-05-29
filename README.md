# NewsRecommender

前端

后端

\COPY news (news_id, category, subcategory, title, abstract, url, title_entities, abstract_entities)FROM 'C:/Users/Ming Gy/Desktop/graduate/NewsRecommender/data/processed/MINDdemo_train/news.tsv'WITH (FORMAT CSV, DELIMITER E'\t', NULL '[]', HEADER);

将新闻发布时间设置为基于2020年1月1日的随机时间

```
-- 首先确保发布时间字段存在
ALTER TABLE news
ADD COLUMN IF NOT EXISTS published_at TIMESTAMP;-- 将所有NULL发布时间更新为基于2020年1月1日的随机时间
UPDATE news
SET published_at = '2020-01-01'::TIMESTAMP + (random() * interval '365 days')
WHERE published_at IS NULL;
```

可以使用以下命令生成安全的随机密钥

node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

启动 psql -U postgres -d NewsRecommender

终端设置临时环境变量

```
# 设置数据库用户
set PGUSER=postgres

# 设置数据库名称
set PGDATABASE=NewsRecommender

# 设置密码（如果需要）
set PGPASSWORD=你的密码

# 设置主机（如果不是localhost）
set PGHOST=localhost

# 设置端口（如果不是默认5432）
set PGPORT=5432
```

出现的问题：

前端：

1. tsx文件未写后缀

后端：

1. API未在index中注册
2. 令牌过期，无法发送请求（需修改）
3.
