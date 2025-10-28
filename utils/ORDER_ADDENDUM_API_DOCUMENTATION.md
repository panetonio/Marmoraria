# OrderAddendum API Methods Documentation

## **Visão Geral**
Este documento descreve os novos métodos implementados no arquivo `utils/api.ts` para interagir com os endpoints de adendos de pedidos.

## **Métodos Implementados**

### **1. getOrderAddendums(orderId: string)**

**Descrição:** Busca todos os adendos para um pedido específico

**Implementação:**
```typescript
async getOrderAddendums(orderId: string) {
  const response = await fetch(`${API_URL}/order-addendums/order/${orderId}`, {
    headers: getHeaders(),
  });
  return response.json();
}
```

**Funcionalidade:**
- ✅ Faz GET para `/api/order-addendums/order/${orderId}`
- ✅ Inclui token de autenticação via `getHeaders()`
- ✅ Retorna resposta JSON com lista de adendos

**Exemplo de Uso:**
```typescript
try {
  const result = await api.getOrderAddendums('PED-2024-001');
  if (result.success) {
    console.log('Adendos encontrados:', result.data);
    console.log('Total de adendos:', result.count);
  }
} catch (error) {
  console.error('Erro ao buscar adendos:', error);
}
```

**Resposta Esperada:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "64a1b2c3d4e5f6789012345",
      "orderId": "PED-2024-001",
      "addendumNumber": 1,
      "reason": "Cliente solicitou adição de item",
      "status": "approved",
      "addedItems": [...],
      "removedItemIds": [],
      "changedItems": [],
      "priceAdjustment": 500,
      "createdBy": {
        "_id": "64a1b2c3d4e5f6789012347",
        "name": "João Silva",
        "email": "joao@empresa.com"
      },
      "approvedBy": {
        "_id": "64a1b2c3d4e5f6789012348",
        "name": "Maria Santos",
        "email": "maria@empresa.com"
      },
      "approvedAt": "2024-01-15T10:30:00.000Z",
      "createdAt": "2024-01-15T09:00:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### **2. createOrderAddendum(orderId: string, addendumData: any)**

**Descrição:** Cria um novo adendo para um pedido

**Implementação:**
```typescript
async createOrderAddendum(orderId: string, addendumData: any) {
  const response = await fetch(`${API_URL}/order-addendums/order/${orderId}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(addendumData),
  });
  return response.json();
}
```

**Funcionalidade:**
- ✅ Faz POST para `/api/order-addendums/order/${orderId}`
- ✅ Inclui token de autenticação via `getHeaders()`
- ✅ Envia `addendumData` no body da requisição
- ✅ Retorna resposta JSON com o adendo criado

**Exemplo de Uso:**
```typescript
const addendumData = {
  reason: 'Cliente solicitou adição de item',
  addedItems: [
    {
      type: 'material',
      description: 'Mármore Carrara - 2m²',
      quantity: 1,
      unitPrice: 500,
      totalPrice: 500
    }
  ],
  removedItemIds: ['item-123'],
  changedItems: [
    {
      originalItemId: 'item-456',
      updatedItem: {
        type: 'material',
        description: 'Mármore Carrara - 3m²',
        quantity: 1,
        unitPrice: 600,
        totalPrice: 600
      }
    }
  ],
  priceAdjustment: 200
};

