#!/usr/bin/python
# -*- coding:utf-8 -*-

import xlrd
import xlwt
import time
import logging
import xlutils.copy
from time import sleep
from lxml import etree
from selenium import webdriver

logging.basicConfig(level=logging.DEBUG)


class crawler:
    ''' 环球时报新闻爬取类

    类实现了爬取环球时报各个栏目下的一定数量的文章并将其存入excel文件中

    Auther: Gy

    Attributes: 
        url : 爬取的页面的url
        column_dict : 爬取栏目字典（中文目前未使用）
        excel_file_name : 保存文档名
        crawl_page_num : 爬取栏目页面的几页（模拟用户点击MORE）
        deiver_wait_time : 隐式等待（浏览器加载项目最长等待时间）
        passage_wait_time : 进入页面后等待多久

    '''

    def __init__(self, url, column_dict, excel_file_name, excel_sheet_name, crawl_page_num=10, deiver_wait_time=10, page_wait_time=1):
        ''' 初始化 '''
        self.url = url
        self.column_dict = column_dict
        self.excel_file_name = '{}_{}_crawl_by_gy.xls'.format(
            excel_file_name, time.strftime("%Y-%m-%d", time.localtime()))
        self.excel_sheet_name = excel_sheet_name
        self.excel_sheet_title = ['标题', '栏目', '作者', '发布时间', '链接', '内容']
        self.crawl_page_num = crawl_page_num
        self.page_wait_time = page_wait_time
        self.browser = webdriver.Edge()
        self.browser.implicitly_wait(deiver_wait_time)

    def crawl(self):
        '''开始爬取'''
        logging.info('建表并写入表头')
        workbook = xlwt.Workbook(encoding='utf-8')
        worksheet = workbook.add_sheet(self.excel_sheet_name)
        for si, i in enumerate(self.excel_sheet_title):
            worksheet.write(0, si, i)
        workbook.save(self.excel_file_name)
        logging.info('开始爬取')
        for column, column_name in self.column_dict.items():
            logging.info('爬取栏目 {}'.format(column))
            self.process_a_column(column)
        self.browser.quit()
        logging.info('爬取完成')

    def process_a_column(self, column):
        '''爬取一个栏目

        Args:
            column : 栏目名
        '''
        self.browser.get('{}/{}'.format(self.url, column))
        sleep(self.page_wait_time)
        for times in range(self.crawl_page_num):
            # 点击MORE展开一页
            self.browser.find_element_by_class_name('show_more').click()
            sleep(self.page_wait_time)
        source = self.browser.page_source

        logging.info('开始解析栏目 {}'.format(column))
        try:
            html_tree = etree.HTML(source)
            passage_list = self.process_column_link(html_tree)
        except Exception as e:
            logging.error('解析栏目 {} 链接失败，错误信息： {}'.format(column, e))
        logging.info('栏目 {} 解析完成'.format(column))

        try:
            for title, link in passage_list:
                self.process_a_passage(title, link, column)
        except Exception as e:
            logging.error('处理文章失败，错误信息： {}'.format(e))

    def process_column_link(self, html_tree):
        '''处理页面获取所有文章标题和连接

        Args:
            html : 栏目的树结构

        Returns:
            一个文章标题和链接元组构成的列表
        '''
        ret_list = []
        passages_list = html_tree.xpath(
            '//div[@class="level01_list"]//div[@class="list_info"]/a')
        if passages_list:
            for passage in passages_list:
                title = passage.xpath('./text()')[0]
                link = passage.xpath('./@href')[0]
                logging.debug('获取到当前文章 {} , url {}'.format(title, link))
                ret_list.append((title, link))
        return ret_list

    def process_a_passage(self, title, link, column):
        '''处理文章信息

        Args:
            title : 文章标题
            link : 链接
            column : 栏目
        '''
        logging.info('正在处理文章 {} 链接 {}'.format(title, link))
        row = []
        self.browser.get(link)
        sleep(self.page_wait_time)
        source = self.browser.page_source
        html_tree = etree.HTML(source)

        content_lst = html_tree.xpath(
            '//div[@class="article_page"]//div[@class="article"]//div[@class="article_content"]//div[@class="article_right"]/br')
        # 找不到文章内容直接退出
        if not content_lst:
            return

        # 获取文章内容
        content = ''
        for one_content in content_lst:
            if one_content.tail:
                content = content + '\n' + one_content.tail.strip()
        author_and_publictime_span = html_tree.xpath(
            '//div[@class="article_page"]//div[@class="article"]//div[@class="article_top"]//div[@class="author_share"]//div[@class="author_share_left"]/span')
        # 获取作者
        auther = author_and_publictime_span[0].text.replace('By ', '')
        # 获取发表时间
        public_time = author_and_publictime_span[1].text.replace(
            'Published: ', '')

        row.append(title)
        row.append(column)
        row.append(auther)
        row.append(public_time)
        row.append(link)
        row.append(content)
        self.write_excel(row)
        logging.debug('爬取一条信息 : {} {} {} {} {} {}'.format(
            title, column, auther, public_time, link, content))
        logging.info('文章 {} 处理完成'.format(title))

    def write_excel(self, row):
        '''写入文章信息

        Args:
            row : 处理完写入一行的内容
        '''

        try:
            book = xlrd.open_workbook(
                self.excel_file_name, formatting_info=True)    # 读取Excel
            copy_book = xlutils.copy.copy(book)
            copy_sheet = copy_book.get_sheet(self.excel_sheet_name)
            rowns = len(copy_sheet.rows)
            for si, i in enumerate(row):
                copy_sheet.write(rowns, si, i)
            copy_book.save(self.excel_file_name)
        except Exception as e:
            logging.error('读取文件失败，错误信息： {}'.format(e))


if __name__ == '__main__':
    news_columns_dict = {
        # 注意转义单引号
        'politics': '政治',
        'society': '社会',
        'diplomacy': '外交',
        'military': '军事',
        'science': '科学',
        'odd': '奇文',
        'graphic': '图文',
        'Stories-of-China\'s-high-quality-development': '中国高质量发展'
    }

    globaltimes_crawler = crawler('https://www.globaltimes.cn/china',
                                  news_columns_dict, 'globaltimes_news', 'globaltimes', 10)
    globaltimes_crawler.crawl()
