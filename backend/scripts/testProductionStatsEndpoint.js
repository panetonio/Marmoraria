const mongoose = require('mongoose');
require('dotenv').config();

// Conectar ao MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/marmoraria_erp');
    console.log('✅ Conectado ao MongoDB');
  } catch (error) {
    console.error('❌ Erro ao conectar ao MongoDB:', error);
    process.exit(1);
  }
};

// Modelos necessários
const ActivityLog = require('../models/ActivityLog');
const ServiceOrder = require('../models/ServiceOrder');

// Função para testar o pipeline diretamente
const testProductionStatsPipeline = async () => {
  try {
    console.log('🧪 Testando pipeline de estatísticas de produção...');

    const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 horas atrás
    const endDate = new Date(); // agora

    // Pipeline simplificado para calcular tempos de produção
    const pipeline = [
      // 1. Filtrar logs de atualização de status de OS no período
      {
        $match: {
          action: 'service_order_status_updated',
          createdAt: { $gte: startDate, $lte: endDate }
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
    console.log('📊 Resultado da agregação:', JSON.stringify(result, null, 2));

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

    console.log('\n📈 Estatísticas de Produção:');
    console.log('============================');
    console.log(`Tempo médio de corte: ${convertToHours(stats.averageCuttingTime)} horas`);
    console.log(`Tempo médio de acabamento: ${convertToHours(stats.averageFinishingTime)} horas`);
    console.log(`Tempo médio de controle de qualidade: ${convertToHours(stats.averageQualityCheckTime)} horas`);
    console.log(`\nTotal de OSs: ${stats.totalServiceOrders}`);
    console.log(`Total de fases de corte: ${stats.totalCuttingPhases}`);
    console.log(`Total de fases de acabamento: ${stats.totalFinishingPhases}`);
    console.log(`Total de fases de controle: ${stats.totalQualityCheckPhases}`);

    return {
      success: true,
      data: {
        period: { start: startDate, end: endDate },
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
    };

  } catch (error) {
    console.error('❌ Erro ao testar pipeline:', error);
    return { success: false, error: error.message };
  }
};

// Função principal
const main = async () => {
  try {
    await connectDB();
    
    // Testar pipeline
    const result = await testProductionStatsPipeline();
    
    if (result.success) {
      console.log('\n✅ Teste do pipeline concluído com sucesso!');
      console.log('📋 Resumo dos dados:', JSON.stringify(result.data, null, 2));
    } else {
      console.log('❌ Teste falhou:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Conexão com MongoDB fechada');
  }
};

// Executar teste
main();
