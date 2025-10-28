const mongoose = require('mongoose');

// Reutilizar os schemas do Order.js
const pointSchema = new mongoose.Schema({
  x: Number,
  y: Number,
}, { _id: false });

const orderItemSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['material', 'service', 'product'],
    required: true,
  },
  description: String,
  quantity: Number,
  unitPrice: Number,
  discount: { type: Number, default: 0 },
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

const orderAddendumSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    index: true,
  },
  addendumNumber: {
    type: Number,
    required: true,
  },
  reason: {
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true,
  },
  addedItems: {
    type: [orderItemSchema],
    default: [],
  },
  removedItemIds: {
    type: [String],
    default: [],
  },
  changedItems: [{
    originalItemId: {
      type: String,
      required: true,
    },
    updatedItem: {
      type: orderItemSchema,
      required: true,
    },
  }],
  priceAdjustment: {
    type: Number,
    default: 0,
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  approvedAt: {
    type: Date,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// Índices adicionais para otimização de consultas
orderAddendumSchema.index({ orderId: 1, addendumNumber: 1 }, { unique: true });
orderAddendumSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('OrderAddendum', orderAddendumSchema);
