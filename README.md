# NewsRecommender

前端

后端


\COPY news (news_id, category, subcategory, title, abstract, url, title_entities, abstract_entities)FROM 'C:/Users/Ming Gy/Desktop/graduate/NewsRecommender/data/processed/MINDdemo_train/news.tsv'WITH (FORMAT CSV, DELIMITER E'\t', NULL '[]', HEADER);

psql -U postgres -d NewsRecommender
