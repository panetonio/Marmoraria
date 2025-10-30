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

// Endpoint de produtividade de funcionários usando Aggregation Framework
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

    // Pipeline de agregação para calcular produtividade por funcionário
    const pipeline = [
      // 1. Filtrar OSs completadas no período
      {
        $match: {
          status: 'completed',
          updatedAt: { $gte: start, $lte: end }
        }
      },
      // 2. Desagrupar o array assignedToIds
      {
        $unwind: '$assignedToIds'
      },
      // 3. Agrupar por funcionário
      {
        $group: {
          _id: '$assignedToIds',
          totalOSCompleted: { $sum: 1 },
          totalValueCompleted: { $sum: '$total' },
          completedOrders: {
            $push: {
              serviceOrderId: '$_id',
              clientName: '$clientName',
              total: '$total',
              completedAt: '$updatedAt'
            }
          }
        }
      },
      // 4. Fazer lookup com ProductionEmployee (convertendo string para ObjectId com tratamento de erro)
      {
        $lookup: {
          from: 'productionemployees',
          let: { 
            employeeId: {
              $cond: {
                if: { $eq: [{ $strLenCP: '$_id' }, 24] },
                then: { $toObjectId: '$_id' },
                else: null
              }
            }
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $ne: ['$$employeeId', null] },
                    { $eq: ['$_id', '$$employeeId'] }
                  ]
                }
              }
            }
          ],
          as: 'employeeData'
        }
      },
      // 5. Desagrupar o array employeeData (deve ter apenas 1 elemento)
      {
        $unwind: {
          path: '$employeeData',
          preserveNullAndEmptyArrays: true
        }
      },
      // 6. Aplicar filtros adicionais se fornecidos
      ...(role ? [{
        $match: {
          'employeeData.role': role
        }
      }] : []),
      ...(employeeId ? [{
        $match: {
          '_id': employeeId
        }
      }] : []),
      // 7. Filtrar apenas funcionários ativos
      {
        $match: {
          'employeeData.active': true
        }
      },
      // 8. Projetar dados formatados
      {
        $project: {
          employeeId: '$_id',
          name: '$employeeData.name',
          role: '$employeeData.role',
          email: '$employeeData.email',
          phone: '$employeeData.phone',
          hireDate: '$employeeData.hireDate',
          totalOSCompleted: 1,
          totalValueCompleted: 1,
          averageValuePerOS: {
            $cond: {
              if: { $gt: ['$totalOSCompleted', 0] },
              then: { $divide: ['$totalValueCompleted', '$totalOSCompleted'] },
              else: 0
            }
          },
          completedOrders: {
            $slice: ['$completedOrders', 5] // Últimas 5 OSs
          }
        }
      },
      // 9. Ordenar por total de OSs completadas (descendente)
      {
        $sort: {
          totalOSCompleted: -1,
          totalValueCompleted: -1
        }
      }
    ];

    // Executar agregação
    const result = await ServiceOrder.aggregate(pipeline);

    // Calcular estatísticas gerais
    const totalEmployees = result.length;
    const totalOSCompleted = result.reduce((sum, emp) => sum + emp.totalOSCompleted, 0);
    const totalValueCompleted = result.reduce((sum, emp) => sum + emp.totalValueCompleted, 0);
    const avgOSPerEmployee = totalEmployees > 0 ? Math.round((totalOSCompleted / totalEmployees) * 100) / 100 : 0;
    const avgValuePerEmployee = totalEmployees > 0 ? Math.round((totalValueCompleted / totalEmployees) * 100) / 100 : 0;

    // Top performers (top 3)
    const topPerformers = result.slice(0, 3).map(emp => ({
      name: emp.name,
      role: emp.role,
      totalOSCompleted: emp.totalOSCompleted,
      totalValueCompleted: emp.totalValueCompleted
    }));

    // Funcionários que precisam melhorar (últimos 3)
    const needsImprovement = result.slice(-3).reverse().map(emp => ({
      name: emp.name,
      role: emp.role,
      totalOSCompleted: emp.totalOSCompleted,
      totalValueCompleted: emp.totalValueCompleted
    }));

    res.json({
      success: true,
      data: {
        period: { start, end },
        summary: {
          totalEmployees,
          totalOSCompleted,
          totalValueCompleted,
          avgOSPerEmployee,
          avgValuePerEmployee,
          topPerformers,
          needsImprovement
        },
        employees: result
      }
    });

  } catch (error) {
    console.error('Erro ao buscar produtividade de funcionários:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : 'Erro ao buscar dados de produtividade de funcionários',
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

// Endpoint de estatísticas de produção usando Aggregation Framework
exports.getProductionStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

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

    // Pipeline simplificado para calcular tempos de produção
    const pipeline = [
      // 1. Filtrar logs de atualização de status de OS no período
      {
        $match: {
          action: 'service_order_status_updated',
          createdAt: { $gte: start, $lte: end }
        }
      },
      // 2. Ordenar por serviceOrder e createdAt
      {
        $sort: {
          serviceOrder: 1,
          createdAt: 1
        }
      },
      // 3. Agrupar por serviceOrder para coletar todas as mudanças de status
      {
        $group: {
          _id: '$serviceOrder',
          statusChanges: {
            $push: {
              status: '$metadata.newStatus',
              timestamp: '$createdAt',
              oldStatus: '$metadata.oldStatus'
            }
          }
        }
      },
      // 4. Calcular tempos de cada fase
      {
        $project: {
          _id: 1,
          cuttingTime: {
            $let: {
              vars: {
                cuttingStart: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: '$statusChanges',
                        cond: { $eq: ['$$this.status', 'cutting'] }
                      }
                    },
                    0
                  ]
                },
                cuttingEnd: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: '$statusChanges',
                        cond: { $eq: ['$$this.status', 'finishing'] }
                      }
                    },
                    0
                  ]
                }
              },
              in: {
                $cond: {
                  if: { $and: ['$$cuttingStart', '$$cuttingEnd'] },
                  then: { $subtract: ['$$cuttingEnd.timestamp', '$$cuttingStart.timestamp'] },
                  else: null
                }
              }
            }
          },
          finishingTime: {
            $let: {
              vars: {
                finishingStart: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: '$statusChanges',
                        cond: { $eq: ['$$this.status', 'finishing'] }
                      }
                    },
                    0
                  ]
                },
                finishingEnd: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: '$statusChanges',
                        cond: { $eq: ['$$this.status', 'quality_check'] }
                      }
                    },
                    0
                  ]
                }
              },
              in: {
                $cond: {
                  if: { $and: ['$$finishingStart', '$$finishingEnd'] },
                  then: { $subtract: ['$$finishingEnd.timestamp', '$$finishingStart.timestamp'] },
                  else: null
                }
              }
            }
          },
          qualityCheckTime: {
            $let: {
              vars: {
                qualityStart: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: '$statusChanges',
                        cond: { $eq: ['$$this.status', 'quality_check'] }
                      }
                    },
                    0
                  ]
                },
                qualityEnd: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: '$statusChanges',
                        cond: { $eq: ['$$this.status', 'awaiting_logistics'] }
                      }
                    },
                    0
                  ]
                }
              },
              in: {
                $cond: {
                  if: { $and: ['$$qualityStart', '$$qualityEnd'] },
                  then: { $subtract: ['$$qualityEnd.timestamp', '$$qualityStart.timestamp'] },
                  else: null
                }
              }
            }
          }
        }
      },
      // 5. Agrupar para calcular médias gerais
      {
        $group: {
          _id: null,
          averageCuttingTime: { $avg: '$cuttingTime' },
          averageFinishingTime: { $avg: '$finishingTime' },
          averageQualityCheckTime: { $avg: '$qualityCheckTime' },
          totalServiceOrders: { $sum: 1 },
          totalCuttingPhases: { $sum: { $cond: [{ $ne: ['$cuttingTime', null] }, 1, 0] } },
          totalFinishingPhases: { $sum: { $cond: [{ $ne: ['$finishingTime', null] }, 1, 0] } },
          totalQualityCheckPhases: { $sum: { $cond: [{ $ne: ['$qualityCheckTime', null] }, 1, 0] } }
        }
      }
    ];

    // Executar agregação
    const result = await ActivityLog.aggregate(pipeline);

    // Processar resultado
    const stats = result.length > 0 ? result[0] : {
      averageCuttingTime: null,
      averageFinishingTime: null,
      averageQualityCheckTime: null,
      totalServiceOrders: 0,
      totalCuttingPhases: 0,
      totalFinishingPhases: 0,
      totalQualityCheckPhases: 0
    };

    // Converter tempos de milissegundos para horas
    const convertToHours = (ms) => ms ? Math.round((ms / (1000 * 60 * 60)) * 100) / 100 : null;

    res.json({
      success: true,
      data: {
        period: { start, end },
        productionStats: {
          averageCuttingTime: convertToHours(stats.averageCuttingTime),
          averageFinishingTime: convertToHours(stats.averageFinishingTime),
          averageQualityCheckTime: convertToHours(stats.averageQualityCheckTime)
        },
        summary: {
          totalServiceOrders: stats.totalServiceOrders,
          totalCuttingPhases: stats.totalCuttingPhases,
          totalFinishingPhases: stats.totalFinishingPhases,
          totalQualityCheckPhases: stats.totalQualityCheckPhases
        }
      }
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas de produção:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : 'Erro ao buscar estatísticas de produção',
      error: error.message,
    });
  }
};