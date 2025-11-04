// Script de teste para verificar os cenários de logística
// Este script simula as operações do frontend para testar os hooks do backend

const API_URL = 'http://localhost:5000/api';

// Função para fazer requisições autenticadas
async function makeAuthenticatedRequest(url, options = {}) {
    const token = localStorage.getItem('token') || 'test-token';
    return fetch(url, {
        ...options,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...options.headers
        }
    });
}

// Função para criar um ServiceOrder de teste
async function createTestServiceOrder() {
    const testServiceOrder = {
        orderId: 'PED-TEST-001',
        clientName: 'Cliente Teste',
        deliveryAddress: {
            address: 'Rua Teste, 123',
            number: '123',
            complement: 'Apto 45',
            neighborhood: 'Centro',
            city: 'São Paulo',
            uf: 'SP',
            cep: '01234-567'
        },
        items: [
            {
                type: 'material',
                description: 'Mármore Carrara 60x60',
                quantity: 10,
                unitPrice: 150,
                totalPrice: 1500
            }
        ],
        total: 1500,
        deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 dias no futuro
        assignedToIds: [],
        productionStatus: 'finishing',
        logisticsStatus: 'awaiting_scheduling',
        finalizationType: 'delivery_installation',
        observations: 'OS de teste para verificar hooks de logística'
    };

    try {
        const response = await makeAuthenticatedRequest(`${API_URL}/service-orders`, {
            method: 'POST',
            body: JSON.stringify(testServiceOrder)
        });

        if (response.ok) {
            const result = await response.json();
            console.log('✅ ServiceOrder criada:', result.data);
            return result.data;
        } else {
            console.error('❌ Erro ao criar ServiceOrder:', await response.text());
            return null;
        }
    } catch (error) {
        console.error('❌ Erro na requisição:', error);
        return null;
    }
}

// Função para atualizar status de produção
async function updateProductionStatus(serviceOrderId, status) {
    try {
        const response = await makeAuthenticatedRequest(`${API_URL}/service-orders/${serviceOrderId}`, {
            method: 'PATCH',
            body: JSON.stringify({ productionStatus: status })
        });

        if (response.ok) {
            const result = await response.json();
            console.log(`✅ Status de produção atualizado para ${status}:`, result.data);
            return result.data;
        } else {
            console.error('❌ Erro ao atualizar status de produção:', await response.text());
            return null;
        }
    } catch (error) {
        console.error('❌ Erro na requisição:', error);
        return null;
    }
}

// Função para agendar entrega
async function scheduleDelivery(serviceOrderId) {
    const scheduleData = {
        vehicleId: 'veh-1', // Assumindo que existe um veículo com ID 'veh-1'
        start: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 dias no futuro
        end: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(), // 4 horas depois
        teamIds: ['emp-1', 'emp-2'] // Assumindo que existem funcionários com esses IDs
    };

    try {
        const response = await makeAuthenticatedRequest(`${API_URL}/delivery-routes`, {
            method: 'POST',
            body: JSON.stringify({
                serviceOrderId,
                ...scheduleData
            })
        });

        if (response.ok) {
            const result = await response.json();
            console.log('✅ Entrega agendada:', result.data);
            return result.data;
        } else {
            console.error('❌ Erro ao agendar entrega:', await response.text());
            return null;
        }
    } catch (error) {
        console.error('❌ Erro na requisição:', error);
        return null;
    }
}

