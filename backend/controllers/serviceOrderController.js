const mongoose = require('mongoose');
const ServiceOrder = require('../models/ServiceOrder');
const ActivityLog = require('../models/ActivityLog');
const { createCutPiecesForServiceOrder, shouldCreateCutPieces } = require('../utils/cutPieceHelper');

const buildUserSnapshot = (user) => {
  if (!user) {
    return undefined;
  }

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
};

const ensureChecklistItemId = (item) => ({
  id: typeof item.id === 'string' && item.id.trim().length > 0
    ? item.id
    : new mongoose.Types.ObjectId().toString(),
  text: item.text,
  checked: Boolean(item.checked),
});

// Mapeamento de status de exceção para próximos status padrão
const EXCEPTION_STATUS_RESOLUTION_MAP = {
  'rework_needed': 'finishing',
  'delivery_issue': 'ready_for_logistics',
  'installation_issue': 'awaiting_installation',
  'installation_pending_review': 'completed',
  'quality_issue': 'quality_check',
  'material_shortage': 'pending_production',
  'equipment_failure': 'pending_production',
  'customer_not_available': 'scheduled',
  'weather_delay': 'scheduled',
  'permit_issue': 'awaiting_installation',
  'measurement_error': 'pending_production',
  'design_change': 'pending_production',
};

// Status válidos para resolução
const VALID_RESOLUTION_STATUSES = [
  'pending_production',
  'cutting',
  'finishing',
  'quality_check',
  'ready_for_logistics',
  'scheduled',
  'in_transit',
  'delivered',
  'awaiting_installation',
  'completed',
];

// Status de exceção que podem ser resolvidos
const EXCEPTION_STATUSES = Object.keys(EXCEPTION_STATUS_RESOLUTION_MAP);

// Função genérica para resolver status de exceção
exports.resolveServiceOrderIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const { resolutionDetails, nextStatus } = req.body;

    // Buscar a ServiceOrder pelo campo id personalizado
    const serviceOrder = await ServiceOrder.findOne({ id });
    if (!serviceOrder) {
      return res.status(404).json({
        success: false,
        message: 'Ordem de serviço não encontrada',
      });
    }

    // Verificar se o status atual é um status de exceção
    if (!EXCEPTION_STATUSES.includes(serviceOrder.status)) {
      return res.status(400).json({
        success: false,
        message: `Status atual '${serviceOrder.status}' não é um status de exceção que pode ser resolvido`,
        validExceptionStatuses: EXCEPTION_STATUSES,
      });
    }

    // Registrar status anterior
    const previousStatus = serviceOrder.status;

    // Determinar próximo status
    let resolvedStatus;
    if (nextStatus && VALID_RESOLUTION_STATUSES.includes(nextStatus)) {
      resolvedStatus = nextStatus;
    } else {
      // Usar lógica padrão baseada no mapeamento
      resolvedStatus = EXCEPTION_STATUS_RESOLUTION_MAP[previousStatus];
    }

    // Atualizar status
    serviceOrder.status = resolvedStatus;

    // Adicionar entrada ao history
    serviceOrder.history.push({
      status: resolvedStatus,
      reason: resolutionDetails || `Status de exceção '${previousStatus}' resolvido`,
      user: req.user ? req.user._id : null,
      timestamp: new Date(),
    });

    // Salvar a OS
    await serviceOrder.save();

    // Registrar no ActivityLog
    const activityType = `service_order_${previousStatus}_resolved`;
    await ActivityLog.create({
      serviceOrder: serviceOrder._id,
      action: activityType,
      description: `Status de exceção '${previousStatus}' resolvido para '${resolvedStatus}'${resolutionDetails ? ` - ${resolutionDetails}` : ''}`,
      user: buildUserSnapshot(req.user),
      metadata: {
        previousStatus,
        resolvedStatus,
        resolutionDetails,
        serviceOrderId: serviceOrder._id,
      },
    });

    return res.json({
      success: true,
      message: `Status de exceção '${previousStatus}' resolvido com sucesso`,
      data: {
        serviceOrder,
        previousStatus,
        resolvedStatus,
        resolutionDetails,
      },
    });

  } catch (error) {
    console.error('Erro ao resolver status de exceção:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao resolver status de exceção',
      error: error.message,
    });
  }
};

