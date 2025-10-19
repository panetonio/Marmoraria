import React, { useState, useMemo, FC } from 'react';
import type { ProductionEmployee, ProductionEmployeeRole } from '../types';
import { useData } from '../context/DataContext';
import Card, { CardHeader, CardContent } from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import StatusBadge from '../components/ui/StatusBadge';

const EmployeeCard: FC<{ 
    employee: ProductionEmployee, 
    onEdit: (employee: ProductionEmployee) => void,
    onDelete: (employeeId: string) => void
}> = ({ employee, onEdit, onDelete }) => {
    const getRoleColor = (role: ProductionEmployeeRole) => {
        switch (role) {
            case 'supervisor': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
            case 'cortador': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'acabador': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'montador': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'entregador': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
            case 'auxiliar': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        }
    };

    const getRoleLabel = (role: ProductionEmployeeRole) => {
        switch (role) {
            case 'supervisor': return 'Supervisor';
            case 'cortador': return 'Cortador';
            case 'acabador': return 'Acabador';
            case 'montador': return 'Montador';
            case 'entregador': return 'Entregador';
            case 'auxiliar': return 'Auxiliar';
            default: return role;
        }
    };

    return (
        <Card className="p-4 hover:shadow-lg transition-shadow duration-300">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <h3 className="font-bold text-text-primary dark:text-slate-100 text-lg">{employee.name}</h3>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(employee.role)}`}>
                        {getRoleLabel(employee.role)}
                    </span>
                </div>
                <div className="flex space-x-2">
                    <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => onEdit(employee)}
                        title="Editar funcionário"
                    >
                        ✏️
                    </Button>
                    <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => onDelete(employee.id)}
                        title="Remover funcionário"
                        className="text-red-600 hover:text-red-800"
                    >
                        🗑️
                    </Button>
                </div>
            </div>
            
            <div className="space-y-2 text-sm text-text-secondary dark:text-slate-400">
                <div className="flex items-center">
                    <span className="font-semibold mr-2">📞</span>
                    <span>{employee.phone}</span>
                </div>
                {employee.email && (
                    <div className="flex items-center">
                        <span className="font-semibold mr-2">📧</span>
                        <span>{employee.email}</span>
                    </div>
                )}
                <div className="flex items-center">
                    <span className="font-semibold mr-2">📅</span>
                    <span>Admitido em {new Date(employee.hireDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center">
                    <span className="font-semibold mr-2">Status:</span>
                    <StatusBadge 
                        status={employee.isActive ? 'active' : 'inactive'} 
                        statusMap={{
                            active: { label: 'Ativo', variant: 'success' },
                            inactive: { label: 'Inativo', variant: 'error' }
                        }} 
                    />
                </div>
            </div>
        </Card>
    );
};

const EmployeeForm: FC<{
    employee: ProductionEmployee;
    onSave: (employee: ProductionEmployee) => void;
    onCancel: () => void;
}> = ({ employee: initialEmployee, onSave, onCancel }) => {
    const [employee, setEmployee] = useState<ProductionEmployee>(initialEmployee);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!employee.name.trim()) newErrors.name = "Nome é obrigatório.";
        if (!employee.phone.trim()) newErrors.phone = "Telefone é obrigatório.";
        if (!employee.role) newErrors.role = "Função é obrigatória.";
        if (!employee.hireDate) newErrors.hireDate = "Data de admissão é obrigatória.";
        
        if (employee.email && !/\S+@\S+\.\S+/.test(employee.email)) {
            newErrors.email = "Formato de email inválido.";
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (validate()) {
            onSave(employee);
        }
    };

    return (
        <Card>
            <CardHeader>
                <h2 className="text-2xl font-semibold">
                    {employee.id.startsWith('new-') ? 'Novo Funcionário' : `Editando ${employee.name}`}
                </h2>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Nome Completo"
                            value={employee.name}
                            onChange={(e) => setEmployee({...employee, name: e.target.value})}
                            error={errors.name}
                        />
                        <Input
                            label="Telefone"
                            value={employee.phone}
                            onChange={(e) => setEmployee({...employee, phone: e.target.value})}
                            error={errors.phone}
                            placeholder="(11) 99999-9999"
                        />
                        <Input
                            label="Email (opcional)"
                            type="email"
                            value={employee.email || ''}
                            onChange={(e) => setEmployee({...employee, email: e.target.value || undefined})}
                            error={errors.email}
                            placeholder="funcionario@marmoraria.com"
                        />
                        <Select
                            label="Função"
                            value={employee.role}
                            onChange={(e) => setEmployee({...employee, role: e.target.value as ProductionEmployeeRole})}
                            error={errors.role}
                        >
                            <option value="">Selecione uma função</option>
                            <option value="supervisor">Supervisor</option>
                            <option value="cortador">Cortador</option>
                            <option value="acabador">Acabador</option>
                            <option value="montador">Montador</option>
                            <option value="entregador">Entregador</option>
                            <option value="auxiliar">Auxiliar</option>
                        </Select>
                        <Input
                            label="Data de Admissão"
                            type="date"
                            value={employee.hireDate}
                            onChange={(e) => setEmployee({...employee, hireDate: e.target.value})}
                            error={errors.hireDate}
                        />
                        <div className="flex items-center space-x-4">
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={employee.isActive}
                                    onChange={(e) => setEmployee({...employee, isActive: e.target.checked})}
                                    className="rounded"
                                />
                                <span className="text-sm font-medium">Funcionário Ativo</span>
                            </label>
                        </div>
                    </div>
                </div>
            </CardContent>
            <div className="flex justify-end space-x-4 p-6 border-t border-border dark:border-slate-700">
                <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
                <Button onClick={handleSave}>Salvar Funcionário</Button>
            </div>
        </Card>
    );
};

const ProductionEmployeesPage: React.FC = () => {
    const { 
        productionEmployees,
        addProductionEmployee, 
        updateProductionEmployee, 
        deleteProductionEmployee 
    } = useData();
    
    const [currentView, setCurrentView] = useState<'list' | 'form'>('list');
    const [selectedEmployee, setSelectedEmployee] = useState<ProductionEmployee | null>(null);
    const [roleFilter, setRoleFilter] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('');

    const handleNew = () => {
        setSelectedEmployee({
            id: `new-${Date.now()}`,
            name: '',
            phone: '',
            email: undefined,
            role: 'auxiliar' as ProductionEmployeeRole,
            isActive: true,
            hireDate: new Date().toISOString().split('T')[0],
            createdAt: new Date().toISOString()
        });
        setCurrentView('form');
    };

    const handleEdit = (employee: ProductionEmployee) => {
        setSelectedEmployee(employee);
        setCurrentView('form');
    };

    const handleSave = (employeeToSave: ProductionEmployee) => {
        if (employeeToSave.id.startsWith('new-')) {
            addProductionEmployee(employeeToSave);
        } else {
            updateProductionEmployee(employeeToSave);
        }
        setCurrentView('list');
        setSelectedEmployee(null);
    };

    const handleCancel = () => {
        setCurrentView('list');
        setSelectedEmployee(null);
    };

    const handleDelete = (employeeId: string) => {
        if (window.confirm('Tem certeza que deseja remover este funcionário? Esta ação não pode ser desfeita.')) {
            deleteProductionEmployee(employeeId);
        }
    };

    const filteredEmployees = useMemo(() => {
        return productionEmployees.filter(emp => {
            const roleMatch = roleFilter ? emp.role === roleFilter : true;
            const statusMatch = statusFilter ? 
                (statusFilter === 'active' ? emp.isActive : !emp.isActive) : true;
            return roleMatch && statusMatch;
        }).sort((a, b) => {
            // Ordenar por função (supervisor primeiro) e depois por nome
            const roleOrder = { supervisor: 0, cortador: 1, acabador: 2, montador: 3, entregador: 4, auxiliar: 5 };
            const roleDiff = roleOrder[a.role] - roleOrder[b.role];
            return roleDiff !== 0 ? roleDiff : a.name.localeCompare(b.name);
        });
    }, [productionEmployees, roleFilter, statusFilter]);

    const roleStats = useMemo(() => {
        const stats = productionEmployees.reduce((acc, emp) => {
            acc[emp.role] = (acc[emp.role] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        return stats;
    }, [productionEmployees]);

    return (
        <div>
            {currentView === 'list' && (
                <>
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-text-primary dark:text-slate-100">Funcionários de Produção</h1>
                            <p className="mt-2 text-text-secondary dark:text-slate-400">Gerencie a equipe de produção e logística.</p>
                        </div>
                        <Button onClick={handleNew}>+ Adicionar Funcionário</Button>
                    </div>

                    {/* Estatísticas por função */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                        {Object.entries(roleStats).map(([role, count]) => (
                            <Card key={role} className="p-4 text-center">
                                <div className="text-2xl font-bold text-text-primary dark:text-slate-100">{count}</div>
                                <div className="text-sm text-text-secondary dark:text-slate-400 capitalize">{role}s</div>
                            </Card>
                        ))}
                    </div>

                    {/* Filtros */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <Card className="p-4">
                            <div className="flex items-center space-x-4">
                                <label htmlFor="role-filter" className="font-semibold text-text-primary dark:text-slate-100">Filtrar por Função:</label>
                                <Select
                                    id="role-filter"
                                    value={roleFilter}
                                    onChange={(e) => setRoleFilter(e.target.value)}
                                    className="w-full"
                                >
                                    <option value="">Todas as Funções</option>
                                    <option value="supervisor">Supervisor</option>
                                    <option value="cortador">Cortador</option>
                                    <option value="acabador">Acabador</option>
                                    <option value="montador">Montador</option>
                                    <option value="entregador">Entregador</option>
                                    <option value="auxiliar">Auxiliar</option>
                                </Select>
                            </div>
                        </Card>
                        <Card className="p-4">
                            <div className="flex items-center space-x-4">
                                <label htmlFor="status-filter" className="font-semibold text-text-primary dark:text-slate-100">Filtrar por Status:</label>
                                <Select
                                    id="status-filter"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full"
                                >
                                    <option value="">Todos os Status</option>
                                    <option value="active">Ativos</option>
                                    <option value="inactive">Inativos</option>
                                </Select>
                            </div>
                        </Card>
                        <Card className="p-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-text-primary dark:text-slate-100">{productionEmployees.length}</div>
                                <div className="text-sm text-text-secondary dark:text-slate-400">Total de Funcionários</div>
                            </div>
                        </Card>
                    </div>
                    
                    {/* Lista de funcionários */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredEmployees.map(employee => (
                            <EmployeeCard 
                                key={employee.id} 
                                employee={employee} 
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                            />
                        ))}
                        {filteredEmployees.length === 0 && (
                            <div className="col-span-full text-center p-10 bg-surface dark:bg-dark rounded-lg shadow-md">
                                <p className="text-text-secondary dark:text-slate-400">Nenhum funcionário encontrado com os filtros aplicados.</p>
                            </div>
                        )}
                    </div>
                </>
            )}

            {currentView === 'form' && selectedEmployee && (
                <EmployeeForm
                    employee={selectedEmployee}
                    onSave={handleSave}
                    onCancel={handleCancel}
                />
            )}
        </div>
    );
};

export default ProductionEmployeesPage;
