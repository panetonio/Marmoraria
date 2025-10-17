# Backend - Sistema Marmoraria ERP

API REST completa para o sistema de gestão da Marmoraria, desenvolvida com Node.js, Express e MongoDB.

## 🚀 Tecnologias

- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **MongoDB** - Banco de dados NoSQL
- **Mongoose** - ODM para MongoDB
- **JWT** - Autenticação com JSON Web Tokens
- **bcryptjs** - Hash de senhas
- **Helmet** - Segurança HTTP
- **CORS** - Configuração de CORS
- **Rate Limiting** - Proteção contra ataques

## 📁 Estrutura de Pastas

```
backend/
├── config/
│   ├── database.js      # Configuração do MongoDB
│   └── jwt.js           # Utilitários JWT
├── controllers/
│   ├── authController.js
│   ├── userController.js
│   ├── clientController.js
│   ├── supplierController.js
│   └── quoteController.js
├── middleware/
│   ├── auth.js          # Autenticação e autorização
│   └── errorHandler.js  # Tratamento de erros
├── models/
│   ├── User.js
│   ├── Client.js
│   ├── Supplier.js
│   ├── Material.js
│   ├── Service.js
│   ├── Product.js
│   ├── Quote.js
│   ├── Order.js
│   ├── ServiceOrder.js
│   ├── StockItem.js
│   ├── Opportunity.js
│   └── Note.js
├── routes/
│   ├── auth.js
│   ├── users.js
│   ├── clients.js
│   ├── suppliers.js
│   └── quotes.js
├── scripts/
│   └── seed.js          # Popular banco de dados
├── .env.example         # Exemplo de variáveis de ambiente
├── .gitignore
├── package.json
├── server.js            # Arquivo principal
└── README.md
```

## 🔧 Instalação

### 1. Instalar dependências

```bash
cd backend
npm install
```

### 2. Configurar variáveis de ambiente

Crie um arquivo `.env` na raiz do backend com as seguintes variáveis:

```env
MONGODB_URI=mongodb+srv://admin:@81566794Ga@marmoraria.bopqgos.mongodb.net/marmoraria?retryWrites=true&w=majority&appName=Marmoraria
JWT_SECRET=marmoraria_super_secret_key_change_in_production_2024
JWT_EXPIRES_IN=7d
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

⚠️ **IMPORTANTE**: Altere o `JWT_SECRET` para produção!

### 3. Popular banco de dados (Opcional)

Para criar usuários de exemplo:

```bash
npm run seed
```

Isso criará:
- **Admin**: `admin@marmoraria.com` / `admin123`
- **Vendedor**: `vendedor@marmoraria.com` / `vendedor123`
- **Produção**: `producao@marmoraria.com` / `producao123`

### 4. Iniciar servidor

**Desenvolvimento** (com nodemon):
```bash
npm run dev
```

**Produção**:
```bash
npm start
```

O servidor estará disponível em `http://localhost:5000`

## 📡 API Endpoints

### Autenticação

