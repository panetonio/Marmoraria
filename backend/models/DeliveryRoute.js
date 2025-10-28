const mongoose = require('mongoose');
const { calculateDerivedStatus } = require('../utils/statusHelper');

const photoSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    trim: true,
  },
}, { _id: false });

const customerSignatureSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });

const deliveryRouteSchema = new mongoose.Schema(
  {
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
    },
    serviceOrderId: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['delivery', 'installation'],
      required: true,
      default: 'delivery',
    },
    scheduledStart: {
      type: Date,
      required: true,
    },
    scheduledEnd: {
      type: Date,
      required: true,
    },
    actualStart: {
      type: Date,
    },
    actualEnd: {
      type: Date,
    },
    // Compatibilidade com código existente
    start: {
      type: Date,
      required: true,
    },
    end: {
      type: Date,
      required: true,
    },
    teamIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductionEmployee',
    }],
    status: {
      type: String,
      enum: ['pending', 'scheduled', 'in_progress', 'completed', 'cancelled'],
      default: 'pending',
    },
    notes: {
      type: String,
      trim: true,
    },
    checklistCompleted: {
      type: Boolean,
      default: false,
    },
    photos: [photoSchema],
    customerSignature: customerSignatureSchema,
  },
  {
    timestamps: true,
  }
);

deliveryRouteSchema.index({ vehicle: 1, start: 1, end: 1 });
deliveryRouteSchema.index({ teamIds: 1, scheduledStart: 1, scheduledEnd: 1 });
deliveryRouteSchema.index({ status: 1, scheduledStart: 1 });

// Método para verificar disponibilidade de veículo
deliveryRouteSchema.statics.isVehicleAvailable = async function (vehicleId, start, end, excludeRouteId) {
  const query = {
    vehicle: vehicleId,
    status: { $in: ['scheduled', 'in_progress'] },
    $or: [
      { start: { $lt: end }, end: { $gt: start } },
      { scheduledStart: { $lt: end }, scheduledEnd: { $gt: start } }
    ]
  };

  if (excludeRouteId) {
    query._id = { $ne: excludeRouteId };
  }

  const conflict = await this.findOne(query);
  return !conflict;
};

// Método para verificar disponibilidade de membro da equipe
deliveryRouteSchema.statics.isTeamMemberAvailable = async function (teamMemberId, start, end, excludeRouteId) {
  const query = {
    teamIds: teamMemberId,
    status: { $in: ['scheduled', 'in_progress'] },
    scheduledStart: { $lt: end },
    scheduledEnd: { $gt: start },
  };

  if (excludeRouteId) {
    query._id = { $ne: excludeRouteId };
  }

  const conflict = await this.findOne(query);
  return !conflict;
};

// Método para obter conflitos de agendamento
deliveryRouteSchema.statics.getSchedulingConflicts = async function (vehicleId, teamIds, start, end, excludeRouteId) {
  const conflicts = {
    vehicle: null,
    teamMembers: []
  };

  // Verificar veículo
  const vehicleAvailable = await this.isVehicleAvailable(vehicleId, start, end, excludeRouteId);
  if (!vehicleAvailable) {
    const vehicleConflict = await this.findOne({
      vehicle: vehicleId,
      status: { $in: ['scheduled', 'in_progress'] },
      $or: [
        { start: { $lt: end }, end: { $gt: start } },
        { scheduledStart: { $lt: end }, scheduledEnd: { $gt: start } }
      ],
      _id: excludeRouteId ? { $ne: excludeRouteId } : { $exists: true }
    });
    conflicts.vehicle = vehicleConflict;
  }

  // Verificar cada membro da equipe
  if (teamIds && teamIds.length > 0) {
    for (const memberId of teamIds) {
      const memberAvailable = await this.isTeamMemberAvailable(memberId, start, end, excludeRouteId);
      if (!memberAvailable) {
        const memberConflict = await this.findOne({
          teamIds: memberId,
          status: { $in: ['scheduled', 'in_progress'] },
          scheduledStart: { $lt: end },
          scheduledEnd: { $gt: start },
          _id: excludeRouteId ? { $ne: excludeRouteId } : { $exists: true }
        });
        conflicts.teamMembers.push({
          memberId,
          conflict: memberConflict
        });
      }
    }
  }

  return conflicts;
};

// Hook para atualizar status da ServiceOrder após salvar uma DeliveryRoute
deliveryRouteSchema.post('save', async function(doc, next) {
  try {
    console.log(`🔄 Hook post-save: Recalculando status da OS ${doc.serviceOrderId} após salvar rota ${doc._id}`);
    
    // Calcular o novo status derivado baseado em todas as rotas
    const derivedStatus = await calculateDerivedStatus(doc.serviceOrderId);
    
    if (derivedStatus) {
      // Buscar a ServiceOrder correspondente
      const ServiceOrder = mongoose.model('ServiceOrder');
      const serviceOrder = await ServiceOrder.findById(doc.serviceOrderId);
      
      if (serviceOrder) {
        // Status logísticos que podem ser atualizados automaticamente
        const logisticsStatuses = ['awaiting_scheduling', 'scheduled', 'in_transit', 'delivered', 'completed', 'picked_up', 'canceled'];
        
        // Verificar se o status atual é um status logístico e se o novo status é diferente
        if (logisticsStatuses.includes(serviceOrder.logisticsStatus) && 
            serviceOrder.logisticsStatus !== derivedStatus) {
          
          console.log(`📝 Atualizando status da OS ${doc.serviceOrderId}: ${serviceOrder.logisticsStatus} → ${derivedStatus}`);
          
          // Atualizar o status da ServiceOrder
          serviceOrder.logisticsStatus = derivedStatus;
          await serviceOrder.save();
          
          console.log(`✅ Status da OS ${doc.serviceOrderId} atualizado para: ${derivedStatus}`);
        } else {
          console.log(`⏭️ Status da OS ${doc.serviceOrderId} não atualizado. Status atual: ${serviceOrder.logisticsStatus}, Status derivado: ${derivedStatus}`);
        }
      } else {
        console.warn(`⚠️ ServiceOrder ${doc.serviceOrderId} não encontrada`);
      }
    } else {
      console.log(`ℹ️ Nenhum status derivado calculado para OS ${doc.serviceOrderId}`);
    }
    
    next();
  } catch (error) {
    console.error('❌ Erro no hook post-save da DeliveryRoute:', error);
    next(error);
  }
});

