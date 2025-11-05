import React from 'react';
import type { Vehicle, ProductionEmployee } from '../types';
import Card, { CardHeader, CardContent } from './ui/Card';
import Input from './ui/Input';
import DateInput from './ui/DateInput';
import Select from './ui/Select';
import Button from './ui/Button';

interface FilterState {
  dateRange: { start: string; end: string };
  client: string;
  status: string;
  team: string;
  vehicle: string;
  priority: string;
}

interface OperationsFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  vehicles: Vehicle[];
  productionEmployees: ProductionEmployee[];
}

const OperationsFilters: React.FC<OperationsFiltersProps> = ({
  filters,
  onFiltersChange,
  vehicles,
  productionEmployees
}) => {
  const handleFilterChange = (key: keyof FilterState, value: string | { start: string; end: string }) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      dateRange: {
        start: new Date().toISOString().split('T')[0],
        end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      client: '',
      status: '',
      team: '',
      vehicle: '',
      priority: ''
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => {
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(v => v !== '');
    }
    return value !== '';
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text-primary dark:text-slate-100">
            🔍 Filtros de Operações
          </h3>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              🗑️ Limpar Filtros
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* Período */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-text-secondary dark:text-slate-400">
              📅 Período
            </label>
            <div className="space-y-2">
              <DateInput
                value={filters.dateRange.start}
                onChange={(value) => handleFilterChange('dateRange', {
                  ...filters.dateRange,
                  start: value
                })}
                label="Data Início"
                className="text-sm"
              />
              <DateInput
                value={filters.dateRange.end}
                onChange={(value) => handleFilterChange('dateRange', {
                  ...filters.dateRange,
                  end: value
                })}
                label="Data Final"
                className="text-sm"
              />
            </div>
          </div>

          {/* Cliente */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-text-secondary dark:text-slate-400">
              👤 Cliente
            </label>
            <Input
              type="text"
              value={filters.client}
              onChange={(e) => handleFilterChange('client', e.target.value)}
              placeholder="Nome do cliente..."
              label=""
              className="text-sm"
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-text-secondary dark:text-slate-400">
              📊 Status
            </label>
            <Select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">Todos os status</option>
              <optgroup label="Produção">
                <option value="pending_production">Aguardando Produção</option>
                <option value="cutting">Em Corte</option>
                <option value="finishing">Em Acabamento</option>
                <option value="quality_check">Controle de Qualidade</option>
                <option value="awaiting_logistics">Pronto para Logística</option>
              </optgroup>
              <optgroup label="Logística">
                <option value="awaiting_scheduling">Aguardando Agendamento</option>
                <option value="scheduled">Agendado</option>
                <option value="in_transit">Em Trânsito</option>
                <option value="delivered">Entregue</option>
                <option value="completed">Concluído</option>
              </optgroup>
            </Select>
          </div>

          {/* Equipe */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-text-secondary dark:text-slate-400">
              👥 Equipe
            </label>
            <Select
              value={filters.team}
              onChange={(e) => handleFilterChange('team', e.target.value)}
            >
              <option value="">Toda a equipe</option>
              {productionEmployees
                .filter(emp => emp.isActive)
                .map(employee => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name} ({employee.role})
                  </option>
                ))}
            </Select>
          </div>

          {/* Veículo */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-text-secondary dark:text-slate-400">
              🚚 Veículo
            </label>
            <Select
              value={filters.vehicle}
              onChange={(e) => handleFilterChange('vehicle', e.target.value)}
            >
              <option value="">Todos os veículos</option>
              {vehicles.map(vehicle => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.name} ({vehicle.licensePlate})
                </option>
              ))}
            </Select>
          </div>

          {/* Prioridade */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-text-secondary dark:text-slate-400">
              ⚡ Prioridade
            </label>
            <Select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
            >
              <option value="">Todas as prioridades</option>
              <option value="normal">Normal</option>
              <option value="alta">Alta</option>
              <option value="urgente">Urgente</option>
            </Select>
          </div>
        </div>

        {/* Resumo dos Filtros Ativos */}
        {hasActiveFilters && (
          <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-text-secondary dark:text-slate-400">
                Filtros ativos:
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {filters.client && (
                <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                  Cliente: {filters.client}
                </span>
              )}
              {filters.status && (
                <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                  Status: {filters.status}
                </span>
              )}
              {filters.team && (
                <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                  Equipe: {productionEmployees.find(emp => emp.id === filters.team)?.name}
                </span>
              )}
              {filters.vehicle && (
                <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                  Veículo: {vehicles.find(v => v.id === filters.vehicle)?.name}
                </span>
              )}
              {filters.priority && (
                <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                  Prioridade: {filters.priority}
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OperationsFilters;
