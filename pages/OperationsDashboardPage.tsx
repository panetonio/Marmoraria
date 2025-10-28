import React, { useState, useMemo, FC, DragEvent, useEffect } from 'react';
import type { ServiceOrder, ProductionStatus, Vehicle, DeliveryRoute, Priority, FinalizationType, User, DeliveryRouteType } from '../types';
import { mockProductionProfessionals } from '../data/mockData';
import { useData } from '../context/DataContext';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Textarea from '../components/ui/Textarea';
import StatusBadge from '../components/ui/StatusBadge';
import Badge from '../components/ui/Badge';
import Tabs from '../components/ui/Tabs';
import { productionStatusMap } from '../config/statusMaps';
import FinalizationTypeModal from '../components/FinalizationTypeModal';
import QrCodeScanner from '../components/QrCodeScanner';
import Calendar from '../components/ui/Calendar';
import InstallationTermModal from '../components/InstallationTermModal';
import ReceiptTermModal from '../components/ReceiptTermModal';
import PostDeliverySchedulingModal from '../components/PostDeliverySchedulingModal';
import VehicleCalendar from '../components/VehicleCalendar';
import SmartResourceSelector from '../components/SmartResourceSelector';

type OperationTab = 'production' | 'logistics' | 'installation' | 'fleet';

const PRODUCTION_COLUMNS: { id: ProductionStatus; title: string; color: string }[] = [
  { id: 'cutting', title: 'Em Corte', color: 'bg-orange-800' },
  { id: 'finishing', title: 'Em Acabamento', color: 'bg-blue-700' },
  { id: 'awaiting_pickup', title: 'Aguardando Retirada', color: 'bg-yellow-600' },
];

const LOGISTICS_COLUMNS: { id: ProductionStatus; title: string; color: string }[] = [
  { id: 'ready_for_logistics', title: 'A Agendar', color: 'bg-purple-700' },
  { id: 'scheduled', title: 'Agendado', color: 'bg-blue-600' },
  { id: 'in_transit', title: 'Em Rota', color: 'bg-orange-700' },
  { id: 'realizado', title: 'Realizado', color: 'bg-indigo-600' },
  { id: 'completed', title: 'Finalizado', color: 'bg-green-800' },
];

const INSTALLATION_STATUSES: { id: string; title: string; color: string }[] = [
  { id: 'pending', title: 'Pendente', color: 'bg-slate-600' },
  { id: 'scheduled', title: 'Agendado', color: 'bg-blue-600' },
  { id: 'in_progress', title: 'Em Andamento', color: 'bg-orange-700' },
  { id: 'completed', title: 'Concluído', color: 'bg-green-800' },
];

const priorityConfig: Record<Priority, { label: string; className: string }> = {
    normal: { label: 'Normal', className: 'bg-slate-500 text-white' },
    alta: { label: 'Alta', className: 'bg-amber-500 text-white' },
    urgente: { label: 'Urgente', className: 'bg-red-600 text-white' },
};

