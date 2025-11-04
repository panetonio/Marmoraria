import React, { FC, useMemo, useState } from 'react';
import type { Vehicle, VehicleStatus, VehicleType, DeliveryRoute } from '../types';
import { useData } from '../context/DataContext';
import Card, { CardHeader, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Badge from '../components/ui/Badge';

const STATUS_LABELS: Record<VehicleStatus, string> = {
    disponivel: 'Disponível',
    em_uso: 'Em uso',
    em_manutencao: 'Em manutenção',
};

const TYPE_LABELS: Record<VehicleType, string> = {
    van: 'Van',
    caminhao: 'Caminhão',
};

const VehicleFormModal: FC<{
    isOpen: boolean;
    vehicle: Vehicle;
    onClose: () => void;
    onSave: (vehicle: Vehicle) => void;
}> = ({ isOpen, vehicle: initialVehicle, onClose, onSave }) => {
    const [vehicle, setVehicle] = useState<Vehicle>(initialVehicle);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (field: keyof Vehicle, value: string | number) => {
        setVehicle(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = () => {
        const newErrors: Record<string, string> = {};
        if (!vehicle.name.trim()) newErrors.name = 'Nome é obrigatório';
        if (!vehicle.licensePlate.trim()) newErrors.licensePlate = 'Placa é obrigatória';
        if (vehicle.capacity <= 0) newErrors.capacity = 'Capacidade deve ser maior que zero';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});
        onSave({ ...vehicle, licensePlate: vehicle.licensePlate.toUpperCase() });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`${vehicle.id.startsWith('new-') ? 'Adicionar' : 'Editar'} Veículo`}>
            <div className="space-y-4">
                <Input
                    label="Nome"
                    value={vehicle.name}
                    onChange={e => handleChange('name', e.target.value)}
                    error={errors.name}
                    placeholder="Ex.: Van de Entrega"
                />
                <Input
                    label="Placa"
                    value={vehicle.licensePlate}
                    onChange={e => handleChange('licensePlate', e.target.value.toUpperCase())}
                    error={errors.licensePlate}
                    placeholder="ABC1D23"
                />
                <Input
                    label="Capacidade (kg)"
                    type="number"
                    value={vehicle.capacity}
                    onChange={e => handleChange('capacity', Number(e.target.value))}
                    error={errors.capacity}
                />
                <Select
                    label="Tipo"
                    value={vehicle.type}
                    onChange={e => handleChange('type', e.target.value as VehicleType)}
                >
                    <option value="van">Van</option>
                    <option value="caminhao">Caminhão</option>
                </Select>
                <Select
                    label="Status"
                    value={vehicle.status}
                    onChange={e => handleChange('status', e.target.value as VehicleStatus)}
                >
                    <option value="disponivel">Disponível</option>
                    <option value="em_uso">Em uso</option>
                    <option value="em_manutencao">Em manutenção</option>
                </Select>
                <Input
                    label="Observações"
                    value={vehicle.notes || ''}
                    onChange={e => handleChange('notes', e.target.value)}
                    placeholder="Informações adicionais"
                />
            </div>
            <div className="flex justify-end gap-3 mt-6">
                <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSubmit}>Salvar</Button>
            </div>
        </Modal>
    );
};

