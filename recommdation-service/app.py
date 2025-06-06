import atexit
from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
import os
import numpy as np
import pandas as pd
import logging
import pickle
import yaml
from tensorflow.keras.preprocessing.sequence import pad_sequences


# from models.enhanced_npa.model import EnhancedNPAModel

# 配置日志
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # 允许跨域请求


# # 加载模型
# model_path = os.path.join("trained_models", "npa_ckpt")
# model = EnhancedNPAModel.load(model_path)

# 模型路径
MODEL_PATH = os.environ.get(
    'MODEL_PATH', './models/trained_models/npa_ckpt')
WORD_DICT_PATH = os.environ.get('WORD_DICT_PATH', './utils/word_dict.pkl')
USER_DICT_PATH = os.environ.get('USER_DICT_PATH', './utils/uid2index.pkl')
EMBED_PATH = os.environ.get('EMBED_PATH', './utils/embedding.npy')
YAML_PATH = os.environ.get('YAML_PATH', './utils/npa.yaml')

# 加载模型
model = None
word_dict = None
user_dict = None
embedding_matrix = None
config = None
# 在模块顶部添加
graph = None
session = None
model_loaded = False  # 跟踪模型是否已加载成功


def load_resources():
    """加载词典、用户映射和配置"""
    global word_dict, user_dict, config

    try:
        # 加载词典
        if os.path.exists(WORD_DICT_PATH):
            with open(WORD_DICT_PATH, 'rb') as f:
                word_dict = pickle.load(f)
                logger.info(f"词典加载成功，包含 {len(word_dict)} 个词")
        else:
            logger.warning(f"词典文件不存在: {WORD_DICT_PATH}")
            return False

        # 加载用户字典
        if os.path.exists(USER_DICT_PATH):
            with open(USER_DICT_PATH, 'rb') as f:
                user_dict = pickle.load(f)
                logger.info(f"用户字典加载成功，包含 {len(user_dict)} 个用户")
        else:
            logger.warning(f"用户字典文件不存在: {USER_DICT_PATH}")
            return False

        # 加载YAML配置
        if os.path.exists(YAML_PATH):
            with open(YAML_PATH, 'r') as f:
                config = yaml.safe_load(f)
                logger.info("YAML配置加载成功")
        else:
            logger.warning(f"YAML配置文件不存在: {YAML_PATH}")
            config = {"data": {"title_size": 10}}  # 使用默认配置

        # 检查嵌入文件
        if not os.path.exists(EMBED_PATH):
            logger.warning(f"嵌入文件不存在: {EMBED_PATH}")
            # 如果需要，这里可以创建一个空的嵌入矩阵作为占位符

        return True
    except Exception as e:
        logger.error(f"加载资源文件失败: {str(e)}")
        return False


def load_model():
    """加载NPA模型"" - 使用单例模式确保只加载一次"""
    global model, news_encoder, graph, session, model_loaded

   # 如果模型已成功加载，直接返回
    if model_loaded and model is not None:
        logger.info("模型已加载，跳过重复加载")
        return True

    # 清理之前的会话和图
    if session is not None:
        logger.info("关闭之前的TensorFlow会话")
        session.close()

    # 创建新的图和会话
    graph = tf.Graph()
    with graph.as_default():
        # 创建新的会话
        # 设置显存增长选项，避免占用全部GPU内存
        config = tf.compat.v1.ConfigProto()
        config.gpu_options.allow_growth = True
        session = tf.compat.v1.Session(config=config)

        with session.as_default():
            try:
                # 导入推荐器模块
                from recommenders.models.newsrec.models.npa import NPAModel
                from recommenders.models.newsrec.io.mind_iterator import MINDIterator
                from recommenders.models.newsrec.newsrec_utils import prepare_hparams

                # 准备模型超参数
                yaml_file = './utils/npa.yaml'
                hparams = prepare_hparams(yaml_file,
                                          wordEmb_file=EMBED_PATH,
                                          wordDict_file=WORD_DICT_PATH,
                                          userDict_file=USER_DICT_PATH)

                # 初始化模型
                model = NPAModel(hparams, MINDIterator)

                # 加载预训练权重
                logger.info(f"尝试加载模型权重: {MODEL_PATH}")
                model.model.load_weights(MODEL_PATH)

                model.scorer.set_weights(model.model.get_weights())
                logger.info("Scorer模型权重已加载")

                # 打印模型输入信息，帮助调试
                logger.info(f"Model输入: {[i.name for i in model.model.inputs]}")
                if hasattr(model, 'scorer'):
                    logger.info(
                        f"Scorer输入: {[i.name for i in model.scorer.inputs]}")

                # # 也可以单独加载新闻编码器，用于预处理新闻
                # news_encoder = tf.keras.models.load_model(NEWS_ENCODER_PATH)

                logger.info("NPA模型加载成功!")
                model_loaded = True
                return True
            except Exception as e:
                logger.error(f"模型加载失败: {str(e)}")
                import traceback
                logger.error(traceback.format_exc())
                model_loaded = False
                return False


