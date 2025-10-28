import React, { useState } from 'react';
import type { Order, QuoteItem, OrderAddendum, Address, QuoteItemType, Service, Product, Material } from '../types';
import Card, { CardContent, CardHeader, CardFooter } from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import Textarea from './ui/Textarea';
import Select from './ui/Select';
import { useData } from '../context/DataContext';
import { validateQuoteItem, calculateQuoteItem } from '../utils/helpers';

interface OrderAddendumFormProps {
    order: Order;
    onSave: (addendumData: Partial<OrderAddendum>) => void;
    onCancel: () => void;
}

const OrderAddendumForm: React.FC<OrderAddendumFormProps> = ({ order, onSave, onCancel }) => {
    // Estados básicos
    const [reason, setReason] = useState<string>('');
    const [priceAdjustment, setPriceAdjustment] = useState<number>(0);
    const [addedItems, setAddedItems] = useState<QuoteItem[]>([]);
    const [removedItemIds, setRemovedItemIds] = useState<string[]>([]);
    const [changedItems, setChangedItems] = useState<Array<{ originalItemId: string, updatedItem: QuoteItem }>>([]);
    const [editingOriginalItemId, setEditingOriginalItemId] = useState<string | null>(null);
    const [currentEditingItemData, setCurrentEditingItemData] = useState<Partial<QuoteItem> | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    
    // Estados para formulário de adição de novos itens
    const [newItemFormData, setNewItemFormData] = useState<Partial<QuoteItem>>({});
    const [newItemType, setNewItemType] = useState<QuoteItemType>('material');
    const [newItemErrors, setNewItemErrors] = useState<Record<string, string>>({});
    
    // Acessar dados do contexto
    const { services, products, materials } = useData();

    // Funções para gerenciar formulário de novos itens
    const handleNewItemFormChange = (field: keyof QuoteItem, value: any) => {
        setNewItemFormData(prev => {
            const updated = { ...prev, [field]: value };
            const calculated = calculateQuoteItem(updated);
            return { ...updated, ...calculated };
        });
    };

    const handleNewItemTypeChange = (type: QuoteItemType) => {
        setNewItemType(type);
        setNewItemFormData({});
        setNewItemErrors({});
    };

    const handleAddNewItem = () => {
        // Validar dados
        const validationErrors = validateQuoteItem(newItemFormData, newItemType, services, products);
        if (Object.keys(validationErrors).length > 0) {
            setNewItemErrors(validationErrors);
            return;
        }

        // Criar item com ID único temporário
        const newItem: QuoteItem = {
            ...newItemFormData,
            id: `newItem-${Date.now()}`,
            type: newItemType,
            totalPrice: (newItemFormData.quantity || 0) * (newItemFormData.unitPrice || 0) - (newItemFormData.discount || 0)
        } as QuoteItem;

        // Adicionar ao estado
        setAddedItems(prev => [...prev, newItem]);

        // Limpar formulário
        setNewItemFormData({});
        setNewItemErrors({});
    };

    const handleRemoveAddedItem = (itemId: string) => {
        setAddedItems(prev => prev.filter(item => item.id !== itemId));
    };

    // Função para renderizar formulário de novos itens
    const renderNewItemForm = () => {
        const hasCustomShape = newItemFormData.shapePoints && newItemFormData.shapePoints.length > 0;

        switch (newItemType) {
            case 'material':
                return (
                    <>
                        <div>
                            <div className="flex items-end space-x-2">
                                <Input
                                    label="Material"
                                    id="material-name"
                                    readOnly
                                    value={newItemFormData.materialName || 'Nenhum material selecionado'}
                                    error={newItemErrors.materialId}
                                    className="bg-slate-100 dark:bg-slate-800 flex-grow"
                                />
                                <Button variant="secondary" onClick={() => {/* TODO: Implementar catálogo */}}>
                                    Procurar
                                </Button>
                            </div>
                        </div>
                        <div className="mt-2">
                            <Input
                                placeholder="Descrição da peça (Ex: Bancada)"
                                value={newItemFormData.description || ''}
                                onChange={e => handleNewItemFormChange('description', e.target.value)}
                                error={newItemErrors.description}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            <Input
                                type="number"
                                placeholder="Largura (m)"
                                value={newItemFormData.width || ''}
                                onChange={e => handleNewItemFormChange('width', parseFloat(e.target.value) || 0)}
                                error={newItemErrors.width}
                                disabled={hasCustomShape}
                            />
                            <Input
                                type="number"
                                placeholder="Altura (m)"
                                value={newItemFormData.height || ''}
                                onChange={e => handleNewItemFormChange('height', parseFloat(e.target.value) || 0)}
                                error={newItemErrors.height}
                                disabled={hasCustomShape}
                            />
                        </div>
                        <div className="mt-2">
                            <Input
                                type="number"
                                placeholder="Desconto (R$)"
                                value={newItemFormData.discount || ''}
                                onChange={e => handleNewItemFormChange('discount', parseFloat(e.target.value) || 0)}
                                error={newItemErrors.discount}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-2 text-sm bg-slate-100 dark:bg-slate-800/50 p-2 rounded">
                            <div>Área: <span className="font-semibold">{newItemFormData.area?.toFixed(3) || '0.000'} m²</span></div>
                            {!hasCustomShape && <div>Perímetro: <span className="font-semibold">{newItemFormData.perimeter?.toFixed(2) || '0.00'} m</span></div>}
                        </div>
                    </>
                );
            case 'service':
                return (
                    <>
                        <Select
                            value={newItemFormData.id || ''}
                            onChange={e => handleNewItemFormChange('id', e.target.value)}
                            error={newItemErrors.id}
                        >
                            <option value="">Selecione o Serviço</option>
                            {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </Select>
                        <div className="mt-2">
                            <Input
                                type="number"
                                placeholder="Quantidade"
                                value={newItemFormData.quantity || ''}
                                onChange={e => handleNewItemFormChange('quantity', parseFloat(e.target.value) || 0)}
                                error={newItemErrors.quantity}
                            />
                        </div>
                        <div className="mt-2">
                            <Input
                                type="number"
                                placeholder="Desconto (R$)"
                                value={newItemFormData.discount || ''}
                                onChange={e => handleNewItemFormChange('discount', parseFloat(e.target.value) || 0)}
                                error={newItemErrors.discount}
                            />
                        </div>
                    </>
                );
            case 'product':
                return (
                    <>
                        <Select
                            value={newItemFormData.id || ''}
                            onChange={e => handleNewItemFormChange('id', e.target.value)}
                            error={newItemErrors.id}
                        >
                            <option value="">Selecione o Produto</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </Select>
                        <div className="mt-2">
                            <Input
                                type="number"
                                placeholder="Quantidade"
                                value={newItemFormData.quantity || ''}
                                onChange={e => handleNewItemFormChange('quantity', parseFloat(e.target.value) || 0)}
                                error={newItemErrors.quantity}
                            />
                        </div>
                        <div className="mt-2">
                            <Input
                                type="number"
                                placeholder="Desconto (R$)"
                                value={newItemFormData.discount || ''}
                                onChange={e => handleNewItemFormChange('discount', parseFloat(e.target.value) || 0)}
                                error={newItemErrors.discount}
                            />
                        </div>
                    </>
                );
            default:
                return null;
        }
    };

    // Funções para gerenciar itens originais
    const handleRemoveItem = (itemId: string) => {
        if (removedItemIds.includes(itemId)) {
            // Se já está marcado para remoção, remove da lista
            setRemovedItemIds(prev => prev.filter(id => id !== itemId));
        } else {
            // Se não está marcado, adiciona à lista
            setRemovedItemIds(prev => [...prev, itemId]);
        }
    };

    const handleEditItem = (itemId: string) => {
        const originalItem = order.items.find(item => item.id === itemId);
        if (originalItem) {
            setEditingOriginalItemId(itemId);
            setCurrentEditingItemData({ ...originalItem });
        }
    };

    const handleCancelEdit = () => {
        setEditingOriginalItemId(null);
        setCurrentEditingItemData(null);
        // Limpar erros relacionados à edição
        setErrors(prev => {
            const { description, quantity, unitPrice, ...rest } = prev;
            return rest;
        });
    };

    // Função para salvar alteração do item
    const handleSaveItemChange = () => {
        if (!currentEditingItemData || !editingOriginalItemId) return;

        // Validar dados modificados
        const validationErrors: Record<string, string> = {};
        
        if (!currentEditingItemData.description?.trim()) {
            validationErrors.description = 'Descrição é obrigatória';
        }

        if (!currentEditingItemData.quantity || currentEditingItemData.quantity <= 0) {
            validationErrors.quantity = 'Quantidade deve ser maior que zero';
        }

        if (!currentEditingItemData.unitPrice || currentEditingItemData.unitPrice <= 0) {
            validationErrors.unitPrice = 'Preço unitário deve ser maior que zero';
        }

        // Se há erros, não salvar
        if (Object.keys(validationErrors).length > 0) {
            setErrors(prev => ({ ...prev, ...validationErrors }));
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

        // Limpar estados e erros
        setEditingOriginalItemId(null);
        setCurrentEditingItemData(null);
        setErrors(prev => {
            const { description, quantity, unitPrice, ...rest } = prev;
            return rest;
        });
    };

    // Função para validar o formulário
    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!reason.trim()) {
            newErrors.reason = 'Motivo é obrigatório';
        }

        if (addedItems.length === 0 && removedItemIds.length === 0 && changedItems.length === 0) {
            newErrors.items = 'Pelo menos uma alteração deve ser feita';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Função para salvar o adendo
    const handleSaveAddendum = () => {
        // Limpar erros anteriores
        setErrors({});

        // Verificar se o campo reason está preenchido
        if (!reason.trim()) {
            setErrors({ reason: 'Motivo da alteração é obrigatório' });
            return;
        }

        // Verificar se há pelo menos uma alteração
        const hasAddedItems = addedItems.length > 0;
        const hasRemovedItems = removedItemIds.length > 0;
        const hasChangedItems = changedItems.length > 0;
        const hasPriceAdjustment = priceAdjustment !== 0;

        if (!hasAddedItems && !hasRemovedItems && !hasChangedItems && !hasPriceAdjustment) {
            setErrors({ 
                items: 'Pelo menos uma alteração deve ser feita (adicionar item, remover item, modificar item ou ajustar preço)' 
            });
            return;
        }

        // Criar objeto addendumData
        const addendumData: Partial<OrderAddendum> = {
            orderId: order.id,
            reason: reason.trim(),
            priceAdjustment,
            addedItems,
            removedItemIds,
            changedItems,
            status: 'pending'
        };

        // Chamar prop onSave
        onSave(addendumData);
    };

    return (
        <Card className="max-w-4xl mx-auto">
            <CardHeader>
                <h2 className="text-2xl font-bold text-text-primary dark:text-slate-100">
                    Criar Adendo para Pedido {order.id}
                </h2>
                <p className="text-text-secondary dark:text-slate-400 mt-2">
                    Cliente: {order.clientName} | Total: {order.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Seção: Exibição dos Itens Originais */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-text-primary dark:text-slate-100">
                        Itens Originais do Pedido
                    </h3>
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                        <div className="space-y-3">
                            {order.items.map((item, index) => {
                                const isRemoved = removedItemIds.includes(item.id);
                                const isEditing = editingOriginalItemId === item.id;
                                const isChanged = changedItems.some(ci => ci.originalItemId === item.id);
                                
                                return (
                                    <div 
                                        key={item.id} 
                                        className={`flex items-center justify-between p-3 rounded border transition-all duration-200 ${
                                            isRemoved 
                                                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
                                                : isEditing 
                                                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                                                    : isChanged
                                                        ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                                                        : 'bg-white dark:bg-slate-700 border-border dark:border-slate-600'
                                        }`}
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className={`font-medium ${
                                                    isRemoved 
                                                        ? 'line-through text-red-600 dark:text-red-400' 
                                                        : isEditing 
                                                            ? 'text-blue-600 dark:text-blue-400'
                                                            : isChanged
                                                                ? 'text-yellow-600 dark:text-yellow-400'
                                                                : 'text-text-primary dark:text-slate-100'
                                                }`}>
                                                    {item.description}
                                                </div>
                                                {isRemoved && (
                                                    <span className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full">
                                                        Removido
                                                    </span>
                                                )}
                                                {isChanged && !isRemoved && (
                                                    <span className="px-2 py-1 text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full">
                                                        Modificado
                                                    </span>
                                                )}
                                                {isEditing && (
                                                    <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                                                        Editando
                                                    </span>
                                                )}
                                            </div>
                                            <div className={`text-sm ${
                                                isRemoved 
                                                    ? 'line-through text-red-500 dark:text-red-400' 
                                                    : isEditing 
                                                        ? 'text-blue-500 dark:text-blue-400'
                                                        : isChanged
                                                            ? 'text-yellow-500 dark:text-yellow-400'
                                                            : 'text-text-secondary dark:text-slate-400'
                                            }`}>
                                                Quantidade: {item.quantity} | Preço: {item.unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`font-semibold ${
                                                isRemoved 
                                                    ? 'line-through text-red-600 dark:text-red-400' 
                                                    : isEditing 
                                                        ? 'text-blue-600 dark:text-blue-400'
                                                        : isChanged
                                                            ? 'text-yellow-600 dark:text-yellow-400'
                                                            : 'text-text-primary dark:text-slate-100'
                                            }`}>
                                                {item.totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </div>
                                        </div>
                                        <div className="ml-4 flex space-x-2">
                                            {isEditing ? (
                                                <div className="flex space-x-2">
                                                    <Button 
                                                        size="sm" 
                                                        variant="outline" 
                                                        onClick={handleCancelEdit}
                                                        className="text-xs"
                                                    >
                                                        Cancelar
                                                    </Button>
                                                    <Button 
                                                        size="sm" 
                                                        variant="secondary" 
                                                        onClick={handleSaveItemChange}
                                                        className="text-xs"
                                                    >
                                                        Salvar Alteração
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="flex space-x-2">
                                                    <Button 
                                                        size="sm" 
                                                        variant={isRemoved ? "secondary" : "outline"} 
                                                        onClick={() => handleRemoveItem(item.id)}
                                                        className={`text-xs ${
                                                            isRemoved 
                                                                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700' 
                                                                : ''
                                                        }`}
                                                    >
                                                        {isRemoved ? 'Restaurar' : 'Remover'}
                                                    </Button>
                                                    <Button 
                                                        size="sm" 
                                                        variant="outline" 
                                                        onClick={() => handleEditItem(item.id)}
                                                        className="text-xs"
                                                    >
                                                        Editar
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Formulário de Edição Inline */}
                {editingOriginalItemId && currentEditingItemData && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-text-primary dark:text-slate-100">
                            Editando Item: {currentEditingItemData.description}
                        </h3>
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-text-primary dark:text-slate-100">
                                        Descrição *
                                    </label>
                                    <Input
                                        value={currentEditingItemData.description || ''}
                                        onChange={(e) => setCurrentEditingItemData(prev => prev ? { ...prev, description: e.target.value } : null)}
                                        placeholder="Descrição do item"
                                        error={errors.description}
                                        className={errors.description ? 'border-error' : ''}
                                    />
                                    {errors.description && (
                                        <p className="text-error text-sm">{errors.description}</p>
                                    )}
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
                                        error={errors.quantity}
                                        className={errors.quantity ? 'border-error' : ''}
                                    />
                                    {errors.quantity && (
                                        <p className="text-error text-sm">{errors.quantity}</p>
                                    )}
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
                                        error={errors.unitPrice}
                                        className={errors.unitPrice ? 'border-error' : ''}
                                    />
                                    {errors.unitPrice && (
                                        <p className="text-error text-sm">{errors.unitPrice}</p>
                                    )}
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
                            <div className="mt-4 flex justify-end space-x-3">
                                <Button variant="ghost" onClick={handleCancelEdit}>
                                    Cancelar Edição
                                </Button>
                                <Button onClick={handleSaveItemChange}>
                                    Salvar Alteração
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Seção: Formulário para Adicionar Novos Itens */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-text-primary dark:text-slate-100">
                        Adicionar Novos Itens
                    </h3>
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                        <div className="space-y-4">
                            {/* Seleção de Tipo */}
                            <div>
                                <label className="block text-sm font-medium text-text-primary dark:text-slate-100 mb-2">
                                    Tipo de Item
                                </label>
                                <div className="flex space-x-2">
                                    {(['material', 'service', 'product'] as QuoteItemType[]).map(type => (
                                        <button
                                            key={type}
                                            onClick={() => handleNewItemTypeChange(type)}
                                            className={`px-3 py-1 rounded text-sm ${
                                                newItemType === type 
                                                    ? 'bg-primary text-white' 
                                                    : 'bg-slate-200 dark:bg-slate-700 dark:text-slate-200'
                                            }`}
                                        >
                                            {type === 'material' ? 'Material' : type === 'service' ? 'Serviço' : 'Produto'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Formulário Específico */}
                            {renderNewItemForm()}

                            {/* Botão de Adicionar */}
                            <div className="flex justify-end">
                                <Button onClick={handleAddNewItem}>
                                    Adicionar Novo Item ao Adendo
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Lista de Itens Adicionados */}
                    {addedItems.length > 0 && (
                        <div className="space-y-4">
                            <h4 className="text-md font-semibold text-text-primary dark:text-slate-100">
                                Itens Adicionados ao Adendo
                            </h4>
                            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                                <div className="space-y-3">
                                    {addedItems.map((item) => (
                                        <div key={item.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-700 rounded border">
                                            <div className="flex-1">
                                                <div className="font-medium text-text-primary dark:text-slate-100">
                                                    {item.description}
                                                </div>
                                                <div className="text-sm text-text-secondary dark:text-slate-400">
                                                    Tipo: {item.type === 'material' ? 'Material' : item.type === 'service' ? 'Serviço' : 'Produto'} | 
                                                    Quantidade: {item.quantity} | 
                                                    Preço: {item.unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-semibold text-text-primary dark:text-slate-100">
                                                    {item.totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <Button 
                                                    size="sm" 
                                                    variant="outline" 
                                                    onClick={() => handleRemoveAddedItem(item.id)}
                                                    className="text-xs text-red-600 dark:text-red-400 border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                >
                                                    Remover
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Seção: Motivo e Ajuste de Preço */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-text-primary dark:text-slate-100">
                        Detalhes do Adendo
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-text-primary dark:text-slate-100">
                                Motivo da Alteração *
                            </label>
                            <Textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Descreva o motivo da alteração no pedido..."
                                rows={4}
                                className={errors.reason ? 'border-error' : ''}
                            />
                            {errors.reason && (
                                <p className="text-error text-sm">{errors.reason}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-text-primary dark:text-slate-100">
                                Ajuste de Preço (R$)
                            </label>
                            <Input
                                type="number"
                                value={priceAdjustment}
                                onChange={(e) => setPriceAdjustment(Number(e.target.value))}
                                placeholder="0.00"
                                step="0.01"
                            />
                            <p className="text-xs text-text-secondary dark:text-slate-400">
                                Use valores positivos para acréscimos e negativos para descontos
                            </p>
                        </div>
                    </div>
                </div>

                {/* Seção: Resumo das Alterações */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-text-primary dark:text-slate-100">
                        Resumo das Alterações
                    </h3>
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                            <div className="text-center">
                                <div className="font-semibold text-green-600 dark:text-green-400">
                                    {addedItems.length}
                                </div>
                                <div className="text-text-secondary dark:text-slate-400">
                                    Novos Itens
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="font-semibold text-red-600 dark:text-red-400">
                                    {removedItemIds.length}
                                </div>
                                <div className="text-text-secondary dark:text-slate-400">
                                    Itens Removidos
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="font-semibold text-yellow-600 dark:text-yellow-400">
                                    {changedItems.length}
                                </div>
                                <div className="text-text-secondary dark:text-slate-400">
                                    Itens Modificados
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="font-semibold text-blue-600 dark:text-blue-400">
                                    {addedItems.length + removedItemIds.length + changedItems.length}
                                </div>
                                <div className="text-text-secondary dark:text-slate-400">
                                    Total de Alterações
                                </div>
                            </div>
                        </div>
                        
                        {priceAdjustment !== 0 && (
                            <div className="mt-4 pt-4 border-t border-border dark:border-slate-700">
                                <div className="flex justify-between items-center">
                                    <span className="text-text-primary dark:text-slate-100">
                                        Ajuste de Preço:
                                    </span>
                                    <span className={`font-semibold ${priceAdjustment > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {priceAdjustment > 0 ? '+' : ''}{priceAdjustment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Exibir erro geral se houver */}
                {errors.items && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <p className="text-red-600 dark:text-red-400 text-sm">{errors.items}</p>
                    </div>
                )}
            </CardContent>

            <CardFooter className="flex justify-end space-x-3">
                <Button variant="ghost" onClick={onCancel}>
                    Cancelar
                </Button>
                <Button onClick={handleSaveAddendum}>
                    Salvar Adendo
                </Button>
            </CardFooter>
        </Card>
    );
};

export default OrderAddendumForm;
