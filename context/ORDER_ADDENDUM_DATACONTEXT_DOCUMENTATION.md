# OrderAddendum DataContext Documentation

## **Visão Geral**
Este documento descreve as modificações implementadas no arquivo `context/DataContext.tsx` para suportar o sistema de adendos de pedidos, incluindo estado global e funções de gerenciamento.

## **Modificações Implementadas**

### **1. Import do Tipo OrderAddendum**
```typescript
import type {
    // ... outros tipos ...
    OrderAddendum
} from '../types';
```
- ✅ Adicionado `OrderAddendum` aos imports de tipos
- ✅ Permite uso do tipo em toda a interface e implementação

### **2. Estado Global para Adendos**
```typescript
const [orderAddendums, setOrderAddendums] = useState<OrderAddendum[]>([]);
```
- ✅ Estado inicializado como array vazio
- ✅ Gerenciamento de estado local para adendos
- ✅ Não carrega todos os adendos globalmente (carregamento sob demanda)

### **3. Interface DataContextType Atualizada**

#### **Campos de Estado:**
```typescript
orderAddendums: OrderAddendum[];
setOrderAddendums: React.Dispatch<React.SetStateAction<OrderAddendum[]>>;
```

#### **Funções de Gerenciamento:**
```typescript
// Order addendum management functions
loadOrderAddendums: (orderId: string) => Promise<void>;
createOrderAddendum: (orderId: string, addendumData: any) => Promise<{ success: boolean; message?: string; data?: OrderAddendum }>;
updateOrderAddendumStatus: (addendumId: string, status: 'approved' | 'rejected') => Promise<{ success: boolean; message?: string; data?: OrderAddendum }>;
```

## **Funções Implementadas**

### **1. loadOrderAddendums(orderId: string)**
```typescript
const loadOrderAddendums = async (orderId: string) => {
    try {
        const result = await api.getOrderAddendums(orderId);
        if (result.success) {
            // Mapear dados do backend para o formato do frontend
            const mappedAddendums: OrderAddendum[] = result.data.map((addendum: any) => ({
                id: addendum._id || addendum.id,
                orderId: addendum.orderId,
                addendumNumber: addendum.addendumNumber,
                reason: addendum.reason,
                status: addendum.status,
                addedItems: addendum.addedItems || [],
                removedItemIds: addendum.removedItemIds || [],
                changedItems: addendum.changedItems || [],
                priceAdjustment: addendum.priceAdjustment || 0,
                approvedBy: addendum.approvedBy?._id || addendum.approvedBy,
                approvedAt: addendum.approvedAt,
                createdBy: addendum.createdBy?._id || addendum.createdBy,
                createdAt: addendum.createdAt,
                updatedAt: addendum.updatedAt
            }));
            setOrderAddendums(mappedAddendums);
        }
    } catch (error) {
        console.error('Erro ao carregar adendos do pedido:', error);
    }
};
```

**Funcionalidade:**
- ✅ Carrega adendos de um pedido específico
- ✅ Mapeia dados do backend para formato do frontend
- ✅ Atualiza estado local com os adendos carregados
- ✅ Tratamento de erros com logs

### **2. createOrderAddendum(orderId: string, addendumData: any)**
```typescript
const createOrderAddendum = async (orderId: string, addendumData: any) => {
    try {
        const result = await api.createOrderAddendum(orderId, addendumData);
        if (result.success && result.data) {
            // Mapear dados do backend para o formato do frontend
            const mappedAddendum: OrderAddendum = {
                id: result.data._id || result.data.id,
                orderId: result.data.orderId,
                addendumNumber: result.data.addendumNumber,
                reason: result.data.reason,
                status: result.data.status,
                addedItems: result.data.addedItems || [],
                removedItemIds: result.data.removedItemIds || [],
                changedItems: result.data.changedItems || [],
                priceAdjustment: result.data.priceAdjustment || 0,
                approvedBy: result.data.approvedBy?._id || result.data.approvedBy,
                approvedAt: result.data.approvedAt,
                createdBy: result.data.createdBy?._id || result.data.createdBy,
                createdAt: result.data.createdAt,
                updatedAt: result.data.updatedAt
            };
            
            // Adicionar o novo adendo ao estado local
            setOrderAddendums(prev => [...prev, mappedAddendum]);
            
            return { success: true, message: result.message, data: mappedAddendum };
        }
        return { success: false, message: result.message || 'Erro ao criar adendo' };
    } catch (error) {
        console.error('Erro ao criar adendo:', error);
        return { success: false, message: 'Erro inesperado ao criar adendo' };
    }
};
```

