import React, { useState, useMemo, FC } from 'react';
import { mockFinancialTransactions } from '../data/mockData';
import type { FinancialTransaction, TransactionStatus, TransactionType } from '../types';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Tabs from '../components/ui/Tabs';

type FinanceView = 'contas' | 'fluxo_caixa' | 'relatorios';
type ReportPeriod = 'day' | 'week' | 'month';

const TransactionStatusBadge: FC<{ status: TransactionStatus }> = ({ status }) => {
    const map = {
        pago: { label: "Pago", variant: 'success' as const },
        pendente: { label: "Pendente", variant: 'warning' as const },
    };
    return <Badge variant={map[status].variant}>{map[status].label}</Badge>;
};

const KPICard: FC<{ title: string; value: string; colorClass?: string }> = ({ title, value, colorClass = 'text-primary' }) => (
    <Card>
        <CardContent>
            <p className="text-text-secondary dark:text-slate-400 text-sm">{title}</p>
            <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
        </CardContent>
    </Card>
);

const ReportTable: FC<{ title: string, transactions: FinancialTransaction[], total: number }> = ({ title, transactions, total }) => (
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


const FinancePage: FC = () => {
    const [transactions, setTransactions] = useState<FinancialTransaction[]>(mockFinancialTransactions);
    const [view, setView] = useState<FinanceView>('contas');
    const [reportPeriod, setReportPeriod] = useState<ReportPeriod>('month');

    const handleMarkAsPaid = (transactionId: string) => {
        setTransactions(prev =>
            prev.map(t =>
                t.id === transactionId
                    ? { ...t, status: 'pago', paymentDate: new Date().toISOString() }
                    : t
            )
        );
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

        return { entradas, saidas, totalEntradas, totalSaidas };
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


    const renderView = () => {
        switch (view) {
            case 'contas':
                return (
                    <Card className="p-0">
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead><tr className="border-b border-border dark:border-slate-700"><th className="p-3">Vencimento</th><th className="p-3">Descrição</th><th className="p-3">Tipo</th><th className="p-3 text-right">Valor</th><th className="p-3 text-center">Status</th><th className="p-3 text-center">Ações</th></tr></thead>
                                    <tbody>
                                        {transactions.sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).map(t => (
                                            <tr key={t.id} className="border-b border-border dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                                <td className="p-3">{new Date(t.dueDate).toLocaleDateString()}</td>
                                                <td className="p-3">{t.description}</td>
                                                <td className={`p-3 font-semibold ${t.type === 'receita' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{t.type === 'receita' ? 'Receita' : 'Despesa'}</td>
                                                <td className="p-3 text-right font-mono">{t.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                                <td className="p-3 text-center"><TransactionStatusBadge status={t.status} /></td>
                                                <td className="p-3 text-center">
                                                    {t.status === 'pendente' && (
                                                        <Button size="sm" onClick={() => handleMarkAsPaid(t.id)}>Marcar como Pago</Button>
                                                    )}
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
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[400px]">
                            <ReportTable title="Relatório de Entradas (Receitas Pagas)" transactions={filteredReportTransactions.entradas} total={filteredReportTransactions.totalEntradas} />
                            <ReportTable title="Relatório de Saídas (Despesas Pagas)" transactions={filteredReportTransactions.saidas} total={filteredReportTransactions.totalSaidas} />
                         </div>
                    </div>
                );
        }
    };

    return (
        <div>
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