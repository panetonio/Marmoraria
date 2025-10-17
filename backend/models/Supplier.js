const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  cep: { type: String, required: true },
  uf: { type: String, required: true },
  city: { type: String, required: true },
  neighborhood: { type: String, required: true },
  address: { type: String, required: true },
  number: { type: String, required: true },
  complement: { type: String },
}, { _id: false });

const supplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nome do fornecedor é obrigatório'],
    trim: true,
  },
  contactPerson: {
    type: String,
    required: [true, 'Pessoa de contato é obrigatória'],
    trim: true,
  },
  phone: {
    type: String,
    required: [true, 'Telefone é obrigatório'],
  },
  email: {
    type: String,
    required: [true, 'Email é obrigatório'],
    trim: true,
    lowercase: true,
  },
  address: {
    type: addressSchema,
    required: true,
  },
  cpfCnpj: {
    type: String,
    required: [true, 'CPF/CNPJ é obrigatório'],
    unique: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Supplier', supplierSchema);

