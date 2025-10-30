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
const ServiceOrder = require('../models/ServiceOrder');
const ProductionEmployee = require('../models/ProductionEmployee');

// Função para criar dados de teste
const createTestData = async () => {
  console.log('📊 Criando dados de teste para produtividade de funcionários...');

  // Criar funcionários de teste
  const employees = [
    {
      name: 'João Silva',
      email: 'joao@teste.com',
      phone: '11999999999',
      role: 'installer',
      active: true,
      hireDate: new Date('2023-01-15')
    },
    {
      name: 'Maria Santos',
      email: 'maria@teste.com',
      phone: '11888888888',
      role: 'technician',
      active: true,
      hireDate: new Date('2023-03-20')
    },
    {
      name: 'Pedro Costa',
      email: 'pedro@teste.com',
      phone: '11777777777',
      role: 'driver',
      active: true,
      hireDate: new Date('2023-06-10')
    }
  ];

  const createdEmployees = await ProductionEmployee.insertMany(employees);
  console.log('✅ Funcionários criados:', createdEmployees.length);

  // Criar OSs de teste com diferentes status
  const now = new Date();
  const timestamp = Date.now();
  const serviceOrders = [
    {
      id: `OS-TEST-EMP-${timestamp}-001`,
      orderId: new mongoose.Types.ObjectId(),
      clientName: 'Cliente Teste 1',
      deliveryAddress: {
        cep: '01234567',
        uf: 'SP',
        city: 'São Paulo',
        neighborhood: 'Centro',
        address: 'Rua Teste 1',
        number: '123',
        complement: ''
      },
      items: [{
        type: 'material',
        description: 'Mármore Teste 1',
        quantity: 1,
        unitPrice: 1000,
        totalPrice: 1000,
        width: 100,
        height: 100,
        materialId: new mongoose.Types.ObjectId().toString()
      }],
      total: 1000,
      status: 'completed',
      productionStatus: 'awaiting_logistics',
      deliveryDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 dias atrás
      assignedToIds: [createdEmployees[0]._id.toString()],
      updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 dia atrás
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) // 3 dias atrás
    },
    {
      id: `OS-TEST-EMP-${timestamp}-002`,
      orderId: new mongoose.Types.ObjectId(),
      clientName: 'Cliente Teste 2',
      deliveryAddress: {
        cep: '01234567',
        uf: 'SP',
        city: 'São Paulo',
        neighborhood: 'Centro',
        address: 'Rua Teste 2',
        number: '456',
        complement: ''
      },
      items: [{
        type: 'material',
        description: 'Mármore Teste 2',
        quantity: 2,
        unitPrice: 1500,
        totalPrice: 3000,
        width: 150,
        height: 150,
        materialId: new mongoose.Types.ObjectId().toString()
      }],
      total: 3000,
      status: 'completed',
      productionStatus: 'awaiting_logistics',
      deliveryDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 dia atrás
      assignedToIds: [createdEmployees[0]._id.toString(), createdEmployees[1]._id.toString()],
      updatedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000), // 12 horas atrás
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) // 2 dias atrás
    },
    {
      id: `OS-TEST-EMP-${timestamp}-003`,
      orderId: new mongoose.Types.ObjectId(),
      clientName: 'Cliente Teste 3',
      deliveryAddress: {
        cep: '01234567',
        uf: 'SP',
        city: 'São Paulo',
        neighborhood: 'Centro',
        address: 'Rua Teste 3',
        number: '789',
        complement: ''
      },
      items: [{
        type: 'material',
        description: 'Mármore Teste 3',
        quantity: 1,
        unitPrice: 2000,
        totalPrice: 2000,
        width: 200,
        height: 200,
        materialId: new mongoose.Types.ObjectId().toString()
      }],
      total: 2000,
      status: 'completed',
      productionStatus: 'awaiting_logistics',
      deliveryDate: new Date(now.getTime() - 6 * 60 * 60 * 1000), // 6 horas atrás
      assignedToIds: [createdEmployees[1]._id.toString()],
      updatedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 horas atrás
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000) // 1 dia atrás
    },
    {
      id: `OS-TEST-EMP-${timestamp}-004`,
      orderId: new mongoose.Types.ObjectId(),
      clientName: 'Cliente Teste 4',
      deliveryAddress: {
        cep: '01234567',
        uf: 'SP',
        city: 'São Paulo',
        neighborhood: 'Centro',
        address: 'Rua Teste 4',
        number: '101',
        complement: ''
      },
      items: [{
        type: 'material',
        description: 'Mármore Teste 4',
        quantity: 3,
        unitPrice: 800,
        totalPrice: 2400,
        width: 120,
        height: 120,
        materialId: new mongoose.Types.ObjectId().toString()
      }],
      total: 2400,
      status: 'completed',
      productionStatus: 'awaiting_logistics',
      deliveryDate: new Date(now.getTime() - 3 * 60 * 60 * 1000), // 3 horas atrás
      assignedToIds: [createdEmployees[2]._id.toString()],
      updatedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000), // 1 hora atrás
      createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000) // 12 horas atrás
    }
  ];

  await ServiceOrder.insertMany(serviceOrders);
  console.log('✅ ServiceOrders criadas:', serviceOrders.length);

  return { employees: createdEmployees, serviceOrders };
};

