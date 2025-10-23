# Backend - Melhorias de Agendamento e Gestão de Recursos

## 📋 Resumo das Implementações

Este documento descreve as melhorias implementadas no backend para aprimorar o gerenciamento de entregas, instalações e recursos (veículos e equipes).

---

## 🗂️ Modelos Atualizados

### 1. **DeliveryRoute** (`backend/models/DeliveryRoute.js`)

#### Novos Campos:
- `type`: String (enum: `delivery`, `installation`) - Tipo da rota
- `scheduledStart`: Date - Horário agendado de início
- `scheduledEnd`: Date - Horário agendado de término
- `actualStart`: Date - Horário real de início
- `actualEnd`: Date - Horário real de término
- `teamIds`: [ObjectId] - Referências a `ProductionEmployee`
- `checklistCompleted`: Boolean - Status do checklist
- `photos`: Array de objetos `{ url, description }` - Fotos da entrega/instalação
- `customerSignature`: Objeto `{ url, timestamp }` - Assinatura do cliente

#### Novos Métodos Estáticos:
- `isVehicleAvailable(vehicleId, start, end, excludeRouteId)` - Verifica disponibilidade de veículo
- `isTeamMemberAvailable(teamMemberId, start, end, excludeRouteId)` - Verifica disponibilidade de membro da equipe
- `getSchedulingConflicts(vehicleId, teamIds, start, end, excludeRouteId)` - Retorna todos os conflitos de agendamento

#### Índices Criados:
- `{ vehicle, start, end }` - Otimização de consultas por veículo e período
- `{ teamIds, scheduledStart, scheduledEnd }` - Otimização de consultas por equipe
- `{ status, scheduledStart }` - Otimização de consultas por status e data

---

### 2. **Vehicle** (`backend/models/Vehicle.js`)

#### Novos Campos:
- `lastMaintenanceDate`: Date - Data da última manutenção
- `nextMaintenanceDate`: Date - Data da próxima manutenção

#### Validações Adicionadas:
- Veículos em manutenção não podem ser agendados
- Sistema verifica status antes de criar rotas

---

### 3. **ProductionEmployee** (NOVO - `backend/models/ProductionEmployee.js`)

#### Campos:
- `name`: String (obrigatório) - Nome do funcionário
- `email`: String - Email
- `phone`: String - Telefone
- `role`: String (enum: `installer`, `driver`, `helper`, `technician`, `other`) - Função
- `availability`: String (enum: `available`, `on_task`, `on_leave`) - Disponibilidade atual
- `currentTaskId`: String - ID da tarefa atual
- `currentTaskType`: String (enum: `delivery_route`, `service_order`) - Tipo da tarefa atual
- `skills`: [String] - Habilidades do funcionário
- `hireDate`: Date - Data de contratação
- `notes`: String - Observações
- `active`: Boolean - Status ativo/inativo

#### Métodos Estáticos:
- `isAvailableInPeriod(employeeId, start, end)` - Verifica se funcionário está disponível em período
- `getAvailableInPeriod(start, end, role)` - Retorna funcionários disponíveis em período (com filtro opcional por função)

#### Métodos de Instância:
- `assignToTask(taskId, taskType)` - Atribui funcionário a uma tarefa
- `releaseFromTask()` - Libera funcionário de tarefa

#### Índices:
- `{ availability, active }` - Consultas por disponibilidade
- `{ role, availability }` - Consultas por função e disponibilidade

---

### 4. **ServiceOrder** (`backend/models/ServiceOrder.js`)

#### Campos Removidos:
- ❌ `deliveryScheduledDate` - Agora gerenciado por `DeliveryRoute`
- ❌ `deliveryTeamIds` - Agora gerenciado por `DeliveryRoute`

**Motivo**: Centralizar o agendamento e gestão de equipes no modelo `DeliveryRoute` para evitar duplicação e inconsistências.

---

## 🎯 Controladores Atualizados

### 1. **deliveryRouteController** (`backend/controllers/deliveryRouteController.js`)

