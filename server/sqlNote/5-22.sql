-- 首先修改news表，添加外键约束
ALTER TABLE news 
ADD CONSTRAINT fk_news_category 
FOREIGN KEY (category) REFERENCES categories(code) 
ON DELETE SET NULL ON UPDATE CASCADE;

-- 添加subcategory的外键约束
ALTER TABLE news 
ADD CONSTRAINT fk_news_subcategory 
FOREIGN KEY (subcategory) REFERENCES categories(code) 
ON DELETE SET NULL ON UPDATE CASCADE;

-- 创建管理员-分类关联表
CREATE TABLE IF NOT EXISTS admin_category_permissions (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER NOT NULL,
  category_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (admin_id, category_id),
  FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- 创建分类管理角色
INSERT INTO roles (role_name, role_code)
VALUES ('分类管理员', 'category_manager') 
ON CONFLICT (role_code) DO NOTHING;

-- 为分类管理创建相关权限
INSERT INTO rights (title, key_path, grade, pagepermisson)
VALUES 
('分类内容管理', '/news-manage/category', 1, 1),
('分类新闻审核', '/audit-manage/category', 1, 1)
ON CONFLICT (key_path) DO NOTHING;