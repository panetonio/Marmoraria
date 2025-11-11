const ServiceOrder = require('../models/ServiceOrder');
const Order = require('../models/Order');
const { createCutPiecesForServiceOrder } = require('../utils/cutPieceHelper');
const ActivityLog = require('../models/ActivityLog');
const mongoose = require('mongoose');

/**
 * Gera um ID único para a Service Order
 * Formato: OS-YYYYMMDD-HHMMSS-XXX
 */
const generateServiceOrderId = async () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  // Gerar número aleatório de 3 dígitos
  const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  
  const id = `OS-${year}${month}${day}-${hours}${minutes}${seconds}-${random}`;
  
  // Verificar se o ID já existe
  const existing = await ServiceOrder.findOne({ id });
  if (existing) {
    // Se existir, tentar novamente (recursivamente até 10 tentativas)
    const maxRetries = 10;
    for (let i = 0; i < maxRetries; i++) {
      const newRandom = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
      const newId = `OS-${year}${month}${day}-${hours}${minutes}${seconds}-${newRandom}`;
      const existingNew = await ServiceOrder.findOne({ id: newId });
      if (!existingNew) {
        return newId;
      }
    }
    // Se ainda não conseguiu, usar timestamp completo
    return `OS-${year}${month}${day}-${hours}${minutes}${seconds}-${Date.now() % 1000}`;
  }
  
  return id;
};

/**
 * Obter todas as Service Orders
 */
exports.getAllServiceOrders = async (req, res) => {
  try {
    const serviceOrders = await ServiceOrder.find()
      .populate('orderId', 'id clientName')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: serviceOrders,
    });
  } catch (error) {
    console.error('Erro ao buscar ServiceOrders:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar ServiceOrders',
      error: error.message,
    });
  }
};

/**
 * Criar uma nova Service Order
 */
