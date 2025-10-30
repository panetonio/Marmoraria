import React, { useState, useMemo, FC, useEffect, useCallback } from 'react';
import type { Invoice, Page } from '../types';
import Card, { CardContent, CardHeader, CardFooter } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useData } from '../context/DataContext';
import StatusBadge from '../components/ui/StatusBadge';
import { invoiceStatusMap } from '../config/statusMaps';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';
import Modal from '../components/ui/Modal';
import InvoicePreview from '../components/InvoicePreview';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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
                     <Button variant="secondary" onClick={() => onSave(invoice)} disabled={!invoice.orderId}>Gerar NF (rascunho)</Button>
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
    const queryClient = useQueryClient();
    const { orders } = useData();
    const [currentView, setCurrentView] = useState<'list' | 'form'>('list');
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const { data: invoicesResponse } = useQuery({
        queryKey: ['invoices', 'list'],
        queryFn: () => api.getInvoices(),
    });
    const invoices: Invoice[] = useMemo(() => {
        const list = invoicesResponse?.data || [];
        return list.map((inv: any) => ({
            ...inv,
            id: inv._id || inv.id,
        }));
    }, [invoicesResponse]);

    const createInvoiceMutation = useMutation({
        mutationFn: (orderId: string) => api.createInvoiceFromOrder(orderId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices', 'list'] });
        },
    });

    const issueInvoiceMutation = useMutation({
        mutationFn: (invoiceId: string) => api.simulateIssueNFe(invoiceId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices', 'list'] });
        },
    });

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
        if (!invoiceToSave.orderId) return;
        createInvoiceMutation.mutate(invoiceToSave.orderId);
        setCurrentView('list');
        setSelectedInvoice(null);
    };

    const handleIssue = (invoiceToIssue: Invoice) => {
        issueInvoiceMutation.mutate(invoiceToIssue.id);
        setCurrentView('list');
        setSelectedInvoice(null);
    }

    const handleCancel = () => {
        setCurrentView('list');
        setSelectedInvoice(null);
    };

    const handleView = useCallback((invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setIsPreviewOpen(true);
    }, []);

    const handleDownloadPdf = async () => {
        const el = document.getElementById('invoice-printable-area');
        if (!el) return;
        const canvas = await html2canvas(el as HTMLElement, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const imgProps = (pdf as any).getImageProperties(imgData);
        const imgWidth = pageWidth - 20; // margins
        const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
        let y = 10;
        if (imgHeight < pageHeight) {
            pdf.addImage(imgData, 'PNG', 10, y, imgWidth, imgHeight);
        } else {
            // paginate if needed
            let position = 0;
            let heightLeft = imgHeight;
            while (heightLeft > 0) {
                pdf.addImage(imgData, 'PNG', 10, position ? 10 : y, imgWidth, imgHeight);
                heightLeft -= pageHeight;
                position += pageHeight;
                if (heightLeft > 0) pdf.addPage();
            }
        }
        pdf.save(`DANFE_${selectedInvoice?.id || 'NF'}.pdf`);
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-text-primary dark:text-slate-100">Faturamento</h1>
            <p className="mt-2 text-text-secondary dark:text-slate-400 mb-6">Gere e gerencie as notas fiscais dos pedidos.</p>
            <InvoiceList invoices={invoices} onNew={handleNew} onView={handleView} />
            {currentView === 'form' && selectedInvoice && (
                <InvoiceForm 
                    invoice={selectedInvoice} 
                    onSave={handleSave} 
                    onCancel={handleCancel}
                    onIssue={handleIssue}
                />
            )}

            {isPreviewOpen && selectedInvoice && (
                <Modal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} title={`NF ${selectedInvoice.id}`} className="max-w-5xl">
                    <div className="space-y-4">
                        <InvoicePreview invoice={selectedInvoice} />
                        <div className="flex justify-end">
                            <Button onClick={handleDownloadPdf}>Baixar PDF</Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default InvoicesPage;