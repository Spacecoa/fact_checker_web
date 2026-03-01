import pandas as pd
import json
from datetime import datetime
import os

class ReportGenerator:
    """
    Classe para gerar relatórios de fact-checking em diversos formatos.
    """
    def __init__(self, output_dir='/home/ubuntu/fact_checker/reports/'):
        self.output_dir = output_dir
        if not os.path.exists(self.output_dir):
            os.makedirs(self.output_dir)

    def generate_json_report(self, results, filename=None):
        """
        Gera um relatório em formato JSON.
        """
        if not filename:
            filename = f"fact_check_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        filepath = os.path.join(self.output_dir, filename)
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=4, ensure_ascii=False)
        
        return filepath

    def generate_markdown_report(self, results, filename=None):
        """
        Gera um relatório em formato Markdown para fácil leitura.
        """
        if not filename:
            filename = f"fact_check_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"
        
        filepath = os.path.join(self.output_dir, filename)
        
        md_content = f"# Relatório de Fact-Checking de Notícias Políticas Brasileiras\n"
        md_content += f"Data de Geração: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}\n\n"
        
        for idx, result in enumerate(results, 1):
            md_content += f"## {idx}. {result.get('news_title', 'Sem Título')}\n"
            md_content += f"**Alegação Principal:** {result.get('main_claim', 'N/A')}\n\n"
            md_content += f"### Análise do Especialista (LLM):\n"
            md_content += f"{result.get('llm_analysis', 'N/A')}\n\n"
            
            if result.get('is_verified'):
                md_content += f"### Verificações Encontradas (Google Fact Check API):\n"
                for claim in result.get('fact_check_results', []):
                    for review in claim.get('claimReview', []):
                        md_content += f"- **Fonte:** {review.get('publisher', {}).get('name', 'N/A')}\n"
                        md_content += f"- **Avaliação:** {review.get('textualRating', 'N/A')}\n"
                        md_content += f"- **Link:** [{review.get('url', 'N/A')}]({review.get('url', 'N/A')})\n\n"
            else:
                md_content += f"### Verificações Encontradas:\n"
                md_content += "*Nenhuma verificação direta encontrada nas bases de dados oficiais para esta alegação específica.*\n\n"
            
            md_content += "---\n\n"
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(md_content)
        
        return filepath

    def generate_csv_summary(self, results, filename=None):
        """
        Gera um resumo em formato CSV.
        """
        if not filename:
            filename = f"fact_check_summary_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        
        summary_data = []
        for result in results:
            summary_data.append({
                'title': result.get('news_title', ''),
                'claim': result.get('main_claim', ''),
                'is_verified': result.get('is_verified', False),
                'num_reviews': len(result.get('fact_check_results', []))
            })
        
        df = pd.DataFrame(summary_data)
        filepath = os.path.join(self.output_dir, filename)
        df.to_csv(filepath, index=False, encoding='utf-8-sig')
        
        return filepath

if __name__ == "__main__":
    # Exemplo de uso
    generator = ReportGenerator()
    sample_results = [
        {
            'news_title': 'Exemplo de Notícia Política',
            'main_claim': 'Alegação de exemplo para teste',
            'llm_analysis': 'Esta é uma análise de exemplo gerada pelo LLM.',
            'is_verified': True,
            'fact_check_results': [
                {
                    'claimReview': [
                        {
                            'publisher': {'name': 'Agência Lupa'},
                            'textualRating': 'Falso',
                            'url': 'https://lupa.uol.com.br/exemplo'
                        }
                    ]
                }
            ]
        }
    ]
    json_path = generator.generate_json_report(sample_results)
    md_path = generator.generate_markdown_report(sample_results)
    csv_path = generator.generate_csv_summary(sample_results)
    print(f"Relatórios gerados:\n- {json_path}\n- {md_path}\n- {csv_path}")
