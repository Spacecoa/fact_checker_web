# Fact Checker de Notícias Políticas Brasileiras

Este projeto visa coletar notícias políticas brasileiras de diversas fontes abertas, realizar a verificação de fatos (fact-checking) e apresentar os resultados de forma transparente.

## Estrutura do Projeto

```
fact_checker/
├── news_collector/           # Módulo para coleta de notícias (RSS, web scraping)
├── fact_checker_core/        # Módulo principal de fact-checking (integração com APIs, LLM)
├── reports/                  # Relatórios gerados e resultados do fact-checking
├── config/                   # Arquivos de configuração (fontes de notícias, chaves de API)
├── docs/                     # Documentação do projeto
├── tests/                    # Testes unitários e de integração
├── main.py                   # Ponto de entrada principal do programa
├── requirements.txt          # Dependências do projeto
└── README.md                 # Este arquivo
```

## Funcionalidades

- Coleta automatizada de notícias políticas de fontes abertas (RSS feeds).
- Verificação de fatos utilizando a Google Fact Check Tools API.
- Análise de notícias e identificação de alegações para fact-checking.
- Geração de relatórios detalhados com os resultados da verificação.

## Como Usar

Instruções detalhadas sobre como instalar, configurar e executar o programa serão fornecidas na documentação completa (`docs/`).

## Desenvolvimento

O projeto será desenvolvido em Python, com foco em modularidade, testabilidade e documentação.
