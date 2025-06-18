# API de Análise de Vídeos com IA

Este sistema utiliza o Google Gemini e youtube-transcript-api para analisar vídeos do YouTube automaticamente.

## Configuração

### 1. Variáveis de Ambiente

Certifique-se de que o arquivo `.env` contenha as seguintes variáveis:

```env
# Google Gemini API
GEMINI_API_KEY=sua_chave_do_gemini_aqui

# YouTube Data API (opcional, para buscar metadados)
YOUTUBE_API_KEY=sua_chave_do_youtube_api_aqui

# MongoDB
MONGODB_URI=mongodb://usuario:senha@localhost:27017/youtube_manager_ia?authSource=admin
```

### 2. Obter Chave do Gemini

1. Acesse [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Faça login com sua conta Google
3. Clique em "Create API Key"
4. Copie a chave e cole no arquivo `.env`

### 3. Instalar Dependências

```bash
npm install @google/generative-ai youtube-transcript-api --legacy-peer-deps
```

## Como Funciona

### 1. Processo de Análise

1. **Extração da Transcrição**: O sistema usa `youtube-transcript-api` para obter as legendas do vídeo
2. **Análise com IA**: O Gemini analisa a transcrição e gera:
   - Resumo em tópicos principais
   - Opinião sobre o conteúdo
3. **Armazenamento**: Os resultados são salvos no MongoDB

### 2. Endpoints da API

#### POST `/api/analyses`

Cria uma nova análise de vídeo.

**Body:**
```json
{
  "videoId": "dQw4w9WgXcQ",
  "videoTitle": "Título do Vídeo",
  "channelId": "ID_DO_CANAL",
  "categoryId": "ID_DA_CATEGORIA"
}
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "id": "ID_DA_ANALISE",
    "videoId": "dQw4w9WgXcQ",
    "summary": [
      "Tópico 1",
      "Tópico 2",
      "Tópico 3"
    ],
    "opinion": "Opinião sobre o conteúdo...",
    "status": "completed",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### GET `/api/analyses`

Lista todas as análises.

**Query Parameters:**
- `channelId`: Filtrar por canal
- `categoryId`: Filtrar por categoria

### 3. Páginas do Sistema

#### `/videos`
- Lista todos os vídeos dos canais
- Permite selecionar vídeos para análise
- Mostra status de análise (pendente/analisado)

#### `/analyses`
- Lista todas as análises realizadas
- Mostra resumo e opinião de cada análise

#### `/teste-analise`
- Página de teste para verificar se a API está funcionando
- Permite testar com qualquer ID de vídeo

## Estrutura do Banco de Dados

### Collection: `analyses`

```typescript
interface Analysis {
  _id: ObjectId;
  videoId: string;
  channelId: string;
  categoryId: string;
  videoTitle: string;
  transcript: string;
  summary: string[];
  opinion: string;
  status: 'processing' | 'completed' | 'error';
  createdAt: Date;
  updatedAt: Date;
}
```

## Tratamento de Erros

### Erros Comuns

1. **Transcrição não disponível**
   - Erro: "Não foi possível obter a transcrição do vídeo"
   - Solução: Verificar se o vídeo tem legendas habilitadas

2. **Chave do Gemini inválida**
   - Erro: "Erro interno do servidor"
   - Solução: Verificar se a chave está correta no `.env`

3. **Vídeo privado ou não encontrado**
   - Erro: "Vídeo não encontrado"
   - Solução: Verificar se o ID do vídeo está correto

## Limitações

1. **Legendas Obrigatórias**: O vídeo deve ter legendas disponíveis
2. **Tamanho da Transcrição**: Vídeos muito longos podem ter transcrições truncadas
3. **Rate Limiting**: O Gemini tem limites de requisições por minuto
4. **Idioma**: A análise é otimizada para português brasileiro

## Próximos Passos

1. **Integração com YouTube API**: Buscar metadados automáticos dos vídeos
2. **Análise de Sentimento**: Adicionar análise de sentimento do conteúdo
3. **Cache de Transcrições**: Evitar re-download de transcrições já baixadas
4. **Análise em Lote**: Processar múltiplos vídeos simultaneamente
5. **Notificações**: Notificar quando análises são concluídas

## Testando a API

1. Acesse `/teste-analise`
2. Cole um ID de vídeo do YouTube (ex: `dQw4w9WgXcQ`)
3. Clique em "Testar Análise"
4. Verifique o resultado

## Suporte

Para problemas ou dúvidas:
1. Verifique os logs do servidor
2. Teste a API em `/teste-analise`
3. Verifique se todas as variáveis de ambiente estão configuradas
4. Confirme se o vídeo tem legendas disponíveis 