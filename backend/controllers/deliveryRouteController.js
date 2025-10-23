const DeliveryRoute = require('../models/DeliveryRoute');
const Vehicle = require('../models/Vehicle');
const ProductionEmployee = require('../models/ProductionEmployee');
const ServiceOrder = require('../models/ServiceOrder');

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
    const { 
      vehicleId, 
      serviceOrderId, 
      start, 
      end, 
      scheduledStart,
      scheduledEnd,
      type,
      teamIds,
      status, 
      notes,
      checklistCompleted 
    } = req.body;

    if (!vehicleId || !serviceOrderId || !start || !end) {
      return res.status(400).json({ success: false, message: 'Veículo, ordem de serviço, início e fim são obrigatórios' });
    }

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Veículo não encontrado' });
    }

    // Verificar se veículo está em manutenção
    if (vehicle.status === 'em_manutencao') {
      return res.status(400).json({ success: false, message: 'Veículo está em manutenção e não pode ser agendado' });
    }

    const startDate = parseDate(start, 'start');
    const endDate = parseDate(end, 'end');
    const schedStartDate = scheduledStart ? parseDate(scheduledStart, 'scheduledStart') : startDate;
    const schedEndDate = scheduledEnd ? parseDate(scheduledEnd, 'scheduledEnd') : endDate;

    if (startDate >= endDate) {
      return res.status(400).json({ success: false, message: 'Horário final deve ser após o horário inicial' });
    }

    if (schedStartDate >= schedEndDate) {
      return res.status(400).json({ success: false, message: 'Horário agendado final deve ser após o horário inicial' });
    }

    // Verificar conflitos de agendamento (veículo e equipe)
    const conflicts = await DeliveryRoute.getSchedulingConflicts(
      vehicleId, 
      teamIds || [], 
      schedStartDate, 
      schedEndDate
    );

    if (conflicts.vehicle) {
      return res.status(409).json({ 
        success: false, 
        message: 'Veículo indisponível para o período selecionado',
        conflict: {
          type: 'vehicle',
          existingRoute: conflicts.vehicle
        }
      });
    }

    if (conflicts.teamMembers.length > 0) {
      return res.status(409).json({ 
        success: false, 
        message: 'Um ou mais membros da equipe estão indisponíveis para o período selecionado',
        conflict: {
          type: 'team',
          conflicts: conflicts.teamMembers
        }
      });
    }

    // Validar membros da equipe
    if (teamIds && teamIds.length > 0) {
      const teamMembers = await ProductionEmployee.find({ _id: { $in: teamIds } });
      if (teamMembers.length !== teamIds.length) {
        return res.status(404).json({ success: false, message: 'Um ou mais membros da equipe não foram encontrados' });
      }

      // Verificar se membros estão ativos
      const inactiveMembers = teamMembers.filter(member => !member.active);
      if (inactiveMembers.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Um ou mais membros da equipe estão inativos',
          inactiveMembers: inactiveMembers.map(m => m.name)
        });
      }
    }

    const route = await DeliveryRoute.create({
      vehicle: vehicleId,
      serviceOrderId,
      start: startDate,
      end: endDate,
      scheduledStart: schedStartDate,
      scheduledEnd: schedEndDate,
      type: type || 'delivery',
      teamIds: teamIds || [],
      status: status || 'scheduled',
      notes,
      checklistCompleted: checklistCompleted || false,
    });

    const populated = await route.populate('vehicle teamIds');
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

// Novo endpoint: Verificar disponibilidade de recursos (veículos e funcionários)
exports.getResourceAvailability = async (req, res) => {
  try {
    const { type, start, end, role } = req.query;

    if (!type || !start || !end) {
      return res.status(400).json({ 
        success: false, 
        message: 'Parâmetros obrigatórios: type (vehicle|employee), start e end' 
      });
    }

    if (!['vehicle', 'employee'].includes(type)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Type deve ser "vehicle" ou "employee"' 
      });
    }

    const startDate = parseDate(start, 'start');
    const endDate = parseDate(end, 'end');

    if (startDate >= endDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Data final deve ser após a data inicial' 
      });
    }

    let availableResources = [];

    if (type === 'vehicle') {
      // Buscar todos os veículos disponíveis
      const vehicles = await Vehicle.find({ 
        status: { $in: ['disponivel', 'em_uso'] }
      });

      // Verificar disponibilidade de cada veículo no período
      for (const vehicle of vehicles) {
        const isAvailable = await DeliveryRoute.isVehicleAvailable(
          vehicle._id, 
          startDate, 
          endDate
        );

        if (isAvailable) {
          availableResources.push({
            id: vehicle._id,
            name: vehicle.name,
            licensePlate: vehicle.licensePlate,
            type: vehicle.type,
            capacity: vehicle.capacity,
            status: vehicle.status,
            nextMaintenanceDate: vehicle.nextMaintenanceDate
          });
        }
      }
    } else if (type === 'employee') {
      // Buscar funcionários disponíveis no período
      const employees = await ProductionEmployee.getAvailableInPeriod(
        startDate, 
        endDate, 
        role || null
      );

      availableResources = employees.map(emp => ({
        id: emp._id,
        name: emp.name,
        role: emp.role,
        availability: emp.availability,
        skills: emp.skills,
        email: emp.email,
        phone: emp.phone
      }));
    }

    res.json({ 
      success: true, 
      type,
      period: {
        start: startDate,
        end: endDate
      },
      count: availableResources.length,
      resources: availableResources 
    });

  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : 'Erro ao verificar disponibilidade de recursos',
      error: error.message,
    });
  }
};

