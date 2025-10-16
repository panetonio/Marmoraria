import React, { useState, useMemo, FC, useEffect } from 'react';
import type { Invoice, InvoiceStatus, Order, Page } from '../types';
import Card, { CardContent, CardHeader, CardFooter } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useData } from '../context/DataContext';
import StatusBadge from '../components/ui/StatusBadge';
import { invoiceStatusMap } from '../config/statusMaps';

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
                                    <td className="p-3"><StatusBadge status={invoice.status} statusMap={invoiceStatusMap} /></td>
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
    onSave: (invoice: Invoice) => void;
    onCancel: () => void;
    onIssue: (invoice: Invoice) => void;
}> = ({ invoice: initialInvoice, onSave, onCancel, onIssue }) => {
    const { orders, invoices } = useData();
    const [invoice, setInvoice] = useState<Invoice>(initialInvoice);
    const isNew = invoice.id.startsWith('new-');

    const ordersToInvoice = useMemo(() => {
        const invoicedOrderIds = new Set(invoices.map(inv => inv.orderId));
        return orders.filter(order => !invoicedOrderIds.has(order.id));
    }, [invoices, orders]);

    const handleOrderSelection = (orderId: string) => {
        const order = ordersToInvoice.find(o => o.id === orderId);
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
                            {ordersToInvoice.map(order => (
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
                            <div><strong>Status:</strong><p><StatusBadge status={invoice.status} statusMap={invoiceStatusMap} /></p></div>
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
    searchTarget: { page: Page; id: string } | null;
    clearSearchTarget: () => void;
}

const InvoicesPage: FC<InvoicesPageProps> = ({ searchTarget, clearSearchTarget }) => {
    const { invoices, saveInvoice, issueInvoice } = useData();
    const [currentView, setCurrentView] = useState<'list' | 'form'>('list');
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

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
        saveInvoice(invoiceToSave);
        setCurrentView('list');
        setSelectedInvoice(null);
    };

    const handleIssue = (invoiceToIssue: Invoice) => {
        issueInvoice(invoiceToIssue.id);
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
                    onSave={handleSave} 
                    onCancel={handleCancel}
                    onIssue={handleIssue}
                />
            )}
        </div>
    );
};

export default InvoicesPage;