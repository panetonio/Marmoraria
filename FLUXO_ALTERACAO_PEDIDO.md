# Fluxo de Alteração de Pedidos - Sistema de Adendos

## **Visão Geral**
Este documento explica o processo completo de alteração de pedidos através do sistema de adendos, incluindo criação, aprovação e impacto nas Ordens de Serviço (OSs).

## **1. Como Criar um Adendo**

### **1.1 Acesso ao Sistema**
- Acesse a página **"Pedidos"** (`/orders`)
- Localize o pedido que deseja alterar
- Clique no botão **"Criar Adendo"** na coluna "Ações"
- ⚠️ **Importante:** O botão só aparece para pedidos que **não** estão em status `completed` ou `cancelled`

### **1.2 Processo de Criação**
1. **Modal de Adendo:** O sistema abrirá o modal `OrderAddendumForm`
2. **Seleção de Itens:**
   - **Itens Originais:** Visualize todos os itens do pedido original
   - **Remover:** Marque itens que devem ser removidos
   - **Editar:** Modifique quantidade, preço ou descrição de itens existentes
   - **Adicionar:** Inclua novos itens ao pedido
3. **Informações do Adendo:**
   - **Motivo da Alteração:** Campo obrigatório explicando o motivo
   - **Ajuste de Preço:** Valor adicional ou desconto (opcional)
4. **Validação:** O sistema verifica se há pelo menos uma alteração
5. **Salvar:** Clique em "Salvar Adendo" para criar

### **1.3 Estados do Adendo**
- **`pending`:** Adendo criado, aguardando aprovação
- **`approved`:** Adendo aprovado, alterações aplicadas
- **`rejected`:** Adendo rejeitado, sem efeito

## **2. Como Aprovar/Rejeitar um Adendo**

### **2.1 Acesso à Aprovação**
- Acesse a página **"Pedidos"** (`/orders`)
- Clique em **"Ver Detalhes"** do pedido
- Na seção **"Adendos Aprovados"**, visualize todos os adendos
- ⚠️ **Nota:** Aprovação/rejeição deve ser implementada na interface administrativa

### **2.2 Processo de Aprovação**
1. **Revisão:** Analise o adendo e suas alterações
2. **Aprovação:** Clique em "Aprovar" para aplicar as alterações
3. **Rejeição:** Clique em "Rejeitar" para descartar o adendo
4. **Confirmação:** O sistema solicita confirmação da ação

### **2.3 Impacto da Aprovação**
- **Status:** Adendo muda de `pending` para `approved`
- **Timestamp:** `approvedAt` é definido com a data atual
- **Usuário:** `approvedBy` é definido com o usuário aprovador
- **Efeito:** Alterações são aplicadas ao pedido

## **3. Como um Adendo Aprovado Afeta a Geração de Novas OSs**

### **3.1 Itens Disponíveis para Nova OS**
Quando um adendo é aprovado, a lista de itens disponíveis para criar novas OSs é atualizada:

#### **Itens Originais:**
- ✅ **Mantidos:** Itens que não foram removidos ou substituídos
- ❌ **Removidos:** Itens marcados para remoção em adendos aprovados
- 🔄 **Substituídos:** Itens modificados são substituídos pela versão atualizada

#### **Itens de Adendos:**
- ➕ **Adicionados:** Novos itens de `addedItems` ficam disponíveis
- 🔄 **Modificados:** Versões atualizadas de `changedItems` ficam disponíveis

### **3.2 Exemplo Prático**
```typescript
// Pedido Original
const order = {
    items: [
        { id: 'item-1', description: 'Bancada 1', totalPrice: 500.00 },
        { id: 'item-2', description: 'Bancada 2', totalPrice: 600.00 },
        { id: 'item-3', description: 'Bancada 3', totalPrice: 700.00 }
    ]
};

// Adendo Aprovado
const addendum = {
    removedItemIds: ['item-1'],           // Remove item-1
    addedItems: [                         // Adiciona item-4
        { id: 'item-4', description: 'Bancada Extra', totalPrice: 800.00 }
    ],
    changedItems: [                       // Modifica item-2
        {
            originalItemId: 'item-2',
            updatedItem: { id: 'item-2-updated', description: 'Bancada 2 Modificada', totalPrice: 650.00 }
        }
    ]
};

// Itens Disponíveis para Nova OS
const availableItems = [
    { id: 'item-3', description: 'Bancada 3', totalPrice: 700.00 },        // Original mantido
    { id: 'item-4', description: 'Bancada Extra', totalPrice: 800.00 },   // Adicionado
    { id: 'item-2-updated', description: 'Bancada 2 Modificada', totalPrice: 650.00 } // Modificado
];
```

## **4. Processo para OSs Já Existentes**

### **4.1 Cenário Problemático**
Quando um adendo é aprovado, pode haver conflitos com OSs já existentes:

#### **Exemplos de Conflitos:**
- **Item Removido:** OS contém item que foi removido por adendo
- **Item Modificado:** OS contém versão antiga de item que foi modificado
- **Item Duplicado:** OS contém item que foi substituído por versão atualizada