// Função específica para resolver rework
exports.resolveRework = async (req, res) => {
  try {
    const { id } = req.params;
    const { resolutionDetails, nextStatus } = req.body;

    // Buscar a ServiceOrder pelo campo id personalizado
    const serviceOrder = await ServiceOrder.findOne({ id });
    if (!serviceOrder) {
      return res.status(404).json({
        success: false,
        message: 'Ordem de serviço não encontrada',
      });
    }

    // Verificar se o status atual é 'rework_needed'
    if (serviceOrder.status !== 'rework_needed') {
      return res.status(400).json({
        success: false,
        message: `Status atual '${serviceOrder.status}' não é 'rework_needed'`,
      });
    }

    // Registrar status anterior
    const previousStatus = serviceOrder.status;

    // Determinar próximo status (padrão: finishing)
    const resolvedStatus = nextStatus && VALID_RESOLUTION_STATUSES.includes(nextStatus) 
      ? nextStatus 
      : 'finishing';

    // Atualizar status
    serviceOrder.status = resolvedStatus;

    // Adicionar entrada ao history
    serviceOrder.history.push({
      status: resolvedStatus,
      reason: resolutionDetails || 'Rework concluído e aprovado',
      user: req.user ? req.user._id : null,
      timestamp: new Date(),
    });

    // Salvar a OS
    await serviceOrder.save();

    // Registrar no ActivityLog
    await ActivityLog.create({
      serviceOrder: serviceOrder._id,
      action: 'service_order_rework_resolved',
      description: `Rework resolvido - OS movida para '${resolvedStatus}'${resolutionDetails ? ` - ${resolutionDetails}` : ''}`,
      user: buildUserSnapshot(req.user),
      metadata: {
        previousStatus,
        resolvedStatus,
        resolutionDetails,
        serviceOrderId: serviceOrder._id,
      },
    });

    return res.json({
      success: true,
      message: 'Rework resolvido com sucesso',
      data: {
        serviceOrder,
        previousStatus,
        resolvedStatus,
        resolutionDetails,
      },
    });

  } catch (error) {
    console.error('Erro ao resolver rework:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao resolver rework',
      error: error.message,
    });
  }
};

// Função específica para resolver problemas de entrega
exports.resolveDeliveryIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const { resolutionDetails, nextStatus } = req.body;

    // Buscar a ServiceOrder pelo campo id personalizado
    const serviceOrder = await ServiceOrder.findOne({ id });
    if (!serviceOrder) {
      return res.status(404).json({
        success: false,
        message: 'Ordem de serviço não encontrada',
      });
    }

    // Verificar se o status atual é 'delivery_issue'
    if (serviceOrder.status !== 'delivery_issue') {
      return res.status(400).json({
        success: false,
        message: `Status atual '${serviceOrder.status}' não é 'delivery_issue'`,
      });
    }

    // Registrar status anterior
    const previousStatus = serviceOrder.status;

    // Determinar próximo status (padrão: ready_for_logistics)
    const resolvedStatus = nextStatus && VALID_RESOLUTION_STATUSES.includes(nextStatus) 
      ? nextStatus 
      : 'ready_for_logistics';

    // Atualizar status
    serviceOrder.status = resolvedStatus;

    // Adicionar entrada ao history
    serviceOrder.history.push({
      status: resolvedStatus,
      reason: resolutionDetails || 'Problema de entrega resolvido',
      user: req.user ? req.user._id : null,
      timestamp: new Date(),
    });

    // Salvar a OS
    await serviceOrder.save();

    // Registrar no ActivityLog
    await ActivityLog.create({
      serviceOrder: serviceOrder._id,
      action: 'service_order_delivery_issue_resolved',
      description: `Problema de entrega resolvido - OS movida para '${resolvedStatus}'${resolutionDetails ? ` - ${resolutionDetails}` : ''}`,
      user: buildUserSnapshot(req.user),
      metadata: {
        previousStatus,
        resolvedStatus,
        resolutionDetails,
        serviceOrderId: serviceOrder._id,
      },
    });

    return res.json({
      success: true,
      message: 'Problema de entrega resolvido com sucesso',
      data: {
        serviceOrder,
        previousStatus,
        resolvedStatus,
        resolutionDetails,
      },
    });

  } catch (error) {
    console.error('Erro ao resolver problema de entrega:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao resolver problema de entrega',
      error: error.message,
    });
  }
};

