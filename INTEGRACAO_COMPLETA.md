# ✅ Integração Frontend ↔️ Backend COMPLETA!

## 🎉 O que foi atualizado

Todo o frontend foi integrado ao backend Node.js + MongoDB!

### ✅ Arquivos Atualizados

1. **`utils/api.ts`** - Serviço completo de API
   - Autenticação (login, register, getMe)
   - Usuários (CRUD completo + permissões)
   - Clientes (CRUD completo)
   - Fornecedores (CRUD completo)
   - Orçamentos (CRUD completo)

2. **`context/AuthContext.tsx`** - Autenticação real
   - Login/Logout usando API
   - Validação de token ao carregar app
   - Armazenamento de token JWT
   - Loading state durante verificação

3. **`pages/UsersPage.tsx`** - Gerenciamento de usuários
   - Carregar usuários do backend
   - Criar/Editar/Deletar usando API
   - Ativar/Desativar usuários
   - Gerenciar permissões customizadas
   - Estados de loading e erro

4. **`context/DataContext.tsx`** - Dados centralizados
   - Carregar clientes, fornecedores e orçamentos do backend
   - Salvar/Atualizar usando API
   - Fallback para dados mock em caso de erro
   - CRM, Suppliers e outras páginas funcionam automaticamente!

## 🚀 Como Usar

### 1️⃣ Iniciar Backend
```bash
cd backend
npm install
npm run seed    # Criar usuários de teste
npm run dev     # Iniciar servidor (porta 5000)
```

### 2️⃣ Iniciar Frontend
```bash
cd frontend
npm install
npm run dev     # Iniciar frontend (porta 3000)
```

### 3️⃣ Testar

1. **Login**
   - Acesse http://localhost:3000
   - Use: `admin@marmoraria.com` / `admin123`
   - ✅ Login agora usa backend!

2. **Gerenciamento de Usuários**
   - Acesse menu "Usuários"
   - Crie novos usuários
   - Gerencie permissões
   - ✅ Tudo salvo no MongoDB!

3. **CRM (Clientes)**
   - Acesse menu "CRM"
   - Adicione clientes
   - Edite informações
   - ✅ Dados salvos no backend!

4. **Fornecedores**
   - Acesse menu "Fornecedores"
   - Gerencie fornecedores
   - ✅ Integrado com backend!

5. **Orçamentos**
   - Acesse menu "Orçamentos"
   - Crie orçamentos
   - ✅ Salvos no MongoDB!

## 🔄 Fluxo de Dados

```
┌─────────────────┐
│   Frontend      │
│  (React)        │
└────────┬────────┘
         │
         │ HTTP + JWT Token
         │
         ▼
┌─────────────────┐
│   Backend       │
│  (Node.js)      │
└────────┬────────┘
         │
         │ Mongoose
         │
         ▼
┌─────────────────┐
│   MongoDB       │
│   (Atlas)       │
└─────────────────┘
```

## 🔐 Autenticação

### Como funciona:

1. **Login**: Frontend envia email/senha → Backend valida → Retorna token JWT
2. **Armazenamento**: Token salvo no localStorage
3. **Requisições**: Token incluído no header `Authorization: Bearer ...`
4. **Validação**: Backend valida token em cada requisição
5. **Logout**: Token removido do localStorage

### Exemplo de requisição autenticada:

```javascript
fetch('http://localhost:5000/api/users', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

## 📊 Estados Implementados

### Loading States ⏳
- Spinner animado durante carregamento
- Mensagem "Carregando..." no AuthContext
- Loading em todas as operações CRUD

### Error States ❌
- Mensagens de erro em vermelho
- Erros de validação do backend
- Erros de conexão
- Fallback para dados mock se backend indisponível

### Success States ✅
- Atualização automática após salvar
- Recarregamento de listas
- Feedback visual

## 🎯 Funcionalidades por Página

### ✅ Login/Register
- Autenticação real com backend
- Validação de credenciais
- Token JWT armazenado
- Redirecionamento automático

### ✅ Usuários (Admin apenas)
- Listar todos os usuários
- Criar novo usuário
- Editar usuário existente
- Alterar senha
- Ativar/Desativar usuário
- Gerenciar permissões customizadas
- Deletar usuário

### ✅ CRM (Clientes)
- Listar clientes
- Adicionar cliente
- Editar cliente
- Visualizar detalhes
- Notas (ainda local, pode ser migrado)
- Pipeline de vendas (ainda local)

### ✅ Fornecedores
- Listar fornecedores
- Adicionar fornecedor
- Editar fornecedor
- Deletar fornecedor

### ✅ Orçamentos
- Listar orçamentos
- Criar orçamento
- Editar orçamento
- Aprovar/Rejeitar

## 🔧 Configuração

### API URL
Definida em `utils/api.ts`:
```typescript
const API_URL = 'http://localhost:5000/api';
```

Para produção, altere para:
```typescript
const API_URL = 'https://sua-api.com/api';
```

### CORS
Backend configurado para aceitar `http://localhost:3000`