// Função para testar o pipeline
const testEmployeeProductivityPipeline = async () => {
  try {
    console.log('🧪 Testando pipeline de produtividade de funcionários...');

    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 dias atrás
    const endDate = new Date(); // agora

    // Pipeline de agregação para calcular produtividade por funcionário
    const pipeline = [
      // 1. Filtrar OSs completadas no período
      {
        $match: {
          status: 'completed',
          updatedAt: { $gte: startDate, $lte: endDate }
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
      // 6. Filtrar apenas funcionários ativos
      {
        $match: {
          'employeeData.active': true
        }
      },
      // 7. Projetar dados formatados
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
      // 8. Ordenar por total de OSs completadas (descendente)
      {
        $sort: {
          totalOSCompleted: -1,
          totalValueCompleted: -1
        }
      }
    ];

    // Executar agregação
    const result = await ServiceOrder.aggregate(pipeline);
    console.log('📊 Resultado da agregação:', JSON.stringify(result, null, 2));

    // Calcular estatísticas gerais
    const totalEmployees = result.length;
    const totalOSCompleted = result.reduce((sum, emp) => sum + emp.totalOSCompleted, 0);
    const totalValueCompleted = result.reduce((sum, emp) => sum + emp.totalValueCompleted, 0);
    const avgOSPerEmployee = totalEmployees > 0 ? Math.round((totalOSCompleted / totalEmployees) * 100) / 100 : 0;
    const avgValuePerEmployee = totalEmployees > 0 ? Math.round((totalValueCompleted / totalEmployees) * 100) / 100 : 0;

    console.log('\n📈 Produtividade de Funcionários:');
    console.log('==================================');
    console.log(`Total de funcionários: ${totalEmployees}`);
    console.log(`Total de OSs completadas: ${totalOSCompleted}`);
    console.log(`Valor total completado: R$ ${totalValueCompleted.toFixed(2)}`);
    console.log(`Média de OSs por funcionário: ${avgOSPerEmployee}`);
    console.log(`Média de valor por funcionário: R$ ${avgValuePerEmployee.toFixed(2)}`);

    console.log('\n👥 Detalhes por funcionário:');
    result.forEach((emp, index) => {
      console.log(`${index + 1}. ${emp.name} (${emp.role})`);
      console.log(`   - OSs completadas: ${emp.totalOSCompleted}`);
      console.log(`   - Valor total: R$ ${emp.totalValueCompleted.toFixed(2)}`);
      console.log(`   - Valor médio por OS: R$ ${emp.averageValuePerOS.toFixed(2)}`);
      console.log(`   - Email: ${emp.email}`);
      console.log('');
    });

    return {
      success: true,
      data: {
        period: { start: startDate, end: endDate },
        summary: {
          totalEmployees,
          totalOSCompleted,
          totalValueCompleted,
          avgOSPerEmployee,
          avgValuePerEmployee
        },
        employees: result
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
    
    // Criar dados de teste
    await createTestData();
    
    // Testar pipeline
    const result = await testEmployeeProductivityPipeline();
    
    if (result.success) {
      console.log('\n✅ Teste do pipeline concluído com sucesso!');
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