**Funcionalidade:**
- ✅ Cria novo adendo via API
- ✅ Mapeia dados do backend para formato do frontend
- ✅ Adiciona adendo ao estado local
- ✅ Retorna resultado com sucesso/erro
- ✅ Tratamento de erros robusto

### **3. updateOrderAddendumStatus(addendumId: string, status: 'approved' | 'rejected')**
```typescript
const updateOrderAddendumStatus = async (addendumId: string, status: 'approved' | 'rejected') => {
    try {
        const result = await api.updateOrderAddendumStatus(addendumId, status);
        if (result.success && result.data) {
            // Mapear dados do backend para o formato do frontend
            const mappedAddendum: OrderAddendum = {
                id: result.data._id || result.data.id,
                orderId: result.data.orderId,
                addendumNumber: result.data.addendumNumber,
                reason: result.data.reason,
                status: result.data.status,
                addedItems: result.data.addedItems || [],
                removedItemIds: result.data.removedItemIds || [],
                changedItems: result.data.changedItems || [],
                priceAdjustment: result.data.priceAdjustment || 0,
                approvedBy: result.data.approvedBy?._id || result.data.approvedBy,
                approvedAt: result.data.approvedAt,
                createdBy: result.data.createdBy?._id || result.data.createdBy,
                createdAt: result.data.createdAt,
                updatedAt: result.data.updatedAt
            };
            
            // Atualizar o adendo no estado local
            setOrderAddendums(prev => prev.map(addendum => 
                addendum.id === addendumId ? mappedAddendum : addendum
            ));
            
            return { success: true, message: result.message, data: mappedAddendum };
        }
        return { success: false, message: result.message || 'Erro ao atualizar status do adendo' };
    } catch (error) {
        console.error('Erro ao atualizar status do adendo:', error);
        return { success: false, message: 'Erro inesperado ao atualizar status do adendo' };
    }
};
```

**Funcionalidade:**
- ✅ Atualiza status do adendo via API
- ✅ Mapeia dados do backend para formato do frontend
- ✅ Atualiza adendo no estado local
- ✅ Retorna resultado com sucesso/erro
- ✅ Tratamento de erros robusto

## **Estratégia de Carregamento**

### **Carregamento Sob Demanda**
- ✅ **Não carrega todos os adendos globalmente**
- ✅ **Carrega apenas quando necessário** (ex: ao visualizar detalhes do pedido)
- ✅ **Estado local vazio por padrão**
- ✅ **Função `loadOrderAddendums` para carregar sob demanda**

### **Vantagens da Abordagem:**
1. **Performance:** Não sobrecarrega o estado global
2. **Memória:** Economiza recursos ao não carregar dados desnecessários
3. **Flexibilidade:** Permite carregar adendos de pedidos específicos
4. **Escalabilidade:** Funciona bem com grandes volumes de dados

## **Mapeamento de Dados**

### **Backend → Frontend**
```typescript
// Mapeamento automático de campos
const mappedAddendum: OrderAddendum = {
    id: addendum._id || addendum.id,                    // _id → id
    orderId: addendum.orderId,                          // Mantém
    addendumNumber: addendum.addendumNumber,            // Mantém
    reason: addendum.reason,                            // Mantém
    status: addendum.status,                            // Mantém
    addedItems: addendum.addedItems || [],              // Array vazio por padrão
    removedItemIds: addendum.removedItemIds || [],      // Array vazio por padrão
    changedItems: addendum.changedItems || [],          // Array vazio por padrão
    priceAdjustment: addendum.priceAdjustment || 0,     // 0 por padrão
    approvedBy: addendum.approvedBy?._id || addendum.approvedBy,  // Objeto → string
    approvedAt: addendum.approvedAt,                    // Mantém
    createdBy: addendum.createdBy?._id || addendum.createdBy,    // Objeto → string
    createdAt: addendum.createdAt,                      // Mantém
    updatedAt: addendum.updatedAt                       // Mantém
};
```

