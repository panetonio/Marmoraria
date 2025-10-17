const mongoose = require('mongoose');

const stockItemSchema = new mongoose.Schema({
  materialId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Material',
    required: true,
  },
  photoUrl: String,
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
    enum: ['disponivel', 'reservada', 'em_uso', 'consumida'],
    default: 'disponivel',
  },
  parentSlabId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StockItem',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('StockItem', stockItemSchema);

