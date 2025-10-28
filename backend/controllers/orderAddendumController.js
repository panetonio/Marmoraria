const OrderAddendum = require('../models/OrderAddendum');
const Order = require('../models/Order');
const User = require('../models/User');

// Buscar todos os adendos para um pedido específico
exports.getAddendumsForOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Verificar se o pedido existe
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Pedido não encontrado' 
      });
    }

    // Buscar adendos do pedido, populando usuários e ordenando por addendumNumber
    const addendums = await OrderAddendum.find({ orderId })
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .sort({ addendumNumber: 1 });

    res.json({ 
      success: true, 
      count: addendums.length, 
      data: addendums 
    });
  } catch (error) {
    console.error('Erro ao buscar adendos:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar adendos do pedido', 
      error: error.message 
    });
  }
};

// Criar um novo adendo
exports.createAddendum = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason, addedItems = [], removedItemIds = [], changedItems = [], priceAdjustment = 0 } = req.body;

    // Verificar se o pedido existe
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Pedido não encontrado' 
      });
    }

    // Calcular o próximo número de adendo sequencial
    const existingAddendums = await OrderAddendum.find({ orderId });
    const nextAddendumNumber = existingAddendums.length + 1;

    // Validar dados obrigatórios
    if (!reason || reason.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Motivo do adendo é obrigatório' 
      });
    }

    // Criar o novo adendo
    const newAddendum = new OrderAddendum({
      orderId,
      addendumNumber: nextAddendumNumber,
      reason: reason.trim(),
      addedItems,
      removedItemIds,
      changedItems,
      priceAdjustment,
      createdBy: req.user._id,
      status: 'pending'
    });

    const savedAddendum = await newAddendum.save();

    // Popular os dados do usuário criador
    await savedAddendum.populate('createdBy', 'name email');

    console.log(`📝 Adendo criado: ${savedAddendum._id} para pedido ${orderId} | Número: ${nextAddendumNumber}`);

    res.status(201).json({ 
      success: true, 
      message: 'Adendo criado com sucesso', 
      data: savedAddendum 
    });
  } catch (error) {
    console.error('Erro ao criar adendo:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao criar adendo', 
      error: error.message 
    });
  }
};

