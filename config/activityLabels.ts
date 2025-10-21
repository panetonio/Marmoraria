import type { ActivityType } from '../types';

export const activityTypeLabels: Record<ActivityType, string> = {
  // Orçamentos
  quote_created: 'Orçamento Criado',
  quote_updated: 'Orçamento Atualizado',
  quote_sent: 'Orçamento Enviado',
  quote_approved: 'Orçamento Aprovado',
  quote_rejected: 'Orçamento Rejeitado',

  // Pedidos
  order_created: 'Pedido Criado',
  order_updated: 'Pedido Atualizado',
  order_approved: 'Pedido Aprovado',
  order_cancelled: 'Pedido Cancelado',

  // Clientes
  client_created: 'Cliente Criado',
  client_updated: 'Cliente Atualizado',
  client_deleted: 'Cliente Removido',

  // Equipamentos
  equipment_created: 'Equipamento Adicionado',
  equipment_updated: 'Equipamento Atualizado',
  equipment_deleted: 'Equipamento Removido',
  equipment_assigned: 'Equipamento Atribuído',

  // Manutenções
  maintenance_created: 'Manutenção Registrada',
  maintenance_updated: 'Manutenção Atualizada',
  maintenance_completed: 'Manutenção Concluída',

  // Funcionários
  employee_created: 'Funcionário Adicionado',
  employee_updated: 'Funcionário Atualizado',
  employee_deleted: 'Funcionário Removido',

  // Faturas
  invoice_created: 'Nota Fiscal Criada',
  invoice_updated: 'Nota Fiscal Atualizada',
  invoice_paid: 'Nota Fiscal Paga',
  invoice_cancelled: 'Nota Fiscal Cancelada',

  // Entregas
  delivery_scheduled: 'Entrega Agendada',
  delivery_started: 'Entrega Iniciada',
  delivery_completed: 'Entrega Concluída',

  // Instalações
  installation_scheduled: 'Instalação Agendada',
  installation_completed: 'Instalação Concluída',
  service_order_checklist_updated: 'Checklist de OS Atualizado',
  service_order_checklist_item_checked: 'Item de Checklist Concluído',

  // Estoque
  stock_scanned: 'QR Code de Chapa Escaneado',
  stock_status_updated: 'Status do Estoque Atualizado',
  stock_location_updated: 'Localização do Estoque Atualizada',
  stock_status_location_updated: 'Status e Localização do Estoque Atualizados',

  // Usuários
  user_login: 'Login Realizado',
  user_logout: 'Logout Realizado',
  user_created: 'Usuário Criado',
  user_updated: 'Usuário Atualizado',

  // Sistema
  system_backup: 'Backup do Sistema',
  system_restore: 'Restauração do Sistema',
  data_export: 'Exportação de Dados',
  data_import: 'Importação de Dados',
};

export const getActivityTypeLabel = (activityType: ActivityType): string => {
  return activityTypeLabels[activityType] || activityType;
};

export const getActivityTypeIcon = (activityType: ActivityType): string => {
  const iconMap: Record<string, string> = {
    // Orçamentos
    quote_created: '📝',
    quote_updated: '✏️',
    quote_sent: '📤',
    quote_approved: '✅',
    quote_rejected: '❌',

    // Pedidos
    order_created: '🛒',
    order_updated: '✏️',
    order_approved: '✅',
    order_cancelled: '❌',

    // Clientes
    client_created: '👤',
    client_updated: '✏️',
    client_deleted: '🗑️',

    // Equipamentos
    equipment_created: '🔧',
    equipment_updated: '✏️',
    equipment_deleted: '🗑️',
    equipment_assigned: '👥',

    // Manutenções
    maintenance_created: '🔨',
    maintenance_updated: '✏️',
    maintenance_completed: '✅',

    // Funcionários
    employee_created: '👷',
    employee_updated: '✏️',
    employee_deleted: '🗑️',

    // Faturas
    invoice_created: '🧾',
    invoice_updated: '✏️',
    invoice_paid: '💰',
    invoice_cancelled: '❌',

    // Entregas
    delivery_scheduled: '📅',
    delivery_started: '🚚',
    delivery_completed: '✅',

    // Instalações
    installation_scheduled: '📅',
    installation_completed: '✅',
    service_order_checklist_updated: '🗒️',
    service_order_checklist_item_checked: '✅',

    // Estoque
    stock_scanned: '📷',
    stock_status_updated: '🔄',
    stock_location_updated: '📍',
    stock_status_location_updated: '🧭',

    // Usuários
    user_login: '🔐',
    user_logout: '🚪',
    user_created: '👤',
    user_updated: '✏️',

    // Sistema
    system_backup: '💾',
    system_restore: '🔄',
    data_export: '📤',
    data_import: '📥',
  };

  return iconMap[activityType] || '📋';
};

