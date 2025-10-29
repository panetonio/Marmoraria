import React, { useState, useMemo, FC, DragEvent, useEffect } from 'react';
import type { ServiceOrder, ProductionStatus, LogisticsStatus, Vehicle } from '../types';
import { mockProductionProfessionals } from '../data/mockData';
import { useData } from '../context/DataContext';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Badge from '../components/ui/Badge';
import StatusBadge from '../components/ui/StatusBadge';
import Calendar from '../components/ui/Calendar';
import InstallationTermModal from '../components/InstallationTermModal';
import ReceiptTermModal from '../components/ReceiptTermModal';
import QrCodeScanner from '../components/QrCodeScanner';
import { productionStatusMap } from '../config/statusMaps';


const KANBAN_COLUMNS: { id: LogisticsStatus; title: string; color: string }[] = [
  { id: 'awaiting_scheduling', title: 'A Agendar', color: 'bg-purple-700' },
  { id: 'scheduled', title: 'Agendado', color: 'bg-blue-600' },
  { id: 'in_transit', title: 'Em Rota', color: 'bg-orange-700' },
  { id: 'delivered', title: 'Realizado', color: 'bg-indigo-600' },
  { id: 'completed', title: 'Finalizado', color: 'bg-green-800' },
];

const ScheduleModal: FC<{
    isOpen: boolean;
    order: ServiceOrder;
    onClose: () => void;
    onSave: (orderId: string, schedule: { vehicleId: string; start: string; end: string; teamIds: string[] }) => { success: boolean; message?: string };
}> = ({ isOpen, order, onClose, onSave }) => {
    const { clients, vehicles, deliveryRoutes, isVehicleAvailable } = useData();
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [teamIds, setTeamIds] = useState<string[]>([]);
    const [selectedVehicleId, setSelectedVehicleId] = useState('');
    const [error, setError] = useState('');
    const [showCalendar, setShowCalendar] = useState(false);

    const deliveryTeam = useMemo(() => mockProductionProfessionals.filter(p => p.role === 'entregador'), []);

    const existingRoute = useMemo(() => deliveryRoutes.find(route => route.serviceOrderId === order.id), [deliveryRoutes, order.id]);

    const client = useMemo(() => clients.find(c => c.name === order.clientName), [clients, order.clientName]);

    const formatDateInput = (value: Date) => {
        const year = value.getFullYear();
        const month = `${value.getMonth() + 1}`.padStart(2, '0');
        const day = `${value.getDate()}`.padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const formatTimeInput = (value: Date) => `${value.getHours().toString().padStart(2, '0')}:${value.getMinutes().toString().padStart(2, '0')}`;

    const combineDateTime = (dateValue: string, timeValue: string) => new Date(`${dateValue}T${timeValue}`).toISOString();

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        setTeamIds(order.deliveryTeamIds || []);

        if (order.deliveryStart) {
            const start = new Date(order.deliveryStart);
            setDate(formatDateInput(start));
            setStartTime(formatTimeInput(start));
        } else if (existingRoute) {
            const start = new Date(existingRoute.start);
            setDate(formatDateInput(start));
            setStartTime(formatTimeInput(start));
        } else {
            setDate('');
            setStartTime('');
        }

        if (order.deliveryEnd) {
            const end = new Date(order.deliveryEnd);
            setEndTime(formatTimeInput(end));
        } else if (existingRoute) {
            const end = new Date(existingRoute.end);
            setEndTime(formatTimeInput(end));
        } else {
            setEndTime('');
        }

        setSelectedVehicleId(order.vehicleId || existingRoute?.vehicleId || '');
        setError('');
    }, [isOpen, order, existingRoute]);

    const startIso = useMemo(() => (date && startTime ? combineDateTime(date, startTime) : ''), [date, startTime]);
    const endIso = useMemo(() => (date && endTime ? combineDateTime(date, endTime) : ''), [date, endTime]);

    const availableVehicles = useMemo(() => {
        if (!startIso || !endIso) {
            return vehicles.filter(vehicle => vehicle.status !== 'em_manutencao');
        }
        return vehicles.filter(vehicle => {
            if (vehicle.status === 'em_manutencao') {
                return false;
            }
            return isVehicleAvailable(vehicle.id, startIso, endIso, existingRoute?.id);
        });
    }, [vehicles, startIso, endIso, isVehicleAvailable, existingRoute?.id]);

    const handleSave = () => {
        if (!date || !startTime || !endTime) {
            setError('Data e horários são obrigatórios.');
            return;
        }
        if (!selectedVehicleId) {
            setError('Selecione um veículo disponível.');
            return;
        }
        if (teamIds.length === 0) {
            setError('Selecione ao menos um membro da equipe.');
            return;
        }
        if (!startIso || !endIso || new Date(startIso) >= new Date(endIso)) {
            setError('O horário final deve ser posterior ao horário inicial.');
            return;
        }
        const result = onSave(order.id, { vehicleId: selectedVehicleId, start: startIso, end: endIso, teamIds });
        if (!result.success) {
            setError(result.message || 'Não foi possível agendar a entrega.');
            return;
        }
        setError('');
        onClose();
    };

    const handleDateChange = (newDate: string) => {
        setDate(newDate);
        setShowCalendar(false);
    };

    const formatWhatsAppLink = (phone: string) => {
        // Remove todos os caracteres não numéricos
        const cleanPhone = phone.replace(/\D/g, '');
        // Adiciona o código do país se não tiver
        const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
        return `https://wa.me/${fullPhone}`;
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Agendar Entrega/Instalação: ${order.id}`}>
            <div className="space-y-6">
                {/* Informações do Cliente */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-border dark:border-slate-700">
                    <h3 className="font-semibold text-text-primary dark:text-slate-100 mb-3">📋 Informações do Cliente</h3>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-text-secondary dark:text-slate-400">Nome:</span>
                            <span className="text-sm text-text-primary dark:text-slate-100">{order.clientName}</span>
                        </div>
                        {client?.phone && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-text-secondary dark:text-slate-400">WhatsApp:</span>
                                <div className="flex items-center space-x-2">
                                    <span className="text-sm text-text-primary dark:text-slate-100">{client.phone}</span>
                                    <a
                                        href={formatWhatsAppLink(client.phone)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                                        title="Abrir WhatsApp"
                                    >
                                        📱 WhatsApp
                                    </a>
                                </div>
                            </div>
                        )}
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-text-secondary dark:text-slate-400">Endereço:</span>
                            <span className="text-sm text-text-primary dark:text-slate-100 text-right">
                                {order.deliveryAddress.address}, {order.deliveryAddress.number}
                                {order.deliveryAddress.complement && `, ${order.deliveryAddress.complement}`}
                                <br />
                                {order.deliveryAddress.neighborhood} - {order.deliveryAddress.city}/{order.deliveryAddress.uf}
                                <br />
                                CEP: {order.deliveryAddress.cep}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-2">
                            📅 Data da Entrega/Instalação
                        </label>
                        <div className="space-y-3">
                            <div className="flex items-center space-x-3">
                                <Input
                                    label=""
                                    type="date"
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="flex-1"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setShowCalendar(!showCalendar)}
                                    className="whitespace-nowrap"
                                >
                                    📅 Calendário
                                </Button>
                            </div>
                            {showCalendar && (
                                <div className="flex justify-center">
                                    <Calendar
                                        value={date}
                                        onChange={handleDateChange}
                                        minDate={new Date().toISOString().split('T')[0]}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input
                            label="Horário de início"
                            type="time"
                            value={startTime}
                            onChange={e => setStartTime(e.target.value)}
                        />
                        <Input
                            label="Horário de término"
                            type="time"
                            value={endTime}
                            onChange={e => setEndTime(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-2">
                            🚚 Veículo
                        </label>
                        {availableVehicles.length > 0 ? (
                            <Select value={selectedVehicleId} onChange={e => setSelectedVehicleId(e.target.value)}>
                                <option value="">Selecione um veículo</option>
                                {availableVehicles.map(vehicle => (
                                    <option key={vehicle.id} value={vehicle.id}>
                                        {vehicle.name} • Placa {vehicle.licensePlate} • {vehicle.capacity.toLocaleString('pt-BR')} kg
                                    </option>
                                ))}
                            </Select>
                        ) : (
                            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                                Nenhum veículo disponível para o período selecionado. Ajuste a data/horário ou libere um veículo.
                            </p>
                        )}
                        <p className="text-xs text-text-secondary dark:text-slate-500 mt-2">
                            Veículos em manutenção são ocultados automaticamente.
                        </p>
                    </div>
                </div>

                {/* Seleção da Equipe */}
                <div>
                    <label className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-2">
                        👥 Equipe de Entrega/Instalação
                    </label>
                    <div className="space-y-2 p-3 border border-border dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-800/50">
                        {deliveryTeam.length > 0 ? (
                            deliveryTeam.map(p => (
                                <label key={p.id} className="flex items-center p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500" 
                                        checked={teamIds.includes(p.id)} 
                                        onChange={() => setTeamIds(prev => prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id])} 
                                    />
                                    <span className="ml-3 text-sm text-text-primary dark:text-slate-100">{p.name}</span>
                                </label>
                            ))
                        ) : (
                            <p className="text-sm text-text-secondary dark:text-slate-400 text-center py-4">
                                Nenhum entregador disponível. Adicione funcionários de produção com função "entregador".
                            </p>
                        )}
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                        <p className="text-red-600 dark:text-red-400 text-sm text-center">{error}</p>
                    </div>
                )}
            </div>
            
            <div className="flex justify-end mt-6 space-x-3">
                <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSave} disabled={!date || !startTime || !endTime || !selectedVehicleId || teamIds.length === 0}>
                    Agendar Entrega
                </Button>
            </div>
        </Modal>
    );
};

const DepartureChecklistModal: FC<{
    isOpen: boolean;
    order: ServiceOrder;
    onClose: () => void;
    onSave: (orderId: string, checklist: { id: string; text: string; checked: boolean }[]) => Promise<{ success: boolean; message?: string }>;
}> = ({ isOpen, order, onClose, onSave }) => {
    const [checklistItems, setChecklistItems] = useState<{ id: string; text: string; checked: boolean }[]>(order.departureChecklist || []);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            return;
        }
        setChecklistItems(order.departureChecklist || []);
        setError('');
        setSuccessMessage('');
    }, [isOpen, order]);

    const toggleItem = (itemId: string) => {
        setChecklistItems(prev => prev.map(item => item.id === itemId ? { ...item, checked: !item.checked } : item));
    };

    const handleMarkAll = (checked: boolean) => {
        setChecklistItems(prev => prev.map(item => ({ ...item, checked })));
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError('');
        setSuccessMessage('');
        try {
            const result = await onSave(order.id, checklistItems);
            if (result.success) {
                setSuccessMessage(result.message || 'Checklist atualizado com sucesso.');
            } else {
                setError(result.message || 'Não foi possível atualizar o checklist.');
            }
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Checklist de Saída • ${order.id}`} className="max-w-3xl">
            <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <p className="text-sm text-text-secondary dark:text-slate-400">Cliente</p>
                        <p className="text-base font-semibold text-text-primary dark:text-slate-100">{order.clientName}</p>
                    </div>
                    <div className="text-sm text-text-secondary dark:text-slate-400">
                        <span className="font-semibold text-text-primary dark:text-slate-100">Itens selecionados:</span>{' '}
                        {checklistItems.filter(item => item.checked).length}/{checklistItems.length}
                    </div>
                </div>

                {checklistItems.length === 0 ? (
                    <div className="p-4 border border-dashed border-border dark:border-slate-700 rounded-lg text-center text-sm text-text-secondary dark:text-slate-400">
                        Nenhum checklist configurado para esta OS. Defina um modelo na geração ou adicione manualmente pelo backend.
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                            <Button type="button" variant="secondary" size="sm" onClick={() => handleMarkAll(true)}>
                                Marcar tudo
                            </Button>
                            <Button type="button" variant="ghost" size="sm" onClick={() => handleMarkAll(false)}>
                                Desmarcar tudo
                            </Button>
                        </div>
                        <div className="space-y-2">
                            {checklistItems.map((item, index) => (
                                <label
                                    key={item.id}
                                    className={`flex items-center gap-3 p-3 rounded-lg border transition ${item.checked
                                        ? 'border-green-400 bg-green-50 dark:bg-green-900/20'
                                        : 'border-border dark:border-slate-700 hover:border-primary/50'}`}
                                >
                                    <input
                                        type="checkbox"
                                        className="h-5 w-5 rounded text-primary focus:ring-primary"
                                        checked={item.checked}
                                        onChange={() => toggleItem(item.id)}
                                    />
                                    <span className="flex-1 text-sm text-text-primary dark:text-slate-100">{index + 1}. {item.text}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
                        {error}
                    </div>
                )}

                {successMessage && (
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-700 dark:text-green-300">
                        {successMessage}
                    </div>
                )}

                <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
                    <Button variant="ghost" onClick={onClose}>Fechar</Button>
                    <Button onClick={handleSave} disabled={checklistItems.length === 0 || isSaving}>
                        {isSaving ? 'Salvando...' : 'Salvar Checklist'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

const LogisticsKanbanCard: FC<{
    order: ServiceOrder,
    onSchedule: (order: ServiceOrder) => void,
    onStartRoute: (orderId: string) => void,
    onArrive: (orderId: string) => void,
    onConfirmDelivery: (orderId: string) => void,
    onConfirmInstallation: (orderId: string) => void,
    onGenerateReceiptTerm: (order: ServiceOrder) => void,
    onGenerateInstallTerm: (order: ServiceOrder) => void,
    vehicles: Vehicle[],
    onOpenChecklist: (order: ServiceOrder) => void,
}> = ({
    order, onSchedule, onStartRoute, onArrive, onConfirmDelivery, onConfirmInstallation,
    onGenerateReceiptTerm, onGenerateInstallTerm, vehicles, onOpenChecklist
}) => {
    // Detectar status de exceção
    const isExceptionStatus = [
        'rework_needed', 'delivery_issue', 'installation_pending_review', 'installation_issue',
        'quality_issue', 'material_shortage', 'equipment_failure', 'customer_not_available',
        'weather_delay', 'permit_issue', 'measurement_error', 'design_change'
    ].includes(order.status);
    
    const isCriticalException = [
        'rework_needed', 'delivery_issue', 'installation_issue', 'quality_issue',
        'material_shortage', 'equipment_failure', 'permit_issue', 'measurement_error'
    ].includes(order.status);

    const assignedVehicle = order.vehicleId ? vehicles.find(vehicle => vehicle.id === order.vehicleId) : undefined;
    const deliveryStart = order.deliveryStart || order.deliveryScheduledDate;
    const startDate = deliveryStart ? new Date(deliveryStart) : null;
    const endDate = order.deliveryEnd ? new Date(order.deliveryEnd) : null;

    return (
        <Card className={`p-3 mt-3 shadow-sm border relative ${
            isExceptionStatus 
              ? isCriticalException 
                ? 'border-red-500 dark:border-red-400 bg-red-50/50 dark:bg-red-900/20' 
                : 'border-yellow-500 dark:border-yellow-400 bg-yellow-50/50 dark:bg-yellow-900/20'
              : 'border-border dark:border-slate-700'
        }`}>
            {/* Ícone de alerta para status de exceção */}
            {isExceptionStatus && (
                <div className={`absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center shadow-lg ${
                    isCriticalException 
                        ? 'bg-red-500 text-white' 
                        : 'bg-yellow-500 text-white'
                }`}>
                    <span className="text-xs font-bold">⚠</span>
                </div>
            )}
            
            <div className="flex justify-between items-start gap-2">
                <p className="font-bold text-sm font-mono">{order.id}</p>
                <div className="flex gap-2 items-center">
                    <div className="flex gap-1">
                        {order.finalizationType === 'delivery_installation' && <Badge variant="primary">Instalação</Badge>}
                        {order.finalizationType !== 'pickup' && <Badge variant="success">Entrega</Badge>}
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => onOpenChecklist(order)}>
                        Checklist
                    </Button>
                </div>
            </div>
            <p className="text-text-secondary dark:text-slate-400 text-sm mt-1">{order.clientName}</p>
            
            {/* StatusBadge para status de exceção */}
            {isExceptionStatus && (
                <div className="mt-2">
                    <StatusBadge status={order.status} statusMap={productionStatusMap} />
                </div>
            )}
            {startDate && (
                <div className="mt-2 text-sm text-text-secondary dark:text-slate-300">
                    <div className="font-semibold text-primary">
                        {startDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' })}
                        {' '}•{' '}
                        {startDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        {endDate && (
                            <span className="text-xs text-text-secondary dark:text-slate-400"> — {endDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                        )}
                    </div>
                    {assignedVehicle && (
                        <div className="flex items-center gap-2 mt-1 text-xs text-text-secondary dark:text-slate-400">
                            <span className="font-medium text-text-primary dark:text-slate-200">Veículo:</span>
                            <span>{assignedVehicle.name} ({assignedVehicle.licensePlate})</span>
                        </div>
                    )}
                </div>
            )}

            <div className="mt-3 pt-3 border-t border-border dark:border-slate-700 space-y-2">
                {/* Primary Status-Changing Actions */}
                {order.logisticsStatus === 'awaiting_scheduling' && <Button size="sm" className="w-full" onClick={() => onSchedule(order)}>Agendar</Button>}
                {order.logisticsStatus === 'scheduled' && <Button size="sm" className="w-full" onClick={() => onStartRoute(order.id)}>Iniciar Rota</Button>}
                {order.logisticsStatus === 'in_transit' && <Button size="sm" className="w-full" onClick={() => onArrive(order.id)}>Chegou ao Destino</Button>}
                
                {/* Confirmation Actions (in 'Realizado' column) */}
                {order.logisticsStatus === 'delivered' && (
                    <div className="space-y-2">
                        {order.finalizationType !== 'pickup' && !order.delivery_confirmed && (
                             <Button size="sm" className="w-full" variant="secondary" onClick={() => onConfirmDelivery(order.id)}>Confirmar Entrega</Button>
                        )}
                        {order.finalizationType !== 'pickup' && order.delivery_confirmed && (
                            <div className="text-sm font-semibold text-green-600 flex items-center justify-center gap-1 p-1 bg-green-100 dark:bg-green-900/50 rounded-md">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                Entrega Concluída
                            </div>
                        )}
                        
                        {order.finalizationType === 'delivery_installation' && !order.installation_confirmed && (
                             <Button size="sm" className="w-full" variant="secondary" onClick={() => onConfirmInstallation(order.id)} disabled={!order.delivery_confirmed}>Confirmar Instalação</Button>
                        )}
                         {order.finalizationType === 'delivery_installation' && order.installation_confirmed && (
                             <div className="text-sm font-semibold text-green-600 flex items-center justify-center gap-1 p-1 bg-green-100 dark:bg-green-900/50 rounded-md">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                Instalação Concluída
                            </div>
                        )}
                    </div>
                )}
                
                {/* Document Generation */}
                {( (order.logisticsStatus === 'awaiting_scheduling' || order.logisticsStatus === 'scheduled') && order.finalizationType !== 'pickup') || order.installation_confirmed ? (
                    <div className="!mt-3 pt-2 border-t border-dashed space-y-2">
                        {(order.logisticsStatus === 'awaiting_scheduling' || order.logisticsStatus === 'scheduled') && order.finalizationType !== 'pickup' && (
                            <Button size="sm" variant="ghost" className="w-full" onClick={() => onGenerateReceiptTerm(order)}>Gerar Termo Recebimento</Button>
                        )}
                        {order.installation_confirmed && (
                            <Button size="sm" variant="ghost" className="w-full" onClick={() => onGenerateInstallTerm(order)}>Gerar Termo Instalação</Button>
                        )}
                    </div>
                ) : null}
            </div>
        </Card>
    );
};


const LogisticsPage: FC = () => {
    const { serviceOrders, scheduleDelivery, confirmDelivery, confirmInstallation, vehicles, updateDepartureChecklist, refreshServiceOrder, deliveryRoutes } = useData();
    const [schedulingOrder, setSchedulingOrder] = useState<ServiceOrder | null>(null);
    const [generatingReceiptTermOrder, setGeneratingReceiptTermOrder] = useState<ServiceOrder | null>(null);
    const [generatingInstallTermOrder, setGeneratingInstallTermOrder] = useState<ServiceOrder | null>(null);
    const [activeChecklistOrder, setActiveChecklistOrder] = useState<ServiceOrder | null>(null);

    // Functions to handle route status updates
    const handleStartRoute = async (orderId: string) => {
        try {
            // Find the delivery route for this order
            const route = deliveryRoutes.find(r => r.serviceOrderId === orderId);
            if (route) {
                // Update route status to 'in_progress' via API
                const response = await fetch(`/api/delivery-routes/${route.id}/status`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ status: 'in_progress' })
                });
                
                if (response.ok) {
                    // Refresh ServiceOrder to get updated status from backend hooks
                    await refreshServiceOrder(orderId);
                } else {
                    console.error('Failed to start route');
                }
            }
        } catch (error) {
            console.error('Error starting route:', error);
        }
    };

    const handleArriveAtDestination = async (orderId: string) => {
        try {
            // Find the delivery route for this order
            const route = deliveryRoutes.find(r => r.serviceOrderId === orderId);
            if (route) {
                // Update route status to 'completed' via API
                const response = await fetch(`/api/delivery-routes/${route.id}/status`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ status: 'completed' })
                });
                
                if (response.ok) {
                    // Refresh ServiceOrder to get updated status from backend hooks
                    await refreshServiceOrder(orderId);
                } else {
                    console.error('Failed to complete route');
                }
            }
        } catch (error) {
            console.error('Error completing route:', error);
        }
    };

    const logisticsOrders = useMemo(() => {
        const logisticsStatuses: LogisticsStatus[] = ['awaiting_scheduling', 'scheduled', 'in_transit', 'delivered', 'completed'];
        return serviceOrders.filter(o => logisticsStatuses.includes(o.logisticsStatus));
    }, [serviceOrders]);

    useEffect(() => {
        if (!activeChecklistOrder) {
            return;
        }
        const updated = serviceOrders.find(order => order.id === activeChecklistOrder.id);
        if (updated && updated !== activeChecklistOrder) {
            setActiveChecklistOrder(updated);
        }
    }, [serviceOrders, activeChecklistOrder]);

    return (
        <div>
            {schedulingOrder && <ScheduleModal isOpen={!!schedulingOrder} order={schedulingOrder} onClose={() => setSchedulingOrder(null)} onSave={scheduleDelivery} />}
            {activeChecklistOrder && (
                <DepartureChecklistModal
                    isOpen={!!activeChecklistOrder}
                    order={activeChecklistOrder}
                    onClose={() => setActiveChecklistOrder(null)}
                    onSave={updateDepartureChecklist}
                />
            )}
            {generatingReceiptTermOrder && (
                <ReceiptTermModal
                    isOpen={!!generatingReceiptTermOrder}
                    onClose={() => setGeneratingReceiptTermOrder(null)}
                    order={generatingReceiptTermOrder}
                />
            )}
            {generatingInstallTermOrder && (
                <InstallationTermModal
                    isOpen={!!generatingInstallTermOrder}
                    onClose={() => setGeneratingInstallTermOrder(null)}
                    order={generatingInstallTermOrder}
                />
            )}

            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary dark:text-slate-100">Painel de Logística</h1>
                    <p className="mt-2 text-text-secondary dark:text-slate-400">Gerencie e agende as entregas e instalações.</p>
                </div>
            </div>

            <div className="mt-6">
                <QrCodeScanner />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-5 mt-6 h-[75vh]">
                {KANBAN_COLUMNS.map(column => (
                    <div key={column.id} className="bg-slate-100 dark:bg-slate-800/50 rounded-lg p-3 flex flex-col">
                        <div className={`flex items-center mb-4 border-l-4 pl-2 ${column.color.replace('bg-', 'border-')}`}>
                            <div className={`w-3 h-3 rounded-full mr-2 ${column.color}`}></div>
                            <h3 className="font-semibold text-text-primary dark:text-slate-100">{column.title}</h3>
                        </div>
                            <div className="flex-1 overflow-y-auto pr-1">
                            {logisticsOrders.filter(o => o.logisticsStatus === column.id).map(order => (
                                <LogisticsKanbanCard
                                    key={order.id}
                                    order={order}
                                    onSchedule={setSchedulingOrder}
                                    onStartRoute={handleStartRoute}
                                    onArrive={handleArriveAtDestination}
                                    onConfirmDelivery={confirmDelivery}
                                    onConfirmInstallation={confirmInstallation}
                                    onGenerateReceiptTerm={setGeneratingReceiptTermOrder}
                                    onGenerateInstallTerm={setGeneratingInstallTermOrder}
                                    vehicles={vehicles}
                                    onOpenChecklist={setActiveChecklistOrder}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LogisticsPage;