### **4.2 Estratégia de Resolução**

#### **4.2.1 Análise de Impacto**
```typescript
// Função para analisar impacto de adendo em OSs existentes
const analyzeAddendumImpact = (addendum, existingServiceOrders) => {
    const impactedOSs = [];
    
    // Verificar OSs com itens removidos
    const removedItemIds = addendum.removedItemIds;
    const osWithRemovedItems = existingServiceOrders.filter(os => 
        os.items.some(item => removedItemIds.includes(item.id))
    );
    
    // Verificar OSs com itens modificados
    const changedItemIds = addendum.changedItems.map(change => change.originalItemId);
    const osWithChangedItems = existingServiceOrders.filter(os => 
        os.items.some(item => changedItemIds.includes(item.id))
    );
    
    return {
        removedItems: osWithRemovedItems,
        changedItems: osWithChangedItems,
        totalImpacted: osWithRemovedItems.length + osWithChangedItems.length
    };
};
```

#### **4.2.2 Regras de Resolução**

##### **Regra 1: OSs em Status Inicial**
```typescript
// OSs em status 'pending' ou 'scheduled' podem ser atualizadas automaticamente
const canAutoUpdate = (serviceOrder) => {
    return ['pending', 'scheduled'].includes(serviceOrder.status);
};
```

##### **Regra 2: OSs em Produção**
```typescript
// OSs em status 'in_progress' ou 'completed' requerem intervenção manual
const requiresManualIntervention = (serviceOrder) => {
    return ['in_progress', 'completed'].includes(serviceOrder.status);
};
```

##### **Regra 3: Notificação Automática**
```typescript
// Sistema deve notificar equipe de produção sobre conflitos
const notifyProductionTeam = (impactedOSs, addendum) => {
    const notification = {
        type: 'addendum_conflict',
        addendumId: addendum.id,
        addendumNumber: addendum.addendumNumber,
        impactedOSs: impactedOSs.map(os => ({
            id: os.id,
            status: os.status,
            items: os.items
        })),
        actionRequired: 'manual_review'
    };
    
    // Enviar notificação para equipe de produção
    sendNotification(notification);
};
```

### **4.3 Processo de Resolução**

#### **4.3.1 Aprovação de Adendo**
1. **Análise Automática:** Sistema analisa impacto em OSs existentes
2. **Classificação:** OSs são classificadas por status e impacto
3. **Ação Automática:** OSs em status inicial são atualizadas automaticamente
4. **Notificação:** Equipe de produção é notificada sobre conflitos

#### **4.3.2 Resolução Manual**
1. **Revisão:** Equipe de produção revisa OSs impactadas
2. **Decisão:** Escolha entre:
   - **Cancelar e Recriar:** Cancelar OS e criar nova com itens atualizados
   - **Ajustar Manualmente:** Modificar OS existente para refletir alterações
   - **Manter Status Quo:** Manter OS como está (não recomendado)

#### **4.3.3 Documentação**
1. **Log de Alterações:** Todas as ações são registradas
2. **Justificativa:** Motivo da decisão é documentado
3. **Comunicação:** Cliente é informado sobre impactos

## **5. Implementação Técnica**

### **5.1 Backend - Controller**
```javascript
// backend/controllers/orderAddendumController.js
exports.updateAddendumStatus = async (req, res) => {
    try {
        const { addendumId } = req.params;
        const { status } = req.body;
        
        // Buscar adendo
        const addendum = await OrderAddendum.findById(addendumId);
        if (!addendum) {
            return res.status(404).json({ message: 'Adendo não encontrado' });
        }
        
        // Verificar se pode ser alterado
        if (addendum.status !== 'pending') {
            return res.status(400).json({ 
                message: 'Apenas adendos pendentes podem ser alterados' 
            });
        }
        
        // Se aprovando, analisar impacto em OSs existentes
        if (status === 'approved') {
            const impactAnalysis = await analyzeAddendumImpact(addendum);
            
            // Atualizar OSs automaticamente se possível
            await handleAutomaticOSUpdates(addendum, impactAnalysis);
            
            // Notificar sobre conflitos que requerem intervenção manual
            if (impactAnalysis.requiresManualIntervention.length > 0) {
                await notifyProductionTeam(impactAnalysis.requiresManualIntervention, addendum);
            }
        }
        
        // Atualizar status do adendo
        addendum.status = status;
        if (status === 'approved') {
            addendum.approvedBy = req.user._id;
            addendum.approvedAt = new Date();
        }
        
        await addendum.save();
        
        res.json(addendum);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
```

