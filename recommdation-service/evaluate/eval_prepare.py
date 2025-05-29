# eval_prepare.py
import os
import json
import pandas as pd
import numpy as np

# 选择合适的测试集 - 推荐使用MINDsmall_dev或MINDlarge_dev

import os

# 获取当前脚本所在目录
current_dir = os.path.dirname(os.path.abspath(__file__))

# 构建到项目根目录的路径
project_root = os.path.abspath(os.path.join(current_dir, '../..'))

# 指向数据集的路径
DATASET_PATH = os.path.join(project_root, 'data', 'processed', 'MINDdemo_dev')

# 打印路径以便调试
print(f"数据集路径: {DATASET_PATH}")
print(f"新闻文件路径: {os.path.join(DATASET_PATH, 'news.tsv')}")


def prepare_evaluation_data():
    """准备评估数据集"""
    # 读取新闻数据
    news_file = os.path.join(DATASET_PATH, 'news.tsv')
    news_df = pd.read_csv(news_file, sep='\t', header=None,
                          names=['news_id', 'category', 'subcategory', 'title', 'abstract', 'url', 'title_entities', 'abstract_entities'])

    # 读取行为数据
    behaviors_file = os.path.join(DATASET_PATH, 'behaviors.tsv')
    behaviors_df = pd.read_csv(behaviors_file, sep='\t', header=None,
                               names=['impression_id', 'user_id', 'time', 'history', 'impressions'])

    # 限制处理的行数用于测试
    behaviors_df = behaviors_df.head(500)  # 只处理前500行
    print(f"为加快测试，仅处理 {len(behaviors_df)} 条用户行为数据")
    # 构建测试样本
    test_samples = []

    for _, row in behaviors_df.iterrows():
        user_id = row['user_id']

        # 处理历史记录
        history = []
        if isinstance(row['history'], str) and row['history']:
            history_news_ids = row['history'].split()
            for news_id in history_news_ids:
                news_info = news_df[news_df['news_id'] == news_id]
                if not news_info.empty:
                    history.append({
                        'news_id': news_id,
                        'title': news_info.iloc[0]['title'],
                        'category': news_info.iloc[0]['category'],
                        'subcategory': news_info.iloc[0]['subcategory']
                    })

        # 处理曝光列表
        impressions = []
        clicked_news = []
        if isinstance(row['impressions'], str):
            impression_items = row['impressions'].split()
            for item in impression_items:
                parts = item.split('-')
                if len(parts) == 2:
                    news_id, label = parts
                    news_info = news_df[news_df['news_id'] == news_id]
                    if not news_info.empty:
                        news_item = {
                            'news_id': news_id,
                            'title': news_info.iloc[0]['title'],
                            'category': news_info.iloc[0]['category'],
                            'subcategory': news_info.iloc[0]['subcategory'],
                            'clicked': label == '1'
                        }
                        impressions.append(news_item)
                        if label == '1':
                            clicked_news.append(news_item)

        test_samples.append({
            'user_id': user_id,
            'history': history,
            'impressions': impressions,
            'clicked_news': clicked_news
        })

    return test_samples


if __name__ == "__main__":
    samples = prepare_evaluation_data()
    print(f"准备了 {len(samples)} 个测试样本")

    # 保存评估数据供后续使用
    with open('evaluation_data.json', 'w', encoding='utf-8') as f:
        json.dump(samples, f, ensure_ascii=False, indent=2)
