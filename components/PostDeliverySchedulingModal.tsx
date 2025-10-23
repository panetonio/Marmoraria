import React, { useState, useEffect, useMemo } from 'react';
import type { ServiceOrder, Vehicle, ProductionEmployee, ChecklistTemplate } from '../types';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Input from './ui/Input';
import Select from './ui/Select';
import InteractiveChecklist from './InteractiveChecklist';
import Calendar from './ui/Calendar';
import Card, { CardHeader, CardContent } from './ui/Card';
import { api } from '../utils/api';
import SmartResourceSelector from './SmartResourceSelector';

interface PostDeliverySchedulingModalProps {
  isOpen: boolean;
  serviceOrder: ServiceOrder;
  checklistTemplate?: ChecklistTemplate;
  onClose: () => void;
  onDeliveryConfirmed: (data: {
    serviceOrderId: string;
    checklistItems: { id: string; text: string; checked: boolean }[];
    photos: { url: string; description?: string }[];
    customerSignature: { url: string; timestamp: string };
  }) => void;
  onInstallationScheduled: (data: {
    serviceOrderIds: string[];
    type: 'installation';
    vehicleId: string;
    scheduledStart: string;
    scheduledEnd: string;
    teamIds: string[];
  }) => void;
  vehicles: Vehicle[];
  productionEmployees: ProductionEmployee[];
}

type Step = 'checklist' | 'schedule';

