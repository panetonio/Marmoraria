const mongoose = require('mongoose');

const opportunitySchema = new mongoose.Schema({
  clientName: {
    type: String,
    required: true,
  },
  estimatedValue: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ['novo', 'contatado', 'orcamento_enviado', 'negociacao', 'ganho', 'perdido'],
    default: 'novo',
  },
  salespersonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Opportunity', opportunitySchema);