# def preprocess_news(news_pool):
#     """预处理新闻数据，准备输入模型的格式"""
#     # 这里需要根据MIND数据集的具体预处理步骤实现
#     # 通常包括标题分词、转换为ID序列等
#     processed_news = []

#     for news in news_pool:
#         # 示例处理，实际需要根据模型要求调整
#         title_words = news.get('title', '').lower().split()
#         title_ids = [word_dict.get(w, 0) for w in title_words]
#         # 截断或填充到固定长度
#         title_ids = title_ids[:30] + [0] * max(0, 30 - len(title_ids))

#         processed_news.append({
#             'news_id': news['news_id'],
#             'title': title_ids
#         })

#     return processed_news
def process_titles(titles):
    """处理新闻标题，将文本转换为ID序列"""
    title_size = 10
    if config and "data" in config and "title_size" in config["data"]:
        title_size = config["data"]["title_size"]

    logger.info(f"使用标题大小: {title_size}")

    processed_titles = []
    for title in titles:
        # 分词并转换为小写
        words = title.lower().split()
        # 转换为ID
        word_ids = [word_dict.get(word, 0) for word in words]
        # 截断或填充
        if len(word_ids) > title_size:
            word_ids = word_ids[:title_size]
        else:
            word_ids = word_ids + [0] * (title_size - len(word_ids))
        processed_titles.append(word_ids)

    return np.array(processed_titles)


def get_user_embedding(user_id):
    """获取用户嵌入表示"""
    # 如果用户不在词典中，创建随机表示或使用默认表示
    user_index = user_dict.get(user_id, 0)
    if user_index == 0:
        logger.warning(f"用户 {user_id} 不在训练集中，使用默认表示")
    return user_index