const VehicleScheduleList: FC<{ routes: DeliveryRoute[] }> = ({ routes }) => {
    if (routes.length === 0) {
        return (
            <p className="text-sm text-text-secondary dark:text-slate-400">Nenhum agendamento para este veículo.</p>
        );
    }

    return (
        <ul className="space-y-3">
            {routes.map(route => {
                const start = new Date(route.start);
                const end = new Date(route.end);
                return (
                    <li key={route.id} className="border border-border dark:border-slate-700 rounded-lg p-3 bg-white dark:bg-slate-800/60">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-text-primary dark:text-slate-100">
                                    OS: {route.serviceOrderId}
                                </p>
                                <p className="text-xs text-text-secondary dark:text-slate-400">
                                    {start.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} {' '}
                                    {start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                    {' '}–{' '}
                                    {end.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                            <Badge variant={route.status === 'completed' ? 'success' : route.status === 'in_progress' ? 'warning' : 'info'}>
                                {route.status === 'scheduled' && 'Agendado'}
                                {route.status === 'in_progress' && 'Em rota'}
                                {route.status === 'completed' && 'Concluído'}
                                {route.status === 'cancelled' && 'Cancelado'}
                            </Badge>
                        </div>
                        {route.notes && (
                            <p className="text-xs text-text-secondary dark:text-slate-400 mt-2">{route.notes}</p>
                        )}
                    </li>
                );
            })}
        </ul>
    );
};

const VehiclesPage: FC = () => {
    const { vehicles, deliveryRoutes, addVehicle, updateVehicle, deleteVehicle } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

    const sortedVehicles = useMemo(
        () => [...vehicles].sort((a, b) => a.name.localeCompare(b.name)),
        [vehicles]
    );

    const handleAddVehicle = () => {
        const now = new Date().toISOString();
        setSelectedVehicle({
            id: `new-${Date.now()}`,
            name: '',
            licensePlate: '',
            capacity: 0,
            type: 'van',
            status: 'disponivel',
            notes: '',
            createdAt: now,
            updatedAt: now,
        });
        setIsModalOpen(true);
    };

    const handleEditVehicle = (vehicle: Vehicle) => {
        setSelectedVehicle({ ...vehicle });
        setIsModalOpen(true);
    };

    const handleSaveVehicle = (vehicle: Vehicle) => {
        const now = new Date().toISOString();
        if (vehicle.id.startsWith('new-')) {
            addVehicle({
                ...vehicle,
                id: `veh-${Date.now()}`,
                createdAt: now,
                updatedAt: now,
            });
        } else {
            updateVehicle({ ...vehicle, updatedAt: now });
        }
        setIsModalOpen(false);
        setSelectedVehicle(null);
    };

    const handleDeleteVehicle = (vehicle: Vehicle) => {
        if (window.confirm(`Deseja remover o veículo ${vehicle.name}?`)) {
            deleteVehicle(vehicle.id);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-semibold text-text-primary dark:text-slate-100">Gestão de Veículos</h1>
                    <p className="text-sm text-text-secondary dark:text-slate-400">
                        Cadastre e acompanhe a disponibilidade da frota para entregas e instalações.
                    </p>
                </div>
                <Button onClick={handleAddVehicle}>Adicionar veículo</Button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {sortedVehicles.map(vehicle => {
                    const vehicleRoutes = deliveryRoutes
                        .filter(route => route.vehicleId === vehicle.id)
                        .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

                    return (
                        <Card key={vehicle.id} className="shadow-sm border border-border dark:border-slate-700">
                            <CardHeader className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-lg font-semibold text-text-primary dark:text-slate-100">{vehicle.name}</h2>
                                    <p className="text-sm text-text-secondary dark:text-slate-400">Placa: {vehicle.licensePlate}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant={vehicle.status === 'disponivel' ? 'success' : vehicle.status === 'em_uso' ? 'warning' : 'danger'}>
                                        {STATUS_LABELS[vehicle.status]}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <span className="block text-text-secondary dark:text-slate-400 text-xs uppercase tracking-wide">Tipo</span>
                                        <span className="text-text-primary dark:text-slate-100 font-medium">{TYPE_LABELS[vehicle.type]}</span>
                                    </div>
                                    <div>
                                        <span className="block text-text-secondary dark:text-slate-400 text-xs uppercase tracking-wide">Capacidade</span>
                                        <span className="text-text-primary dark:text-slate-100 font-medium">{vehicle.capacity.toLocaleString('pt-BR')} kg</span>
                                    </div>
                                </div>
                                {vehicle.notes && (
                                    <p className="text-sm text-text-secondary dark:text-slate-300">{vehicle.notes}</p>
                                )}

                                <div>
                                    <h3 className="text-sm font-semibold text-text-primary dark:text-slate-200 mb-2">Agendamentos</h3>
                                    <VehicleScheduleList routes={vehicleRoutes} />
                                </div>

                                <div className="flex justify-end gap-3 pt-2">
                                    <Button variant="ghost" onClick={() => handleEditVehicle(vehicle)}>Editar</Button>
                                    <Button variant="destructive" onClick={() => handleDeleteVehicle(vehicle)}>Remover</Button>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {selectedVehicle && (
                <VehicleFormModal
                    isOpen={isModalOpen}
                    vehicle={selectedVehicle}
                    onClose={() => { setIsModalOpen(false); setSelectedVehicle(null); }}
                    onSave={handleSaveVehicle}
                />
            )}
        </div>
    );
};

export default VehiclesPage;