// Função específica para completar revisão de qualidade
exports.completeReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { resolutionDetails, nextStatus } = req.body;

    // Buscar a ServiceOrder pelo campo id personalizado
    const serviceOrder = await ServiceOrder.findOne({ id });
    if (!serviceOrder) {
      return res.status(404).json({
        success: false,
        message: 'Ordem de serviço não encontrada',
      });
    }

    // Verificar se o status atual é 'quality_issue'
    if (serviceOrder.status !== 'quality_issue') {
      return res.status(400).json({
        success: false,
        message: `Status atual '${serviceOrder.status}' não é 'quality_issue'`,
      });
    }

    // Registrar status anterior
    const previousStatus = serviceOrder.status;

    // Determinar próximo status (padrão: ready_for_logistics)
    const resolvedStatus = nextStatus && VALID_RESOLUTION_STATUSES.includes(nextStatus) 
      ? nextStatus 
      : 'ready_for_logistics';

    // Atualizar status
    serviceOrder.status = resolvedStatus;

    // Adicionar entrada ao history
    serviceOrder.history.push({
      status: resolvedStatus,
      reason: resolutionDetails || 'Revisão de qualidade concluída e aprovada',
      user: req.user ? req.user._id : null,
      timestamp: new Date(),
    });

    // Salvar a OS
    await serviceOrder.save();

    // Registrar no ActivityLog
    await ActivityLog.create({
      serviceOrder: serviceOrder._id,
      action: 'service_order_quality_review_completed',
      description: `Revisão de qualidade concluída - OS movida para '${resolvedStatus}'${resolutionDetails ? ` - ${resolutionDetails}` : ''}`,
      user: buildUserSnapshot(req.user),
      metadata: {
        previousStatus,
        resolvedStatus,
        resolutionDetails,
        serviceOrderId: serviceOrder._id,
      },
    });

    return res.json({
      success: true,
      message: 'Revisão de qualidade concluída com sucesso',
      data: {
        serviceOrder,
        previousStatus,
        resolvedStatus,
        resolutionDetails,
      },
    });

  } catch (error) {
    console.error('Erro ao completar revisão de qualidade:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao completar revisão de qualidade',
      error: error.message,
    });
  }
};

// Função para marcar OS para rework
exports.markForRework = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Buscar a ServiceOrder pelo campo id personalizado
    const serviceOrder = await ServiceOrder.findOne({ id });
    if (!serviceOrder) {
      return res.status(404).json({
        success: false,
        message: 'Ordem de serviço não encontrada',
      });
    }

    // Verificar se a OS já está 'completed' ou 'cancelled'
    if (serviceOrder.status === 'completed' || serviceOrder.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: `Status atual '${serviceOrder.status}' não pode ser alterado`,
      });
    }

    // Registrar status anterior
    const previousStatus = serviceOrder.status;

    // Definir novo status
    serviceOrder.status = 'rework_needed';

    // Adicionar entrada ao history
    serviceOrder.history.push({
      status: 'rework_needed',
      reason: reason || 'OS marcada para rework',
      user: req.user ? req.user._id : null,
      timestamp: new Date(),
    });

    // Salvar a OS
    await serviceOrder.save();

    // Registrar no ActivityLog
    await ActivityLog.create({
      serviceOrder: serviceOrder._id,
      action: 'service_order_rework_needed',
      description: `OS marcada para rework - Status alterado de '${previousStatus}' para 'rework_needed'${reason ? ` - ${reason}` : ''}`,
      user: buildUserSnapshot(req.user),
      metadata: {
        previousStatus,
        newStatus: 'rework_needed',
        reason,
        serviceOrderId: serviceOrder._id,
      },
    });

    return res.json({
      success: true,
      message: 'OS marcada para rework com sucesso',
      data: serviceOrder,
    });

  } catch (error) {
    console.error('Erro ao marcar OS para rework:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao marcar OS para rework',
      error: error.message,
    });
  }
};