@app.route('/recommend', methods=['POST'])
def recommend():
    """推荐接口 - 从数据库获取的预处理新闻"""
    global model, graph, session, model_loaded
    # if model is None:
    # 移除条件判断，每次请求都重新加载模型
    # 只在首次请求时加载模型
    if not model_loaded or model is None:
        success = load_model()
        if not success:
            return jsonify({'success': False, 'error': '模型加载失败'}), 500
    try:
        # 获取请求数据
        data = request.json
        user_id = data.get('userId')
        user_history = data.get('userHistory', [])
        news_pool = data.get('newsPool', [])

        count = min(int(data.get('count', 10)), len(news_pool))

        user_preferences = data.get('userPreferences', [])  # 获取用户偏好

        logger.info(f"收到推荐请求: 用户={user_id}, 候选新闻数={len(news_pool)}")

        if not news_pool:
            return jsonify({
                'success': False,
                'error': '新闻池为空'
            }), 400

        # 1. 获取用户索引
        user_index = get_user_embedding(user_id)

        # 2. 提取并处理新闻标题
        titles = [news.get('title', '') for news in news_pool]
        processed_titles = process_titles(titles)

        # 3. 处理用户历史浏览记录

        if not user_history:
            # 如果没有历史记录，创建空历史或默认历史
            logger.warning(f"用户 {user_id} 没有浏览历史，使用空历史")
            # 创建一个空的历史记录矩阵，形状应该是 [1, his_size, title_size]
            his_size = 50
            # his_size = config.get('data', {}).get('his_size', 5)  # 从配置中获取历史大小
            title_size = config.get('data', {}).get(
                'title_size', 10)  # 从配置中获取标题大小
            history_titles = np.zeros(
                (1, his_size, title_size), dtype=np.int32)
        else:
            # 处理真实历史记录
            history_titles_text = [news.get('title', '')
                                   for news in user_history[:5]]  # 限制历史记录数量
            processed_history = process_titles(history_titles_text)
            # 重塑为[1, 历史数, 标题长度]的形状
            his_size = config.get('data', {}).get('his_size', 5)
            title_size = config.get('data', {}).get('title_size', 10)

            # 填充或截断历史记录到固定长度
            if len(processed_history) > his_size:
                processed_history = processed_history[:his_size]
            else:
                padding = np.zeros(
                    (his_size - len(processed_history), title_size), dtype=np.int32)
                processed_history = np.vstack((processed_history, padding))

            history_titles = processed_history.reshape(1, his_size, title_size)

        # 4. 准备模型输入 - 注意现在是3个输入
        user_input = np.array([[user_index]])

        logger.info(
            f"模型输入形状: user_input={user_input.shape}, processed_titles={processed_titles.shape}, history_titles={history_titles.shape}")

        # 5. 预测部分使用正确的会话管理
        with graph.as_default():
            with session.as_default():
                try:
                    # 限制新闻数量为模型所需的50条
                    max_news = 10  # 模型要求的最大新闻条数

                    # 预选新闻
                    selected_news = news_pool[:max_news]
                    all_scores = []

                    # 循环预测每条新闻
                    for i, news in enumerate(selected_news):
                        # 处理单条新闻
                        single_title = processed_titles[i:i+1]
                        single_title = single_title.reshape(
                            1, 1, single_title.shape[1])

                        # 单条预测
                        score = model.scorer.predict(
                            [user_input, history_titles, single_title])
                        raw_score = float(score[0, 0])

                        # 应用用户偏好提升
                        category = news.get('category')
                        if user_preferences and category and category in user_preferences:
                            logger.info(
                                f"新闻'{news.get('title', '')}'类别匹配用户偏好，得分提升50%")
                            raw_score *= 1.5

                        all_scores.append(raw_score)

                    news_with_scores = [(news, score)
                                        for news, score in zip(selected_news, all_scores)]
                    sorted_news = sorted(
                        news_with_scores, key=lambda x: x[1], reverse=True)

                    # 获取结果
                    recommendations = [news for news, _ in sorted_news[:count]]

                    return jsonify({
                        'success': True,
                        'recommendations': recommendations
                    })
                except Exception as e:
                    logger.error(f"模型预测失败: {str(e)}")

                    # 如果模型预测失败，返回随机推荐
                    import random
                    random.shuffle(news_pool)
                    return jsonify({
                        'success': True,
                        'recommendations': news_pool[:count],
                        'fallback': True,
                        'message': '模型预测失败，使用随机推荐'
                    })

    except Exception as e:
        logger.error(f"推荐失败: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/', methods=['GET'])
def health():
    """健康检查端点"""
    return jsonify({'status': 'ok', 'service': 'news-recommendation'})


if __name__ == '__main__':
    # 启动前加载资源
    load_resources()
    # 可以预加载模型或在第一次请求时加载
    app.run(host='0.0.0.0', port=5001)

# 在文件底部添加

# 程序启动时加载资源
load_resources()


@atexit.register
def cleanup():
    """程序退出时清理资源"""
    global session
    if session is not None:
        logger.info("关闭TensorFlow会话并释放资源")
        session.close()
# @app.route('/recommend', methods=['POST'])
# def recommend():
#     data = request.json
#     user_id = data.get('userId')
#     news_pool = data.get('newsPool', [])
#     count = data.get('count', 10)

#     # 调用模型生成推荐
#     recommendations = model.get_recommendations(user_id, news_pool, count)

#     return jsonify({
#         'success': True,
#         'recommendations': recommendations
#     })


# if __name__ == '__main__':
#     app.run(host='0.0.0.0', port=5001)
