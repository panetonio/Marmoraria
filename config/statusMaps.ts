import type { QuoteStatus, ProductionStatus, StockItemStatus, InvoiceStatus, TransactionStatus } from '../types';
import type { StatusMap } from '../components/ui/StatusBadge';

export const quoteStatusMap: StatusMap<QuoteStatus> = {
    draft: { label: "Rascunho", variant: "default" },
    sent: { label: "Enviado", variant: "primary" },
    approved: { label: "Aprovado", variant: "success" },
    rejected: { label: "Rejeitado", variant: "error" },
    archived: { label: "Arquivado", variant: "default" },
};

export const productionStatusMap: StatusMap<ProductionStatus> = {
  cutting: { label: 'Em Corte', variant: 'warning' },
  finishing: { label: 'Em Acabamento', variant: 'primary' },
  assembly: { label: 'Em Montagem', variant: 'primary' },
  ready_for_delivery: { label: 'Pronto para Entrega', variant: 'primary' },
  delivered: { label: 'Entregue', variant: 'success' },
};

export const stockStatusMap: StatusMap<StockItemStatus> = {
    disponivel: { label: "Disponível", variant: "success" },
    reservada: { label: "Reservada", variant: "primary" },
    em_uso: { label: "Em Uso", variant: "warning" },
    consumida: { label: "Consumida", variant: "default" },
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