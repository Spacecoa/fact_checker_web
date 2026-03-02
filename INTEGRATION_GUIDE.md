# Guia de Integração - Fact Checker Web

## Visão Geral

Este guia descreve como integrar o programa de fact-checking existente com a plataforma web e configurar todos os componentes para funcionamento end-to-end.

## Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    Fact Checker Web                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐      ┌──────────────────┐            │
│  │  Frontend React │◄────►│  Backend tRPC    │            │
│  │   Dashboard     │      │   Express.js     │            │
│  └─────────────────┘      └──────────────────┘            │
│                                  │                         │
│                    ┌─────────────┼─────────────┐           │
│                    ▼             ▼             ▼           │
│            ┌────────────┐ ┌────────────┐ ┌──────────┐     │
│            │ News       │ │ Telegram   │ │ Job      │     │
│            │ Collector  │ │ Bot        │ │ Scheduler│     │
│            └────────────┘ └────────────┘ └──────────┘     │
│                    │             │             │           │
│                    └─────────────┼─────────────┘           │
│                                  ▼                         │
│                    ┌──────────────────────┐                │
│                    │  Verification       │                │
│                    │  Service            │                │
│                    │  (LLM + Google API) │                │
│                    └──────────────────────┘                │
│                                  │                         │
│                                  ▼                         │
│                    ┌──────────────────────┐                │
│                    │  MySQL Database      │                │
│                    │  (Reports, Users)    │                │
│                    └──────────────────────┘                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Configuração de Variáveis de Ambiente

### Variáveis Obrigatórias

```env
# Telegram Bot
TELEGRAM_BOT_TOKEN=seu_token_aqui

# Google Fact Check API (opcional, para verificação)
GOOGLE_FACT_CHECK_API_KEY=sua_chave_aqui

# LLM (já configurado pelo Manus)
BUILT_IN_FORGE_API_KEY=<auto-configurado>
BUILT_IN_FORGE_API_URL=<auto-configurado>

# Banco de dados
DATABASE_URL=<auto-configurado>
```

## Fluxo de Dados

### 1. Coleta de Notícias

**Serviço:** `server/services/newsCollector.ts`

O serviço coleta notícias de fontes RSS brasileiras:
- G1 Política
- Folha de S.Paulo
- O Globo
- UOL Notícias
- Estadão

**Agendamento:** A cada 4 horas (configurável em `jobScheduler.ts`)

**Saída:** Relatórios armazenados no banco com status `unverified`

### 2. Verificação de Fatos

**Serviço:** `server/services/verificationService.ts`

Para cada relatório não verificado:

1. **Extração de Alegações** (LLM)
   - Identifica a alegação principal
   - Extrai palavras-chave
   - Gera análise preliminar

2. **Verificação com Google Fact Check API**
   - Busca por fact-checks existentes
   - Coleta ratings de verificadores

3. **Determinação de Status**
   - `verified`: Alegação confirmada
   - `partially_verified`: Parcialmente confirmada
   - `false`: Alegação falsa
   - `no_evidence`: Sem evidências

**Agendamento:** A cada 2 horas (configurável)

### 3. Notificações Telegram

**Serviço:** `server/services/telegramBot.ts`

Envia notificações para usuários inscritos:
- Novos relatórios verificados
- Estatísticas diárias
- Alertas de fatos falsos

**Agendamento:** A cada 30 minutos (configurável)

## Endpoints da API

### Relatórios

```typescript
// Listar relatórios com filtros
GET /api/trpc/reports.list?page=1&limit=10&source=G1&status=verified

// Obter um relatório específico
GET /api/trpc/reports.getById?id=1

// Estatísticas
GET /api/trpc/reports.stats

// Fontes disponíveis
GET /api/trpc/reports.sources

// Exportar como JSON
GET /api/trpc/reports.exportJSON?status=verified

// Exportar como CSV
GET /api/trpc/reports.exportCSV

// Exportar como Markdown
GET /api/trpc/reports.exportMarkdown
```

### Ações Manuais

```typescript
// Coletar notícias agora
POST /api/trpc/reports.collectNews

// Verificar relatórios não verificados
POST /api/trpc/reports.verifyUnverified

// Verificar um relatório específico
POST /api/trpc/reports.verifyReport?id=1

// Status dos agendadores
GET /api/trpc/reports.jobStatus

// Ativar/desativar agendador
POST /api/trpc/reports.setJobEnabled?jobName=collectNews&enabled=true

// Executar agendador manualmente
POST /api/trpc/reports.triggerJob?jobName=collectNews
```

### Telegram

```typescript
// Webhook para atualizações do Telegram
POST /api/telegram/webhook

// Health check
GET /api/health
```

## Integração com Programa Existente

### Opção 1: Usar o Web Adapter (Recomendado)

Existe um web adapter em `server/api/factCheckingWebhook.ts` que permite enviar dados do programa existente:

```bash
curl -X POST http://localhost:3000/api/fact-checking/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Alegação sobre política",
    "mainClaim": "Afirmação principal a verificar",
    "source": "G1",
    "summary": "Resumo da notícia",
    "llmAnalysis": "Análise do LLM",
    "keywords": ["política", "eleição"],
    "factCheckResults": []
  }'
```

### Opção 2: Integração Direta

Modificar o programa existente para chamar os endpoints tRPC:

