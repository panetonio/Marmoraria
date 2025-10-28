# OrderAddendum Model Documentation

## **Visão Geral**
O modelo `OrderAddendum` representa adendos (alterações) em pedidos existentes. Permite adicionar, remover ou modificar itens de um pedido após sua criação inicial.

## **Schema Fields**

### **Campos Obrigatórios**
- **`orderId`**: ObjectId referenciando o pedido original
- **`addendumNumber`**: Número sequencial do adendo (1, 2, 3...)
- **`reason`**: Motivo da alteração
- **`createdBy`**: Usuário que criou o adendo

### **Campos de Status**
- **`status`**: Status do adendo (`pending`, `approved`, `rejected`)
- **`approvedBy`**: Usuário que aprovou o adendo
- **`approvedAt`**: Data de aprovação

### **Campos de Alterações**
- **`addedItems`**: Array de novos itens adicionados
- **`removedItemIds`**: Array de IDs dos itens removidos
- **`changedItems`**: Array de itens modificados com:
  - `originalItemId`: ID do item original
  - `updatedItem`: Versão atualizada do item
- **`priceAdjustment`**: Ajuste de preço (positivo ou negativo)

## **Índices Criados**

1. **`orderId`**: Índice simples para consultas por pedido
2. **`status`**: Índice simples para consultas por status
3. **`orderId + addendumNumber`**: Índice composto único para garantir unicidade
4. **`status + createdAt`**: Índice composto para consultas ordenadas

## **Exemplo de Uso**

```javascript
// Criar um adendo
const addendum = new OrderAddendum({
  orderId: '64a1b2c3d4e5f6789012345',
  addendumNumber: 1,
  reason: 'Cliente solicitou adição de item',
  status: 'pending',
  addedItems: [{
    type: 'material',
    description: 'Mármore Carrara - 2m²',
    quantity: 1,
    unitPrice: 500,
    totalPrice: 500
  }],
  removedItemIds: ['item-123'],
  priceAdjustment: 200,
  createdBy: '64a1b2c3d4e5f6789012346'
});

await addendum.save();
```

## **Consultas Comuns**

```javascript
// Buscar adendos de um pedido
const addendums = await OrderAddendum.find({ orderId: orderId });

// Buscar adendos pendentes
const pendingAddendums = await OrderAddendum.find({ status: 'pending' });

// Buscar adendos por usuário
const userAddendums = await OrderAddendum.find({ createdBy: userId });
```

## **Validações**

- **Unicidade**: `orderId + addendumNumber` deve ser único
- **Status**: Apenas valores `pending`, `approved`, `rejected`
- **Referências**: `orderId` e `createdBy` devem referenciar documentos existentes
- **Timestamps**: Automáticos com `createdAt` e `updatedAt`

## **Relacionamentos**

- **Order**: Um pedido pode ter múltiplos adendos
- **User**: Usuário criador e aprovador (opcional)
- **ServiceOrder**: Adendos podem afetar ordens de serviço derivadas
