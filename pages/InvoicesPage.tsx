import React, { useState, useMemo, FC, useEffect } from 'react';
import type { Invoice, InvoiceStatus, Order, Page } from '../types';
import Card, { CardContent, CardHeader, CardFooter } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

const InvoiceStatusBadge: React.FC<{ status: InvoiceStatus }> = ({ status }) => {
    const statusMap: Record<InvoiceStatus, { label: string, variant: 'warning' | 'success' | 'error' }> = {
        pending: { label: "Pendente", variant: "warning" },
        issued: { label: "Emitida", variant: "success" },
        canceled: { label: "Cancelada", variant: "error" },
    };
    return <Badge variant={statusMap[status].variant}>{statusMap[status].label}</Badge>;
};


const InvoiceList: React.FC<{
    invoices: Invoice[];
    onNew: () => void;
    onView: (invoice: Invoice) => void;
}> = ({ invoices, onNew, onView }) => {
    return (
        <Card className="p-0">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-semibold text-text-primary dark:text-slate-100">Faturamento / Notas Fiscais</h2>
                    <Button onClick={onNew}>Gerar Nota Fiscal</Button>
                </div>
            </CardHeader>
             <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-border dark:border-slate-700">
                                <th className="p-3">NF ID</th>
                                <th className="p-3">Pedido ID</th>
                                <th className="p-3">Cliente</th>
                                <th className="p-3">Emissão</th>
                                <th className="p-3">Total</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.map(invoice => (
                                <tr key={invoice.id} className="border-b border-border dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                    <td className="p-3 font-mono text-sm">{invoice.id}</td>
                                    <td className="p-3 font-mono text-sm">{invoice.orderId}</td>
                                    <td className="p-3">{invoice.clientName}</td>
                                    <td className="p-3">{invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString() : '—'}</td>
                                    <td className="p-3">{invoice.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                    <td className="p-3"><InvoiceStatusBadge status={invoice.status} /></td>
                                    <td className="p-3">
                                        <button onClick={() => onView(invoice)} className="text-primary hover:underline font-semibold text-sm">Ver Detalhes</button>
                                    </td>
                                </tr>
                            ))}
                             {invoices.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="text-center p-4 text-text-secondary dark:text-slate-400">Nenhuma nota fiscal encontrada.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
};

const InvoiceForm: React.FC<{
    invoice: Invoice;
    orders: Order[];
    onSave: (invoice: Invoice) => void;
    onCancel: () => void;
    onIssue: (invoice: Invoice) => void;
}> = ({ invoice: initialInvoice, orders, onSave, onCancel, onIssue }) => {
    const [invoice, setInvoice] = useState<Invoice>(initialInvoice);
    const isNew = invoice.id.startsWith('new-');

    const handleOrderSelection = (orderId: string) => {
        const order = orders.find(o => o.id === orderId);
        if (order) {
            setInvoice(prev => ({
                ...prev,
                orderId: order.id,
                clientName: order.clientName,
                total: order.total,
            }));
        }
    };

    return (
        <Card>
            <CardHeader>{isNew ? 'Gerar Nova Nota Fiscal' : `Detalhes da NF ${invoice.id}`}</CardHeader>
            <CardContent>
                {isNew && (
                    <div className="mb-6">
                        <label htmlFor="order-select" className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">Selecione o Pedido para Faturar</label>
                        <select
                            id="order-select"
                            value={invoice.orderId}
                            onChange={(e) => handleOrderSelection(e.target.value)}
                            className="p-2 border border-border dark:border-slate-600 rounded w-full bg-slate-50 dark:bg-slate-700"
                            aria-label="Selecionar Pedido"
                        >
                            <option value="">Selecione um pedido</option>
                            {orders.map(order => (
                                <option key={order.id} value={order.id}>
                                    {order.id} - {order.clientName} ({order.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {invoice.orderId && (
                    <div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                            <div><strong>Cliente:</strong><p>{invoice.clientName}</p></div>
                            <div><strong>Pedido de Origem:</strong><p className="font-mono">{invoice.orderId}</p></div>
                            <div><strong>Valor Total:</strong><p className="font-semibold text-lg">{invoice.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p></div>
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-sm">
                            <div><strong>Status:</strong><p><InvoiceStatusBadge status={invoice.status} /></p></div>
                            <div><strong>Data de Criação:</strong><p>{new Date(invoice.createdAt).toLocaleString()}</p></div>
                            <div><strong>Data de Emissão:</strong><p>{invoice.issueDate ? new Date(invoice.issueDate).toLocaleString() : 'Não emitida'}</p></div>
                        </div>
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex justify-end space-x-4">
                <Button variant="ghost" onClick={onCancel}>Voltar</Button>
                {isNew && (
                     <Button variant="secondary" onClick={() => onSave(invoice)} disabled={!invoice.orderId}>Salvar Rascunho</Button>
                )}
                {!isNew && invoice.status === 'pending' && (
                     <Button className="bg-success hover:bg-green-700" onClick={() => onIssue(invoice)}>Simular Emissão de NF-e</Button>
                )}
            </CardFooter>
        </Card>
    );
};

interface InvoicesPageProps {
    orders: Order[];
    invoices: Invoice[];
    setInvoices: (update: Invoice[] | ((prev: Invoice[]) => Invoice[])) => void;
    searchTarget: { page: Page; id: string } | null;
    clearSearchTarget: () => void;
}

const InvoicesPage: FC<InvoicesPageProps> = ({ orders, invoices, setInvoices, searchTarget, clearSearchTarget }) => {
    const [currentView, setCurrentView] = useState<'list' | 'form'>('list');
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

    const ordersToInvoice = useMemo(() => {
        const invoicedOrderIds = new Set(invoices.map(inv => inv.orderId));
        return orders.filter(order => !invoicedOrderIds.has(order.id));
    }, [invoices, orders]);

    const handleNew = () => {
        setSelectedInvoice({
            id: `new-${Date.now()}`,
            orderId: '',
            clientName: '',
            total: 0,
            status: 'pending',
            issueDate: null,
            createdAt: new Date().toISOString()
        });
        setCurrentView('form');
    };

    const handleView = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setCurrentView('form');
    };
    
    useEffect(() => {
        if (searchTarget && searchTarget.page === 'invoices') {
            const invoice = invoices.find(i => i.id === searchTarget.id);
            if (invoice) {
                handleView(invoice);
            }
            clearSearchTarget();
        }
    }, [searchTarget, invoices, clearSearchTarget]);

    const handleSave = (invoiceToSave: Invoice) => {
        setInvoices(prev => [...prev, { ...invoiceToSave, id: `NF-${(invoices.length + 1).toString().padStart(3, '0')}`}]);
        setCurrentView('list');
        setSelectedInvoice(null);
    };

    const handleIssue = (invoiceToIssue: Invoice) => {
        setInvoices(invoices.map(inv => 
            inv.id === invoiceToIssue.id 
            ? { ...inv, status: 'issued', issueDate: new Date().toISOString() } 
            : inv
        ));
        setCurrentView('list');
        setSelectedInvoice(null);
    }

    const handleCancel = () => {
        setCurrentView('list');
        setSelectedInvoice(null);
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-text-primary dark:text-slate-100">Faturamento</h1>
            <p className="mt-2 text-text-secondary dark:text-slate-400 mb-6">Gere e gerencie as notas fiscais dos pedidos.</p>
            {currentView === 'list' ? (
                <InvoiceList invoices={invoices} onNew={handleNew} onView={handleView} />
            ) : (
                selectedInvoice && <InvoiceForm 
                    invoice={selectedInvoice} 
                    orders={ordersToInvoice}
                    onSave={handleSave} 
                    onCancel={handleCancel}
                    onIssue={handleIssue}
                />
            )}
        </div>
    );
};

export default InvoicesPage;