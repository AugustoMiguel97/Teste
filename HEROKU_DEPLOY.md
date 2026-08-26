# Deploy no Heroku - Guia Rápido

Heroku é a forma mais fácil e rápida de fazer deploy. Não requer conhecimento de servidor.

## ⚡ Setup Rápido (5 minutos)

### 1. Instalar Heroku CLI

**macOS:**
```bash
brew tap heroku/brew && brew install heroku
```

**Windows (PowerShell):**
```powershell
choco install heroku-cli
```

**Linux:**
```bash
curl https://cli-assets.heroku.com/install.sh | sh
```

### 2. Login no Heroku

```bash
heroku login
# Abre navegador para autenticação
```

### 3. Criar Aplicação

```bash
heroku create seu-app-name
# Exemplo: heroku create hospital-meal-system
```

### 4. Criar Banco de Dados PostgreSQL

```bash
heroku addons:create heroku-postgresql:hobby-dev -a seu-app-name
```

### 5. Definir Variáveis de Ambiente

```bash
# Gerar JWT_SECRET seguro
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Definir todas as variáveis
heroku config:set NODE_ENV=production -a seu-app-name
heroku config:set JWT_SECRET=$JWT_SECRET -a seu-app-name
heroku config:set CORS_ORIGIN=https://seu-app-name.herokuapp.com -a seu-app-name

# Verificar
heroku config -a seu-app-name
```

### 6. Fazer Deploy

```bash
# Adicionar repositório Heroku como remote
git remote add heroku https://git.heroku.com/seu-app-name.git

# Fazer deploy da branch main
git push heroku main

# Ou se estiver em outra branch:
# git push heroku seu-branch:main
```

### 7. Inicializar Banco de Dados

```bash
heroku run npm run migrate -a seu-app-name
```

### 8. Verificar Status

```bash
# Ver logs
heroku logs --tail -a seu-app-name

# Verificar se está rodando
curl https://seu-app-name.herokuapp.com/api/health

# Abrir app no navegador
heroku open -a seu-app-name
```

---

## 📝 Criar Procfile (Importante!)

Crie arquivo `Procfile` na raiz do projeto:

```
web: node server.js
release: npm run migrate
```

Isso diz ao Heroku como iniciar a aplicação.

---

## 🔐 Alterar Senha Admin

1. Acesse https://seu-app-name.herokuapp.com
2. Login com admin@hospital.com / Admin@2024
3. No dashboard admin, crie novo usuário admin
4. Depois, delete a conta padrão

---

## 💰 Custos

- **Dyno (servidor):** $7/mês (mínimo)
- **PostgreSQL:** $9/mês (hobby-dev)
- **Total:** ~$16/mês

Tier gratuito foi descontinuado, mas é o mais barato do mercado.

---

## 🔄 Atualizações Contínuas

Quando fizer mudanças no código:

```bash
git add .
git commit -m "Descrição das mudanças"
git push heroku main
```

Heroku faz deploy automaticamente.

---

## 🐛 Troubleshooting

### Erro de conexão com banco
```bash
heroku logs --tail -a seu-app-name
# Procure por mensagens de erro do PostgreSQL
```

### Servidor não sobe
```bash
# Verificar dynos
heroku ps -a seu-app-name

# Restart
heroku restart -a seu-app-name
```

### Resetar banco de dados
```bash
heroku pg:reset DATABASE_URL -a seu-app-name
heroku run npm run migrate -a seu-app-name
```

---

## 🚀 Próximas Etapas

### Usar Domínio Próprio

1. Compre domínio em GoDaddy, Namecheap, etc
2. No Heroku, adicione domínio:

```bash
heroku domains:add seu-dominio.com -a seu-app-name
heroku domains:add www.seu-dominio.com -a seu-app-name
```

3. Configure DNS provider para apontar para Heroku (instruções no dashboard)

### Adicionar SSL/HTTPS

```bash
heroku certs:auto:enable -a seu-app-name
```

Heroku cuida automaticamente do certificado Let's Encrypt.

---

## 📞 Mais Informações

- Docs Heroku: https://devcenter.heroku.com
- Pergunta frequente: https://help.heroku.com
- Status: https://status.heroku.com

---

**Deploy feito! 🎉**
