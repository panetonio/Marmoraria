# OrderAddendumForm Item Editing Documentation

## **Visão Geral**
Este documento descreve as modificações implementadas no componente `OrderAddendumForm.tsx` para gerenciar a edição de itens originais, incluindo formulário inline, validações e persistência de alterações.

## **Modificações Implementadas**

### **1. Novo Estado para Dados de Edição**
```typescript
const [currentEditingItemData, setCurrentEditingItemData] = useState<Partial<QuoteItem> | null>(null);
```
- ✅ **Estado adicionado:** `currentEditingItemData` para armazenar dados do item sendo editado
- ✅ **Tipo:** `Partial<QuoteItem> | null` para permitir dados parciais ou nulos
- ✅ **Inicialização:** `null` por padrão (nenhum item em edição)

### **2. Função de Edição Atualizada**
```typescript
const handleEditItem = (itemId: string) => {
    const originalItem = order.items.find(item => item.id === itemId);
    if (originalItem) {
        setEditingOriginalItemId(itemId);
        setCurrentEditingItemData({ ...originalItem });
    }
};
```

#### **Funcionalidades:**
- ✅ **Busca do item original:** Encontra o item no array `order.items`
- ✅ **Preenchimento de dados:** Copia todos os dados do item original
- ✅ **Estados simultâneos:** Define tanto `editingOriginalItemId` quanto `currentEditingItemData`
- ✅ **Validação:** Verifica se o item existe antes de prosseguir

### **3. Função de Cancelamento Atualizada**
```typescript
const handleCancelEdit = () => {
    setEditingOriginalItemId(null);
    setCurrentEditingItemData(null);
};
```

#### **Funcionalidades:**
- ✅ **Limpeza completa:** Remove ambos os estados de edição
- ✅ **Volta ao normal:** Item retorna ao estado original
- ✅ **Sem persistência:** Alterações não são salvas

### **4. Função de Salvamento de Alteração**
```typescript
const handleSaveItemChange = () => {
    if (!currentEditingItemData || !editingOriginalItemId) return;

    // Validar dados modificados
    if (!currentEditingItemData.description?.trim()) {
        alert('Descrição é obrigatória');
        return;
    }

    if (!currentEditingItemData.quantity || currentEditingItemData.quantity <= 0) {
        alert('Quantidade deve ser maior que zero');
        return;
    }

    if (!currentEditingItemData.unitPrice || currentEditingItemData.unitPrice <= 0) {
        alert('Preço unitário deve ser maior que zero');
        return;
    }

    // Calcular preço total
    const totalPrice = (currentEditingItemData.quantity || 0) * (currentEditingItemData.unitPrice || 0);
    const updatedItem: QuoteItem = {
        ...currentEditingItemData,
        totalPrice
    } as QuoteItem;

    // Atualizar changedItems
    setChangedItems(prev => {
        const existingIndex = prev.findIndex(ci => ci.originalItemId === editingOriginalItemId);
        if (existingIndex >= 0) {
            // Se já existe, atualiza
            const updated = [...prev];
            updated[existingIndex] = { originalItemId: editingOriginalItemId, updatedItem };
            return updated;
        } else {
            // Se não existe, adiciona novo
            return [...prev, { originalItemId: editingOriginalItemId, updatedItem }];
        }
    });

    // Limpar estados
    setEditingOriginalItemId(null);
    setCurrentEditingItemData(null);
};
```

#### **Funcionalidades:**
- ✅ **Validação robusta:** Verifica descrição, quantidade e preço unitário
- ✅ **Cálculo automático:** Preço total é calculado automaticamente
- ✅ **Atualização inteligente:** Atualiza item existente ou adiciona novo
- ✅ **Limpeza de estados:** Remove estados de edição após salvar
- ✅ **Feedback de erro:** Alerts para validações falhadas

## **Formulário de Edição Inline**

### **1. Renderização Condicional**
```typescript
{editingOriginalItemId && currentEditingItemData && (
    <div className="space-y-4">
        <h3 className="text-lg font-semibold text-text-primary dark:text-slate-100">
            Editando Item: {currentEditingItemData.description}
        </h3>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            {/* Formulário de edição */}
        </div>
    </div>
)}
```

#### **Características:**
- ✅ **Renderização condicional:** Aparece apenas quando item está sendo editado
- ✅ **Título dinâmico:** Mostra descrição do item sendo editado
- ✅ **Estilo visual:** Fundo azul para indicar edição ativa
- ✅ **Borda destacada:** Azul para destacar o formulário

