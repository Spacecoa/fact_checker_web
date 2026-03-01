import requests
import logging
from openai import OpenAI
import json
import os

# Configuração de logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class FactChecker:
    """
    Classe principal para realizar a verificação de fatos (fact-checking).
    Utiliza a Google Fact Check Tools API e LLM para análise.
    """
    def __init__(self, google_api_key=None):
        self.google_api_key = google_api_key
        self.google_api_url = "https://factchecktools.googleapis.com/v1alpha1/claims:search"
        self.client = OpenAI() # Utiliza as configurações de ambiente do Manus

    def check_claim_google(self, query):
        """
        Consulta a Google Fact Check Tools API para uma alegação específica.
        """
        if not self.google_api_key:
            logging.warning("Google API Key não fornecida. Pulando consulta à API do Google.")
            return None
        
        params = {
            'query': query,
            'languageCode': 'pt-BR',
            'key': self.google_api_key
        }
        
        try:
            response = requests.get(self.google_api_url, params=params)
            if response.status_code == 200:
                return response.json()
            else:
                logging.error(f"Erro na API do Google: {response.status_code} - {response.text}")
                return None
        except Exception as e:
            logging.error(f"Erro ao consultar a API do Google: {e}")
            return None

    def analyze_with_llm(self, title, summary):
        """
        Utiliza LLM para analisar a notícia, extrair alegações e sugerir pontos de atenção.
        """
        prompt = f"""
        Analise a seguinte notícia política brasileira:
        Título: {title}
        Resumo: {summary}

        Sua tarefa é:
        1. Extrair a alegação (claim) principal da notícia em uma frase curta e objetiva.
        2. Identificar possíveis pontos de desinformação ou contextos necessários.
        3. Sugerir palavras-chave para busca em bases de fact-checking.
        
        Responda em formato JSON com as chaves: 'main_claim', 'analysis', 'keywords'.
        """
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-4.1-mini",
                messages=[
                    {"role": "system", "content": "Você é um especialista em fact-checking e política brasileira."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"}
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            logging.error(f"Erro ao analisar com LLM: {e}")
            return None

    def process_news_item(self, news_item):
        """
        Processa um item de notícia individualmente.
        """
        title = news_item.get('title', '')
        summary = news_item.get('summary', '')
        
        logging.info(f"Processando notícia: {title[:50]}...")
        
        # 1. Análise inicial com LLM
        analysis = self.analyze_with_llm(title, summary)
        if not analysis:
            return {'status': 'error', 'message': 'Falha na análise inicial'}
        
        main_claim = analysis.get('main_claim', title)
        
        # 2. Consulta à API do Google (se a chave estiver disponível)
        google_results = self.check_claim_google(main_claim)
        
        # 3. Consolidar resultados
        result = {
            'news_title': title,
            'main_claim': main_claim,
            'llm_analysis': analysis.get('analysis', ''),
            'keywords': analysis.get('keywords', []),
            'fact_check_results': google_results.get('claims', []) if google_results else [],
            'is_verified': bool(google_results and google_results.get('claims'))
        }
        
        return result

if __name__ == "__main__":
    # Exemplo de uso
    checker = FactChecker()
    sample_news = {
        'title': 'Governo anuncia novo programa de auxílio para famílias de baixa renda',
        'summary': 'O governo federal lançou hoje um programa que promete pagar R$ 500 mensais para famílias cadastradas no CadÚnico.'
    }
    result = checker.process_news_item(sample_news)
    print(json.dumps(result, indent=2, ensure_ascii=False))
