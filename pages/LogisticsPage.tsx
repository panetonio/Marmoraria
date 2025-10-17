import React, { useState, useMemo, FC, DragEvent } from 'react';
import type { ServiceOrder, ProductionStatus } from '../types';
import { mockProductionProfessionals } from '../data/mockData';
import { useData } from '../context/DataContext';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import InstallationTermModal from '../components/InstallationTermModal';
import ReceiptTermModal from '../components/ReceiptTermModal';


const KANBAN_COLUMNS: { id: ProductionStatus; title: string; color: string }[] = [
  { id: 'ready_for_logistics', title: 'A Agendar', color: 'bg-purple-700' },
  { id: 'scheduled', title: 'Agendado', color: 'bg-blue-600' },
  { id: 'in_transit', title: 'Em Rota', color: 'bg-orange-700' },
  { id: 'realizado', title: 'Realizado', color: 'bg-indigo-600' },
  { id: 'completed', title: 'Finalizado', color: 'bg-green-800' },
];

const ScheduleModal: FC<{
    isOpen: boolean;
    order: ServiceOrder;
    onClose: () => void;
    onSave: (orderId: string, date: string, teamIds: string[]) => void;
}> = ({ isOpen, order, onClose, onSave }) => {
    const [date, setDate] = useState('');
    const [teamIds, setTeamIds] = useState<string[]>([]);
    const [error, setError] = useState('');

    const deliveryTeam = useMemo(() => mockProductionProfessionals.filter(p => p.role === 'entregador'), []);

    const handleSave = () => {
        if (!date || teamIds.length === 0) {
            setError('Data e equipe são obrigatórios.');
            return;
        }
        setError('');
        onSave(order.id, date, teamIds);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Agendar Entrega/Instalação: ${order.id}`}>
            <div className="space-y-4">
                <Input label="Data" type="date" value={date} onChange={e => setDate(e.target.value)} />
                <div>
                    <label className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">Equipe</label>
                    <div className="space-y-2 p-2 border border-border dark:border-slate-600 rounded-md">
                        {deliveryTeam.map(p => (
                            <label key={p.id} className="flex items-center">
                                <input type="checkbox" className="h-4 w-4 rounded" checked={teamIds.includes(p.id)} onChange={() => setTeamIds(prev => prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id])} />
                                <span className="ml-2">{p.name}</span>
                            </label>
                        ))}
                    </div>
                </div>
                {error && <p className="text-error text-sm text-center">{error}</p>}
            </div>
            <div className="flex justify-end mt-6 space-x-3">
                <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSave}>Agendar</Button>
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
}> = ({ 
    order, onSchedule, onStartRoute, onArrive, onConfirmDelivery, onConfirmInstallation, 
    onGenerateReceiptTerm, onGenerateInstallTerm 
}) => {
    
    return (
        <Card className="p-3 mt-3 shadow-sm border border-border dark:border-slate-700">
            <div className="flex justify-between items-start gap-2">
                <p className="font-bold text-sm font-mono">{order.id}</p>
                <div className="flex gap-1">
                    {order.finalizationType === 'delivery_installation' && <Badge variant="primary">Instalação</Badge>}
                    {order.finalizationType !== 'pickup' && <Badge variant="success">Entrega</Badge>}
                </div>
            </div>
            <p className="text-text-secondary dark:text-slate-400 text-sm mt-1">{order.clientName}</p>
            {(order.status === 'scheduled' || order.status === 'in_transit') && order.deliveryScheduledDate && (
                <div className="mt-2 text-sm font-semibold text-primary">
                    {new Date(order.deliveryScheduledDate).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' })}
                </div>
            )}
            
            <div className="mt-3 pt-3 border-t border-border dark:border-slate-700 space-y-2">
                {/* Primary Status-Changing Actions */}
                {order.status === 'ready_for_logistics' && <Button size="sm" className="w-full" onClick={() => onSchedule(order)}>Agendar</Button>}
                {order.status === 'scheduled' && <Button size="sm" className="w-full" onClick={() => onStartRoute(order.id)}>Iniciar Rota</Button>}
                {order.status === 'in_transit' && <Button size="sm" className="w-full" onClick={() => onArrive(order.id)}>Chegou ao Destino</Button>}
                
                {/* Confirmation Actions (in 'Realizado' column) */}
                {order.status === 'realizado' && (
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
                {( (order.status === 'ready_for_logistics' || order.status === 'scheduled') && order.finalizationType !== 'pickup') || order.installation_confirmed ? (
                    <div className="!mt-3 pt-2 border-t border-dashed space-y-2">
                        {(order.status === 'ready_for_logistics' || order.status === 'scheduled') && order.finalizationType !== 'pickup' && (
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
    const { serviceOrders, scheduleDelivery, updateServiceOrderStatus, confirmDelivery, confirmInstallation } = useData();
    const [schedulingOrder, setSchedulingOrder] = useState<ServiceOrder | null>(null);
    const [generatingReceiptTermOrder, setGeneratingReceiptTermOrder] = useState<ServiceOrder | null>(null);
    const [generatingInstallTermOrder, setGeneratingInstallTermOrder] = useState<ServiceOrder | null>(null);

    const logisticsOrders = useMemo(() => {
        const logisticsStatuses: ProductionStatus[] = ['ready_for_logistics', 'scheduled', 'in_transit', 'realizado', 'completed'];
        return serviceOrders.filter(o => logisticsStatuses.includes(o.status));
    }, [serviceOrders]);

    return (
        <div>
            {schedulingOrder && <ScheduleModal isOpen={!!schedulingOrder} order={schedulingOrder} onClose={() => setSchedulingOrder(null)} onSave={scheduleDelivery} />}
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

            <div className="grid grid-cols-1 md:grid-cols-5 gap-5 mt-6 h-[75vh]">
                {KANBAN_COLUMNS.map(column => (
                    <div key={column.id} className="bg-slate-100 dark:bg-slate-800/50 rounded-lg p-3 flex flex-col">
                        <div className={`flex items-center mb-4 border-l-4 pl-2 ${column.color.replace('bg-', 'border-')}`}>
                            <div className={`w-3 h-3 rounded-full mr-2 ${column.color}`}></div>
                            <h3 className="font-semibold text-text-primary dark:text-slate-100">{column.title}</h3>
                        </div>
                            <div className="flex-1 overflow-y-auto pr-1">
                            {logisticsOrders.filter(o => o.status === column.id).map(order => (
                                <LogisticsKanbanCard 
                                    key={order.id} 
                                    order={order} 
                                    onSchedule={setSchedulingOrder}
                                    onStartRoute={(id) => updateServiceOrderStatus(id, 'in_transit')}
                                    onArrive={(id) => updateServiceOrderStatus(id, 'realizado')}
                                    onConfirmDelivery={confirmDelivery}
                                    onConfirmInstallation={confirmInstallation}
                                    onGenerateReceiptTerm={setGeneratingReceiptTermOrder}
                                    onGenerateInstallTerm={setGeneratingInstallTermOrder}
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