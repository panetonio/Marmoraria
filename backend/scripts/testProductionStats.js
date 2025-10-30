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

// Função para criar dados de teste
const createTestData = async () => {
  console.log('📊 Criando dados de teste para estatísticas de produção...');

  // Criar uma OS de teste
  const testServiceOrder = new ServiceOrder({
    id: 'OS-TEST-STATS-' + Date.now(),
    orderId: new mongoose.Types.ObjectId(),
    clientName: 'Cliente Teste Stats',
    deliveryAddress: {
      cep: '01234567',
      uf: 'SP',
      city: 'São Paulo',
      neighborhood: 'Centro',
      address: 'Rua Teste Stats',
      number: '123',
      complement: ''
    },
    items: [{
      type: 'material',
      description: 'Mármore Teste',
      quantity: 1,
      unitPrice: 500,
      totalPrice: 500,
      width: 100,
      height: 100,
      materialId: new mongoose.Types.ObjectId().toString()
    }],
    total: 500,
    productionStatus: 'pending_production',
    deliveryDate: new Date(),
    priority: 'normal',
    assignedToIds: [new mongoose.Types.ObjectId().toString()],
    createdAt: new Date(),
    updatedAt: new Date()
  });

  await testServiceOrder.save();
  console.log('✅ ServiceOrder criada:', testServiceOrder._id);

  // Criar logs de atividade simulando mudanças de status
  const now = new Date();
  const logs = [
    {
      action: 'service_order_status_updated',
      description: 'Status da OS alterado de pending_production para cutting',
      serviceOrder: testServiceOrder._id,
      user: {
        id: new mongoose.Types.ObjectId(),
        name: 'Teste User',
        email: 'teste@teste.com',
        role: 'production'
      },
      createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000), // 5 horas atrás
      metadata: {
        oldStatus: 'pending_production',
        newStatus: 'cutting'
      }
    },
    {
      action: 'service_order_status_updated',
      description: 'Status da OS alterado de cutting para finishing',
      serviceOrder: testServiceOrder._id,
      user: {
        id: new mongoose.Types.ObjectId(),
        name: 'Teste User',
        email: 'teste@teste.com',
        role: 'production'
      },
      createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000), // 3 horas atrás
      metadata: {
        oldStatus: 'cutting',
        newStatus: 'finishing'
      }
    },
    {
      action: 'service_order_status_updated',
      description: 'Status da OS alterado de finishing para quality_check',
      serviceOrder: testServiceOrder._id,
      user: {
        id: new mongoose.Types.ObjectId(),
        name: 'Teste User',
        email: 'teste@teste.com',
        role: 'production'
      },
      createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000), // 1 hora atrás
      metadata: {
        oldStatus: 'finishing',
        newStatus: 'quality_check'
      }
    },
    {
      action: 'service_order_status_updated',
      description: 'Status da OS alterado de quality_check para awaiting_logistics',
      serviceOrder: testServiceOrder._id,
      user: {
        id: new mongoose.Types.ObjectId(),
        name: 'Teste User',
        email: 'teste@teste.com',
        role: 'production'
      },
      createdAt: new Date(now.getTime() - 30 * 60 * 1000), // 30 minutos atrás
      metadata: {
        oldStatus: 'quality_check',
        newStatus: 'awaiting_logistics'
      }
    }
  ];

  await ActivityLog.insertMany(logs);
  console.log('✅ Logs de atividade criados:', logs.length);

  return testServiceOrder._id;
};

// Função para testar o endpoint
const testProductionStats = async () => {
  try {
    console.log('🧪 Testando endpoint de estatísticas de produção...');

    // Simular requisição
    const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // 24 horas atrás
    const endDate = new Date().toISOString(); // agora

    // Pipeline simplificado para teste
    const pipeline = [
      {
        $match: {
          action: 'service_order_status_updated',
          createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
        }
      },
      {
        $sort: {
          serviceOrder: 1,
          createdAt: 1
        }
      },
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
      {
        $project: {
          _id: 1,
          statusChanges: 1,
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
          }
        }
      },
      {
        $group: {
          _id: null,
          averageCuttingTime: { $avg: '$cuttingTime' },
          averageFinishingTime: { $avg: '$finishingTime' },
          totalServiceOrders: { $sum: 1 }
        }
      }
    ];

    const result = await ActivityLog.aggregate(pipeline);
    console.log('📊 Resultado da agregação:', JSON.stringify(result, null, 2));

    // Processar resultado
    const stats = result.length > 0 ? result[0] : {
      averageCuttingTime: null,
      averageFinishingTime: null,
      averageAssemblyTime: null,
      averageQualityCheckTime: null,
      averageReadyForDeliveryTime: null,
      totalServiceOrders: 0,
      totalCuttingPhases: 0,
      totalFinishingPhases: 0,
      totalAssemblyPhases: 0,
      totalQualityCheckPhases: 0,
      totalReadyForDeliveryPhases: 0
    };

    // Converter tempos de milissegundos para horas
    const convertToHours = (ms) => ms ? Math.round((ms / (1000 * 60 * 60)) * 100) / 100 : null;

    console.log('\n📈 Estatísticas de Produção:');
    console.log('============================');
    console.log(`Tempo médio de corte: ${convertToHours(stats.averageCuttingTime)} horas`);
    console.log(`Tempo médio de acabamento: ${convertToHours(stats.averageFinishingTime)} horas`);
    console.log(`Tempo médio de montagem: ${convertToHours(stats.averageAssemblyTime)} horas`);
    console.log(`Tempo médio de controle de qualidade: ${convertToHours(stats.averageQualityCheckTime)} horas`);
    console.log(`Tempo médio para prontidão: ${convertToHours(stats.averageReadyForDeliveryTime)} horas`);
    console.log(`\nTotal de OSs: ${stats.totalServiceOrders}`);
    console.log(`Total de fases de corte: ${stats.totalCuttingPhases}`);
    console.log(`Total de fases de acabamento: ${stats.totalFinishingPhases}`);
    console.log(`Total de fases de montagem: ${stats.totalAssemblyPhases}`);
    console.log(`Total de fases de controle: ${stats.totalQualityCheckPhases}`);
    console.log(`Total de fases de prontidão: ${stats.totalReadyForDeliveryPhases}`);

  } catch (error) {
    console.error('❌ Erro ao testar estatísticas de produção:', error);
  }
};

// Função principal
const main = async () => {
  try {
    await connectDB();
    
    // Criar dados de teste
    const serviceOrderId = await createTestData();
    
    // Testar endpoint
    await testProductionStats();
    
    console.log('\n✅ Teste concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Conexão com MongoDB fechada');
  }
};

// Executar teste
main();
