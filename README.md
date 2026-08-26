# Sistema de Gerenciamento de Refeições Hospitalares

Aplicação web completa para gerenciar solicitações de refeições em hospital com controle de acesso por papel (Admin, Nutricionista, Colaborador).

## 📋 Características

✅ Autenticação com login/senha e JWT  
✅ 3 tipos de usuários: Admin, Nutricionista, Colaborador  
✅ Admin pode criar novos usuários e definir tipo de acesso  
✅ Colaborador solicita refeição (carne ou ovo) com validação de 24h  
✅ Nutricionista gerencia cardápio e vê estatísticas  
✅ Dashboard responsivo e profissional  
✅ Pronto para deploy em nuvem  

---

## 🛠️ Pré-requisitos

- Node.js >= 14.0.0
- PostgreSQL >= 12
- npm ou yarn
- Conta em plataforma de cloud (Heroku, AWS, DigitalOcean, etc)

---

## 📦 Instalação Local

### 1. Clonar/Preparar o projeto

```bash
# Navegar até a pasta do projeto
cd hospital-meal-system

# Instalar dependências do backend
npm install
```

### 2. Configurar Banco de Dados PostgreSQL

#### Opção A: Instalar PostgreSQL localmente

```bash
# No macOS com Homebrew
brew install postgresql

# Iniciar o serviço
brew services start postgresql

# Criar usuário e banco
createuser hospital_user -P
# Digite a senha quando solicitado
createdb -O hospital_user hospital_meals
```

#### Opção B: Usar Docker (mais fácil)

```bash
docker run --name postgres-hospital \
  -e POSTGRES_USER=hospital_user \
  -e POSTGRES_PASSWORD=sua_senha_forte \
  -e POSTGRES_DB=hospital_meals \
  -p 5432:5432 \
  -d postgres:14
```

### 3. Criar arquivo .env

Copie o `.env.example` para `.env` e configure:

```bash
cp .env.example .env
```

Edite o arquivo `.env`:

```env
# Servidor
PORT=3000
NODE_ENV=development

# Banco de Dados
DB_USER=hospital_user
DB_PASSWORD=sua_senha_forte
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hospital_meals

# JWT (gere uma chave segura)
JWT_SECRET=sua_chave_secreta_muito_segura_aqui_com_128_caracteres_minimo

# Frontend URL (para CORS)
CORS_ORIGIN=http://localhost:3000
```

**Gerar chave JWT segura:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Inicializar Banco de Dados

```bash
npm run migrate
```

Isso vai criar as tabelas e o usuário admin padrão:
- **Email:** admin@hospital.com
- **Senha:** Admin@2024

⚠️ **Altere a senha após o primeiro login!**

### 5. Iniciar o Servidor

```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

O servidor estará rodando em `http://localhost:3000`

### 6. Abrir o Frontend

Abra o arquivo `index.html` em um navegador ou sirva-o com:

```bash
# Instale http-server globalmente
npm install -g http-server

# Sirva os arquivos
http-server

# Abra em http://localhost:8080
```

---

## ☁️ Deploy na Nuvem

### Opção 1: Heroku (Mais fácil para iniciantes)

