const ServiceOrder = require('../models/ServiceOrder');
const DeliveryRoute = require('../models/DeliveryRoute');
const ProductionEmployee = require('../models/ProductionEmployee');
const ActivityLog = require('../models/ActivityLog');

const parseDate = (value, field) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    const error = new Error(`Data inválida para ${field}`);
    error.statusCode = 400;
    throw error;
  }
  return date;
};

// Endpoint de produtividade de funcionários
exports.getEmployeeProductivity = async (req, res) => {
  try {
    const { startDate, endDate, role, employeeId } = req.query;

    // Validar datas
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Parâmetros obrigatórios: startDate e endDate'
      });
    }

    const start = parseDate(startDate, 'startDate');
    const end = parseDate(endDate, 'endDate');

    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: 'Data final deve ser posterior à data inicial'
      });
    }

    // Construir filtros para funcionários
    const employeeFilters = { active: true };
    if (role) {
      employeeFilters.role = role;
    }
    if (employeeId) {
      employeeFilters._id = employeeId;
    }

    // Buscar funcionários
    const employees = await ProductionEmployee.find(employeeFilters);

    // Agregar dados de produtividade para cada funcionário
    const productivityData = await Promise.all(
      employees.map(async (employee) => {
        // Buscar OSs atribuídas ao funcionário no período
        const serviceOrders = await ServiceOrder.find({
          assignedToIds: employee._id,
          deliveryDate: { $gte: start, $lte: end }
        });

        // Buscar rotas de entrega/instalação do funcionário no período
        const deliveryRoutes = await DeliveryRoute.find({
          teamIds: employee._id,
          scheduledStart: { $gte: start, $lte: end }
        });

        // Buscar logs de atividade do funcionário no período
        const activityLogs = await ActivityLog.find({
          userId: employee._id,
          timestamp: { $gte: start, $lte: end }
        });

        // Calcular métricas
        const totalOrders = serviceOrders.length;
        const completedOrders = serviceOrders.filter(so => so.isFinalized).length;
        const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

        const totalRoutes = deliveryRoutes.length;
        const completedRoutes = deliveryRoutes.filter(route => route.status === 'completed').length;
        const routeCompletionRate = totalRoutes > 0 ? (completedRoutes / totalRoutes) * 100 : 0;

        // Calcular tempo médio de conclusão
        const completedOrderTimes = serviceOrders
          .filter(so => so.isFinalized)
          .map(so => {
            const createdAt = new Date(so.createdAt);
            const finalizedAt = new Date(so.updatedAt);
            return finalizedAt.getTime() - createdAt.getTime();
          });

        const avgCompletionTime = completedOrderTimes.length > 0 
          ? completedOrderTimes.reduce((sum, time) => sum + time, 0) / completedOrderTimes.length
          : 0;

        // Calcular atividades por dia
        const activitiesByDay = {};
        activityLogs.forEach(log => {
          const day = new Date(log.timestamp).toISOString().split('T')[0];
          activitiesByDay[day] = (activitiesByDay[day] || 0) + 1;
        });

        const avgActivitiesPerDay = Object.keys(activitiesByDay).length > 0
          ? Object.values(activitiesByDay).reduce((sum, count) => sum + count, 0) / Object.keys(activitiesByDay).length
          : 0;

        // Calcular eficiência por função
        let efficiencyScore = 0;
        if (employee.role === 'cortador') {
          efficiencyScore = completionRate * 0.4 + routeCompletionRate * 0.3 + avgActivitiesPerDay * 0.3;
        } else if (employee.role === 'acabador') {
          efficiencyScore = completionRate * 0.5 + routeCompletionRate * 0.2 + avgActivitiesPerDay * 0.3;
        } else if (employee.role === 'montador') {
          efficiencyScore = routeCompletionRate * 0.6 + completionRate * 0.2 + avgActivitiesPerDay * 0.2;
        } else if (employee.role === 'entregador') {
          efficiencyScore = routeCompletionRate * 0.7 + completionRate * 0.1 + avgActivitiesPerDay * 0.2;
        } else {
          efficiencyScore = (completionRate + routeCompletionRate + avgActivitiesPerDay) / 3;
        }

        return {
          employeeId: employee._id,
          name: employee.name,
          role: employee.role,
          email: employee.email,
          phone: employee.phone,
          hireDate: employee.hireDate,
          metrics: {
            totalOrders,
            completedOrders,
            completionRate: Math.round(completionRate * 100) / 100,
            totalRoutes,
            completedRoutes,
            routeCompletionRate: Math.round(routeCompletionRate * 100) / 100,
            avgCompletionTime: Math.round(avgCompletionTime / (1000 * 60 * 60 * 24) * 100) / 100, // em dias
            totalActivities: activityLogs.length,
            avgActivitiesPerDay: Math.round(avgActivitiesPerDay * 100) / 100,
            efficiencyScore: Math.round(efficiencyScore * 100) / 100
          },
          activitiesByDay,
          recentOrders: serviceOrders.slice(0, 5).map(so => ({
            id: so._id,
            clientName: so.clientName,
            status: so.productionStatus,
            deliveryDate: so.deliveryDate,
            total: so.total
          })),
          recentRoutes: deliveryRoutes.slice(0, 5).map(route => ({
            id: route._id,
            type: route.type,
            status: route.status,
            scheduledStart: route.scheduledStart,
            scheduledEnd: route.scheduledEnd
          }))
        };
      })
    );

    // Ordenar por score de eficiência
    productivityData.sort((a, b) => b.metrics.efficiencyScore - a.metrics.efficiencyScore);

    // Calcular estatísticas gerais
    const totalEmployees = productivityData.length;
    const avgEfficiency = productivityData.length > 0 
      ? productivityData.reduce((sum, emp) => sum + emp.metrics.efficiencyScore, 0) / productivityData.length
      : 0;

    const topPerformers = productivityData.slice(0, 3);
    const needsImprovement = productivityData.slice(-3).reverse();

    res.json({
      success: true,
      data: {
        period: { start, end },
        summary: {
          totalEmployees,
          avgEfficiency: Math.round(avgEfficiency * 100) / 100,
          topPerformers: topPerformers.map(emp => ({
            name: emp.name,
            role: emp.role,
            efficiencyScore: emp.metrics.efficiencyScore
          })),
          needsImprovement: needsImprovement.map(emp => ({
            name: emp.name,
            role: emp.role,
            efficiencyScore: emp.metrics.efficiencyScore
          }))
        },
        employees: productivityData
      }
    });

  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : 'Erro ao buscar dados de produtividade',
      error: error.message,
    });
  }
};

