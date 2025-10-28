# Exemplos Práticos - Fluxo de Alteração de Pedidos

## **Cenário 1: Adendo Simples - Item Removido**

### **Estado Inicial**
```typescript
// Pedido Original
const order = {
    id: 'ORD-001',
    clientName: 'João Silva',
    items: [
        { id: 'item-1', description: 'Bancada 1', quantity: 1, unitPrice: 500.00, totalPrice: 500.00 },
        { id: 'item-2', description: 'Bancada 2', quantity: 1, unitPrice: 600.00, totalPrice: 600.00 },
        { id: 'item-3', description: 'Bancada 3', quantity: 1, unitPrice: 700.00, totalPrice: 700.00 }
    ],
    total: 1800.00
};

// OS Existente
const existingOS = {
    id: 'OS-001',
    orderId: 'ORD-001',
    status: 'pending',
    items: [
        { id: 'item-1', description: 'Bancada 1', quantity: 1, unitPrice: 500.00, totalPrice: 500.00 }
    ],
    total: 500.00
};
```

### **Adendo Criado**
```typescript
const addendum = {
    orderId: 'ORD-001',
    addendumNumber: 1,
    reason: 'Cliente cancelou bancada 1',
    status: 'pending',
    removedItemIds: ['item-1'],
    addedItems: [],
    changedItems: [],
    priceAdjustment: 0
};
```

### **Processo de Aprovação**
1. **Análise de Impacto:**
   - OS-001 contém item-1 que será removido
   - Status da OS: 'pending' (pode ser atualizada automaticamente)

2. **Ação Automática:**
   - Remove item-1 da OS-001
   - OS-001 fica vazia (sem itens)
   - Sistema sugere cancelar OS vazia

3. **Resultado Final:**
   - OS-001 cancelada (sem itens)
   - Itens disponíveis para nova OS: [item-2, item-3]
   - Total do pedido: R$ 1.300,00

---

## **Cenário 2: Adendo Complexo - Múltiplas Alterações**

### **Estado Inicial**
```typescript
// Pedido Original
const order = {
    id: 'ORD-002',
    clientName: 'Maria Santos',
    items: [
        { id: 'item-1', description: 'Bancada Simples', quantity: 1, unitPrice: 500.00, totalPrice: 500.00 },
        { id: 'item-2', description: 'Bancada Dupla', quantity: 1, unitPrice: 800.00, totalPrice: 800.00 },
        { id: 'item-3', description: 'Pia de Cozinha', quantity: 1, unitPrice: 1200.00, totalPrice: 1200.00 }
    ],
    total: 2500.00
};

// OSs Existentes
const os1 = {
    id: 'OS-001',
    orderId: 'ORD-002',
    status: 'scheduled',
    items: [
        { id: 'item-1', description: 'Bancada Simples', quantity: 1, unitPrice: 500.00, totalPrice: 500.00 }
    ],
    total: 500.00
};

const os2 = {
    id: 'OS-002',
    orderId: 'ORD-002',
    status: 'in_progress',
    items: [
        { id: 'item-2', description: 'Bancada Dupla', quantity: 1, unitPrice: 800.00, totalPrice: 800.00 }
    ],
    total: 800.00
};
```

### **Adendo Criado**
```typescript
const addendum = {
    orderId: 'ORD-002',
    addendumNumber: 1,
    reason: 'Cliente alterou especificações e adicionou item extra',
    status: 'pending',
    removedItemIds: ['item-1'], // Remove bancada simples
    addedItems: [
        { id: 'item-4', description: 'Bancada Premium', quantity: 1, unitPrice: 1000.00, totalPrice: 1000.00 }
    ],
    changedItems: [
        {
            originalItemId: 'item-2',
            updatedItem: { 
                id: 'item-2-updated', 
                description: 'Bancada Dupla Premium', 
                quantity: 1, 
                unitPrice: 900.00, 
                totalPrice: 900.00 
            }
        }
    ],
    priceAdjustment: 200.00 // Ajuste adicional
};
```

### **Processo de Aprovação**
1. **Análise de Impacto:**
   - OS-001: contém item-1 (será removido), status 'scheduled' → pode atualizar automaticamente
   - OS-002: contém item-2 (será modificado), status 'in_progress' → requer intervenção manual

