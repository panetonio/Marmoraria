import React, { useState, useEffect, useRef, useCallback } from 'react';
import { mockClients, mockQuotes, mockOrders, mockInvoices } from '../data/mockData';
import type { Page, Client, Quote, Order, Invoice, QuoteStatus, InvoiceStatus } from '../types';
import Badge from './ui/Badge';

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

const InvoiceStatusBadge: React.FC<{ status: InvoiceStatus }> = ({ status }) => {
    const statusMap: Record<InvoiceStatus, { label: string, variant: 'warning' | 'success' | 'error' }> = {
        pending: { label: "Pendente", variant: "warning" },
        issued: { label: "Emitida", variant: "success" },
        canceled: { label: "Cancelada", variant: "error" },
    };
    return <Badge variant={statusMap[status].variant}>{statusMap[status].label}</Badge>;
};

interface SearchResults {
    clients: Client[];
    quotes: Quote[];
    orders: Order[];
    invoices: Invoice[];
}

interface GlobalSearchProps {
    onNavigate: (page: Page, recordId: string) => void;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ onNavigate }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResults>({ clients: [], quotes: [], orders: [], invoices: [] });
    const [isOpen, setIsOpen] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    const performSearch = useCallback((searchTerm: string) => {
        if (searchTerm.length < 2) {
            setResults({ clients: [], quotes: [], orders: [], invoices: [] });
            return;
        }

        const lowerCaseQuery = searchTerm.toLowerCase();

        const filteredClients = mockClients.filter(c =>
            c.name.toLowerCase().includes(lowerCaseQuery) ||
            c.cpfCnpj.toLowerCase().includes(lowerCaseQuery) ||
            c.email.toLowerCase().includes(lowerCaseQuery)
        ).slice(0, 3);

        const now = new Date();
        const archiveLimit = 120 * 24 * 60 * 60 * 1000; // 120 days
        const processedQuotes = mockQuotes.map(quote => {
            const isOld = now.getTime() - new Date(quote.createdAt).getTime() > archiveLimit;
            if ((quote.status === 'draft' || quote.status === 'sent') && isOld) {
                return { ...quote, status: 'archived' as QuoteStatus };
            }
            return quote;
        });

        const filteredQuotes = processedQuotes.filter(q =>
            q.id.toLowerCase().includes(lowerCaseQuery) ||
            q.clientName.toLowerCase().includes(lowerCaseQuery)
        ).slice(0, 3);

        const filteredOrders = mockOrders.filter(o =>
            o.id.toLowerCase().includes(lowerCaseQuery) ||
            o.clientName.toLowerCase().includes(lowerCaseQuery)
        ).slice(0, 3);

        const filteredInvoices = mockInvoices.filter(i =>
            i.id.toLowerCase().includes(lowerCaseQuery) ||
            i.clientName.toLowerCase().includes(lowerCaseQuery) ||
            i.orderId.toLowerCase().includes(lowerCaseQuery)
        ).slice(0, 3);

        const newResults = {
            clients: filteredClients,
            quotes: filteredQuotes,
            orders: filteredOrders,
            invoices: filteredInvoices
        };
        
        setResults(newResults);
        setIsOpen(Object.values(newResults).some(arr => arr.length > 0));
    }, []);

    useEffect(() => {
        const handler = setTimeout(() => {
            performSearch(query);
        }, 300);

        return () => {
            clearTimeout(handler);
        };
    }, [query, performSearch]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        const handleEscapeKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscapeKey);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscapeKey);
        };
    }, []);
    
    const handleNavigate = (page: Page, recordId: string) => {
        onNavigate(page, recordId);
        setQuery('');
        setIsOpen(false);
    };

    const hasResults = Object.values(results).some(arr => arr.length > 0);

    return (
        <div className="relative" ref={searchRef}>
            <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none">
                        <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                </span>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => hasResults && setIsOpen(true)}
                    className="w-full max-w-xs py-2 pl-10 pr-4 text-text-primary dark:text-slate-100 bg-slate-50 dark:bg-slate-700 border border-border dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Buscar clientes, pedidos..."
                    aria-label="Busca global"
                />
            </div>
            {isOpen && hasResults && (
                <div className="absolute mt-2 w-96 rounded-md shadow-lg bg-surface dark:bg-dark ring-1 ring-black ring-opacity-5 z-10 right-0">
                    <div className="py-1 max-h-96 overflow-y-auto">
                        {results.clients.length > 0 && (
                            <div>
                                <h3 className="px-4 py-2 text-xs font-semibold text-text-secondary dark:text-slate-400 uppercase">Clientes</h3>
                                {results.clients.map(client => (
                                    <button key={client.id} onClick={() => handleNavigate('crm', client.id)} className="w-full text-left px-4 py-2 text-sm text-text-primary dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700">
                                        <p className="font-medium">{client.name}</p>
                                        <p className="text-xs text-text-secondary dark:text-slate-400">{client.cpfCnpj}</p>
                                    </button>
                                ))}
                            </div>
                        )}
                        {results.quotes.length > 0 && (
                            <div>
                                <h3 className="px-4 py-2 text-xs font-semibold text-text-secondary dark:text-slate-400 uppercase border-t border-border dark:border-slate-700 mt-1 pt-2">Orçamentos</h3>
                                {results.quotes.map(quote => (
                                    <button key={quote.id} onClick={() => handleNavigate('quotes', quote.id)} className="w-full text-left px-4 py-2 text-sm text-text-primary dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700">
                                        <div className="flex justify-between items-center">
                                            <p className="font-medium font-mono">{quote.id}</p>
                                            <QuoteStatusBadge status={quote.status} />
                                        </div>
                                        <p className="text-xs text-text-secondary dark:text-slate-400">{quote.clientName}</p>
                                    </button>
                                ))}
                            </div>
                        )}
                        {results.orders.length > 0 && (
                             <div>
                                <h3 className="px-4 py-2 text-xs font-semibold text-text-secondary dark:text-slate-400 uppercase border-t border-border dark:border-slate-700 mt-1 pt-2">Pedidos</h3>
                                {results.orders.map(order => (
                                    <button key={order.id} onClick={() => handleNavigate('orders', order.id)} className="w-full text-left px-4 py-2 text-sm text-text-primary dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700">
                                        <div className="flex justify-between items-center">
                                            <p className="font-medium font-mono">{order.id}</p>
                                            <p className="text-xs font-semibold">{order.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                        </div>
                                        <p className="text-xs text-text-secondary dark:text-slate-400">{order.clientName}</p>
                                    </button>
                                ))}
                            </div>
                        )}
                         {results.invoices.length > 0 && (
                             <div>
                                <h3 className="px-4 py-2 text-xs font-semibold text-text-secondary dark:text-slate-400 uppercase border-t border-border dark:border-slate-700 mt-1 pt-2">Notas Fiscais</h3>
                                {results.invoices.map(invoice => (
                                    <button key={invoice.id} onClick={() => handleNavigate('invoices', invoice.id)} className="w-full text-left px-4 py-2 text-sm text-text-primary dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700">
                                        <div className="flex justify-between items-center">
                                            <p className="font-medium font-mono">{invoice.id}</p>
                                            <InvoiceStatusBadge status={invoice.status} />
                                        </div>
                                        <p className="text-xs text-text-secondary dark:text-slate-400">{invoice.clientName} (Pedido: {invoice.orderId})</p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default GlobalSearch;