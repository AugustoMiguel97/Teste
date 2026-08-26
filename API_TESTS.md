# Testes da API - Exemplos com cURL

## 🧪 Testar Endpoints

### 1. Login (Obter Token)

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@hospital.com",
    "password": "Admin@2024"
  }'
```

**Resposta esperada:**
```json
{
  "message": "Login realizado com sucesso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Administrador",
    "email": "admin@hospital.com",
    "role": "admin"
  }
}
```

Copie o `token` para usar nos próximos comandos.

---

### 2. Criar Novo Usuário (Admin)

```bash
TOKEN="seu_token_aqui"

curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "João Silva",
    "email": "joao@hospital.com",
    "password": "Senha123!",
    "role": "colaborador"
  }'
```

**Roles disponíveis:** `colaborador`, `nutricionista`, `admin`

---

### 3. Listar Todos os Usuários (Admin)

```bash
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer $TOKEN"
```

---

### 4. Adicionar Refeição ao Cardápio (Nutricionista)

Primeiro faça login com um usuário nutricionista:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nutricionista@hospital.com",
    "password": "senha_nutricionista"
  }'
```

Depois adicione uma refeição:

```bash
NUTRI_TOKEN="token_nutricionista"

curl -X POST http://localhost:3000/api/menu \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $NUTRI_TOKEN" \
  -d '{
    "meal_date": "2024-02-15",
    "meal_time": "12:00",
    "description": "Almoço - Frango ao molho com arroz e feijão"
  }'
```

---

### 5. Listar Cardápio

```bash
curl -X GET http://localhost:3000/api/menu \
  -H "Authorization: Bearer $TOKEN"
```

---

### 6. Criar Solicitação de Refeição (Colaborador)

```bash
COLLAB_TOKEN="token_colaborador"

curl -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $COLLAB_TOKEN" \
  -d '{
    "meal_id": 1,
    "meal_type": "carne"
  }'
```

**meal_type:** `carne` ou `ovo`

---

### 7. Ver Minhas Solicitações

```bash
curl -X GET http://localhost:3000/api/requests/me \
  -H "Authorization: Bearer $COLLAB_TOKEN"
```

---

### 8. Ver Todas as Solicitações (Nutricionista)

```bash
curl -X GET http://localhost:3000/api/requests \
  -H "Authorization: Bearer $NUTRI_TOKEN"
```

---

### 9. Obter Estatísticas (Nutricionista)

```bash
curl -X GET http://localhost:3000/api/stats/meals \
  -H "Authorization: Bearer $NUTRI_TOKEN"
```

---

### 10. Health Check

```bash
curl http://localhost:3000/api/health
```

---

## 📮 Importar no Postman

### Passo 1: Criar Collection

1. Abra Postman
2. Clique em "Collections" → "Create new collection"
3. Nome: "Hospital Meal System"

### Passo 2: Adicionar Variáveis de Ambiente

1. Clique em "Environments" → "Create"
2. Nome: "Local Development"
3. Adicione as variáveis:

| Variável | Valor |
|----------|-------|
| `base_url` | http://localhost:3000/api |
| `token` | (deixe vazio, será preenchido após login) |
| `admin_email` | admin@hospital.com |
| `admin_password` | Admin@2024 |

### Passo 3: Criar Requisições

#### 1. Login

- **Método:** POST
- **URL:** `{{base_url}}/auth/login`
- **Body (JSON):**
```json
{
  "email": "{{admin_email}}",
  "password": "{{admin_password}}"
}
```
- **Tests:** Adicione este script para salvar o token:
```javascript
if (pm.response.code === 200) {
  var jsonData = pm.response.json();
  pm.environment.set("token", jsonData.token);
}
```

#### 2. Criar Usuário

- **Método:** POST
- **URL:** `{{base_url}}/auth/register`
- **Headers:** `Authorization: Bearer {{token}}`
- **Body (JSON):**
```json
{
  "name": "Nutricionista Teste",
  "email": "nutri@test.com",
  "password": "Teste123!",
  "role": "nutricionista"
}
```

#### 3. Adicionar Refeição

- **Método:** POST
- **URL:** `{{base_url}}/menu`
- **Headers:** `Authorization: Bearer {{token}}`
- **Body (JSON):**
```json
{
  "meal_date": "2024-02-20",
  "meal_time": "12:00",
  "description": "Almoço - Moqueca de peixe"
}
```

#### 4. Listar Refeições

- **Método:** GET
- **URL:** `{{base_url}}/menu`
- **Headers:** `Authorization: Bearer {{token}}`

---

## ✅ Checklist de Testes

- [ ] Login com admin funciona
- [ ] Criar novo usuário (nutricionista)
- [ ] Criar novo usuário (colaborador)
- [ ] Login com nutricionista funciona
- [ ] Adicionar refeição ao cardápio
- [ ] Login com colaborador funciona
- [ ] Solicitar refeição com 24+ horas de antecedência
- [ ] Erro ao solicitar com menos de 24 horas
- [ ] Ver estatísticas (nutricionista)
- [ ] Cancelar solicitação
- [ ] Deletar refeição do cardápio
- [ ] Deletar usuário (admin)

---

## 🐛 Erros Comuns e Soluções

### 401 Unauthorized
**Problema:** Token inválido ou expirado
**Solução:** Faça login novamente para obter novo token

### 403 Forbidden
**Problema:** Usuário não tem permissão
**Solução:** Verifique o role do usuário (admin, nutricionista, colaborador)

### 400 Bad Request
**Problema:** Dados inválidos
**Solução:** Verifique o formato do JSON e os campos obrigatórios

### 404 Not Found
**Problema:** Recurso não encontrado
**Solução:** Verifique se o ID existe (meal_id, user_id, etc)

---

## 🔗 Links Úteis

- Postman: https://www.postman.com
- cURL Documentation: https://curl.se/docs
- HTTP Status Codes: https://httpwg.org/specs/rfc9110.html#status.codes

---

**Happy Testing! 🚀**
