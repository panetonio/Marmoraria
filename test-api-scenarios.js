// Script de teste para verificar os cenários de logística via API
const API_URL = 'http://localhost:5000/api';

// Função para fazer requisições
async function makeRequest(url, options = {}) {
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('❌ Erro na requisição:', error);
        throw error;
    }
}

// Função para criar um ServiceOrder de teste
async function createTestServiceOrder() {
    console.log('📋 Criando ServiceOrder de teste...');
    
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
        deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        assignedToIds: [],
        productionStatus: 'finishing',
        logisticsStatus: 'awaiting_scheduling',
        finalizationType: 'delivery_installation',
        observations: 'OS de teste para verificar hooks de logística'
    };

    const result = await makeRequest(`${API_URL}/service-orders`, {
        method: 'POST',
        body: JSON.stringify(testServiceOrder)
    });

    console.log('✅ ServiceOrder criada:', result.data);
    return result.data;
}

// Função para atualizar status de produção
async function updateProductionStatus(serviceOrderId, status) {
    console.log(`📋 Atualizando status de produção para ${status}...`);
    
    const result = await makeRequest(`${API_URL}/service-orders/${serviceOrderId}`, {
        method: 'PATCH',
        body: JSON.stringify({ productionStatus: status })
    });

    console.log(`✅ Status de produção atualizado:`, result.data);
    return result.data;
}

// Função para agendar entrega
async function scheduleDelivery(serviceOrderId) {
    console.log('📋 Agendando entrega...');
    
    const scheduleData = {
        serviceOrderId,
        vehicleId: 'veh-1',
        start: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
        teamIds: ['emp-1', 'emp-2']
    };

    const result = await makeRequest(`${API_URL}/delivery-routes`, {
        method: 'POST',
        body: JSON.stringify(scheduleData)
    });

    console.log('✅ Entrega agendada:', result.data);
    return result.data;
}

// Função para atualizar status da rota
async function updateRouteStatus(routeId, status) {
    console.log(`📋 Atualizando status da rota para ${status}...`);
    
    const result = await makeRequest(`${API_URL}/delivery-routes/${routeId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
    });

    console.log(`✅ Status da rota atualizado:`, result.data);
    return result.data;
}

// Função para buscar ServiceOrder
async function getServiceOrder(serviceOrderId) {
    const result = await makeRequest(`${API_URL}/service-orders/${serviceOrderId}`);
    return result.data;
}

// Função para cancelar rota
async function cancelRoute(routeId) {
    console.log(`📋 Cancelando rota ${routeId}...`);
    
    await makeRequest(`${API_URL}/delivery-routes/${routeId}`, {
        method: 'DELETE'
    });

    console.log('✅ Rota cancelada');
    return true;
}

// Função para aguardar
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Função principal de teste
async function testLogisticsScenarios() {
    console.log('🚀 Iniciando testes dos cenários de logística...\n');

    try {
        // Cenário 1: OS passa de finishing para ready_for_logistics
        console.log('📋 CENÁRIO 1: OS passa de finishing para ready_for_logistics');
        console.log('='.repeat(60));
        
        const serviceOrder = await createTestServiceOrder();
        console.log(`Status inicial: ${serviceOrder.productionStatus} / ${serviceOrder.logisticsStatus}`);

        // Atualizar para ready_for_logistics
        const updatedSO = await updateProductionStatus(serviceOrder.id, 'awaiting_logistics');
        console.log(`Status após atualização: ${updatedSO.productionStatus} / ${updatedSO.logisticsStatus}`);

        // Aguardar e verificar status atual
        await wait(2000);
        const currentSO = await getServiceOrder(serviceOrder.id);
        console.log(`📊 Status final: ${currentSO.productionStatus} / ${currentSO.logisticsStatus}`);
        console.log('✅ Cenário 1 concluído\n');

        // Cenário 2: Agendar entrega
        console.log('📋 CENÁRIO 2: Agendar entrega');
        console.log('='.repeat(60));
        
        const route = await scheduleDelivery(serviceOrder.id);
        console.log(`Rota criada: ${route.id} com status ${route.status}`);
        
        // Aguardar e verificar se a OS mudou para scheduled
        await wait(2000);
        const scheduledSO = await getServiceOrder(serviceOrder.id);
        console.log(`📊 Status após agendamento: ${scheduledSO.productionStatus} / ${scheduledSO.logisticsStatus}`);
        console.log('✅ Cenário 2 concluído\n');

        // Cenário 3: Iniciar rota
        console.log('📋 CENÁRIO 3: Iniciar rota');
        console.log('='.repeat(60));
        
        const inProgressRoute = await updateRouteStatus(route.id, 'in_progress');
        console.log(`Rota iniciada: ${inProgressRoute.status}`);
        
        // Aguardar e verificar se a OS mudou para in_transit
        await wait(2000);
        const inTransitSO = await getServiceOrder(serviceOrder.id);
        console.log(`📊 Status após iniciar rota: ${inTransitSO.productionStatus} / ${inTransitSO.logisticsStatus}`);
        console.log('✅ Cenário 3 concluído\n');

        // Cenário 4: Marcar rota como concluída
        console.log('📋 CENÁRIO 4: Marcar rota como concluída');
        console.log('='.repeat(60));
        
        const completedRoute = await updateRouteStatus(route.id, 'completed');
        console.log(`Rota concluída: ${completedRoute.status}`);
        
        // Aguardar e verificar se a OS mudou para delivered
        await wait(2000);
        const deliveredSO = await getServiceOrder(serviceOrder.id);
        console.log(`📊 Status após concluir rota: ${deliveredSO.productionStatus} / ${deliveredSO.logisticsStatus}`);
        console.log('✅ Cenário 4 concluído\n');

        // Cenário 5: Para OS com instalação - agendar instalação
        console.log('📋 CENÁRIO 5: Agendar instalação para OS com instalação');
        console.log('='.repeat(60));
        
        if (serviceOrder.finalizationType === 'delivery_installation') {
            const installationRoute = await scheduleDelivery(serviceOrder.id);
            console.log(`Rota de instalação criada: ${installationRoute.id}`);
            
            // Aguardar e verificar status
            await wait(2000);
            const withInstallationSO = await getServiceOrder(serviceOrder.id);
            console.log(`📊 Status com instalação agendada: ${withInstallationSO.productionStatus} / ${withInstallationSO.logisticsStatus}`);
        }
        console.log('✅ Cenário 5 concluído\n');

        // Cenário 6: Cancelar rota
        console.log('📋 CENÁRIO 6: Cancelar rota agendada');
        console.log('='.repeat(60));
        
        const cancelled = await cancelRoute(route.id);
        if (cancelled) {
            console.log('Rota cancelada');
            
            // Aguardar e verificar se a OS voltou para awaiting_scheduling
            await wait(2000);
            const cancelledSO = await getServiceOrder(serviceOrder.id);
            console.log(`📊 Status após cancelar rota: ${cancelledSO.productionStatus} / ${cancelledSO.logisticsStatus}`);
        }
        console.log('✅ Cenário 6 concluído\n');

        console.log('🎉 Todos os testes concluídos com sucesso!');

    } catch (error) {
        console.error('❌ Erro durante os testes:', error);
    }
}

// Executar testes
testLogisticsScenarios();
