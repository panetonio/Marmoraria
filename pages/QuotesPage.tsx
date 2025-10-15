import React, { useState, useMemo, useCallback, useEffect } from 'react';
import type { Quote, QuoteItem, QuoteItemType, QuoteStatus, User, Material, Client, Page } from '../types';
import { mockQuotes, mockMaterials, mockServices, mockProducts, mockUsers, mockClients } from '../data/mockData';
import DocumentPreview from '../components/QuotePreview';
import CuttingOptimizer from '../components/CuttingOptimizer';
import ShapeDesigner from '../components/ShapeDesigner';
import Card, { CardContent, CardHeader, CardFooter } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';


const QuoteStatusBadge: React.FC<{ status: QuoteStatus }> = ({ status }) => {
    const statusMap: Record<QuoteStatus, { label: string, variant: 'default' | 'primary' | 'success' | 'error' }> = {
        draft: { label: "Rascunho", variant: "default" },
        sent: { label: "Enviado", variant: "primary" },
        approved: { label: "Aprovado", variant: "success" },
        rejected: { label: "Rejeitado", variant: "error" },
        archived: { label: "Arquivado", variant: "default" },
    };
    return <Badge variant={statusMap[status]?.variant || 'default'}>{statusMap[status]?.label || status}</Badge>;
};


