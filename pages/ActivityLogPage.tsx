import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { mockUsers } from '../data/mockData';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import type { Page, ActivityLog } from '../types';
import { ICONS } from '../constants';

interface ActivityLogPageProps {
    onNavigate: (page: Page, id: string) => void;
}

const getActivityConfig = (activityType: ActivityLog['activityType']): { page: Page | null, icon: React.ReactNode } => {
    if (activityType.includes('QUOTE')) return { page: 'quotes', icon: ICONS.quotes };
    if (activityType.includes('ORDER') && !activityType.includes('SERVICE')) return { page: 'orders', icon: ICONS.orders };
    if (activityType.includes('SERVICE_ORDER')) return { page: 'production', icon: ICONS.production };
    if (activityType.includes('CLIENT') || activityType.includes('NOTE')) return { page: 'crm', icon: ICONS.crm };
    if (activityType.includes('INVOICE')) return { page: 'invoices', icon: ICONS.invoices };
    if (activityType.includes('SUPPLIER')) return { page: 'suppliers', icon: ICONS.suppliers };
    if (activityType.includes('RECEIPT')) return { page: 'receipts', icon: ICONS.receipts };
    return { page: null, icon: ICONS.dashboard }; // Fallback icon
}

const ActivityLogPage: React.FC<ActivityLogPageProps> = ({ onNavigate }) => {
    const { activityLogs } = useData();
    const [userFilter, setUserFilter] = useState('');
    const [startDateFilter, setStartDateFilter] = useState('');
    const [endDateFilter, setEndDateFilter] = useState('');
    const [textFilter, setTextFilter] = useState('');

    const usersMap = useMemo(() => {
        return mockUsers.reduce((acc, user) => {
            acc[user.id] = user.name;
            return acc;
        }, {} as Record<string, string>);
    }, []);

    const filteredLogs = useMemo(() => {
        return activityLogs.filter(log => {
            const userMatch = userFilter ? log.userId === userFilter : true;
            
            const date = new Date(log.timestamp);
            const startMatch = startDateFilter ? new Date(startDateFilter) <= date : true;
            
            const end = endDateFilter ? new Date(endDateFilter) : null;
            if (end) {
                // Set to the end of the selected day to be inclusive
                end.setUTCHours(23, 59, 59, 999);
            }
            const endMatch = end ? date <= end : true;

            const textMatch = textFilter ? 
                log.details.toLowerCase().includes(textFilter.toLowerCase()) || 
                log.relatedEntityId.toLowerCase().includes(textFilter.toLowerCase()) : true;

            return userMatch && startMatch && endMatch && textMatch;
        });
    }, [activityLogs, userFilter, startDateFilter, endDateFilter, textFilter]);

    const handleEntityClick = (log: ActivityLog) => {
        const config = getActivityConfig(log.activityType);
        if (config.page) {
            onNavigate(config.page, log.relatedEntityId);
        }
    };
    
    return (
        <div>
            <h1 className="text-3xl font-bold text-text-primary dark:text-slate-100">Histórico de Atividades</h1>
            <p className="mt-2 text-text-secondary dark:text-slate-400">Auditoria de todas as ações importantes no sistema.</p>

            <Card className="mt-6">
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Input 
                            placeholder="Buscar por descrição ou ID..."
                            value={textFilter}
                            onChange={e => setTextFilter(e.target.value)}
                        />
                        <Select label="Filtrar por Usuário" value={userFilter} onChange={e => setUserFilter(e.target.value)}>
                            <option value="">Todos os Usuários</option>
                            {mockUsers.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
                        </Select>
                        <Input label="Data de Início" type="date" value={startDateFilter} onChange={e => setStartDateFilter(e.target.value)} />
                        <Input label="Data Final" type="date" value={endDateFilter} onChange={e => setEndDateFilter(e.target.value)} />
                    </div>
                </CardContent>
            </Card>

            <div className="mt-6 space-y-4">
                {filteredLogs.map(log => {
                    const config = getActivityConfig(log.activityType);
                    return (
                        <Card key={log.id} className="p-0">
                            <CardContent className="flex items-center space-x-4">
                                <div className="flex-shrink-0">
                                    <span className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-text-secondary dark:text-slate-300">
                                        {config.icon}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm">
                                        <span className="font-semibold text-text-primary dark:text-slate-100">{usersMap[log.userId] || 'Sistema'}</span>
                                        {' '}
                                        <span className="text-text-secondary dark:text-slate-300">{log.details}</span>
                                    </p>
                                    <button 
                                        onClick={() => handleEntityClick(log)}
                                        className="text-xs text-primary hover:underline font-mono disabled:text-text-secondary disabled:no-underline disabled:cursor-default"
                                        disabled={!config.page}
                                        aria-label={`Ver detalhes de ${log.relatedEntityId}`}
                                    >
                                        {log.relatedEntityId}
                                    </button>
                                </div>
                                <div className="text-sm text-text-secondary dark:text-slate-400 whitespace-nowrap text-right">
                                    <p>{new Date(log.timestamp).toLocaleDateString('pt-BR')}</p>
                                    <p className="text-xs">{new Date(log.timestamp).toLocaleTimeString('pt-BR')}</p>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
                {filteredLogs.length === 0 && (
                    <Card>
                        <CardContent className="text-center text-text-secondary dark:text-slate-400">
                            Nenhuma atividade encontrada com os filtros aplicados.
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default ActivityLogPage;