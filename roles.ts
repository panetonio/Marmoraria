import type { Page } from './types';

export const PERMISSIONS: Record<Page, string> = {
  dashboard: 'view_dashboard',
  quotes: 'view_quotes',
  orders: 'view_orders',
  production: 'view_production',
  assembly: 'view_assembly',
  logistics: 'view_logistics',
  stock: 'view_stock',
  suppliers: 'manage_suppliers',
  crm: 'manage_crm',
  finance: 'manage_finance',
  invoices: 'manage_invoices',
  receipts: 'view_receipts',
  catalog: 'manage_catalog',
  equipment: 'manage_equipment',
  production_employees: 'manage_production_employees',
  activity_log: 'view_activity_log',
  users: 'manage_users',
  checklist_templates: 'manage_checklists',
};

export const ROLES = {
  admin: {
    displayName: 'Administrador',
    permissions: [
        'view_dashboard', 'manage_quotes', 'view_quotes', 'view_orders',
        'view_production', 'view_assembly', 'view_logistics', 'manage_stock', 'view_stock', 'manage_suppliers',
        'manage_crm', 'manage_finance', 'manage_invoices', 'view_receipts',
        'manage_catalog', 'manage_stock_levels', 'assign_production_resources', 'manage_users',
        'manage_equipment', 'manage_production_employees', 'view_activity_log',
        'manage_checklists'
    ],
  },
  vendedor: {
    displayName: 'Vendedor',
    permissions: [
      PERMISSIONS.dashboard,
      'manage_quotes', // Vendedores devem poder criar e editar orçamentos
      PERMISSIONS.quotes,
      PERMISSIONS.orders,
      PERMISSIONS.crm,
      PERMISSIONS.stock,
    ],
  },
  producao: {
    displayName: 'Produção',
    permissions: [
      PERMISSIONS.dashboard,
      PERMISSIONS.orders,
      PERMISSIONS.production,
      PERMISSIONS.assembly,
      PERMISSIONS.logistics,
      PERMISSIONS.stock, // Permite ver a página de estoque
      'manage_stock',   // Permite ações como alocar chapas
      PERMISSIONS.suppliers,
      'manage_stock_levels',
      'assign_production_resources',
      PERMISSIONS.equipment, // Produção precisa gerenciar equipamentos
      PERMISSIONS.production_employees, // Produção precisa gerenciar funcionários
      PERMISSIONS.checklist_templates,
    ],
  },
  aux_administrativo: {
    displayName: 'Auxiliar Administrativo',
    permissions: [
      PERMISSIONS.dashboard,
      PERMISSIONS.quotes, // Apenas visualiza orçamentos
      PERMISSIONS.orders,
      PERMISSIONS.logistics,
      PERMISSIONS.suppliers,
      PERMISSIONS.crm,
      PERMISSIONS.finance,
      PERMISSIONS.invoices,
      PERMISSIONS.receipts,
      PERMISSIONS.catalog,
      PERMISSIONS.equipment, // Auxiliar administrativo pode gerenciar equipamentos
      PERMISSIONS.production_employees, // Auxiliar administrativo pode gerenciar funcionários
      PERMISSIONS.checklist_templates,
    ],
  },
};