const QuoteList: React.FC<{
    quotes: Quote[];
    onNew: () => void;
    onEdit: (quote: Quote) => void;
    clientFilter: string;
    onClientFilterChange: (value: string) => void;
    dateFilter: string;
    onDateFilterChange: (value: string) => void;
    statusFilter: QuoteStatus | '';
    onStatusFilterChange: (value: QuoteStatus | '') => void;
    salespersonFilter: string;
    onSalespersonFilterChange: (value: string) => void;
    showArchived: boolean;
    onShowArchivedChange: (show: boolean) => void;
}> = ({ 
    quotes, onNew, onEdit, 
    clientFilter, onClientFilterChange, 
    dateFilter, onDateFilterChange, 
    statusFilter, onStatusFilterChange,
    salespersonFilter, onSalespersonFilterChange,
    showArchived, onShowArchivedChange
 }) => {
    
    const statusLabels = {
        draft: "Rascunho",
        sent: "Enviado",
        approved: "Aprovado",
        rejected: "Rejeitado",
        archived: "Arquivado",
    };

    const salespeople = useMemo(() => mockUsers.filter(u => u.role === 'vendedor'), []);
    
    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-semibold text-text-primary dark:text-slate-100">{showArchived ? 'Orçamentos Arquivados' : 'Orçamentos'}</h2>
                    <Button onClick={onNew}>Novo Orçamento</Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-border dark:border-slate-700">
                     <input
                        type="text"
                        placeholder="Filtrar por Cliente..."
                        value={clientFilter}
                        onChange={(e) => onClientFilterChange(e.target.value)}
                        className="p-2 border border-border dark:border-slate-600 rounded w-full bg-slate-50 dark:bg-slate-700"
                        aria-label="Filtrar por nome do cliente"
                    />
                    <input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => onDateFilterChange(e.target.value)}
                        className="p-2 border border-border dark:border-slate-600 rounded w-full text-text-secondary dark:text-slate-300 bg-slate-50 dark:bg-slate-700"
                        aria-label="Filtrar por data"
                    />
                    <select
                        value={statusFilter}
                        onChange={(e) => onStatusFilterChange(e.target.value as QuoteStatus | '')}
                        className="p-2 border border-border dark:border-slate-600 rounded w-full bg-slate-50 dark:bg-slate-700"
                        aria-label="Filtrar por status"
                    >
                        <option value="">Todos os Status</option>
                        {Object.entries(statusLabels)
                            .filter(([value]) => showArchived ? value === 'archived' : value !== 'archived')
                            .map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                        ))}
                    </select>
                    <select
                        value={salespersonFilter}
                        onChange={(e) => onSalespersonFilterChange(e.target.value)}
                        className="p-2 border border-border dark:border-slate-600 rounded w-full bg-slate-50 dark:bg-slate-700"
                        aria-label="Filtrar por vendedor"
                    >
                        <option value="">Todos os Vendedores</option>
                        {salespeople.map(user => (
                            <option key={user.id} value={user.id}>{user.name}</option>
                        ))}
                    </select>
                    <div className="flex items-center justify-start md:justify-end">
                         <Button variant={showArchived ? 'primary' : 'ghost'} onClick={() => onShowArchivedChange(!showArchived)}>
                            {showArchived ? 'Ver Ativos' : 'Ver Arquivados'}
                        </Button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-border dark:border-slate-700">
                                <th className="p-3">ID</th>
                                <th className="p-3">Cliente</th>
                                <th className="p-3">Data</th>
                                <th className="p-3">Total</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {quotes.map(quote => (
                                <tr key={quote.id} className="border-b border-border dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                    <td className="p-3 font-mono text-sm">{quote.id}</td>
                                    <td className="p-3">{quote.clientName}</td>
                                    <td className="p-3">{new Date(quote.createdAt).toLocaleDateString()}</td>
                                    <td className="p-3">{quote.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                    <td className="p-3"><QuoteStatusBadge status={quote.status} /></td>
                                    <td className="p-3">
                                        <button onClick={() => onEdit(quote)} className="text-primary hover:underline font-semibold text-sm">Editar</button>
                                    </td>
                                </tr>
                            ))}
                             {quotes.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="text-center p-4 text-text-secondary dark:text-slate-400">Nenhum orçamento encontrado com os filtros aplicados.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}

const MaterialCatalogModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSelect: (material: Material) => void;
}> = ({ isOpen, onClose, onSelect }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Catálogo de Materiais" className="max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockMaterials.map(material => (
                    <div key={material.id} className="border border-border dark:border-slate-700 rounded-lg p-3 flex flex-col items-center text-center cursor-pointer hover:shadow-lg transition bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-slate-700" onClick={() => onSelect(material)}>
                        <img src={material.photoUrl} alt={material.name} className="w-full h-32 object-cover rounded mb-2" />
                        <h4 className="font-semibold">{material.name}</h4>
                        <p className="text-sm text-text-secondary dark:text-slate-400">{material.supplier}</p>
                        <p className="text-sm text-text-secondary dark:text-slate-400">Chapa: {material.slabWidth}m x {material.slabHeight}m</p>
                        <p className="text-sm font-bold mt-1">{material.costPerSqM.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} / m²</p>
                    </div>
                ))}
            </div>
        </Modal>
    );
};

const FieldError: React.FC<{ message?: string }> = ({ message }) => {
    if (!message) return null;
    return <p className="text-error text-xs mt-1">{message}</p>;
};


