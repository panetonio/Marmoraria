import type { QuoteStatus, ProductionStatus, LogisticsStatus, StockItemStatus, InvoiceStatus, TransactionStatus, EquipmentStatus, EquipmentCategory, CutPieceStatus } from '../types';
import type { StatusMap } from '../components/ui/StatusBadge';

export const quoteStatusMap: StatusMap<QuoteStatus> = {
    draft: { label: "Rascunho", variant: "default" },
    sent: { label: "Enviado", variant: "primary" },
    approved: { label: "Aprovado", variant: "success" },
    rejected: { label: "Rejeitado", variant: "error" },
    archived: { label: "Arquivado", variant: "default" },
};

export const productionStatusMap: StatusMap<ProductionStatus> = {
  pending_production: { label: 'Aguardando Produção', variant: 'secondary' },
  cutting: { label: 'Em Corte', variant: 'warning' },
  finishing: { label: 'Em Acabamento', variant: 'primary' },
  quality_check: { label: 'Controle de Qualidade', variant: 'purple' },
  awaiting_logistics: { label: 'Aguardando Logística', variant: 'info' },
  // Status de exceção
  rework_needed: { label: 'Retrabalho Necessário', variant: 'error' },
  delivery_issue: { label: 'Problema na Entrega', variant: 'error' },
  installation_pending_review: { label: 'Revisão Pendente', variant: 'warning' },
  installation_issue: { label: 'Problema na Instalação', variant: 'error' },
  quality_issue: { label: 'Problema de Qualidade', variant: 'error' },
  material_shortage: { label: 'Falta de Material', variant: 'error' },
  equipment_failure: { label: 'Falha no Equipamento', variant: 'error' },
  customer_not_available: { label: 'Cliente Indisponível', variant: 'warning' },
  weather_delay: { label: 'Atraso por Clima', variant: 'warning' },
  permit_issue: { label: 'Problema de Permissão', variant: 'error' },
  measurement_error: { label: 'Erro de Medição', variant: 'error' },
  design_change: { label: 'Mudança de Design', variant: 'warning' },
};

export const logisticsStatusMap: StatusMap<LogisticsStatus> = {
  awaiting_scheduling: { label: 'Aguardando Agendamento', variant: 'secondary' },
  scheduled: { label: 'Agendado', variant: 'primary' },
  in_transit: { label: 'Em Trânsito', variant: 'warning' },
  delivered: { label: 'Entregue', variant: 'success' },
  in_installation: { label: 'Em Instalação', variant: 'info' },
  completed: { label: 'Concluído', variant: 'success' },
  picked_up: { label: 'Retirado', variant: 'default' },
  canceled: { label: 'Cancelado', variant: 'error' },
};

export const stockStatusMap: StatusMap<StockItemStatus> = {
    disponivel: { label: "Disponível", variant: "success" },
    reservada: { label: "Reservada", variant: "primary" },
    em_uso: { label: "Em Uso", variant: "warning" },
    consumida: { label: "Consumida", variant: "default" },
    em_corte: { label: "Em Corte", variant: "warning" },
    em_acabamento: { label: "Em Acabamento", variant: "primary" },
    pronto_para_expedicao: { label: "Pronto para Expedição", variant: "success" },
};

export const invoiceStatusMap: StatusMap<InvoiceStatus> = {
    pending: { label: "Pendente", variant: "warning" },
    issued: { label: "Emitida", variant: "success" },
    canceled: { label: "Cancelada", variant: "error" },
};

export const transactionStatusMap: StatusMap<TransactionStatus> = {
    pago: { label: "Pago", variant: 'success' },
    pendente: { label: "Pendente", variant: 'warning' },
};

export const equipmentStatusMap: StatusMap<EquipmentStatus> = {
    operacional: { label: "Operacional", variant: "success" },
    em_manutencao: { label: "Em Manutenção", variant: "warning" },
    desativado: { label: "Desativado", variant: "error" },
};

export const equipmentCategoryMap: StatusMap<EquipmentCategory> = {
    maquina: { label: "Máquina", variant: "primary" },
    veiculo: { label: "Veículo", variant: "secondary" },
};

export const cutPieceStatusMap: StatusMap<CutPieceStatus> = {
    pending_cut: { label: "Aguardando Corte", variant: "secondary" },
    cut: { label: "Cortada", variant: "success" },
    finishing: { label: "Em Acabamento", variant: "primary" },
    assembly: { label: "Em Montagem", variant: "warning" },
    quality_check: { label: "Controle de Qualidade", variant: "purple" },
    ready_for_delivery: { label: "Pronta para Entrega", variant: "info" },
    delivered: { label: "Entregue", variant: "success" },
    installed: { label: "Instalada", variant: "success" },
    defective: { label: "Defeituosa", variant: "error" },
    rework: { label: "Retrabalho", variant: "error" },
};