// ============= MODAL: Service Order Detail =============
const ServiceOrderDetailModal: FC<{
  isOpen: boolean;
  order: ServiceOrder;
  onClose: () => void;
  onAttachClick: (order: ServiceOrder) => void;
  onRemoveAttachment: (orderId: string) => void;
  onUpdatePriority: (orderId: string, priority: Priority) => void;
  onUpdateObservations: (orderId: string, observations: string) => void;
  onUpdateTeam: (orderId: string, assignedToIds: string[]) => void;
  allUsers: (User)[];
}> = ({ isOpen, order, onClose, onAttachClick, onRemoveAttachment, onUpdatePriority, onUpdateObservations, onUpdateTeam, allUsers }) => {
  const [observations, setObservations] = useState(order.observations || '');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(order.assignedToIds);

  useEffect(() => {
    setObservations(order.observations || '');
    setSelectedUserIds(order.assignedToIds);
  }, [order]);

  const handleCloseAndSave = () => {
    if (observations !== (order.observations || '')) {
      onUpdateObservations(order.id, observations);
    }
    if (JSON.stringify(selectedUserIds.sort()) !== JSON.stringify(order.assignedToIds.sort())) {
      onUpdateTeam(order.id, selectedUserIds);
    }
    onClose();
  };

  const handleToggleUser = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={handleCloseAndSave} title={`Detalhes da OS: ${order.id}`} className="max-w-4xl">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="p-0">
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm text-text-secondary dark:text-slate-400">Cliente</h4>
                  <p className="font-semibold text-text-primary dark:text-slate-100">{order.clientName}</p>
                </div>
                <div>
                  <h4 className="text-sm text-text-secondary dark:text-slate-400">Pedido de Origem</h4>
                  <p className="font-semibold font-mono text-text-primary dark:text-slate-100">{order.orderId}</p>
                </div>
                <div>
                  <h4 className="text-sm text-text-secondary dark:text-slate-400">Data de Entrega</h4>
                  <p className="font-semibold text-text-primary dark:text-slate-100">{new Date(order.deliveryDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <h4 className="text-sm text-text-secondary dark:text-slate-400">Status Atual</h4>
                  <StatusBadge status={order.productionStatus} statusMap={productionStatusMap} />
                </div>
                 <div className="col-span-2">
                    <Select
                        label="Prioridade"
                        id="priority-select"
                        value={order.priority || 'normal'}
                        onChange={(e) => onUpdatePriority(order.id, e.target.value as Priority)}
                    >
                        <option value="normal">Normal</option>
                        <option value="alta">Alta</option>
                        <option value="urgente">Urgente</option>
                    </Select>
                 </div>
                 {order.allocatedSlabId && (
                    <div className="col-span-2">
                        <h4 className="text-sm text-text-secondary dark:text-slate-400">Chapa Alocada</h4>
                        <p className="font-semibold font-mono text-primary">{order.allocatedSlabId}</p>
                    </div>
                )}
                <div className="col-span-2">
                    <Textarea
                        label="Observações Gerais"
                        id="os-observations"
                        rows={4}
                        value={observations}
                        onChange={(e) => setObservations(e.target.value)}
                        placeholder="Adicione notas importantes"
                    />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="p-0">
            <CardHeader>Itens na Ordem de Serviço</CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border dark:border-slate-700">
                      <th className="p-2">Descrição</th>
                      <th className="p-2 text-center">Qtd.</th>
                      <th className="p-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item, idx) => (
                      <tr key={`${order.id}-item-${idx}`} className="border-b border-border dark:border-slate-700 last:border-b-0">
                        <td className="p-2">{item.description}</td>
                        <td className="p-2 text-center">{item.quantity.toFixed(2)}</td>
                        <td className="p-2 text-right font-mono">{item.totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="p-0">
            <CardHeader>Anexos</CardHeader>
             <CardContent>
                {order.attachment ? (
                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
                        <div className="flex items-center space-x-3">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-text-secondary dark:text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                            </svg>
                            <p className="text-sm font-medium text-text-primary dark:text-slate-200">{order.attachment.name}</p>
                        </div>
                        <div className="space-x-2">
                            <a href={order.attachment.url} target="_blank" rel="noopener noreferrer">
                                <Button variant="ghost" size="sm">Ver</Button>
                            </a>
                            <Button variant="destructive" size="sm" onClick={() => onRemoveAttachment(order.id)}>Remover</Button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center">
                        <p className="text-sm text-text-secondary dark:text-slate-400 mb-2">Nenhum arquivo anexado.</p>
                        <Button variant="secondary" size="sm" onClick={() => onAttachClick(order)}>Anexar Arquivo</Button>
                    </div>
                )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1">
          <Card className="p-0">
            <CardHeader>Equipe Alocada</CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {allUsers.length > 0 ? allUsers.map(user => {
                  const isSelected = selectedUserIds.includes(user.id);
                  
                  return (
                    <label 
                      key={user.id} 
                      className={`flex items-center p-2 rounded-lg cursor-pointer transition-colors ${
                        isSelected 
                          ? 'bg-primary/10 border-2 border-primary' 
                          : 'hover:bg-slate-100 dark:hover:bg-slate-700 border-2 border-transparent'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                        checked={isSelected}
                        onChange={() => handleToggleUser(user.id)}
                      />
                      <div className="ml-3 flex items-center flex-1">
                        <div className="w-8 h-8 rounded-full bg-slate-600 text-white flex items-center justify-center text-sm font-bold ring-2 ring-white mr-3">
                          {user.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-text-primary dark:text-slate-100 text-sm">
                            {user.name}
                          </p>
                        </div>
                      </div>
                    </label>
                  );
                }) : (
                  <p className="text-sm text-text-secondary dark:text-slate-400 text-center py-4">
                    Nenhum usuário disponível
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Modal>
  );
};

// ============= MODAL: Schedule Delivery/Installation =============
const ScheduleRouteModal: FC<{
    isOpen: boolean;
    serviceOrders: ServiceOrder[];
    routeType: DeliveryRouteType;
    onClose: () => void;
    onSave: (data: {
      serviceOrderIds: string[];
      type: DeliveryRouteType;
      vehicleId: string;
      scheduledStart: string;
      scheduledEnd: string;
      teamIds: string[];
    }) => void;
}> = ({ isOpen, serviceOrders, routeType, onClose, onSave }) => {
    const { vehicles, users } = useData();
    const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [teamIds, setTeamIds] = useState<string[]>([]);
    const [selectedVehicleId, setSelectedVehicleId] = useState('');
    const [error, setError] = useState('');
    const [showCalendar, setShowCalendar] = useState(false);

    const availableTeam = useMemo(() => users.filter(u => u.role === 'producao'), [users]);

    const combineDateTime = (dateValue: string, timeValue: string) => new Date(`${dateValue}T${timeValue}`).toISOString();

    const handleSave = () => {
        if (selectedOrderIds.length === 0) {
            setError('Selecione ao menos uma OS.');
            return;
        }
        if (!date || !startTime || !endTime) {
            setError('Data e horários são obrigatórios.');
            return;
        }
        if (!selectedVehicleId) {
            setError('Selecione um veículo.');
            return;
        }
        if (teamIds.length === 0) {
            setError('Selecione ao menos um membro da equipe.');
            return;
        }

        const scheduledStart = combineDateTime(date, startTime);
        const scheduledEnd = combineDateTime(date, endTime);

        if (new Date(scheduledStart) >= new Date(scheduledEnd)) {
            setError('Horário final deve ser após o inicial.');
            return;
        }

        onSave({
          serviceOrderIds: selectedOrderIds,
          type: routeType,
          vehicleId: selectedVehicleId,
          scheduledStart,
          scheduledEnd,
          teamIds,
        });
        
        setError('');
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Agendar ${routeType === 'delivery' ? 'Entrega' : 'Instalação'}`} className="max-w-3xl">
            <div className="space-y-6">
                {/* Seleção de OSs */}
                <div>
                    <label className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-2">
                        📋 Ordens de Serviço
                    </label>
                    <div className="space-y-2 max-h-48 overflow-y-auto border border-border dark:border-slate-600 rounded-md p-3">
                        {serviceOrders.map(os => (
                            <label key={os.id} className="flex items-center p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="h-4 w-4 rounded text-blue-600" 
                                    checked={selectedOrderIds.includes(os.id)} 
                                    onChange={() => setSelectedOrderIds(prev => 
                                        prev.includes(os.id) ? prev.filter(id => id !== os.id) : [...prev, os.id]
                                    )} 
                                />
                                <span className="ml-3 text-sm">
                                    <span className="font-semibold font-mono">{os.id}</span> - {os.clientName}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Data e Horário */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-2">
                            📅 Data
                        </label>
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
                            >
                                📅
                            </Button>
                        </div>
                        {showCalendar && (
                            <div className="flex justify-center mt-3">
                                <Calendar
                                    value={date}
                                    onChange={(newDate) => { setDate(newDate); setShowCalendar(false); }}
                                    minDate={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            label="Início"
                            type="time"
                            value={startTime}
                            onChange={e => setStartTime(e.target.value)}
                        />
                        <Input
                            label="Término"
                            type="time"
                            value={endTime}
                            onChange={e => setEndTime(e.target.value)}
                        />
                    </div>
                </div>

                {/* Veículo - Seleção Inteligente */}
                <SmartResourceSelector
                    type="vehicle"
                    selectedIds={selectedVehicleId ? [selectedVehicleId] : []}
                    onSelectionChange={(ids) => setSelectedVehicleId(ids[0] || '')}
                    startDate={date}
                    startTime={startTime}
                    endDate={date}
                    endTime={endTime}
                    label="🚚 Veículo"
                    multiple={false}
                    required={true}
                />

                {/* Equipe - Seleção Inteligente */}
                <SmartResourceSelector
                    type="employee"
                    selectedIds={teamIds}
                    onSelectionChange={setTeamIds}
                    startDate={date}
                    startTime={startTime}
                    endDate={date}
                    endTime={endTime}
                    role={routeType === 'installation' ? 'montador' : undefined}
                    label="👥 Equipe"
                    multiple={true}
                    required={true}
                />

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                        <p className="text-red-600 dark:text-red-400 text-sm text-center">{error}</p>
                    </div>
                )}
            </div>
            
            <div className="flex justify-end mt-6 space-x-3">
                <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSave}>
                    Agendar
                </Button>
            </div>
        </Modal>
    );
};

// ============= KANBAN CARD: Production =============
const ProductionCard: FC<{
  order: ServiceOrder;
  isDragging: boolean;
  onDragStart: (e: DragEvent<HTMLElement>, orderId: string) => void;
  onDragEnd: (e: DragEvent<HTMLElement>) => void;
  onView: (order: ServiceOrder) => void;
  onFinalize: (order: ServiceOrder) => void;
}> = ({ order, isDragging, onDragStart, onDragEnd, onView, onFinalize }) => {
  const priority = order.priority || 'normal';

  return (
    <Card
      draggable
      onDragStart={(e) => onDragStart(e, order.id)}
      onDragEnd={onDragEnd}
      onClick={() => onView(order)}
      className={`p-4 mt-4 shadow-sm border border-border dark:border-slate-700 cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all duration-200 relative ${isDragging ? 'opacity-40 scale-95' : ''}`}
    >
      {priority !== 'normal' && (
        <div className={`absolute -top-2 -right-2 px-2 py-0.5 text-xs font-bold rounded-full shadow-lg ${priorityConfig[priority].className}`}>
            {priorityConfig[priority].label.toUpperCase()}
        </div>
      )}
      <div className="flex justify-between items-start">
        <div>
            <p className="font-bold text-sm font-mono">{order.id}</p>
            <p className="text-xs text-text-secondary dark:text-slate-400 font-mono">Pedido: {order.orderId}</p>
        </div>
        {order.attachment && (
            <div title={order.attachment.name} className="text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a3 3 0 10-6 0v4a3 3 0 106 0V7a1 1 0 10-2 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                </svg>
            </div>
        )}
      </div>
      <p className="text-text-secondary dark:text-slate-400 text-sm mt-1">{order.clientName}</p>

      {order.allocatedSlabId && (
        <div className="mt-2 pt-2 border-t border-border/50 dark:border-slate-700/50 text-xs">
            <span className="text-slate-500 dark:text-slate-400">Chapa:</span> <span className="font-mono text-primary font-semibold">{order.allocatedSlabId}</span>
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-border dark:border-slate-700">
        <div className="flex justify-end items-center gap-2">
          {order.productionStatus === 'finishing' && (
               <Button variant="accent" size="sm" onClick={(e) => { e.stopPropagation(); onFinalize(order); }}>Finalizar Produção</Button>
          )}
        </div>
      </div>
    </Card>
  );
};

// ============= KANBAN CARD: Logistics =============
const LogisticsCard: FC<{
    order: ServiceOrder,
    onSchedule: (order: ServiceOrder) => void,
    onStartRoute: (orderId: string) => void,
    onArrive: (orderId: string) => void,
    onConfirmDelivery: (orderId: string) => void,
    onConfirmInstallation: (orderId: string) => void,
    onGenerateReceiptTerm: (order: ServiceOrder) => void,
    onGenerateInstallTerm: (order: ServiceOrder) => void,
    vehicles: Vehicle[],
}> = ({
    order, onSchedule, onStartRoute, onArrive, onConfirmDelivery, onConfirmInstallation,
    onGenerateReceiptTerm, onGenerateInstallTerm, vehicles
}) => {

    const assignedVehicle = order.vehicleId ? vehicles.find(vehicle => vehicle.id === order.vehicleId) : undefined;
    const deliveryStart = order.deliveryStart || order.deliveryScheduledDate;
    const startDate = deliveryStart ? new Date(deliveryStart) : null;
    const endDate = order.deliveryEnd ? new Date(order.deliveryEnd) : null;

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
                {order.logisticsStatus === 'awaiting_scheduling' && <Button size="sm" className="w-full" onClick={() => onSchedule(order)}>Agendar</Button>}
                {order.logisticsStatus === 'scheduled' && <Button size="sm" className="w-full" onClick={() => onStartRoute(order.id)}>Iniciar Rota</Button>}
                {order.logisticsStatus === 'in_transit' && <Button size="sm" className="w-full" onClick={() => onArrive(order.id)}>Chegou ao Destino</Button>}
                
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
                
                {( (order.logisticsStatus === 'awaiting_scheduling' || order.logisticsStatus === 'scheduled') && order.finalizationType !== 'pickup') || order.installation_confirmed ? (
                    <div className="!mt-3 pt-2 border-t border-dashed space-y-2">
                        {(order.logisticsStatus === 'awaiting_scheduling' || order.logisticsStatus === 'scheduled') && order.finalizationType !== 'pickup' && (
                            <Button size="sm" variant="ghost" className="w-full" onClick={() => onGenerateReceiptTerm(order)}>Termo Recebimento</Button>
                        )}
                        {order.installation_confirmed && (
                            <Button size="sm" variant="ghost" className="w-full" onClick={() => onGenerateInstallTerm(order)}>Termo Instalação</Button>
                        )}
                    </div>
                ) : null}
            </div>
        </Card>
    );
};

// ============= KANBAN CARD: Installation =============
const InstallationCard: FC<{
  order: ServiceOrder;
  onSchedule: (order: ServiceOrder) => void;
  onStart: (orderId: string) => void;
  onComplete: (orderId: string) => void;
}> = ({ order, onSchedule, onStart, onComplete }) => {
  // Determinar status baseado em installation_confirmed
  const installStatus = order.installation_confirmed 
    ? 'completed' 
    : order.status === 'realizado' 
      ? 'in_progress' 
      : order.status === 'scheduled' 
        ? 'scheduled' 
        : 'pending';

  return (
    <Card className="p-3 mt-3 shadow-sm border border-border dark:border-slate-700">
      <p className="font-bold text-sm font-mono">{order.id}</p>
      <p className="text-text-secondary dark:text-slate-400 text-sm mt-1">{order.clientName}</p>
      
      <div className="mt-3 pt-3 border-t border-border dark:border-slate-700 space-y-2">
        {installStatus === 'pending' && <Button size="sm" className="w-full" onClick={() => onSchedule(order)}>Agendar Instalação</Button>}
        {installStatus === 'scheduled' && <Button size="sm" className="w-full" onClick={() => onStart(order.id)}>Iniciar Instalação</Button>}
        {installStatus === 'in_progress' && <Button size="sm" className="w-full" variant="secondary" onClick={() => onComplete(order.id)}>Concluir Instalação</Button>}
        {installStatus === 'completed' && (
          <div className="text-sm font-semibold text-green-600 flex items-center justify-center gap-1 p-1 bg-green-100 dark:bg-green-900/50 rounded-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            Instalação Concluída
          </div>
        )}
      </div>
    </Card>
  );
};

// ============= MAIN COMPONENT =============
const OperationsDashboardPage: FC = () => {
  const { 
    serviceOrders, 
    setServiceOrders, 
    updateServiceOrderStatus,
    confirmDelivery,
    confirmInstallation,
    setFinalizationType,
    scheduleDelivery,
    updateServiceOrderPriority, 
    updateServiceOrderObservations,
    vehicles,
    users,
    addAttachmentToServiceOrder, 
    removeAttachmentFromServiceOrder,
    refreshServiceOrder,
    deliveryRoutes
  } = useData();

  const [activeTab, setActiveTab] = useState<OperationTab>('production');
  const [viewingOrder, setViewingOrder] = useState<ServiceOrder | null>(null);
  const [finalizingOrder, setFinalizingOrder] = useState<ServiceOrder | null>(null);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [schedulingOrders, setSchedulingOrders] = useState<ServiceOrder[]>([]);
  const [scheduleModalType, setScheduleModalType] = useState<DeliveryRouteType>('delivery');
  const [generatingReceiptTermOrder, setGeneratingReceiptTermOrder] = useState<ServiceOrder | null>(null);
  const [generatingInstallTermOrder, setGeneratingInstallTermOrder] = useState<ServiceOrder | null>(null);
  const [confirmingDeliveryOrder, setConfirmingDeliveryOrder] = useState<ServiceOrder | null>(null);

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

  // Filtrar OSs por tipo
  const productionOrders = useMemo(() => {
    const productionStatuses: ProductionStatus[] = ['cutting', 'finishing', 'awaiting_pickup'];
    return serviceOrders.filter(o => productionStatuses.includes(o.productionStatus));
  }, [serviceOrders]);

  const logisticsOrders = useMemo(() => {
    const logisticsStatuses: LogisticsStatus[] = ['awaiting_scheduling', 'scheduled', 'in_transit', 'delivered', 'completed'];
    return serviceOrders.filter(o => logisticsStatuses.includes(o.logisticsStatus));
  }, [serviceOrders]);

  const installationOrders = useMemo(() => {
    // OSs que requerem instalação
    return serviceOrders.filter(o => o.finalizationType === 'delivery_installation');
  }, [serviceOrders]);

  // Drag and drop handlers
  const handleDragStart = (e: DragEvent<HTMLElement>, orderId: string) => {
    e.dataTransfer.setData("orderId", orderId);
    setDraggedItemId(orderId);
  };

  const handleDragEnd = () => {
    setDraggedItemId(null);
  };
  
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };
  
  const handleDrop = (e: DragEvent<HTMLDivElement>, newStatus: ProductionStatus) => {
    e.preventDefault();
    const orderId = e.dataTransfer.getData("orderId");
    const order = serviceOrders.find(o => o.id === orderId);
    if (order && order.productionStatus !== newStatus) {
        if(newStatus === 'awaiting_pickup') return; // Cannot drag here
        setServiceOrders(prevOrders =>
            prevOrders.map(o =>
                o.id === orderId ? { ...o, productionStatus: newStatus } : o
            )
        );
    }
  };

  const handleFinalizeConfirm = (type: FinalizationType) => {
    if (finalizingOrder) {
        setFinalizationType(finalizingOrder.id, type);
        setFinalizingOrder(null);
    }
  };

  const handleScheduleDelivery = (order: ServiceOrder) => {
    setSchedulingOrders([order]);
    setScheduleModalType('delivery');
  };

  const handleScheduleInstallation = (order: ServiceOrder) => {
    setSchedulingOrders([order]);
    setScheduleModalType('installation');
  };

  const handleSaveSchedule = (data: {
    serviceOrderIds: string[];
    type: DeliveryRouteType;
    vehicleId: string;
    scheduledStart: string;
    scheduledEnd: string;
    teamIds: string[];
  }) => {
    // Para cada OS, chamar scheduleDelivery
    data.serviceOrderIds.forEach(osId => {
      scheduleDelivery(osId, {
        vehicleId: data.vehicleId,
        start: data.scheduledStart,
        end: data.scheduledEnd,
        teamIds: data.teamIds
      });
    });
    
    setSchedulingOrders([]);
  };

  const handleDeliveryConfirmed = (data: {
    serviceOrderId: string;
    checklistItems: { id: string; text: string; checked: boolean }[];
    photos: { url: string; description?: string }[];
    customerSignature: { url: string; timestamp: string };
  }) => {
    // Atualizar a OS com os dados do checklist
    setServiceOrders(prev => prev.map(o => {
      if (o.id === data.serviceOrderId) {
        return {
          ...o,
          departureChecklist: data.checklistItems,
          // Aqui você poderia salvar photos e signature também se tivesse campos no modelo
        };
      }
      return o;
    }));

    // Marcar entrega como confirmada
    confirmDelivery(data.serviceOrderId);
  };

  const handleInstallationScheduled = (data: {
    serviceOrderIds: string[];
    type: 'installation';
    vehicleId: string;
    scheduledStart: string;
    scheduledEnd: string;
    teamIds: string[];
  }) => {
    // Agendar instalação usando o mesmo mecanismo
    data.serviceOrderIds.forEach(osId => {
      scheduleDelivery(osId, {
        vehicleId: data.vehicleId,
        start: data.scheduledStart,
        end: data.scheduledEnd,
        teamIds: data.teamIds
      });
    });
  };

  const handleConfirmDeliveryClick = (order: ServiceOrder) => {
    // Abrir modal de confirmação com checklist interativo
    setConfirmingDeliveryOrder(order);
  };

  const tabs = [
    { id: 'production' as OperationTab, label: `Produção (${productionOrders.length})` },
    { id: 'logistics' as OperationTab, label: `Logística (${logisticsOrders.length})` },
    { id: 'installation' as OperationTab, label: `Montagem (${installationOrders.length})` },
    { id: 'fleet' as OperationTab, label: `Frota (${vehicles.length})` },
  ];

  return (
    <div>
      {/* Modals */}
      {viewingOrder && (
        <ServiceOrderDetailModal
            isOpen={!!viewingOrder}
            order={viewingOrder}
            onClose={() => setViewingOrder(null)}
            onAttachClick={(os) => { /* Add attachment modal if needed */ }}
            onRemoveAttachment={removeAttachmentFromServiceOrder}
            onUpdatePriority={updateServiceOrderPriority}
            onUpdateObservations={updateServiceOrderObservations}
            onUpdateTeam={(orderId, assignedToIds) => {
              setServiceOrders(prev => prev.map(o => o.id === orderId ? {...o, assignedToIds} : o));
            }}
            allUsers={users}
        />
      )}
      
      {finalizingOrder && (
          <FinalizationTypeModal
            isOpen={!!finalizingOrder}
            onClose={() => setFinalizingOrder(null)}
            onConfirm={handleFinalizeConfirm}
          />
      )}

      {schedulingOrders.length > 0 && (
        <ScheduleRouteModal
          isOpen={schedulingOrders.length > 0}
          serviceOrders={schedulingOrders}
          routeType={scheduleModalType}
          onClose={() => setSchedulingOrders([])}
          onSave={handleSaveSchedule}
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

      {confirmingDeliveryOrder && (
        <PostDeliverySchedulingModal
          isOpen={!!confirmingDeliveryOrder}
          serviceOrder={confirmingDeliveryOrder}
          checklistTemplate={undefined} // Pode buscar da lista de templates se necessário
          onClose={() => setConfirmingDeliveryOrder(null)}
          onDeliveryConfirmed={handleDeliveryConfirmed}
          onInstallationScheduled={handleInstallationScheduled}
          vehicles={vehicles}
          productionEmployees={[]} // Usar productionEmployees do contexto se disponível
        />
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-text-primary dark:text-slate-100">Dashboard de Operações</h1>
          <p className="mt-2 text-text-secondary dark:text-slate-400">Produção, Logística e Montagem unificados</p>
        </div>
      </div>

      <div className="mt-6">
        <QrCodeScanner />
      </div>

      {/* Tabs */}
      <Tabs<OperationTab>
        tabs={tabs}
        activeTab={activeTab}
        onTabClick={setActiveTab}
      />

      {/* Production Tab */}
      {activeTab === 'production' && (
        <div className="grid grid-cols-3 gap-5 h-[70vh]">
          {PRODUCTION_COLUMNS.map(column => (
            <div 
                key={column.id} 
                className={`bg-slate-100 dark:bg-slate-800/50 rounded-lg p-3 flex flex-col`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id)}
            >
              <div className={`flex items-center mb-4 border-l-4 pl-2 ${column.color.replace('bg-', 'border-')}`}>
                <div className={`w-3 h-3 rounded-full mr-2 ${column.color}`}></div>
                <h3 className="font-semibold text-text-primary dark:text-slate-100">{column.title}</h3>
              </div>
              <div className="flex-1 overflow-y-auto pr-1">
                {productionOrders
                  .filter(order => order.productionStatus === column.id)
                  .map(order => (
                    <ProductionCard
                        key={order.id}
                        order={order}
                        isDragging={draggedItemId === order.id}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        onView={setViewingOrder}
                        onFinalize={setFinalizingOrder}
                    />
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Logistics Tab */}
      {activeTab === 'logistics' && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-5 h-[70vh]">
          {LOGISTICS_COLUMNS.map(column => (
            <div key={column.id} className="bg-slate-100 dark:bg-slate-800/50 rounded-lg p-3 flex flex-col">
              <div className={`flex items-center mb-4 border-l-4 pl-2 ${column.color.replace('bg-', 'border-')}`}>
                <div className={`w-3 h-3 rounded-full mr-2 ${column.color}`}></div>
                <h3 className="font-semibold text-text-primary dark:text-slate-100">{column.title}</h3>
              </div>
              <div className="flex-1 overflow-y-auto pr-1">
                {logisticsOrders.filter(o => o.logisticsStatus === column.id).map(order => (
                  <LogisticsCard
                    key={order.id}
                    order={order}
                    onSchedule={handleScheduleDelivery}
                    onStartRoute={handleStartRoute}
                    onArrive={handleArriveAtDestination}
                    onConfirmDelivery={(orderId) => {
                      const order = logisticsOrders.find(o => o.id === orderId);
                      if (order) handleConfirmDeliveryClick(order);
                    }}
                    onConfirmInstallation={confirmInstallation}
                    onGenerateReceiptTerm={setGeneratingReceiptTermOrder}
                    onGenerateInstallTerm={setGeneratingInstallTermOrder}
                    vehicles={vehicles}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Installation Tab */}
      {activeTab === 'installation' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 h-[70vh]">
          {INSTALLATION_STATUSES.map(column => (
            <div key={column.id} className="bg-slate-100 dark:bg-slate-800/50 rounded-lg p-3 flex flex-col">
              <div className={`flex items-center mb-4 border-l-4 pl-2 ${column.color.replace('bg-', 'border-')}`}>
                <div className={`w-3 h-3 rounded-full mr-2 ${column.color}`}></div>
                <h3 className="font-semibold text-text-primary dark:text-slate-100">{column.title}</h3>
              </div>
              <div className="flex-1 overflow-y-auto pr-1">
                {installationOrders.filter(o => {
                  // Mapear para o status de instalação
                  if (o.installation_confirmed) return column.id === 'completed';
                  if (o.logisticsStatus === 'delivered') return column.id === 'in_progress';
                  if (o.logisticsStatus === 'scheduled') return column.id === 'scheduled';
                  return column.id === 'pending';
                }).map(order => (
                  <InstallationCard
                    key={order.id}
                    order={order}
                    onSchedule={handleScheduleInstallation}
                    onStart={handleStartRoute}
                    onComplete={confirmInstallation}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fleet Management Tab */}
      {activeTab === 'fleet' && (
        <div className="mt-6">
          <VehicleCalendar
            vehicles={vehicles}
            deliveryRoutes={[]} // Implementar quando houver rotas do backend
            serviceOrders={serviceOrders}
            onRouteClick={(route) => {
              // Poderia abrir modal com detalhes da rota
              console.log('Rota clicada:', route);
            }}
          />
        </div>
      )}
    </div>
  );
};


export default OperationsDashboardPage;

