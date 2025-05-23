import schedule
import time
import logging
from scripy import crawler

logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
                    filename='crawler.log')


def crawl_news():
    """执行爬虫任务"""
    logging.info("开始执行定时爬虫任务")

    news_columns_dict = {
        'politics': '政治',
        'society': '社会',
        'diplomacy': '外交',
        'military': '军事',
        'science': '科学',
        'odd': '奇文',
        'graphic': '图文',
        '100-CPC-Stories-in-100-Days': '百年党史'
    }

    # 数据库配置
    db_config = {
        'host': 'localhost',
        'database': 'newsdb',
        'user': 'postgres',
        'password': 'your_password',
        'port': 5432
    }

    # 创建爬虫实例并执行
    try:
        news_crawler = crawler('https://www.globaltimes.cn/china',
                               news_columns_dict,
                               db_config,
                               crawl_page_num=2)  # 每次爬取前2页
        news_crawler.crawl()
        logging.info("爬虫任务执行完成")
    except Exception as e:
        logging.error(f"爬虫任务执行失败: {e}")


# 设置定时任务
# 每天凌晨2点执行
schedule.every().day.at("02:00").do(crawl_news)

# 每周一三五执行
# schedule.every().monday.at("02:00").do(crawl_news)
# schedule.every().wednesday.at("02:00").do(crawl_news)
# schedule.every().friday.at("02:00").do(crawl_news)

if __name__ == "__main__":
    logging.info("新闻爬虫定时服务已启动")

    # 启动时先执行一次
    crawl_news()

    # 持续运行，等待定时任务
    while True:
        schedule.run_pending()
        time.sleep(60)  # 每分钟检查一次是否有待执行的任务