#### Registrar Usuário
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "João Silva",
  "email": "joao@email.com",
  "password": "senha123",
  "role": "vendedor"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@marmoraria.com",
  "password": "admin123"
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Login realizado com sucesso",
  "data": {
    "user": {
      "id": "...",
      "name": "Administrador",
      "email": "admin@marmoraria.com",
      "role": "admin",
      "isActive": true,
      "customPermissions": []
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Obter Perfil
```http
GET /api/auth/me
Authorization: Bearer {token}
```

### Usuários (Apenas Admin)

#### Listar Usuários
```http
GET /api/users
Authorization: Bearer {token}
```

#### Criar Usuário
```http
POST /api/users
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Maria Santos",
  "email": "maria@email.com",
  "password": "senha123",
  "role": "vendedor"
}
```

#### Atualizar Usuário
```http
PUT /api/users/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Maria Santos Silva",
  "isActive": true
}
```

#### Atualizar Permissões
```http
PATCH /api/users/:id/permissions
Authorization: Bearer {token}
Content-Type: application/json

{
  "customPermissions": ["crm", "suppliers", "quotes"]
}
```

#### Ativar/Desativar Usuário
```http
PATCH /api/users/:id/toggle-status
Authorization: Bearer {token}
```

#### Deletar Usuário
```http
DELETE /api/users/:id
Authorization: Bearer {token}
```

### Clientes

#### Listar Clientes
```http
GET /api/clients
Authorization: Bearer {token}
```

#### Criar Cliente
```http
POST /api/clients
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Cliente Exemplo",
  "type": "pessoa_fisica",
  "email": "cliente@email.com",
  "phone": "(11) 99999-9999",
  "cpfCnpj": "123.456.789-00",
  "address": {
    "cep": "01234-567",
    "uf": "SP",
    "city": "São Paulo",
    "neighborhood": "Centro",
    "address": "Rua Exemplo",
    "number": "123",
    "complement": "Apto 45"
  }
}
```

### Fornecedores

```http
GET /api/suppliers
POST /api/suppliers
PUT /api/suppliers/:id
DELETE /api/suppliers/:id
Authorization: Bearer {token}
```

### Orçamentos

```http
GET /api/quotes
POST /api/quotes
PUT /api/quotes/:id
DELETE /api/quotes/:id
Authorization: Bearer {token}
```

## 🔐 Autenticação

A API usa JWT (JSON Web Tokens) para autenticação.

1. Faça login via `/api/auth/login`
2. Receba o token no campo `data.token`
3. Use o token no header de todas as requisições:
   ```
   Authorization: Bearer {seu_token_aqui}
   ```

### Exemplo com JavaScript:

```javascript
// Login
const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@marmoraria.com',
    password: 'admin123'
  })
});

const { data } = await loginResponse.json();
const token = data.token;

// Usar token nas próximas requisições
const usersResponse = await fetch('http://localhost:5000/api/users', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## 🛡️ Segurança

### Senhas
- Senhas são hashadas com bcrypt (salt rounds: 10)
- Nunca são retornadas nas respostas da API

### Rate Limiting
- Máximo de 100 requisições por IP a cada 15 minutos
- Aplica-se a todas as rotas `/api/*`

### CORS
- Configurado para aceitar apenas a origem do frontend
- Pode ser alterado via variável `CORS_ORIGIN`

### Helmet
- Headers de segurança HTTP configurados automaticamente

## 👥 Permissões e Roles

### Roles Disponíveis:
- `admin` - Acesso total
- `vendedor` - Acesso limitado a vendas
- `producao` - Acesso à produção
- `aux_administrativo` - Acesso administrativo

### Permissões por Página:
- `dashboard` - Todos
- `quotes` - Vendedor, Admin, Aux. Administrativo
- `orders` - Todos exceto algumas restrições
- `production` - Produção, Admin
- `crm` - Vendedor, Admin, Aux. Administrativo
- `users` - Apenas Admin
- E mais...

### Permissões Customizadas:
Administradores podem definir permissões específicas para cada usuário, sobrescrevendo as permissões padrão do role.

## 📊 Modelos de Dados

### User
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (enum),
  customPermissions: [String],
  isActive: Boolean,
  timestamps: true
}
```

### Client
```javascript
{
  name: String,
  type: String (pessoa_fisica | empresa),
  email: String,
  phone: String,
  cpfCnpj: String (unique),
  address: {
    cep, uf, city, neighborhood,
    address, number, complement
  },
  timestamps: true
}
```

### Quote
```javascript
{
  clientName: String,
  clientEmail: String,
  clientPhone: String,
  deliveryAddress: Object,
  status: String,
  items: [Object],
  subtotal: Number,
  discount: Number,
  freight: Number,
  paymentMethod: String,
  installments: Number,
  total: Number,
  salespersonId: ObjectId,
  timestamps: true
}
```

## 🐛 Tratamento de Erros

A API retorna erros no seguinte formato:

```json
{
  "success": false,
  "message": "Mensagem de erro",
  "error": "Detalhes técnicos (apenas em desenvolvimento)"
}
```

### Códigos de Status HTTP:
- `200` - Sucesso
- `201` - Criado com sucesso
- `400` - Erro de validação
- `401` - Não autenticado
- `403` - Sem permissão
- `404` - Não encontrado
- `500` - Erro interno do servidor

## 🔄 Integração com Frontend

### Configurar URL da API

No frontend, configure a URL base da API:

```javascript
const API_URL = 'http://localhost:5000/api';
```

### Exemplo de Service

```javascript
// services/api.js
const API_URL = 'http://localhost:5000/api';

export const api = {
  async login(email, password) {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return response.json();
  },

  async getUsers(token) {
    const response = await fetch(`${API_URL}/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  }
};
```

## 🧪 Testes

Para testar a API, você pode usar:
- **Postman** - Importar coleção
- **Insomnia** - Cliente REST
- **cURL** - Linha de comando
- **Thunder Client** - Extensão VS Code

### Exemplo com cURL:

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@marmoraria.com","password":"admin123"}'

# Listar usuários
curl http://localhost:5000/api/users \
  -H "Authorization: Bearer {seu_token}"
```

## 📝 Logs

O servidor exibe logs coloridos no console:
- ✅ Sucesso em verde
- ❌ Erro em vermelho
- ℹ️  Info em azul
- 🚀 Inicialização

## 🚀 Deploy

### Preparação para Produção:

1. **Alterar JWT_SECRET**
   ```env
   JWT_SECRET=seu_secret_super_seguro_aleatorio
   ```

2. **Configurar NODE_ENV**
   ```env
   NODE_ENV=production
   ```

3. **Usar HTTPS**
   - Configure certificado SSL
   - Use reverse proxy (nginx, etc)

4. **MongoDB Atlas**
   - Já está configurado
   - Whitelist IPs do servidor

5. **Process Manager**
   ```bash
   npm install -g pm2
   pm2 start server.js --name marmoraria-api
   ```

### Plataformas Recomendadas:
- **Heroku** - Fácil e rápido
- **Railway** - Moderno e simples
- **DigitalOcean** - VPS completa
- **AWS** - Escalável
- **Vercel** - Com limitações para backend

## 🆘 Troubleshooting

### Erro de conexão com MongoDB
- Verifique se a connection string está correta
- Verifique se o IP está na whitelist do MongoDB Atlas
- Teste a conexão: `mongosh "sua_connection_string"`

### Token inválido
- Verifique se o token está sendo enviado corretamente
- Token pode ter expirado (padrão: 7 dias)
- Faça login novamente

### CORS Error
- Verifique a variável `CORS_ORIGIN`
- Deve corresponder à URL do frontend

## 📚 Recursos Adicionais

- [Express Documentation](https://expressjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [JWT.io](https://jwt.io/)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

## 👨‍💻 Desenvolvimento

### Adicionar Nova Rota

1. Criar Model em `models/`
2. Criar Controller em `controllers/`
3. Criar Route em `routes/`
4. Registrar rota em `server.js`

### Exemplo:

```javascript
// models/Example.js
const mongoose = require('mongoose');
const exampleSchema = new mongoose.Schema({
  name: String
}, { timestamps: true });
module.exports = mongoose.model('Example', exampleSchema);

// controllers/exampleController.js
const Example = require('../models/Example');
exports.getAll = async (req, res) => {
  const items = await Example.find();
  res.json({ success: true, data: items });
};

// routes/examples.js
const express = require('express');
const router = express.Router();
const { getAll } = require('../controllers/exampleController');
const { authenticate } = require('../middleware/auth');
router.get('/', authenticate, getAll);
module.exports = router;

// server.js
app.use('/api/examples', require('./routes/examples'));
```

---

**Backend desenvolvido para**: Sistema Marmoraria ERP
**Versão**: 1.0.0
**Data**: 2024

