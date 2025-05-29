# evaluate_diversity.py
import json
import numpy as np
from collections import Counter


def calculate_diversity(recommendations_list):
    """计算推荐的多样性"""
    categories = []
    for recs in recommendations_list:
        for item in recs:
            if 'category' in item:
                categories.append(item['category'])

    if not categories:
        return 0

    # 计算香农熵作为多样性指标
    counter = Counter(categories)
    total = len(categories)
    entropy = 0
    for count in counter.values():
        prob = count / total
        entropy -= prob * np.log2(prob)

    # 归一化熵
    max_entropy = np.log2(len(counter))
    if max_entropy > 0:
        normalized_entropy = entropy / max_entropy
    else:
        normalized_entropy = 0

    return normalized_entropy


# 从之前的评估结果中提取推荐列表
with open('all_recommendations.json', 'r') as f:
    recommendations_list = json.load(f)

diversity_score = calculate_diversity(recommendations_list)
print(f"推荐多样性分数: {diversity_score:.4f} (0-1范围，越高越多样化)")

# 还可以分析不同类别的覆盖率
category_coverage = {}
all_categories = set()
for recs in recommendations_list:
    for item in recs:
        if 'category' in item:
            all_categories.add(item['category'])
            category_coverage[item['category']] = category_coverage.get(
                item['category'], 0) + 1

# 打印类别覆盖情况
print("\n类别覆盖统计:")
total = sum(category_coverage.values())
for category, count in sorted(category_coverage.items(), key=lambda x: x[1], reverse=True):
    percentage = (count / total) * 100
    print(f"{category:<20}: {count:>5} ({percentage:.2f}%)")
