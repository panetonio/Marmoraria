const mongoose = require('mongoose');

const contractSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    index: true,
  },
  quoteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quote',
    required: true,
    index: true,
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
  },
  documentNumber: {
    type: String,
    unique: true,
    sparse: true,
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'signed', 'archived'],
    default: 'draft',
  },
  contentTemplate: {
    type: String,
  },
  variables: {
    type: mongoose.Schema.Types.Mixed,
  },
  signatoryInfo: {
    name: String,
    documentNumber: String,
  },
  digitalSignatureUrl: {
    type: String,
  },
  signedAt: {
    type: Date,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Contract', contractSchema);