const QuoteForm: React.FC<{ quote: Quote; onSave: (quote: Quote) => void; onCancel: () => void }> = ({ quote: initialQuote, onSave, onCancel }) => {
    const [quote, setQuote] = useState<Quote>(initialQuote);
    const [itemType, setItemType] = useState<QuoteItemType>('material');
    
    const [itemFormData, setItemFormData] = useState<Partial<QuoteItem & { materialName?: string, area?: number, perimeter?: number }>>({});
    
    const [isCatalogOpen, setIsCatalogOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isOptimizerOpen, setIsOptimizerOpen] = useState(false);
    const [isDesignerOpen, setIsDesignerOpen] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [itemErrors, setItemErrors] = useState<Record<string, string>>({});
    
    const totals = useMemo(() => {
        const subtotal = quote.items.reduce((acc, item) => acc + item.totalPrice, 0);
        return { subtotal, total: subtotal }; // Can add discounts, taxes here later
    }, [quote.items]);

    const validateQuote = (isDraft: boolean): boolean => {
        const newErrors: Record<string, string> = {};
        if (!quote.clientName.trim()) newErrors.clientName = "Nome do cliente é obrigatório.";
        
        if (!isDraft) {
            if (!quote.clientEmail.trim()) {
                newErrors.clientEmail = "Email do cliente é obrigatório.";
            } else if (!/\S+@\S+\.\S+/.test(quote.clientEmail)) {
                newErrors.clientEmail = "Formato de email inválido.";
            }
            if (!quote.clientPhone.trim()) newErrors.clientPhone = "Telefone do cliente é obrigatório.";
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    
    const handleMaterialSelect = (material: Material) => {
        setItemFormData({
            ...itemFormData,
            materialId: material.id,
            unitPrice: material.costPerSqM,
            materialName: material.name,
        });
        if (itemErrors.materialId) {
            const newItemErrors = { ...itemErrors };
            delete newItemErrors.materialId;
            setItemErrors(newItemErrors);
        }
        setIsCatalogOpen(false);
    };

    const updateItemCalculations = useCallback((data: Partial<QuoteItem>) => {
        if (data.shapePoints && data.shapePoints.length > 0) {
            const totalPrice = (data.quantity || 0) * (data.unitPrice || 0);
            return { ...data, totalPrice };
        }
        if (data.type === 'material' && data.width && data.height) {
            const width = parseFloat(data.width.toString());
            const height = parseFloat(data.height.toString());
            const area = width * height;
            const perimeter = 2 * (width + height);
            const totalPrice = area * (data.unitPrice || 0);
            return { ...data, area, perimeter, quantity: area, totalPrice };
        }
        return data;
    }, []);

    const handleItemFormChange = (field: keyof QuoteItem, value: any) => {
        const updatedData = updateItemCalculations({ ...itemFormData, type: itemType, [field]: value });
        setItemFormData(updatedData);
        if (itemErrors[field as string]) {
            const newItemErrors = { ...itemErrors };
            delete newItemErrors[field as string];
            setItemErrors(newItemErrors);
        }
    };
    
    const handleShapeComplete = (data: { area: number, points: { x: number, y: number }[] }) => {
        setItemFormData(prev => {
            const totalPrice = data.area * (prev.unitPrice || 0);
            return {
                ...prev,
                quantity: data.area,
                area: data.area,
                shapePoints: data.points,
                width: undefined,
                height: undefined,
                perimeter: undefined,
                totalPrice: totalPrice
            }
        });
        setIsDesignerOpen(false);
    };

    const validateItem = (): boolean => {
        const newItemErrors: Record<string, string> = {};

        if (itemType === 'material') {
            if (!itemFormData.materialId) { newItemErrors.materialId = "Selecione um material."; }
            if (!itemFormData.description?.trim()) { newItemErrors.description = "A descrição da peça é obrigatória."; }
            if (!(itemFormData.shapePoints && itemFormData.shapePoints.length > 0)) {
                if (!itemFormData.width || itemFormData.width <= 0) { newItemErrors.width = "Largura deve ser > 0."; }
                if (!itemFormData.height || itemFormData.height <= 0) { newItemErrors.height = "Altura deve ser > 0."; }
            }
        } else if (itemType === 'service') {
            const serviceExists = mockServices.some(s => s.id === itemFormData.id);
            if (!itemFormData.id || !serviceExists) {
                newItemErrors.id = "Selecione um serviço válido.";
            }
            if (!itemFormData.quantity || itemFormData.quantity <= 0) {
                newItemErrors.quantity = "Quantidade deve ser > 0.";
            }
        } else if (itemType === 'product') {
            const productExists = mockProducts.some(p => p.id === itemFormData.id);
            if (!itemFormData.id || !productExists) {
                newItemErrors.id = "Selecione um produto válido.";
            }
            if (!itemFormData.quantity || itemFormData.quantity <= 0) {
                newItemErrors.quantity = "Quantidade deve ser > 0.";
            }
        }

        setItemErrors(newItemErrors);
        return Object.keys(newItemErrors).length === 0;
    };

    const handleAddItem = () => {
        if (!validateItem()) return;
        
        let newItem: QuoteItem | null = null;
        const baseId = `item-${Date.now()}`;

        if (itemType === 'material') {
             if (itemFormData.shapePoints && itemFormData.shapePoints.length > 0) {
                newItem = {
                    id: baseId,
                    type: 'material',
                    description: `${itemFormData.description} (Custom) - ${itemFormData.materialName}`,
                    quantity: itemFormData.quantity!,
                    unitPrice: itemFormData.unitPrice!,
                    totalPrice: itemFormData.totalPrice!,
                    materialId: itemFormData.materialId,
                    shapePoints: itemFormData.shapePoints,
                };
             } else {
                 if (!itemFormData.width || !itemFormData.height || !itemFormData.description) return;
                newItem = {
                    id: baseId,
                    type: 'material',
                    description: `${itemFormData.description} - ${itemFormData.materialName}`,
                    quantity: itemFormData.quantity!,
                    unitPrice: itemFormData.unitPrice!,
                    totalPrice: itemFormData.totalPrice!,
                    width: itemFormData.width,
                    height: itemFormData.height,
                    perimeter: itemFormData.perimeter,
                    materialId: itemFormData.materialId
                };
             }
        } else if (itemType === 'service') {
            const service = mockServices.find(s => s.id === itemFormData.id);
            if (!service || !itemFormData.quantity) return;
            newItem = {
                id: baseId, type: 'service', description: service.name,
                quantity: parseFloat(itemFormData.quantity.toString()), unitPrice: service.price,
                totalPrice: parseFloat(itemFormData.quantity.toString()) * service.price,
            };
        } else if (itemType === 'product') {
            const product = mockProducts.find(p => p.id === itemFormData.id);
             if (!product || !itemFormData.quantity) return;
            newItem = {
                id: baseId, type: 'product', description: product.name,
                quantity: parseFloat(itemFormData.quantity.toString()), unitPrice: product.price,
                totalPrice: parseFloat(itemFormData.quantity.toString()) * product.price,
            };
        }

        if (newItem) {
            setQuote(prev => ({...prev, items: [...prev.items, newItem!]}));
            setItemFormData({});
            setItemErrors({});
            if (errors.items) {
                const newErrors = {...errors};
                delete newErrors.items;
                setErrors(newErrors);
            }
        }
    };

    const handleItemTypeChange = (type: QuoteItemType) => {
        setItemType(type);
        setItemFormData({});
        setItemErrors({});
    };

    const handleDeleteItem = (itemId: string) => {
        setQuote(prev => ({
            ...prev,
            items: prev.items.filter(item => item.id !== itemId)
        }));
    };
    
    const renderItemForm = () => {
        const baseInputClasses = "w-full p-2 border rounded bg-slate-50 dark:bg-slate-700";
        const getInputClasses = (field: string) => `${baseInputClasses} ${itemErrors[field] ? 'border-error' : 'border-border dark:border-slate-600'}`;
        const hasCustomShape = itemFormData.shapePoints && itemFormData.shapePoints.length > 0;

        switch (itemType) {
            case 'material':
                return <>
                    <div>
                        <div className="flex items-end space-x-2">
                            <div className="flex-grow">
                                <label className="text-sm font-medium text-text-secondary dark:text-slate-400">Material</label>
                                <input type="text" readOnly value={itemFormData.materialName || 'Nenhum material selecionado'} className={`w-full p-2 border rounded bg-slate-100 dark:bg-slate-800 ${itemErrors.materialId ? 'border-error' : 'border-border dark:border-slate-600'}`} />
                            </div>
                            <Button variant="secondary" onClick={() => setIsCatalogOpen(true)}>Procurar</Button>
                        </div>
                        <FieldError message={itemErrors.materialId} />
                    </div>
                    <div className="mt-2">
                        <input type="text" placeholder="Descrição da peça (Ex: Bancada)" value={itemFormData.description || ''} onChange={e => handleItemFormChange('description', e.target.value)} className={getInputClasses('description')}/>
                        <FieldError message={itemErrors.description} />
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                        <div>
                            <input type="number" placeholder="Largura (m)" value={itemFormData.width || ''} onChange={e => handleItemFormChange('width', parseFloat(e.target.value) || 0)} className={getInputClasses('width')} disabled={hasCustomShape}/>
                            <FieldError message={itemErrors.width} />
                        </div>
                        <div>
                            <input type="number" placeholder="Altura (m)" value={itemFormData.height || ''} onChange={e => handleItemFormChange('height', parseFloat(e.target.value) || 0)} className={getInputClasses('height')} disabled={hasCustomShape}/>
                            <FieldError message={itemErrors.height} />
                        </div>
                    </div>
                     <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => setIsDesignerOpen(true)}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" /></svg>
                        {hasCustomShape ? 'Editar Forma Customizada' : 'Usar Designer Visual'}
                    </Button>
                     <div className="grid grid-cols-2 gap-2 mt-2 text-sm bg-slate-100 dark:bg-slate-800/50 p-2 rounded">
                        <div>Área: <span className="font-semibold">{itemFormData.area?.toFixed(3) || '0.000'} m²</span></div>
                        {!hasCustomShape && <div>Perímetro: <span className="font-semibold">{itemFormData.perimeter?.toFixed(2) || '0.00'} m</span></div>}
                    </div>
                </>;
            case 'service':
                return <>
                    <div>
                        <select value={itemFormData.id || ''} onChange={e => handleItemFormChange('id', e.target.value)} className={getInputClasses('id')}>
                            <option value="">Selecione o Serviço</option>
                            {mockServices.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <FieldError message={itemErrors.id} />
                    </div>
                    <div className="mt-2">
                        <input type="number" placeholder="Quantidade" value={itemFormData.quantity || ''} onChange={e => handleItemFormChange('quantity', parseFloat(e.target.value) || 0)} className={getInputClasses('quantity')}/>
                        <FieldError message={itemErrors.quantity} />
                    </div>
                </>;
            case 'product':
                return <>
                    <div>
                        <select value={itemFormData.id || ''} onChange={e => handleItemFormChange('id', e.target.value)} className={getInputClasses('id')}>
                            <option value="">Selecione o Produto</option>
                            {mockProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <FieldError message={itemErrors.id} />
                    </div>
                    <div className="mt-2">
                        <input type="number" placeholder="Quantidade" value={itemFormData.quantity || ''} onChange={e => handleItemFormChange('quantity', parseFloat(e.target.value) || 0)} className={getInputClasses('quantity')}/>
                        <FieldError message={itemErrors.quantity} />
                    </div>
                </>;
        }
    }
    
    const handleOptimizationComplete = (updatedItems: QuoteItem[], waste: number) => {
        console.log("Waste:", waste);
        setQuote(prev => ({
            ...prev,
            items: prev.items.map(item => {
                const updated = updatedItems.find(u => u.id === item.id);
                return updated || item;
            })
        }));
        setIsOptimizerOpen(false);
    };

    const handleAttemptSave = (status: QuoteStatus) => {
        const isDraft = status === 'draft';
        
        // Clear previous 'items' error if it exists
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.items;
            return newErrors;
        });
    
        if (!validateQuote(isDraft)) {
            return;
        }
    
        if (!isDraft && quote.items.length === 0) {
            setErrors(prev => ({ ...prev, items: "O orçamento deve ter pelo menos um item para ser enviado ou aprovado." }));
            return;
        }
        
        onSave({ ...quote, status: status, ...totals });
    };

    const handleClientSelect = (clientId: string) => {
        if (!clientId) {
            setQuote(prev => ({ ...prev, clientName: '', clientEmail: '', clientPhone: '' }));
            return;
        }
        const selectedClient = mockClients.find(c => c.id === clientId);
        if (selectedClient) {
            setQuote(prev => ({
                ...prev,
                clientName: selectedClient.name,
                clientEmail: selectedClient.email,
                clientPhone: selectedClient.phone,
            }));
        }
    };

    return (
        <Card>
            <ShapeDesigner isOpen={isDesignerOpen} onClose={() => setIsDesignerOpen(false)} onComplete={handleShapeComplete} />
            <MaterialCatalogModal isOpen={isCatalogOpen} onClose={() => setIsCatalogOpen(false)} onSelect={handleMaterialSelect} />
            {isPreviewOpen && <DocumentPreview document={{...quote, ...totals}} onClose={() => setIsPreviewOpen(false)} />}
            {isOptimizerOpen && <CuttingOptimizer 
                items={quote.items.filter(i => i.type === 'material')}
                onClose={() => setIsOptimizerOpen(false)} 
                onComplete={handleOptimizationComplete}
            />}


            <CardHeader>{quote.id.startsWith('ORC') ? `Editando Orçamento ${quote.id}` : 'Novo Orçamento'}</CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="md:col-span-2">
                         <label htmlFor="client-select" className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">
                            Selecionar Cliente Existente (Opcional)
                        </label>
                        <select
                            id="client-select"
                            onChange={(e) => handleClientSelect(e.target.value)}
                            className="p-2 border rounded w-full bg-slate-50 dark:bg-slate-700 border-border dark:border-slate-600"
                        >
                            <option value="">-- Digitar novo cliente --</option>
                            {mockClients.map(client => (
                                <option key={client.id} value={client.id}>
                                    {client.name} - {client.cpfCnpj}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <input type="text" placeholder="Nome do Cliente" value={quote.clientName} onChange={e => setQuote({...quote, clientName: e.target.value})} className={`p-2 border rounded w-full bg-slate-50 dark:bg-slate-700 ${errors.clientName ? 'border-error' : 'border-border dark:border-slate-600'}`} />
                        <FieldError message={errors.clientName} />
                    </div>
                    <div>
                        <input type="email" placeholder="Email do Cliente" value={quote.clientEmail} onChange={e => setQuote({...quote, clientEmail: e.target.value})} className={`p-2 border rounded w-full bg-slate-50 dark:bg-slate-700 ${errors.clientEmail ? 'border-error' : 'border-border dark:border-slate-600'}`} />
                        <FieldError message={errors.clientEmail} />
                    </div>
                    <div>
                         <input type="text" placeholder="Telefone do Cliente" value={quote.clientPhone} onChange={e => setQuote({...quote, clientPhone: e.target.value})} className={`p-2 border rounded w-full bg-slate-50 dark:bg-slate-700 ${errors.clientPhone ? 'border-error' : 'border-border dark:border-slate-600'}`} />
                         <FieldError message={errors.clientPhone} />
                    </div>
                    <div className="md:col-span-2">
                        <textarea placeholder="Endereço de Entrega" value={quote.deliveryAddress} onChange={e => setQuote({...quote, deliveryAddress: e.target.value})} className="p-2 border rounded w-full bg-slate-50 dark:bg-slate-700 border-border dark:border-slate-600" rows={2}></textarea>
                    </div>
                </div>
            
                <div className="border-t border-border dark:border-slate-700 pt-4">
                     <h3 className="text-xl font-semibold text-text-primary dark:text-slate-100 mb-2">Itens do Orçamento</h3>
                     {errors.items && <div className="bg-red-100 dark:bg-red-900/50 border border-error dark:border-error text-error dark:text-red-300 px-4 py-3 rounded relative mb-4" role="alert">{errors.items}</div>}
                     <div className="lg:flex gap-4">
                        <div className="lg:w-1/3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-border dark:border-slate-700 mb-4 lg:mb-0">
                            <h4 className="font-semibold mb-3">Adicionar Novo Item</h4>
                            <div className="flex space-x-2 mb-4">
                                {(['material', 'service', 'product'] as QuoteItemType[]).map(type => (
                                    <button key={type} onClick={() => handleItemTypeChange(type)} className={`px-3 py-1 rounded text-sm ${itemType === type ? 'bg-primary text-white' : 'bg-slate-200 dark:bg-slate-700 dark:text-slate-200'}`}>
                                        {type === 'material' ? 'Material' : type === 'service' ? 'Serviço' : 'Produto'}
                                    </button>
                                ))}
                            </div>
                            {renderItemForm()}
                            <Button onClick={handleAddItem} className="w-full mt-3">Adicionar Item</Button>
                        </div>

                        <div className="lg:w-2/3">
                            <div className="flex justify-between items-center mb-2">
                                 <h4 className="font-semibold">Itens Adicionados</h4>
                                 <Button 
                                     variant="accent"
                                     size="sm"
                                     onClick={() => setIsOptimizerOpen(true)} 
                                     disabled={!quote.items.some(i => i.type === 'material')}
                                  >
                                    Otimizar Corte
                                 </Button>
                            </div>
                            <div className="overflow-x-auto border border-border dark:border-slate-700 rounded-lg max-h-80">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0"><tr className="border-b border-border dark:border-slate-700"><th className="p-2">Descrição</th><th className="p-2">Qtd.</th><th className="p-2">Preço Unit.</th><th className="p-2">Total</th><th className="p-2 text-center">Ações</th></tr></thead>
                                    <tbody>
                                        {quote.items.map(item => (
                                            <tr key={item.id} className="border-b border-border dark:border-slate-700">
                                                <td className="p-2">{item.description}</td>
                                                <td className="p-2">{item.quantity.toFixed(2)}</td>
                                                <td className="p-2">{item.unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                                <td className="p-2">{item.totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                                <td className="p-2 text-center">
                                                    <button 
                                                        onClick={() => handleDeleteItem(item.id)}
                                                        className="text-error hover:text-red-700 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                                                        aria-label={`Remover item ${item.description}`}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {quote.items.length === 0 && (
                                            <tr><td colSpan={5} className="text-center p-4 text-text-secondary dark:text-slate-400">Nenhum item adicionado.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <div className="text-right">
                        <p className="text-text-secondary dark:text-slate-400">Subtotal: <span className="font-semibold text-text-primary dark:text-slate-200">{totals.subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></p>
                        <p className="text-xl text-text-primary dark:text-slate-100 font-bold">Total: <span className="text-primary">{totals.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></p>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex justify-between items-center">
                <div>
                     <Button variant="ghost" onClick={() => setIsPreviewOpen(true)}>Gerar PDF</Button>
                </div>
                <div className="space-x-4">
                    <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
                    <Button variant="secondary" onClick={() => handleAttemptSave('draft')}>Salvar Rascunho</Button>
                    <Button variant="primary" onClick={() => handleAttemptSave('sent')}>Salvar e Enviar</Button>
                    <Button variant="primary" className="bg-success hover:bg-green-700" onClick={() => handleAttemptSave('approved')}>Aprovar e Converter em Pedido</Button>
                </div>
            </CardFooter>
        </Card>
    );
};

interface QuotesPageProps {
    searchTarget: { page: Page; id: string } | null;
    clearSearchTarget: () => void;
}

const QuotesPage: React.FC<QuotesPageProps> = ({ searchTarget, clearSearchTarget }) => {
    const [quotes, setQuotes] = useState<Quote[]>(mockQuotes);
    const [currentView, setCurrentView] = useState<'list' | 'form'>('list');
    const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);

    const [clientFilter, setClientFilter] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<QuoteStatus | ''>('');
    const [salespersonFilter, setSalespersonFilter] = useState('');
    const [showArchived, setShowArchived] = useState(false);

    const processedQuotes = useMemo(() => {
        const now = new Date();
        const archiveLimit = 120 * 24 * 60 * 60 * 1000; // 120 days in milliseconds

        return quotes.map(quote => {
            const isOld = now.getTime() - new Date(quote.createdAt).getTime() > archiveLimit;
            if ((quote.status === 'draft' || quote.status === 'sent') && isOld) {
                return { ...quote, status: 'archived' as QuoteStatus };
            }
            return quote;
        });
    }, [quotes]);


    const filteredQuotes = useMemo(() => {
        return processedQuotes.filter(quote => {
             if (showArchived) {
                if (quote.status !== 'archived') return false;
            } else {
                if (quote.status === 'archived') return false;
            }

            const clientMatch = clientFilter 
                ? quote.clientName.toLowerCase().includes(clientFilter.toLowerCase()) 
                : true;
            
            const dateMatch = dateFilter 
                ? new Date(quote.createdAt).toISOString().split('T')[0] === dateFilter 
                : true;

            const statusMatch = statusFilter 
                ? quote.status === statusFilter 
                : true;
            
            const salespersonMatch = salespersonFilter
                ? quote.salespersonId === salespersonFilter
                : true;

            return clientMatch && dateMatch && statusMatch && salespersonMatch;
        });
    }, [processedQuotes, clientFilter, dateFilter, statusFilter, salespersonFilter, showArchived]);

    const handleNew = () => {
        setSelectedQuote({
            id: `new-${Date.now()}`,
            clientName: '', clientEmail: '', clientPhone: '', deliveryAddress: '',
            status: 'draft', items: [], subtotal: 0, total: 0,
            createdAt: new Date().toISOString()
        });
        setCurrentView('form');
    };

    const handleEdit = (quote: Quote) => {
        const originalQuote = quotes.find(q => q.id === quote.id) || quote;
        setSelectedQuote(JSON.parse(JSON.stringify(originalQuote))); // Deep copy to avoid mutation issues
        setCurrentView('form');
    };

    useEffect(() => {
        if (searchTarget && searchTarget.page === 'quotes') {
            const quote = quotes.find(q => q.id === searchTarget.id);
            if (quote) {
                handleEdit(quote);
            }
            clearSearchTarget();
        }
    }, [searchTarget, quotes, clearSearchTarget]);

    const handleSave = (quoteToSave: Quote) => {
        // FIX: 'totals' was used before it was declared.
        const totals = {
            subtotal: quoteToSave.items.reduce((acc, item) => acc + item.totalPrice, 0),
            total: quoteToSave.items.reduce((acc, item) => acc + item.totalPrice, 0),
        }
        const quoteWithTotals = {...quoteToSave, ...totals};

        if (quoteToSave.id.startsWith('new-')) {
            const newId = `ORC-2024-${(mockQuotes.length + quotes.length + 1).toString().padStart(3, '0')}`;
            setQuotes([...quotes, { ...quoteWithTotals, id: newId }]);
        } else {
            setQuotes(quotes.map(q => q.id === quoteToSave.id ? quoteWithTotals : q));
        }
        setCurrentView('list');
        setSelectedQuote(null);
    };

    const handleCancel = () => {
        setCurrentView('list');
        setSelectedQuote(null);
    };

    return (
        <div>
            {currentView === 'list' && (
                <QuoteList 
                    quotes={filteredQuotes} 
                    onNew={handleNew} 
                    onEdit={handleEdit}
                    clientFilter={clientFilter}
                    onClientFilterChange={setClientFilter}
                    dateFilter={dateFilter}
                    onDateFilterChange={setDateFilter}
                    statusFilter={statusFilter}
                    onStatusFilterChange={setStatusFilter}
                    salespersonFilter={salespersonFilter}
                    onSalespersonFilterChange={setSalespersonFilter}
                    showArchived={showArchived}
                    onShowArchivedChange={setShowArchived}
                />
            )}
            {currentView === 'form' && selectedQuote && <QuoteForm quote={selectedQuote} onSave={handleSave} onCancel={handleCancel} />}
        </div>
    );
};

export default QuotesPage;