// Função para reportar problema de entrega
exports.reportDeliveryIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Buscar a ServiceOrder pelo campo id personalizado
    const serviceOrder = await ServiceOrder.findOne({ id });
    if (!serviceOrder) {
      return res.status(404).json({
        success: false,
        message: 'Ordem de serviço não encontrada',
      });
    }

    // Verificar se a OS já está 'completed' ou 'cancelled'
    if (serviceOrder.status === 'completed' || serviceOrder.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: `Status atual '${serviceOrder.status}' não pode ser alterado`,
      });
    }

    // Registrar status anterior
    const previousStatus = serviceOrder.status;

    // Definir novo status
    serviceOrder.status = 'delivery_issue';

    // Adicionar entrada ao history
    serviceOrder.history.push({
      status: 'delivery_issue',
      reason: reason || 'Problema de entrega reportado',
      user: req.user ? req.user._id : null,
      timestamp: new Date(),
    });

    // Salvar a OS
    await serviceOrder.save();

    // Registrar no ActivityLog
    await ActivityLog.create({
      serviceOrder: serviceOrder._id,
      action: 'service_order_delivery_issue',
      description: `Problema de entrega reportado - Status alterado de '${previousStatus}' para 'delivery_issue'${reason ? ` - ${reason}` : ''}`,
      user: buildUserSnapshot(req.user),
      metadata: {
        previousStatus,
        newStatus: 'delivery_issue',
        reason,
        serviceOrderId: serviceOrder._id,
      },
    });

    return res.json({
      success: true,
      message: 'Problema de entrega reportado com sucesso',
      data: serviceOrder,
    });

  } catch (error) {
    console.error('Erro ao reportar problema de entrega:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao reportar problema de entrega',
      error: error.message,
    });
  }
};

// Função para solicitar revisão de instalação
exports.requestInstallationReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Buscar a ServiceOrder pelo campo id personalizado
    const serviceOrder = await ServiceOrder.findOne({ id });
    if (!serviceOrder) {
      return res.status(404).json({
        success: false,
        message: 'Ordem de serviço não encontrada',
      });
    }

    // Verificar se a OS já está 'completed' ou 'cancelled'
    if (serviceOrder.status === 'completed' || serviceOrder.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: `Status atual '${serviceOrder.status}' não pode ser alterado`,
      });
    }

    // Registrar status anterior
    const previousStatus = serviceOrder.status;

    // Definir novo status
    serviceOrder.status = 'installation_pending_review';

    // Adicionar entrada ao history
    serviceOrder.history.push({
      status: 'installation_pending_review',
      reason: reason || 'Revisão de instalação solicitada',
      user: req.user ? req.user._id : null,
      timestamp: new Date(),
    });

    // Salvar a OS
    await serviceOrder.save();

    // Registrar no ActivityLog
    await ActivityLog.create({
      serviceOrder: serviceOrder._id,
      action: 'service_order_issue_resolved',
      description: `Revisão de instalação solicitada - Status alterado de '${previousStatus}' para 'installation_pending_review'${reason ? ` - ${reason}` : ''}`,
      user: buildUserSnapshot(req.user),
      metadata: {
        previousStatus,
        newStatus: 'installation_pending_review',
        reason,
        serviceOrderId: serviceOrder._id,
      },
    });

    return res.json({
      success: true,
      message: 'Revisão de instalação solicitada com sucesso',
      data: serviceOrder,
    });

  } catch (error) {
    console.error('Erro ao solicitar revisão de instalação:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao solicitar revisão de instalação',
      error: error.message,
    });
  }
};

