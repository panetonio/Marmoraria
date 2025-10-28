const mongoose = require('mongoose');
const { calculateDerivedStatus } = require('../utils/statusHelper');

const addressSchema = new mongoose.Schema({
  cep: String,
  uf: String,
  city: String,
  neighborhood: String,
  address: String,
  number: String,
  complement: String,
}, { _id: false });

const pointSchema = new mongoose.Schema({
  x: Number,
  y: Number,
}, { _id: false });

const itemSchema = new mongoose.Schema({
  type: String,
  description: String,
  quantity: Number,
  unitPrice: Number,
  discount: Number,
  totalPrice: Number,
  width: Number,
  height: Number,
  perimeter: Number,
  wastePercentage: Number,
  materialId: String,
  placement: {
    x: Number,
    y: Number,
    fit: Boolean,
  },
  shapePoints: [pointSchema],
}, { _id: false });

const checklistItemSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => new mongoose.Types.ObjectId().toString(),
  },
  text: {
    type: String,
    required: true,
    trim: true,
  },
  checked: {
    type: Boolean,
    default: false,
  },
}, { _id: false });

const serviceOrderSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },
  clientName: {
    type: String,
    required: true,
  },
  deliveryAddress: {
    type: addressSchema,
    required: true,
  },
  items: [itemSchema],
  total: {
    type: Number,
    required: true,
  },
  deliveryDate: {
    type: Date,
    required: true,
  },
  assignedToIds: [{
    type: String,
  }],
  productionStatus: {
    type: String,
    enum: [
      'pending_production', 'cutting', 'finishing', 'quality_check', 'awaiting_logistics'
    ],
    default: 'pending_production',
  },
  logisticsStatus: {
    type: String,
    enum: [
      'awaiting_scheduling', 'scheduled', 'in_transit', 'delivered', 
      'in_installation', 'completed', 'picked_up', 'canceled'
    ],
    default: 'awaiting_scheduling',
  },
  isFinalized: {
    type: Boolean,
    default: false,
  },
  allocatedSlabId: String,
  priority: {
    type: String,
    enum: ['normal', 'alta', 'urgente'],
    default: 'normal',
  },
  requiresInstallation: Boolean,
  finalizationType: {
    type: String,
    enum: ['pickup', 'delivery_only', 'delivery_installation'],
  },
  delivery_confirmed: {
    type: Boolean,
    default: false,
  },
  installation_confirmed: {
    type: Boolean,
    default: false,
  },
  attachment: {
    name: String,
    url: String,
  },
  departureChecklist: [checklistItemSchema],
  observations: String,
}, {
  timestamps: true,
});

// Static method to calculate and update derived status
serviceOrderSchema.statics.updateDerivedStatus = async function(serviceOrderId) {
  const derivedStatus = await calculateDerivedStatus(serviceOrderId);
  
  if (derivedStatus) {
    await this.findByIdAndUpdate(serviceOrderId, {
      logisticsStatus: derivedStatus
    });
  }
  
  return derivedStatus;
};

module.exports = mongoose.model('ServiceOrder', serviceOrderSchema);