Para produção, altere no backend `.env`:
```env
CORS_ORIGIN=https://seu-frontend.com
```

## 📝 Credenciais de Teste

Após rodar `npm run seed` no backend:

| Usuário | Email | Senha | Permissões |
|---------|-------|-------|------------|
| Admin | admin@marmoraria.com | admin123 | Todas |
| Vendedor | vendedor@marmoraria.com | vendedor123 | Limitadas |
| Produção | producao@marmoraria.com | producao123 | Produção |

## 🐛 Troubleshooting

### Frontend não carrega dados

**Problema**: Página vazia ou com dados antigos

**Solução**:
1. Verifique se backend está rodando: http://localhost:5000
2. Abra DevTools (F12) → Network
3. Verifique se requisições estão sendo feitas
4. Limpe localStorage:
```javascript
// No console do navegador
localStorage.clear();
location.reload();
```

### Erro de CORS

**Problema**: `Access-Control-Allow-Origin error`

**Solução**:
1. Verifique `CORS_ORIGIN` no backend `.env`
2. Deve ser exatamente `http://localhost:3000`
3. Reinicie o backend após alterar

### Token inválido

**Problema**: `401 Unauthorized`

**Solução**:
1. Faça logout e login novamente
2. Token pode ter expirado (7 dias)
3. Verifique se token está no localStorage:
```javascript
localStorage.getItem('token')
```

### Backend não conecta

**Problema**: Erro de conexão MongoDB

**Solução**:
1. Verifique string de conexão no `.env`
2. Verifique conexão com internet
3. MongoDB Atlas deve ter IP whitelisted

### Dados não salvam

**Problema**: Mudanças não persistem

**Solução**:
1. Verifique se backend está rodando
2. Abra DevTools → Network → veja se POST/PUT retornam success
3. Verifique logs do backend no terminal

## 📈 Próximos Passos

### Dados que ainda usam mock (podem ser migrados):

1. **Opportunities** (Oportunidades do pipeline)
2. **Notes** (Notas dos clientes)
3. **AgendaEvents** (Eventos de agenda)
4. **Orders** (Pedidos)
5. **ServiceOrders** (Ordens de Serviço)
6. **Materials, Services, Products** (Catálogo)
7. **StockItems** (Itens de estoque)
8. **Invoices** (Notas fiscais)
9. **FinancialTransactions** (Transações financeiras)
10. **Receipts** (Recibos)

### Como migrar:

1. **Criar rotas no backend** seguindo o padrão existente
2. **Adicionar métodos na API** em `utils/api.ts`
3. **Atualizar DataContext** para carregar do backend
4. **Testar** cada funcionalidade

Exemplo para Opportunities:
```typescript
// No backend: routes/opportunities.js
// No frontend: api.getOpportunities(), api.createOpportunity(), etc.
// No DataContext: loadOpportunities() no useEffect
```

## ✨ Melhorias Recomendadas

### 1. React Query (Recomendado!)
```bash
npm install @tanstack/react-query
```

Benefícios:
- Cache automático
- Refetch automático
- Loading states automáticos
- Muito mais eficiente

### 2. Toast Notifications
```bash
npm install react-hot-toast
```

```typescript
import toast from 'react-hot-toast';
toast.success('Usuário criado!');
toast.error('Erro ao salvar');
```

### 3. Interceptor para erros 401
```typescript
// Redirecionar automaticamente para login se token expirar
```

### 4. Otimistic UI Updates
```typescript
// Atualizar UI antes da resposta do servidor
// Reverter se houver erro
```

## 🎊 Resumo

### ✅ O que funciona AGORA:

- ✅ Login/Logout com backend
- ✅ Gerenciamento de usuários
- ✅ CRM (Clientes)
- ✅ Fornecedores
- ✅ Orçamentos
- ✅ Permissões customizadas
- ✅ Loading states
- ✅ Error handling
- ✅ Token JWT
- ✅ Validação de acesso

### 🎯 Status:

**Frontend**: 100% integrado com as principais funcionalidades
**Backend**: 100% funcional para usuários, clientes, fornecedores, orçamentos
**Banco de Dados**: MongoDB Atlas conectado e armazenando dados

### 🚀 Pronto para:

- ✅ Testes locais
- ✅ Desenvolvimento
- ✅ Adicionar mais funcionalidades
- ⏳ Deploy (necessita configuração de produção)

---

**🎉 Parabéns! Seu sistema ERP agora tem frontend e backend totalmente integrados!**

Para dúvidas ou problemas, consulte:
- `backend/README.md` - Documentação do backend
- `BACKEND_SETUP.md` - Overview do backend
- `INTEGRACAO_FRONTEND_BACKEND.md` - Guia detalhado de integração

