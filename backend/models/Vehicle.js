const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Nome do veículo é obrigatório'],
      trim: true,
    },
    licensePlate: {
      type: String,
      required: [true, 'Placa do veículo é obrigatória'],
      trim: true,
      uppercase: true,
      unique: true,
    },
    capacity: {
      type: Number,
      required: [true, 'Capacidade é obrigatória'],
      min: [0, 'Capacidade deve ser maior ou igual a zero'],
    },
    type: {
      type: String,
      enum: ['van', 'caminhao'],
      required: [true, 'Tipo do veículo é obrigatório'],
    },
    status: {
      type: String,
      enum: ['disponivel', 'em_uso', 'em_manutencao'],
      default: 'disponivel',
    },
    lastMaintenanceDate: {
      type: Date,
    },
    nextMaintenanceDate: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

vehicleSchema.index({ licensePlate: 1 }, { unique: true });

module.exports = mongoose.model('Vehicle', vehicleSchema);
