# Documentação do Fact Checker de Notícias Políticas Brasileiras

## 1. Visão Geral

Este projeto é uma ferramenta em Python projetada para automatizar a coleta de notícias políticas brasileiras de fontes abertas (RSS feeds), realizar a verificação de fatos (fact-checking) utilizando a Google Fact Check Tools API e um Large Language Model (LLM), e gerar relatórios detalhados dos resultados.

O objetivo principal é aumentar a eficiência e a transparência da informação, ajudando a identificar e contextualizar alegações em notícias políticas.

## 2. Estrutura do Projeto

A estrutura de diretórios do projeto é organizada da seguinte forma:

```
fact_checker/
├── news_collector/           # Módulo para coleta de notícias (RSS)
│   └── rss_collector.py      # Script para coletar notícias de feeds RSS
├── fact_checker_core/        # Módulo principal de fact-checking
│   └── checker.py            # Script para realizar o fact-checking com Google API e LLM
├── reports/                  # Diretório para relatórios gerados
│   └── generator.py          # Script para gerar relatórios em JSON, Markdown e CSV
├── config/                   # Diretório para arquivos de configuração (futuras implementações)
├── docs/                     # Documentação do projeto
│   └── documentation.md      # Este arquivo
├── tests/                    # Testes unitários e de integração (futuras implementações)
├── main.py                   # Ponto de entrada principal do programa (CLI)
├── requirements.txt          # Dependências do projeto
└── README.md                 # Visão geral do projeto
```

## 3. Funcionalidades

- **Coleta de Notícias:** Coleta notícias políticas de feeds RSS de veículos de comunicação brasileiros.
- **Análise de Notícias com LLM:** Utiliza um Large Language Model (LLM) para extrair a alegação principal de uma notícia, identificar possíveis pontos de desinformação e sugerir palavras-chave para busca.
- **Verificação de Fatos com Google Fact Check Tools API:** Consulta a API do Google para encontrar verificações de fatos existentes relacionadas às alegações extraídas.
- **Geração de Relatórios:** Gera relatórios detalhados em formatos JSON, Markdown e CSV, consolidando as notícias, as alegações, a análise do LLM e os resultados da verificação de fatos.

## 4. Instalação

Para configurar e executar o projeto, siga os passos abaixo:

1.  **Clone o repositório (se aplicável) ou crie a estrutura de diretórios:**
    ```bash
    mkdir -p /home/ubuntu/fact_checker/{news_collector,fact_checker_core,reports,config,docs,tests}
    ```

2.  **Navegue até o diretório do projeto:**
    ```bash
    cd /home/ubuntu/fact_checker
    ```

3.  **Instale as dependências:**
    Certifique-se de ter o `pip` instalado. Em seguida, instale as bibliotecas listadas no `requirements.txt`:
    ```bash
    sudo pip3 install -r requirements.txt
    ```

## 5. Configuração

O programa pode utilizar uma chave de API do Google para acessar a Google Fact Check Tools API. Esta chave é opcional, mas **altamente recomendada** para obter resultados de fact-checking mais abrangentes.

Você pode fornecer a chave de duas maneiras:

-   **Variável de Ambiente:** Defina a variável de ambiente `GOOGLE_API_KEY` com sua chave:
    ```bash
    export GOOGLE_API_KEY="SUA_CHAVE_API_DO_GOOGLE"
    ```
-   **Argumento de Linha de Comando:** Passe a chave diretamente ao executar o script:
    ```bash
    python3 main.py --google-api-key "SUA_CHAVE_API_DO_GOOGLE"
    ```

## 6. Como Usar (CLI)

Para executar o programa, utilize o script `main.py` a partir da linha de comando:

```bash
python3 main.py [opções]
```

### Opções Disponíveis:

-   `--google-api-key <chave>`: Fornece a chave da API do Google Fact Check Tools. (Opcional, pode ser definida via variável de ambiente `GOOGLE_API_KEY`).
-   `--output-dir <diretório>`: Especifica o diretório onde os relatórios serão salvos. Padrão: `/home/ubuntu/fact_checker/reports`.
-   `--num-news <número>`: Define o número máximo de notícias a serem processadas. Padrão: `10`.

### Exemplo de Uso:

Para coletar e verificar as 5 notícias mais recentes, salvando os relatórios no diretório padrão:

```bash
python3 main.py --num-news 5 --google-api-key "SUA_CHAVE_API_DO_GOOGLE"
```

Se a chave da API do Google estiver definida como variável de ambiente:

```bash
python3 main.py --num-news 5
```

## 7. Saída dos Relatórios

Após a execução, o programa gerará três tipos de arquivos de relatório no diretório especificado (`reports/` por padrão):

-   **JSON:** Um arquivo `.json` contendo todos os dados brutos das notícias processadas e os resultados detalhados do fact-checking.
-   **Markdown:** Um arquivo `.md` formatado para fácil leitura, apresentando as notícias, alegações, análises do LLM e verificações encontradas.
-   **CSV:** Um arquivo `.csv` com um resumo tabular das notícias processadas, incluindo título, alegação principal e se verificações foram encontradas.

## 8. Futuras Melhorias

-   Implementação de web scraping para fontes de notícias que não oferecem RSS feeds.
-   Adição de mais fontes de fact-checking e integração com outras APIs.
-   Desenvolvimento de uma interface gráfica de usuário (GUI).
-   Melhoria da análise do LLM com modelos mais avançados ou técnicas de prompt engineering.
-   Implementação de testes unitários e de integração robustos.

## 9. Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests no repositório do projeto.

## 10. Licença

Este projeto está licenciado sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes. (O arquivo `LICENSE` será criado em uma futura etapa, se necessário).

---

**Autor:** Manus AI
**Data:** 01 de Março de 2026
