# OrderAddendum Controller Documentation

## **Visão Geral**
O controller `orderAddendumController.js` gerencia operações CRUD para adendos de pedidos, permitindo criar, consultar e atualizar status de adendos.

## **Endpoints Disponíveis**

### **1. GET /api/order-addendums/order/:orderId**
**Descrição:** Busca todos os adendos para um pedido específico

**Parâmetros:**
- `orderId`: ID do pedido

**Resposta:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "64a1b2c3d4e5f6789012345",
      "orderId": "64a1b2c3d4e5f6789012346",
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

### **2. POST /api/order-addendums/order/:orderId**
**Descrição:** Cria um novo adendo para um pedido

**Parâmetros:**
- `orderId`: ID do pedido

**Body:**
```json
{
  "reason": "Cliente solicitou adição de item",
  "addedItems": [
    {
      "type": "material",
      "description": "Mármore Carrara - 2m²",
      "quantity": 1,
      "unitPrice": 500,
      "totalPrice": 500
    }
  ],
  "removedItemIds": ["item-123"],
  "changedItems": [
    {
      "originalItemId": "item-456",
      "updatedItem": {
        "type": "material",
        "description": "Mármore Carrara - 3m²",
        "quantity": 1,
        "unitPrice": 600,
        "totalPrice": 600
      }
    }
  ],
  "priceAdjustment": 200
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Adendo criado com sucesso",
  "data": {
    "_id": "64a1b2c3d4e5f6789012345",
    "orderId": "64a1b2c3d4e5f6789012346",
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

### **3. PUT /api/order-addendums/:addendumId/status**
**Descrição:** Atualiza o status de um adendo (aprovar ou rejeitar)

**Parâmetros:**
- `addendumId`: ID do adendo

**Body:**
```json
{
  "status": "approved"
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Adendo aprovado com sucesso",
  "data": {
    "_id": "64a1b2c3d4e5f6789012345",
    "orderId": "64a1b2c3d4e5f6789012346",
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

### **4. GET /api/order-addendums/:addendumId**
**Descrição:** Busca um adendo específico por ID

**Parâmetros:**
- `addendumId`: ID do adendo

### **5. GET /api/order-addendums/pending**
**Descrição:** Busca todos os adendos pendentes

## **Funcionalidades Implementadas**

### **✅ getAddendumsForOrder**
- Busca adendos por `orderId`
- Popula `createdBy` e `approvedBy`
- Ordena por `addendumNumber`
- Verifica se o pedido existe

### **✅ createAddendum**
- Recebe dados via `req.body`
- Calcula `addendumNumber` sequencial
- Define `createdBy` com `req.user._id`
- Valida dados obrigatórios
- Popula dados do usuário criador

### **✅ updateAddendumStatus**
- Atualiza status para 'approved' ou 'rejected'
- Impede alteração se não estiver 'pending'
- Define `approvedBy` e `approvedAt` se aprovado
- Popula dados dos usuários

### **✅ Funções Auxiliares**
- `getAddendumById`: Busca adendo específico
- `getPendingAddendums`: Lista adendos pendentes

## **Validações Implementadas**

1. **Existência do Pedido:** Verifica se o pedido existe antes de criar adendo
2. **Dados Obrigatórios:** Valida `reason` obrigatório
3. **Status Válido:** Apenas 'approved' ou 'rejected' permitidos
4. **Status Pendente:** Impede alteração de adendos já processados
5. **Sequência de Adendos:** Calcula automaticamente o próximo número

## **Tratamento de Erros**

- Try-catch em todas as funções
- Mensagens de erro específicas
- Logs detalhados para debugging
- Status HTTP apropriados (404, 400, 500)

## **População de Dados**

- `createdBy`: Nome e email do usuário criador
- `approvedBy`: Nome e email do usuário aprovador
- `orderId`: Dados básicos do pedido (em algumas consultas)

## **Rotas Configuradas**

```javascript
// Todas as rotas requerem autenticação
router.use(authenticate);

router.get('/order/:orderId', getAddendumsForOrder);
router.post('/order/:orderId', createAddendum);
router.get('/pending', getPendingAddendums);
router.get('/:addendumId', getAddendumById);
router.put('/:addendumId/status', updateAddendumStatus);
```

## **Exemplo de Uso Completo**

```javascript
// 1. Criar adendo
const response = await fetch('/api/order-addendums/order/64a1b2c3d4e5f6789012346', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    reason: 'Cliente solicitou adição de item',
    addedItems: [{
      type: 'material',
      description: 'Mármore Carrara - 2m²',
      quantity: 1,
      unitPrice: 500,
      totalPrice: 500
    }],
    priceAdjustment: 500
  })
});

// 2. Aprovar adendo
const approveResponse = await fetch('/api/order-addendums/64a1b2c3d4e5f6789012345/status', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    status: 'approved'
  })
});
```
