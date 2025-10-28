# OrderAddendum Button Implementation Documentation

## **Visão Geral**
Este documento descreve as modificações implementadas no arquivo `pages/OrdersPage.tsx` para adicionar o botão "Criar Adendo" na tabela de pedidos, incluindo validações de status e integração com o sistema de adendos.

## **Modificações Implementadas**

### **1. Adição do Status 'cancelled' ao OrderStatus**
```typescript
type OrderStatus = 'approved' | 'in_production' | 'in_logistics' | 'completed' | 'cancelled';
```
- ✅ Adicionado `'cancelled'` ao tipo `OrderStatus`
- ✅ Permite identificar pedidos cancelados
- ✅ Suporte para status de cancelamento

### **2. Atualização do orderStatusMap**
```typescript
const orderStatusMap: StatusMap<OrderStatus> = {
    approved: { label: 'Aguardando Produção', variant: 'default' },
    in_production: { label: 'Em Produção', variant: 'warning' },
    in_logistics: { label: 'Em Logística', variant: 'primary' },
    completed: { label: 'Concluído', variant: 'success' },
    cancelled: { label: 'Cancelado', variant: 'error' },  // NOVO
};
```
- ✅ Adicionado mapeamento para status 'cancelled'
- ✅ Label: "Cancelado"
- ✅ Variant: 'error' (vermelho para indicar cancelamento)

### **3. Função handleOpenAddendumModal**
```typescript
const handleOpenAddendumModal = (order: Order) => {
    // TODO: Implementar modal de criação de adendo
    console.log('Abrir modal de adendo para pedido:', order.id);
    // Por enquanto, apenas log. Será implementado posteriormente
};
```
- ✅ Função criada para abrir modal de adendo
- ✅ Recebe `order: Order` como parâmetro
- ✅ Log temporário para debug
- ✅ TODO para implementação futura do modal

### **4. Botão "Criar Adendo" na Tabela**
```typescript
{order.status !== 'completed' && order.status !== 'cancelled' && (
    <Button size="sm" variant="outline" onClick={() => handleOpenAddendumModal(order)}>
        Criar Adendo
    </Button>
)}
```

#### **Características do Botão:**
- ✅ **Tamanho:** `sm` (pequeno)
- ✅ **Variante:** `outline` (borda)
- ✅ **Posição:** Ao lado de "Ver Detalhes" e "Gerar OS"
- ✅ **Ação:** Chama `handleOpenAddendumModal(order)`

#### **Condições de Visibilidade:**
- ✅ **Visível apenas quando:** `order.status !== 'completed'`
- ✅ **Visível apenas quando:** `order.status !== 'cancelled'`
- ✅ **Oculto para pedidos:** Concluídos ou cancelados
- ✅ **Visível para pedidos:** Aprovados, em produção, em logística

## **Lógica de Validação**

### **Status que Permitem Criação de Adendo:**
1. **`'approved'`** - Aguardando Produção
2. **`'in_production'`** - Em Produção  
3. **`'in_logistics'`** - Em Logística

### **Status que Impedem Criação de Adendo:**
1. **`'completed'`** - Concluído
2. **`'cancelled'`** - Cancelado

### **Justificativa da Validação:**
- **Pedidos Concluídos:** Não faz sentido criar adendos em pedidos já finalizados
- **Pedidos Cancelados:** Não faz sentido criar adendos em pedidos cancelados
- **Pedidos Ativos:** Adendos são úteis para modificar pedidos em andamento

## **Estrutura da Tabela Atualizada**

### **Coluna de Ações:**
```typescript
<td className="p-3 text-center space-x-2" onClick={(e) => e.stopPropagation()}>
    {/* Botão Ver Detalhes - sempre visível */}
    <Button size="sm" variant="ghost" onClick={() => setViewingOrder(order)}>
        Ver Detalhes
    </Button>
    
    {/* Botão Gerar OS - condicional */}
    {hasUnassignedItems ? (
        <Button size="sm" variant="secondary" onClick={() => handleOpenOsModal(order)}>
            Gerar OS
        </Button>
    ) : (
        <span className="text-xs text-green-600 dark:text-green-400 font-semibold inline-flex items-center px-2">
            {/* Ícone de check */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Completo
        </span>
    )}
    
    {/* Botão Criar Adendo - condicional */}
    {order.status !== 'completed' && order.status !== 'cancelled' && (
        <Button size="sm" variant="outline" onClick={() => handleOpenAddendumModal(order)}>
            Criar Adendo
        </Button>
    )}
</td>
```

## **Fluxo de Interação**

### **1. Usuário Clica em "Criar Adendo"**
```typescript
onClick={() => handleOpenAddendumModal(order)}
```

### **2. Função handleOpenAddendumModal é Executada**
```typescript
const handleOpenAddendumModal = (order: Order) => {
    // TODO: Implementar modal de criação de adendo
    console.log('Abrir modal de adendo para pedido:', order.id);
    // Por enquanto, apenas log. Será implementado posteriormente
};
```

### **3. Log Temporário para Debug**
- ✅ Console.log com ID do pedido
- ✅ Preparação para implementação futura
- ✅ Estrutura pronta para modal

## **Próximos Passos (TODO)**

### **1. Implementar Modal de Criação de Adendo**
- Criar componente `CreateAddendumModal`
- Integrar com `DataContext` (função `createOrderAddendum`)
- Formulário para dados do adendo

### **2. Validações do Modal**
- Campos obrigatórios (reason, etc.)
- Validação de dados
- Tratamento de erros

### **3. Integração com Backend**
- Chamada para API de criação de adendo
- Atualização do estado local
- Feedback de sucesso/erro

## **Exemplos de Uso**

### **1. Pedido Aprovado (Botão Visível)**
```typescript
const order = {
    id: 'ORD-001',
    status: 'approved',  // ✅ Permite criação de adendo
    // ... outros campos
};

// Botão "Criar Adendo" será visível
```

### **2. Pedido Concluído (Botão Oculto)**
```typescript
const order = {
    id: 'ORD-002',
    status: 'completed',  // ❌ Impede criação de adendo
    // ... outros campos
};

// Botão "Criar Adendo" será oculto
```

### **3. Pedido Cancelado (Botão Oculto)**
```typescript
const order = {
    id: 'ORD-003',
    status: 'cancelled',  // ❌ Impede criação de adendo
    // ... outros campos
};

// Botão "Criar Adendo" será oculto
```

## **Status da Implementação**
✅ **COMPLETA** - Botão implementado com validações
✅ **TESTADA** - Sem erros de lint
✅ **DOCUMENTADA** - Funcionalidade completamente documentada
✅ **VALIDADA** - Condições de visibilidade implementadas
✅ **PREPARADA** - Estrutura pronta para modal futuro

## **Benefícios da Implementação**
1. **🎯 UX Intuitiva:** Botão visível apenas quando relevante
2. **🔒 Validação Robusta:** Impede ações em pedidos inadequados
3. **📱 Interface Limpa:** Botão bem posicionado na tabela
4. **🔧 Extensível:** Estrutura pronta para modal futuro
5. **📊 Status Claro:** Suporte para pedidos cancelados
