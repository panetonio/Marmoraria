const Vehicle = require('../models/Vehicle');
const DeliveryRoute = require('../models/DeliveryRoute');

exports.getVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find().sort({ createdAt: -1 });
    res.json({ success: true, count: vehicles.length, data: vehicles });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao buscar veículos', error: error.message });
  }
};

exports.getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Veículo não encontrado' });
    }
    res.json({ success: true, data: vehicle });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao buscar veículo', error: error.message });
  }
};

exports.createVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.create(req.body);
    res.status(201).json({ success: true, message: 'Veículo criado com sucesso', data: vehicle });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao criar veículo', error: error.message });
  }
};

exports.updateVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Veículo não encontrado' });
    }

    res.json({ success: true, message: 'Veículo atualizado com sucesso', data: vehicle });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao atualizar veículo', error: error.message });
  }
};

exports.deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Veículo não encontrado' });
    }

    const hasRoutes = await DeliveryRoute.exists({ vehicle: vehicle._id, status: { $in: ['scheduled', 'in_progress'] } });
    if (hasRoutes) {
      return res.status(400).json({
        success: false,
        message: 'Não é possível remover veículos com rotas agendadas ou em andamento',
      });
    }

    await vehicle.deleteOne();
    res.json({ success: true, message: 'Veículo removido com sucesso' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao remover veículo', error: error.message });
  }
};
