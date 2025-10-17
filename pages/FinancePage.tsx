import React, { useState, useMemo, FC, useEffect, ChangeEvent } from 'react';
import type { FinancialTransaction, TransactionStatus, TransactionType, PaymentMethod } from '../types';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Tabs from '../components/ui/Tabs';
import { useData } from '../context/DataContext';
import StatusBadge from '../components/ui/StatusBadge';
import { transactionStatusMap } from '../config/statusMaps';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { exportTransactionsToCSV } from '../utils/helpers';

type FinanceView = 'contas' | 'fluxo_caixa' | 'relatorios';
type ReportPeriod = 'day' | 'week' | 'month';

const KPICard: FC<{ title: string; value: string; colorClass?: string }> = ({ title, value, colorClass = 'text-primary' }) => (
    <Card>
        <CardContent>
            <p className="text-text-secondary dark:text-slate-400 text-sm">{title}</p>
            <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
        </CardContent>
    </Card>
);

const ReportTable: FC<{ title: React.ReactNode, transactions: FinancialTransaction[], total: number }> = ({ title, transactions, total }) => (
    <Card className="p-0 flex flex-col">
        <CardHeader>{title}</CardHeader>
        <CardContent className="flex-grow">
            {transactions.length > 0 ? (
                <div className="overflow-auto h-full">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-border dark:border-slate-700">
                                <th className="p-2">Data</th>
                                <th className="p-2">Descrição</th>
                                <th className="p-2 text-right">Valor</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map(t => (
                                <tr key={t.id} className="border-b border-border dark:border-slate-700 last:border-b-0">
                                    <td className="p-2 whitespace-nowrap">{t.paymentDate ? new Date(t.paymentDate).toLocaleDateString() : '-'}</td>
                                    <td className="p-2">{t.description}</td>
                                    <td className="p-2 text-right font-mono">{t.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="flex items-center justify-center h-full">
                     <p className="text-text-secondary dark:text-slate-400">Nenhuma transação no período.</p>
                </div>
            )}
        </CardContent>
        <div className="p-4 border-t border-border dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-b-lg">
            <div className="flex justify-between items-center font-bold">
                <span>Total no Período</span>
                <span>{total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>
        </div>
    </Card>
);

const TransactionEditModal: FC<{
    transaction: FinancialTransaction;
    isOpen: boolean;
    onClose: () => void;
    onSave: (transaction: FinancialTransaction) => void;
    paymentMethodLabels: Record<PaymentMethod, string>;
}> = ({ transaction, isOpen, onClose, onSave, paymentMethodLabels }) => {
    const [formData, setFormData] = useState<FinancialTransaction>(transaction);

    useEffect(() => {
        setFormData(transaction);
    }, [transaction]);

    const handleChange = (field: keyof FinancialTransaction, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleDateChange = (dateString: string) => {
        // Preserves the time part of the original ISO string to avoid timezone shifts
        const originalTime = formData.dueDate.split('T')[1] || '00:00:00.000Z';
        const newIsoString = `${dateString}T${originalTime}`;
        setFormData(prev => ({ ...prev, dueDate: newIsoString }));
    };

    const dateInputValue = useMemo(() => {
        try {
            return formData.dueDate.split('T')[0];
        } catch (e) {
            return '';
        }
    }, [formData.dueDate]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Editar Transação`}>
            <div className="space-y-4">
                <Input
                    label="Descrição"
                    id="edit-desc"
                    value={formData.description}
                    onChange={e => handleChange('description', e.target.value)}
                />
                <Input
                    label="Valor (R$)"
                    id="edit-amount"
                    type="number"
                    value={formData.amount}
                    onChange={e => handleChange('amount', parseFloat(e.target.value) || 0)}
                />
                <Input
                    label="Data de Vencimento"
                    id="edit-dueDate"
                    type="date"
                    value={dateInputValue}
                    onChange={e => handleDateChange(e.target.value)}
                />
                {formData.type === 'receita' && (
                    <Select
                        label="Método de Pagamento"
                        id="edit-paymentMethod"
                        value={formData.paymentMethod || ''}
                        onChange={e => handleChange('paymentMethod', e.target.value as PaymentMethod)}
                    >
                        <option value="">-- Selecione --</option>
                        {Object.entries(paymentMethodLabels).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </Select>
                )}
            </div>
            <div className="flex justify-end mt-6 space-x-3">
                <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                <Button onClick={() => onSave(formData)}>Salvar Alterações</Button>
            </div>
        </Modal>
    );
};

const AttachmentModal: FC<{
    transaction: FinancialTransaction;
    isOpen: boolean;
    onClose: () => void;
    onSave: (transactionId: string, file: File) => void;
}> = ({ transaction, isOpen, onClose, onSave }) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [error, setError] = useState<string>('');

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                setError('O arquivo é muito grande. O limite é de 5MB.');
                setSelectedFile(null);
            } else {
                setError('');
                setSelectedFile(file);
            }
        }
    };

    const handleSave = () => {
        if (selectedFile) {
            onSave(transaction.id, selectedFile);
        } else {
            setError('Por favor, selecione um arquivo.');
        }
    };

    useEffect(() => {
        if (!isOpen) {
            setSelectedFile(null);
            setError('');
        }
    }, [isOpen]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Anexar Comprovante para ${transaction.id}`}>
            <div className="space-y-4">
                <p className="text-sm text-text-secondary dark:text-slate-400">
                    Anexe o comprovante de pagamento para a transação: <span className="font-semibold text-text-primary dark:text-slate-200">{transaction.description}</span> no valor de <span className="font-semibold text-text-primary dark:text-slate-200">{transaction.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>.
                </p>
                <div>
                    <label htmlFor="attachment-file" className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">
                        Selecione o arquivo (PDF ou Imagem, máx 5MB)
                    </label>
                    <input 
                        id="attachment-file" 
                        type="file" 
                        accept="image/*,application/pdf"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-text-secondary dark:text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                    />
                </div>
                {selectedFile && (
                    <div className="p-2 bg-slate-100 dark:bg-slate-800/50 rounded-lg text-sm">
                        Arquivo selecionado: <span className="font-semibold">{selectedFile.name}</span>
                    </div>
                )}
                {error && <p className="text-error text-center text-sm">{error}</p>}
            </div>
            <div className="flex justify-end mt-6 space-x-3">
                <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSave} disabled={!selectedFile}>Salvar Anexo</Button>
            </div>
        </Modal>
    );
};


const FinancePage: FC = () => {
    const { financialTransactions: transactions, markTransactionAsPaid, updateFinancialTransaction } = useData();
    const [view, setView] = useState<FinanceView>('contas');
    const [reportPeriod, setReportPeriod] = useState<ReportPeriod>('month');
    const [editingTransaction, setEditingTransaction] = useState<FinancialTransaction | null>(null);
    const [attachingTransaction, setAttachingTransaction] = useState<FinancialTransaction | null>(null);
    
    const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
        pix: 'PIX',
        cartao_credito: 'Cartão de Crédito',
        boleto: 'Boleto Bancário',
        dinheiro: 'Dinheiro',
    };

    const monthlyReport = useMemo(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const relevantTransactions = transactions.filter(t => {
            const paymentDate = t.paymentDate ? new Date(t.paymentDate) : null;
            return paymentDate && paymentDate >= startOfMonth && paymentDate <= endOfMonth;
        });

        const pendingTransactions = transactions.filter(t => t.status === 'pendente');

        const totalRecebido = relevantTransactions.filter(t => t.type === 'receita').reduce((sum, t) => sum + t.amount, 0);
        const totalPago = relevantTransactions.filter(t => t.type === 'despesa').reduce((sum, t) => sum + t.amount, 0);
        const aReceber = pendingTransactions.filter(t => t.type === 'receita').reduce((sum, t) => sum + t.amount, 0);
        const aPagar = pendingTransactions.filter(t => t.type === 'despesa').reduce((sum, t) => sum + t.amount, 0);

        return {
            totalRecebido,
            totalPago,
            saldoMes: totalRecebido - totalPago,
            aReceber,
            aPagar
        };
    }, [transactions]);

    const filteredReportTransactions = useMemo(() => {
        const now = new Date();
        let startDate = new Date();

        switch(reportPeriod) {
            case 'day':
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'week':
                startDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
        }

        const filtered = transactions.filter(t => {
            if (t.status !== 'pago' || !t.paymentDate) return false;
            const paymentDate = new Date(t.paymentDate);
            return paymentDate >= startDate && paymentDate <= now;
        });

        const entradas = filtered.filter(t => t.type === 'receita').sort((a,b) => new Date(b.paymentDate!).getTime() - new Date(a.paymentDate!).getTime());
        const saidas = filtered.filter(t => t.type === 'despesa').sort((a,b) => new Date(b.paymentDate!).getTime() - new Date(a.paymentDate!).getTime());
        const totalEntradas = entradas.reduce((sum, t) => sum + t.amount, 0);
        const totalSaidas = saidas.reduce((sum, t) => sum + t.amount, 0);
        
        const totalsByPaymentMethod: Record<PaymentMethod, number> = { pix: 0, cartao_credito: 0, boleto: 0, dinheiro: 0 };
        entradas.forEach(t => {
            if (t.paymentMethod) {
                totalsByPaymentMethod[t.paymentMethod] += t.amount;
            }
        });

        return { entradas, saidas, totalEntradas, totalSaidas, totalsByPaymentMethod };
    }, [transactions, reportPeriod]);


    const cashFlowProjection = useMemo(() => {
        const projection: { date: Date; receitas: number; despesas: number }[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < 30; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            projection.push({ date, receitas: 0, despesas: 0 });
        }

        transactions.forEach(t => {
            if (t.status === 'pendente') {
                const dueDate = new Date(t.dueDate);
                dueDate.setHours(0, 0, 0, 0);
                const diffTime = dueDate.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays >= 0 && diffDays < 30) {
                    if (t.type === 'receita') {
                        projection[diffDays].receitas += t.amount;
                    } else {
                        projection[diffDays].despesas += t.amount;
                    }
                }
            }
        });
        
        return projection;
    }, [transactions]);

    const handleEditTransaction = (transaction: FinancialTransaction) => {
        setEditingTransaction(transaction);
    };

    const handleSaveTransaction = (transaction: FinancialTransaction) => {
        updateFinancialTransaction(transaction);
        setEditingTransaction(null);
    };

    const handleSaveAttachment = (transactionId: string, file: File) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const url = event.target?.result as string;
            const transaction = transactions.find(t => t.id === transactionId);
            if (transaction) {
                const updatedTransaction = {
                    ...transaction,
                    attachment: {
                        name: file.name,
                        url: url,
                    },
                };
                updateFinancialTransaction(updatedTransaction);
                setAttachingTransaction(null);
            }
        };
        reader.readAsDataURL(file);
    };


    const renderView = () => {
        switch (view) {
            case 'contas':
                return (
                    <Card className="p-0">
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead><tr className="border-b border-border dark:border-slate-700"><th className="p-3">Vencimento</th><th className="p-3">Descrição</th><th className="p-3">Tipo</th><th className="p-3">Método Pgto.</th><th className="p-3 text-right">Valor</th><th className="p-3 text-center">Status</th><th className="p-3 text-center">Ações</th></tr></thead>
                                    <tbody>
                                        {transactions.sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).map(t => (
                                            <tr key={t.id} className="border-b border-border dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                                <td className="p-3">{new Date(t.dueDate).toLocaleDateString()}</td>
                                                <td className="p-3">{t.description}</td>
                                                <td className={`p-3 font-semibold ${t.type === 'receita' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{t.type === 'receita' ? 'Receita' : 'Despesa'}</td>
                                                <td className="p-3 text-sm capitalize text-text-secondary dark:text-slate-400">
                                                    {(t.type === 'receita' && t.paymentMethod)
                                                        ? PAYMENT_METHOD_LABELS[t.paymentMethod]
                                                        : 'N/A'}
                                                </td>
                                                <td className="p-3 text-right font-mono">{t.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                                <td className="p-3 text-center"><StatusBadge status={t.status} statusMap={transactionStatusMap} /></td>
                                                <td className="p-3 text-center">
                                                    <div className="flex items-center justify-center space-x-2">
                                                        {t.status === 'pendente' && (
                                                            <>
                                                                <Button size="sm" variant="ghost" onClick={() => handleEditTransaction(t)}>Editar</Button>
                                                                <Button size="sm" onClick={() => markTransactionAsPaid(t.id)}>Marcar como Pago</Button>
                                                            </>
                                                        )}
                                                        {t.status === 'pago' && (
                                                            <>
                                                                {t.attachment ? (
                                                                    <Button size="sm" variant="ghost" onClick={() => window.open(t.attachment.url, '_blank')}>Ver Comprovante</Button>
                                                                ) : (
                                                                    <Button size="sm" variant="secondary" onClick={() => setAttachingTransaction(t)}>Anexar</Button>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                );
            case 'fluxo_caixa':
                 return (
                    <Card>
                        <CardContent>
                            <h2 className="text-xl font-semibold text-text-primary dark:text-slate-100 mb-4">Projeção de Caixa para os Próximos 30 Dias</h2>
                            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                               {cashFlowProjection.map(({date, receitas, despesas}) => {
                                   const saldoDia = receitas - despesas;
                                   const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                                   if (receitas === 0 && despesas === 0) return null;
                                   return (
                                    <div key={date.toISOString()} className={`p-3 rounded-lg flex items-center gap-4 ${isWeekend ? 'bg-slate-50 dark:bg-slate-800/50' : ''}`}>
                                        <div className="text-center w-24">
                                            <p className="font-bold text-lg text-primary">{date.toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'})}</p>
                                            <p className="text-xs text-text-secondary dark:text-slate-400">{date.toLocaleDateString('pt-BR', {weekday: 'long'})}</p>
                                        </div>
                                        <div className="flex-1 flex gap-4">
                                            <div className="flex-1">
                                                <p className="text-sm text-green-600 dark:text-green-400">+ {receitas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                                <p className="text-sm text-red-600 dark:text-red-400">- {despesas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                            </div>
                                            <div className="flex-1 text-right">
                                                <p className="text-sm text-text-secondary dark:text-slate-400">Saldo do Dia</p>
                                                <p className={`font-bold ${saldoDia >= 0 ? 'text-text-primary dark:text-slate-100' : 'text-error'}`}>{saldoDia.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                            </div>
                                        </div>
                                    </div>
                               )})}
                            </div>
                        </CardContent>
                    </Card>
                );
            case 'relatorios':
                return (
                    <div className="space-y-6">
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                            <KPICard title="Total Recebido (Mês)" value={monthlyReport.totalRecebido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} colorClass="text-green-600 dark:text-green-400" />
                            <KPICard title="Total Pago (Mês)" value={monthlyReport.totalPago.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} colorClass="text-red-600 dark:text-red-400" />
                            <KPICard title="Saldo (Mês)" value={monthlyReport.saldoMes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} colorClass={monthlyReport.saldoMes >= 0 ? 'text-blue-700 dark:text-blue-400' : 'text-red-700 dark:text-red-400'} />
                            <KPICard title="Pendente a Receber" value={monthlyReport.aReceber.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} colorClass="text-yellow-600 dark:text-yellow-400" />
                            <KPICard title="Pendente a Pagar" value={monthlyReport.aPagar.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} colorClass="text-orange-600 dark:text-orange-400" />
                         </div>
                         <Card>
                            <CardContent>
                                <div className="flex items-center space-x-4">
                                    <h3 className="text-lg font-semibold">Relatório Detalhado de Transações Pagas</h3>
                                    <div className="flex items-center space-x-2 p-1 bg-slate-200 dark:bg-slate-800 rounded-lg">
                                        <Button size="sm" variant={reportPeriod === 'day' ? 'primary' : 'ghost'} onClick={() => setReportPeriod('day')}>Hoje</Button>
                                        <Button size="sm" variant={reportPeriod === 'week' ? 'primary' : 'ghost'} onClick={() => setReportPeriod('week')}>7 dias</Button>
                                        <Button size="sm" variant={reportPeriod === 'month' ? 'primary' : 'ghost'} onClick={() => setReportPeriod('month')}>Mês</Button>
                                    </div>
                                </div>
                            </CardContent>
                         </Card>
                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[400px]">
                            <div className="space-y-6">
                                <ReportTable 
                                    title={
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-xl font-semibold text-text-primary dark:text-slate-100">Relatório de Entradas</h3>
                                            <Button variant="ghost" size="sm" onClick={() => exportTransactionsToCSV(filteredReportTransactions.entradas, `entradas_${reportPeriod}.csv`)} disabled={filteredReportTransactions.entradas.length === 0}>
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                </svg>
                                                Exportar CSV
                                            </Button>
                                        </div>
                                    }
                                    transactions={filteredReportTransactions.entradas} 
                                    total={filteredReportTransactions.totalEntradas} 
                                />
                                <Card>
                                    <CardHeader>Entradas por Método de Pagamento</CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2">
                                            {/* FIX: Cast `total` to `number` to resolve TypeScript error due to `Object.entries` returning `unknown`. */}
                                            {Object.entries(filteredReportTransactions.totalsByPaymentMethod).map(([method, total]) => (
                                                (total as number) > 0 && (
                                                    <li key={method} className="flex justify-between items-center text-sm">
                                                        <span className="text-text-secondary dark:text-slate-400 capitalize">{PAYMENT_METHOD_LABELS[method as PaymentMethod]}</span>
                                                        <span className="font-semibold">{(total as number).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                                    </li>
                                                )
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            </div>
                             <ReportTable 
                                title={
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-xl font-semibold text-text-primary dark:text-slate-100">Relatório de Saídas</h3>
                                        <Button variant="ghost" size="sm" onClick={() => exportTransactionsToCSV(filteredReportTransactions.saidas, `saidas_${reportPeriod}.csv`)} disabled={filteredReportTransactions.saidas.length === 0}>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                            Exportar CSV
                                        </Button>
                                    </div>
                                }
                                transactions={filteredReportTransactions.saidas} 
                                total={filteredReportTransactions.totalSaidas} 
                             />
                         </div>
                    </div>
                );
        }
    };

    return (
        <div>
            {editingTransaction && (
                <TransactionEditModal
                    isOpen={!!editingTransaction}
                    transaction={editingTransaction}
                    onClose={() => setEditingTransaction(null)}
                    onSave={handleSaveTransaction}
                    paymentMethodLabels={PAYMENT_METHOD_LABELS}
                />
            )}
            {attachingTransaction && (
                <AttachmentModal
                    isOpen={!!attachingTransaction}
                    transaction={attachingTransaction}
                    onClose={() => setAttachingTransaction(null)}
                    onSave={handleSaveAttachment}
                />
            )}
            <h1 className="text-3xl font-bold text-text-primary dark:text-slate-100">Módulo Financeiro</h1>
            <p className="mt-2 text-text-secondary dark:text-slate-400 mb-6">Controle contas a pagar, a receber e visualize relatórios.</p>

            <Tabs
                tabs={[
                    { id: 'contas', label: 'Contas' },
                    { id: 'fluxo_caixa', label: 'Fluxo de Caixa' },
                    { id: 'relatorios', label: 'Relatórios' },
                ]}
                activeTab={view}
                onTabClick={(tabId) => setView(tabId as FinanceView)}
            />
            
            {renderView()}
        </div>
    );
};

export default FinancePage;