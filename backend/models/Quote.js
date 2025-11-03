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

const quoteItemSchema = new mongoose.Schema({
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

const quoteSchema = new mongoose.Schema({
  clientName: {
    type: String,
    required: true,
  },
  clientEmail: {
    type: String,
    required: true,
  },
  clientPhone: {
    type: String,
    required: true,
  },
  deliveryAddress: {
    type: addressSchema,
    required: true,
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'approved', 'rejected', 'archived'],
    default: 'draft',
  },
  items: [quoteItemSchema],
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
  salespersonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// Transform _id to id while keeping _id
quoteSchema.set('toJSON', {
  transform: function(doc, ret) {
    ret.id = ret._id.toString();
    // Manter _id para compatibilidade com MongoDB
    return ret;
  }
});

module.exports = mongoose.model('Quote', quoteSchema);

