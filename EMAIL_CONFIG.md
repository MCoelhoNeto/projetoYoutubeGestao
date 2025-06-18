# Configuração de Email - YouTube Manager

## Configuração do Gmail

Para usar o sistema de envio de email, você precisa configurar as seguintes variáveis de ambiente no arquivo `.env`:

```env
# Configurações de Email (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu-email@gmail.com
EMAIL_PASS=sua-senha-de-app
EMAIL_FROM=seu-email@gmail.com
```

## Como obter a senha de app do Gmail

1. **Ative a verificação em duas etapas** na sua conta Google
2. **Gere uma senha de app**:
   - Acesse: https://myaccount.google.com/apppasswords
   - Selecione "Email" como aplicativo
   - Clique em "Gerar"
   - Use a senha gerada no campo `EMAIL_PASS`

## Configurações de Segurança

- **EMAIL_HOST**: `smtp.gmail.com` (padrão do Gmail)
- **EMAIL_PORT**: `587` (TLS) ou `465` (SSL)
- **EMAIL_USER**: Seu email completo do Gmail
- **EMAIL_PASS**: Senha de app gerada (NÃO sua senha normal)
- **EMAIL_FROM**: Email que aparecerá como remetente

## Exemplo de configuração

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=meu-canal@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop
EMAIL_FROM=meu-canal@gmail.com
```

## Funcionalidades

- ✅ Envio de análises completas por email
- ✅ Template HTML responsivo
- ✅ Inclui resumo da IA e transcrição
- ✅ Informações do vídeo e canal
- ✅ Validação de email
- ✅ Feedback visual durante envio

## Segurança

- Apenas análises concluídas podem ser enviadas
- Validação de autenticação do usuário
- Proteção contra spam com validação de email
- Logs de erro para debugging 