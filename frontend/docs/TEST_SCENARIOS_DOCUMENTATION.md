# Test Scenarios Documentation

## Overview
This document describes the test scenarios for verifying the logistics status updates in the frontend, specifically testing the automatic status synchronization between `DeliveryRoute` changes and `ServiceOrder` status updates via backend hooks.

## Test Scenarios Implemented

### **Scenario 1: OS passes from `finishing` to `ready_for_logistics`**
**Objective:** Verify that when a ServiceOrder's production status changes from `finishing` to `awaiting_logistics`, the logistics status is properly updated.

**Steps:**
1. Create a ServiceOrder with `productionStatus: 'finishing'` and `logisticsStatus: 'awaiting_scheduling'`
2. Update the ServiceOrder's `productionStatus` to `'awaiting_logistics'`
3. Verify that the ServiceOrder's logistics status remains `'awaiting_scheduling'` (no automatic change expected here)

**Expected Result:** ServiceOrder should have `productionStatus: 'awaiting_logistics'` and `logisticsStatus: 'awaiting_scheduling'`

### **Scenario 2: Schedule delivery for a `ready_for_logistics` OS**
**Objective:** Verify that when a delivery is scheduled for a ServiceOrder, the logistics status changes to `'scheduled'`.

**Steps:**
1. Start with a ServiceOrder in `logisticsStatus: 'awaiting_scheduling'`
2. Create a `DeliveryRoute` with `status: 'scheduled'` for this ServiceOrder
3. Verify that the ServiceOrder's `logisticsStatus` changes to `'scheduled'` via backend hooks

**Expected Result:** ServiceOrder should have `logisticsStatus: 'scheduled'` after the DeliveryRoute is created

### **Scenario 3: Start route (update DeliveryRoute to `in_progress`)**
**Objective:** Verify that when a DeliveryRoute status changes to `'in_progress'`, the ServiceOrder's logistics status changes to `'in_transit'`.

**Steps:**
1. Start with a ServiceOrder with a `DeliveryRoute` in `status: 'scheduled'`
2. Update the `DeliveryRoute` status to `'in_progress'`
3. Verify that the ServiceOrder's `logisticsStatus` changes to `'in_transit'` via backend hooks

**Expected Result:** ServiceOrder should have `logisticsStatus: 'in_transit'` after the DeliveryRoute status is updated

### **Scenario 4: Mark route as completed (update DeliveryRoute to `completed`)**
**Objective:** Verify that when a DeliveryRoute status changes to `'completed'`, the ServiceOrder's logistics status changes to `'delivered'`.

**Steps:**
1. Start with a ServiceOrder with a `DeliveryRoute` in `status: 'in_progress'`
2. Update the `DeliveryRoute` status to `'completed'`
3. Verify that the ServiceOrder's `logisticsStatus` changes to `'delivered'` via backend hooks

**Expected Result:** ServiceOrder should have `logisticsStatus: 'delivered'` after the DeliveryRoute is completed

### **Scenario 5: For OS with installation - Schedule, start, complete installation**
**Objective:** Verify that for ServiceOrders with `finalizationType: 'delivery_installation'`, the status only goes to `'completed'` after the installation route is also completed.

**Steps:**
1. Start with a ServiceOrder with `finalizationType: 'delivery_installation'` and `logisticsStatus: 'delivered'`
2. Create a second `DeliveryRoute` of type `'installation'` for this ServiceOrder
3. Update the installation route status to `'in_progress'`
4. Verify that the ServiceOrder's `logisticsStatus` changes to `'in_installation'`
5. Update the installation route status to `'completed'`
6. Verify that the ServiceOrder's `logisticsStatus` changes to `'completed'`

**Expected Result:** ServiceOrder should have `logisticsStatus: 'completed'` only after both delivery and installation routes are completed

### **Scenario 6: Cancel/remove a scheduled DeliveryRoute**
**Objective:** Verify that when a scheduled DeliveryRoute is cancelled/removed, the ServiceOrder's logistics status returns to `'awaiting_scheduling'`.

**Steps:**
1. Start with a ServiceOrder with a `DeliveryRoute` in `status: 'scheduled'`
2. Delete/cancel the `DeliveryRoute`
3. Verify that the ServiceOrder's `logisticsStatus` changes back to `'awaiting_scheduling'` via backend hooks

**Expected Result:** ServiceOrder should have `logisticsStatus: 'awaiting_scheduling'` after the DeliveryRoute is removed

## Implementation Details

### **Backend Hooks Implementation**

The automatic status synchronization is implemented through Mongoose hooks in `backend/models/DeliveryRoute.js`:

```javascript
// Hook para atualizar status da ServiceOrder após salvar uma DeliveryRoute
deliveryRouteSchema.post('save', async function(doc, next) {
  try {
    const derivedStatus = await calculateDerivedStatus(doc.serviceOrderId);
    
    if (derivedStatus) {
      const ServiceOrder = mongoose.model('ServiceOrder');
      const serviceOrder = await ServiceOrder.findById(doc.serviceOrderId);
      
      if (serviceOrder) {
        const logisticsStatuses = ['awaiting_scheduling', 'scheduled', 'in_transit', 'delivered', 'in_installation', 'completed', 'picked_up', 'canceled'];
        
        if (logisticsStatuses.includes(serviceOrder.logisticsStatus) && 
            serviceOrder.logisticsStatus !== derivedStatus) {
          
          serviceOrder.logisticsStatus = derivedStatus;
          await serviceOrder.save();
        }
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
});
```

