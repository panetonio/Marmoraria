const mongoose = require('mongoose');

const cutPieceSchema = new mongoose.Schema({
  pieceId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  serviceOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceOrder',
    required: true,
    index: true
  },
  originalQuoteItemId: {
    type: String,
    required: true
  },
  originalStockItemId: {
    type: String,
    required: true,
    index: true
  },
  materialId: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String
  },
  dimensions: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending_cut', 'cut', 'finishing', 'assembly', 'ready_for_delivery', 'delivered', 'installed'],
    default: 'pending_cut',
    index: true
  },
  location: {
    type: String
  },
  qrCodeValue: {
    type: String,
    index: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CutPiece', cutPieceSchema);
