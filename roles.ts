import type { Page } from './types';

export const PERMISSIONS: Record<Page, string> = {
  dashboard: 'view_dashboard',
  quotes: 'view_quotes',
  orders: 'view_orders',
  production: 'view_production',
  logistics: 'view_logistics',
  stock: 'view_stock',
  suppliers: 'manage_suppliers',
  crm: 'manage_crm',
  finance: 'manage_finance',
  invoices: 'manage_invoices',
  receipts: 'view_receipts',
  catalog: 'manage_catalog',
};

export const ROLES = {
  admin: {
    displayName: 'Administrador',
    permissions: [
        'view_dashboard', 'manage_quotes', 'view_quotes', 'view_orders',
        'view_production', 'view_logistics', 'manage_stock', 'view_stock', 'manage_suppliers',
        'manage_crm', 'manage_finance', 'manage_invoices', 'view_receipts',
        'manage_catalog', 'manage_stock_levels', 'assign_production_resources'
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
      PERMISSIONS.logistics,
      PERMISSIONS.stock, // Permite ver a página de estoque
      'manage_stock',   // Permite ações como alocar chapas
      PERMISSIONS.suppliers,
      'manage_stock_levels',
      'assign_production_resources'
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
    ],
  },
};