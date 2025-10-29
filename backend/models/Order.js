const mongoose = require('mongoose');

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
  category: { type: String, trim: true },
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

const orderSchema = new mongoose.Schema({
  originalQuoteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quote',
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
  items: [orderItemSchema],
  subtotal: {
    type: Number,
    required: true,
    default: 0,
  },
  discount: {
    type: Number,
    default: 0,
  },
  freight: {
    type: Number,
    default: 0,
  },
  paymentMethod: {
    type: String,
    enum: ['pix', 'cartao_credito', 'boleto', 'dinheiro'],
  },
  installments: Number,
  total: {
    type: Number,
    required: true,
    default: 0,
  },
  approvalDate: {
    type: Date,
    default: Date.now,
  },
  serviceOrderIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceOrder',
  }],
  salespersonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// Referência virtual para adendos
orderSchema.virtual('addendums', {
  ref: 'OrderAddendum',
  localField: '_id',
  foreignField: 'orderId'
});

// Certifique-se de habilitar virtuais no toJSON e toObject
orderSchema.set('toJSON', { virtuals: true });
orderSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Order', orderSchema);