exports.updateDepartureChecklist = async (req, res) => {
  try {
    const { id } = req.params;
    const { checklist } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID inválido para ordem de serviço',
      });
    }

    const serviceOrder = await ServiceOrder.findById(id);

    if (!serviceOrder) {
      return res.status(404).json({
        success: false,
        message: 'Ordem de serviço não encontrada',
      });
    }

    const previousChecklist = Array.isArray(serviceOrder.departureChecklist)
      ? serviceOrder.departureChecklist.map(item => ({ ...item }))
      : [];

    const normalizedChecklist = Array.isArray(checklist)
      ? checklist.map(ensureChecklistItemId)
      : [];

    serviceOrder.departureChecklist = normalizedChecklist;
    await serviceOrder.save();

    const previousCheckedMap = new Map(previousChecklist.map(item => [item.id, Boolean(item.checked)]));
    const newlyCompleted = normalizedChecklist.filter(item => item.checked && !previousCheckedMap.get(item.id));
    const totalCompleted = normalizedChecklist.filter(item => item.checked).length;

    const descriptionParts = [
      `Checklist atualizado (${totalCompleted}/${normalizedChecklist.length} itens concluídos)`,
    ];

    if (newlyCompleted.length > 0) {
      descriptionParts.push(`Itens concluídos: ${newlyCompleted.map(item => item.text).join(', ')}`);
    }

    await ActivityLog.create({
      serviceOrder: serviceOrder._id,
      action: newlyCompleted.length > 0
        ? 'service_order_checklist_item_checked'
        : 'service_order_checklist_update',
      description: descriptionParts.join(' | '),
      user: buildUserSnapshot(req.user),
      metadata: {
        totalItems: normalizedChecklist.length,
        totalCompleted,
        newlyCompleted: newlyCompleted.map(item => ({ id: item.id, text: item.text })),
      },
    });

    return res.json({
      success: true,
      message: 'Checklist atualizado com sucesso',
      data: serviceOrder,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao atualizar checklist da ordem de serviço',
      error: error.message,
    });
  }
};

// Criar ServiceOrder
exports.createServiceOrder = async (req, res) => {
  try {
    const serviceOrderData = req.body;
    
    // Criar a ServiceOrder
    const serviceOrder = await ServiceOrder.create(serviceOrderData);
    
    console.log(`✅ ServiceOrder criada: ${serviceOrder.id} com status: ${serviceOrder.status}`);
    
    // Verificar se deve criar CutPieces
    if (shouldCreateCutPieces(serviceOrder, serviceOrder.status)) {
      try {
        const cutPieces = await createCutPiecesForServiceOrder(serviceOrder.id, serviceOrder.allocatedSlabId);
        console.log(`🎯 ${cutPieces.length} CutPieces criadas automaticamente para ${serviceOrder.id}`);
      } catch (cutPieceError) {
        console.error(`⚠️ Erro ao criar CutPieces para ${serviceOrder.id}:`, cutPieceError.message);
        // Não falha a criação da ServiceOrder se CutPieces falharem
      }
    }
    
    // Registrar no ActivityLog
    await ActivityLog.create({
      serviceOrder: serviceOrder._id,
      action: 'service_order_created',
      description: `ServiceOrder ${serviceOrder.id} criada com status '${serviceOrder.status}'`,
      user: buildUserSnapshot(req.user),
      metadata: {
        serviceOrderId: serviceOrder.id,
        status: serviceOrder.status,
        clientName: serviceOrder.clientName
      }
    });
    
    return res.status(201).json({
      success: true,
      message: 'ServiceOrder criada com sucesso',
      data: serviceOrder
    });
    
  } catch (error) {
    console.error('Erro ao criar ServiceOrder:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao criar ServiceOrder',
      error: error.message
    });
  }
};

