import React, { useState, useMemo, FC, DragEvent } from 'react';
import type { ServiceOrder, ProductionStatus } from '../types';
import { useData } from '../context/DataContext';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import Select from '../components/ui/Select';
import Textarea from '../components/ui/Textarea';

const KANBAN_COLUMNS: { id: ProductionStatus; title: string; color: string }[] = [
  { id: 'cutting', title: 'Corte', color: 'bg-blue-600' },
  { id: 'finishing', title: 'Acabamento', color: 'bg-purple-600' },
  { id: 'awaiting_pickup', title: 'Aguardando Montagem', color: 'bg-yellow-600' },
  { id: 'ready_for_logistics', title: 'Pronto para Entrega', color: 'bg-green-600' },
];

const AssemblyKanbanCard: FC<{
    order: ServiceOrder,
    onUpdateStatus: (orderId: string, newStatus: ProductionStatus) => void,
    onAddNote: (orderId: string, note: string) => void,
    onAssignEmployee: (orderId: string, employeeId: string) => void,
}> = ({ order, onUpdateStatus, onAddNote, onAssignEmployee }) => {
    const { productionEmployees } = useData();
    const [showDetails, setShowDetails] = useState(false);
    const [showNoteForm, setShowNoteForm] = useState(false);
    const [note, setNote] = useState('');
    const [showAssignForm, setShowAssignForm] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState('');

    const assignedEmployees = useMemo(() => {
        return productionEmployees.filter(emp => order.assignedToIds.includes(emp.id));
    }, [productionEmployees, order.assignedToIds]);

    const handleDragStart = (e: DragEvent<HTMLDivElement>) => {
        e.dataTransfer.setData('text/plain', order.id);
    };

    const handleAddNote = () => {
        if (note.trim()) {
            onAddNote(order.id, note.trim());
            setNote('');
            setShowNoteForm(false);
        }
    };

    const handleAssignEmployee = () => {
        if (selectedEmployee) {
            onAssignEmployee(order.id, selectedEmployee);
            setSelectedEmployee('');
            setShowAssignForm(false);
        }
    };

    const getPriorityColor = (priority?: string) => {
        switch (priority) {
            case 'urgente': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            case 'alta': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        }
    };

    const getPriorityLabel = (priority?: string) => {
        switch (priority) {
            case 'urgente': return 'Urgente';
            case 'alta': return 'Alta';
            default: return 'Normal';
        }
    };

    return (
        <>
            <Card 
                draggable 
                onDragStart={handleDragStart}
                className="mb-3 cursor-move hover:shadow-lg transition-shadow duration-200"
            >
                <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                        <div>
                            <h4 className="font-semibold text-sm">{order.id}</h4>
                            <p className="text-xs text-text-secondary dark:text-slate-400">{order.clientName}</p>
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                            {order.priority && (
                                <Badge className={`text-xs ${getPriorityColor(order.priority)}`}>
                                    {getPriorityLabel(order.priority)}
                                </Badge>
                            )}
                            <span className="text-xs font-medium text-text-primary dark:text-slate-100">
                                R$ {order.total.toFixed(2)}
                            </span>
                        </div>
                    </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                    <div className="space-y-2">
                        <div className="text-xs text-text-secondary dark:text-slate-400">
                            <strong>Entrega:</strong> {new Date(order.deliveryDate).toLocaleDateString()}
                        </div>
                        
                        {order.finalizationType && (
                            <div className="text-xs text-text-secondary dark:text-slate-400">
                                <strong>Tipo:</strong> {
                                    order.finalizationType === 'pickup' ? 'Retirada' :
                                    order.finalizationType === 'delivery_only' ? 'Apenas Entrega' :
                                    'Entrega + Instalação'
                                }
                            </div>
                        )}

                        {assignedEmployees.length > 0 && (
                            <div className="text-xs text-text-secondary dark:text-slate-400">
                                <strong>Responsáveis:</strong>
                                <div className="mt-1 space-y-1">
                                    {assignedEmployees.map(emp => (
                                        <div key={emp.id} className="flex items-center space-x-1">
                                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                            <span>{emp.name} ({emp.role})</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {order.observations && (
                            <div className="text-xs text-text-secondary dark:text-slate-400">
                                <strong>Obs:</strong> {order.observations}
                            </div>
                        )}

                        <div className="flex space-x-1 pt-2">
                            <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => setShowDetails(true)}
                                className="text-xs px-2 py-1"
                            >
                                📋 Detalhes
                            </Button>
                            <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => setShowNoteForm(true)}
                                className="text-xs px-2 py-1"
                            >
                                📝 Nota
                            </Button>
                            <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => setShowAssignForm(true)}
                                className="text-xs px-2 py-1"
                            >
                                👥 Atribuir
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Modal de Detalhes */}
            <Modal isOpen={showDetails} onClose={() => setShowDetails(false)} title={`Detalhes - ${order.id}`}>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">Cliente</label>
                            <p className="text-sm text-text-primary dark:text-slate-100">{order.clientName}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">Valor Total</label>
                            <p className="text-sm text-text-primary dark:text-slate-100">R$ {order.total.toFixed(2)}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">Data de Entrega</label>
                            <p className="text-sm text-text-primary dark:text-slate-100">{new Date(order.deliveryDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">Prioridade</label>
                            <Badge className={getPriorityColor(order.priority)}>
                                {getPriorityLabel(order.priority)}
                            </Badge>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">Endereço de Entrega</label>
                        <p className="text-sm text-text-primary dark:text-slate-100">
                            {order.deliveryAddress.address}, {order.deliveryAddress.number}
                            {order.deliveryAddress.complement && `, ${order.deliveryAddress.complement}`}
                            <br />
                            {order.deliveryAddress.neighborhood} - {order.deliveryAddress.city}/{order.deliveryAddress.uf}
                            <br />
                            CEP: {order.deliveryAddress.cep}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">Itens</label>
                        <div className="space-y-2">
                            {order.items.map((item, index) => (
                                <div key={index} className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded text-sm">
                                    <div className="font-medium">{item.description}</div>
                                    <div className="text-text-secondary dark:text-slate-400">
                                        Qtd: {item.quantity} | R$ {item.totalPrice.toFixed(2)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {order.observations && (
                        <div>
                            <label className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">Observações</label>
                            <p className="text-sm text-text-primary dark:text-slate-100">{order.observations}</p>
                        </div>
                    )}
                </div>
            </Modal>

            {/* Modal de Adicionar Nota */}
            <Modal isOpen={showNoteForm} onClose={() => setShowNoteForm(false)} title="Adicionar Nota">
                <div className="space-y-4">
                    <Textarea
                        label="Nova Nota"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={4}
                        placeholder="Digite uma nota sobre este pedido..."
                    />
                    <div className="flex justify-end space-x-2">
                        <Button variant="ghost" onClick={() => setShowNoteForm(false)}>Cancelar</Button>
                        <Button onClick={handleAddNote} disabled={!note.trim()}>Adicionar Nota</Button>
                    </div>
                </div>
            </Modal>

            {/* Modal de Atribuir Funcionário */}
            <Modal isOpen={showAssignForm} onClose={() => setShowAssignForm(false)} title="Atribuir Funcionário">
                <div className="space-y-4">
                    <Select
                        label="Funcionário"
                        value={selectedEmployee}
                        onChange={(e) => setSelectedEmployee(e.target.value)}
                    >
                        <option value="">Selecione um funcionário</option>
                        {productionEmployees.filter(emp => emp.isActive).map(employee => (
                            <option key={employee.id} value={employee.id}>
                                {employee.name} - {employee.role}
                            </option>
                        ))}
                    </Select>
                    <div className="flex justify-end space-x-2">
                        <Button variant="ghost" onClick={() => setShowAssignForm(false)}>Cancelar</Button>
                        <Button onClick={handleAssignEmployee} disabled={!selectedEmployee}>Atribuir</Button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

const AssemblyPage: FC = () => {
    const { serviceOrders, updateServiceOrderStatus, productionEmployees } = useData();
    const [draggedOrderId, setDraggedOrderId] = useState<string | null>(null);

    const assemblyOrders = useMemo(() => {
        const assemblyStatuses: ProductionStatus[] = ['cutting', 'finishing', 'awaiting_pickup', 'ready_for_logistics'];
        return serviceOrders.filter(o => assemblyStatuses.includes(o.status));
    }, [serviceOrders]);

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>, targetStatus: ProductionStatus) => {
        e.preventDefault();
        const orderId = e.dataTransfer.getData('text/plain');
        if (orderId && orderId !== draggedOrderId) {
            updateServiceOrderStatus(orderId, targetStatus);
            setDraggedOrderId(null);
        }
    };

    const handleAddNote = (orderId: string, note: string) => {
        // Implementar adição de nota
        console.log(`Adicionando nota ao pedido ${orderId}: ${note}`);
    };

    const handleAssignEmployee = (orderId: string, employeeId: string) => {
        // Implementar atribuição de funcionário
        console.log(`Atribuindo funcionário ${employeeId} ao pedido ${orderId}`);
    };

    const getOrdersByStatus = (status: ProductionStatus) => {
        return assemblyOrders.filter(order => order.status === status);
    };

    const getColumnStats = (status: ProductionStatus) => {
        const orders = getOrdersByStatus(status);
        const totalValue = orders.reduce((sum, order) => sum + order.total, 0);
        return {
            count: orders.length,
            totalValue
        };
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary dark:text-slate-100">Controle de Montagem</h1>
                    <p className="mt-2 text-text-secondary dark:text-slate-400">Gerencie o processo de montagem e acabamento dos pedidos.</p>
                </div>
            </div>

            {/* Estatísticas Gerais */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {KANBAN_COLUMNS.map(column => {
                    const stats = getColumnStats(column.id);
                    return (
                        <Card key={column.id} className="p-4 text-center">
                            <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${column.color}`}></div>
                            <div className="text-2xl font-bold text-text-primary dark:text-slate-100">{stats.count}</div>
                            <div className="text-sm text-text-secondary dark:text-slate-400">{column.title}</div>
                            <div className="text-xs text-text-secondary dark:text-slate-400 mt-1">
                                R$ {stats.totalValue.toFixed(2)}
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Kanban Board */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {KANBAN_COLUMNS.map(column => {
                    const orders = getOrdersByStatus(column.id);
                    return (
                        <div key={column.id} className="bg-slate-100 dark:bg-slate-800/50 rounded-lg p-4 flex flex-col">
                            <div className={`flex items-center mb-4 border-l-4 pl-2 ${column.color.replace('bg-', 'border-')}`}>
                                <div className={`w-3 h-3 rounded-full mr-2 ${column.color}`}></div>
                                <h3 className="font-semibold text-text-primary dark:text-slate-100">{column.title}</h3>
                                <span className="ml-auto text-sm text-text-secondary dark:text-slate-400 bg-white dark:bg-slate-700 px-2 py-1 rounded">
                                    {orders.length}
                                </span>
                            </div>
                            
                            <div 
                                className="flex-1 overflow-y-auto pr-1 min-h-[400px]"
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, column.id)}
                            >
                                {orders.map(order => (
                                    <AssemblyKanbanCard 
                                        key={order.id} 
                                        order={order} 
                                        onUpdateStatus={updateServiceOrderStatus}
                                        onAddNote={handleAddNote}
                                        onAssignEmployee={handleAssignEmployee}
                                    />
                                ))}
                                
                                {orders.length === 0 && (
                                    <div className="text-center text-text-secondary dark:text-slate-400 py-8">
                                        <div className="text-4xl mb-2">📦</div>
                                        <div className="text-sm">Nenhum pedido nesta etapa</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AssemblyPage;
