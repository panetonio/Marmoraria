import React, { useState, useMemo, useCallback, useEffect } from 'react';
import type { Quote, QuoteItem, QuoteItemType, QuoteStatus, User, Material, Client, Page, SortDirection, PaymentMethod, Address } from '../types';
import { mockUsers } from '../data/mockData';
import DocumentPreview from '../components/QuotePreview';
import CuttingOptimizer from '../components/CuttingOptimizer';
import ShapeDesigner from '../components/ShapeDesigner';
import Card, { CardContent, CardHeader, CardFooter } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { useData } from '../context/DataContext';
import StatusBadge from '../components/ui/StatusBadge';
import { quoteStatusMap } from '../config/statusMaps';
import Input from '../components/ui/Input';
import Textarea from '../components/ui/Textarea';
import FreightCalculator from '../components/FreightCalculator';
import { calculateQuoteItem, validateQuoteItem } from '../utils/helpers';
import AddressForm from '../components/AddressForm';
import Select from '../components/ui/Select';


const QuoteList: React.FC<{
    quotes: Quote[];
    onNew: () => void;
    onEdit: (quote: Quote) => void;
    onArchiveToggle: (quote: Quote) => void;
    clientFilter: string;
    onClientFilterChange: (value: string) => void;
    startDateFilter: string;
    onStartDateFilterChange: (value: string) => void;
    endDateFilter: string;
    onEndDateFilterChange: (value: string) => void;
    statusFilter: QuoteStatus | '';
    onStatusFilterChange: (value: QuoteStatus | '') => void;
    salespersonFilter: string;
    onSalespersonFilterChange: (value: string) => void;
    showArchived: boolean;
    onShowArchivedChange: (show: boolean) => void;
    sortConfig: { key: keyof Quote | null; direction: SortDirection };
    onSort: (key: keyof Quote) => void;
}> = ({ 
    quotes, onNew, onEdit, onArchiveToggle,
    clientFilter, onClientFilterChange, 
    startDateFilter, onStartDateFilterChange,
    endDateFilter, onEndDateFilterChange,
    statusFilter, onStatusFilterChange,
    salespersonFilter, onSalespersonFilterChange,
    showArchived, onShowArchivedChange,
    sortConfig, onSort,
 }) => {
    
    const statusLabels = {
        draft: "Rascunho",
        sent: "Enviado",
        approved: "Aprovado",
        rejected: "Rejeitado",
        archived: "Arquivado",
    };

    const salespeople = useMemo(() => mockUsers.filter(u => u.role === 'vendedor'), []);

    const SortableTh: React.FC<{ children: React.ReactNode, columnKey: keyof Quote }> = ({ children, columnKey }) => {
        const isSorted = sortConfig.key === columnKey;
        const directionIcon = sortConfig.direction === 'ascending' ? '▲' : '▼';
        return (
            <th className="p-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => onSort(columnKey)}>
                <div className="flex items-center space-x-1">
                    <span>{children}</span>
                    {isSorted && <span className="text-primary text-xs">{directionIcon}</span>}
                </div>
            </th>
        );
    };
    
    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-semibold text-text-primary dark:text-slate-100">{showArchived ? 'Orçamentos Arquivados' : 'Orçamentos'}</h2>
                    <Button onClick={onNew}>Novo Orçamento</Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-border dark:border-slate-700">
                    <div className="sm:col-span-2 lg:col-span-1">
                        <Input
                            id="client-filter-quotes"
                            label="Cliente"
                            type="text"
                            placeholder="Filtrar por Cliente..."
                            value={clientFilter}
                            onChange={(e) => onClientFilterChange(e.target.value)}
                        />
                    </div>
                    <div>
                        <Input
                            id="start-date-filter-quotes"
                            label="Data Início"
                            type="date"
                            value={startDateFilter}
                            onChange={(e) => onStartDateFilterChange(e.target.value)}
                            className="text-text-secondary dark:text-slate-300"
                        />
                    </div>
                    <div>
                        <Input
                            id="end-date-filter-quotes"
                            label="Data Final"
                            type="date"
                            value={endDateFilter}
                            onChange={(e) => onEndDateFilterChange(e.target.value)}
                            className="text-text-secondary dark:text-slate-300"
                        />
                    </div>
                    <div>
                        <Select
                            id="status-filter-quotes"
                            label="Status"
                            value={statusFilter}
                            onChange={(e) => onStatusFilterChange(e.target.value as QuoteStatus | '')}
                        >
                            <option value="">Todos os Status</option>
                            {Object.entries(statusLabels)
                                .filter(([value]) => showArchived ? value === 'archived' : value !== 'archived')
                                .map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </Select>
                    </div>
                    <div>
                        <Select
                            id="salesperson-filter-quotes"
                            label="Vendedor"
                            value={salespersonFilter}
                            onChange={(e) => onSalespersonFilterChange(e.target.value)}
                        >
                            <option value="">Todos os Vendedores</option>
                            {salespeople.map(user => (
                                <option key={user.id} value={user.id}>{user.name}</option>
                            ))}
                        </Select>
                    </div>
                    <div className="flex items-end justify-start sm:col-span-2 lg:col-span-5 lg:justify-end">
                         <Button variant={showArchived ? 'primary' : 'ghost'} onClick={() => onShowArchivedChange(!showArchived)}>
                            {showArchived ? 'Ver Ativos' : 'Ver Arquivados'}
                        </Button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-border dark:border-slate-700">
                                <SortableTh columnKey="id">ID</SortableTh>
                                <SortableTh columnKey="clientName">Cliente</SortableTh>
                                <SortableTh columnKey="createdAt">Data</SortableTh>
                                <SortableTh columnKey="total">Total</SortableTh>
                                <SortableTh columnKey="status">Status</SortableTh>
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
                                    <td className="p-3"><StatusBadge status={quote.status} statusMap={quoteStatusMap} /></td>
                                    <td className="p-3 space-x-2">
                                        <button onClick={() => onEdit(quote)} className="text-primary hover:underline font-semibold text-sm">Editar</button>
                                         {(quote.status === 'draft' || quote.status === 'sent') && (
                                            <button onClick={() => onArchiveToggle(quote)} className="text-secondary-hover hover:underline font-semibold text-sm">Arquivar</button>
                                        )}
                                        {quote.status === 'archived' && (
                                            <button onClick={() => onArchiveToggle(quote)} className="text-green-600 hover:underline font-semibold text-sm">Restaurar</button>
                                        )}
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
    const { materials } = useData();
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Catálogo de Materiais" className="max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {materials.map(material => (
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

const QuoteForm: React.FC<{ quote: Quote; onSave: (quote: Quote) => void; onCancel: () => void }> = ({ quote: initialQuote, onSave, onCancel }) => {
    const { materials, services, products, clients, freightCostPerKm } = useData();
    const [quote, setQuote] = useState<Quote>(initialQuote);
    const [itemType, setItemType] = useState<QuoteItemType>('material');
    
    const [itemFormData, setItemFormData] = useState<Partial<QuoteItem & { materialName?: string, area?: number, perimeter?: number }>>({});
    
    const [isCatalogOpen, setIsCatalogOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isOptimizerOpen, setIsOptimizerOpen] = useState(false);
    const [isDesignerOpen, setIsDesignerOpen] = useState(false);
    const [isFreightCalculatorOpen, setIsFreightCalculatorOpen] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [itemErrors, setItemErrors] = useState<Record<string, string>>({});
    
    const totals = useMemo(() => {
        const subtotal = quote.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
        const itemDiscounts = quote.items.reduce((acc, item) => acc + (item.discount || 0), 0);
        const subtotalAfterItemDiscounts = subtotal - itemDiscounts;
        const total = subtotalAfterItemDiscounts - (quote.discount || 0) + (quote.freight || 0);
        return { subtotal, total };
    }, [quote.items, quote.discount, quote.freight]);

    const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
        pix: 'PIX',
        cartao_credito: 'Cartão de Crédito',
        boleto: 'Boleto Bancário',
        dinheiro: 'Dinheiro',
    };

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
            if (!quote.paymentMethod) {
                newErrors.paymentMethod = "A forma de pagamento é obrigatória.";
            } else if (quote.paymentMethod === 'cartao_credito' && (!quote.installments || quote.installments < 1)) {
                newErrors.installments = "O número de parcelas deve ser 1 ou mais.";
            }
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    
    const handleMaterialSelect = (material: Material) => {
        const updatedData = {
            ...itemFormData,
            materialId: material.id,
            unitPrice: material.costPerSqM,
            materialName: material.name,
        };
        setItemFormData(calculateQuoteItem(updatedData));
        if (itemErrors.materialId) {
            const newItemErrors = { ...itemErrors };
            delete newItemErrors.materialId;
            setItemErrors(newItemErrors);
        }
        setIsCatalogOpen(false);
    };

    const handleItemFormChange = (field: keyof QuoteItem, value: any) => {
        let baseData = { ...itemFormData, type: itemType, [field]: value };

        if (field === 'id') {
            if (itemType === 'service') {
                const service = services.find(s => s.id === value);
                if (service) baseData.unitPrice = service.price;
            } else if (itemType === 'product') {
                const product = products.find(p => p.id === value);
                if (product) baseData.unitPrice = product.price;
            }
        }

        const updatedData = calculateQuoteItem(baseData);
        setItemFormData(updatedData);
        if (itemErrors[field as string]) {
            const newItemErrors = { ...itemErrors };
            delete newItemErrors[field as string];
            setItemErrors(newItemErrors);
        }
    };
    
    const handleShapeComplete = (data: { area: number, points: { x: number, y: number }[] }) => {
        setItemFormData(prev => {
             const updatedData = calculateQuoteItem({
                ...prev,
                quantity: data.area,
                area: data.area,
                shapePoints: data.points,
                width: undefined,
                height: undefined,
                perimeter: undefined,
            });
            return updatedData;
        });
        setIsDesignerOpen(false);
    };

    const validateItem = (): boolean => {
        const newItemErrors = validateQuoteItem(itemFormData, itemType, services, products);
        setItemErrors(newItemErrors);
        return Object.keys(newItemErrors).length === 0;
    };

    const handleAddItem = () => {
        if (!validateItem()) return;
        
        let newItem: QuoteItem | null = null;
        const baseId = `item-${Date.now()}`;
        
        const commonData = {
            id: baseId,
            quantity: itemFormData.quantity!,
            unitPrice: itemFormData.unitPrice!,
            totalPrice: itemFormData.totalPrice!,
            discount: itemFormData.discount,
        };

        if (itemType === 'material') {
            newItem = {
                ...commonData,
                type: 'material',
                description: `${itemFormData.description} - ${itemFormData.materialName}`,
                width: itemFormData.width,
                height: itemFormData.height,
                perimeter: itemFormData.perimeter,
                materialId: itemFormData.materialId,
                shapePoints: itemFormData.shapePoints,
            };
        } else if (itemType === 'service') {
            const service = services.find(s => s.id === itemFormData.id);
            if (!service) return;
            newItem = { ...commonData, type: 'service', description: service.name };
        } else if (itemType === 'product') {
            const product = products.find(p => p.id === itemFormData.id);
            if (!product) return;
            newItem = { ...commonData, type: 'product', description: product.name };
        }

        if (newItem) {
            setQuote(prev => ({...prev, items: [...prev.items, newItem!]}));
            setItemFormData({unitPrice: 0, quantity: 0});
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
        setItemFormData({unitPrice: 0, quantity: 0});
        setItemErrors({});
    };

    const handleDeleteItem = (itemId: string) => {
        setQuote(prev => ({
            ...prev,
            items: prev.items.filter(item => item.id !== itemId)
        }));
    };
    
    const renderItemForm = () => {
        const hasCustomShape = itemFormData.shapePoints && itemFormData.shapePoints.length > 0;

        switch (itemType) {
            case 'material':
                return <>
                    <div>
                        <div className="flex items-end space-x-2">
                             <Input
                                label="Material"
                                id="material-name"
                                readOnly
                                value={itemFormData.materialName || 'Nenhum material selecionado'}
                                error={itemErrors.materialId}
                                className="bg-slate-100 dark:bg-slate-800 flex-grow"
                            />
                            <Button variant="secondary" onClick={() => setIsCatalogOpen(true)}>Procurar</Button>
                        </div>
                    </div>
                    <div className="mt-2">
                        <Input
                            placeholder="Descrição da peça (Ex: Bancada)"
                            value={itemFormData.description || ''}
                            onChange={e => handleItemFormChange('description', e.target.value)}
                            error={itemErrors.description}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                        <Input
                            type="number"
                            placeholder="Largura (m)"
                            value={itemFormData.width || ''}
                            onChange={e => handleItemFormChange('width', parseFloat(e.target.value) || 0)}
                            error={itemErrors.width}
                            disabled={hasCustomShape}
                        />
                         <Input
                            type="number"
                            placeholder="Altura (m)"
                            value={itemFormData.height || ''}
                            onChange={e => handleItemFormChange('height', parseFloat(e.target.value) || 0)}
                            error={itemErrors.height}
                            disabled={hasCustomShape}
                        />
                    </div>
                     <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => setIsDesignerOpen(true)}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" /></svg>
                        {hasCustomShape ? 'Editar Forma Customizada' : 'Usar Designer Visual'}
                    </Button>
                    <div className="mt-2">
                        <Input
                            type="number"
                            placeholder="Desconto (R$)"
                            value={itemFormData.discount || ''}
                            onChange={e => handleItemFormChange('discount', parseFloat(e.target.value) || 0)}
                            error={itemErrors.discount}
                        />
                    </div>
                     <div className="grid grid-cols-2 gap-2 mt-2 text-sm bg-slate-100 dark:bg-slate-800/50 p-2 rounded">
                        <div>Área: <span className="font-semibold">{itemFormData.area?.toFixed(3) || '0.000'} m²</span></div>
                        {!hasCustomShape && <div>Perímetro: <span className="font-semibold">{itemFormData.perimeter?.toFixed(2) || '0.00'} m</span></div>}
                    </div>
                </>;
            case 'service':
                return <>
                    <Select
                        value={itemFormData.id || ''}
                        onChange={e => handleItemFormChange('id', e.target.value)}
                        error={itemErrors.id}
                    >
                        <option value="">Selecione o Serviço</option>
                        {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </Select>
                    <div className="mt-2">
                        <Input
                            type="number"
                            placeholder="Quantidade"
                            value={itemFormData.quantity || ''}
                            onChange={e => handleItemFormChange('quantity', parseFloat(e.target.value) || 0)}
                            error={itemErrors.quantity}
                        />
                    </div>
                    <div className="mt-2">
                        <Input
                            type="number"
                            placeholder="Desconto (R$)"
                            value={itemFormData.discount || ''}
                            onChange={e => handleItemFormChange('discount', parseFloat(e.target.value) || 0)}
                            error={itemErrors.discount}
                        />
                    </div>
                </>;
            case 'product':
                return <>
                    <Select
                        value={itemFormData.id || ''}
                        onChange={e => handleItemFormChange('id', e.target.value)}
                        error={itemErrors.id}
                    >
                        <option value="">Selecione o Produto</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </Select>
                    <div className="mt-2">
                        <Input
                            type="number"
                            placeholder="Quantidade"
                            value={itemFormData.quantity || ''}
                            onChange={e => handleItemFormChange('quantity', parseFloat(e.target.value) || 0)}
                            error={itemErrors.quantity}
                        />
                    </div>
                    <div className="mt-2">
                       <Input
                            type="number"
                            placeholder="Desconto (R$)"
                            value={itemFormData.discount || ''}
                            onChange={e => handleItemFormChange('discount', parseFloat(e.target.value) || 0)}
                            error={itemErrors.discount}
                        />
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
            delete newErrors.paymentMethod;
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
        const emptyAddress: Address = { cep: '', uf: '', city: '', neighborhood: '', address: '', number: '' };
        if (!clientId) {
            setQuote(prev => ({ ...prev, clientName: '', clientEmail: '', clientPhone: '', deliveryAddress: emptyAddress }));
            return;
        }
        const selectedClient = clients.find(c => c.id === clientId);
        if (selectedClient) {
            setQuote(prev => ({
                ...prev,
                clientName: selectedClient.name,
                clientEmail: selectedClient.email,
                clientPhone: selectedClient.phone,
                deliveryAddress: selectedClient.address,
            }));
        }
    };
    
    const handleDeliveryAddressChange = (field: keyof Address, value: string) => {
        setQuote(prev => ({
            ...prev,
            deliveryAddress: { ...prev.deliveryAddress, [field]: value }
        }));
    };
    
    const handleApplyFreight = (calculatedFreight: number) => {
        setQuote(prev => ({...prev, freight: calculatedFreight }));
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
            <FreightCalculator 
                isOpen={isFreightCalculatorOpen}
                onClose={() => setIsFreightCalculatorOpen(false)}
                onApply={handleApplyFreight}
                costPerKm={freightCostPerKm}
            />


            <CardHeader>{quote.id.startsWith('ORC') ? `Editando Orçamento ${quote.id}` : 'Novo Orçamento'}</CardHeader>
            <CardContent>
                <div className="space-y-4 mb-6">
                    <h3 className="text-lg font-semibold text-text-primary dark:text-slate-100 border-b border-border dark:border-slate-700 pb-2">Dados do Cliente</h3>
                     <div className="md:col-span-2">
                        <Select
                            label="Selecionar Cliente Existente (Opcional)"
                            id="client-select"
                            onChange={(e) => handleClientSelect(e.target.value)}
                        >
                            <option value="">-- Digitar novo cliente --</option>
                            {clients.map(client => (
                                <option key={client.id} value={client.id}>
                                    {client.name} - {client.cpfCnpj}
                                </option>
                            ))}
                        </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Nome do Cliente"
                            id="client-name"
                            value={quote.clientName}
                            onChange={e => setQuote({...quote, clientName: e.target.value})}
                            error={errors.clientName}
                        />
                        <Input
                            label="Email do Cliente"
                            id="client-email"
                            type="email"
                            value={quote.clientEmail}
                            onChange={e => setQuote({...quote, clientEmail: e.target.value})}
                            error={errors.clientEmail}
                        />
                        <Input
                             label="Telefone do Cliente"
                             id="client-phone"
                             value={quote.clientPhone}
                             onChange={e => setQuote({...quote, clientPhone: e.target.value})}
                             error={errors.clientPhone}
                        />
                    </div>
                </div>

                <div className="space-y-4 mb-6">
                    <h3 className="text-lg font-semibold text-text-primary dark:text-slate-100 border-b border-border dark:border-slate-700 pb-2">Endereço de Entrega</h3>
                    <AddressForm
                        address={quote.deliveryAddress}
                        onAddressChange={handleDeliveryAddressChange}
                        errors={{}} // Validation for delivery address is not implemented yet
                    />
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
                                    <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0"><tr className="border-b border-border dark:border-slate-700"><th className="p-2">Descrição</th><th className="p-2">Qtd.</th><th className="p-2">Preço Unit.</th><th className="p-2">Desconto</th><th className="p-2">Total</th><th className="p-2 text-center">Ações</th></tr></thead>
                                    <tbody>
                                        {quote.items.map(item => (
                                            <tr key={item.id} className="border-b border-border dark:border-slate-700">
                                                <td className="p-2">{item.description}</td>
                                                <td className="p-2">{item.quantity.toFixed(2)}</td>
                                                <td className="p-2">{item.unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                                <td className="p-2 text-red-600 dark:text-red-400">{item.discount ? `- ${item.discount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` : '-'}</td>
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
                                            <tr><td colSpan={6} className="text-center p-4 text-text-secondary dark:text-slate-400">Nenhum item adicionado.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <div className="w-full max-w-sm space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-text-secondary dark:text-slate-400">Subtotal:</span>
                            <span className="font-semibold text-text-primary dark:text-slate-200">{totals.subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </div>
                        <div className="flex justify-between items-center">
                             <Input
                                type="number"
                                label="Desconto (R$):"
                                id="quote-discount"
                                placeholder="0,00"
                                value={quote.discount || ''}
                                onChange={e => setQuote({...quote, discount: parseFloat(e.target.value) || 0})}
                                className="w-32 text-right"
                            />
                        </div>
                        <div className="flex justify-between items-center">
                             <Input
                                type="number"
                                label="Frete (R$):"
                                id="quote-freight"
                                placeholder="0,00"
                                value={quote.freight || ''}
                                onChange={e => setQuote({...quote, freight: parseFloat(e.target.value) || 0})}
                                className="w-32 text-right"
                                endAdornment={
                                    <button type="button" onClick={() => setIsFreightCalculatorOpen(true)} className="pointer-events-auto text-text-secondary hover:text-primary dark:text-slate-400 dark:hover:text-slate-200" aria-label="Calcular Frete">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zM6 7a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm0 3a1 1 0 000 2h6a1 1 0 100-2H6zm-1 4a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                }
                            />
                        </div>
                        <div className="flex justify-between items-center text-xl text-text-primary dark:text-slate-100 font-bold pt-2 border-t border-border dark:border-slate-700">
                            <span>Total:</span>
                            <span className="text-primary">{totals.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </div>
                    </div>
                </div>

                 <div className="mt-6 border-t border-border dark:border-slate-700 pt-6">
                    <h3 className="text-lg font-semibold text-text-primary dark:text-slate-100 mb-2">Forma de Pagamento</h3>
                    {errors.paymentMethod && <p className="text-error text-sm mb-2">{errors.paymentMethod}</p>}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select
                            label="Método"
                            id="payment-method"
                            value={quote.paymentMethod || ''}
                            onChange={e => {
                                const method = e.target.value as PaymentMethod;
                                setQuote({...quote, paymentMethod: method, installments: method === 'cartao_credito' ? (quote.installments || 1) : undefined })
                            }}
                            error={errors.paymentMethod}
                        >
                            <option value="">-- Selecione --</option>
                            {Object.entries(PAYMENT_METHOD_LABELS).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </Select>
                        {quote.paymentMethod === 'cartao_credito' && (
                            <div>
                                <Input
                                    label="Nº de Parcelas"
                                    id="installments"
                                    type="number"
                                    min="1"
                                    value={quote.installments || ''}
                                    onChange={e => setQuote({...quote, installments: parseInt(e.target.value, 10) || 1})}
                                    error={errors.installments}
                                />
                            </div>
                        )}
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
    const { quotes, saveQuote } = useData();
    const [currentView, setCurrentView] = useState<'list' | 'form'>('list');
    const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);

    const [clientFilter, setClientFilter] = useState('');
    const [startDateFilter, setStartDateFilter] = useState('');
    const [endDateFilter, setEndDateFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<QuoteStatus | ''>('');
    const [salespersonFilter, setSalespersonFilter] = useState('');
    const [showArchived, setShowArchived] = useState(false);
    const [sortConfig, setSortConfig] = useState<{ key: keyof Quote | null; direction: SortDirection }>({ key: 'createdAt', direction: 'descending' });

    const handleSort = (key: keyof Quote) => {
        let direction: SortDirection = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const handleArchiveToggle = (quote: Quote) => {
        const newStatus = quote.status === 'archived' ? 'draft' : 'archived';
        saveQuote({ ...quote, status: newStatus });
    };

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
        let filtered = processedQuotes.filter(quote => {
             if (showArchived) {
                if (quote.status !== 'archived') return false;
            } else {
                if (quote.status === 'archived') return false;
            }

            const clientMatch = clientFilter 
                ? quote.clientName.toLowerCase().includes(clientFilter.toLowerCase()) 
                : true;

            const date = new Date(quote.createdAt);
            const startMatch = startDateFilter ? new Date(startDateFilter) <= date : true;
            
            const end = endDateFilter ? new Date(endDateFilter) : null;
            if (end) {
                // Set to the beginning of the next day in UTC to include the entire selected end day
                end.setUTCDate(end.getUTCDate() + 1);
            }
            const endMatch = end ? date < end : true;


            const statusMatch = statusFilter 
                ? quote.status === statusFilter 
                : true;
            
            const salespersonMatch = salespersonFilter
                ? quote.salespersonId === salespersonFilter
                : true;

            return clientMatch && startMatch && endMatch && statusMatch && salespersonMatch;
        });

        if (sortConfig.key) {
            filtered.sort((a, b) => {
                const aValue = a[sortConfig.key!];
                const bValue = b[sortConfig.key!];

                if (aValue === null || aValue === undefined) return 1;
                if (bValue === null || bValue === undefined) return -1;
    
                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        
        return filtered;
    }, [processedQuotes, clientFilter, startDateFilter, endDateFilter, statusFilter, salespersonFilter, showArchived, sortConfig]);

    const handleNew = () => {
        setSelectedQuote({
            id: `new-${Date.now()}`,
            clientName: '', clientEmail: '', clientPhone: '', 
            deliveryAddress: { cep: '', uf: '', city: '', neighborhood: '', address: '', number: '' },
            status: 'draft', items: [], subtotal: 0, total: 0,
            discount: 0,
            freight: 0,
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
        saveQuote(quoteToSave);
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
                    onArchiveToggle={handleArchiveToggle}
                    clientFilter={clientFilter}
                    onClientFilterChange={setClientFilter}
                    startDateFilter={startDateFilter}
                    onStartDateFilterChange={setStartDateFilter}
                    endDateFilter={endDateFilter}
                    onEndDateFilterChange={setEndDateFilter}
                    statusFilter={statusFilter}
                    onStatusFilterChange={setStatusFilter}
                    salespersonFilter={salespersonFilter}
                    onSalespersonFilterChange={setSalespersonFilter}
                    showArchived={showArchived}
                    onShowArchivedChange={setShowArchived}
                    sortConfig={sortConfig}
                    onSort={handleSort}
                />
            )}
            {currentView === 'form' && selectedQuote && <QuoteForm quote={selectedQuote} onSave={handleSave} onCancel={handleCancel} />}
        </div>
    );
};

export default QuotesPage;