const mongoose = require('mongoose');

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
    start: {
      type: Date,
      required: true,
    },
    end: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
      default: 'scheduled',
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

deliveryRouteSchema.index({ vehicle: 1, start: 1, end: 1 });

deliveryRouteSchema.statics.isVehicleAvailable = async function (vehicleId, start, end, excludeRouteId) {
  const query = {
    vehicle: vehicleId,
    start: { $lt: end },
    end: { $gt: start },
  };

  if (excludeRouteId) {
    query._id = { $ne: excludeRouteId };
  }

  const conflict = await this.findOne(query);
  return !conflict;
};

module.exports = mongoose.model('DeliveryRoute', deliveryRouteSchema);
