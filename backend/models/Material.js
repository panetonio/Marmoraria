const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nome do material é obrigatório'],
    trim: true,
  },
  photoUrl: {
    type: String,
    default: '',
  },
  supplier: {
    type: String,
    required: [true, 'Fornecedor é obrigatório'],
  },
  costPerSqM: {
    type: Number,
    required: [true, 'Custo por m² é obrigatório'],
    min: 0,
  },
  slabWidth: {
    type: Number,
    required: [true, 'Largura da chapa é obrigatória'],
    min: 0,
  },
  slabHeight: {
    type: Number,
    required: [true, 'Altura da chapa é obrigatória'],
    min: 0,
  },
  sku: {
    type: String,
    required: [true, 'SKU é obrigatório'],
    unique: true,
  },
  minStockSqM: {
    type: Number,
    min: 0,
    default: 0,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Material', materialSchema);