#### Método `createRoute` - Melhorias:

**Validações Adicionadas:**
1. ✅ Verifica se veículo existe
2. ✅ Verifica se veículo está em manutenção
3. ✅ Valida datas (start < end, scheduledStart < scheduledEnd)
4. ✅ Verifica conflitos de agendamento do veículo
5. ✅ Verifica conflitos de agendamento da equipe
6. ✅ Valida existência de membros da equipe
7. ✅ Verifica se membros da equipe estão ativos

**Resposta de Erro Detalhada:**
```json
{
  "success": false,
  "message": "Veículo indisponível para o período selecionado",
  "conflict": {
    "type": "vehicle",
    "existingRoute": { ... }
  }
}
```

ou

```json
{
  "success": false,
  "message": "Um ou mais membros da equipe estão indisponíveis",
  "conflict": {
    "type": "team",
    "conflicts": [
      {
        "memberId": "...",
        "conflict": { ... }
      }
    ]
  }
}
```

#### Novo Endpoint: `getResourceAvailability`

**Rota**: `GET /api/delivery-routes/resources/availability`

**Query Parameters**:
- `type` (obrigatório): `vehicle` ou `employee`
- `start` (obrigatório): Data de início (ISO 8601)
- `end` (obrigatório): Data de término (ISO 8601)
- `role` (opcional, apenas para employee): Filtrar por função

**Exemplo de Uso**:
```bash
# Buscar veículos disponíveis
GET /api/delivery-routes/resources/availability?type=vehicle&start=2024-01-15T08:00:00Z&end=2024-01-15T18:00:00Z

# Buscar instaladores disponíveis
GET /api/delivery-routes/resources/availability?type=employee&start=2024-01-15T08:00:00Z&end=2024-01-15T18:00:00Z&role=installer
```

**Resposta de Sucesso**:
```json
{
  "success": true,
  "type": "vehicle",
  "period": {
    "start": "2024-01-15T08:00:00.000Z",
    "end": "2024-01-15T18:00:00.000Z"
  },
  "count": 3,
  "resources": [
    {
      "id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "name": "Fiat Fiorino",
      "licensePlate": "ABC-1234",
      "type": "van",
      "capacity": 650,
      "status": "disponivel",
      "nextMaintenanceDate": "2024-02-01"
    },
    ...
  ]
}
```

---

### 2. **productionEmployeeController** (NOVO - `backend/controllers/productionEmployeeController.js`)

#### Endpoints CRUD:

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/production-employees` | Listar funcionários (com filtros) |
| GET | `/api/production-employees/:id` | Buscar funcionário por ID |
| POST | `/api/production-employees` | Criar funcionário |
| PUT | `/api/production-employees/:id` | Atualizar funcionário |
| DELETE | `/api/production-employees/:id` | Desativar funcionário (soft delete) |

#### Endpoints de Gestão de Tarefas:

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/production-employees/:id/assign` | Atribuir funcionário a tarefa |
| POST | `/api/production-employees/:id/release` | Liberar funcionário de tarefa |

#### Exemplo - Criar Funcionário:
```bash
POST /api/production-employees
Content-Type: application/json

{
  "name": "João Silva",
  "email": "joao@example.com",
  "phone": "(11) 98765-4321",
  "role": "installer",
  "skills": ["granito", "mármore", "porcelanato"],
  "hireDate": "2024-01-01"
}
```

#### Exemplo - Atribuir a Tarefa:
```bash
POST /api/production-employees/65a1b2c3d4e5f6g7h8i9j0k1/assign
Content-Type: application/json

{
  "taskId": "route-123",
  "taskType": "delivery_route"
}
```

---

## 🚀 Como Usar

### 1. **Criar uma Rota com Validação Completa**

