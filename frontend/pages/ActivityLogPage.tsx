import React, { useState, useMemo, FC } from 'react';
import type { ActivityLog, ActivityType } from '../types';
import { useData } from '../context/DataContext';
import Card, { CardHeader, CardContent } from '../components/ui/Card';
import Input from '../components/ui/Input';
import DateInput from '../components/ui/DateInput';
import Select from '../components/ui/Select';
import { getActivityTypeIcon, getActivityTypeColor } from '../config/activityLabels';

const ActivityLogCard: FC<{ activity: ActivityLog }> = ({ activity }) => {
    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        return {
            date: date.toLocaleDateString('pt-BR'),
            time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        };
    };

    const { date, time } = formatTimestamp(activity.timestamp);

    return (
        <Card className="p-4 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                        <span className="text-lg">{getActivityTypeIcon(activity.activityType)}</span>
                    </div>
                </div>
                
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className={`font-semibold ${getActivityTypeColor(activity.activityType)}`}>
                            {activity.activityTypeLabel}
                        </h3>
                        <div className="text-sm text-text-secondary dark:text-slate-400">
                            <div>{date}</div>
                            <div>{time}</div>
                        </div>
                    </div>
                    
                    <div className="space-y-1 text-sm">
                        <div className="flex items-center space-x-2">
                            <span className="text-text-secondary dark:text-slate-400">Por:</span>
                            <span className="font-medium text-text-primary dark:text-slate-100">
                                {activity.userName}
                            </span>
                        </div>
                        
                        {activity.relatedEntityName && (
                            <div className="flex items-center space-x-2">
                                <span className="text-text-secondary dark:text-slate-400">Entidade:</span>
                                <span className="font-medium text-text-primary dark:text-slate-100">
                                    {activity.relatedEntityName}
                                </span>
                                {activity.relatedEntityId && (
                                    <span className="text-xs text-text-secondary dark:text-slate-400 font-mono">
                                        ({activity.relatedEntityId})
                                    </span>
                                )}
                            </div>
                        )}
                        
                        {activity.details && Object.keys(activity.details).length > 0 && (
                            <div className="mt-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded text-xs">
                                <div className="font-medium text-text-secondary dark:text-slate-400 mb-1">Detalhes:</div>
                                <div className="space-y-1">
                                    {Object.entries(activity.details).map(([key, value]) => (
                                        <div key={key} className="flex justify-between">
                                            <span className="text-text-secondary dark:text-slate-400 capitalize">
                                                {key.replace(/([A-Z])/g, ' $1').trim()}:
                                            </span>
                                            <span className="text-text-primary dark:text-slate-100 font-medium">
                                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
};

const ActivityLogPage: React.FC = () => {
    const { activityLogs, users } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [activityTypeFilter, setActivityTypeFilter] = useState<string>('');
    const [userFilter, setUserFilter] = useState<string>('');
    const [entityTypeFilter, setEntityTypeFilter] = useState<string>('');
    const [dateFromFilter, setDateFromFilter] = useState<string>('');
    const [dateToFilter, setDateToFilter] = useState<string>('');

    const filteredActivityLogs = useMemo(() => {
        return activityLogs.filter(activity => {
            const matchesSearch = !searchTerm || 
                activity.activityTypeLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
                activity.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                activity.relatedEntityName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                activity.relatedEntityId?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesActivityType = !activityTypeFilter || activity.activityType === activityTypeFilter;
            const matchesUser = !userFilter || activity.userId === userFilter;
            const matchesEntityType = !entityTypeFilter || activity.relatedEntityType === entityTypeFilter;
            
            const activityDate = new Date(activity.timestamp);
            const matchesDateFrom = !dateFromFilter || activityDate >= new Date(dateFromFilter);
            const matchesDateTo = !dateToFilter || activityDate <= new Date(dateToFilter + 'T23:59:59');

            return matchesSearch && matchesActivityType && matchesUser && matchesEntityType && matchesDateFrom && matchesDateTo;
        }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [activityLogs, searchTerm, activityTypeFilter, userFilter, entityTypeFilter, dateFromFilter, dateToFilter]);

    // Estatísticas
    const stats = useMemo(() => {
        const total = activityLogs.length;
        const today = new Date().toDateString();
        const todayCount = activityLogs.filter(log => 
            new Date(log.timestamp).toDateString() === today
        ).length;
        
        const uniqueUsers = new Set(activityLogs.map(log => log.userId)).size;
        const uniqueEntities = new Set(activityLogs.map(log => log.relatedEntityType).filter(Boolean)).size;

        return { total, todayCount, uniqueUsers, uniqueEntities };
    }, [activityLogs]);

    // Obter tipos de atividade únicos para o filtro
    const activityTypes = useMemo(() => {
        const types = new Set(activityLogs.map(log => log.activityType));
        return Array.from(types).sort();
    }, [activityLogs]);

    // Obter tipos de entidade únicos para o filtro
    const entityTypes = useMemo(() => {
        const types = new Set(activityLogs.map(log => log.relatedEntityType).filter(Boolean));
        return Array.from(types).sort();
    }, [activityLogs]);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary dark:text-slate-100">Histórico de Atividades</h1>
                    <p className="mt-2 text-text-secondary dark:text-slate-400">
                        Rastreabilidade completa de todas as ações no sistema
                    </p>
                </div>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="p-4 text-center">
                    <div className="text-2xl font-bold text-text-primary dark:text-slate-100">{stats.total}</div>
                    <div className="text-sm text-text-secondary dark:text-slate-400">Total de Atividades</div>
                </Card>
                <Card className="p-4 text-center">
                    <div className="text-2xl font-bold text-text-primary dark:text-slate-100">{stats.todayCount}</div>
                    <div className="text-sm text-text-secondary dark:text-slate-400">Hoje</div>
                </Card>
                <Card className="p-4 text-center">
                    <div className="text-2xl font-bold text-text-primary dark:text-slate-100">{stats.uniqueUsers}</div>
                    <div className="text-sm text-text-secondary dark:text-slate-400">Usuários Ativos</div>
                </Card>
                <Card className="p-4 text-center">
                    <div className="text-2xl font-bold text-text-primary dark:text-slate-100">{stats.uniqueEntities}</div>
                    <div className="text-sm text-text-secondary dark:text-slate-400">Tipos de Entidade</div>
                </Card>
            </div>

            {/* Filtros */}
            <Card className="p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    <Input
                        label="Buscar"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar atividades..."
                    />
                    
                    <Select
                        label="Tipo de Atividade"
                        value={activityTypeFilter}
                        onChange={(e) => setActivityTypeFilter(e.target.value)}
                    >
                        <option value="">Todos os Tipos</option>
                        {activityTypes.map(type => (
                            <option key={type} value={type}>{type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
                        ))}
                    </Select>
                    
                    <Select
                        label="Usuário"
                        value={userFilter}
                        onChange={(e) => setUserFilter(e.target.value)}
                    >
                        <option value="">Todos os Usuários</option>
                        {users.map(user => (
                            <option key={user.id} value={user.id}>{user.name}</option>
                        ))}
                    </Select>
                    
                    <Select
                        label="Tipo de Entidade"
                        value={entityTypeFilter}
                        onChange={(e) => setEntityTypeFilter(e.target.value)}
                    >
                        <option value="">Todas as Entidades</option>
                        {entityTypes.map(type => (
                            <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                        ))}
                    </Select>
                    
                    <DateInput
                        label="Data Inicial"
                        value={dateFromFilter}
                        onChange={(value) => setDateFromFilter(value)}
                    />
                    
                    <DateInput
                        label="Data Final"
                        value={dateToFilter}
                        onChange={(value) => setDateToFilter(value)}
                    />
                </div>
            </Card>

            {/* Lista de Atividades */}
            <div className="space-y-4">
                {filteredActivityLogs.length > 0 ? (
                    filteredActivityLogs.map(activity => (
                        <ActivityLogCard key={activity.id} activity={activity} />
                    ))
                ) : (
                    <Card className="p-8 text-center">
                        <div className="text-text-secondary dark:text-slate-400">
                            <div className="text-4xl mb-4">📋</div>
                            <div className="text-lg font-medium mb-2">Nenhuma atividade encontrada</div>
                            <div className="text-sm">
                                {searchTerm || activityTypeFilter || userFilter || entityTypeFilter || dateFromFilter || dateToFilter
                                    ? 'Tente ajustar os filtros para encontrar atividades.'
                                    : 'Ainda não há atividades registradas no sistema.'
                                }
                            </div>
                        </div>
                    </Card>
                )}
            </div>

            {/* Paginação simples */}
            {filteredActivityLogs.length > 50 && (
                <div className="mt-6 text-center text-text-secondary dark:text-slate-400">
                    Mostrando {Math.min(50, filteredActivityLogs.length)} de {filteredActivityLogs.length} atividades
                </div>
            )}
        </div>
    );
};

export default ActivityLogPage;