import React from 'react';

export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'secondary' | 'info' | 'purple';

interface BadgeProps {
    children: React.ReactNode;
    variant?: BadgeVariant;
    className?: string;
}

const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className = '' }) => {
    const baseClasses = "px-2.5 py-0.5 text-xs font-semibold rounded-full inline-block";

    const variantClasses = {
        default: "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200",
        primary: "bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
        success: "bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-200",
        warning: "bg-yellow-200 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-200",
        error: "bg-red-200 text-red-800 dark:bg-red-900/50 dark:text-red-200",
        secondary: "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
        info: "bg-cyan-200 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
        purple: "bg-purple-200 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    };

    const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${className}`;

    return <span className={combinedClasses}>{children}</span>;
};

export default Badge;