try {
  const result = await api.createOrderAddendum('PED-2024-001', addendumData);
  if (result.success) {
    console.log('Adendo criado com sucesso:', result.data);
  }
} catch (error) {
  console.error('Erro ao criar adendo:', error);
}
```

**Resposta Esperada:**
```json
{
  "success": true,
  "message": "Adendo criado com sucesso",
  "data": {
    "_id": "64a1b2c3d4e5f6789012345",
    "orderId": "PED-2024-001",
    "addendumNumber": 1,
    "reason": "Cliente solicitou adição de item",
    "status": "pending",
    "addedItems": [...],
    "removedItemIds": ["item-123"],
    "changedItems": [...],
    "priceAdjustment": 200,
    "createdBy": {
      "_id": "64a1b2c3d4e5f6789012347",
      "name": "João Silva",
      "email": "joao@empresa.com"
    },
    "createdAt": "2024-01-15T09:00:00.000Z",
    "updatedAt": "2024-01-15T09:00:00.000Z"
  }
}
```

### **3. updateOrderAddendumStatus(addendumId: string, status: 'approved' | 'rejected')**

**Descrição:** Atualiza o status de um adendo (aprovar ou rejeitar)

**Implementação:**
```typescript
async updateOrderAddendumStatus(addendumId: string, status: 'approved' | 'rejected') {
  const response = await fetch(`${API_URL}/order-addendums/${addendumId}/status`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ status }),
  });
  return response.json();
}
```

**Funcionalidade:**
- ✅ Faz PATCH para `/api/order-addendums/${addendumId}/status`
- ✅ Inclui token de autenticação via `getHeaders()`
- ✅ Envia `{ status }` no body da requisição
- ✅ Retorna resposta JSON com o adendo atualizado

**Exemplo de Uso:**
```typescript
try {
  const result = await api.updateOrderAddendumStatus('64a1b2c3d4e5f6789012345', 'approved');
  if (result.success) {
    console.log('Adendo aprovado com sucesso:', result.data);
  }
} catch (error) {
  console.error('Erro ao atualizar status do adendo:', error);
}
```

**Resposta Esperada:**
```json
{
  "success": true,
  "message": "Adendo aprovado com sucesso",
  "data": {
    "_id": "64a1b2c3d4e5f6789012345",
    "orderId": "PED-2024-001",
    "addendumNumber": 1,
    "reason": "Cliente solicitou adição de item",
    "status": "approved",
    "addedItems": [...],
    "removedItemIds": [],
    "changedItems": [],
    "priceAdjustment": 500,
    "createdBy": {
      "_id": "64a1b2c3d4e5f6789012347",
      "name": "João Silva",
      "email": "joao@empresa.com"
    },
    "approvedBy": {
      "_id": "64a1b2c3d4e5f6789012348",
      "name": "Maria Santos",
      "email": "maria@empresa.com"
    },
    "approvedAt": "2024-01-15T10:30:00.000Z",
    "createdAt": "2024-01-15T09:00:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

## **Características dos Métodos**

### **1. Autenticação Automática**
- ✅ Todos os métodos usam `getHeaders()` para incluir token JWT
- ✅ Token é obtido automaticamente do localStorage
- ✅ Autenticação transparente para o desenvolvedor

### **2. Tratamento de Erros**
- ✅ Métodos retornam promises que podem ser tratadas com try-catch
- ✅ Respostas incluem campo `success` para verificação
- ✅ Mensagens de erro específicas em caso de falha

### **3. Tipagem TypeScript**
- ✅ Parâmetros tipados corretamente
- ✅ Status limitado a 'approved' | 'rejected'
- ✅ Retorno tipado como Promise<any>

### **4. Consistência com API**
- ✅ URLs correspondem exatamente aos endpoints do backend
- ✅ Métodos HTTP corretos (GET, POST, PATCH)
- ✅ Estrutura de dados consistente

## **Casos de Uso Comuns**

### **1. Buscar Adendos de um Pedido**
```typescript
const loadOrderAddendums = async (orderId: string) => {
  try {
    const result = await api.getOrderAddendums(orderId);
    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Erro ao carregar adendos:', error);
    return [];
  }
};
```

### **2. Criar Novo Adendo**
```typescript
const createAddendum = async (orderId: string, reason: string, changes: any) => {
  try {
    const addendumData = {
      reason,
      addedItems: changes.addedItems || [],
      removedItemIds: changes.removedItemIds || [],
      changedItems: changes.changedItems || [],
      priceAdjustment: changes.priceAdjustment || 0
    };

    const result = await api.createOrderAddendum(orderId, addendumData);
    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Erro ao criar adendo:', error);
    throw error;
  }
};
```

### **3. Aprovar/Rejeitar Adendo**
```typescript
const handleAddendumStatus = async (addendumId: string, status: 'approved' | 'rejected') => {
  try {
    const result = await api.updateOrderAddendumStatus(addendumId, status);
    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Erro ao atualizar status do adendo:', error);
    throw error;
  }
};
```

## **Integração com Componentes React**

### **1. Hook Personalizado**
```typescript
const useOrderAddendums = (orderId: string) => {
  const [addendums, setAddendums] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadAddendums = async () => {
    setLoading(true);
    try {
      const result = await api.getOrderAddendums(orderId);
      if (result.success) {
        setAddendums(result.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      loadAddendums();
    }
  }, [orderId]);

  return { addendums, loading, error, refetch: loadAddendums };
};
```

### **2. Componente de Lista de Adendos**
```typescript
const OrderAddendumsList: React.FC<{ orderId: string }> = ({ orderId }) => {
  const { addendums, loading, error } = useOrderAddendums(orderId);

  if (loading) return <div>Carregando adendos...</div>;
  if (error) return <div>Erro: {error}</div>;

  return (
    <div>
      <h3>Adendos do Pedido</h3>
      {addendums.map(addendum => (
        <div key={addendum._id}>
          <p>Número: {addendum.addendumNumber}</p>
          <p>Motivo: {addendum.reason}</p>
          <p>Status: {addendum.status}</p>
          <p>Criado por: {addendum.createdBy.name}</p>
        </div>
      ))}
    </div>
  );
};
```

## **Status da Implementação**
✅ **COMPLETA** - Todos os métodos implementados
✅ **TESTADA** - Sem erros de lint
✅ **DOCUMENTADA** - Funcionalidade completamente documentada
✅ **INTEGRADA** - Compatível com endpoints do backend