2. **Ações Automáticas:**
   - OS-001: remove item-1, fica vazia → cancelada
   - OS-002: não pode ser atualizada automaticamente

3. **Notificação Manual:**
   - Equipe de produção notificada sobre OS-002
   - Recomendação: cancelar OS-002 e criar nova com item-2-updated

4. **Resultado Final:**
   - OS-001: cancelada
   - OS-002: requer intervenção manual
   - Itens disponíveis para nova OS: [item-3, item-4]
   - Total do pedido: R$ 2.700,00

---

## **Cenário 3: Múltiplos Adendos**

### **Estado Inicial**
```typescript
const order = {
    id: 'ORD-003',
    clientName: 'Pedro Costa',
    items: [
        { id: 'item-1', description: 'Mesa', quantity: 1, unitPrice: 300.00, totalPrice: 300.00 },
        { id: 'item-2', description: 'Cadeira', quantity: 4, unitPrice: 150.00, totalPrice: 600.00 }
    ],
    total: 900.00
};
```

### **Adendo 1 (Aprovado)**
```typescript
const addendum1 = {
    orderId: 'ORD-003',
    addendumNumber: 1,
    reason: 'Adicionar mais cadeiras',
    status: 'approved',
    removedItemIds: [],
    addedItems: [
        { id: 'item-3', description: 'Cadeira Extra', quantity: 2, unitPrice: 150.00, totalPrice: 300.00 }
    ],
    changedItems: [],
    priceAdjustment: 0
};
```

### **Adendo 2 (Pendente)**
```typescript
const addendum2 = {
    orderId: 'ORD-003',
    addendumNumber: 2,
    reason: 'Alterar material da mesa',
    status: 'pending',
    removedItemIds: [],
    addedItems: [],
    changedItems: [
        {
            originalItemId: 'item-1',
            updatedItem: { 
                id: 'item-1-updated', 
                description: 'Mesa Premium', 
                quantity: 1, 
                unitPrice: 400.00, 
                totalPrice: 400.00 
            }
        }
    ],
    priceAdjustment: 0
};
```

### **Estado Após Adendo 1**
- Itens disponíveis: [item-1, item-2, item-3]
- Total do pedido: R$ 1.200,00

### **Processo de Aprovação do Adendo 2**
1. **Análise de Impacto:**
   - Nenhuma OS existente (todas foram criadas após adendo 1)
   - Aprovação simples, sem conflitos

2. **Resultado Final:**
   - Itens disponíveis: [item-1-updated, item-2, item-3]
   - Total do pedido: R$ 1.300,00

---

## **Cenário 4: Conflito Complexo - OS em Produção**

### **Estado Inicial**
```typescript
const order = {
    id: 'ORD-004',
    clientName: 'Ana Oliveira',
    items: [
        { id: 'item-1', description: 'Bancada 1', quantity: 1, unitPrice: 500.00, totalPrice: 500.00 },
        { id: 'item-2', description: 'Bancada 2', quantity: 1, unitPrice: 600.00, totalPrice: 600.00 }
    ],
    total: 1100.00
};

const os = {
    id: 'OS-001',
    orderId: 'ORD-004',
    status: 'in_progress',
    items: [
        { id: 'item-1', description: 'Bancada 1', quantity: 1, unitPrice: 500.00, totalPrice: 500.00 },
        { id: 'item-2', description: 'Bancada 2', quantity: 1, unitPrice: 600.00, totalPrice: 600.00 }
    ],
    total: 1100.00
};
```

### **Adendo Criado**
```typescript
const addendum = {
    orderId: 'ORD-004',
    addendumNumber: 1,
    reason: 'Cliente alterou especificações de ambas as bancadas',
    status: 'pending',
    removedItemIds: [],
    addedItems: [
        { id: 'item-3', description: 'Bancada 3', quantity: 1, unitPrice: 700.00, totalPrice: 700.00 }
    ],
    changedItems: [
        {
            originalItemId: 'item-1',
            updatedItem: { 
                id: 'item-1-updated', 
                description: 'Bancada 1 Premium', 
                quantity: 1, 
                unitPrice: 600.00, 
                totalPrice: 600.00 
            }
        },
        {
            originalItemId: 'item-2',
            updatedItem: { 
                id: 'item-2-updated', 
                description: 'Bancada 2 Premium', 
                quantity: 1, 
                unitPrice: 800.00, 
                totalPrice: 800.00 
            }
        }
    ],
    priceAdjustment: 0
};
```

