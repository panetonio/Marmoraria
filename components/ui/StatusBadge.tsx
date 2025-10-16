import React from 'react';
import Badge from './Badge';
import type { BadgeVariant } from './Badge';

export interface StatusConfig {
    label: string;
    variant: BadgeVariant;
}

export type StatusMap<T extends string> = Record<T, StatusConfig>;

interface StatusBadgeProps<T extends string> {
    status: T;
    statusMap: StatusMap<T>;
    className?: string;
}

const StatusBadge = <T extends string>({ status, statusMap, className }: StatusBadgeProps<T>) => {
    const config = statusMap[status];

    if (!config) {
        // Fallback for unknown status
        return <Badge variant="default" className={className}>{status}</Badge>;
    }

    return <Badge variant={config.variant} className={className}>{config.label}</Badge>;
};

export default StatusBadge;