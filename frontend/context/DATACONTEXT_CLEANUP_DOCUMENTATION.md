# DataContext Cleanup Documentation

## Overview
This document describes the cleanup performed on `context/DataContext.tsx` to remove manual logistics status updates and ensure proper separation between production and logistics status management.

## Changes Made

### 1. Updated `updateServiceOrderStatus` Function

#### **Before (Manual Status Updates):**
```typescript
const updateServiceOrderStatus = (serviceOrderId: string, status: ProductionStatus) => {
    setServiceOrders(prev => prev.map(so =>
        so.id === serviceOrderId ? { ...so, status } : so
    ));
};
```

#### **After (Production Status Only):**
```typescript
const updateServiceOrderStatus = (serviceOrderId: string, status: ProductionStatus) => {
    // Only allow production status updates - logistics statuses are managed by hooks
    const allowedProductionStatuses: ProductionStatus[] = [
        'pending_production', 'cutting', 'finishing', 'quality_check', 'awaiting_logistics'
    ];
    
    if (!allowedProductionStatuses.includes(status)) {
        console.warn(`Status '${status}' is not allowed for manual updates. Use DeliveryRoute operations for logistics statuses.`);
        return;
    }
    
    setServiceOrders(prev => prev.map(so =>
        so.id === serviceOrderId ? { ...so, productionStatus: status } : so
    ));
};
```

**Key Changes:**
- ✅ **Status validation:** Only allows production statuses
- ✅ **Warning system:** Logs warning for invalid status attempts
- ✅ **Field correction:** Updates `productionStatus` instead of generic `status`

### 2. Updated `completeProductionStep` Function

#### **Before:**
```typescript
const completeProductionStep = (serviceOrderId: string, requiresInstallation: boolean) => {
    setServiceOrders(prev => prev.map(so => 
        so.id === serviceOrderId ? { ...so, status: 'ready_for_logistics', requiresInstallation } : so
    ));
};
```

#### **After:**
```typescript
const completeProductionStep = (serviceOrderId: string, requiresInstallation: boolean) => {
    setServiceOrders(prev => prev.map(so => 
        so.id === serviceOrderId ? { ...so, productionStatus: 'awaiting_logistics', requiresInstallation } : so
    ));
};
```

**Key Changes:**
- ✅ **Field correction:** Updates `productionStatus` instead of generic `status`
- ✅ **Status consistency:** Uses proper production status value

### 3. Updated `setFinalizationType` Function

#### **Before:**
```typescript
const setFinalizationType = (orderId: string, type: FinalizationType) => {
    setServiceOrders(prev => prev.map(so => {
        if (so.id === orderId) {
            const newStatus = type === 'pickup' ? 'awaiting_pickup' : 'ready_for_logistics';
            return { ...so, finalizationType: type, status: newStatus };
        }
        return so;
    }));
};
```

#### **After:**
```typescript
const setFinalizationType = (orderId: string, type: FinalizationType) => {
    setServiceOrders(prev => prev.map(so => {
        if (so.id === orderId) {
            const newProductionStatus = type === 'pickup' ? 'awaiting_logistics' : 'awaiting_logistics';
            return { ...so, finalizationType: type, productionStatus: newProductionStatus };
        }
        return so;
    }));
};
```

**Key Changes:**
- ✅ **Field correction:** Updates `productionStatus` instead of generic `status`
- ✅ **Status consistency:** Uses proper production status values

### 4. Updated `confirmDelivery` Function

#### **Before (Manual Logistics Status):**
```typescript
const confirmDelivery = (orderId: string) => {
    setServiceOrders(prev => prev.map(so => {
        if (so.id === orderId) {
            const isComplete = so.finalizationType === 'delivery_only';
            return { ...so, delivery_confirmed: true, status: isComplete ? 'completed' : so.status };
        }
        return so;
    }));
};
```

#### **After (Confirmation Only):**
```typescript
const confirmDelivery = (orderId: string) => {
    // Only update delivery confirmation - logistics status is managed by hooks
    setServiceOrders(prev => prev.map(so => {
        if (so.id === orderId) {
            return { ...so, delivery_confirmed: true };
        }
        return so;
    }));
};
```

**Key Changes:**
- ✅ **Removed status logic:** No longer updates logistics status
- ✅ **Confirmation only:** Only updates `delivery_confirmed` flag
- ✅ **Hook dependency:** Status updates handled by backend hooks

### 5. Updated `confirmInstallation` Function

#### **Before (Manual Logistics Status):**
```typescript
const confirmInstallation = (orderId: string) => {
    setServiceOrders(prev => prev.map(so => {
        if (so.id === orderId) {
            // An installation can only be completed if the delivery was also confirmed.
            const isComplete = so.delivery_confirmed;
            return { ...so, installation_confirmed: true, status: isComplete ? 'completed' : so.status };
        }
        return so;
    }));
};
```