exports.createServiceOrder = async (req, res) => {
  try {
    const serviceOrderData = req.body;
    
    console.log('📋 Dados recebidos para criar ServiceOrder:', JSON.stringify(serviceOrderData, null, 2));
    
    // Validação de campos obrigatórios
    const requiredFields = ['orderId', 'clientName', 'deliveryAddress', 'items', 'total', 'deliveryDate'];
    const missingFields = requiredFields.filter(field => !serviceOrderData[field]);
    
    if (missingFields.length > 0) {
      console.error('❌ Campos obrigatórios faltando:', missingFields);
      return res.status(400).json({
        success: false,
        message: `Campos obrigatórios faltando: ${missingFields.join(', ')}`,
      });
    }
    
    // Validar que items é um array não vazio
    if (!Array.isArray(serviceOrderData.items) || serviceOrderData.items.length === 0) {
      console.error('❌ Items deve ser um array não vazio');
      return res.status(400).json({
        success: false,
        message: 'Items deve ser um array não vazio',
      });
    }
    
    // Converter orderId para ObjectId se for string (fazer antes de gerar IDs dos itens)
    let orderIdString = serviceOrderData.orderId;
    if (typeof serviceOrderData.orderId === 'string') {
      try {
        serviceOrderData.orderId = new mongoose.Types.ObjectId(serviceOrderData.orderId);
        orderIdString = serviceOrderData.orderId.toString();
        console.log('🔄 orderId convertido para ObjectId:', serviceOrderData.orderId);
      } catch (error) {
        console.error('❌ Erro ao converter orderId para ObjectId:', error);
        return res.status(400).json({
          success: false,
          message: 'orderId inválido',
        });
      }
    } else {
      orderIdString = serviceOrderData.orderId?.toString() || 'temp';
    }
    
    // Garantir que todos os itens tenham IDs válidos e campos numéricos tenham valores padrão
    serviceOrderData.items = serviceOrderData.items.map((item, index) => {
      // Gerar ID se necessário
      if (!item.id || item.id === undefined || item.id === null || item.id === '') {
        const generatedId = `item-${orderIdString}-${Date.now()}-${index}`;
        console.warn(`⚠️ Item sem ID encontrado! Gerando ID no backend: ${generatedId}`, item);
        item.id = generatedId;
      }
      
      // Garantir valores padrão para campos numéricos que podem ser undefined
      const normalizedItem = {
        ...item,
        discount: item.discount ?? 0,
        quantity: item.quantity ?? 0,
        unitPrice: item.unitPrice ?? 0,
        totalPrice: item.totalPrice ?? 0,
      };
      
      return normalizedItem;
    });
    
    console.log('✅ Todos os itens têm IDs válidos:', serviceOrderData.items.map(item => ({ id: item.id, description: item.description })));
    
    // Verificar se já existe OS ativa com os mesmos itens
    const incomingItemIds = Array.from(new Set(serviceOrderData.items.map(item => item.id).filter(Boolean)));
    if (incomingItemIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum item válido informado para a Ordem de Serviço.',
      });
    }

    const existingOrders = await ServiceOrder.find({
      orderId: serviceOrderData.orderId,
      status: { $ne: 'cancelled' },
      'items.id': { $in: incomingItemIds },
    }).lean();

    if (existingOrders.length > 0) {
      const conflicts = new Set<string>();
      existingOrders.forEach(existing => {
        existing.items?.forEach(existingItem => {
          if (incomingItemIds.includes(existingItem.id)) {
            conflicts.add(existingItem.description || existingItem.id);
          }
        });
      });

      const conflictList = Array.from(conflicts);
      const conflictMessage = conflictList.length === 1
        ? `O item "${conflictList[0]}" já possui uma OS em andamento.`
        : `Os itens ${conflictList.slice(0, 3).map(name => `"${name}"`).join(', ')} já possuem OS em andamento.`;

      return res.status(409).json({
        success: false,
        message: `${conflictMessage} Utilize a OS existente ou finalize-a antes de criar outra.`,
      });
    }
    
    // Gerar ID único se não fornecido (verificação robusta)
    if (!serviceOrderData.id || serviceOrderData.id === '' || serviceOrderData.id === null || serviceOrderData.id === undefined) {
      try {
        serviceOrderData.id = await generateServiceOrderId();
        console.log('🆔 ID gerado automaticamente:', serviceOrderData.id);
      } catch (error) {
        console.error('❌ Erro ao gerar ID:', error);
        // Fallback: ID usando timestamp
        const now = new Date();
        const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}${Date.now() % 10000}`;
        serviceOrderData.id = `OS-${timestamp}`;
        console.log('🆔 ID de fallback gerado:', serviceOrderData.id);
      }
    }
    
    // Garantir que cada item do departureChecklist tenha um ID único
    if (serviceOrderData.departureChecklist && Array.isArray(serviceOrderData.departureChecklist)) {
      serviceOrderData.departureChecklist = serviceOrderData.departureChecklist.map((item, index) => ({
        ...item,
        id: item.id || `checklist-${Date.now()}-${index}`,
      }));
    }
    
    console.log('✅ Dados validados, criando ServiceOrder...');
    console.log('📋 Estrutura final dos dados:', {
      id: serviceOrderData.id,
      orderId: serviceOrderData.orderId,
      clientName: serviceOrderData.clientName,
      itemsCount: serviceOrderData.items?.length,
      items: serviceOrderData.items?.map(item => ({
        id: item.id,
        type: item.type,
        description: item.description,
        hasCategory: !!item.category,
        hasQuantity: typeof item.quantity !== 'undefined',
        hasTotalPrice: typeof item.totalPrice !== 'undefined',
      })),
      total: serviceOrderData.total,
      deliveryDate: serviceOrderData.deliveryDate,
    });
    
    // VALIDAÇÃO FINAL: Garantir que o ID existe antes de criar
    if (!serviceOrderData.id || serviceOrderData.id === '' || serviceOrderData.id === null || serviceOrderData.id === undefined) {
      console.error('❌ ERRO CRÍTICO: ID não encontrado após todas as validações! Gerando ID de emergência...');
      try {
        serviceOrderData.id = await generateServiceOrderId();
        console.log('🆔 ID de emergência gerado:', serviceOrderData.id);
      } catch (error) {
        console.error('❌ Erro ao gerar ID de emergência:', error);
        // Fallback final: ID usando timestamp
        const now = new Date();
        const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}${Date.now() % 10000}`;
        serviceOrderData.id = `OS-${timestamp}`;
        console.log('🆔 ID de fallback final gerado:', serviceOrderData.id);
      }
    }
    
    // VALIDAÇÃO EXPLÍCITA: Lançar erro se ID ainda não existir
    if (!serviceOrderData.id || serviceOrderData.id === '' || serviceOrderData.id === null || serviceOrderData.id === undefined) {
      const errorMsg = 'Não foi possível gerar ID para a ServiceOrder após todas as tentativas';
      console.error('❌', errorMsg);
      return res.status(500).json({
        success: false,
        message: errorMsg,
        error: errorMsg,
      });
    }
    
    console.log('🔍 ID final antes de criar:', serviceOrderData.id);
    
    // GARANTIR que o ID seja sempre uma string válida não vazia
    let finalId = serviceOrderData.id;
    if (typeof finalId !== 'string' || finalId.trim() === '') {
      console.error('❌ ID inválido detectado, convertendo para string:', finalId);
      finalId = String(finalId || '').trim();
      if (finalId === '') {
        // Último fallback: gerar ID usando timestamp
        const now = new Date();
        const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}${Date.now() % 10000}`;
        finalId = `OS-${timestamp}`;
        console.error('🆔 ID de fallback crítico gerado:', finalId);
      }
    }
    
    // Validar que o ID tem pelo menos 3 caracteres
    if (finalId.length < 3) {
      console.error('❌ ID muito curto, gerando novo:', finalId);
      const now = new Date();
      const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}${Date.now() % 10000}`;
      finalId = `OS-${timestamp}`;
    }
    
    console.log('🔍 ID final validado:', {
      id: finalId,
      length: finalId.length,
      type: typeof finalId,
      isString: typeof finalId === 'string',
      isEmpty: finalId.trim() === '',
    });
    
    // Criar objeto novo com todos os campos garantidos, incluindo id explícito
    // Remover campos undefined antes de criar
    const serviceOrderToCreate = {
      id: finalId, // ID garantido como string válida
      orderId: serviceOrderData.orderId,
      clientName: serviceOrderData.clientName,
      deliveryAddress: serviceOrderData.deliveryAddress,
      items: serviceOrderData.items,
      total: serviceOrderData.total,
      deliveryDate: serviceOrderData.deliveryDate,
    };
    
    // Adicionar campos opcionais apenas se não forem undefined
    if (serviceOrderData.assignedToIds !== undefined) {
      serviceOrderToCreate.assignedToIds = serviceOrderData.assignedToIds;
    }
    if (serviceOrderData.productionStatus !== undefined) {
      serviceOrderToCreate.productionStatus = serviceOrderData.productionStatus;
    }
    if (serviceOrderData.logisticsStatus !== undefined) {
      serviceOrderToCreate.logisticsStatus = serviceOrderData.logisticsStatus;
    }
    if (serviceOrderData.isFinalized !== undefined) {
      serviceOrderToCreate.isFinalized = serviceOrderData.isFinalized;
    }
    if (serviceOrderData.departureChecklist !== undefined) {
      serviceOrderToCreate.departureChecklist = serviceOrderData.departureChecklist;
    }
    if (serviceOrderData.allocatedSlabId !== undefined) {
      serviceOrderToCreate.allocatedSlabId = serviceOrderData.allocatedSlabId;
    }
    if (serviceOrderData.priority !== undefined) {
      serviceOrderToCreate.priority = serviceOrderData.priority;
    }
    if (serviceOrderData.requiresInstallation !== undefined) {
      serviceOrderToCreate.requiresInstallation = serviceOrderData.requiresInstallation;
    }
    if (serviceOrderData.finalizationType !== undefined) {
      serviceOrderToCreate.finalizationType = serviceOrderData.finalizationType;
    }
    if (serviceOrderData.observations !== undefined) {
      serviceOrderToCreate.observations = serviceOrderData.observations;
    }
    
    // LOG DETALHADO: Objeto completo que será enviado ao Mongoose
    console.log('📋 OBJETO COMPLETO QUE SERÁ ENVIADO AO MONGOOSE:');
    console.log(JSON.stringify(serviceOrderToCreate, null, 2));
    console.log('🔍 Verificação do campo ID no objeto:');
    console.log('  - id existe?', 'id' in serviceOrderToCreate);
    console.log('  - id valor:', serviceOrderToCreate.id);
    console.log('  - id tipo:', typeof serviceOrderToCreate.id);
    console.log('  - id é string?', typeof serviceOrderToCreate.id === 'string');
    console.log('  - id não vazio?', serviceOrderToCreate.id && serviceOrderToCreate.id.trim() !== '');
    
    // Criar a Service Order usando o novo objeto
    const serviceOrder = await ServiceOrder.create(serviceOrderToCreate);
    
    console.log('✅ ServiceOrder criada com sucesso:', serviceOrder.id);
    
    // Atualizar o Order com o ID da Service Order
    // Usar _id (ObjectId) em vez de id (string) para a referência
    try {
      await Order.findByIdAndUpdate(
        serviceOrderData.orderId,
        {
          $push: { serviceOrderIds: serviceOrder._id },
        }
      );
      console.log('✅ Order atualizada com ServiceOrder ID');
    } catch (error) {
      console.error('⚠️  Erro ao atualizar Order:', error.message);
      // Não falhar a criação da OS se não conseguir atualizar o Order
    }
    
    // Criar CutPieces automaticamente se houver items E allocatedSlabId
    if (serviceOrder.items && serviceOrder.items.length > 0 && serviceOrderData.allocatedSlabId) {
      try {
        await createCutPiecesForServiceOrder(serviceOrder.id, serviceOrderData.allocatedSlabId);
        console.log('✅ CutPieces criadas automaticamente');
      } catch (error) {
        console.error('⚠️  Erro ao criar CutPieces:', error.message);
        // Não falhar a criação da OS se não conseguir criar CutPieces
      }
    } else if (serviceOrder.items && serviceOrder.items.length > 0 && !serviceOrderData.allocatedSlabId) {
      console.log('ℹ️  CutPieces não serão criadas: allocatedSlabId não fornecido');
    }
    
    // Registrar no log de atividades
    try {
      await ActivityLog.create({
        serviceOrder: serviceOrder._id,
        action: 'service_order_created',
        description: `Criou a OS ${serviceOrder.id} para o cliente ${serviceOrder.clientName}`,
        user: req.user ? {
          id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
        } : undefined,
      });
    } catch (error) {
      console.error('⚠️  Erro ao registrar log de atividade:', error.message);
    }
    
    res.status(201).json({
      success: true,
      message: 'ServiceOrder criada com sucesso',
      data: serviceOrder,
    });
  } catch (error) {
    console.error('❌ Erro ao criar ServiceOrder:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
      keyPattern: error.keyPattern,
    });
    
    // Tratamento específico de erros
    if (error.name === 'ValidationError') {
      const errors = {};
      const missingFields = [];
      
      Object.keys(error.errors || {}).forEach(key => {
        const errorObj = error.errors[key];
        errors[key] = errorObj.message;
        
        // Detectar campos obrigatórios faltando
        if (errorObj.kind === 'required' || errorObj.message.includes('required')) {
          missingFields.push(key);
        }
      });
      
      console.error('❌ Erro de validação do Mongoose:', errors);
      console.error('❌ Campos obrigatórios faltando:', missingFields);
      
      // Mensagem mais específica se houver campos obrigatórios faltando
      let errorMessage = 'Erro de validação';
      if (missingFields.length > 0) {
        errorMessage = `Campos obrigatórios faltando: ${missingFields.join(', ')}`;
      }
      
      return res.status(400).json({
        success: false,
        message: errorMessage,
        errors: Object.values(errors),
        details: errors,
        missingFields: missingFields.length > 0 ? missingFields : undefined,
      });
    }
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field} já existe`,
      });
    }
    
    // Erro de cast (ID inválido)
    if (error.name === 'CastError') {
      console.error('❌ Erro de cast:', error.path, error.value);
      return res.status(400).json({
        success: false,
        message: `Campo ${error.path} inválido: ${error.value}`,
        error: error.message,
      });
    }
    
    // Log detalhado do erro antes de retornar
    console.error('❌ Erro genérico ao criar ServiceOrder:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 5).join('\n'), // Primeiras 5 linhas do stack
    });
    
    res.status(500).json({
      success: false,
      message: error.message || 'Erro interno ao criar ServiceOrder',
      error: error.message,
      errorType: error.name,
    });
  }
};

/**
 * Atualizar status da Service Order
 */
exports.updateServiceOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, allocatedSlabId } = req.body;
    
    // Buscar ServiceOrder atual para obter o status anterior
    const previousServiceOrder = await ServiceOrder.findOne({ id });
    if (!previousServiceOrder) {
      return res.status(404).json({
        success: false,
        message: 'ServiceOrder não encontrada',
      });
    }
    
    const previousStatus = previousServiceOrder.status;
    
    const updateData = { status };
    if (allocatedSlabId) {
      updateData.allocatedSlabId = allocatedSlabId;
    }
    
    const serviceOrder = await ServiceOrder.findOneAndUpdate(
      { id },
      updateData,
      { new: true, runValidators: true }
    );
    
    // Registrar no log de atividades
    try {
      await ActivityLog.create({
        serviceOrder: serviceOrder._id,
        action: 'service_order_status_updated',
        description: `Atualizou o status da OS ${serviceOrder.id} de ${previousStatus || 'indefinido'} para ${status}`,
        previousStatus: previousStatus,
        newStatus: status,
        user: req.user ? {
          id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
        } : undefined,
      });
    } catch (error) {
      console.error('Erro ao registrar log:', error);
    }
    
    res.json({
      success: true,
      message: 'Status atualizado com sucesso',
      data: serviceOrder,
    });
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar status',
      error: error.message,
    });
  }
};

/**
 * Atualizar Service Order completa
 */
exports.updateServiceOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Remover campos que não devem ser atualizados
    delete updateData._id;
    delete updateData.id;
    delete updateData.createdAt;
    
    const serviceOrder = await ServiceOrder.findOneAndUpdate(
      { id },
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!serviceOrder) {
      return res.status(404).json({
        success: false,
        message: 'ServiceOrder não encontrada',
      });
    }
    
    res.json({
      success: true,
      message: 'ServiceOrder atualizada com sucesso',
      data: serviceOrder,
    });
  } catch (error) {
    console.error('Erro ao atualizar ServiceOrder:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar ServiceOrder',
      error: error.message,
    });
  }
};

/**
 * Atualizar checklist de partida
 */
exports.updateDepartureChecklist = async (req, res) => {
  try {
    const { id } = req.params;
    const { departureChecklist } = req.body;
    
    const serviceOrder = await ServiceOrder.findOneAndUpdate(
      { id },
      { departureChecklist },
      { new: true, runValidators: true }
    );
    
    if (!serviceOrder) {
      return res.status(404).json({
        success: false,
        message: 'ServiceOrder não encontrada',
      });
    }
    
    res.json({
      success: true,
      message: 'Checklist atualizado com sucesso',
      data: serviceOrder,
    });
  } catch (error) {
    console.error('Erro ao atualizar checklist:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar checklist',
      error: error.message,
    });
  }
};

/**
 * Marcar para retrabalho
 */
exports.markForRework = async (req, res) => {
  try {
    const { id } = req.params;
    const { reworkReason } = req.body;
    
    const serviceOrder = await ServiceOrder.findOneAndUpdate(
      { id },
      {
        status: 'retrabalho',
        reworkReason,
      },
      { new: true }
    );
    
    if (!serviceOrder) {
      return res.status(404).json({
        success: false,
        message: 'ServiceOrder não encontrada',
      });
    }
    
    res.json({
      success: true,
      message: 'ServiceOrder marcada para retrabalho',
      data: serviceOrder,
    });
  } catch (error) {
    console.error('Erro ao marcar para retrabalho:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao marcar para retrabalho',
      error: error.message,
    });
  }
};

/**
 * Reportar problema na entrega
 */
exports.reportDeliveryIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const { issueType, issueDescription, reportedBy, reportedAt } = req.body;
    
    const serviceOrder = await ServiceOrder.findOneAndUpdate(
      { id },
      {
        status: 'problema_entrega',
        deliveryIssue: {
          type: issueType,
          description: issueDescription,
          reportedBy,
          reportedAt: reportedAt || new Date(),
        },
      },
      { new: true }
    );
    
    if (!serviceOrder) {
      return res.status(404).json({
        success: false,
        message: 'ServiceOrder não encontrada',
      });
    }
    
    res.json({
      success: true,
      message: 'Problema reportado com sucesso',
      data: serviceOrder,
    });
  } catch (error) {
    console.error('Erro ao reportar problema:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao reportar problema',
      error: error.message,
    });
  }
};

/**
 * Solicitar vistoria de instalação
 */
exports.requestInstallationReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewNotes } = req.body;
    
    const serviceOrder = await ServiceOrder.findOneAndUpdate(
      { id },
      {
        status: 'aguardando_vistoria',
        installationReview: {
          requestedAt: new Date(),
          notes: reviewNotes,
        },
      },
      { new: true }
    );
    
    if (!serviceOrder) {
      return res.status(404).json({
        success: false,
        message: 'ServiceOrder não encontrada',
      });
    }
    
    res.json({
      success: true,
      message: 'Vistoria solicitada com sucesso',
      data: serviceOrder,
    });
  } catch (error) {
    console.error('Erro ao solicitar vistoria:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao solicitar vistoria',
      error: error.message,
    });
  }
};

/**
 * Resolver problema geral da OS
 */
exports.resolveServiceOrderIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution, resolvedBy } = req.body;
    
    const serviceOrder = await ServiceOrder.findOne({ id });
    
    if (!serviceOrder) {
      return res.status(404).json({
        success: false,
        message: 'ServiceOrder não encontrada',
      });
    }
    
    // Determinar o próximo status baseado no status atual
    let nextStatus = 'em_producao';
    if (serviceOrder.status === 'aguardando_vistoria') {
      nextStatus = 'pronto_entrega';
    } else if (serviceOrder.status === 'problema_entrega') {
      nextStatus = 'entregue';
    }
    
    serviceOrder.status = nextStatus;
    serviceOrder.issueResolution = {
      resolution,
      resolvedBy,
      resolvedAt: new Date(),
    };
    
    await serviceOrder.save();
    
    res.json({
      success: true,
      message: 'Problema resolvido com sucesso',
      data: serviceOrder,
    });
  } catch (error) {
    console.error('Erro ao resolver problema:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao resolver problema',
      error: error.message,
    });
  }
};

/**
 * Resolver retrabalho
 */
exports.resolveRework = async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution, resolvedBy } = req.body;
    
    const serviceOrder = await ServiceOrder.findOneAndUpdate(
      { id },
      {
        status: 'em_producao',
        reworkResolution: {
          resolution,
          resolvedBy,
          resolvedAt: new Date(),
        },
      },
      { new: true }
    );
    
    if (!serviceOrder) {
      return res.status(404).json({
        success: false,
        message: 'ServiceOrder não encontrada',
      });
    }
    
    res.json({
      success: true,
      message: 'Retrabalho resolvido com sucesso',
      data: serviceOrder,
    });
  } catch (error) {
    console.error('Erro ao resolver retrabalho:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao resolver retrabalho',
      error: error.message,
    });
  }
};

/**
 * Resolver problema de entrega
 */
exports.resolveDeliveryIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution, resolvedBy } = req.body;
    
    const serviceOrder = await ServiceOrder.findOneAndUpdate(
      { id },
      {
        status: 'entregue',
        'deliveryIssue.resolution': resolution,
        'deliveryIssue.resolvedBy': resolvedBy,
        'deliveryIssue.resolvedAt': new Date(),
      },
      { new: true }
    );
    
    if (!serviceOrder) {
      return res.status(404).json({
        success: false,
        message: 'ServiceOrder não encontrada',
      });
    }
    
    res.json({
      success: true,
      message: 'Problema de entrega resolvido com sucesso',
      data: serviceOrder,
    });
  } catch (error) {
    console.error('Erro ao resolver problema de entrega:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao resolver problema de entrega',
      error: error.message,
    });
  }
};

/**
 * Completar vistoria
 */
exports.completeReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewResult, reviewNotes, reviewedBy } = req.body;
    
    const serviceOrder = await ServiceOrder.findOneAndUpdate(
      { id },
      {
        status: reviewResult === 'approved' ? 'pronto_entrega' : 'retrabalho',
        'installationReview.completedAt': new Date(),
        'installationReview.result': reviewResult,
        'installationReview.notes': reviewNotes,
        'installationReview.reviewedBy': reviewedBy,
      },
      { new: true }
    );
    
    if (!serviceOrder) {
      return res.status(404).json({
        success: false,
        message: 'ServiceOrder não encontrada',
      });
    }
    
    res.json({
      success: true,
      message: 'Vistoria completada com sucesso',
      data: serviceOrder,
    });
  } catch (error) {
    console.error('Erro ao completar vistoria:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao completar vistoria',
      error: error.message,
    });
  }
};

/**
 * Confirmar dados de entrega
 */
exports.confirmDeliveryData = async (req, res) => {
  try {
    const { id } = req.params;
    const { deliveryDate, deliveryTime, vehicle, driver, installers } = req.body;
    
    const serviceOrder = await ServiceOrder.findOneAndUpdate(
      { id },
      {
        deliveryDate,
        deliveryTime,
        vehicle,
        driver,
        installers,
      },
      { new: true }
    );
    
    if (!serviceOrder) {
      return res.status(404).json({
        success: false,
        message: 'ServiceOrder não encontrada',
      });
    }
    
    res.json({
      success: true,
      message: 'Dados de entrega confirmados com sucesso',
      data: serviceOrder,
    });
  } catch (error) {
    console.error('Erro ao confirmar dados de entrega:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao confirmar dados de entrega',
      error: error.message,
    });
  }
};