// Criar rota de instalação após entrega
exports.createInstallationRoute = async (req, res) => {
  try {
    const { 
      serviceOrderId, 
      scheduledStart, 
      scheduledEnd, 
      teamIds, 
      vehicleId, 
      notes 
    } = req.body;

    // Validar dados obrigatórios
    if (!serviceOrderId || !scheduledStart || !scheduledEnd || !teamIds || teamIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Dados obrigatórios: serviceOrderId, scheduledStart, scheduledEnd, teamIds'
      });
    }

    // Verificar se a OS existe e está entregue
    const serviceOrder = await ServiceOrder.findById(serviceOrderId);
    if (!serviceOrder) {
      return res.status(404).json({
        success: false,
        message: 'Ordem de Serviço não encontrada'
      });
    }

    if (serviceOrder.logisticsStatus !== 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'A OS deve estar com status "delivered" para criar rota de instalação'
      });
    }

    // Verificar se já existe rota de instalação para esta OS
    const existingRoute = await DeliveryRoute.findOne({
      serviceOrderId,
      type: 'installation'
    });

    if (existingRoute) {
      return res.status(400).json({
        success: false,
        message: 'Já existe uma rota de instalação para esta OS'
      });
    }

    // Validar datas
    const startDate = parseDate(scheduledStart, 'scheduledStart');
    const endDate = parseDate(scheduledEnd, 'scheduledEnd');

    if (startDate >= endDate) {
      return res.status(400).json({
        success: false,
        message: 'Data de fim deve ser posterior à data de início'
      });
    }

    // Verificar disponibilidade da equipe
    for (const teamMemberId of teamIds) {
      const isAvailable = await DeliveryRoute.isTeamMemberAvailable(
        teamMemberId, 
        startDate, 
        endDate
      );
      
      if (!isAvailable) {
        return res.status(400).json({
          success: false,
          message: `Membro da equipe ${teamMemberId} não está disponível no período`
        });
      }
    }

    // Verificar disponibilidade do veículo (se fornecido)
    if (vehicleId) {
      const isVehicleAvailable = await DeliveryRoute.isVehicleAvailable(
        vehicleId, 
        startDate, 
        endDate
      );
      
      if (!isVehicleAvailable) {
        return res.status(400).json({
          success: false,
          message: 'Veículo não está disponível no período'
        });
      }
    }

    // Criar a rota de instalação
    const installationRoute = new DeliveryRoute({
      vehicle: vehicleId || null,
      serviceOrderId,
      type: 'installation',
      scheduledStart: startDate,
      scheduledEnd: endDate,
      start: startDate, // Compatibilidade
      end: endDate, // Compatibilidade
      teamIds,
      status: 'pending',
      notes: notes || ''
    });

    await installationRoute.save();

    // Atualizar status da OS para aguardando instalação
    serviceOrder.logisticsStatus = 'in_installation';
    serviceOrder.installation_confirmed = true;
    await serviceOrder.save();

    // Atribuir equipe às tarefas
    for (const teamMemberId of teamIds) {
      const employee = await ProductionEmployee.findById(teamMemberId);
      if (employee) {
        await employee.assignToTask(installationRoute._id, 'delivery_route');
      }
    }

    // Popular dados para resposta
    await installationRoute.populate('vehicle');
    await installationRoute.populate('teamIds');

    res.status(201).json({
      success: true,
      message: 'Rota de instalação criada com sucesso',
      data: installationRoute
    });

  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : 'Erro ao criar rota de instalação',
      error: error.message,
    });
  }
};
