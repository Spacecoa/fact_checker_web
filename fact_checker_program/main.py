import argparse
import os
import pandas as pd
from news_collector.rss_collector import RSSCollector
from fact_checker_core.checker import FactChecker
from reports.generator import ReportGenerator
import logging

# Configuração de logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def main():
    parser = argparse.ArgumentParser(description='Ferramenta de Fact-Checking de Notícias Políticas Brasileiras.')
    parser.add_argument('--google-api-key', type=str, help='Chave da API do Google Fact Check Tools.')
    parser.add_argument('--output-dir', type=str, default='/home/ubuntu/fact_checker/reports', help='Diretório para salvar os relatórios.')
    parser.add_argument('--num-news', type=int, default=10, help='Número de notícias a serem processadas (padrão: 10).')
    
    args = parser.parse_args()

    google_api_key = args.google_api_key or os.getenv('GOOGLE_API_KEY')
    output_dir = args.output_dir
    num_news = args.num_news

    if not google_api_key:
        logging.warning('A chave da API do Google não foi fornecida. O fact-checking via Google API será ignorado.')

    logging.info('Iniciando coleta de notícias...')
    collector = RSSCollector()
    df_news = collector.collect_news()
    logging.info(f'Coletadas {len(df_news)} notícias.')

    if df_news.empty:
        logging.info('Nenhuma notícia para processar.')
        return

    # Limitar o número de notícias a serem processadas
    df_news = df_news.head(num_news)

    logging.info('Iniciando fact-checking...')
    checker = FactChecker(google_api_key=google_api_key)
    
    processed_results = []
    for index, row in df_news.iterrows():
        news_item = row.to_dict()
        result = checker.process_news_item(news_item)
        processed_results.append(result)

    logging.info('Gerando relatórios...')
    generator = ReportGenerator(output_dir=output_dir)
    json_report_path = generator.generate_json_report(processed_results)
    md_report_path = generator.generate_markdown_report(processed_results)
    csv_summary_path = generator.generate_csv_summary(processed_results)

    logging.info(f'Relatórios gerados com sucesso em: {output_dir}')
    logging.info(f'JSON: {json_report_path}')
    logging.info(f'Markdown: {md_report_path}')
    logging.info(f'CSV: {csv_summary_path}')

    logging.info('Processo concluído.')

if __name__ == '__main__':
    main()
