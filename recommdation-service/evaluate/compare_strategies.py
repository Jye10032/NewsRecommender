# compare_strategies.py
import json
import numpy as np
import requests
import time
import matplotlib.pyplot as plt

# 加载评估数据
with open('evaluation_data.json', 'r', encoding='utf-8') as f:
    test_samples = json.load(f)

# 选择部分样本进行对比测试
test_subset = test_samples[:100]  # 使用前100个样本

# 不同的推荐策略
strategies = [
    {'name': 'NPA模型', 'prefer_history': False, 'boost_categories': False},
    {'name': '历史加权', 'prefer_history': True, 'boost_categories': False},
    {'name': '类别加权', 'prefer_history': False, 'boost_categories': True},
    {'name': '混合策略', 'prefer_history': True, 'boost_categories': True}
]

results = {}

for strategy in strategies:
    print(f"测试策略: {strategy['name']}")

    auc_scores = []
    mrr_scores = []
    ndcg5_scores = []

    for idx, sample in enumerate(test_subset):
        if idx % 10 == 0:
            print(f"  处理样本 {idx+1}/{len(test_subset)}")

        # 准备请求数据 - 添加策略参数
        request_data = {
            'userId': sample['user_id'],
            'userHistory': sample['history'],
            'newsPool': sample['impressions'],
            'count': len(sample['impressions']),
            'strategy': {
                'preferHistory': strategy['prefer_history'],
                'boostCategories': strategy['boost_categories']
            }
        }

        try:
            # 发送到您的推荐API
            response = requests.post(
                'http://localhost:5001/recommend', json=request_data)

            # 计算指标...与evaluate_model.py中相同
            # ...省略相同代码...

            # 避免请求过于频繁
            time.sleep(0.1)

        except Exception as e:
            print(f"处理样本出错: {str(e)}")

    # 计算平均指标
    results[strategy['name']] = {
        'auc': np.mean(auc_scores),
        'mrr': np.mean(mrr_scores),
        'ndcg@5': np.mean(ndcg5_scores)
    }

# 绘制比较图表
metrics = ['auc', 'mrr', 'ndcg@5']
fig, axes = plt.subplots(1, 3, figsize=(15, 5))

for i, metric in enumerate(metrics):
    values = [results[s['name']][metric] for s in strategies]
    axes[i].bar(range(len(strategies)), values)
    axes[i].set_title(metric.upper())
    axes[i].set_xticks(range(len(strategies)))
    axes[i].set_xticklabels([s['name'] for s in strategies], rotation=45)

plt.tight_layout()
plt.savefig('strategy_comparison.png')
print("比较结果已保存为 strategy_comparison.png")
