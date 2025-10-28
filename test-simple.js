// Script simples para testar os cenários de logística
const fetch = require('node-fetch');

const API_URL = 'http://localhost:5000/api';

async function testBasicConnection() {
    console.log('🔍 Testando conexão básica com o backend...');
    
    try {
        // Testar se o servidor está respondendo
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'test@test.com',
                password: 'test'
            })
        });

        const result = await response.text();
        console.log('📡 Resposta do servidor:', result);
        
        if (response.status === 401 || response.status === 400) {
            console.log('✅ Servidor está respondendo (erro de autenticação esperado)');
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('❌ Erro de conexão:', error.message);
        return false;
    }
}

async function testServiceOrderCreation() {
    console.log('📋 Testando criação de ServiceOrder...');
    
    try {
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

        const response = await fetch(`${API_URL}/service-orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testServiceOrder)
        });

        const result = await response.text();
        console.log('📡 Resposta da criação de ServiceOrder:', result);
        
        if (response.ok) {
            const data = JSON.parse(result);
            console.log('✅ ServiceOrder criada com sucesso:', data.data);
            return data.data;
        } else {
            console.log('❌ Erro ao criar ServiceOrder:', result);
            return null;
        }
    } catch (error) {
        console.error('❌ Erro na criação de ServiceOrder:', error.message);
        return null;
    }
}

async function testDeliveryRouteCreation(serviceOrderId) {
    console.log('🚚 Testando criação de DeliveryRoute...');
    
    try {
        const routeData = {
            serviceOrderId,
            vehicleId: 'veh-1',
            start: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            end: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
            teamIds: ['emp-1', 'emp-2']
        };

        const response = await fetch(`${API_URL}/delivery-routes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(routeData)
        });

        const result = await response.text();
        console.log('📡 Resposta da criação de DeliveryRoute:', result);
        
        if (response.ok) {
            const data = JSON.parse(result);
            console.log('✅ DeliveryRoute criada com sucesso:', data.data);
            return data.data;
        } else {
            console.log('❌ Erro ao criar DeliveryRoute:', result);
            return null;
        }
    } catch (error) {
        console.error('❌ Erro na criação de DeliveryRoute:', error.message);
        return null;
    }
}

async function testRouteStatusUpdate(routeId, status) {
    console.log(`🔄 Testando atualização de status da rota para ${status}...`);
    
    try {
        const response = await fetch(`${API_URL}/delivery-routes/${routeId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });

        const result = await response.text();
        console.log(`📡 Resposta da atualização de status para ${status}:`, result);
        
        if (response.ok) {
            const data = JSON.parse(result);
            console.log(`✅ Status da rota atualizado para ${status}:`, data.data);
            return data.data;
        } else {
            console.log(`❌ Erro ao atualizar status da rota para ${status}:`, result);
            return null;
        }
    } catch (error) {
        console.error(`❌ Erro na atualização de status da rota para ${status}:`, error.message);
        return null;
    }
}

async function testServiceOrderStatus(serviceOrderId) {
    console.log('📊 Verificando status da ServiceOrder...');
    
    try {
        const response = await fetch(`${API_URL}/service-orders/${serviceOrderId}`);

        const result = await response.text();
        console.log('📡 Status da ServiceOrder:', result);
        
        if (response.ok) {
            const data = JSON.parse(result);
            console.log('✅ ServiceOrder encontrada:', data.data);
            return data.data;
        } else {
            console.log('❌ Erro ao buscar ServiceOrder:', result);
            return null;
        }
    } catch (error) {
        console.error('❌ Erro ao buscar ServiceOrder:', error.message);
        return null;
    }
}

async function main() {
    console.log('🚀 Iniciando testes dos cenários de logística...\n');

    // Teste 1: Conexão básica
    const connectionOk = await testBasicConnection();
    if (!connectionOk) {
        console.log('❌ Falha na conexão básica. Verifique se o backend está rodando.');
        return;
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // Teste 2: Criação de ServiceOrder
    const serviceOrder = await testServiceOrderCreation();
    if (!serviceOrder) {
        console.log('❌ Falha na criação de ServiceOrder. Verifique se as rotas estão configuradas.');
        return;
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // Teste 3: Criação de DeliveryRoute
    const route = await testDeliveryRouteCreation(serviceOrder.id);
    if (!route) {
        console.log('❌ Falha na criação de DeliveryRoute. Verifique se as rotas estão configuradas.');
        return;
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // Teste 4: Atualização de status da rota para in_progress
    const inProgressRoute = await testRouteStatusUpdate(route.id, 'in_progress');
    if (inProgressRoute) {
        // Aguardar um pouco para o hook processar
        console.log('⏳ Aguardando processamento do hook...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Verificar status da ServiceOrder
        const updatedSO = await testServiceOrderStatus(serviceOrder.id);
        if (updatedSO) {
            console.log(`📊 Status da ServiceOrder após iniciar rota: ${updatedSO.productionStatus} / ${updatedSO.logisticsStatus}`);
        }
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // Teste 5: Atualização de status da rota para completed
    const completedRoute = await testRouteStatusUpdate(route.id, 'completed');
    if (completedRoute) {
        // Aguardar um pouco para o hook processar
        console.log('⏳ Aguardando processamento do hook...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Verificar status da ServiceOrder
        const finalSO = await testServiceOrderStatus(serviceOrder.id);
        if (finalSO) {
            console.log(`📊 Status final da ServiceOrder: ${finalSO.productionStatus} / ${finalSO.logisticsStatus}`);
        }
    }

    console.log('\n🎉 Testes concluídos!');
}

main().catch(console.error);
