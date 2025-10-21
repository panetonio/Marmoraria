const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nome do equipamento é obrigatório'],
    trim: true,
  },
  serialNumber: {
    type: String,
    required: [true, 'Número de série é obrigatório'],
    trim: true,
    unique: true,
  },
  category: {
    type: String,
    enum: ['maquina', 'veiculo'],
    required: [true, 'Categoria é obrigatória'],
  },
  purchaseDate: {
    type: Date,
    required: [true, 'Data de compra é obrigatória'],
  },
  warrantyEndDate: {
    type: Date,
    required: [true, 'Data de fim da garantia é obrigatória'],
  },
  purchaseInvoiceNumber: {
    type: String,
    required: [true, 'Número da nota fiscal de compra é obrigatório'],
    trim: true,
  },
  supplierCnpj: {
    type: String,
    required: [true, 'CNPJ do fornecedor é obrigatório'],
    trim: true,
  },
  assignedTo: {
    type: String,
    trim: true,
    default: '',
  },
  status: {
    type: String,
    enum: ['operacional', 'em_manutencao', 'desativado'],
    default: 'operacional',
  },
  currentLocation: {
    type: String,
    required: [true, 'Localização atual é obrigatória'],
    trim: true,
  },
  notes: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Equipment', equipmentSchema);
