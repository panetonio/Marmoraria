const DeliveryRoute = require('../models/DeliveryRoute');
const Vehicle = require('../models/Vehicle');

const parseDate = (value, field) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    const error = new Error(`Data inválida para ${field}`);
    error.statusCode = 400;
    throw error;
  }
  return date;
};

exports.getRoutes = async (req, res) => {
  try {
    const { vehicleId, start, end } = req.query;
    const filters = {};

    if (vehicleId) {
      filters.vehicle = vehicleId;
    }

    if (start || end) {
      filters.start = {};
      filters.end = filters.end || {};
      if (start) {
        const startDate = parseDate(start, 'start');
        filters.end.$gt = startDate;
      }
      if (end) {
        const endDate = parseDate(end, 'end');
        filters.start.$lt = endDate;
      }
    }

    const routes = await DeliveryRoute.find(filters).populate('vehicle').sort({ start: 1 });
    res.json({ success: true, count: routes.length, data: routes });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : 'Erro ao buscar rotas',
      error: error.message,
    });
  }
};

exports.createRoute = async (req, res) => {
  try {
    const { vehicleId, serviceOrderId, start, end, status, notes } = req.body;

    if (!vehicleId || !serviceOrderId || !start || !end) {
      return res.status(400).json({ success: false, message: 'Veículo, ordem de serviço, início e fim são obrigatórios' });
    }

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Veículo não encontrado' });
    }

    const startDate = parseDate(start, 'start');
    const endDate = parseDate(end, 'end');

    if (startDate >= endDate) {
      return res.status(400).json({ success: false, message: 'Horário final deve ser após o horário inicial' });
    }

    const available = await DeliveryRoute.isVehicleAvailable(vehicleId, startDate, endDate);
    if (!available) {
      return res.status(409).json({ success: false, message: 'Veículo indisponível para o período selecionado' });
    }

    const route = await DeliveryRoute.create({
      vehicle: vehicleId,
      serviceOrderId,
      start: startDate,
      end: endDate,
      status: status || 'scheduled',
      notes,
    });

    const populated = await route.populate('vehicle');
    res.status(201).json({ success: true, message: 'Rota criada com sucesso', data: populated });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : 'Erro ao criar rota',
      error: error.message,
    });
  }
};

exports.updateRoute = async (req, res) => {
  try {
    const { vehicleId, start, end, status, notes } = req.body;

    const route = await DeliveryRoute.findById(req.params.id);
    if (!route) {
      return res.status(404).json({ success: false, message: 'Rota não encontrada' });
    }

    const vehicle = vehicleId ? await Vehicle.findById(vehicleId) : null;
    if (vehicleId && !vehicle) {
      return res.status(404).json({ success: false, message: 'Veículo não encontrado' });
    }

    const startDate = start ? parseDate(start, 'start') : route.start;
    const endDate = end ? parseDate(end, 'end') : route.end;

    if (startDate >= endDate) {
      return res.status(400).json({ success: false, message: 'Horário final deve ser após o horário inicial' });
    }

    const targetVehicleId = vehicleId || route.vehicle;
    const available = await DeliveryRoute.isVehicleAvailable(targetVehicleId, startDate, endDate, route._id);
    if (!available) {
      return res.status(409).json({ success: false, message: 'Veículo indisponível para o período selecionado' });
    }

    route.vehicle = targetVehicleId;
    route.start = startDate;
    route.end = endDate;
    if (status) route.status = status;
    if (notes !== undefined) route.notes = notes;

    await route.save();
    const populated = await route.populate('vehicle');
    res.json({ success: true, message: 'Rota atualizada com sucesso', data: populated });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : 'Erro ao atualizar rota',
      error: error.message,
    });
  }
};

exports.deleteRoute = async (req, res) => {
  try {
    const route = await DeliveryRoute.findById(req.params.id);
    if (!route) {
      return res.status(404).json({ success: false, message: 'Rota não encontrada' });
    }

    await route.deleteOne();
    res.json({ success: true, message: 'Rota removida com sucesso' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao remover rota', error: error.message });
  }
};

exports.checkAvailability = async (req, res) => {
  try {
    const { vehicleId, start, end, routeId } = req.query;

    if (!vehicleId || !start || !end) {
      return res.status(400).json({ success: false, message: 'Veículo, início e fim são obrigatórios' });
    }

    const startDate = parseDate(start, 'start');
    const endDate = parseDate(end, 'end');

    if (startDate >= endDate) {
      return res.status(400).json({ success: false, message: 'Horário final deve ser após o horário inicial' });
    }

    const available = await DeliveryRoute.isVehicleAvailable(vehicleId, startDate, endDate, routeId);
    res.json({ success: true, available });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : 'Erro ao verificar disponibilidade',
      error: error.message,
    });
  }
};
