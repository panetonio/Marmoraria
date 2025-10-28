# OrderAddendum Types Documentation

## **Visão Geral**
Este documento descreve as modificações implementadas no arquivo `types.ts` para suportar o sistema de adendos de pedidos, incluindo novos tipos e interfaces TypeScript.

## **Modificações Implementadas**

### **1. Novo Tipo: OrderAddendumStatus**

**Definição:**
```typescript
export type OrderAddendumStatus = 'pending' | 'approved' | 'rejected';
```

**Funcionalidade:**
- ✅ Define os possíveis status de um adendo
- ✅ `pending`: Adendo criado, aguardando aprovação
- ✅ `approved`: Adendo aprovado e aplicado ao pedido
- ✅ `rejected`: Adendo rejeitado

### **2. Nova Interface: OrderAddendum**

**Definição:**
```typescript
export interface OrderAddendum {
  id: string;
  orderId: string;
  addendumNumber: number;
  reason: string;
  status: OrderAddendumStatus;
  addedItems: QuoteItem[];
  removedItemIds: string[];
  changedItems: Array<{ originalItemId: string; updatedItem: QuoteItem }>;
  priceAdjustment: number;
  approvedBy?: string;
  approvedAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
```

**Campos Detalhados:**

#### **Campos Obrigatórios:**
- **`id`**: Identificador único do adendo
- **`orderId`**: ID do pedido ao qual o adendo se refere
- **`addendumNumber`**: Número sequencial do adendo (1, 2, 3...)
- **`reason`**: Motivo da alteração
- **`status`**: Status atual do adendo
- **`addedItems`**: Array de novos itens adicionados
- **`removedItemIds`**: Array de IDs dos itens removidos
- **`changedItems`**: Array de itens modificados
- **`priceAdjustment`**: Ajuste de preço (positivo ou negativo)
- **`createdBy`**: ID do usuário que criou o adendo
- **`createdAt`**: Data de criação
- **`updatedAt`**: Data da última atualização

#### **Campos Opcionais:**
- **`approvedBy?`**: ID do usuário que aprovou o adendo
- **`approvedAt?`**: Data de aprovação

### **3. Modificação na Interface Order**

**Antes:**
```typescript
export interface Order {
  id: string; // PED-
  originalQuoteId: string; // ORC-
  clientName: string;
  clientCpf?: string;
  deliveryAddress: Address;
  items: QuoteItem[];
  subtotal: number;
  discount?: number;
  freight?: number;
  paymentMethod?: PaymentMethod;
  installments?: number;
  total: number;
  approvalDate: string;
  serviceOrderIds: string[];
  salespersonId?: string;
}
```

**Depois:**
```typescript
export interface Order {
  id: string; // PED-
  originalQuoteId: string; // ORC-
  clientName: string;
  clientCpf?: string;
  deliveryAddress: Address;
  items: QuoteItem[];
  subtotal: number;
  discount?: number;
  freight?: number;
  paymentMethod?: PaymentMethod;
  installments?: number;
  total: number;
  approvalDate: string;
  serviceOrderIds: string[];
  salespersonId?: string;
  addendums?: OrderAddendum[]; // ✅ NOVO CAMPO
}
```

## **Estrutura de Dados**

### **Exemplo de OrderAddendum:**
```typescript
const addendum: OrderAddendum = {
  id: "ADD-2024-001",
  orderId: "PED-2024-001",
  addendumNumber: 1,
  reason: "Cliente solicitou adição de item",
  status: "approved",
  addedItems: [
    {
      id: "item-123",
      type: "material",
      description: "Mármore Carrara - 2m²",
      quantity: 1,
      unitPrice: 500,
      totalPrice: 500
    }
  ],
  removedItemIds: ["item-456"],
  changedItems: [
    {
      originalItemId: "item-789",
      updatedItem: {
        id: "item-789",
        type: "material",
        description: "Mármore Carrara - 3m²",
        quantity: 1,
        unitPrice: 600,
        totalPrice: 600
      }
    }
  ],
  priceAdjustment: 200,
  approvedBy: "user-123",
  approvedAt: "2024-01-15T10:30:00.000Z",
  createdBy: "user-456",
  createdAt: "2024-01-15T09:00:00.000Z",
  updatedAt: "2024-01-15T10:30:00.000Z"
};
```