```python
import requests

# Coletar notícias
response = requests.post(
    "http://localhost:3000/api/trpc/reports.collectNews"
)

# Verificar relatórios
response = requests.post(
    "http://localhost:3000/api/trpc/reports.verifyUnverified"
)
```

## Configuração do Telegram Bot

### 1. Criar Bot no Telegram

1. Abra o Telegram e procure por `@BotFather`
2. Envie `/newbot`
3. Siga as instruções
4. Copie o token gerado

### 2. Configurar Webhook

```bash
curl -X POST https://api.telegram.org/bot<TOKEN>/setWebhook \
  -d "url=https://seu-dominio.com/api/telegram/webhook"
```

### 3. Configurar Variáveis de Ambiente

```env
TELEGRAM_BOT_TOKEN=seu_token_aqui
```

### 4. Comandos Disponíveis

- `/start` - Iniciar bot
- `/latest` - Últimos 5 relatórios
- `/stats` - Estatísticas gerais
- `/subscribe` - Ativar notificações
- `/unsubscribe` - Desativar notificações

## Banco de Dados

### Schema

```sql
-- Relatórios de fact-checking
CREATE TABLE fact_check_reports (
  id INT PRIMARY KEY AUTO_INCREMENT,
  reportId VARCHAR(64) UNIQUE NOT NULL,
  title TEXT NOT NULL,
  mainClaim TEXT NOT NULL,
  source VARCHAR(255) NOT NULL,
  newsLink VARCHAR(512),
  summary TEXT,
  llmAnalysis TEXT,
  keywords JSON,
  isVerified BOOLEAN DEFAULT FALSE,
  factCheckResults JSON,
  verificationStatus ENUM('unverified', 'verified', 'partially_verified', 'false', 'no_evidence'),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  reportDate TIMESTAMP,
  INDEX source_idx (source),
  INDEX createdAt_idx (createdAt),
  INDEX verificationStatus_idx (verificationStatus)
);

-- Usuários do Telegram
CREATE TABLE telegram_users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  telegramId VARCHAR(64) UNIQUE NOT NULL,
  firstName VARCHAR(255),
  lastName VARCHAR(255),
  username VARCHAR(255),
  isSubscribed BOOLEAN DEFAULT TRUE,
  preferences JSON,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX telegramId_idx (telegramId)
);

-- Notificações enviadas
CREATE TABLE telegram_notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  telegramUserId INT NOT NULL,
  reportId INT NOT NULL,
  messageId VARCHAR(255),
  status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sentAt TIMESTAMP,
  INDEX telegramUserId_idx (telegramUserId),
  INDEX reportId_idx (reportId)
);
```

## Monitoramento e Logs

### Logs Disponíveis

- **Dev Server:** `.manus-logs/devserver.log`
- **Browser Console:** `.manus-logs/browserConsole.log`
- **Network Requests:** `.manus-logs/networkRequests.log`
- **Session Replay:** `.manus-logs/sessionReplay.log`

### Verificar Status

```bash
# Health check
curl http://localhost:3000/api/health

# Status dos agendadores
curl http://localhost:3000/api/trpc/reports.jobStatus
```

## Troubleshooting

### Problema: Notícias não estão sendo coletadas

**Solução:**
1. Verificar se o job scheduler está rodando
2. Verificar logs de erro em `newsCollector.ts`
3. Verificar conexão com RSS feeds
4. Manualmente disparar: `POST /api/trpc/reports.collectNews`

### Problema: Verificação não funciona

**Solução:**
1. Verificar se `GOOGLE_FACT_CHECK_API_KEY` está configurado
2. Verificar logs de erro em `verificationService.ts`
3. Verificar conexão com LLM
4. Manualmente disparar: `POST /api/trpc/reports.verifyUnverified`

### Problema: Telegram não recebe notificações

**Solução:**
1. Verificar se `TELEGRAM_BOT_TOKEN` está correto
2. Verificar webhook configuration
3. Verificar se usuários estão inscritos
4. Verificar logs de erro em `telegramBot.ts`

## Performance e Escalabilidade

### Otimizações Implementadas

1. **Índices de Banco de Dados**
   - `source_idx` para filtros por fonte
   - `createdAt_idx` para ordenação
   - `verificationStatus_idx` para filtros de status

2. **Paginação**
   - Limite de 100 itens por página
   - Offset-based pagination

3. **Cache**
   - Resultados de verificação em cache
   - Estatísticas calculadas sob demanda

4. **Rate Limiting**
   - Delay entre chamadas de API (1s)
   - Limite de 10 relatórios por batch

### Escalabilidade Futura

1. Adicionar Redis para cache
2. Implementar message queue (RabbitMQ/Kafka)
3. Distribuir jobs entre múltiplos workers
4. Adicionar replicação de banco de dados

## Próximos Passos

1. **Configurar Domínio Customizado**
   - Ir para Settings → Domains
   - Adicionar domínio customizado

2. **Configurar SSL/TLS**
   - Certificados automáticos via Let's Encrypt

3. **Adicionar Autenticação de Usuários**
   - Implementar roles (admin, user)
   - Adicionar permissões por recurso

4. **Adicionar Análise Avançada**
   - Gráficos de tendências
   - Análise de padrões de desinformação
   - Relatórios customizados

5. **Integrar com Redes Sociais**
   - Monitorar Twitter/X
   - Monitorar Facebook
   - Monitorar TikTok