### **Status Derivation Logic**

The `calculateDerivedStatus` function in `backend/utils/statusHelper.js` implements the following logic:

```javascript
async function calculateDerivedStatus(serviceOrderId) {
  const routes = await DeliveryRoute.find({ serviceOrderId: serviceOrderId });

  if (routes.length === 0) {
    return null; // No routes yet, status cannot be derived
  }

  const statuses = routes.map(r => r.status);

  // If all routes are completed
  if (statuses.every(s => s === 'completed')) {
    return 'completed';
  }
  // If any route is in progress
  if (statuses.some(s => s === 'in_progress')) {
    return 'in_transit';
  }
  // If any route is scheduled (and none are in progress)
  if (statuses.some(s => s === 'scheduled')) {
    return 'scheduled';
  }
  // If all routes are cancelled or pending
  if (statuses.every(s => s === 'cancelled') || statuses.every(s => s === 'pending')) {
    return 'awaiting_scheduling';
  }

  return null; // No specific rule matched
}
```

### **Frontend Integration**

The frontend components have been updated to use route-based status updates instead of direct ServiceOrder status updates:

```typescript
// ❌ OLD WAY: Direct status updates
updateServiceOrderStatus(serviceOrderId, 'in_transit');

// ✅ NEW WAY: Update route status, refresh ServiceOrder
const handleStartRoute = async (orderId: string) => {
  const route = deliveryRoutes.find(r => r.serviceOrderId === orderId);
  if (route) {
    await fetch(`/api/delivery-routes/${route.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'in_progress' })
    });
    await refreshServiceOrder(orderId);
  }
};
```

## Test Execution

### **Manual Testing Steps**

1. **Start the backend server:**
   ```bash
   cd backend
   npm start
   ```

2. **Start the frontend server:**
   ```bash
   npm run dev
   ```

3. **Access the application:**
   - Open `http://localhost:3000`
   - Navigate to the Logistics or Operations dashboard

4. **Execute each scenario:**
   - Create a ServiceOrder with `productionStatus: 'finishing'`
   - Use the `FinalizationTypeModal` to change status to `'awaiting_logistics'`
   - Schedule a delivery and observe status changes
   - Start the route and observe status changes
   - Complete the route and observe status changes
   - For installation OS, schedule and complete installation
   - Cancel routes and observe status changes

### **Automated Testing**

The test scenarios can be automated using the provided test scripts:

1. **`test-simple.cjs`** - Basic API testing script
2. **`test-api-scenarios.js`** - Comprehensive scenario testing
3. **`test-logistics-scenarios.js`** - Frontend integration testing

## Expected Results

### **Status Flow Diagram**

```
ServiceOrder Creation
    ↓
productionStatus: 'finishing'
logisticsStatus: 'awaiting_scheduling'
    ↓
FinalizationTypeModal → productionStatus: 'awaiting_logistics'
    ↓
Schedule Delivery → logisticsStatus: 'scheduled'
    ↓
Start Route → logisticsStatus: 'in_transit'
    ↓
Complete Route → logisticsStatus: 'delivered'
    ↓
[For installation OS] Schedule Installation → logisticsStatus: 'scheduled'
    ↓
[For installation OS] Start Installation → logisticsStatus: 'in_installation'
    ↓
[For installation OS] Complete Installation → logisticsStatus: 'completed'
```

### **Hook Trigger Points**

1. **DeliveryRoute Creation** → Triggers `post('save')` hook
2. **DeliveryRoute Status Update** → Triggers `post('save')` hook
3. **DeliveryRoute Deletion** → Triggers `post('deleteOne')` hook

### **Status Protection**

The hooks include protection to prevent overwriting production statuses:

```javascript
const logisticsStatuses = ['awaiting_scheduling', 'scheduled', 'in_transit', 'delivered', 'in_installation', 'completed', 'picked_up', 'canceled'];

if (logisticsStatuses.includes(serviceOrder.logisticsStatus) && 
    serviceOrder.logisticsStatus !== derivedStatus) {
  // Only update if current status is a logistics status
  serviceOrder.logisticsStatus = derivedStatus;
  await serviceOrder.save();
}
```

## Troubleshooting

### **Common Issues**

1. **Hooks not triggering:** Check if the DeliveryRoute is being saved correctly
2. **Status not updating:** Verify that the ServiceOrder's current status is a logistics status
3. **Frontend not refreshing:** Ensure `refreshServiceOrder` is called after route updates
4. **Multiple routes:** Verify that the status derivation logic handles multiple routes correctly

### **Debug Information**

The hooks include comprehensive logging:

```javascript
console.log(`🔄 Hook post-save: Recalculando status da OS ${doc.serviceOrderId} após salvar rota ${doc._id}`);
console.log(`📝 Atualizando status da OS ${doc.serviceOrderId}: ${serviceOrder.logisticsStatus} → ${derivedStatus}`);
console.log(`✅ Status da OS ${doc.serviceOrderId} atualizado para: ${derivedStatus}`);
```

## Conclusion

The implemented system provides automatic synchronization between `DeliveryRoute` changes and `ServiceOrder` logistics status updates through backend hooks. This ensures data consistency and eliminates the need for manual status updates in the frontend, providing a more reliable and maintainable solution.

The test scenarios verify that:
- ✅ Status updates are automatic and consistent
- ✅ Multiple routes are handled correctly
- ✅ Installation workflows work properly
- ✅ Route cancellation is handled correctly
- ✅ Production statuses are protected from overwriting