// Hook para atualizar status da ServiceOrder após deletar uma DeliveryRoute
deliveryRouteSchema.post('deleteOne', async function(doc, next) {
  try {
    console.log(`🗑️ Hook post-deleteOne: Recalculando status da OS após deletar rota`);
    
    // Obter o serviceOrderId do documento deletado
    const serviceOrderId = this.getQuery().serviceOrderId || doc?.serviceOrderId;
    
    if (serviceOrderId) {
      console.log(`🔄 Recalculando status da OS ${serviceOrderId} após deletar rota`);
      
      // Calcular o novo status derivado baseado nas rotas restantes
      const derivedStatus = await calculateDerivedStatus(serviceOrderId);
      
      if (derivedStatus) {
        // Buscar a ServiceOrder correspondente
        const ServiceOrder = mongoose.model('ServiceOrder');
        const serviceOrder = await ServiceOrder.findById(serviceOrderId);
        
        if (serviceOrder) {
          // Status logísticos que podem ser atualizados automaticamente
          const logisticsStatuses = ['awaiting_scheduling', 'scheduled', 'in_transit', 'delivered', 'completed', 'picked_up', 'canceled'];
          
          // Verificar se o status atual é um status logístico e se o novo status é diferente
          if (logisticsStatuses.includes(serviceOrder.logisticsStatus) && 
              serviceOrder.logisticsStatus !== derivedStatus) {
            
            console.log(`📝 Atualizando status da OS ${serviceOrderId}: ${serviceOrder.logisticsStatus} → ${derivedStatus}`);
            
            // Atualizar o status da ServiceOrder
            serviceOrder.logisticsStatus = derivedStatus;
            await serviceOrder.save();
            
            console.log(`✅ Status da OS ${serviceOrderId} atualizado para: ${derivedStatus}`);
          } else {
            console.log(`⏭️ Status da OS ${serviceOrderId} não atualizado. Status atual: ${serviceOrder.logisticsStatus}, Status derivado: ${derivedStatus}`);
          }
        } else {
          console.warn(`⚠️ ServiceOrder ${serviceOrderId} não encontrada`);
        }
      } else {
        console.log(`ℹ️ Nenhum status derivado calculado para OS ${serviceOrderId}`);
      }
    } else {
      console.warn(`⚠️ serviceOrderId não encontrado no hook post-deleteOne`);
    }
    
    next();
  } catch (error) {
    console.error('❌ Erro no hook post-deleteOne da DeliveryRoute:', error);
    next(error);
  }
});

// Hook alternativo para findOneAndDelete
deliveryRouteSchema.post('findOneAndDelete', async function(doc, next) {
  try {
    console.log(`🗑️ Hook post-findOneAndDelete: Recalculando status da OS após deletar rota`);
    
    if (doc && doc.serviceOrderId) {
      console.log(`🔄 Recalculando status da OS ${doc.serviceOrderId} após deletar rota ${doc._id}`);
      
      // Calcular o novo status derivado baseado nas rotas restantes
      const derivedStatus = await calculateDerivedStatus(doc.serviceOrderId);
      
      if (derivedStatus) {
        // Buscar a ServiceOrder correspondente
        const ServiceOrder = mongoose.model('ServiceOrder');
        const serviceOrder = await ServiceOrder.findById(doc.serviceOrderId);
        
        if (serviceOrder) {
          // Status logísticos que podem ser atualizados automaticamente
          const logisticsStatuses = ['awaiting_scheduling', 'scheduled', 'in_transit', 'delivered', 'completed', 'picked_up', 'canceled'];
          
          // Verificar se o status atual é um status logístico e se o novo status é diferente
          if (logisticsStatuses.includes(serviceOrder.logisticsStatus) && 
              serviceOrder.logisticsStatus !== derivedStatus) {
            
            console.log(`📝 Atualizando status da OS ${doc.serviceOrderId}: ${serviceOrder.logisticsStatus} → ${derivedStatus}`);
            
            // Atualizar o status da ServiceOrder
            serviceOrder.logisticsStatus = derivedStatus;
            await serviceOrder.save();
            
            console.log(`✅ Status da OS ${doc.serviceOrderId} atualizado para: ${derivedStatus}`);
          } else {
            console.log(`⏭️ Status da OS ${doc.serviceOrderId} não atualizado. Status atual: ${serviceOrder.logisticsStatus}, Status derivado: ${derivedStatus}`);
          }
        } else {
          console.warn(`⚠️ ServiceOrder ${doc.serviceOrderId} não encontrada`);
        }
      } else {
        console.log(`ℹ️ Nenhum status derivado calculado para OS ${doc.serviceOrderId}`);
      }
    } else {
      console.warn(`⚠️ Documento ou serviceOrderId não encontrado no hook post-findOneAndDelete`);
    }
    
    next();
  } catch (error) {
    console.error('❌ Erro no hook post-findOneAndDelete da DeliveryRoute:', error);
    next(error);
  }
});

module.exports = mongoose.model('DeliveryRoute', deliveryRouteSchema);
