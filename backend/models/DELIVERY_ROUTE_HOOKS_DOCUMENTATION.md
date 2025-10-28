# DeliveryRoute Hooks Documentation

## Overview
The `DeliveryRoute.js` model now includes automatic hooks that update the associated ServiceOrder's logistics status whenever a delivery route is saved or deleted.

## Hooks Implemented

### 1. `post('save')` Hook
**Triggered:** After saving a DeliveryRoute (create or update)

**Functionality:**
- Recalculates the ServiceOrder's logistics status based on all associated routes
- Only updates if the current status is a logistics status
- Prevents overwriting production statuses (cutting, finishing, etc.)

**Logistics Statuses (can be auto-updated):**
- `awaiting_scheduling`
- `scheduled`
- `in_transit`
- `delivered`
- `completed`
- `picked_up`
- `canceled`

### 2. `post('deleteOne')` Hook
**Triggered:** After deleting a DeliveryRoute using `deleteOne()`

**Functionality:**
- Recalculates the ServiceOrder's logistics status based on remaining routes
- Handles cases where routes are removed/cancelled
- Same status validation as save hook

### 3. `post('findOneAndDelete')` Hook
**Triggered:** After deleting a DeliveryRoute using `findOneAndDelete()`

**Functionality:**
- Alternative hook for different deletion methods
- Same logic as `deleteOne` hook
- Ensures coverage for all deletion scenarios

## Status Update Logic

### When Status is Updated
```javascript
// Status is updated if:
1. Current ServiceOrder status is a logistics status
2. Derived status is different from current status
3. Derived status is not null

// Example:
// Current: 'scheduled' → Derived: 'in_transit' → ✅ Updated
// Current: 'cutting' → Derived: 'scheduled' → ❌ Not updated (production status)
// Current: 'scheduled' → Derived: 'scheduled' → ❌ Not updated (same status)
```

### When Status is NOT Updated
```javascript
// Status is NOT updated if:
1. Current status is a production status (cutting, finishing, quality_check, etc.)
2. Derived status is the same as current status
3. Derived status is null (no routes or unexpected state)
4. ServiceOrder is not found
```

## Usage Examples

### Creating a DeliveryRoute
```javascript
const DeliveryRoute = require('../models/DeliveryRoute');

// Create new route
const route = new DeliveryRoute({
  serviceOrderId: 'OS-001',
  vehicle: 'vehicle-id',
  status: 'scheduled',
  scheduledStart: new Date(),
  scheduledEnd: new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours later
});

await route.save();
// ✅ Hook automatically updates ServiceOrder status to 'scheduled'
```

### Updating Route Status
```javascript
// Update route status
route.status = 'in_progress';
await route.save();
// ✅ Hook automatically updates ServiceOrder status to 'in_transit'
```

### Deleting a Route
```javascript
// Delete route
await DeliveryRoute.deleteOne({ _id: routeId });
// ✅ Hook automatically recalculates ServiceOrder status based on remaining routes

// Or using findOneAndDelete
await DeliveryRoute.findOneAndDelete({ _id: routeId });
// ✅ Hook automatically recalculates ServiceOrder status
```

## Console Logging

The hooks provide detailed console logging for debugging:

```
🔄 Hook post-save: Recalculando status da OS OS-001 após salvar rota 507f1f77bcf86cd799439011
📝 Atualizando status da OS OS-001: scheduled → in_transit
✅ Status da OS OS-001 atualizado para: in_transit
```

### Log Levels
- **🔄 Info:** Hook triggered and processing
- **📝 Update:** Status change detected and applied
- **✅ Success:** Status successfully updated
- **⏭️ Skip:** Status not updated (with reason)
- **⚠️ Warning:** ServiceOrder not found or missing data
- **❌ Error:** Hook execution failed

## Error Handling

### Hook Error Handling
```javascript
// All hooks include try-catch blocks
try {
  // Hook logic
  next();
} catch (error) {
  console.error('❌ Erro no hook:', error);
  next(error); // Pass error to Mongoose
}
```

### Common Error Scenarios
1. **ServiceOrder not found:** Logs warning, continues execution
2. **Database connection issues:** Logs error, passes to Mongoose
3. **Invalid serviceOrderId:** Logs warning, continues execution
4. **Status calculation failure:** Logs error, continues execution

## Performance Considerations

### Database Queries
- Each hook performs 2-3 database queries:
  1. `calculateDerivedStatus()` - queries all DeliveryRoutes
  2. `ServiceOrder.findById()` - finds the ServiceOrder
  3. `serviceOrder.save()` - updates the ServiceOrder

### Optimization Tips
1. **Index on serviceOrderId:** Ensure DeliveryRoute collection has index on `serviceOrderId`
2. **Batch operations:** For bulk updates, consider disabling hooks temporarily
3. **Monitoring:** Monitor hook execution time in production

### Disabling Hooks (if needed)
```javascript
// Disable hooks for bulk operations
const route = new DeliveryRoute(data);
route.$locals.skipHooks = true; // Custom flag
await route.save();
```

## Integration with Controllers

### No Changes Required
Controllers don't need to be modified - hooks work automatically:

```javascript
// In deliveryRouteController.js
exports.createDeliveryRoute = async (req, res) => {
  try {
    const route = new DeliveryRoute(req.body);
    await route.save(); // Hook automatically updates ServiceOrder
    
    res.status(201).json(route);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateDeliveryRoute = async (req, res) => {
  try {
    const route = await DeliveryRoute.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true }
    ); // Hook automatically updates ServiceOrder
    
    res.json(route);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
```

## Testing

### Unit Tests
```javascript
// Test hook functionality
describe('DeliveryRoute Hooks', () => {
  it('should update ServiceOrder status when route is saved', async () => {
    const serviceOrder = await ServiceOrder.create({...});
    const route = await DeliveryRoute.create({
      serviceOrderId: serviceOrder._id,
      status: 'scheduled'
    });
    
    const updatedSO = await ServiceOrder.findById(serviceOrder._id);
    expect(updatedSO.logisticsStatus).toBe('scheduled');
  });
});
```

### Integration Tests
```javascript
// Test complete workflow
describe('DeliveryRoute Workflow', () => {
  it('should handle complete delivery lifecycle', async () => {
    // Create ServiceOrder
    // Create DeliveryRoute
    // Update route status
    // Verify ServiceOrder status changes
    // Delete route
    // Verify ServiceOrder status recalculates
  });
});
```

## Troubleshooting

### Common Issues

1. **Hook not triggering:**
   - Check if using `save()` method
   - Verify Mongoose version compatibility
   - Check for syntax errors in hook code

2. **Status not updating:**
   - Verify ServiceOrder exists
   - Check if current status is logistics status
   - Verify derived status calculation

3. **Performance issues:**
   - Monitor database query count
   - Check for missing indexes
   - Consider hook optimization

### Debug Mode
```javascript
// Enable detailed logging
process.env.DEBUG_HOOKS = 'true';

// In hook:
if (process.env.DEBUG_HOOKS) {
  console.log('Debug: Hook details', { doc, derivedStatus, currentStatus });
}
```

## Future Enhancements

1. **Real-time updates:** WebSocket notifications when status changes
2. **Status history:** Track all status changes with timestamps
3. **Bulk operations:** Optimize hooks for bulk route updates
4. **Custom rules:** Allow custom status derivation rules
5. **Notifications:** Email/SMS alerts for status changes
