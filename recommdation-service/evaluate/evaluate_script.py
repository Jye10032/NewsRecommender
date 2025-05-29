# evaluate_script.py
import json
import requests
import time
import matplotlib.pyplot as plt

print("发送测试请求确保模型初始化...")
init_response = requests.post(
    'http://localhost:5001/recommend',
    json={
        'userId': 'test_user',
        'newsPool': [{'news_id': 'N1', 'title': 'Test news'}],
        'count': 1
    },
    headers={'Content-Type': 'application/json'}
)
print(f"初始化请求状态: {init_response.status_code}")
time.sleep(2)  # 等待模型完全加载


# 1. 加载评估数据
with open('evaluation_data.json', 'r', encoding='utf-8') as f:
    test_data = json.load(f)

# 2. 发送评估请求
print(f"发送 {len(test_data)} 个用户样本进行评估...")
start_time = time.time()

# 在发送请求前格式化数据
formatted_impressions = []
for sample in test_data:
    # 确保键名一致性
    formatted_sample = {
        'userId': sample.get('user_id'),  # 将user_id转换为userId
        'history': sample.get('history', []),
        'impressions': sample.get('impressions', []),
        'clicked_news': sample.get('clicked_news', [])
    }
    formatted_impressions.append(formatted_sample)

response = requests.post(
    'http://localhost:5001/evaluate',
    json={'impressions': formatted_impressions},
    headers={'Content-Type': 'application/json'}
)
# response = requests.post(
#     'http://localhost:5001/evaluate',
#     json={'impressions': test_data},
#     headers={'Content-Type': 'application/json'}
# )

elapsed_time = time.time() - start_time
print(f"评估完成，耗时 {elapsed_time:.2f} 秒")

# 3. 分析结果
if response.status_code == 200:
    result = response.json()
    if result['success']:
        metrics = result['metrics']
        print("\n评估结果:")
        print(f"样本数: {result['samples_evaluated']}")
        print(f"AUC: {metrics['auc']:.4f}")
        print(f"MRR: {metrics['mrr']:.4f}")
        print(f"nDCG@5: {metrics['ndcg@5']:.4f}")
        print(f"nDCG@10: {metrics['ndcg@10']:.4f}")

        # 可视化结果
        plt.figure(figsize=(10, 6))
        plt.bar(['AUC', 'MRR', 'nDCG@5', 'nDCG@10'],
                [metrics['auc'], metrics['mrr'], metrics['ndcg@5'], metrics['ndcg@10']])
        plt.title('新闻推荐系统评估指标')
        plt.ylim(0, 1)
        plt.savefig('evaluation_results.png')
        print("\n结果图表已保存至 evaluation_results.png")
    else:
        print(f"评估失败: {result.get('error', '未知错误')}")
else:
    print(f"请求失败: {response.status_code}")
    print(response.text)
