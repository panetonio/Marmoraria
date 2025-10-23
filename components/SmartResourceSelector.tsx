import React, { useState, useEffect, useMemo } from 'react';
import type { Vehicle, ProductionEmployee } from '../types';
import Select from './ui/Select';
import Button from './ui/Button';
import Badge from './ui/Badge';
import { api } from '../utils/api';

interface SmartResourceSelectorProps {
  type: 'vehicle' | 'employee';
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  excludeRouteId?: string; // Para edição, excluir a própria rota da verificação
  role?: string; // Para filtrar funcionários por função
  label?: string;
  multiple?: boolean;
  required?: boolean;
  disabled?: boolean;
}

interface ResourceWithAvailability {
  id: string;
  name: string;
  isAvailable: boolean;
  conflictReason?: string;
  details: any;
}

const SmartResourceSelector: React.FC<SmartResourceSelectorProps> = ({
  type,
  selectedIds,
  onSelectionChange,
  startDate,
  startTime,
  endDate,
  endTime,
  excludeRouteId,
  role,
  label,
  multiple = false,
  required = false,
  disabled = false
}) => {
  const [loading, setLoading] = useState(false);
  const [allResources, setAllResources] = useState<ResourceWithAvailability[]>([]);
  const [error, setError] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  // Verificar se temos datas válidas
  const hasValidDates = useMemo(() => {
    return !!(startDate && startTime && endDate && endTime);
  }, [startDate, startTime, endDate, endTime]);

  // Buscar recursos disponíveis
  useEffect(() => {
    if (!hasValidDates) {
      setAllResources([]);
      return;
    }

    const fetchResources = async () => {
      setLoading(true);
      setError('');

      try {
        const start = new Date(`${startDate}T${startTime}`).toISOString();
        const end = new Date(`${endDate}T${endTime}`).toISOString();

        // Validar datas
        if (new Date(start) >= new Date(end)) {
          setError('Data/hora final deve ser posterior à inicial');
          setAllResources([]);
          setLoading(false);
          return;
        }

        const params: any = { type, start, end };
        if (type === 'employee' && role) {
          params.role = role;
        }

        const response = await api.getResourceAvailability(params);

        if (response.success) {
          const resources = response.resources || [];
          const formatted: ResourceWithAvailability[] = resources.map((r: any) => ({
            id: r.id || r._id,
            name: r.name,
            isAvailable: true,
            details: r
          }));

          setAllResources(formatted);
        } else {
          setError(response.message || 'Erro ao buscar recursos');
          setAllResources([]);
        }
      } catch (err) {
        console.error('Erro ao buscar recursos:', err);
        setError('Erro ao conectar com o servidor');
        setAllResources([]);
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, [type, startDate, startTime, endDate, endTime, role, hasValidDates]);

  const availableResources = useMemo(() => {
    return allResources.filter(r => r.isAvailable);
  }, [allResources]);

  const unavailableCount = allResources.length - availableResources.length;

  const handleSingleSelection = (resourceId: string) => {
    if (disabled) return;
    onSelectionChange([resourceId]);
  };

  const handleMultipleSelection = (resourceId: string) => {
    if (disabled) return;
    
    if (selectedIds.includes(resourceId)) {
      onSelectionChange(selectedIds.filter(id => id !== resourceId));
    } else {
      onSelectionChange([...selectedIds, resourceId]);
    }
  };

  const renderVehicleDetails = (vehicle: any) => (
    <div className="text-xs text-text-secondary dark:text-slate-400 mt-1">
      <div>Placa: {vehicle.licensePlate}</div>
      <div>Tipo: {vehicle.type === 'van' ? 'Van' : 'Caminhão'}</div>
      <div>Capacidade: {vehicle.capacity} kg</div>
    </div>
  );

  const renderEmployeeDetails = (employee: any) => (
    <div className="text-xs text-text-secondary dark:text-slate-400 mt-1">
      {employee.role && <div>Função: {employee.role}</div>}
      {employee.phone && <div>Tel: {employee.phone}</div>}
      {employee.email && <div>Email: {employee.email}</div>}
    </div>
  );

  if (!hasValidDates) {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-text-secondary dark:text-slate-400">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        )}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-border dark:border-slate-600 rounded-lg text-center">
          <p className="text-sm text-text-secondary dark:text-slate-400">
            ℹ️ Selecione data e horário primeiro para ver {type === 'vehicle' ? 'veículos' : 'funcionários'} disponíveis
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-text-secondary dark:text-slate-400">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        )}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-border dark:border-slate-600 rounded-lg text-center">
          <p className="text-sm text-text-secondary dark:text-slate-400">
            ⏳ Verificando disponibilidade...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-text-secondary dark:text-slate-400">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        )}
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!multiple) {
    // Modo single select
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-text-secondary dark:text-slate-400">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        )}
        
        {availableResources.length === 0 ? (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              ⚠️ Nenhum {type === 'vehicle' ? 'veículo' : 'funcionário'} disponível no período selecionado
            </p>
          </div>
        ) : (
          <>
            <Select
              value={selectedIds[0] || ''}
              onChange={(e) => handleSingleSelection(e.target.value)}
              disabled={disabled}
            >
              <option value="">
                Selecione um {type === 'vehicle' ? 'veículo' : 'funcionário'}
              </option>
              {availableResources.map(resource => (
                <option key={resource.id} value={resource.id}>
                  {resource.name}
                  {type === 'vehicle' && ` • ${resource.details.licensePlate}`}
                  {type === 'employee' && resource.details.role && ` • ${resource.details.role}`}
                </option>
              ))}
            </Select>

            <div className="flex items-center justify-between text-xs text-text-secondary dark:text-slate-400">
              <span>
                ✓ {availableResources.length} {type === 'vehicle' ? 'veículo(s)' : 'funcionário(s)'} disponível(is)
              </span>
              {unavailableCount > 0 && (
                <span className="text-yellow-600 dark:text-yellow-400">
                  ⚠️ {unavailableCount} ocupado(s)
                </span>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  // Modo multiple select
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        {label && (
          <label className="block text-sm font-medium text-text-secondary dark:text-slate-400">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? 'Ocultar' : 'Mostrar'} Detalhes
        </Button>
      </div>

      {availableResources.length === 0 ? (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            ⚠️ Nenhum {type === 'vehicle' ? 'veículo' : 'funcionário'} disponível no período selecionado
          </p>
        </div>
      ) : (
        <>
          <div className="border border-border dark:border-slate-600 rounded-lg p-3 max-h-80 overflow-y-auto bg-white dark:bg-slate-800">
            <div className="space-y-2">
              {availableResources.map(resource => {
                const isSelected = selectedIds.includes(resource.id);
                
                return (
                  <label
                    key={resource.id}
                    className={`flex items-start p-3 rounded-lg cursor-pointer transition border-2 ${
                      isSelected
                        ? 'bg-primary/10 border-primary'
                        : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-700'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleMultipleSelection(resource.id)}
                      disabled={disabled}
                      className="h-5 w-5 rounded text-primary focus:ring-primary mt-0.5"
                    />
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-text-primary dark:text-slate-100">
                          {resource.name}
                        </span>
                        <Badge variant="success" className="text-xs">
                          Disponível
                        </Badge>
                      </div>
                      {showDetails && type === 'vehicle' && renderVehicleDetails(resource.details)}
                      {showDetails && type === 'employee' && renderEmployeeDetails(resource.details)}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-text-secondary dark:text-slate-400">
            <span>
              {selectedIds.length > 0 
                ? `${selectedIds.length} selecionado(s)` 
                : 'Nenhum selecionado'}
            </span>
            <span>
              ✓ {availableResources.length} disponível(is)
              {unavailableCount > 0 && ` • ⚠️ ${unavailableCount} ocupado(s)`}
            </span>
          </div>
        </>
      )}
    </div>
  );
};

export default SmartResourceSelector;

