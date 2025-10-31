const mongoose = require('mongoose');

const financialTransactionSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
    trim: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    enum: ['receita', 'despesa'],
    required: true,
  },
  status: {
    type: String,
    enum: ['pago', 'pendente'],
    required: true,
    default: 'pendente',
    index: true,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  paymentDate: {
    type: Date,
  },
  relatedOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
  },
  relatedClientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
  },
  paymentMethod: {
    type: String,
    enum: ['pix', 'cartao_credito', 'boleto', 'dinheiro'],
  },
  // Anexos (arquivo salvo no servidor ou storage externo)
  attachmentUrl: { type: String, trim: true },
  attachmentName: { type: String, trim: true },
}, {
  timestamps: true,
});

module.exports = mongoose.model('FinancialTransaction', financialTransactionSchema);



