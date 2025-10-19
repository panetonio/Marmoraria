import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { getActivityTypeLabel, getActivityTypeIcon } from '../config/activityLabels';
import type { ActivityType } from '../types';

export const useActivityLogger = () => {
    const { addActivityLog } = useData();
    const { currentUser } = useAuth();

    const logActivity = (
        activityType: ActivityType,
        relatedEntityType?: string,
        relatedEntityId?: string,
        relatedEntityName?: string,
        details?: Record<string, any>
    ) => {
        if (!currentUser) {
            console.warn('Cannot log activity: no current user');
            return;
        }

        addActivityLog({
            userId: currentUser.id,
            userName: currentUser.name,
            activityType,
            activityTypeLabel: getActivityTypeLabel(activityType),
            relatedEntityType,
            relatedEntityId,
            relatedEntityName,
            details,
            ipAddress: '127.0.0.1', // Em produção, obter do request
            userAgent: navigator.userAgent
        });
    };

    // Funções específicas para diferentes tipos de atividade
    const logQuoteActivity = (activityType: ActivityType, quote: any) => {
        logActivity(
            activityType,
            'quote',
            quote.id,
            `Orçamento ${quote.id}`,
            {
                clientName: quote.clientName,
                totalValue: quote.total,
                itemsCount: quote.items?.length || 0
            }
        );
    };

    const logOrderActivity = (activityType: ActivityType, order: any) => {
        logActivity(
            activityType,
            'order',
            order.id,
            `Pedido ${order.id}`,
            {
                clientName: order.clientName,
                totalValue: order.total,
                originalQuoteId: order.originalQuoteId
            }
        );
    };

    const logClientActivity = (activityType: ActivityType, client: any) => {
        logActivity(
            activityType,
            'client',
            client.id,
            client.name,
            {
                type: client.type,
                email: client.email,
                phone: client.phone
            }
        );
    };

    const logEquipmentActivity = (activityType: ActivityType, equipment: any) => {
        logActivity(
            activityType,
            'equipment',
            equipment.id,
            equipment.name,
            {
                serialNumber: equipment.serialNumber,
                category: equipment.category,
                status: equipment.status,
                assignedTo: equipment.assignedTo
            }
        );
    };

    const logMaintenanceActivity = (activityType: ActivityType, maintenance: any, equipment?: any) => {
        logActivity(
            activityType,
            'maintenance',
            maintenance.id,
            `Manutenção ${equipment?.name || maintenance.equipmentId}`,
            {
                equipmentName: equipment?.name,
                equipmentId: maintenance.equipmentId,
                cost: maintenance.cost,
                performedBy: maintenance.performedBy,
                warrantyClaim: maintenance.warrantyClaim
            }
        );
    };

    const logEmployeeActivity = (activityType: ActivityType, employee: any) => {
        logActivity(
            activityType,
            'employee',
            employee.id,
            employee.name,
            {
                role: employee.role,
                phone: employee.phone,
                isActive: employee.isActive
            }
        );
    };

    const logDeliveryActivity = (activityType: ActivityType, serviceOrder: any, details?: Record<string, any>) => {
        logActivity(
            activityType,
            'service_order',
            serviceOrder.id,
            `OS ${serviceOrder.id}`,
            {
                clientName: serviceOrder.clientName,
                status: serviceOrder.status,
                ...details
            }
        );
    };

    const logUserActivity = (activityType: ActivityType, user?: any) => {
        const targetUser = user || currentUser;
        logActivity(
            activityType,
            'user',
            targetUser?.id,
            targetUser?.name,
            {
                role: targetUser?.role,
                loginTime: new Date().toISOString()
            }
        );
    };

    return {
        logActivity,
        logQuoteActivity,
        logOrderActivity,
        logClientActivity,
        logEquipmentActivity,
        logMaintenanceActivity,
        logEmployeeActivity,
        logDeliveryActivity,
        logUserActivity
    };
};
