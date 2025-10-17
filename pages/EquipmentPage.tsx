import React, { useState, useMemo, FC } from 'react';
import { useData } from '../context/DataContext';
import type { Equipment, MaintenanceLog, EquipmentStatus } from '../types';
import { mockProductionProfessionals, mockUsers } from '../data/mockData';
import Card, { CardContent, CardHeader, CardFooter } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import StatusBadge from '../components/ui/StatusBadge';
import type { StatusMap } from '../components/ui/StatusBadge';
import Textarea from '../components/ui/Textarea';

const equipmentStatusMap: StatusMap<EquipmentStatus> = {
    operacional: { label: 'Operacional', variant: 'success' },
    em_manutencao: { label: 'Em Manutenção', variant: 'warning' },
    desativado: { label: 'Desativado', variant: 'default' },
};

const EquipmentForm: FC<{
    equipment: Equipment;
    onSave: (equipment: Equipment) => void;
    onCancel: () => void;
}> = ({ equipment: initialEquipment, onSave, onCancel }) => {
    const [equipment, setEquipment] = useState<Equipment>(initialEquipment);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (field: keyof Equipment, value: any) => {
        setEquipment(prev => ({ ...prev, [field]: value }));
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!equipment.name.trim()) newErrors.name = "Nome é obrigatório.";
        if (!equipment.serialNumber.trim()) newErrors.serialNumber = "Nº de série é obrigatório.";
        if (!equipment.purchaseDate) newErrors.purchaseDate = "Data da compra é obrigatória.";
        if (!equipment.warrantyEndDate) newErrors.warrantyEndDate = "Data da garantia é obrigatória.";
        if (!equipment.purchaseInvoiceNumber.trim()) newErrors.purchaseInvoiceNumber = "Nº da NF é obrigatório.";
        if (!equipment.supplierCnpj.trim()) newErrors.supplierCnpj = "CNPJ do Fornecedor é obrigatório.";
        if (!equipment.currentLocation.trim()) newErrors.currentLocation = "Localização é obrigatória.";
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    
    const handleSave = () => {
        if (validate()) {
            onSave(equipment);
        }
    };

    return (
        <Card>
            <CardHeader>{equipment.id.startsWith('new-') ? 'Novo Equipamento' : `Editando ${equipment.name}`}</CardHeader>
            <CardContent>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <Input label="Nome do Equipamento" value={equipment.name} onChange={e => handleChange('name', e.target.value)} error={errors.name} />
                    <Input label="Número de Série" value={equipment.serialNumber} onChange={e => handleChange('serialNumber', e.target.value)} error={errors.serialNumber} />
                    
                    <Input label="Data da Compra" type="date" value={equipment.purchaseDate.split('T')[0]} onChange={e => handleChange('purchaseDate', e.target.value)} error={errors.purchaseDate} />
                    <Input label="Data Fim da Garantia" type="date" value={equipment.warrantyEndDate.split('T')[0]} onChange={e => handleChange('warrantyEndDate', e.target.value)} error={errors.warrantyEndDate} />
                    
                    <Input label="Nº da NF de Compra" value={equipment.purchaseInvoiceNumber} onChange={e => handleChange('purchaseInvoiceNumber', e.target.value)} error={errors.purchaseInvoiceNumber} />
                    <Input label="CNPJ do Fornecedor" value={equipment.supplierCnpj} onChange={e => handleChange('supplierCnpj', e.target.value)} error={errors.supplierCnpj} />
                    
                    <Input label="Localização Atual" value={equipment.currentLocation} onChange={e => handleChange('currentLocation', e.target.value)} error={errors.currentLocation} />
                     <Select label="Responsável" value={equipment.assignedTo} onChange={e => handleChange('assignedTo', e.target.value)} error={errors.assignedTo}>
                        <option value="">Ninguém</option>
                        {mockProductionProfessionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </Select>

                     <Select label="Status" value={equipment.status} onChange={e => handleChange('status', e.target.value as EquipmentStatus)} error={errors.status}>
                        {Object.entries(equipmentStatusMap).map(([key, {label}]) => <option key={key} value={key}>{label}</option>)}
                    </Select>
                </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-4">
                <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
                <Button onClick={handleSave}>Salvar</Button>
            </CardFooter>
        </Card>
    );
};

const MaintenanceFormModal: FC<{
    equipmentId: string;
    isOpen: boolean;
    onClose: () => void;
    onSave: (log: Omit<MaintenanceLog, 'id'>) => void;
}> = ({ equipmentId, isOpen, onClose, onSave }) => {
    const { currentUser } = useData();
    const [log, setLog] = useState<Partial<MaintenanceLog>>({
        maintenanceDate: new Date().toISOString().split('T')[0],
        performedBy: currentUser.id,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    
    const handleChange = (field: keyof MaintenanceLog, value: any) => {
        setLog(prev => ({...prev, [field]: value }));
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!log.description?.trim()) newErrors.description = "Descrição é obrigatória.";
        if (!log.maintenanceDate) newErrors.maintenanceDate = "Data é obrigatória.";
        if ((log.cost || 0) < 0) newErrors.cost = "Custo não pode ser negativo.";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    
    const handleSave = () => {
        if (validate()) {
            onSave({
                equipmentId,
                maintenanceDate: log.maintenanceDate!,
                description: log.description!,
                cost: log.cost || 0,
                performedBy: log.performedBy!,
                nextMaintenanceDate: log.nextMaintenanceDate
            });
        }
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Registrar Manutenção">
            <div className="space-y-4">
                <Textarea label="Descrição do Serviço" value={log.description || ''} onChange={e => handleChange('description', e.target.value)} error={errors.description} />
                <Input label="Custo (R$)" type="number" value={log.cost || ''} onChange={e => handleChange('cost', parseFloat(e.target.value) || 0)} error={errors.cost} />
                <Input label="Data da Manutenção" type="date" value={log.maintenanceDate?.split('T')[0] || ''} onChange={e => handleChange('maintenanceDate', e.target.value)} error={errors.maintenanceDate} />
                <Input label="Próxima Manutenção (Opcional)" type="date" value={log.nextMaintenanceDate?.split('T')[0] || ''} onChange={e => handleChange('nextMaintenanceDate', e.target.value)} />
                <Select label="Executado Por" value={log.performedBy || ''} onChange={e => handleChange('performedBy', e.target.value)}>
                    {mockUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </Select>
            </div>
             <div className="flex justify-end mt-6 space-x-3">
                <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSave}>Salvar</Button>
            </div>
        </Modal>
    );
};

const EquipmentPage: FC = () => {
    const { equipment, maintenanceLogs, saveEquipment, addMaintenanceLog } = useData();
    const [view, setView] = useState<'list' | 'form'>('list');
    const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
    const [isMaintModalOpen, setIsMaintModalOpen] = useState(false);
    
    const handleNew = () => {
        setEditingEquipment({
            id: 'new-eqp', name: '', serialNumber: '', status: 'operacional', assignedTo: '',
            currentLocation: '', purchaseDate: new Date().toISOString(),
            purchaseInvoiceNumber: '', supplierCnpj: '', warrantyEndDate: ''
        });
        setView('form');
    };

    const handleEdit = (eq: Equipment) => {
        setEditingEquipment(JSON.parse(JSON.stringify(eq)));
        setView('form');
    };

    const handleSave = (eq: Equipment) => {
        saveEquipment(eq);
        setView('list');
        setEditingEquipment(null);
    };

    const handleCancel = () => {
        setView('list');
        setEditingEquipment(null);
    };

    const handleAddMaintenance = (eq: Equipment) => {
        setEditingEquipment(eq); // To know which equipment we're adding to
        setIsMaintModalOpen(true);
    };

    const handleSaveMaintenance = (log: Omit<MaintenanceLog, 'id'>) => {
        addMaintenanceLog(log);
        setIsMaintModalOpen(false);
        setEditingEquipment(null);
    };

    if (view === 'form' && editingEquipment) {
        return <EquipmentForm equipment={editingEquipment} onSave={handleSave} onCancel={handleCancel} />;
    }

    return (
        <div>
            {isMaintModalOpen && editingEquipment && (
                <MaintenanceFormModal 
                    isOpen={isMaintModalOpen}
                    onClose={() => { setIsMaintModalOpen(false); setEditingEquipment(null); }}
                    onSave={handleSaveMaintenance}
                    equipmentId={editingEquipment.id}
                />
            )}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary dark:text-slate-100">Controle de Equipamentos</h1>
                    <p className="mt-2 text-text-secondary dark:text-slate-400">Gerencie máquinas, ferramentas e seus históricos de manutenção.</p>
                </div>
                <Button onClick={handleNew}>Novo Equipamento</Button>
            </div>

            <Card className="p-0">
                <CardContent>
                     <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead><tr className="border-b border-border dark:border-slate-700"><th className="p-3">Equipamento</th><th className="p-3">Nº Série</th><th className="p-3">Localização</th><th className="p-3">Responsável</th><th className="p-3">Status</th><th className="p-3">Próx. Manutenção</th><th className="p-3 text-center">Ações</th></tr></thead>
                            <tbody>
                                {equipment.map(eq => {
                                    const logs = maintenanceLogs.filter(l => l.equipmentId === eq.id).sort((a,b) => new Date(b.maintenanceDate).getTime() - new Date(a.maintenanceDate).getTime());
                                    const nextMaint = logs[0]?.nextMaintenanceDate;
                                    return (
                                    <tr key={eq.id} className="border-b border-border dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                        <td className="p-3 font-semibold">{eq.name}</td>
                                        <td className="p-3 font-mono text-sm">{eq.serialNumber}</td>
                                        <td className="p-3">{eq.currentLocation}</td>
                                        <td className="p-3">{mockProductionProfessionals.find(p => p.id === eq.assignedTo)?.name || '-'}</td>
                                        <td className="p-3"><StatusBadge status={eq.status} statusMap={equipmentStatusMap} /></td>
                                        <td className="p-3">{nextMaint ? new Date(nextMaint).toLocaleDateString() : '-'}</td>
                                        <td className="p-3 text-center space-x-2">
                                            <Button size="sm" variant="secondary" onClick={() => handleAddMaintenance(eq)}>+ Manutenção</Button>
                                            <Button size="sm" variant="ghost" onClick={() => handleEdit(eq)}>Editar</Button>
                                        </td>
                                    </tr>
                                )})}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default EquipmentPage;