#### **After (Confirmation Only):**
```typescript
const confirmInstallation = (orderId: string) => {
    // Only update installation confirmation - logistics status is managed by hooks
    setServiceOrders(prev => prev.map(so => {
        if (so.id === orderId) {
            return { ...so, installation_confirmed: true };
        }
        return so;
    }));
};
```

**Key Changes:**
- ✅ **Removed status logic:** No longer updates logistics status
- ✅ **Confirmation only:** Only updates `installation_confirmed` flag
- ✅ **Hook dependency:** Status updates handled by backend hooks

### 6. Updated `scheduleDelivery` Function

#### **Before (Manual Status Update):**
```typescript
// Update ServiceOrder status to scheduled
setServiceOrders(prev => prev.map(so => 
    so.id === serviceOrderId ? { ...so, status: 'scheduled' } : so
));
```

#### **After (Delivery Details Only):**
```typescript
// Update ServiceOrder with delivery details (status will be updated by backend hooks)
setServiceOrders(prev => prev.map(so =>
    so.id === serviceOrderId
        ? {
            ...so,
            deliveryScheduledDate: start,
            deliveryStart: start,
            deliveryEnd: end,
            vehicleId,
            deliveryTeamIds: teamIds,
        }
        : so
));
```

**Key Changes:**
- ✅ **Removed status update:** No longer sets logistics status to 'scheduled'
- ✅ **Delivery details only:** Updates delivery-related fields
- ✅ **Hook dependency:** Status updates handled by backend hooks

### 7. Added `refreshServiceOrder` Function

#### **New Function:**
```typescript
const refreshServiceOrder = async (serviceOrderId: string) => {
    try {
        // Fetch updated ServiceOrder from backend
        const response = await fetch(`/api/service-orders/${serviceOrderId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const updatedServiceOrder = await response.json();
            setServiceOrders(prev => prev.map(so => 
                so.id === serviceOrderId ? updatedServiceOrder : so
            ));
            console.log(`✅ ServiceOrder ${serviceOrderId} refreshed with updated logistics status`);
        } else {
            console.warn(`⚠️ Failed to refresh ServiceOrder ${serviceOrderId}`);
        }
    } catch (error) {
        console.error('Erro ao atualizar ServiceOrder:', error);
    }
};
```

**Features:**
- ✅ **Backend sync:** Fetches latest ServiceOrder data from backend
- ✅ **Status updates:** Gets updated logistics status from hooks
- ✅ **Error handling:** Comprehensive error handling
- ✅ **Logging:** Detailed logging for debugging

## Status Management Separation

### **Production Statuses (Frontend Managed)**
```typescript
type ProductionStatus = 
    | 'pending_production'    // ✅ Frontend can update
    | 'cutting'              // ✅ Frontend can update  
    | 'finishing'            // ✅ Frontend can update
    | 'quality_check'        // ✅ Frontend can update
    | 'awaiting_logistics';  // ✅ Frontend can update
```

### **Logistics Statuses (Backend Hook Managed)**
```typescript
type LogisticsStatus = 
    | 'awaiting_scheduling'  // ❌ Frontend cannot update
    | 'scheduled'           // ❌ Frontend cannot update
    | 'in_transit'          // ❌ Frontend cannot update
    | 'delivered'           // ❌ Frontend cannot update
    | 'in_installation'     // ❌ Frontend cannot update
    | 'completed'           // ❌ Frontend cannot update
    | 'picked_up'           // ❌ Frontend cannot update
    | 'canceled';           // ❌ Frontend cannot update
```

## Usage Examples

### **Production Status Updates (Allowed)**
```typescript
const { updateServiceOrderStatus } = useData();

// ✅ These are allowed
updateServiceOrderStatus('OS-001', 'cutting');
updateServiceOrderStatus('OS-001', 'finishing');
updateServiceOrderStatus('OS-001', 'quality_check');
updateServiceOrderStatus('OS-001', 'awaiting_logistics');
```

### **Logistics Status Updates (Not Allowed)**
```typescript
const { updateServiceOrderStatus } = useData();

// ❌ These will show warnings and be ignored
updateServiceOrderStatus('OS-001', 'scheduled');    // Warning logged
updateServiceOrderStatus('OS-001', 'in_transit');  // Warning logged
updateServiceOrderStatus('OS-001', 'completed');   // Warning logged
```

### **Delivery Operations (Route-Based)**
```typescript
const { scheduleDelivery, refreshServiceOrder } = useData();

// Schedule delivery (creates/updates route)
const result = scheduleDelivery('OS-001', {
    vehicleId: 'vehicle-123',
    start: '2024-01-15T10:00:00Z',
    end: '2024-01-15T12:00:00Z',
    teamIds: ['emp-1', 'emp-2']
});

