import feedparser
import pandas as pd
from datetime import datetime
import logging

# Configuração de logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class RSSCollector:
    """
    Classe para coletar notícias de feeds RSS de fontes abertas.
    """
    def __init__(self, feeds=None):
        self.feeds = feeds or {
            'Google News Política': 'https://news.google.com/rss/topics/CAAqJQgKIh9DQkFTRVFvSUwyMHZNREUxWm5JU0JYQjBMVUpTS0FBUAE?hl=pt-BR&gl=BR&ceid=BR%3Apt-419',
            'G1 Política': 'https://g1.globo.com/rss/g1/politica/',
            'Folha Poder': 'https://feeds.folha.uol.com.br/poder/rss091.xml',
            'Congresso em Foco': 'https://congressoemfoco.uol.com.br/feed/'
        }

    def collect_news(self):
        """
        Coleta notícias de todos os feeds configurados.
        """
        all_news = []
        for source, url in self.feeds.items():
            logging.info(f"Coletando notícias de: {source}")
            try:
                feed = feedparser.parse(url)
                for entry in feed.entries:
                    news_item = {
                        'source': source,
                        'title': entry.get('title', ''),
                        'link': entry.get('link', ''),
                        'published': entry.get('published', ''),
                        'summary': entry.get('summary', ''),
                        'collection_date': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                    }
                    all_news.append(news_item)
            except Exception as e:
                logging.error(f"Erro ao coletar notícias de {source}: {e}")
        
        return pd.DataFrame(all_news)

if __name__ == "__main__":
    collector = RSSCollector()
    df_news = collector.collect_news()
    print(df_news.head())
    df_news.to_csv('/home/ubuntu/fact_checker/reports/latest_news.csv', index=False)
    print(f"Coletadas {len(df_news)} notícias.")
