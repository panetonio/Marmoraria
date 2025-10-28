# OrderAddendum Routes Documentation

## **Visão Geral**
O arquivo `orderAddendums.js` define as rotas da API para gerenciamento de adendos de pedidos, incluindo autenticação, autorização e validações específicas.

## **Rotas Implementadas**

### **1. GET /order/:orderId**
**Descrição:** Busca todos os adendos para um pedido específico

**Autenticação:** ✅ Obrigatória
**Autorização:** `orders`

**Parâmetros:**
- `orderId`: ID do pedido

**Resposta de Sucesso:**
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
      "createdBy": {
        "_id": "64a1b2c3d4e5f6789012347",
        "name": "João Silva",
        "email": "joao@empresa.com"
      },
      "approvedBy": {
        "_id": "64a1b2c3d4e5f6789012348",
        "name": "Maria Santos",
        "email": "maria@empresa.com"
      }
    }
  ]
}
```

### **2. POST /order/:orderId**
**Descrição:** Cria um novo adendo para um pedido

**Autenticação:** ✅ Obrigatória
**Autorização:** `orders`
**Validação:** Campo `reason` obrigatório

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

**Validações:**
- ✅ `reason` é obrigatório e não pode ser vazio
- ✅ `addedItems` é opcional (array vazio por padrão)
- ✅ `removedItemIds` é opcional (array vazio por padrão)
- ✅ `changedItems` é opcional (array vazio por padrão)
- ✅ `priceAdjustment` é opcional (0 por padrão)

**Resposta de Sucesso:**
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
    }
  }
}
```

**Resposta de Erro (Validação):**
```json
{
  "success": false,
  "message": "Campo \"reason\" é obrigatório"
}
```

### **3. PATCH /:addendumId/status**
**Descrição:** Atualiza o status de um adendo (aprovar ou rejeitar)

**Autenticação:** ✅ Obrigatória
**Autorização:** `orders`
**Validação:** Campo `status` obrigatório e válido

**Parâmetros:**
- `addendumId`: ID do adendo

**Body:**
```json
{
  "status": "approved"
}
```

**Validações:**
- ✅ `status` é obrigatório
- ✅ `status` deve ser "approved" ou "rejected"
- ✅ Adendo deve estar com status "pending"

**Resposta de Sucesso:**
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
    "approvedBy": {
      "_id": "64a1b2c3d4e5f6789012348",
      "name": "Maria Santos",
      "email": "maria@empresa.com"
    },
    "approvedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Resposta de Erro (Validação):**
```json
{
  "success": false,
  "message": "Campo \"status\" é obrigatório e deve ser \"approved\" ou \"rejected\""
}
```

## **Middlewares Implementados**

### **1. validateCreateAddendum**
```javascript
const validateCreateAddendum = (req, res, next) => {
  const { reason } = req.body;
  
  if (!reason || reason.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Campo "reason" é obrigatório'
    });
  }
  
  next();
};
```

**Funcionalidade:**
- ✅ Valida se `reason` está presente
- ✅ Valida se `reason` não está vazio (após trim)
- ✅ Retorna erro 400 com mensagem específica

### **2. validateStatusUpdate**
```javascript
const validateStatusUpdate = (req, res, next) => {
  const { status } = req.body;
  
  if (!status || !['approved', 'rejected'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Campo "status" é obrigatório e deve ser "approved" ou "rejected"'
    });
  }
  
  next();
};
```

**Funcionalidade:**
- ✅ Valida se `status` está presente
- ✅ Valida se `status` é "approved" ou "rejected"
- ✅ Retorna erro 400 com mensagem específica

## **Autenticação e Autorização**

### **Autenticação Obrigatória**
```javascript
router.use(authenticate);
```
- ✅ Todas as rotas requerem token JWT válido
- ✅ Usuário deve estar autenticado

### **Autorização por Rota**
```javascript
// Todas as rotas requerem autorização 'orders'
router.get('/order/:orderId', authorize('orders'), ...);
router.post('/order/:orderId', authorize('orders'), ...);
router.patch('/:addendumId/status', authorize('orders'), ...);
```

**Permissões Necessárias:**
- ✅ `orders`: Acesso básico a pedidos
- ✅ Usuário deve ter permissão para gerenciar pedidos

## **Estrutura do Arquivo**

```javascript
const express = require('express');
const router = express.Router();
const orderAddendumController = require('../controllers/orderAddendumController');
const { authenticate, authorize } = require('../middleware/auth');

// Middlewares de validação
const validateCreateAddendum = (req, res, next) => { ... };
const validateStatusUpdate = (req, res, next) => { ... };

// Autenticação obrigatória
router.use(authenticate);

// Rotas com autorização e validação
router.get('/order/:orderId', authorize('orders'), ...);
router.post('/order/:orderId', authorize('orders'), validateCreateAddendum, ...);
router.patch('/:addendumId/status', authorize('orders'), validateStatusUpdate, ...);

module.exports = router;
```

## **Exemplos de Uso**

### **1. Buscar Adendos de um Pedido**
```javascript
const response = await fetch('/api/order-addendums/order/64a1b2c3d4e5f6789012346', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + token
  }
});
```

### **2. Criar Novo Adendo**
```javascript
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
```

### **3. Aprovar Adendo**
```javascript
const response = await fetch('/api/order-addendums/64a1b2c3d4e5f6789012345/status', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    status: 'approved'
  })
});
```

## **Tratamento de Erros**

### **Erros de Validação (400)**
- Campo `reason` obrigatório
- Campo `status` obrigatório e válido

### **Erros de Autenticação (401)**
- Token JWT inválido ou ausente
- Usuário não autenticado

### **Erros de Autorização (403)**
- Usuário sem permissão 'orders'
- Acesso negado à funcionalidade

### **Erros de Recurso (404)**
- Pedido não encontrado
- Adendo não encontrado

### **Erros de Servidor (500)**
- Erro interno do servidor
- Falha na conexão com banco de dados

## **Status da Implementação**
✅ **COMPLETA** - Todas as rotas implementadas com validações e autorizações
