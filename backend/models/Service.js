const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nome do serviço é obrigatório'],
    trim: true,
  },
  unit: {
    type: String,
    enum: ['m', 'un', '%'],
    required: true,
  },
  price: {
    type: Number,
    required: [true, 'Preço é obrigatório'],
    min: 0,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Service', serviceSchema);

