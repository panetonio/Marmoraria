const mongoose = require('mongoose');

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

module.exports = mongoose.model('DeliveryRoute', deliveryRouteSchema);
