import type { Page } from './types';

export const PERMISSIONS: Record<Page, string> = {
  dashboard: 'view_dashboard',
  quotes: 'manage_quotes',
  orders: 'view_orders',
  production: 'view_production',
  stock: 'manage_stock',
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
    permissions: [...Object.values(PERMISSIONS), 'manage_stock_levels', 'assign_production_resources'],
  },
  vendedor: {
    displayName: 'Vendedor',
    permissions: [
      PERMISSIONS.dashboard,
      PERMISSIONS.quotes,
      PERMISSIONS.orders,
      PERMISSIONS.crm,
    ],
  },
  producao: {
    displayName: 'Produção',
    permissions: [
      PERMISSIONS.dashboard,
      PERMISSIONS.orders,
      PERMISSIONS.production,
      PERMISSIONS.stock,
      PERMISSIONS.suppliers,
      'manage_stock_levels',
      'assign_production_resources'
    ],
  },
  aux_administrativo: {
    displayName: 'Auxiliar Administrativo',
    permissions: [
      PERMISSIONS.dashboard,
      PERMISSIONS.quotes,
      PERMISSIONS.orders,
      PERMISSIONS.suppliers,
      PERMISSIONS.crm,
      PERMISSIONS.finance,
      PERMISSIONS.invoices,
      PERMISSIONS.receipts,
      PERMISSIONS.catalog,
    ],
  },
};