### **Processo de Aprovação**
1. **Análise de Impacto:**
   - OS-001: contém item-1 e item-2 (ambos serão modificados)
   - Status: 'in_progress' → requer intervenção manual

2. **Notificação para Equipe de Produção:**
   ```json
   {
     "type": "addendum_conflict",
     "addendumId": "addendum-001",
     "orderId": "ORD-004",
     "reason": "Cliente alterou especificações de ambas as bancadas",
     "impactedOSs": [
       {
         "id": "OS-001",
         "status": "in_progress",
         "items": [
           { "id": "item-1", "description": "Bancada 1", "totalPrice": 500.00 },
           { "id": "item-2", "description": "Bancada 2", "totalPrice": 600.00 }
         ]
       }
     ],
     "actionRequired": "manual_review"
   }
   ```

3. **Opções para Equipe de Produção:**
   - **Opção A:** Cancelar OS-001 e criar nova com itens atualizados
   - **Opção B:** Ajustar OS-001 manualmente para refletir alterações
   - **Opção C:** Manter OS-001 como está e criar OS adicional

4. **Decisão da Equipe:**
   - Escolhe Opção A: cancelar e recriar
   - OS-001 cancelada
   - Nova OS criada com: [item-1-updated, item-2-updated, item-3]
   - Total: R$ 2.100,00

---

## **Cenário 5: Adendo com Ajuste de Preço**

### **Estado Inicial**
```typescript
const order = {
    id: 'ORD-005',
    clientName: 'Carlos Mendes',
    items: [
        { id: 'item-1', description: 'Bancada', quantity: 1, unitPrice: 1000.00, totalPrice: 1000.00 }
    ],
    total: 1000.00
};
```

### **Adendo Criado**
```typescript
const addendum = {
    orderId: 'ORD-005',
    addendumNumber: 1,
    reason: 'Desconto por pagamento à vista',
    status: 'pending',
    removedItemIds: [],
    addedItems: [],
    changedItems: [],
    priceAdjustment: -100.00 // Desconto de R$ 100,00
};
```

### **Processo de Aprovação**
1. **Análise de Impacto:**
   - Nenhuma OS existente
   - Apenas ajuste de preço

2. **Resultado Final:**
   - Itens disponíveis: [item-1]
   - Total do pedido: R$ 900,00 (R$ 1.000,00 - R$ 100,00)

---

## **Resumo dos Cenários**

| Cenário | Complexidade | Ação Automática | Intervenção Manual | Resultado |
|---------|-------------|-----------------|-------------------|----------|
| 1 - Item Removido | Simples | ✅ Sim | ❌ Não | OS cancelada |
| 2 - Múltiplas Alterações | Média | ⚠️ Parcial | ✅ Sim | OS-001 cancelada, OS-002 manual |
| 3 - Múltiplos Adendos | Baixa | ✅ Sim | ❌ Não | Aprovação sequencial |
| 4 - OS em Produção | Alta | ❌ Não | ✅ Sim | Intervenção manual obrigatória |
| 5 - Ajuste de Preço | Simples | ✅ Sim | ❌ Não | Apenas ajuste de total |

## **Lições Aprendidas**

### **✅ Boas Práticas**
- Sempre analisar impacto antes de aprovar adendos
- Notificar equipe de produção sobre conflitos
- Documentar decisões tomadas
- Manter comunicação com cliente

### **⚠️ Pontos de Atenção**
- OSs em produção requerem cuidado especial
- Múltiplos adendos podem criar complexidade
- Alterações tardias podem impactar cronograma
- Custos podem ser afetados por alterações

### **🚨 Situações Críticas**
- OSs com itens já em produção
- Alterações que afetam materiais já adquiridos
- Mudanças que impactam cronograma de entrega
- Alterações que afetam preços já acordados