const PostDeliverySchedulingModal: React.FC<PostDeliverySchedulingModalProps> = ({
  isOpen,
  serviceOrder,
  checklistTemplate,
  onClose,
  onDeliveryConfirmed,
  onInstallationScheduled,
  vehicles,
  productionEmployees
}) => {
  const [currentStep, setCurrentStep] = useState<Step>('checklist');
  const [checklistData, setChecklistData] = useState<any>(null);
  
  // Agendamento de instalação
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('18:00');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [error, setError] = useState('');
  
  // Sugestões de recursos disponíveis
  const [suggestedEmployees, setSuggestedEmployees] = useState<ProductionEmployee[]>([]);
  const [suggestedVehicles, setSuggestedVehicles] = useState<Vehicle[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Reset ao abrir
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('checklist');
      setChecklistData(null);
      setDate('');
      setStartTime('08:00');
      setEndTime('18:00');
      setSelectedVehicleId('');
      setSelectedTeamIds([]);
      setError('');
      setSuggestedEmployees([]);
      setSuggestedVehicles([]);
    }
  }, [isOpen, serviceOrder.id]);

  // Buscar sugestões quando chegar na etapa de agendamento
  useEffect(() => {
    if (currentStep === 'schedule' && date && startTime && endTime) {
      fetchResourceSuggestions();
    }
  }, [currentStep, date, startTime, endTime]);

  const fetchResourceSuggestions = async () => {
    if (!date || !startTime || !endTime) return;

    const start = new Date(`${date}T${startTime}`).toISOString();
    const end = new Date(`${date}T${endTime}`).toISOString();

    setLoadingSuggestions(true);
    setError('');

    try {
      // Buscar montadores disponíveis
      const employeesResponse = await api.getResourceAvailability({
        type: 'employee',
        start,
        end,
        role: 'montador'
      });

      if (employeesResponse.success) {
        const availableEmployees = employeesResponse.resources.map((r: any) => ({
          id: r.id,
          name: r.name,
          role: r.role,
          phone: r.phone,
          email: r.email,
          isActive: true,
          hireDate: '',
          createdAt: ''
        }));
        setSuggestedEmployees(availableEmployees);
      }

      // Buscar veículos disponíveis
      const vehiclesResponse = await api.getResourceAvailability({
        type: 'vehicle',
        start,
        end
      });

      if (vehiclesResponse.success) {
        const availableVehicles = vehiclesResponse.resources.map((r: any) => ({
          id: r.id,
          name: r.name,
          licensePlate: r.licensePlate,
          type: r.type,
          capacity: r.capacity,
          status: r.status,
          createdAt: '',
          updatedAt: ''
        }));
        setSuggestedVehicles(availableVehicles);
      }
    } catch (err) {
      console.error('Erro ao buscar sugestões:', err);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleChecklistComplete = async (data: any) => {
    setChecklistData(data);

    // Confirmar entrega
    onDeliveryConfirmed({
      serviceOrderId: serviceOrder.id,
      checklistItems: data.items,
      photos: data.photos.map((p: any) => ({
        url: p.dataUrl,
        description: p.description
      })),
      customerSignature: {
        url: data.signature,
        timestamp: new Date().toISOString()
      }
    });

    // Verificar se requer instalação
    if (serviceOrder.finalizationType === 'delivery_installation') {
      setCurrentStep('schedule');
    } else {
      // Se não requer instalação, fechar modal
      onClose();
    }
  };

  const handleScheduleInstallation = () => {
    if (!date || !startTime || !endTime) {
      setError('Data e horários são obrigatórios.');
      return;
    }

    if (!selectedVehicleId) {
      setError('Selecione um veículo.');
      return;
    }

    if (selectedTeamIds.length === 0) {
      setError('Selecione ao menos um membro da equipe.');
      return;
    }

    const scheduledStart = new Date(`${date}T${startTime}`).toISOString();
    const scheduledEnd = new Date(`${date}T${endTime}`).toISOString();

    if (new Date(scheduledStart) >= new Date(scheduledEnd)) {
      setError('Horário final deve ser após o inicial.');
      return;
    }

    onInstallationScheduled({
      serviceOrderIds: [serviceOrder.id],
      type: 'installation',
      vehicleId: selectedVehicleId,
      scheduledStart,
      scheduledEnd,
      teamIds: selectedTeamIds
    });

    onClose();
  };

  const handleSkipInstallation = () => {
    onClose();
  };

  const toggleTeamMember = (memberId: string) => {
    setSelectedTeamIds(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  // Preparar itens do checklist
  const checklistItems = useMemo(() => {
    if (!checklistTemplate) {
      // Checklist padrão mínimo
      return [
        { id: '1', text: 'Material entregue em bom estado', checked: false },
        { id: '2', text: 'Quantidade conferida', checked: false },
        { id: '3', text: 'Cliente presente no recebimento', checked: false },
        { id: '4', text: 'Local de entrega conferido', checked: false }
      ];
    }

    return checklistTemplate.items.map(item => ({
      ...item,
      id: item.id || `item-${Math.random()}`,
      checked: false
    }));
  }, [checklistTemplate]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={currentStep === 'checklist' ? 'Confirmar Entrega' : 'Agendar Instalação'}
      className="max-w-5xl"
    >
      {currentStep === 'checklist' && (
        <InteractiveChecklist
          title={`Checklist de Entrega - OS ${serviceOrder.id}`}
          items={checklistItems}
          onChecklistComplete={handleChecklistComplete}
          onCancel={onClose}
          requireSignature={true}
          requirePhotos={true}
          minPhotos={2}
          tabletMode={true}
        />
      )}

      {currentStep === 'schedule' && (
        <div className="space-y-6">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <p className="text-green-700 dark:text-green-300 text-center font-medium">
              ✓ Entrega confirmada com sucesso! Agora vamos agendar a instalação.
            </p>
          </div>

          <Card>
            <CardHeader>
              <h3 className="text-xl font-semibold">Informações da Instalação</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-2">
                      📅 Data da Instalação
                    </label>
                    <div className="flex gap-2">
                      <Input
                        label=""
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        onClick={() => setShowCalendar(!showCalendar)}
                      >
                        📅
                      </Button>
                    </div>
                    {showCalendar && (
                      <div className="mt-2">
                        <Calendar
                          value={date}
                          onChange={(newDate) => {
                            setDate(newDate);
                            setShowCalendar(false);
                          }}
                          minDate={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      label="Início"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                    <Input
                      label="Término"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                </div>

                {/* Equipe de Instalação - Seleção Inteligente */}
                <SmartResourceSelector
                  type="employee"
                  selectedIds={selectedTeamIds}
                  onSelectionChange={setSelectedTeamIds}
                  startDate={date}
                  startTime={startTime}
                  endDate={date}
                  endTime={endTime}
                  role="montador"
                  label="👥 Equipe de Instalação (Montadores)"
                  multiple={true}
                  required={true}
                />

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

                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between gap-3">
            <Button
              variant="ghost"
              onClick={handleSkipInstallation}
            >
              Pular (Agendar Depois)
            </Button>
            <Button
              onClick={handleScheduleInstallation}
              disabled={!date || !selectedVehicleId || selectedTeamIds.length === 0}
            >
              ✓ Agendar Instalação
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default PostDeliverySchedulingModal;

