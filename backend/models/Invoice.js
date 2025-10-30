const mongoose = require('mongoose');

// Reaproveitar sub-esquemas do Order
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

const invoiceSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    index: true,
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
  },
  clientName: {
    type: String,
    required: true,
  },
  buyerDocument: String, // CPF/CNPJ
  buyerAddress: addressSchema,
  items: [orderItemSchema],
  total: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'issued', 'canceled'],
    default: 'pending',
    index: true,
  },
  issueDate: Date,
  nfeKey: String,
  nfeXmlUrl: String,
  nfePdfUrl: String,
}, {
  timestamps: true,
});

module.exports = mongoose.model('Invoice', invoiceSchema);