#### Pré-requisitos:
- Conta no Heroku (https://www.heroku.com)
- Heroku CLI instalado (https://devcenter.heroku.com/articles/heroku-cli)

#### Passos:

```bash
# Login no Heroku
heroku login

# Criar app
heroku create seu-app-name

# Adicionar banco PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev -a seu-app-name

# Configurar variáveis de ambiente
heroku config:set NODE_ENV=production -a seu-app-name
heroku config:set JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))") -a seu-app-name
heroku config:set CORS_ORIGIN=https://seu-frontend-url.com -a seu-app-name

# Fazer deploy
git push heroku main

# Inicializar banco de dados
heroku run npm run migrate -a seu-app-name

# Ver logs
heroku logs --tail -a seu-app-name
```

A URL da API será: `https://seu-app-name.herokuapp.com`

### Opção 2: DigitalOcean (Recomendado)

#### Pré-requisitos:
- Conta no DigitalOcean (https://www.digitalocean.com)
- SSH key configurada

#### Passos:

1. **Criar Droplet:**
   - Escolha: Ubuntu 22.04 LTS
   - Tamanho: Basic ($5/mês é suficiente)
   - Região: Escolha a mais próxima

2. **Conectar via SSH:**

```bash
ssh root@seu_ip_do_droplet

# Atualizar sistema
apt update && apt upgrade -y

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# Instalar PostgreSQL
apt install -y postgresql postgresql-contrib

# Instalar Nginx (para servir frontend)
apt install -y nginx

# Instalar PM2 (para gerenciar processo Node)
npm install -g pm2
```

3. **Configurar PostgreSQL:**

```bash
sudo -u postgres psql

# Dentro do psql:
CREATE USER hospital_user WITH PASSWORD 'sua_senha_forte';
CREATE DATABASE hospital_meals OWNER hospital_user;
\q
```

4. **Clone o projeto:**

```bash
cd /var/www
git clone seu-repositorio.git hospital-meals
cd hospital-meals
npm install
```

5. **Configurar .env:**

```bash
nano .env
```

Adicione:
```env
PORT=3000
NODE_ENV=production
DB_USER=hospital_user
DB_PASSWORD=sua_senha_forte
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hospital_meals
JWT_SECRET=sua_chave_secreta_muito_segura
CORS_ORIGIN=https://seu-frontend-url.com
```

6. **Inicializar banco:**

```bash
npm run migrate
```

7. **Iniciar com PM2:**

```bash
pm2 start server.js --name "hospital-meals-api"
pm2 startup
pm2 save
```

8. **Configurar Nginx:**

```bash
nano /etc/nginx/sites-available/default
```

Substitua pelo conteúdo:

```nginx
upstream hospital_api {
    server 127.0.0.1:3000;
}

server {
    listen 80 default_server;
    server_name seu-dominio.com;

    location /api {
        proxy_pass http://hospital_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        root /var/www/hospital-meals/frontend;
        try_files $uri /index.html;
    }
}
```

9. **Ativar Nginx:**

```bash
systemctl restart nginx

# Verificar status
systemctl status nginx
```

10. **SSL com Let's Encrypt (HTTPS):**

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d seu-dominio.com
```

---

## 🗂️ Estrutura do Projeto

```
hospital-meal-system/
├── server.js                 # Servidor Express principal
├── db.js                     # Configuração do banco de dados
├── db-init.js               # Script para inicializar banco
├── package.json             # Dependências Node.js
├── .env.example             # Exemplo de variáveis de ambiente
├── index.html               # Frontend HTML5
└── README.md                # Este arquivo
```

---

## 🔐 Segurança em Produção

**IMPORTANTE:** Antes de fazer deploy:

1. ✅ Altere a senha admin padrão
2. ✅ Gere chave JWT segura (128+ caracteres)
3. ✅ Use HTTPS obrigatoriamente (SSL/TLS)
4. ✅ Configure CORS apenas para seu domínio
5. ✅ Faça backup regular do banco de dados
6. ✅ Use variáveis de ambiente para todas as credenciais
7. ✅ Ative logs de auditoria
8. ✅ Configure rate limiting na API

---

## 📱 Variáveis de Ambiente

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| PORT | Porta do servidor | 3000 |
| NODE_ENV | Ambiente (development/production) | production |
| DB_USER | Usuário PostgreSQL | hospital_user |
| DB_PASSWORD | Senha PostgreSQL | SenhaForte123! |
| DB_HOST | Host do banco | localhost |
| DB_PORT | Porta do banco | 5432 |
| DB_NAME | Nome do banco | hospital_meals |
| JWT_SECRET | Chave secreta JWT | (128+ caracteres) |
| CORS_ORIGIN | URL do frontend para CORS | https://app.com |

---

## 🧪 Testar a Aplicação

### Dados Padrão:
- **Email Admin:** admin@hospital.com
- **Senha Admin:** Admin@2024

### Fluxo de Teste:

1. Faça login com admin
2. Crie um novo usuário (nutricionista)
3. Faça logout e login com nutricionista
4. Adicione refeições ao cardápio
5. Faça logout e crie usuário colaborador
6. Faça login com colaborador
7. Solicite refeição (será pedida antecedência de 24h)

---

## 📊 Endpoints da API

### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Criar usuário (apenas admin)

### Usuários
- `GET /api/users` - Listar usuários (admin)
- `PUT /api/users/:id` - Atualizar usuário
- `DELETE /api/users/:id` - Deletar usuário (admin)

### Cardápio
- `GET /api/menu` - Listar cardápio
- `POST /api/menu` - Criar refeição (nutricionista)
- `DELETE /api/menu/:id` - Deletar refeição (nutricionista)

### Solicitações
- `POST /api/requests` - Criar solicitação (colaborador)
- `GET /api/requests/me` - Minhas solicitações
- `GET /api/requests` - Todas as solicitações (nutricionista)
- `DELETE /api/requests/:id` - Cancelar solicitação

### Estatísticas
- `GET /api/stats/meals` - Stats de refeições (nutricionista)

---

## 🐛 Troubleshooting

### "Erro de conexão com banco de dados"
```bash
# Verificar se PostgreSQL está rodando
psql -U hospital_user -d hospital_meals

# Se usar Docker
docker ps # Verificar se container está rodando
```

### "Token inválido"
- Limpe o localStorage do navegador
- Faça login novamente

### "CORS error"
- Certifique-se que CORS_ORIGIN no .env está correto
- Deve ser exatamente o domínio do seu frontend

### "Porta 3000 já em uso"
```bash
# Encontrar processo usando porta
lsof -i :3000

# Matar processo
kill -9 <PID>

# Ou usar outra porta no .env
PORT=3001
```

---

## 📞 Suporte

Para dúvidas:
1. Verifique os logs: `npm run dev` mostra erros em tempo real
2. Confira variáveis de ambiente no .env
3. Consulte documentação do Node.js/PostgreSQL

---

## 📝 Licença

MIT

---

**Criado com ❤️ para hospitais**