```javascript
POST /api/delivery-routes
Content-Type: application/json

{
  "vehicleId": "65a1b2c3d4e5f6g7h8i9j0k1",
  "serviceOrderId": "OS-2024-001",
  "start": "2024-01-15T08:00:00Z",
  "end": "2024-01-15T18:00:00Z",
  "scheduledStart": "2024-01-15T08:00:00Z",
  "scheduledEnd": "2024-01-15T18:00:00Z",
  "type": "delivery",
  "teamIds": [
    "65a1b2c3d4e5f6g7h8i9j0k2",
    "65a1b2c3d4e5f6g7h8i9j0k3"
  ],
  "status": "scheduled",
  "notes": "Cliente preferem entrega pela manhã"
}
```

### 2. **Verificar Recursos Disponíveis Antes de Agendar**

```javascript
// 1. Buscar veículos disponíveis
const vehiclesResponse = await fetch(
  '/api/delivery-routes/resources/availability?type=vehicle&start=2024-01-15T08:00:00Z&end=2024-01-15T18:00:00Z'
);

// 2. Buscar equipe disponível
const teamResponse = await fetch(
  '/api/delivery-routes/resources/availability?type=employee&start=2024-01-15T08:00:00Z&end=2024-01-15T18:00:00Z&role=installer'
);

// 3. Criar rota com recursos disponíveis
const routeResponse = await fetch('/api/delivery-routes', {
  method: 'POST',
  body: JSON.stringify({
    vehicleId: vehiclesResponse.resources[0].id,
    teamIds: teamResponse.resources.map(emp => emp.id),
    ...
  })
});
```

---

## 🔄 Fluxo de Trabalho Recomendado

### Agendamento de Entrega/Instalação:

1. **Verificar Disponibilidade**
   ```
   GET /api/delivery-routes/resources/availability
   ```

2. **Criar Rota**
   ```
   POST /api/delivery-routes
   ```
   *(Sistema valida automaticamente conflitos)*

3. **Iniciar Tarefa** (quando equipe sair)
   ```
   PUT /api/delivery-routes/:id
   { "status": "in_progress", "actualStart": "2024-01-15T08:30:00Z" }
   ```

4. **Finalizar Tarefa**
   ```
   PUT /api/delivery-routes/:id
   {
     "status": "completed",
     "actualEnd": "2024-01-15T17:45:00Z",
     "checklistCompleted": true,
     "photos": [...],
     "customerSignature": { "url": "...", "timestamp": "..." }
   }
   ```

---

## ⚠️ Observações Importantes

1. **Compatibilidade Retroativa**: Os campos `start` e `end` foram mantidos para compatibilidade com código existente. Use `scheduledStart` e `scheduledEnd` para novos desenvolvimentos.

2. **Soft Delete**: Funcionários são desativados (`active: false`) em vez de deletados para preservar histórico.

3. **Validação de Conflitos**: O sistema impede automaticamente agendamentos conflitantes de veículos e equipes.

4. **Status de Disponibilidade**: O campo `availability` em `ProductionEmployee` é atualizado automaticamente ao atribuir/liberar tarefas.

5. **Manutenção de Veículos**: Veículos com status `em_manutencao` não podem ser agendados.

---

## 📊 Estatísticas de Implementação

- ✅ 3 Modelos atualizados
- ✅ 1 Novo modelo criado
- ✅ 2 Controllers atualizados/criados
- ✅ 1 Novo endpoint de disponibilidade
- ✅ 7 Novos endpoints CRUD (ProductionEmployee)
- ✅ 5 Índices de banco criados
- ✅ Validações de conflito implementadas

---

## 🧪 Testes Recomendados

1. Criar múltiplas rotas com sobreposição de horários (deve rejeitar)
2. Agendar veículo em manutenção (deve rejeitar)
3. Agendar funcionário já alocado (deve rejeitar)
4. Buscar recursos disponíveis em diferentes períodos
5. Atribuir e liberar funcionários de tarefas
6. Verificar atualização automática de `availability`

---

## 📞 Suporte

Para dúvidas ou problemas, consulte a documentação da API ou entre em contato com a equipe de desenvolvimento.

**Versão**: 1.0.0  
**Data**: Janeiro 2025  
**Autor**: Sistema ERP Marmoraria