### **Tratamento de Campos Populados:**
- ✅ **`approvedBy` e `createdBy`:** Converte objetos populados para IDs
- ✅ **Arrays:** Valores padrão para arrays vazios
- ✅ **Números:** Valores padrão para campos numéricos
- ✅ **IDs:** Suporte para `_id` (MongoDB) e `id` (frontend)

## **Exemplos de Uso**

### **1. Carregar Adendos de um Pedido**
```typescript
const OrderDetails: React.FC<{ orderId: string }> = ({ orderId }) => {
    const { orderAddendums, loadOrderAddendums } = useData();
    
    useEffect(() => {
        loadOrderAddendums(orderId);
    }, [orderId, loadOrderAddendums]);
    
    return (
        <div>
            <h3>Adendos do Pedido</h3>
            {orderAddendums.map(addendum => (
                <div key={addendum.id}>
                    <p>Número: {addendum.addendumNumber}</p>
                    <p>Motivo: {addendum.reason}</p>
                    <p>Status: {addendum.status}</p>
                </div>
            ))}
        </div>
    );
};
```

### **2. Criar Novo Adendo**
```typescript
const CreateAddendumForm: React.FC<{ orderId: string }> = ({ orderId }) => {
    const { createOrderAddendum } = useData();
    
    const handleSubmit = async (formData: any) => {
        const result = await createOrderAddendum(orderId, formData);
        if (result.success) {
            console.log('Adendo criado:', result.data);
        } else {
            console.error('Erro:', result.message);
        }
    };
    
    return (
        <form onSubmit={handleSubmit}>
            {/* Campos do formulário */}
        </form>
    );
};
```

### **3. Aprovar/Rejeitar Adendo**
```typescript
const AddendumActions: React.FC<{ addendumId: string }> = ({ addendumId }) => {
    const { updateOrderAddendumStatus } = useData();
    
    const handleApprove = async () => {
        const result = await updateOrderAddendumStatus(addendumId, 'approved');
        if (result.success) {
            console.log('Adendo aprovado:', result.data);
        }
    };
    
    const handleReject = async () => {
        const result = await updateOrderAddendumStatus(addendumId, 'rejected');
        if (result.success) {
            console.log('Adendo rejeitado:', result.data);
        }
    };
    
    return (
        <div>
            <button onClick={handleApprove}>Aprovar</button>
            <button onClick={handleReject}>Rejeitar</button>
        </div>
    );
};
```

## **Integração com Componentes**

### **1. Hook useData Atualizado**
```typescript
const { 
    orderAddendums, 
    setOrderAddendums,
    loadOrderAddendums,
    createOrderAddendum,
    updateOrderAddendumStatus 
} = useData();
```

### **2. Estado Global Acessível**
- ✅ **`orderAddendums`:** Array de adendos carregados
- ✅ **`setOrderAddendums`:** Função para atualizar estado
- ✅ **Funções de gerenciamento:** Prontas para uso em componentes

### **3. Tratamento de Erros**
- ✅ **Try-catch em todas as funções**
- ✅ **Logs de erro detalhados**
- ✅ **Retorno de sucesso/erro padronizado**
- ✅ **Mensagens de erro específicas**

## **Status da Implementação**
✅ **COMPLETA** - Todas as funcionalidades implementadas
✅ **TESTADA** - Sem erros de lint
✅ **DOCUMENTADA** - Funcionalidade completamente documentada
✅ **INTEGRADA** - Compatível com APIs do backend
✅ **OTIMIZADA** - Carregamento sob demanda implementado