// Atualizar status da ServiceOrder
exports.updateServiceOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, allocatedSlabId } = req.body;
    
    const serviceOrder = await ServiceOrder.findOne({ id });
    if (!serviceOrder) {
      return res.status(404).json({
        success: false,
        message: 'ServiceOrder não encontrada'
      });
    }
    
    const previousStatus = serviceOrder.status;
    
    // Atualizar status e allocatedSlabId se fornecido
    const updateData = { status };
    if (allocatedSlabId) {
      updateData.allocatedSlabId = allocatedSlabId;
    }
    
    const updatedServiceOrder = await ServiceOrder.findByIdAndUpdate(
      serviceOrder._id,
      updateData,
      { new: true, runValidators: true }
    );
    
    console.log(`📝 ServiceOrder ${id} status atualizado: ${previousStatus} → ${status}`);
    
    // Verificar se deve criar CutPieces após mudança de status
    if (shouldCreateCutPieces(updatedServiceOrder, status)) {
      try {
        const cutPieces = await createCutPiecesForServiceOrder(id, updatedServiceOrder.allocatedSlabId);
        console.log(`🎯 ${cutPieces.length} CutPieces criadas após mudança de status para ${id}`);
      } catch (cutPieceError) {
        console.error(`⚠️ Erro ao criar CutPieces para ${id}:`, cutPieceError.message);
        // Não falha a atualização se CutPieces falharem
      }
    }
    
    // Registrar no ActivityLog
    await ActivityLog.create({
      serviceOrder: serviceOrder._id,
      action: 'service_order_status_updated',
      description: `Status da ServiceOrder ${id} alterado de '${previousStatus}' para '${status}'`,
      user: buildUserSnapshot(req.user),
      metadata: {
        serviceOrderId: id,
        previousStatus,
        newStatus: status,
        allocatedSlabId: updatedServiceOrder.allocatedSlabId
      }
    });
    
    return res.json({
      success: true,
      message: 'Status da ServiceOrder atualizado com sucesso',
      data: updatedServiceOrder
    });
    
  } catch (error) {
    console.error('Erro ao atualizar status da ServiceOrder:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao atualizar status da ServiceOrder',
      error: error.message
    });
  }
};

