import React, { useState, useEffect, useMemo } from 'react';
import type { ServiceOrder, ProductionEmployee, Vehicle, ChecklistTemplate } from '../types';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Input from './ui/Input';
import Select from './ui/Select';
import Card, { CardHeader, CardContent } from './ui/Card';
import Badge from './ui/Badge';
import StatusBadge from './ui/StatusBadge';
import InteractiveChecklist from './InteractiveChecklist';
import SmartResourceSelector from './SmartResourceSelector';
import { api } from '../utils/api';

interface PostDeliverySchedulingModalProps {
  isOpen: boolean;
  serviceOrder: ServiceOrder;
  checklistTemplate?: ChecklistTemplate;
  onClose: () => void;
  onDeliveryConfirmed: (orderId: string, deliveryData: {
    checklistCompleted: boolean;
    photos: Array<{ url: string; description?: string }>;
    customerSignature: { url: string; timestamp: string };
  }) => void;
  onInstallationScheduled: (orderId: string, installationData: {
    scheduledStart: string;
    scheduledEnd: string;
    teamIds: string[];
    vehicleId?: string;
    notes?: string;
  }) => void;
  vehicles: Vehicle[];
  productionEmployees: ProductionEmployee[];
}

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
  const [currentStep, setCurrentStep] = useState<'delivery' | 'scheduling'>('delivery');
  const [deliveryData, setDeliveryData] = useState({
    checklistCompleted: false,
    photos: [] as Array<{ url: string; description?: string }>,
    customerSignature: { url: '', timestamp: '' }
  });
  
  const [schedulingData, setSchedulingData] = useState({
    date: '',
    startTime: '',
    endTime: '',
    selectedTeamIds: [] as string[],
    selectedVehicleId: '',
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('delivery');
      setDeliveryData({
        checklistCompleted: false,
        photos: [],
        customerSignature: { url: '', timestamp: '' }
      });
      setSchedulingData({
        date: '',
        startTime: '',
        endTime: '',
        selectedTeamIds: [],
        selectedVehicleId: '',
        notes: ''
      });
    }
  }, [isOpen]);

  // Available employees for installation (montadores)
  const availableEmployees = useMemo(() => {
    return productionEmployees.filter(emp => 
      emp.role === 'montador' && emp.isActive
    );
  }, [productionEmployees]);

  // Available vehicles
  const availableVehicles = useMemo(() => {
    return vehicles.filter(vehicle => 
      vehicle.status === 'disponivel' || vehicle.status === 'em_uso'
    );
  }, [vehicles]);

  const handleDeliveryConfirmation = async (newDeliveryData: typeof deliveryData) => {
    setDeliveryData(newDeliveryData);
    setCurrentStep('scheduling');
  };

  const handleChecklistComplete = async (data: {
    items: Array<{ id: string; text: string; checked: boolean }>;
    photos: Array<{ id: string; dataUrl: string; description?: string }>;
    signature: string | null;
  }) => {
    setIsSubmitting(true);
    setUploadProgress('Iniciando confirmação de entrega...');

    try {
      console.log('📋 Iniciando confirmação de entrega...');

      // Upload da assinatura se existir
      let signatureUrl: string | undefined;
      if (data.signature) {
        setUploadProgress('Fazendo upload da assinatura...');
        console.log('✍️ Fazendo upload da assinatura...');
        const signatureResult = await api.uploadImage(data.signature);
        if (!signatureResult.success) {
          throw new Error(`Erro ao fazer upload da assinatura: ${signatureResult.message}`);
        }
        signatureUrl = signatureResult.url;
        console.log('✅ Assinatura enviada:', signatureUrl);
      }

      // Upload das fotos
      const photoUrls: Array<{ url: string; description?: string }> = [];
      for (let i = 0; i < data.photos.length; i++) {
        const photo = data.photos[i];
        setUploadProgress(`Fazendo upload da foto ${i + 1} de ${data.photos.length}...`);
        console.log(`📸 Fazendo upload da foto ${photo.id}...`);
        const photoResult = await api.uploadImage(photo.dataUrl);
        if (!photoResult.success) {
          throw new Error(`Erro ao fazer upload da foto ${photo.id}: ${photoResult.message}`);
        }
        photoUrls.push({
          url: photoResult.url,
          description: photo.description
        });
        console.log('✅ Foto enviada:', photoResult.url);
      }

      // Preparar dados para a API de confirmação
      setUploadProgress('Enviando dados de confirmação...');
      const confirmationData = {
        checklistItems: data.items.map(item => ({
          id: item.id,
          text: item.text,
          checked: item.checked
        })),
        photoUrls: photoUrls,
        signatureUrl: signatureUrl,
        signatoryName: '', // Será preenchido pelo usuário se necessário
        signatoryDocument: '' // Será preenchido pelo usuário se necessário
      };

      console.log('📤 Enviando dados de confirmação para o backend...');
      
      // Chamar a API de confirmação de entrega
      const result = await api.confirmDeliveryData(serviceOrder.id, confirmationData);
      
      if (!result.success) {
        throw new Error(`Erro ao confirmar entrega: ${result.message}`);
      }

      console.log('✅ Entrega confirmada com sucesso:', result.data);

      // Atualizar o estado local com as URLs das imagens
      const updatedDeliveryData = {
        checklistCompleted: true,
        photos: photoUrls,
        customerSignature: {
          url: signatureUrl || '',
          timestamp: new Date().toISOString()
        }
      };

      setDeliveryData(updatedDeliveryData);
      setCurrentStep('scheduling');
      setUploadProgress('');

      // Notificar o componente pai sobre a confirmação
      onDeliveryConfirmed(serviceOrder.id, updatedDeliveryData);

    } catch (error) {
      console.error('❌ Erro na confirmação de entrega:', error);
      setUploadProgress('');
      alert(`Erro ao confirmar entrega: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScheduleInstallation = async () => {
    if (!schedulingData.date || !schedulingData.startTime || !schedulingData.endTime) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    if (schedulingData.selectedTeamIds.length === 0) {
      alert('Por favor, selecione pelo menos um membro da equipe');
      return;
    }

    setIsSubmitting(true);

    try {
      // Confirm delivery first
      await onDeliveryConfirmed(serviceOrder.id, deliveryData);

      // Schedule installation if needed
      if (serviceOrder.finalizationType === 'delivery_installation') {
        const scheduledStart = new Date(`${schedulingData.date}T${schedulingData.startTime}`).toISOString();
        const scheduledEnd = new Date(`${schedulingData.date}T${schedulingData.endTime}`).toISOString();

        await onInstallationScheduled(serviceOrder.id, {
          scheduledStart,
          scheduledEnd,
          teamIds: schedulingData.selectedTeamIds,
          vehicleId: schedulingData.selectedVehicleId || undefined,
          notes: schedulingData.notes
        });
      }

      onClose();
    } catch (error) {
      console.error('Erro ao agendar instalação:', error);
      alert('Erro ao agendar instalação. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkipInstallation = async () => {
    setIsSubmitting(true);

    try {
      // Just confirm delivery
      await onDeliveryConfirmed(serviceOrder.id, deliveryData);
      onClose();
    } catch (error) {
      console.error('Erro ao confirmar entrega:', error);
      alert('Erro ao confirmar entrega. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = productionEmployees.find(emp => emp.id === employeeId);
    return employee?.name || 'Não encontrado';
  };

  const getVehicleName = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.name} (${vehicle.licensePlate})` : 'Veículo não encontrado';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="📦 Confirmação de Entrega e Agendamento de Montagem"
      size="large"
    >
      <div className="space-y-6">
        {/* Service Order Info */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-text-primary dark:text-slate-100">
              📋 Ordem de Serviço
            </h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-text-secondary dark:text-slate-400">OS</p>
                <p className="font-semibold text-text-primary dark:text-slate-100">
                  {serviceOrder.id}
                </p>
              </div>
              <div>
                <p className="text-sm text-text-secondary dark:text-slate-400">Cliente</p>
                <p className="font-semibold text-text-primary dark:text-slate-100">
                  {serviceOrder.clientName}
                </p>
              </div>
              <div>
                <p className="text-sm text-text-secondary dark:text-slate-400">Valor Total</p>
                <p className="font-semibold text-text-primary dark:text-slate-100">
                  R$ {serviceOrder.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
              <div>
                <p className="text-sm text-text-secondary dark:text-slate-400">Tipo de Finalização</p>
                <Badge variant="info">
                  {serviceOrder.finalizationType === 'delivery_installation' ? 'Entrega + Instalação' : 'Apenas Entrega'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 1: Delivery Confirmation */}
        {currentStep === 'delivery' && (
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-text-primary dark:text-slate-100">
                ✅ Confirmação de Entrega
              </h3>
              <p className="text-sm text-text-secondary dark:text-slate-400">
                Complete o checklist e capture a assinatura do cliente
              </p>
            </CardHeader>
            <CardContent>
              {isSubmitting && uploadProgress && (
                <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    <div>
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        Processando confirmação...
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-300">
                        {uploadProgress}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <InteractiveChecklist
                template={checklistTemplate}
                onChecklistComplete={handleChecklistComplete}
                onSkip={() => {
                  handleDeliveryConfirmation({
                    checklistCompleted: false,
                    photos: [],
                    customerSignature: { url: '', timestamp: '' }
                  });
                }}
              />
            </CardContent>
          </Card>
        )}

        {/* Step 2: Installation Scheduling */}
        {currentStep === 'scheduling' && (
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-text-primary dark:text-slate-100">
                🔧 Agendamento de Montagem
              </h3>
              <p className="text-sm text-text-secondary dark:text-slate-400">
                {serviceOrder.finalizationType === 'delivery_installation' 
                  ? 'Configure a instalação para esta OS'
                  : 'Esta OS não requer instalação'
                }
              </p>
            </CardHeader>
            <CardContent>
              {serviceOrder.finalizationType === 'delivery_installation' ? (
                <div className="space-y-4">
                  {/* Date and Time */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      type="date"
                      label="Data da Instalação"
                      value={schedulingData.date}
                      onChange={(e) => setSchedulingData(prev => ({ ...prev, date: e.target.value }))}
                      required
                    />
                    <Input
                      type="time"
                      label="Horário de Início"
                      value={schedulingData.startTime}
                      onChange={(e) => setSchedulingData(prev => ({ ...prev, startTime: e.target.value }))}
                      required
                    />
                    <Input
                      type="time"
                      label="Horário de Fim"
                      value={schedulingData.endTime}
                      onChange={(e) => setSchedulingData(prev => ({ ...prev, endTime: e.target.value }))}
                      required
                    />
                  </div>

                  {/* Team Selection */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-2">
                      👥 Equipe de Instalação (Montadores)
                    </label>
                    <SmartResourceSelector
                      type="employee"
                      selectedIds={schedulingData.selectedTeamIds}
                      onSelectionChange={(ids) => setSchedulingData(prev => ({ ...prev, selectedTeamIds: ids }))}
                      startDate={schedulingData.date}
                      startTime={schedulingData.startTime}
                      endDate={schedulingData.date}
                      endTime={schedulingData.endTime}
                      role="montador"
                      label=""
                      multiple={true}
                      required={true}
                    />
                  </div>

                  {/* Vehicle Selection */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-2">
                      🚚 Veículo (Opcional)
                    </label>
                    <SmartResourceSelector
                      type="vehicle"
                      selectedIds={schedulingData.selectedVehicleId ? [schedulingData.selectedVehicleId] : []}
                      onSelectionChange={(ids) => setSchedulingData(prev => ({ ...prev, selectedVehicleId: ids[0] || '' }))}
                      startDate={schedulingData.date}
                      startTime={schedulingData.startTime}
                      endDate={schedulingData.date}
                      endTime={schedulingData.endTime}
                      label=""
                      multiple={false}
                      required={false}
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-2">
                      📝 Observações
                    </label>
                    <textarea
                      className="w-full p-3 border border-border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-text-primary dark:text-slate-100"
                      rows={3}
                      value={schedulingData.notes}
                      onChange={(e) => setSchedulingData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Observações sobre a instalação..."
                    />
                  </div>

                  {/* Selected Resources Summary */}
                  {(schedulingData.selectedTeamIds.length > 0 || schedulingData.selectedVehicleId) && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <h4 className="font-medium text-text-primary dark:text-slate-100 mb-2">
                        📋 Recursos Selecionados
                      </h4>
                      <div className="space-y-2">
                        {schedulingData.selectedTeamIds.length > 0 && (
                          <div>
                            <p className="text-sm text-text-secondary dark:text-slate-400">Equipe:</p>
                            <div className="flex flex-wrap gap-1">
                              {schedulingData.selectedTeamIds.map(employeeId => (
                                <Badge key={employeeId} variant="secondary" className="text-xs">
                                  {getEmployeeName(employeeId)}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {schedulingData.selectedVehicleId && (
                          <div>
                            <p className="text-sm text-text-secondary dark:text-slate-400">Veículo:</p>
                            <Badge variant="info" className="text-xs">
                              {getVehicleName(schedulingData.selectedVehicleId)}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">📦</div>
                  <p className="text-text-secondary dark:text-slate-400">
                    Esta OS não requer instalação. Apenas a entrega será confirmada.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-border dark:border-slate-700">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${currentStep === 'delivery' ? 'bg-primary' : 'bg-slate-300'}`}></div>
            <span className="text-sm text-text-secondary dark:text-slate-400">Entrega</span>
            <div className={`w-3 h-3 rounded-full ${currentStep === 'scheduling' ? 'bg-primary' : 'bg-slate-300'}`}></div>
            <span className="text-sm text-text-secondary dark:text-slate-400">Agendamento</span>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            
            {currentStep === 'scheduling' && (
              <>
                {serviceOrder.finalizationType === 'delivery_installation' ? (
                  <Button variant="ghost" onClick={handleSkipInstallation} disabled={isSubmitting}>
                    Pular Instalação
                  </Button>
                ) : null}
                <Button 
                  variant="accent" 
                  onClick={handleScheduleInstallation}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Processando...' : 'Confirmar e Agendar'}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default PostDeliverySchedulingModal;