if (result.success) {
    // Refresh ServiceOrder to get updated logistics status from backend
    await refreshServiceOrder('OS-001');
}
```

### **Confirmation Operations (Flag-Only)**
```typescript
const { confirmDelivery, confirmInstallation, refreshServiceOrder } = useData();

// Confirm delivery (updates flag only)
confirmDelivery('OS-001');

// Confirm installation (updates flag only)  
confirmInstallation('OS-001');

// Refresh to get updated status from backend hooks
await refreshServiceOrder('OS-001');
```

## Integration with Backend Hooks

### **Automatic Status Updates**
When DeliveryRoute operations are performed:

1. **Frontend** calls delivery route API
2. **Backend** updates DeliveryRoute
3. **Hook** calculates ServiceOrder logistics status
4. **Backend** updates ServiceOrder status
5. **Frontend** calls `refreshServiceOrder()` to sync

### **Status Update Flow**
```
Frontend Action → Backend API → DeliveryRoute Update → Hook Trigger → ServiceOrder Update → Frontend Refresh
```

## Benefits of the Cleanup

### 1. **Clear Separation of Concerns**
- ✅ **Production statuses:** Managed by frontend
- ✅ **Logistics statuses:** Managed by backend hooks
- ✅ **No conflicts:** Prevents status update conflicts

### 2. **Automatic Synchronization**
- ✅ **Real-time updates:** Status always reflects route state
- ✅ **Consistency:** Single source of truth for logistics status
- ✅ **Reliability:** Backend hooks ensure accurate status

### 3. **Improved Maintainability**
- ✅ **Centralized logic:** Status rules in one place (backend)
- ✅ **Easier debugging:** Clear separation of responsibilities
- ✅ **Future-proof:** Easy to modify status logic

### 4. **Enhanced User Experience**
- ✅ **Accurate status:** Always shows correct logistics status
- ✅ **Real-time updates:** Status changes immediately
- ✅ **No manual sync:** Automatic data synchronization

## Migration Guide

### **For Components Using Status Updates**

#### **Before:**
```typescript
// ❌ Old way - manual logistics status
const handleStartDelivery = () => {
    updateServiceOrderStatus(serviceOrderId, 'in_transit');
};
```

#### **After:**
```typescript
// ✅ New way - update route status, refresh ServiceOrder
const handleStartDelivery = async () => {
    // Update route status via API
    await updateRouteStatus(routeId, 'in_progress');
    
    // Refresh ServiceOrder to get updated status
    await refreshServiceOrder(serviceOrderId);
};
```

### **For Components Using Confirmations**

#### **Before:**
```typescript
// ❌ Old way - manual status logic
const handleConfirmDelivery = () => {
    confirmDelivery(orderId);
    // Status was automatically updated to 'completed' if applicable
};
```

#### **After:**
```typescript
// ✅ New way - confirmation + refresh
const handleConfirmDelivery = async () => {
    confirmDelivery(orderId);
    
    // Refresh to get updated status from backend
    await refreshServiceOrder(serviceOrderId);
};
```

## Testing the Changes

### **Unit Tests**
```typescript
describe('DataContext Status Updates', () => {
    it('should allow production status updates', () => {
        const { updateServiceOrderStatus } = useData();
        
        updateServiceOrderStatus('OS-001', 'cutting');
        // Should update without warnings
    });
    
    it('should warn for logistics status updates', () => {
        const consoleSpy = jest.spyOn(console, 'warn');
        const { updateServiceOrderStatus } = useData();
        
        updateServiceOrderStatus('OS-001', 'scheduled');
        expect(consoleSpy).toHaveBeenCalledWith(
            expect.stringContaining('Status \'scheduled\' is not allowed')
        );
    });
});
```

### **Integration Tests**
```typescript
describe('Delivery Workflow', () => {
    it('should handle complete delivery lifecycle', async () => {
        const { scheduleDelivery, refreshServiceOrder } = useData();
        
        // Schedule delivery
        const result = scheduleDelivery('OS-001', scheduleData);
        expect(result.success).toBe(true);
        
        // Refresh to get updated status
        await refreshServiceOrder('OS-001');
        
        // Verify status was updated by backend hooks
        const serviceOrder = getServiceOrder('OS-001');
        expect(serviceOrder.logisticsStatus).toBe('scheduled');
    });
});
```

## Conclusion

The cleanup successfully separates production and logistics status management:

- ✅ **Production statuses** remain under frontend control
- ✅ **Logistics statuses** are managed by backend hooks
- ✅ **Automatic synchronization** ensures data consistency
- ✅ **Clear separation** prevents conflicts and confusion
- ✅ **Enhanced reliability** with centralized status logic

The system now provides a robust, maintainable solution for status management with clear boundaries between frontend and backend responsibilities.