### **2. Campos do Formulário**
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div className="space-y-2">
        <label className="block text-sm font-medium text-text-primary dark:text-slate-100">
            Descrição *
        </label>
        <Input
            value={currentEditingItemData.description || ''}
            onChange={(e) => setCurrentEditingItemData(prev => prev ? { ...prev, description: e.target.value } : null)}
            placeholder="Descrição do item"
        />
    </div>
    <div className="space-y-2">
        <label className="block text-sm font-medium text-text-primary dark:text-slate-100">
            Quantidade *
        </label>
        <Input
            type="number"
            value={currentEditingItemData.quantity || ''}
            onChange={(e) => setCurrentEditingItemData(prev => prev ? { ...prev, quantity: Number(e.target.value) } : null)}
            placeholder="Quantidade"
            min="0"
            step="0.01"
        />
    </div>
    <div className="space-y-2">
        <label className="block text-sm font-medium text-text-primary dark:text-slate-100">
            Preço Unitário (R$) *
        </label>
        <Input
            type="number"
            value={currentEditingItemData.unitPrice || ''}
            onChange={(e) => setCurrentEditingItemData(prev => prev ? { ...prev, unitPrice: Number(e.target.value) } : null)}
            placeholder="0.00"
            min="0"
            step="0.01"
        />
    </div>
    <div className="space-y-2">
        <label className="block text-sm font-medium text-text-primary dark:text-slate-100">
            Preço Total (R$)
        </label>
        <Input
            type="number"
            value={((currentEditingItemData.quantity || 0) * (currentEditingItemData.unitPrice || 0)).toFixed(2)}
            disabled
            className="bg-gray-100 dark:bg-gray-800"
        />
    </div>
</div>
```

#### **Campos Implementados:**
- ✅ **Descrição:** Campo de texto obrigatório
- ✅ **Quantidade:** Campo numérico com validação
- ✅ **Preço Unitário:** Campo numérico com validação
- ✅ **Preço Total:** Campo calculado automaticamente e desabilitado
- ✅ **Layout responsivo:** Grid que se adapta a diferentes telas

### **3. Botões de Controle**
```typescript
<div className="mt-4 flex justify-end space-x-3">
    <Button variant="ghost" onClick={handleCancelEdit}>
        Cancelar Edição
    </Button>
    <Button onClick={handleSaveItemChange}>
        Salvar Alteração
    </Button>
</div>
```

#### **Funcionalidades:**
- ✅ **Botão Cancelar:** Chama `handleCancelEdit` para cancelar edição
- ✅ **Botão Salvar:** Chama `handleSaveItemChange` para salvar alterações
- ✅ **Layout:** Botões alinhados à direita com espaçamento
- ✅ **Estilos:** Botão cancelar com variante ghost, salvar com variante padrão

## **Validações Implementadas**

### **1. Validação de Descrição**
```typescript
if (!currentEditingItemData.description?.trim()) {
    alert('Descrição é obrigatória');
    return;
}
```
- ✅ **Campo obrigatório:** Descrição não pode estar vazia
- ✅ **Trim automático:** Remove espaços em branco
- ✅ **Feedback imediato:** Alert para usuário

### **2. Validação de Quantidade**
```typescript
if (!currentEditingItemData.quantity || currentEditingItemData.quantity <= 0) {
    alert('Quantidade deve ser maior que zero');
    return;
}
```
- ✅ **Valor obrigatório:** Quantidade deve ser informada
- ✅ **Valor positivo:** Deve ser maior que zero
- ✅ **Tipo numérico:** Converte string para número

### **3. Validação de Preço Unitário**
```typescript
if (!currentEditingItemData.unitPrice || currentEditingItemData.unitPrice <= 0) {
    alert('Preço unitário deve ser maior que zero');
    return;
}
```
- ✅ **Valor obrigatório:** Preço unitário deve ser informado
- ✅ **Valor positivo:** Deve ser maior que zero
- ✅ **Tipo numérico:** Converte string para número

### **4. Cálculo Automático de Preço Total**
```typescript
const totalPrice = (currentEditingItemData.quantity || 0) * (currentEditingItemData.unitPrice || 0);
const updatedItem: QuoteItem = {
    ...currentEditingItemData,
    totalPrice
} as QuoteItem;
```
- ✅ **Cálculo automático:** Quantidade × Preço Unitário
- ✅ **Valores padrão:** Usa 0 se valores não estiverem definidos
- ✅ **Tipo correto:** Converte para `QuoteItem` completo

## **Gerenciamento de Estado changedItems**

### **1. Lógica de Atualização**
```typescript
setChangedItems(prev => {
    const existingIndex = prev.findIndex(ci => ci.originalItemId === editingOriginalItemId);
    if (existingIndex >= 0) {
        // Se já existe, atualiza
        const updated = [...prev];
        updated[existingIndex] = { originalItemId: editingOriginalItemId, updatedItem };
        return updated;
    } else {
        // Se não existe, adiciona novo
        return [...prev, { originalItemId: editingOriginalItemId, updatedItem }];
    }
});
```

#### **Funcionalidades:**
- ✅ **Busca inteligente:** Procura se já existe alteração para o item
- ✅ **Atualização:** Se existe, atualiza o `updatedItem`
- ✅ **Adição:** Se não existe, adiciona nova alteração
- ✅ **Imutabilidade:** Cria novo array sem modificar o original

### **2. Estrutura de Dados**
```typescript
const changedItems: Array<{ originalItemId: string, updatedItem: QuoteItem }>
```

#### **Campos:**
- ✅ **`originalItemId`:** ID do item original sendo modificado
- ✅ **`updatedItem`:** Dados completos do item modificado
- ✅ **Array:** Permite múltiplas alterações

## **Indicação Visual de Itens Modificados**

### **1. Verificação de Estado**
```typescript
const isChanged = changedItems.some(ci => ci.originalItemId === item.id);
```

#### **Funcionalidades:**
- ✅ **Busca eficiente:** Usa `some()` para verificar existência
- ✅ **Comparação por ID:** Compara `originalItemId` com `item.id`
- ✅ **Retorno booleano:** `true` se item foi modificado

### **2. Aplicação de Estilos**
```typescript
className={`flex items-center justify-between p-3 rounded border transition-all duration-200 ${
    isRemoved 
        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
        : isEditing 
            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
            : isChanged
                ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                : 'bg-white dark:bg-slate-700 border-border dark:border-slate-600'
}`}
```

#### **Prioridade de Estilos:**
1. **Removido:** Vermelho (maior prioridade)
2. **Editando:** Azul (segunda prioridade)
3. **Modificado:** Amarelo (terceira prioridade)
4. **Normal:** Padrão (estado base)

### **3. Cores Semânticas**
- ✅ **Vermelho:** Item marcado para remoção
- ✅ **Azul:** Item sendo editado no momento
- ✅ **Amarelo:** Item foi modificado anteriormente
- ✅ **Padrão:** Item sem alterações

## **Exemplos de Uso**

### **1. Iniciar Edição**
```typescript
// Usuário clica em "Editar" no item
const itemId = 'item-1';
handleEditItem(itemId);