export const getActivityTypeColor = (activityType: ActivityType): string => {
  const colorMap: Record<string, string> = {
    // Criação - Verde
    quote_created: 'text-green-600 dark:text-green-400',
    order_created: 'text-green-600 dark:text-green-400',
    client_created: 'text-green-600 dark:text-green-400',
    equipment_created: 'text-green-600 dark:text-green-400',
    employee_created: 'text-green-600 dark:text-green-400',
    invoice_created: 'text-green-600 dark:text-green-400',
    maintenance_created: 'text-green-600 dark:text-green-400',
    user_created: 'text-green-600 dark:text-green-400',

    // Atualização - Azul
    quote_updated: 'text-blue-600 dark:text-blue-400',
    order_updated: 'text-blue-600 dark:text-blue-400',
    client_updated: 'text-blue-600 dark:text-blue-400',
    service_order_checklist_updated: 'text-blue-600 dark:text-blue-400',
    equipment_updated: 'text-blue-600 dark:text-blue-400',
    employee_updated: 'text-blue-600 dark:text-blue-400',
    invoice_updated: 'text-blue-600 dark:text-blue-400',
    maintenance_updated: 'text-blue-600 dark:text-blue-400',
    user_updated: 'text-blue-600 dark:text-blue-400',

    // Aprovação/Conclusão - Verde
    quote_approved: 'text-green-600 dark:text-green-400',
    order_approved: 'text-green-600 dark:text-green-400',
    maintenance_completed: 'text-green-600 dark:text-green-400',
    delivery_completed: 'text-green-600 dark:text-green-400',
    installation_completed: 'text-green-600 dark:text-green-400',
    service_order_checklist_item_checked: 'text-green-600 dark:text-green-400',
    invoice_paid: 'text-green-600 dark:text-green-400',
    stock_status_updated: 'text-green-600 dark:text-green-400',
    stock_location_updated: 'text-blue-600 dark:text-blue-400',
    stock_status_location_updated: 'text-green-600 dark:text-green-400',

    // Rejeição/Cancelamento - Vermelho
    quote_rejected: 'text-red-600 dark:text-red-400',
    order_cancelled: 'text-red-600 dark:text-red-400',
    invoice_cancelled: 'text-red-600 dark:text-red-400',

    // Remoção - Vermelho
    client_deleted: 'text-red-600 dark:text-red-400',
    equipment_deleted: 'text-red-600 dark:text-red-400',
    employee_deleted: 'text-red-600 dark:text-red-400',

    // Envio/Agendamento - Laranja
    quote_sent: 'text-orange-600 dark:text-orange-400',
    delivery_scheduled: 'text-orange-600 dark:text-orange-400',
    installation_scheduled: 'text-orange-600 dark:text-orange-400',

    // Início - Azul
    delivery_started: 'text-blue-600 dark:text-blue-400',
    stock_scanned: 'text-blue-600 dark:text-blue-400',

    // Atribuição - Roxo
    equipment_assigned: 'text-purple-600 dark:text-purple-400',

    // Login/Logout - Cinza
    user_login: 'text-gray-600 dark:text-gray-400',
    user_logout: 'text-gray-600 dark:text-gray-400',

    // Sistema - Cinza
    system_backup: 'text-gray-600 dark:text-gray-400',
    system_restore: 'text-gray-600 dark:text-gray-400',
    data_export: 'text-gray-600 dark:text-gray-400',
    data_import: 'text-gray-600 dark:text-gray-400',
  };

  return colorMap[activityType] || 'text-gray-600 dark:text-gray-400';
};
