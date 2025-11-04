import React, { useState, useMemo, FC } from 'react';
import type { Receipt, Supplier } from '../types';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import { useData } from '../context/DataContext';
import ViewReceiptModal from '../components/ViewReceiptModal';
import Select from '../components/ui/Select';

const ReceiptsPage: FC = () => {
    const { receipts, suppliers } = useData();
    const [viewingReceipt, setViewingReceipt] = useState<Receipt | null>(null);
    const [supplierFilter, setSupplierFilter] = useState('');
    const [dateFilter, setDateFilter] = useState('');

    const filteredReceipts = useMemo(() => {
        return receipts.filter(receipt => {
            const supplierMatch = supplierFilter ? receipt.supplierId === supplierFilter : true;
            const dateMatch = dateFilter ? new Date(receipt.createdAt).toISOString().split('T')[0] === dateFilter : true;
            return supplierMatch && dateMatch;
        }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [receipts, supplierFilter, dateFilter]);

    return (
        <div>
            {viewingReceipt && (
                <ViewReceiptModal
                    isOpen={!!viewingReceipt}
                    onClose={() => setViewingReceipt(null)}
                    receipt={viewingReceipt}
                />
            )}
            <h1 className="text-3xl font-bold text-text-primary dark:text-slate-100">Controle de Recibos</h1>
            <p className="mt-2 text-text-secondary dark:text-slate-400">Visualize e gerencie todos os recibos gerados para fornecedores.</p>

            <Card className="mt-8 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-border dark:border-slate-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <Select
                        value={supplierFilter}
                        onChange={(e) => setSupplierFilter(e.target.value)}
                        aria-label="Filtrar por fornecedor"
                    >
                        <option value="">Todos os Fornecedores</option>
                        {suppliers.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </Select>
                    <input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="p-2 border border-border dark:border-slate-600 rounded w-full text-text-secondary dark:text-slate-300 bg-slate-50 dark:bg-slate-700 h-[42px]"
                        aria-label="Filtrar por data"
                    />
                </div>
            </Card>

             <Card className="mt-8 p-0">
                 <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-border dark:border-slate-700">
                                    <th className="p-3">Recibo ID</th>
                                    <th className="p-3">Data</th>
                                    <th className="p-3">Fornecedor</th>
                                    <th className="p-3">Descrição</th>
                                    <th className="p-3 text-right">Valor</th>
                                    <th className="p-3 text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredReceipts.map(receipt => (
                                    <tr key={receipt.id} className="border-b border-border dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                        <td className="p-3 font-mono text-sm">{receipt.id}</td>
                                        <td className="p-3">{new Date(receipt.createdAt).toLocaleDateString()}</td>
                                        <td className="p-3">{receipt.supplierName}</td>
                                        <td className="p-3 text-sm text-text-secondary dark:text-slate-400">{receipt.description}</td>
                                        <td className="p-3 text-right font-semibold">{receipt.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                        <td className="p-3 text-center">
                                            <button onClick={() => setViewingReceipt(receipt)} className="text-primary hover:underline font-semibold text-sm">
                                                Gerar PDF
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredReceipts.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="text-center p-4 text-text-secondary dark:text-slate-400">Nenhum recibo encontrado com os filtros aplicados.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                 </CardContent>
            </Card>

        </div>
    );
};

export default ReceiptsPage;
