# Fact Checker Web - Setup e Integração

Bem-vindo ao **Fact Checker Web**, uma plataforma completa para visualização, gerenciamento e integração com Telegram de relatórios de fact-checking de notícias políticas brasileiras.

## 📋 Visão Geral

Este aplicativo web foi desenvolvido para integrar-se perfeitamente com o programa de fact-checking existente, fornecendo:

- **Dashboard Web**: Interface moderna para visualizar e gerenciar relatórios de fact-checking
- **Integração com Telegram**: Bot para receber comandos e enviar notificações
- **API REST**: Endpoints para integração com o programa de fact-checking
- **Banco de Dados**: Armazenamento completo de relatórios e histórico de verificações
- **Filtros Avançados**: Busca e filtros por data, fonte, status de verificação
- **Exportação**: Exportar relatórios em JSON, Markdown e CSV

## 🚀 Início Rápido

### 1. Pré-requisitos

- Node.js 22+ e pnpm
- Python 3.8+ (para o programa de fact-checking)
- Banco de dados MySQL/TiDB (fornecido pelo Manus)
- Token do Telegram Bot (opcional, para integração com Telegram)
- Chave da API do Google Fact Check Tools (opcional)

### 2. Instalação

```bash
# Instalar dependências do Node.js
pnpm install

# Configurar banco de dados
pnpm db:push

# Instalar dependências do Python (fact-checking program)
cd fact_checker_program
pip install -r requirements.txt
cd ..
```

### 3. Configuração de Variáveis de Ambiente

As seguintes variáveis de ambiente são necessárias:

```bash
# Banco de dados (fornecido pelo Manus)
DATABASE_URL=mysql://user:password@host/database

# Autenticação (fornecido pelo Manus)
JWT_SECRET=seu_jwt_secret
VITE_APP_ID=seu_app_id
OAUTH_SERVER_URL=https://api.manus.im

# Telegram Bot (opcional)
TELEGRAM_BOT_TOKEN=seu_telegram_bot_token

# Google Fact Check API (opcional)
GOOGLE_API_KEY=sua_chave_api_google

# URLs
VITE_FRONTEND_URL=http://localhost:3000
```

### 4. Executar o Aplicativo

```bash
# Desenvolvimento
pnpm dev

# Build para produção
pnpm build

# Iniciar em produção
pnpm start
```

O aplicativo estará disponível em `http://localhost:3000`.

## 📱 Dashboard Web

### Funcionalidades Principais

#### 1. **Visualização de Relatórios**
- Lista paginada de todos os relatórios de fact-checking
- Exibição de título, alegação principal, fonte e status
- Indicador visual de verificação

#### 2. **Filtros Avançados**
- **Busca por Texto**: Busca em título, alegação e resumo
- **Filtro por Fonte**: Selecione notícias de fontes específicas (G1, Folha, etc.)
- **Filtro por Status**: Não Verificado, Verificado, Parcialmente Verificado, Falso, Sem Evidência

#### 3. **Detalhes do Relatório**
- Visualização completa da notícia verificada
- Alegação principal em destaque
- Análise do especialista (LLM)
- Palavras-chave extraídas
- Resultados de fact-check do Google
- Links para verificações completas

#### 4. **Estatísticas**
- Total de relatórios processados
- Taxa de verificação
- Distribuição por fonte
- Métricas em tempo real

#### 5. **Exportação**
- Exportar relatórios individuais em JSON
- Exportar em Markdown para documentação
- Exportar em CSV para análise

## 🤖 Integração com Telegram

### Configuração do Bot