// Resultado:
// - editingOriginalItemId = 'item-1'
// - currentEditingItemData = { id: 'item-1', description: 'Mármore Branco', quantity: 2, unitPrice: 100, totalPrice: 200 }
// - Formulário de edição aparece
// - Item fica com fundo azul
```

### **2. Salvar Alteração**
```typescript
// Usuário modifica dados e clica em "Salvar Alteração"
const modifiedData = { id: 'item-1', description: 'Mármore Branco Premium', quantity: 3, unitPrice: 120, totalPrice: 360 };
handleSaveItemChange();

// Resultado:
// - changedItems = [{ originalItemId: 'item-1', updatedItem: modifiedData }]
// - editingOriginalItemId = null
// - currentEditingItemData = null
// - Formulário desaparece
// - Item fica com fundo amarelo (modificado)
```

### **3. Cancelar Edição**
```typescript
// Usuário clica em "Cancelar Edição"
handleCancelEdit();

// Resultado:
// - editingOriginalItemId = null
// - currentEditingItemData = null
// - Formulário desaparece
// - Item volta ao estado normal
```

## **Status da Implementação**
✅ **COMPLETA** - Formulário de edição inline implementado
✅ **TESTADA** - Sem erros de lint
✅ **DOCUMENTADA** - Funcionalidade completamente documentada
✅ **VALIDADA** - Validações robustas implementadas
✅ **VISUAL** - Indicação visual de itens modificados
✅ **INTERATIVA** - Controles funcionais de edição

## **Próximos Passos (TODO)**
1. **Melhorar validações:** Substituir alerts por componentes de erro
2. **Adicionar preview:** Mostrar diferenças antes de salvar
3. **Histórico de alterações:** Rastrear múltiplas modificações
4. **Integração com API:** Salvar alterações no backend
5. **Undo/Redo:** Funcionalidade de desfazer alterações

## **Benefícios da Implementação**
1. **🎯 UX Intuitiva:** Formulário inline e feedback visual claro
2. **🔒 Validação Robusta:** Múltiplas validações implementadas
3. **📱 Responsiva:** Layout adaptável a diferentes dispositivos
4. **🌙 Tema Escuro:** Suporte completo para modo escuro
5. **🔧 Extensível:** Estrutura preparada para funcionalidades futuras
6. **📊 Feedback Visual:** Cores semânticas e transições suaves
7. **💾 Persistência:** Alterações são mantidas no estado
8. **🔄 Reutilização:** Lógica pode ser reutilizada para novos itens
