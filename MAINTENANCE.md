# 🔧 Guia de Manutenção e Boas Práticas

## 📊 Monitoramento em Produção

### 1. Verificar Status da Aplicação

**Via HTTP:**
```bash
curl https://seu-dominio.com/api/health
```

**Via SSH (servidor):**
```bash
ssh seu-servidor
pm2 status
pm2 logs hospital-meals-api
```

### 2. Alertas Importantes

Monitore em tempo real:
- Erros 500
- Taxa de erro acima de 1%
- Tempo de resposta > 1000ms
- Conexão do banco de dados perdida

**Ferramentas recomendadas:**
- Sentry (error tracking)
- DataDog (monitoring)
- New Relic (APM)
- Grafana (métricas)

---

## 🔐 Segurança

### Checklist de Segurança

- [ ] HTTPS habilitado em produção
- [ ] JWT_SECRET alterado (mínimo 128 caracteres)
- [ ] Senha admin padrão foi alterada
- [ ] Firewall configurado (bloquear portas desnecessárias)
- [ ] Rate limiting ativado na API
- [ ] Backups automatizados rodando
- [ ] Logs de auditoria habilitados
- [ ] CORS configurado apenas para seu domínio
- [ ] Headers de segurança configurados
- [ ] Senhas forte para banco de dados

### Implementar Rate Limiting

No arquivo `server.js`, adicione após os middlewares:

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // 100 requisições por IP
});

app.use(limiter);

// Rate limit mais restritivo para login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5
});

app.post('/api/auth/login', loginLimiter, async (req, res) => {
  // ...
});
```

Instale: `npm install express-rate-limit`

---

## 🗂️ Backup e Recuperação

### Backup Automático (Recomendado: Diário)

**Configure cron job:**
```bash
crontab -e

# Adicione:
0 2 * * * /var/www/hospital-meals/backup.sh
```

**Teste o backup:**
```bash
./backup.sh
ls -lah /var/backups/hospital-meals/
```

### Recuperar de um Backup

```bash
# Fazer restore
gunzip /var/backups/hospital-meals/hospital_meals_2024-02-01_02-00-00.sql.gz
psql -U hospital_user -d hospital_meals < hospital_meals_2024-02-01_02-00-00.sql

# Ou via pipe
gunzip -c /var/backups/hospital-meals/hospital_meals_2024-02-01_02-00-00.sql.gz | \
  psql -U hospital_user -d hospital_meals
```

### Backup Externo (Nuvem)

**Configurar AWS S3:**

```bash
# Instalar AWS CLI
npm install -g aws-cli

# Configure credenciais
aws configure

# Adicione ao backup.sh:
aws s3 cp $BACKUP_FILE s3://seu-bucket/hospital-meals/
```

---

## 📈 Performance

### Otimizações Recomendadas

#### 1. Cache com Redis

```javascript
// Instale: npm install redis express-session connect-redis

const redis = require('redis');
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const client = redis.createClient();

app.use(session({
  store: new RedisStore({ client }),
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: true, httpOnly: true, maxAge: 1000 * 60 * 60 * 24 }
}));
```

#### 2. Compression de Respostas

```javascript
const compression = require('compression');
app.use(compression());
```

#### 3. Índices no Banco de Dados

Já implementados no `db-init.js`, mas verifique:

```sql
SELECT * FROM pg_stat_user_indexes;
```

#### 4. Query Optimization

Sempre use `LIMIT` ao listar dados:

```javascript
// ❌ Evite
SELECT * FROM requests;

// ✅ Prefira
SELECT * FROM requests LIMIT 100 OFFSET 0;
```

---

## 🔄 Atualizações

### Atualizar Dependências Regularmente

```bash
# Ver quais estão desatualizadas
npm outdated

# Atualizar com segurança
npm audit
npm audit fix

# Atualizar pacotes
npm update
```

### Fazer Deploy de Atualização

```bash
# Desenvolvimento
git add .
git commit -m "Update: atualizar dependências"
git push

# Produção
git push heroku main
# Ou via SSH
./deploy.sh seu-usuario@seu-vps.com
```

---

## 📝 Logs e Auditoria

### Estrutura de Logs

```javascript
// Adicione ao server.js
const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, 'logs', 'app.log');
if (!fs.existsSync(path.dirname(logFile))) {
  fs.mkdirSync(path.dirname(logFile));
}

const logger = (level, message, data = {}) => {
  const timestamp = new Date().toISOString();
  const log = {
    timestamp,
    level,
    message,
    ...data
  };
  console.log(JSON.stringify(log));
  fs.appendFileSync(logFile, JSON.stringify(log) + '\n');
};

// Usar em qualquer lugar
logger('INFO', 'Usuário fez login', { userId: user.id, email: user.email });
logger('ERROR', 'Erro ao criar refeição', { error: error.message });
```

### Ver Logs em Tempo Real

```bash
# Heroku
heroku logs --tail -a seu-app-name

# Servidor
tail -f /var/www/hospital-meals/logs/app.log

# Nginx
tail -f /var/log/nginx/hospital-meals-error.log
```

---

## 🚨 Troubleshooting Comum

### Conexão do Banco Perdida

```bash
# Verificar status do PostgreSQL
sudo systemctl status postgresql

# Reiniciar
sudo systemctl restart postgresql

# Reconectar
psql -U hospital_user -d hospital_meals
```

### Memória Cheia no Servidor

```bash
# Ver uso de memória
free -h

# Limpar cache
sync && echo 3 > /proc/sys/vm/drop_caches

# Aumentar com swap
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### API Lenta

1. Verificar logs de erro
2. Ativar query logging
3. Verificar índices do banco
4. Aumentar recursos (RAM/CPU)
5. Implementar cache

---

## 🔄 Versionamento e Releases

### Semantic Versioning (SemVer)

Use versões no formato `MAJOR.MINOR.PATCH`:
- `1.0.0` → Versão inicial
- `1.0.1` → Bug fix
- `1.1.0` → Nova feature
- `2.0.0` → Breaking change

No `package.json`:
```json
{
  "version": "1.0.0"
}
```

### Git Tags

```bash
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

---

## 📞 Suporte e Documentação

### Recursos Úteis

- **Node.js Docs:** https://nodejs.org/docs/
- **PostgreSQL Docs:** https://www.postgresql.org/docs/
- **Express.js Guide:** https://expressjs.com/
- **JWT.io:** https://jwt.io/

### Contato para Problemas

Se encontrar bugs:
1. Verifique os logs
2. Procure no GitHub Issues
3. Abra um novo issue com detalhes

---

## ✅ Checklist de Manutenção Mensal

- [ ] Verificar logs de erro
- [ ] Atualizar dependências
- [ ] Revisar backups
- [ ] Testar recuperação de backup
- [ ] Verificar uso de storage
- [ ] Revisar usuários inativos
- [ ] Otimizar queries lentas
- [ ] Atualizar política de segurança
- [ ] Revisar CORS e headers
- [ ] Validar certificados SSL

---

## 🎯 KPIs para Monitorar

| KPI | Target | Verificar |
|-----|--------|-----------|
| Uptime | 99.9% | `pm2 monit` |
| Response Time | < 500ms | Logs/APM |
| Error Rate | < 1% | Sentry/DataDog |
| Database Performance | < 100ms | Query logs |
| Backup Status | Daily | `/var/backups/` |

---

**Aplicação mantida = Aplicação confiável 🚀**