// Atualizar status de um adendo
exports.updateAddendumStatus = async (req, res) => {
  try {
    const { addendumId } = req.params;
    const { status } = req.body;

    // Validar status
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Status deve ser "approved" ou "rejected"' 
      });
    }

    // Buscar o adendo
    const addendum = await OrderAddendum.findById(addendumId);
    if (!addendum) {
      return res.status(404).json({ 
        success: false, 
        message: 'Adendo não encontrado' 
      });
    }

    // Verificar se o adendo ainda está pendente
    if (addendum.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: `Adendo já foi processado. Status atual: ${addendum.status}` 
      });
    }

    // ====================================================================
    // PROCESSO DE RESOLUÇÃO DE OSs EXISTENTES QUANDO ADENDO É APROVADO
    // ====================================================================
    
    if (status === 'approved') {
      console.log(`🔍 Analisando impacto do adendo ${addendumId} em OSs existentes...`);
      
      // 1. BUSCAR TODAS AS OSs EXISTENTES PARA O PEDIDO
      const ServiceOrder = require('../models/ServiceOrder');
      const existingServiceOrders = await ServiceOrder.find({ 
        orderId: addendum.orderId 
      });
      
      console.log(`📋 Encontradas ${existingServiceOrders.length} OS(s) existente(s) para o pedido ${addendum.orderId}`);
      
      // 2. ANALISAR IMPACTO DO ADENDO NAS OSs EXISTENTES
      const impactAnalysis = {
        // OSs que contêm itens que serão removidos pelo adendo
        osWithRemovedItems: [],
        // OSs que contêm itens que serão modificados pelo adendo
        osWithChangedItems: [],
        // OSs que podem ser atualizadas automaticamente (status inicial)
        canAutoUpdate: [],
        // OSs que requerem intervenção manual (em produção)
        requiresManualIntervention: []
      };
      
      // Verificar cada OS existente
      for (const serviceOrder of existingServiceOrders) {
        const osItems = serviceOrder.items.map(item => item.id);
        
        // Verificar se OS contém itens que serão removidos
        const hasRemovedItems = addendum.removedItemIds.some(removedId => 
          osItems.includes(removedId)
        );
        
        // Verificar se OS contém itens que serão modificados
        const hasChangedItems = addendum.changedItems.some(change => 
          osItems.includes(change.originalItemId)
        );
        
        if (hasRemovedItems) {
          impactAnalysis.osWithRemovedItems.push(serviceOrder);
          console.log(`⚠️ OS ${serviceOrder._id} contém itens que serão removidos pelo adendo`);
        }
        
        if (hasChangedItems) {
          impactAnalysis.osWithChangedItems.push(serviceOrder);
          console.log(`🔄 OS ${serviceOrder._id} contém itens que serão modificados pelo adendo`);
        }
        
        // Classificar por capacidade de atualização automática
        if (hasRemovedItems || hasChangedItems) {
          if (['pending', 'scheduled'].includes(serviceOrder.status)) {
            impactAnalysis.canAutoUpdate.push(serviceOrder);
            console.log(`✅ OS ${serviceOrder._id} pode ser atualizada automaticamente (status: ${serviceOrder.status})`);
          } else {
            impactAnalysis.requiresManualIntervention.push(serviceOrder);
            console.log(`🚨 OS ${serviceOrder._id} requer intervenção manual (status: ${serviceOrder.status})`);
          }
        }
      }
      
      // 3. ATUALIZAR OSs AUTOMATICAMENTE (SE POSSÍVEL)
      if (impactAnalysis.canAutoUpdate.length > 0) {
        console.log(`🔧 Atualizando ${impactAnalysis.canAutoUpdate.length} OS(s) automaticamente...`);
        
        for (const serviceOrder of impactAnalysis.canAutoUpdate) {
          try {
            // Remover itens que foram removidos pelo adendo
            const updatedItems = serviceOrder.items.filter(item => 
              !addendum.removedItemIds.includes(item.id)
            );
            
            // Substituir itens modificados pela versão atualizada
            const finalItems = updatedItems.map(item => {
              const changedItem = addendum.changedItems.find(change => 
                change.originalItemId === item.id
              );
              return changedItem ? changedItem.updatedItem : item;
            });
            
            // Adicionar novos itens do adendo (se aplicável)
            const newItems = addendum.addedItems.filter(newItem => 
              !finalItems.some(existingItem => existingItem.id === newItem.id)
            );
            
            // Atualizar OS
            serviceOrder.items = [...finalItems, ...newItems];
            serviceOrder.total = serviceOrder.items.reduce((sum, item) => sum + item.totalPrice, 0);
            
            await serviceOrder.save();
            console.log(`✅ OS ${serviceOrder._id} atualizada automaticamente`);
            
          } catch (error) {
            console.error(`❌ Erro ao atualizar OS ${serviceOrder._id}:`, error);
            // Se falhar, mover para intervenção manual
            impactAnalysis.requiresManualIntervention.push(serviceOrder);
          }
        }
      }
      
      // 4. NOTIFICAR SOBRE INTERVENÇÃO MANUAL NECESSÁRIA
      if (impactAnalysis.requiresManualIntervention.length > 0) {
        console.log(`🚨 ${impactAnalysis.requiresManualIntervention.length} OS(s) requerem intervenção manual`);
        
        // TODO: Implementar sistema de notificações
        // - Enviar email para equipe de produção
        // - Criar alerta no sistema
        // - Registrar no log de atividades
        
        const notificationData = {
          type: 'addendum_conflict',
          addendumId: addendum._id,
          addendumNumber: addendum.addendumNumber,
          orderId: addendum.orderId,
          reason: addendum.reason,
          impactedOSs: impactAnalysis.requiresManualIntervention.map(os => ({
            id: os._id,
            status: os.status,
            items: os.items.map(item => ({
              id: item.id,
              description: item.description,
              totalPrice: item.totalPrice
            }))
          })),
          actionRequired: 'manual_review',
          timestamp: new Date()
        };
        
        console.log('📢 Notificação de conflito:', JSON.stringify(notificationData, null, 2));
        
        // TODO: Implementar envio de notificação
        // await sendNotificationToProductionTeam(notificationData);
      }
      
      // 5. REGISTRAR ANÁLISE DE IMPACTO NO LOG
      console.log(`📊 Resumo do impacto do adendo ${addendumId}:`);
      console.log(`   - OSs com itens removidos: ${impactAnalysis.osWithRemovedItems.length}`);
      console.log(`   - OSs com itens modificados: ${impactAnalysis.osWithChangedItems.length}`);
      console.log(`   - OSs atualizadas automaticamente: ${impactAnalysis.canAutoUpdate.length}`);
      console.log(`   - OSs requerendo intervenção manual: ${impactAnalysis.requiresManualIntervention.length}`);
    }

    // Atualizar status e dados de aprovação se necessário
    const updateData = { status };
    
    if (status === 'approved') {
      updateData.approvedBy = req.user._id;
      updateData.approvedAt = new Date();
    }

    const updatedAddendum = await OrderAddendum.findByIdAndUpdate(
      addendumId,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email')
     .populate('approvedBy', 'name email');

    console.log(`✅ Adendo ${addendumId} ${status === 'approved' ? 'aprovado' : 'rejeitado'} por ${req.user.name}`);

    res.json({ 
      success: true, 
      message: `Adendo ${status === 'approved' ? 'aprovado' : 'rejeitado'} com sucesso`, 
      data: updatedAddendum 
    });
  } catch (error) {
    console.error('Erro ao atualizar status do adendo:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao atualizar status do adendo', 
      error: error.message 
    });
  }
};

// Buscar adendo por ID (função auxiliar)
exports.getAddendumById = async (req, res) => {
  try {
    const { addendumId } = req.params;

    const addendum = await OrderAddendum.findById(addendumId)
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate('orderId', 'clientName total');

    if (!addendum) {
      return res.status(404).json({ 
        success: false, 
        message: 'Adendo não encontrado' 
      });
    }

    res.json({ 
      success: true, 
      data: addendum 
    });
  } catch (error) {
    console.error('Erro ao buscar adendo:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar adendo', 
      error: error.message 
    });
  }
};

// Buscar todos os adendos pendentes (função auxiliar)
exports.getPendingAddendums = async (req, res) => {
  try {
    const pendingAddendums = await OrderAddendum.find({ status: 'pending' })
      .populate('createdBy', 'name email')
      .populate('orderId', 'clientName total')
      .sort({ createdAt: -1 });

    res.json({ 
      success: true, 
      count: pendingAddendums.length, 
      data: pendingAddendums 
    });
  } catch (error) {
    console.error('Erro ao buscar adendos pendentes:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar adendos pendentes', 
      error: error.message 
    });
  }
};