// Confirmar dados de entrega/instalação
exports.confirmDeliveryData = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      checklistItems, 
      photoUrls, 
      signatureUrl, 
      signatoryName, 
      signatoryDocument 
    } = req.body;

    console.log(`📋 Confirmando dados de entrega para ServiceOrder ${id}`);

    // Buscar a ServiceOrder pelo campo id personalizado
    const serviceOrder = await ServiceOrder.findOne({ id });
    if (!serviceOrder) {
      return res.status(404).json({
        success: false,
        message: 'Ordem de serviço não encontrada',
      });
    }

    // Verificar se a ServiceOrder está em status adequado para confirmação
    const validStatuses = ['in_transit', 'delivered', 'in_installation'];
    const isValidStatus = validStatuses.includes(serviceOrder.logisticsStatus);
    const isValidGeneralStatus = serviceOrder.status === 'in_transit' || serviceOrder.status === 'delivered' || serviceOrder.status === 'awaiting_installation';
    
    if (!isValidStatus && !isValidGeneralStatus) {
      return res.status(400).json({
        success: false,
        message: `ServiceOrder não está em status adequado para confirmação. Status atual: ${serviceOrder.status}, Logistics Status: ${serviceOrder.logisticsStatus}`,
        validStatuses: validStatuses
      });
    }

    // Registrar dados anteriores para o ActivityLog
    const previousData = {
      delivery_confirmed: serviceOrder.delivery_confirmed,
      confirmationPhotos: serviceOrder.confirmationPhotos?.length || 0,
      customerSignature: serviceOrder.customerSignature ? 'existe' : 'não existe'
    };

    // Atualizar checklist de saída se fornecido
    if (checklistItems && Array.isArray(checklistItems)) {
      console.log(`📝 Atualizando checklist de saída com ${checklistItems.length} itens`);
      serviceOrder.departureChecklist = checklistItems.map(item => ensureChecklistItemId(item));
    }

    // Atualizar fotos de confirmação se fornecidas
    if (photoUrls && Array.isArray(photoUrls)) {
      console.log(`📸 Adicionando ${photoUrls.length} fotos de confirmação`);
      serviceOrder.confirmationPhotos = photoUrls.map(photo => ({
        url: photo.url,
        description: photo.description || ''
      }));
    }

    // Atualizar assinatura do cliente se fornecida
    if (signatureUrl) {
      console.log(`✍️ Adicionando assinatura do cliente`);
      serviceOrder.customerSignature = {
        url: signatureUrl,
        timestamp: new Date(),
        name: signatoryName || '',
        documentNumber: signatoryDocument || ''
      };
    }

    // Marcar entrega como confirmada
    serviceOrder.delivery_confirmed = true;
    console.log(`✅ Entrega marcada como confirmada`);

    // Determinar próximo status baseado no finalizationType
    let nextStatus;
    if (serviceOrder.finalizationType === 'pickup') {
      nextStatus = 'completed';
      serviceOrder.logisticsStatus = 'picked_up';
      console.log(`📦 Finalização por retirada - marcando como concluído`);
    } else if (serviceOrder.finalizationType === 'delivery_only') {
      nextStatus = 'completed';
      serviceOrder.logisticsStatus = 'delivered';
      console.log(`🚚 Finalização apenas entrega - marcando como concluído`);
    } else if (serviceOrder.finalizationType === 'delivery_installation') {
      nextStatus = 'awaiting_installation';
      serviceOrder.logisticsStatus = 'in_installation';
      console.log(`🔧 Finalização com instalação - aguardando instalação`);
    } else {
      // Fallback baseado no requiresInstallation
      if (serviceOrder.requiresInstallation) {
        nextStatus = 'awaiting_installation';
        serviceOrder.logisticsStatus = 'in_installation';
        console.log(`🔧 Instalação necessária - aguardando instalação`);
      } else {
        nextStatus = 'completed';
        serviceOrder.logisticsStatus = 'delivered';
        console.log(`✅ Sem instalação - marcando como concluído`);
      }
    }

    // Atualizar status geral
    serviceOrder.status = nextStatus;

    // Adicionar entrada ao history
    serviceOrder.history.push({
      status: nextStatus,
      reason: 'Confirmação de entrega realizada',
      user: req.user._id,
      timestamp: new Date()
    });

    // Salvar a ServiceOrder
    const updatedServiceOrder = await serviceOrder.save();
    console.log(`💾 ServiceOrder ${id} atualizada com sucesso`);

    // Registrar no ActivityLog
    await ActivityLog.create({
      serviceOrder: serviceOrder._id,
      action: 'delivery_confirmation_completed',
      description: `Confirmação de entrega realizada para ServiceOrder ${id}`,
      user: buildUserSnapshot(req.user),
      metadata: {
        serviceOrderId: id,
        previousData,
        newData: {
          delivery_confirmed: updatedServiceOrder.delivery_confirmed,
          confirmationPhotos: updatedServiceOrder.confirmationPhotos?.length || 0,
          customerSignature: updatedServiceOrder.customerSignature ? 'existe' : 'não existe',
          newStatus: nextStatus,
          finalizationType: serviceOrder.finalizationType,
          requiresInstallation: serviceOrder.requiresInstallation
        }
      }
    });

    console.log(`📊 ActivityLog registrado para ServiceOrder ${id}`);

    return res.json({
      success: true,
      message: 'Dados de confirmação de entrega salvos com sucesso',
      data: {
        id: updatedServiceOrder.id,
        status: updatedServiceOrder.status,
        logisticsStatus: updatedServiceOrder.logisticsStatus,
        delivery_confirmed: updatedServiceOrder.delivery_confirmed,
        confirmationPhotos: updatedServiceOrder.confirmationPhotos,
        customerSignature: updatedServiceOrder.customerSignature,
        departureChecklist: updatedServiceOrder.departureChecklist,
        finalizationType: updatedServiceOrder.finalizationType,
        requiresInstallation: updatedServiceOrder.requiresInstallation
      }
    });

  } catch (error) {
    console.error('Erro ao confirmar dados de entrega:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao confirmar dados de entrega',
      error: error.message
    });
  }
};
