const mongoose = require('mongoose');

const productionEmployeeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Nome do funcionário é obrigatório'],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ['installer', 'driver', 'helper', 'technician', 'other'],
      required: [true, 'Função é obrigatória'],
    },
    availability: {
      type: String,
      enum: ['available', 'on_task', 'on_leave'],
      default: 'available',
    },
    currentTaskId: {
      type: String,
      trim: true,
    },
    currentTaskType: {
      type: String,
      enum: ['delivery_route', 'service_order'],
    },
    skills: [{
      type: String,
      trim: true,
    }],
    hireDate: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

productionEmployeeSchema.index({ availability: 1, active: 1 });
productionEmployeeSchema.index({ role: 1, availability: 1 });

// Método para verificar disponibilidade do funcionário em um período
productionEmployeeSchema.statics.isAvailableInPeriod = async function (employeeId, start, end) {
  const DeliveryRoute = mongoose.model('DeliveryRoute');
  
  const conflicts = await DeliveryRoute.find({
    teamIds: employeeId,
    status: { $in: ['scheduled', 'in_progress'] },
    scheduledStart: { $lt: end },
    scheduledEnd: { $gt: start },
  });

  return conflicts.length === 0;
};

// Método para obter funcionários disponíveis em um período
productionEmployeeSchema.statics.getAvailableInPeriod = async function (start, end, role = null) {
  const query = {
    active: true,
    availability: { $ne: 'on_leave' },
  };

  if (role) {
    query.role = role;
  }

  const employees = await this.find(query);
  
  const availableEmployees = [];
  for (const employee of employees) {
    const isAvailable = await this.isAvailableInPeriod(employee._id, start, end);
    if (isAvailable) {
      availableEmployees.push(employee);
    }
  }

  return availableEmployees;
};

// Método de instância para marcar como em tarefa
productionEmployeeSchema.methods.assignToTask = async function (taskId, taskType) {
  this.availability = 'on_task';
  this.currentTaskId = taskId;
  this.currentTaskType = taskType;
  return this.save();
};

// Método de instância para liberar de tarefa
productionEmployeeSchema.methods.releaseFromTask = async function () {
  this.availability = 'available';
  this.currentTaskId = undefined;
  this.currentTaskType = undefined;
  return this.save();
};

module.exports = mongoose.model('ProductionEmployee', productionEmployeeSchema);

