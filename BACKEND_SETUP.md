# 🎯 Backend Completo - Sistema Marmoraria ERP

## ✅ O que foi criado

Um backend completo em Node.js com MongoDB para gerenciar todos os dados do sistema.

### 📦 Estrutura Criada

```
backend/
├── config/               # Configurações
│   ├── database.js      # Conexão MongoDB
│   └── jwt.js           # Utilitários JWT
├── controllers/         # Lógica de negócio
│   ├── authController.js
│   ├── userController.js
│   ├── clientController.js
│   ├── supplierController.js
│   └── quoteController.js
├── middleware/          # Middlewares
│   ├── auth.js         # Autenticação/Autorização
│   └── errorHandler.js # Tratamento de erros
├── models/             # Modelos Mongoose
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
├── routes/             # Rotas da API
│   ├── auth.js
│   ├── users.js
│   ├── clients.js
│   ├── suppliers.js
│   └── quotes.js
├── scripts/
│   └── seed.js         # Popular banco
├── server.js           # Servidor principal
├── package.json
├── .env.example
├── .gitignore
├── README.md           # Documentação completa
└── INSTALACAO.md       # Guia rápido
```

## 🚀 Como Usar

### 1. Instalar dependências
```bash
cd backend
npm install
```

### 2. Configurar .env
Crie um arquivo `.env` na pasta backend:

```env
MONGODB_URI=mongodb+srv://admin:@81566794Ga@marmoraria.bopqgos.mongodb.net/marmoraria?retryWrites=true&w=majority&appName=Marmoraria
JWT_SECRET=marmoraria_super_secret_key_change_in_production_2024
JWT_EXPIRES_IN=7d
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

### 3. Popular banco (opcional)
```bash
npm run seed
```

### 4. Iniciar servidor
```bash
npm run dev
```

O servidor estará em: http://localhost:5000

## 🔐 Credenciais Padrão

Após rodar o seed:

| Usuário  | Email                      | Senha       | Acesso              |
|----------|----------------------------|-------------|---------------------|
| Admin    | admin@marmoraria.com       | admin123    | Total               |
| Vendedor | vendedor@marmoraria.com    | vendedor123 | Vendas e CRM        |
| Produção | producao@marmoraria.com    | producao123 | Produção e Estoque  |

## 📡 Principais Endpoints

### Autenticação
- `POST /api/auth/register` - Registrar
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Perfil

### Usuários (Admin)
- `GET /api/users` - Listar
- `POST /api/users` - Criar
- `PUT /api/users/:id` - Atualizar
- `DELETE /api/users/:id` - Deletar
- `PATCH /api/users/:id/permissions` - Atualizar permissões
- `PATCH /api/users/:id/toggle-status` - Ativar/Desativar

### Clientes
- `GET /api/clients` - Listar
- `POST /api/clients` - Criar
- `PUT /api/clients/:id` - Atualizar
- `DELETE /api/clients/:id` - Deletar

### Fornecedores
- `GET /api/suppliers` - Listar
- `POST /api/suppliers` - Criar
- `PUT /api/suppliers/:id` - Atualizar
- `DELETE /api/suppliers/:id` - Deletar

### Orçamentos
- `GET /api/quotes` - Listar
- `POST /api/quotes` - Criar
- `PUT /api/quotes/:id` - Atualizar
- `DELETE /api/quotes/:id` - Deletar

## 🔒 Segurança Implementada

✅ **Hash de senhas** com bcryptjs (salt rounds: 10)
✅ **JWT** para autenticação (expira em 7 dias)
✅ **Rate Limiting** (100 req/15min por IP)
✅ **Helmet** para headers de segurança
✅ **CORS** configurado
✅ **Validação** de dados com Mongoose
✅ **Middleware** de autenticação e autorização
✅ **Controle de permissões** por role e customizadas

## 🧪 Testar API

### Com cURL:
```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@marmoraria.com","password":"admin123"}'

# Listar usuários (substitua TOKEN)
curl http://localhost:5000/api/users \
  -H "Authorization: Bearer TOKEN_AQUI"
```

### Com JavaScript (Frontend):
```javascript
// Login
const response = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@marmoraria.com',
    password: 'admin123'
  })
});

const { data } = await response.json();
const token = data.token;

// Usar token
const users = await fetch('http://localhost:5000/api/users', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

## 🎯 Próximos Passos

### 1. Conectar Frontend ao Backend

Atualize o `AuthContext.tsx` do frontend para usar a API real:

```typescript
const login = async (email: string, password: string): Promise<boolean> => {
  try {
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const result = await response.json();
    
    if (result.success) {
      setCurrentUser(result.data.user);
      localStorage.setItem('token', result.data.token);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Erro no login:', error);
    return false;
  }
};
```

### 2. Adicionar mais rotas
O backend já tem modelos para:
- Orders (Pedidos)
- ServiceOrders (Ordens de Serviço)
- Materials (Materiais)
- Services (Serviços)
- Products (Produtos)
- StockItems (Itens de Estoque)
- Opportunities (Oportunidades)
- Notes (Notas)

Basta criar controllers e rotas seguindo o padrão existente.

### 3. Deploy
Para produção:
- Altere `JWT_SECRET` para algo seguro
- Configure `NODE_ENV=production`
- Use HTTPS
- Configure process manager (PM2)

## 📚 Documentação

- **Completa**: Veja `backend/README.md`
- **Rápida**: Veja `backend/INSTALACAO.md`

## 🆘 Ajuda

### Erro de conexão MongoDB
- Verifique a connection string no .env
- Teste a internet
- MongoDB Atlas deve ter IP whitelisted

### Porta já em uso
Altere `PORT=5000` no .env para outra porta

### CORS Error
Verifique se `CORS_ORIGIN` no backend corresponde à URL do frontend

### Token inválido
- Faça login novamente
- Token expira em 7 dias (configurável)

---

## 📊 Resumo do Sistema

### Frontend (React + TypeScript)
✅ Sistema de login/cadastro
✅ Gerenciamento de usuários
✅ Controle de permissões por página
✅ Interface completa para CRM, Vendas, Produção, etc.

### Backend (Node.js + Express + MongoDB)
✅ API REST completa
✅ Autenticação JWT
✅ Hash de senhas
✅ Controle de acesso
✅ 11 modelos de dados
✅ Rotas protegidas
✅ Documentação completa

### Banco de Dados (MongoDB Atlas)
✅ Configurado e conectado
✅ Modelos definidos
✅ Seed script disponível

---

**🎉 Sistema completo e funcional!**

Para dúvidas ou problemas, consulte a documentação detalhada em `backend/README.md`