### **Exemplo de Order com Adendos:**
```typescript
const order: Order = {
  id: "PED-2024-001",
  originalQuoteId: "ORC-2024-001",
  clientName: "João Silva",
  deliveryAddress: { /* endereço */ },
  items: [/* itens originais */],
  subtotal: 5000,
  total: 5000,
  approvalDate: "2024-01-10T00:00:00.000Z",
  serviceOrderIds: [],
  addendums: [
    {
      id: "ADD-2024-001",
      orderId: "PED-2024-001",
      addendumNumber: 1,
      reason: "Cliente solicitou adição de item",
      status: "approved",
      addedItems: [/* novos itens */],
      removedItemIds: [],
      changedItems: [],
      priceAdjustment: 500,
      approvedBy: "user-123",
      approvedAt: "2024-01-15T10:30:00.000Z",
      createdBy: "user-456",
      createdAt: "2024-01-15T09:00:00.000Z",
      updatedAt: "2024-01-15T10:30:00.000Z"
    }
  ]
};
```

## **Benefícios da Implementação**

### **1. Type Safety**
- ✅ TypeScript garante que os campos estejam corretos
- ✅ Autocompletar em IDEs
- ✅ Detecção de erros em tempo de compilação

### **2. Consistência de Dados**
- ✅ Estrutura padronizada para adendos
- ✅ Compatibilidade com o modelo Mongoose
- ✅ Campos opcionais claramente definidos

### **3. Integração com Frontend**
- ✅ Interfaces prontas para uso em componentes React
- ✅ Validação de tipos em formulários
- ✅ Estrutura de dados consistente

### **4. Documentação Automática**
- ✅ Tipos servem como documentação
- ✅ Estrutura de dados autoexplicativa
- ✅ Facilita manutenção do código

## **Casos de Uso**

### **1. Criação de Adendo**
```typescript
const newAddendum: Omit<OrderAddendum, 'id' | 'createdAt' | 'updatedAt'> = {
  orderId: "PED-2024-001",
  addendumNumber: 1,
  reason: "Cliente solicitou adição de item",
  status: "pending",
  addedItems: [/* novos itens */],
  removedItemIds: [],
  changedItems: [],
  priceAdjustment: 500,
  createdBy: "user-456"
};
```

### **2. Atualização de Status**
```typescript
const updateAddendumStatus = (addendum: OrderAddendum, status: OrderAddendumStatus) => {
  return {
    ...addendum,
    status,
    approvedBy: status === 'approved' ? 'user-123' : undefined,
    approvedAt: status === 'approved' ? new Date().toISOString() : undefined,
    updatedAt: new Date().toISOString()
  };
};
```

### **3. Filtragem de Adendos**
```typescript
const getApprovedAddendums = (order: Order): OrderAddendum[] => {
  return order.addendums?.filter(addendum => addendum.status === 'approved') || [];
};
```

## **Compatibilidade**

### **1. Com Modelo Mongoose**
- ✅ Campos correspondem exatamente ao schema
- ✅ Tipos TypeScript alinhados com tipos Mongoose
- ✅ Serialização JSON consistente

### **2. Com APIs REST**
- ✅ Estrutura de dados compatível com respostas da API
- ✅ Campos opcionais tratados corretamente
- ✅ Timestamps em formato ISO

### **3. Com Frontend**
- ✅ Interfaces prontas para uso em componentes
- ✅ Validação de tipos em formulários
- ✅ Estrutura de dados consistente

## **Status da Implementação**
✅ **COMPLETA** - Todos os tipos e interfaces implementados
✅ **TESTADA** - Sem erros de lint
✅ **DOCUMENTADA** - Funcionalidade completamente documentada
✅ **COMPATÍVEL** - Alinhado com modelo Mongoose e APIs REST