### **5.2 Frontend - Interface**
```typescript
// Componente para exibir impacto de adendo
const AddendumImpactAnalysis: React.FC<{
    addendum: OrderAddendum;
    impactedOSs: ServiceOrder[];
}> = ({ addendum, impactedOSs }) => {
    return (
        <div className="p-4 border border-yellow-300 rounded-lg bg-yellow-50">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                ⚠️ Impacto em OSs Existentes
            </h3>
            <p className="text-sm text-yellow-700 mb-3">
                Este adendo afetará {impactedOSs.length} OS(s) existente(s).
            </p>
            
            {impactedOSs.map(os => (
                <div key={os.id} className="mb-2 p-2 bg-white rounded border">
                    <div className="flex justify-between items-center">
                        <span className="font-medium">OS #{os.id}</span>
                        <StatusBadge status={os.status} />
                    </div>
                    <p className="text-xs text-gray-600">
                        Status: {os.status} | Itens: {os.items.length}
                    </p>
                </div>
            ))}
            
            <div className="mt-3 text-sm text-yellow-700">
                <p>• OSs em status inicial serão atualizadas automaticamente</p>
                <p>• OSs em produção requerem revisão manual</p>
                <p>• Equipe de produção será notificada</p>
            </div>
        </div>
    );
};
```

## **6. Fluxo Completo de Exemplo**

### **6.1 Cenário: Pedido com OS Existente**
```typescript
// Estado Inicial
const order = {
    id: 'ORD-001',
    items: [
        { id: 'item-1', description: 'Bancada 1', totalPrice: 500.00 },
        { id: 'item-2', description: 'Bancada 2', totalPrice: 600.00 }
    ]
};

const existingOS = {
    id: 'OS-001',
    orderId: 'ORD-001',
    status: 'in_progress',
    items: [
        { id: 'item-1', description: 'Bancada 1', totalPrice: 500.00 }
    ]
};

// Adendo Criado
const addendum = {
    orderId: 'ORD-001',
    reason: 'Cliente solicitou alteração',
    removedItemIds: ['item-1'],  // Remove item-1
    addedItems: [
        { id: 'item-3', description: 'Bancada 3', totalPrice: 700.00 }
    ],
    changedItems: [
        {
            originalItemId: 'item-2',
            updatedItem: { id: 'item-2-updated', description: 'Bancada 2 Modificada', totalPrice: 650.00 }
        }
    ]
};

// Análise de Impacto
const impactAnalysis = {
    removedItems: [existingOS],  // OS-001 contém item-1 que será removido
    changedItems: [],
    totalImpacted: 1
};

// Ação Requerida
const actionRequired = {
    type: 'manual_intervention',
    reason: 'OS em produção contém item que será removido',
    osId: 'OS-001',
    recommendation: 'Cancelar OS e criar nova com itens atualizados'
};
```

### **6.2 Processo de Resolução**
1. **Notificação:** Equipe de produção recebe notificação
2. **Revisão:** Analisa impacto na OS existente
3. **Decisão:** Escolhe entre cancelar/recriar ou ajustar manualmente
4. **Ação:** Executa a decisão escolhida
5. **Documentação:** Registra a ação tomada

## **7. Benefícios do Sistema**

### **7.1 Para a Equipe**
- ✅ **Rastreabilidade:** Todas as alterações são documentadas
- ✅ **Flexibilidade:** Permite ajustes em pedidos já confirmados
- ✅ **Controle:** Aprovação centralizada de alterações
- ✅ **Comunicação:** Notificações automáticas sobre conflitos

### **7.2 Para o Cliente**
- ✅ **Satisfação:** Permite alterações mesmo após confirmação
- ✅ **Transparência:** Todas as alterações são visíveis
- ✅ **Precisão:** OSs refletem as alterações aprovadas
- ✅ **Qualidade:** Processo controlado de alterações

### **7.3 Para o Sistema**
- ✅ **Integridade:** Dados consistentes entre pedidos e OSs
- ✅ **Automação:** Atualizações automáticas quando possível
- ✅ **Auditoria:** Log completo de todas as alterações
- ✅ **Escalabilidade:** Suporta múltiplos adendos por pedido

## **8. Considerações Importantes**

### **8.1 Limitações**
- ⚠️ **OSs em Produção:** Requerem intervenção manual
- ⚠️ **Múltiplos Adendos:** Podem criar conflitos complexos
- ⚠️ **Timing:** Alterações tardias podem impactar cronograma
- ⚠️ **Custos:** Alterações podem afetar preços e prazos

### **8.2 Melhores Práticas**
- ✅ **Comunicação:** Sempre comunicar alterações ao cliente
- ✅ **Documentação:** Registrar justificativas para alterações
- ✅ **Revisão:** Revisar impacto antes de aprovar adendos
- ✅ **Monitoramento:** Acompanhar resolução de conflitos

## **9. Conclusão**

O sistema de adendos oferece flexibilidade para alterações em pedidos, mas requer processos bem definidos para lidar com OSs existentes. A combinação de automação e intervenção manual garante que o sistema seja robusto e flexível, atendendo às necessidades tanto da equipe quanto dos clientes.

**Lembre-se:** Sempre revise o impacto antes de aprovar adendos e comunique claramente as alterações a todas as partes envolvidas.