// Função para atualizar status da rota
async function updateRouteStatus(routeId, status) {
    try {
        const response = await makeAuthenticatedRequest(`${API_URL}/delivery-routes/${routeId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
        });

        if (response.ok) {
            const result = await response.json();
            console.log(`✅ Status da rota atualizado para ${status}:`, result.data);
            return result.data;
        } else {
            console.error('❌ Erro ao atualizar status da rota:', await response.text());
            return null;
        }
    } catch (error) {
        console.error('❌ Erro na requisição:', error);
        return null;
    }
}

// Função para buscar ServiceOrder atualizada
async function getServiceOrder(serviceOrderId) {
    try {
        const response = await makeAuthenticatedRequest(`${API_URL}/service-orders/${serviceOrderId}`);

        if (response.ok) {
            const result = await response.json();
            return result.data;
        } else {
            console.error('❌ Erro ao buscar ServiceOrder:', await response.text());
            return null;
        }
    } catch (error) {
        console.error('❌ Erro na requisição:', error);
        return null;
    }
}

// Função para cancelar rota
async function cancelRoute(routeId) {
    try {
        const response = await makeAuthenticatedRequest(`${API_URL}/delivery-routes/${routeId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            console.log('✅ Rota cancelada');
            return true;
        } else {
            console.error('❌ Erro ao cancelar rota:', await response.text());
            return false;
        }
    } catch (error) {
        console.error('❌ Erro na requisição:', error);
        return false;
    }
}

// Função principal de teste
async function testLogisticsScenarios() {
    console.log('🚀 Iniciando testes dos cenários de logística...\n');

    // Cenário 1: OS passa de finishing para ready_for_logistics
    console.log('📋 Cenário 1: OS passa de finishing para ready_for_logistics');
    const serviceOrder = await createTestServiceOrder();
    if (!serviceOrder) {
        console.error('❌ Falha ao criar ServiceOrder de teste');
        return;
    }

    console.log(`Status inicial: ${serviceOrder.productionStatus} / ${serviceOrder.logisticsStatus}`);

    // Atualizar para ready_for_logistics
    const updatedSO = await updateProductionStatus(serviceOrder.id, 'awaiting_logistics');
    if (updatedSO) {
        console.log(`✅ Status atualizado: ${updatedSO.productionStatus} / ${updatedSO.logisticsStatus}`);
    }

    // Aguardar um pouco para o hook processar
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verificar status atual
    const currentSO = await getServiceOrder(serviceOrder.id);
    if (currentSO) {
        console.log(`📊 Status atual: ${currentSO.productionStatus} / ${currentSO.logisticsStatus}`);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Cenário 2: Agendar entrega
    console.log('📋 Cenário 2: Agendar entrega');
    const route = await scheduleDelivery(serviceOrder.id);
    if (route) {
        console.log(`✅ Rota criada: ${route.id} com status ${route.status}`);
        
        // Aguardar um pouco para o hook processar
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Verificar se a OS mudou para scheduled
        const scheduledSO = await getServiceOrder(serviceOrder.id);
        if (scheduledSO) {
            console.log(`📊 Status após agendamento: ${scheduledSO.productionStatus} / ${scheduledSO.logisticsStatus}`);
        }
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Cenário 3: Iniciar rota
    console.log('📋 Cenário 3: Iniciar rota');
    if (route) {
        const inProgressRoute = await updateRouteStatus(route.id, 'in_progress');
        if (inProgressRoute) {
            console.log(`✅ Rota iniciada: ${inProgressRoute.status}`);
            
            // Aguardar um pouco para o hook processar
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Verificar se a OS mudou para in_transit
            const inTransitSO = await getServiceOrder(serviceOrder.id);
            if (inTransitSO) {
                console.log(`📊 Status após iniciar rota: ${inTransitSO.productionStatus} / ${inTransitSO.logisticsStatus}`);
            }
        }
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Cenário 4: Marcar rota como concluída
    console.log('📋 Cenário 4: Marcar rota como concluída');
    if (route) {
        const completedRoute = await updateRouteStatus(route.id, 'completed');
        if (completedRoute) {
            console.log(`✅ Rota concluída: ${completedRoute.status}`);
            
            // Aguardar um pouco para o hook processar
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Verificar se a OS mudou para delivered
            const deliveredSO = await getServiceOrder(serviceOrder.id);
            if (deliveredSO) {
                console.log(`📊 Status após concluir rota: ${deliveredSO.productionStatus} / ${deliveredSO.logisticsStatus}`);
            }
        }
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Cenário 5: Para OS com instalação - agendar instalação
    console.log('📋 Cenário 5: Agendar instalação para OS com instalação');
    if (serviceOrder.finalizationType === 'delivery_installation') {
        const installationRoute = await scheduleDelivery(serviceOrder.id);
        if (installationRoute) {
            console.log(`✅ Rota de instalação criada: ${installationRoute.id}`);
            
            // Aguardar um pouco para o hook processar
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Verificar status
            const withInstallationSO = await getServiceOrder(serviceOrder.id);
            if (withInstallationSO) {
                console.log(`📊 Status com instalação agendada: ${withInstallationSO.productionStatus} / ${withInstallationSO.logisticsStatus}`);
            }
        }
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Cenário 6: Cancelar rota
    console.log('📋 Cenário 6: Cancelar rota agendada');
    if (route) {
        const cancelled = await cancelRoute(route.id);
        if (cancelled) {
            console.log('✅ Rota cancelada');
            
            // Aguardar um pouco para o hook processar
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Verificar se a OS voltou para awaiting_scheduling
            const cancelledSO = await getServiceOrder(serviceOrder.id);
            if (cancelledSO) {
                console.log(`📊 Status após cancelar rota: ${cancelledSO.productionStatus} / ${cancelledSO.logisticsStatus}`);
            }
        }
    }

    console.log('\n🎉 Testes concluídos!');
}

// Executar testes se o script for executado diretamente
if (typeof window !== 'undefined') {
    // No navegador
    window.testLogisticsScenarios = testLogisticsScenarios;
    console.log('Script de teste carregado. Execute testLogisticsScenarios() no console do navegador.');
} else {
    // No Node.js
    testLogisticsScenarios().catch(console.error);
}
