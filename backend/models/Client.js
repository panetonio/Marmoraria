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

const clientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nome do cliente é obrigatório'],
    trim: true,
  },
  type: {
    type: String,
    enum: ['pessoa_fisica', 'empresa'],
    required: true,
  },
  email: {
    type: String,
    required: [true, 'Email é obrigatório'],
    trim: true,
    lowercase: true,
  },
  phone: {
    type: String,
    required: [true, 'Telefone é obrigatório'],
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

module.exports = mongoose.model('Client', clientSchema);

