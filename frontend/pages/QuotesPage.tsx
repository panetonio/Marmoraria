import React, { useState, useMemo, useCallback, useEffect } from 'react';
import type { Quote, QuoteItem, QuoteItemType, QuoteStatus, User, Material, Client, Page, SortDirection, PaymentMethod, Address, ItemCategory } from '../types';
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
import DateInput from '../components/ui/DateInput';
import Textarea from '../components/ui/Textarea';
import FreightCalculator from '../components/FreightCalculator';
import { calculateQuoteItem, validateQuoteItem, validateAddress } from '../utils/helpers';
import AddressForm from '../components/AddressForm';
import Select from '../components/ui/Select';
import { formatDate } from '../utils/dateFormat';


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
                        <DateInput
                            id="start-date-filter-quotes"
                            label="Data Início"
                            value={startDateFilter}
                            onChange={(value) => onStartDateFilterChange(value)}
                        />
                    </div>
                    <div>
                        <DateInput
                            id="end-date-filter-quotes"
                            label="Data Final"
                            value={endDateFilter}
                            onChange={(value) => onEndDateFilterChange(value)}
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
                                    <td className="p-3">{formatDate(quote.createdAt)}</td>
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
    const [itemCategory, setItemCategory] = useState<string>('');
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    
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
            } else if (quote.paymentMethod === 'cartao_credito' && (!quote.installments || quote.installments < 1 || quote.installments > 12)) {
                newErrors.installments = "O número de parcelas deve ser entre 1 e 12.";
            }
            // Validar endereço de entrega quando não for rascunho
            const addressErrors = validateAddress(quote.deliveryAddress);
            Object.assign(newErrors, addressErrors);
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

    const handleSaveItem = () => {
        if (!validateItem()) return;
        
        let updatedItem: QuoteItem | null = null;
        const baseId = editingItemId || `item-${Date.now()}`;
        
        const commonData = {
            id: baseId,
            quantity: itemFormData.quantity!,
            unitPrice: itemFormData.unitPrice!,
            totalPrice: itemFormData.totalPrice!,
            discount: itemFormData.discount,
        };

        if (itemType === 'material') {
            updatedItem = {
                ...commonData,
                type: 'material',
                description: `${itemFormData.description} - ${itemFormData.materialName}`,
                width: itemFormData.width,
                height: itemFormData.height,
                perimeter: itemFormData.perimeter,
                materialId: itemFormData.materialId,
                shapePoints: itemFormData.shapePoints,
                ...(itemCategory && { category: itemCategory }),
            };
        } else if (itemType === 'service') {
            const service = services.find(s => s.id === itemFormData.id);
            if (!service) return;
            updatedItem = { ...commonData, type: 'service', description: service.name };
        } else if (itemType === 'product') {
            const product = products.find(p => p.id === itemFormData.id);
            if (!product) return;
            updatedItem = { ...commonData, type: 'product', description: product.name };
        }

        if (updatedItem) {
            if (editingItemId) {
                // Atualizar item existente
                setQuote(prev => ({
                    ...prev,
                    items: prev.items.map(item => item.id === editingItemId ? updatedItem! : item)
                }));
            } else {
                // Adicionar novo item
                setQuote(prev => ({...prev, items: [...prev.items, updatedItem!]}));
            }
            
            setItemFormData({unitPrice: 0, quantity: 0});
            setItemCategory('');
            setItemErrors({});
            setEditingItemId(null);
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
        setItemCategory('');
        setItemErrors({});
    };

    const handleDeleteItem = (itemId: string) => {
        setQuote(prev => ({
            ...prev,
            items: prev.items.filter(item => item.id !== itemId)
        }));
        // Se estiver editando o item que foi deletado, limpar edição
        if (editingItemId === itemId) {
            setEditingItemId(null);
            setItemFormData({unitPrice: 0, quantity: 0});
            setItemErrors({});
        }
    };

    const handleEditItem = (item: QuoteItem) => {
        setEditingItemId(item.id);
        setItemType(item.type);
        
        // Preencher o formulário com os dados do item
        if (item.type === 'material') {
            const material = materials.find(m => m.id === item.materialId);
            const descriptionParts = item.description.split(' - ');
            setItemFormData({
                ...item,
                description: descriptionParts[0],
                materialName: material?.name || descriptionParts[1],
                area: item.width && item.height ? item.width * item.height : item.quantity,
            });
            setItemCategory(item.category || '');
        } else if (item.type === 'service') {
            const service = services.find(s => s.name === item.description);
            setItemFormData({
                ...item,
                id: service?.id,
            });
            setItemCategory('');
        } else if (item.type === 'product') {
            const product = products.find(p => p.name === item.description);
            setItemFormData({
                ...item,
                id: product?.id,
            });
            setItemCategory('');
        }
        
        // Scroll para o formulário de item
        const itemFormElement = document.getElementById('item-form-section');
        if (itemFormElement) {
            itemFormElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const handleCancelEdit = () => {
        setEditingItemId(null);
        setItemFormData({unitPrice: 0, quantity: 0});
        setItemCategory('');
        setItemErrors({});
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
                    <div className="mt-2">
                        <Select
                            label="Categoria da Peça (Opcional)"
                            value={itemCategory}
                            onChange={e => setItemCategory(e.target.value)}
                        >
                            <option value="">-- Selecione uma categoria --</option>
                            <option value="pia">Pia</option>
                            <option value="bancada">Bancada</option>
                            <option value="soleira">Soleira</option>
                            <option value="revestimento">Revestimento</option>
                            <option value="peitoril">Peitoril</option>
                            <option value="outro">Outro</option>
                        </Select>
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
            setQuote(prev => ({ ...prev, clientName: '', clientEmail: '', clientPhone: '', clientCpf: '', deliveryAddress: emptyAddress }));
            return;
        }
        const selectedClient = clients.find(c => c.id === clientId);
        if (selectedClient) {
            setQuote(prev => ({
                ...prev,
                clientName: selectedClient.name,
                clientEmail: selectedClient.email,
                clientPhone: selectedClient.phone,
                clientCpf: selectedClient.type === 'pessoa_fisica' ? selectedClient.cpfCnpj : '',
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
                             onChange={e => {
                                 const value = e.target.value.replace(/\D/g, '');
                                 let formatted = value;
                                 if (value.length <= 10) {
                                     // Formato: (00) 0000-0000
                                     formatted = value.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
                                 } else {
                                     // Formato: (00) 00000-0000
                                     formatted = value.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
                                 }
                                 setQuote({...quote, clientPhone: formatted.trim()});
                             }}
                             error={errors.clientPhone}
                             placeholder="(00) 00000-0000"
                             maxLength={15}
                        />
                        <Input
                             label="CPF do Cliente (Opcional)"
                             id="client-cpf"
                             value={quote.clientCpf || ''}
                             onChange={e => {
                                 const value = e.target.value.replace(/\D/g, '');
                                 let formatted = '';
                                 if (value.length > 0) {
                                     if (value.length <= 3) {
                                         formatted = value;
                                     } else if (value.length <= 6) {
                                         formatted = `${value.slice(0, 3)}.${value.slice(3)}`;
                                     } else if (value.length <= 9) {
                                         formatted = `${value.slice(0, 3)}.${value.slice(3, 6)}.${value.slice(6)}`;
                                     } else {
                                         formatted = `${value.slice(0, 3)}.${value.slice(3, 6)}.${value.slice(6, 9)}-${value.slice(9, 11)}`;
                                     }
                                 }
                                 setQuote({...quote, clientCpf: formatted});
                             }}
                             error={errors.clientCpf}
                             placeholder="___.___.___-__"
                             maxLength={14}
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
            
                <div className="border-t border-border dark:border-slate-700 pt-4" id="item-form-section">
                     <h3 className="text-xl font-semibold text-text-primary dark:text-slate-100 mb-2">Itens do Orçamento</h3>
                     {errors.items && <div className="bg-red-100 dark:bg-red-900/50 border border-error dark:border-error text-error dark:text-red-300 px-4 py-3 rounded relative mb-4" role="alert">{errors.items}</div>}
                     <div className="lg:flex gap-4">
                        <div className="lg:w-1/3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-border dark:border-slate-700 mb-4 lg:mb-0">
                            <h4 className="font-semibold mb-3">
                                {editingItemId ? 'Editar Item' : 'Adicionar Novo Item'}
                            </h4>
                            <div className="flex space-x-2 mb-4">
                                {(['material', 'service', 'product'] as QuoteItemType[]).map(type => (
                                    <button 
                                        key={type} 
                                        onClick={() => handleItemTypeChange(type)} 
                                        className={`px-3 py-1 rounded text-sm ${itemType === type ? 'bg-primary text-white' : 'bg-slate-200 dark:bg-slate-700 dark:text-slate-200'}`}
                                        disabled={!!editingItemId}
                                    >
                                        {type === 'material' ? 'Material' : type === 'service' ? 'Serviço' : 'Produto'}
                                    </button>
                                ))}
                            </div>
                            {renderItemForm()}
                            <div className="flex gap-2 mt-3">
                                <Button onClick={handleSaveItem} className="flex-1">
                                    {editingItemId ? 'Salvar Alterações' : 'Adicionar Item'}
                                </Button>
                                {editingItemId && (
                                    <Button onClick={handleCancelEdit} variant="secondary" className="flex-1">
                                        Cancelar
                                    </Button>
                                )}
                            </div>
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
                                            <tr key={item.id} className={`border-b border-border dark:border-slate-700 ${editingItemId === item.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                                                <td className="p-2">
                                                    <p className="font-semibold">
                                                        {item.description}
                                                        {item.type === 'material' && item.quantity && item.quantity > 1 && (
                                                            <span className="text-sm font-normal text-gray-500 ml-2">(x{item.quantity})</span>
                                                        )}
                                                    </p>
                                                </td>
                                                <td className="p-2">{item.quantity.toFixed(2)}</td>
                                                <td className="p-2">{item.unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                                <td className="p-2 text-red-600 dark:text-red-400">{item.discount ? `- ${item.discount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` : '-'}</td>
                                                <td className="p-2">{item.totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                                <td className="p-2 text-center">
                                                    <div className="flex justify-center gap-1">
                                                        <button 
                                                            onClick={() => handleEditItem(item)}
                                                            className="text-primary hover:text-blue-700 p-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                                                            aria-label={`Editar item ${item.description}`}
                                                            title="Editar item"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteItem(item.id)}
                                                            className="text-error hover:text-red-700 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                                                            aria-label={`Remover item ${item.description}`}
                                                            title="Remover item"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                        </button>
                                                    </div>
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
                            <div className="space-y-2">
                                <Input
                                    label="Nº de Parcelas"
                                    id="installments"
                                    type="number"
                                    min="1"
                                    max="12"
                                    step="1"
                                    value={quote.installments || ''}
                                    onChange={e => {
                                        const value = parseInt(e.target.value, 10);
                                        if (!isNaN(value) && value >= 1 && value <= 12) {
                                            setQuote({...quote, installments: value});
                                        } else if (e.target.value === '') {
                                            setQuote({...quote, installments: undefined});
                                        }
                                    }}
                                    error={errors.installments}
                                    placeholder="1 a 12 parcelas"
                                />
                                {quote.installments && quote.installments > 0 && totals.total > 0 && (
                                    <div className="text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg">
                                        {quote.installments}x de {(totals.total / quote.installments).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </div>
                                )}
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
                // Não mostrar orçamentos arquivados nem aprovados (aprovados viram pedidos)
                if (quote.status === 'archived' || quote.status === 'approved') return false;
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
            clientName: '', clientEmail: '', clientPhone: '', clientCpf: '',
            deliveryAddress: { cep: '', uf: 'RO', city: '', neighborhood: '', address: '', number: '' },
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