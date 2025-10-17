# 🔗 Integração Frontend ↔️ Backend

## Guia completo para conectar o frontend React ao backend Node.js

## 📋 Visão Geral

Atualmente o frontend usa `localStorage` para armazenar dados. Vamos conectá-lo ao backend real com MongoDB.

## 🎯 Passo a Passo

### 1️⃣ Iniciar o Backend

```bash
cd backend
npm install
npm run seed    # Criar usuários iniciais
npm run dev     # Iniciar servidor
```

O backend estará rodando em: `http://localhost:5000`

### 2️⃣ Criar Service de API no Frontend

Crie um novo arquivo `utils/api.ts`:

```typescript
const API_URL = 'http://localhost:5000/api';

// Pegar token do localStorage
const getToken = () => localStorage.getItem('token');

// Headers padrão
const getHeaders = (includeAuth = true) => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (includeAuth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  return headers;
};

export const api = {
  // Autenticação
  async login(email: string, password: string) {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify({ email, password }),
    });
    return response.json();
  },

  async register(userData: {
    name: string;
    email: string;
    password: string;
    role: string;
  }) {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify(userData),
    });
    return response.json();
  },

  async getMe() {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: getHeaders(),
    });
    return response.json();
  },

  // Usuários
  async getUsers() {
    const response = await fetch(`${API_URL}/users`, {
      headers: getHeaders(),
    });
    return response.json();
  },

  async createUser(userData: any) {
    const response = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(userData),
    });
    return response.json();
  },

  async updateUser(id: string, userData: any) {
    const response = await fetch(`${API_URL}/users/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(userData),
    });
    return response.json();
  },

  async deleteUser(id: string) {
    const response = await fetch(`${API_URL}/users/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return response.json();
  },

  async toggleUserStatus(id: string) {
    const response = await fetch(`${API_URL}/users/${id}/toggle-status`, {
      method: 'PATCH',
      headers: getHeaders(),
    });
    return response.json();
  },

  async updateUserPermissions(id: string, permissions: string[]) {
    const response = await fetch(`${API_URL}/users/${id}/permissions`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ customPermissions: permissions }),
    });
    return response.json();
  },

  // Clientes
  async getClients() {
    const response = await fetch(`${API_URL}/clients`, {
      headers: getHeaders(),
    });
    return response.json();
  },

  async createClient(clientData: any) {
    const response = await fetch(`${API_URL}/clients`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(clientData),
    });
    return response.json();
  },

  // Adicione mais métodos conforme necessário...
};
```

### 3️⃣ Atualizar AuthContext

Atualize `context/AuthContext.tsx` para usar a API real:

```typescript
import { api } from '../utils/api';

// No método login:
const login = async (email: string, password: string): Promise<boolean> => {
  try {
    const result = await api.login(email, password);
    
    if (result.success) {
      const user: AuthUser = {
        id: result.data.user.id,
        name: result.data.user.name,
        email: result.data.user.email,
        password: '', // Não armazenar senha
        role: result.data.user.role,
        customPermissions: result.data.user.customPermissions,
        isActive: result.data.user.isActive,
        createdAt: result.data.user.createdAt,
      };
      
      setCurrentUser(user);
      localStorage.setItem('token', result.data.token);
      localStorage.setItem('user', JSON.stringify(user));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Erro no login:', error);
    return false;
  }
};

// No método register:
const register = async (
  userData: Omit<AuthUser, 'id' | 'createdAt' | 'isActive'>
): Promise<boolean> => {
  try {
    const result = await api.register(userData);
    
    if (result.success) {
      return true;
    }
    return false;
  } catch (error) {
    console.error('Erro no registro:', error);
    return false;
  }
};

// Ao carregar o app, verificar token:
useEffect(() => {
  const token = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');
  
  if (token && storedUser) {
    // Validar token chamando /api/auth/me
    api.getMe().then(result => {
      if (result.success) {
        setCurrentUser(result.data.user);
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }).catch(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    });
  }
}, []);
```

### 4️⃣ Atualizar UsersPage

Atualize `pages/UsersPage.tsx` para usar a API:

```typescript
import { api } from '../utils/api';

// No useEffect para carregar usuários:
useEffect(() => {
  loadUsers();
}, []);

const loadUsers = async () => {
  try {
    const result = await api.getUsers();
    if (result.success) {
      setUsers(result.data);
    }
  } catch (error) {
    console.error('Erro ao carregar usuários:', error);
  }
};

// No handleSubmit:
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    if (editingUser) {
      // Atualizar
      const result = await api.updateUser(editingUser.id, formData);
      if (result.success) {
        loadUsers(); // Recarregar lista
        handleCloseModal();
      }
    } else {
      // Criar
      const result = await api.createUser(formData);
      if (result.success) {
        loadUsers();
        handleCloseModal();
      }
    }
  } catch (error) {
    console.error('Erro ao salvar usuário:', error);
  }
};

// Outros métodos similares...
```

### 5️⃣ Atualizar DataContext (Opcional)

Se quiser manter o DataContext mas com dados do backend, você pode:

```typescript
// Em DataContext.tsx
import { api } from '../utils/api';

// Carregar clientes do backend:
useEffect(() => {
  api.getClients().then(result => {
    if (result.success) {
      setClients(result.data);
    }
  });
}, []);

// Ao adicionar cliente:
const addClient = async (clientToSave: Client) => {
  try {
    const result = await api.createClient(clientToSave);
    if (result.success) {
      setClients(prev => [...prev, result.data]);
    }
  } catch (error) {
    console.error('Erro ao adicionar cliente:', error);
  }
};
```

## 🎨 Melhorias Recomendadas

### 1. Loading States

```typescript
const [loading, setLoading] = useState(false);

const loadUsers = async () => {
  setLoading(true);
  try {
    const result = await api.getUsers();
    setUsers(result.data);
  } finally {
    setLoading(false);
  }
};
```

### 2. Error Handling

```typescript
const [error, setError] = useState('');

const handleSubmit = async () => {
  setError('');
  try {
    const result = await api.createUser(formData);
    if (!result.success) {
      setError(result.message);
    }
  } catch (err) {
    setError('Erro de conexão com o servidor');
  }
};
```

### 3. Toast Notifications

Instale uma biblioteca de notificações:
```bash
npm install react-hot-toast
```

```typescript
import toast from 'react-hot-toast';

const handleSubmit = async () => {
  try {
    const result = await api.createUser(formData);
    if (result.success) {
      toast.success('Usuário criado com sucesso!');
    } else {
      toast.error(result.message);
    }
  } catch (err) {
    toast.error('Erro de conexão');
  }
};
```

## 🔐 Segurança

### Refresh Token no Logout
```typescript
const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  setCurrentUser(null);
};
```

### Interceptar 401 (Token Expirado)
```typescript
// Em api.ts
const handleResponse = async (response: Response) => {
  const data = await response.json();
  
  if (response.status === 401) {
    // Token inválido/expirado
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
  
  return data;
};
```

## 🧪 Testar Integração

### 1. Login
1. Inicie backend e frontend
2. Abra DevTools (F12) → Network
3. Faça login
4. Verifique requisição POST para `/api/auth/login`
5. Token deve estar no localStorage

### 2. Listar Usuários
1. Acesse página de usuários
2. Verifique requisição GET para `/api/users`
3. Header `Authorization: Bearer ...` deve estar presente

### 3. Criar Usuário
1. Crie novo usuário
2. Verifique requisição POST para `/api/users`
3. Usuário deve aparecer na lista

## 🐛 Troubleshooting

### CORS Error
**Problema**: `Access-Control-Allow-Origin`

**Solução**: No backend, verifique `CORS_ORIGIN` no .env:
```env
CORS_ORIGIN=http://localhost:5173
```

### 401 Unauthorized
**Problema**: Token não está sendo enviado

**Solução**: Verifique se o token está no localStorage e sendo incluído no header:
```typescript
headers: {
  'Authorization': `Bearer ${token}`
}
```

### Network Error
**Problema**: Backend não está rodando

**Solução**: 
```bash
cd backend
npm run dev
```

### Dados não aparecem
**Problema**: Backend não tem dados

**Solução**:
```bash
cd backend
npm run seed
```

## 📊 Fluxo Completo

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Frontend  │────────>│   Backend   │────────>│   MongoDB   │
│  (React)    │<────────│  (Node.js)  │<────────│   (Atlas)   │
└─────────────┘         └─────────────┘         └─────────────┘
     ↓                        ↓                        ↓
  localhost:5173        localhost:5000           Cloud Atlas
  
1. Usuário faz login no frontend
2. Frontend envia email/senha para backend
3. Backend valida no MongoDB
4. Backend retorna token JWT
5. Frontend armazena token
6. Próximas requisições incluem token
7. Backend valida token
8. Backend retorna dados
```

## ✅ Checklist de Integração

- [ ] Backend rodando (http://localhost:5000)
- [ ] Frontend rodando (http://localhost:5173)
- [ ] Arquivo `utils/api.ts` criado
- [ ] `AuthContext.tsx` atualizado
- [ ] `UsersPage.tsx` atualizado
- [ ] Login funcionando
- [ ] Token sendo salvo
- [ ] Requisições incluindo token
- [ ] CORS configurado corretamente
- [ ] Usuários sendo listados do backend
- [ ] Criar/Editar/Deletar funcionando

## 🎯 Próximos Passos

1. **Migrar todas as páginas** para usar API real
   - CrmPage → api.getClients()
   - SuppliersPage → api.getSuppliers()
   - QuotesPage → api.getQuotes()
   - Etc.

2. **Implementar cache** (React Query ou SWR)
   ```bash
   npm install @tanstack/react-query
   ```

3. **Adicionar loading skeleton** nas páginas

4. **Implementar paginação** para listas grandes

5. **Adicionar filtros e busca** no backend

---

## 📚 Recursos

- [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [React Query](https://tanstack.com/query/latest)
- [Axios](https://axios-http.com/) (alternativa ao fetch)

---

**🎉 Com isso, seu sistema estará 100% integrado!**

Backend salvando dados reais no MongoDB e frontend consumindo a API completa.