1. **Criar um Bot no Telegram**
   - Converse com [@BotFather](https://t.me/botfather)
   - Use `/newbot` para criar um novo bot
   - Copie o token fornecido

2. **Configurar Webhook**
   ```bash
   # Defina a variável de ambiente
   export TELEGRAM_BOT_TOKEN="seu_token_aqui"
   ```

3. **Comandos Disponíveis**
   - `/start` - Iniciar o bot e ver menu de ajuda
   - `/latest` - Ver os 5 últimos relatórios
   - `/stats` - Ver estatísticas de fact-checking
   - `/search <query>` - Buscar relatórios
   - `/subscribe` - Ativar notificações
   - `/unsubscribe` - Desativar notificações

### Notificações Automáticas

Quando um novo relatório é adicionado ao sistema, todos os usuários inscritos recebem uma notificação no Telegram com:
- Título da notícia
- Alegação principal
- Fonte
- Link para visualizar no dashboard

## 🔗 API REST

### Endpoints Principais

#### Webhook para Receber Relatórios

```bash
POST /api/webhook/fact-check

Body:
{
  "title": "Título da notícia",
  "mainClaim": "Alegação principal",
  "source": "G1",
  "newsLink": "https://...",
  "summary": "Resumo da notícia",
  "llmAnalysis": "Análise do especialista",
  "keywords": ["palavra1", "palavra2"],
  "isVerified": true,
  "factCheckResults": [...],
  "verificationStatus": "verified"
}

Response:
{
  "success": true,
  "reportId": "abc123",
  "message": "Report received and processed successfully"
}
```

#### Webhook do Telegram

```bash
POST /api/webhook/telegram

Body: Update do Telegram (enviado automaticamente pelo Telegram)
```

#### Health Check

```bash
GET /api/webhook/health

Response:
{
  "status": "ok",
  "timestamp": "2026-03-01T06:50:00.000Z"
}
```

## 🔌 Integração com o Programa de Fact-Checking

### Método 1: Usar o Web Adapter

```bash
# Executar o programa de fact-checking e enviar resultados para a web
python fact_checker_program/web_adapter.py

# Com opções customizadas
python fact_checker_program/web_adapter.py --num-news 20 --google-api-key "sua_chave"
```

### Método 2: Integração Manual

```python
from fact_checker_program.web_adapter import run_fact_checking, send_to_web_api

# Executar fact-checking
results = run_fact_checking(num_news=10, google_api_key="sua_chave")

# Enviar para a web API
if results["success"]:
    send_to_web_api(results["results"])
```

### Método 3: Chamar a API Diretamente

```bash
# Coletar e processar notícias com o programa original
python fact_checker_program/main.py --num-news 10 --google-api-key "sua_chave"

# Enviar cada resultado para a API
curl -X POST http://localhost:3000/api/webhook/fact-check \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Título",
    "mainClaim": "Alegação",
    "source": "G1",
    ...
  }'
```

## 📊 Estrutura do Banco de Dados

### Tabelas Principais

#### `fact_check_reports`
Armazena todos os relatórios de fact-checking processados.

```sql
- id: Identificador único
- reportId: ID único do relatório (string)
- title: Título da notícia
- mainClaim: Alegação principal
- source: Fonte da notícia
- newsLink: Link para a notícia original
- summary: Resumo da notícia
- llmAnalysis: Análise do especialista (LLM)
- keywords: Palavras-chave (JSON array)
- isVerified: Se foi verificado
- factCheckResults: Resultados do Google Fact Check (JSON)
- verificationStatus: Status de verificação
- createdAt: Data de criação
- updatedAt: Data de atualização
- reportDate: Data do relatório
```

#### `telegram_users`
Rastreia usuários do Telegram inscritos no bot.

```sql
- id: Identificador único
- telegramId: ID do usuário no Telegram
- firstName: Primeiro nome
- lastName: Sobrenome
- username: Username do Telegram
- isSubscribed: Se está inscrito em notificações
- preferences: Preferências do usuário (JSON)
- createdAt: Data de criação
- updatedAt: Data de atualização
```

#### `telegram_notifications`
Rastreia notificações enviadas aos usuários.

```sql
- id: Identificador único
- telegramUserId: ID do usuário
- reportId: ID do relatório
- messageId: ID da mensagem no Telegram
- status: Status (pending, sent, failed)
- createdAt: Data de criação
- sentAt: Data de envio
```

## 🧪 Testes

```bash
# Executar testes unitários
pnpm test

# Testes com cobertura
pnpm test -- --coverage
```

## 📚 Estrutura do Projeto

```
fact_checker_web/
├── client/                          # Frontend React
│   ├── src/
│   │   ├── pages/                   # Páginas (Dashboard, ReportDetail)
│   │   ├── components/              # Componentes reutilizáveis
│   │   ├── lib/trpc.ts              # Cliente tRPC
│   │   └── App.tsx                  # Roteamento principal
│   └── public/                      # Arquivos estáticos
├── server/                          # Backend Express + tRPC
│   ├── routers/                     # Procedimentos tRPC
│   │   ├── factChecker.ts           # Routers de fact-checking
│   │   └── telegram.ts              # Routers do Telegram
│   ├── services/                    # Serviços
│   │   └── telegramBot.ts           # Serviço do bot Telegram
│   ├── api/                         # Endpoints REST
│   │   └── factCheckingWebhook.ts   # Webhooks
│   ├── db.ts                        # Helpers de banco de dados
│   └── routers.ts                   # Roteador principal
├── drizzle/                         # Schema e migrações
│   └── schema.ts                    # Definição das tabelas
├── fact_checker_program/            # Programa de fact-checking integrado
│   ├── main.py                      # Ponto de entrada
│   ├── web_adapter.py               # Adaptador para web
│   ├── news_collector/              # Coleta de notícias
│   ├── fact_checker_core/           # Lógica de fact-checking
│   └── reports/                     # Geração de relatórios
├── scripts/                         # Scripts úteis
│   └── integrate-fact-checker.sh    # Script de integração
└── todo.md                          # Rastreamento de tarefas
```

## 🔐 Segurança

- **Autenticação**: Integrada com Manus OAuth
- **Autorização**: Roles de usuário (admin, user)
- **Validação**: Validação de entrada com Zod
- **HTTPS**: Recomendado em produção
- **CORS**: Configurado para aceitar requisições da web

## 🚨 Troubleshooting

### Erro: "Database connection failed"
- Verifique se `DATABASE_URL` está configurado corretamente
- Certifique-se de que o banco de dados está acessível

### Erro: "Telegram bot not responding"
- Verifique se `TELEGRAM_BOT_TOKEN` está configurado
- Confirme que o webhook está registrado no Telegram

### Erro: "Google API key not set"
- Configure `GOOGLE_API_KEY` para usar a API do Google
- O sistema funcionará sem ela, mas com funcionalidade reduzida

### TypeScript errors ao compilar
- Execute `pnpm check` para verificar erros
- Os erros de tipo não impedem o build, mas devem ser resolvidos

## 📞 Suporte

Para dúvidas ou problemas:

1. Verifique a documentação do programa de fact-checking original
2. Consulte os logs do servidor (`pnpm dev`)
3. Verifique os logs do banco de dados
4. Revise as variáveis de ambiente

## 📝 Licença

Este projeto está licenciado sob a licença MIT.

---

**Última atualização**: 01 de Março de 2026
