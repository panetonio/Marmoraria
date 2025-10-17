const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nome do produto é obrigatório'],
    trim: true,
  },
  cost: {
    type: Number,
    required: [true, 'Custo é obrigatório'],
    min: 0,
  },
  price: {
    type: Number,
    required: [true, 'Preço é obrigatório'],
    min: 0,
  },
  stock: {
    type: Number,
    required: [true, 'Estoque é obrigatório'],
    min: 0,
    default: 0,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Product', productSchema);