// Endpoint de produtividade geral da empresa
exports.getCompanyProductivity = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Parâmetros obrigatórios: startDate e endDate'
      });
    }

    const start = parseDate(startDate, 'startDate');
    const end = parseDate(endDate, 'endDate');

    // Buscar todas as OSs no período
    const serviceOrders = await ServiceOrder.find({
      deliveryDate: { $gte: start, $lte: end }
    });

    // Buscar todas as rotas no período
    const deliveryRoutes = await DeliveryRoute.find({
      scheduledStart: { $gte: start, $lte: end }
    });

    // Calcular métricas gerais
    const totalOrders = serviceOrders.length;
    const completedOrders = serviceOrders.filter(so => so.isFinalized).length;
    const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

    const totalRoutes = deliveryRoutes.length;
    const completedRoutes = deliveryRoutes.filter(route => route.status === 'completed').length;
    const routeCompletionRate = totalRoutes > 0 ? (completedRoutes / totalRoutes) * 100 : 0;

    // Calcular receita total
    const totalRevenue = serviceOrders.reduce((sum, so) => sum + so.total, 0);
    const completedRevenue = serviceOrders
      .filter(so => so.isFinalized)
      .reduce((sum, so) => sum + so.total, 0);

    // Calcular produtividade por função
    const employees = await ProductionEmployee.find({ active: true });
    const productivityByRole = {};

    for (const employee of employees) {
      const role = employee.role;
      if (!productivityByRole[role]) {
        productivityByRole[role] = {
          totalEmployees: 0,
          totalOrders: 0,
          completedOrders: 0,
          totalRoutes: 0,
          completedRoutes: 0
        };
      }

      productivityByRole[role].totalEmployees++;

      // Contar OSs do funcionário
      const empOrders = serviceOrders.filter(so => so.assignedToIds.includes(employee._id));
      productivityByRole[role].totalOrders += empOrders.length;
      productivityByRole[role].completedOrders += empOrders.filter(so => so.isFinalized).length;

      // Contar rotas do funcionário
      const empRoutes = deliveryRoutes.filter(route => route.teamIds.includes(employee._id));
      productivityByRole[role].totalRoutes += empRoutes.length;
      productivityByRole[role].completedRoutes += empRoutes.filter(route => route.status === 'completed').length;
    }

    // Calcular eficiência por função
    const roleEfficiency = Object.keys(productivityByRole).map(role => {
      const data = productivityByRole[role];
      const orderCompletionRate = data.totalOrders > 0 ? (data.completedOrders / data.totalOrders) * 100 : 0;
      const routeCompletionRate = data.totalRoutes > 0 ? (data.completedRoutes / data.totalRoutes) * 100 : 0;
      
      return {
        role,
        totalEmployees: data.totalEmployees,
        orderCompletionRate: Math.round(orderCompletionRate * 100) / 100,
        routeCompletionRate: Math.round(routeCompletionRate * 100) / 100,
        avgEfficiency: Math.round((orderCompletionRate + routeCompletionRate) / 2 * 100) / 100
      };
    });

    res.json({
      success: true,
      data: {
        period: { start, end },
        summary: {
          totalOrders,
          completedOrders,
          completionRate: Math.round(completionRate * 100) / 100,
          totalRoutes,
          completedRoutes,
          routeCompletionRate: Math.round(routeCompletionRate * 100) / 100,
          totalRevenue,
          completedRevenue,
          revenueCompletionRate: totalRevenue > 0 ? Math.round((completedRevenue / totalRevenue) * 100 * 100) / 100 : 0
        },
        productivityByRole: roleEfficiency
      }
    });

  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : 'Erro ao buscar dados de produtividade da empresa',
      error: error.message,
    });
  }
};
