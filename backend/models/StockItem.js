const mongoose = require('mongoose');

const pointSchema = new mongoose.Schema({
  x: Number,
  y: Number,
}, { _id: false });

const stockItemSchema = new mongoose.Schema({
  materialId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Material',
    required: true,
  },
  photoUrl: String,
  internalId: {
    type: String,
    trim: true,
  },
  qrCodeValue: {
    type: String,
    trim: true,
  },
  width: {
    type: Number,
    required: true,
  },
  height: {
    type: Number,
    required: true,
  },
  thickness: {
    type: Number,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: [
      'disponivel',
      'reservada',
      'em_uso',
      'consumida',
      'em_corte',
      'em_acabamento',
      'pronto_para_expedicao',
      'partial',
    ],
    default: 'disponivel',
  },
  width_cm: Number,
  height_cm: Number,
  shape: {
    type: String,
    trim: true,
  },
  shapePoints: {
    type: [pointSchema],
    default: undefined,
  },
  parentSlabId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StockItem',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('StockItem', stockItemSchema);

