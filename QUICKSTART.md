# Quick Start Guide - Fact Checker Web

## 1. Iniciar o Servidor

```bash
cd /home/ubuntu/fact_checker_web
pnpm dev
```

O servidor estará disponível em `http://localhost:3000`

## 2. Acessar o Dashboard

1. Abra o navegador e vá para `http://localhost:3000`
2. Clique em "Ir para Dashboard" ou acesse `/dashboard`
3. Você verá:
   - Estatísticas gerais (total, verificados, não verificados)
   - Gráficos de status e fontes
   - Lista de relatórios com filtros
   - Opções para coletar notícias e verificar relatórios

## 3. Coletar Notícias

### Opção A: Via Dashboard
1. Clique no botão "Coletar Notícias"
2. Aguarde a conclusão
3. Os novos relatórios aparecerão na lista

### Opção B: Via API
```bash
curl -X POST http://localhost:3000/api/trpc/reports.collectNews
```

### Opção C: Automático
O sistema coleta notícias automaticamente a cada 4 horas

## 4. Verificar Relatórios

### Opção A: Via Dashboard
1. Clique no botão "Verificar Relatórios"
2. Aguarde a conclusão
3. Os status dos relatórios serão atualizados

### Opção B: Via API
```bash
curl -X POST http://localhost:3000/api/trpc/reports.verifyUnverified
```

### Opção C: Automático
O sistema verifica relatórios automaticamente a cada 2 horas

## 5. Visualizar Detalhes de um Relatório

1. Clique em um relatório na lista
2. Você verá:
   - Título e alegação principal
   - Resumo da notícia
   - Análise do especialista
   - Palavras-chave
   - Resultados de fact-check
   - Opções de exportação

## 6. Usar Filtros e Busca

### Buscar por Texto
- Digite no campo "Buscar relatórios..."
- Busca em tempo real no título

### Filtrar por Fonte
- Selecione uma fonte no dropdown
- Opções: G1, Folha, O Globo, UOL, Estadão

### Filtrar por Status
- Selecione um status no dropdown
- Opções: Verificado, Parcialmente, Falso, Sem Evidência, Não Verificado

## 7. Exportar Dados

### Via Dashboard
1. Vá para um relatório
2. Clique em "Exportar"
3. Escolha o formato:
   - JSON: Estrutura completa
   - CSV: Para planilhas
   - Markdown: Para documentos

### Via API

**JSON:**
```bash
curl http://localhost:3000/api/trpc/reports.exportJSON > relatorios.json
```

**CSV:**
```bash
curl http://localhost:3000/api/trpc/reports.exportCSV > relatorios.csv
```

**Markdown:**
```bash
curl http://localhost:3000/api/trpc/reports.exportMarkdown > relatorios.md
```

## 8. Configurar Telegram Bot

### Passo 1: Obter Token
1. Abra o Telegram e procure por `@BotFather`
2. Envie `/newbot`
3. Siga as instruções
4. Copie o token

### Passo 2: Configurar Variável de Ambiente
```bash
# Edite o arquivo .env ou configure via Management UI
TELEGRAM_BOT_TOKEN=seu_token_aqui
```

### Passo 3: Reiniciar o Servidor
```bash
# O servidor reiniciará automaticamente
# Ou reinicie manualmente com Ctrl+C e pnpm dev
```

### Passo 4: Usar o Bot
1. Procure pelo seu bot no Telegram
2. Envie `/start`
3. Comandos disponíveis:
   - `/latest` - Últimos 5 relatórios
   - `/stats` - Estatísticas gerais
   - `/subscribe` - Ativar notificações
   - `/unsubscribe` - Desativar notificações

## 9. Monitorar Status dos Agendadores

### Via Dashboard
- Vá para a seção "Status dos Agendadores"
- Veja:
  - Status (Ativo/Inativo)
  - Intervalo de execução
  - Próxima execução

### Via API
```bash
curl http://localhost:3000/api/trpc/reports.jobStatus
```

Resposta:
```json
{
  "collectNews": {
    "enabled": true,
    "interval": 14400000,
    "lastRun": "2026-03-02T10:30:00.000Z",
    "nextRun": "2026-03-02T14:30:00.000Z"
  },
  "verifyReports": {
    "enabled": true,
    "interval": 7200000,
    "lastRun": "2026-03-02T10:30:00.000Z",
    "nextRun": "2026-03-02T12:30:00.000Z"
  },
  "sendNotifications": {
    "enabled": true,
    "interval": 1800000,
    "lastRun": "2026-03-02T10:30:00.000Z",
    "nextRun": "2026-03-02T10:45:00.000Z"
  }
}
```

## 10. Ativar/Desativar Agendadores

### Via API
```bash
# Desativar coleta de notícias
curl -X POST "http://localhost:3000/api/trpc/reports.setJobEnabled" \
  -d "jobName=collectNews&enabled=false"

# Ativar verificação de relatórios
curl -X POST "http://localhost:3000/api/trpc/reports.setJobEnabled" \
  -d "jobName=verifyReports&enabled=true"
```

## 11. Executar Agendadores Manualmente

```bash
# Coletar notícias agora
curl -X POST "http://localhost:3000/api/trpc/reports.triggerJob" \
  -d "jobName=collectNews"

# Verificar relatórios agora
curl -X POST "http://localhost:3000/api/trpc/reports.triggerJob" \
  -d "jobName=verifyReports"

# Enviar notificações agora
curl -X POST "http://localhost:3000/api/trpc/reports.triggerJob" \
  -d "jobName=sendNotifications"
```

## 12. Visualizar Logs

### Logs do Servidor
```bash
# Ver últimas linhas dos logs
tail -f .manus-logs/devserver.log
```

### Logs do Browser
```bash
# Ver console do navegador
# Abra DevTools (F12) → Console
```

## 13. Troubleshooting

### Problema: Nenhum relatório aparece
**Solução:**
1. Clique em "Coletar Notícias"
2. Aguarde alguns segundos
3. Clique em "Atualizar"

### Problema: Relatórios não estão sendo verificados
**Solução:**
1. Clique em "Verificar Relatórios"
2. Verifique se as chaves de API estão configuradas
3. Verifique os logs

### Problema: Telegram não funciona
**Solução:**
1. Verifique se o token está correto
2. Verifique se o webhook está configurado
3. Reinicie o servidor

### Problema: Dashboard carrega lentamente
**Solução:**
1. Reduza o limite de itens por página
2. Use filtros para reduzir a quantidade de dados
3. Verifique a conexão com o banco de dados

## 14. Próximos Passos

1. **Publicar o Site**
   - Clique em "Publish" no Management UI
   - Configure um domínio customizado

2. **Integrar com Redes Sociais**
   - Monitorar Twitter/X
   - Monitorar Facebook
   - Monitorar TikTok

3. **Adicionar Análise Avançada**
   - Gráficos de tendências
   - Análise de padrões
   - Relatórios customizados

4. **Expandir Fontes de Notícias**
   - Adicionar mais feeds RSS
   - Integrar com APIs de notícias
   - Monitorar redes sociais

## 15. Recursos Úteis

- **Documentação Completa:** `INTEGRATION_GUIDE.md`
- **Guia de Setup:** `SETUP.md`
- **API Reference:** Veja endpoints em `server/routers/reports.ts`
- **Telegram Bot:** `@BotFather` no Telegram

## Suporte

Para mais informações ou problemas:
1. Verifique os logs em `.manus-logs/`
2. Consulte a documentação em `INTEGRATION_GUIDE.md`
3. Verifique o status de saúde: `GET /api/health`
