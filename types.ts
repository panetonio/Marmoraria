import { ROLES } from './roles';

export type Page = 'dashboard' | 'quotes' | 'orders' | 'production' | 'stock' | 'suppliers' | 'crm' | 'finance' | 'invoices' | 'receipts' | 'catalog' | 'logistics' | 'activityLog' | 'equipment';
export type Role = keyof typeof ROLES;
export type SortDirection = 'ascending' | 'descending';
export type PaymentMethod = 'pix' | 'cartao_credito' | 'boleto' | 'dinheiro';
export type Priority = 'normal' | 'alta' | 'urgente';

export type ActivityType = 
  | 'CLIENT_CREATED' | 'CLIENT_UPDATED'
  | 'QUOTE_CREATED' | 'QUOTE_UPDATED' | 'QUOTE_APPROVED'
  | 'ORDER_CREATED'
  | 'SERVICE_ORDER_CREATED' | 'SERVICE_ORDER_STATUS_CHANGED'
  | 'INVOICE_CREATED' | 'INVOICE_ISSUED'
  | 'SUPPLIER_CREATED' | 'SUPPLIER_UPDATED'
  | 'NOTE_ADDED'
  | 'RECEIPT_CREATED'
  | 'EQUIPMENT_CREATED' | 'EQUIPMENT_UPDATED' | 'MAINTENANCE_LOGGED';

export interface ActivityLog {
  id: string;
  timestamp: string; // ISO String
  userId: string;
  activityType: ActivityType;
  relatedEntityId: string; // ID of the quote, order, client, etc.
  details: string; // A human-readable summary of the action
}

export interface Address {
  cep: string;
  uf: string;
  city: string;
  neighborhood: string;
  address: string;
  number: string;
  complement?: string;
}

export interface User {
  id: string;
  name: string;
  role: Role;
}

export type ProductionProfessionalRole = 'cortador' | 'acabador' | 'montador' | 'entregador';

export interface ProductionProfessional {
  id: string;
  name: string;
  role: ProductionProfessionalRole;
}

export interface Client {
  id: string;
  name: string;
  type: 'pessoa_fisica' | 'empresa';
  email: string;
  phone: string;
  address: Address;
  cpfCnpj: string;
  createdAt: string;
}

export type OpportunityStatus = 'novo' | 'contatado' | 'orcamento_enviado' | 'negociacao' | 'ganho' | 'perdido';

export interface Opportunity {
    id: string;
    clientName: string; // Could be a new lead not yet in clients DB
    estimatedValue: number;
    status: OpportunityStatus;
    salespersonId: string;
    createdAt: string;
}

export interface AgendaEvent {
    id: string;
    title: string;
    date: string; // ISO String for date and time
    clientId: string; // Link to a client
    description: string;
    userId: string; // User responsible
}

export interface Note {
    id: string;
    clientId: string;
    userId: string;
    content: string;
    createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: Address;
  cpfCnpj: string;
}

export interface Material {
  id: string;
  name: string;
  photoUrl: string;
  supplier: string;
  costPerSqM: number;
  slabWidth: number; // Dimensão da chapa
  slabHeight: number; // Dimensão da chapa
  sku: string;
  minStockSqM?: number; // Minimum stock level in square meters
}

export interface Service {
  id: string;
  name: string;
  unit: 'm' | 'un' | '%';
  price: number;
}

export interface Product {
  id: string;
  name: string;
  cost: number;
  price: number;
  stock: number;
}

export type QuoteItemType = 'material' | 'service' | 'product';

export interface Point {
    x: number;
    y: number;
}

export interface QuoteItem {
  id: string;
  type: QuoteItemType;
  description: string;
  quantity: number; // Para material, isso representa a área (m²)
  unitPrice: number;
  discount?: number;
  totalPrice: number;
  // Material specific
  width?: number;
  height?: number;
  perimeter?: number;
  wastePercentage?: number;
  materialId?: string;
  placement?: { x: number; y: number; fit: boolean };
  shapePoints?: Point[];
}

export type QuoteStatus = 'draft' | 'sent' | 'approved' | 'rejected' | 'archived';

export interface Quote {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  deliveryAddress: Address;
  status: QuoteStatus;
  items: QuoteItem[];
  subtotal: number;
  discount?: number;
  freight?: number;
  paymentMethod?: PaymentMethod;
  installments?: number;
  total: number;
  createdAt: string;
  salespersonId?: string;
}

export type ProductionStatus = 'cutting' | 'finishing' | 'awaiting_pickup' | 'ready_for_logistics' | 'scheduled' | 'in_transit' | 'realizado' | 'completed';

export interface Order {
  id: string; // PED-
  originalQuoteId: string; // ORC-
  clientName: string;
  deliveryAddress: Address;
  items: QuoteItem[];
  subtotal: number;
  discount?: number;
  freight?: number;
  paymentMethod?: PaymentMethod;
  installments?: number;
  total: number;
  approvalDate: string;
  serviceOrderIds: string[];
  salespersonId?: string;
}

export type FinalizationType = 'pickup' | 'delivery_only' | 'delivery_installation';

export interface ServiceOrder {
  id: string; // OS-
  orderId: string; // PED-
  clientName: string;
  deliveryAddress: Address; // Copied from order for logistics use
  items: QuoteItem[];
  total: number;
  deliveryDate: string;
  assignedToIds: string[];
  status: ProductionStatus;
  allocatedSlabId?: string;
  priority?: Priority;
  requiresInstallation?: boolean; // Legacy, replaced by finalizationType
  finalizationType?: FinalizationType;
  delivery_confirmed?: boolean;
  installation_confirmed?: boolean;
  attachment?: {
    name: string;
    url: string;
  };
  deliveryScheduledDate?: string;
  deliveryTeamIds?: string[];
  departureChecklist?: { id: string; text: string; checked: boolean; }[];
  observations?: string;
}

export type InvoiceStatus = 'pending' | 'issued' | 'canceled';

export interface Invoice {
  id: string;
  orderId: string;
  clientName: string;
  total: number;
  status: InvoiceStatus;
  issueDate: string | null;
  createdAt: string;
}

export type StockItemStatus = 'disponivel' | 'reservada' | 'em_uso' | 'consumida';

export interface StockItem {
  id: string; // Unique ID, could be what the QR code holds
  materialId: string;
  photoUrl: string;
  width: number; // in meters
  height: number; // in meters
  thickness: number; // in cm
  location: string; // e.g., "Pátio A, Rack 3"
  status: StockItemStatus;
  createdAt: string;
  parentSlabId?: string; // If it's a remnant
}

export type TransactionType = 'receita' | 'despesa';
export type TransactionStatus = 'pago' | 'pendente';

export interface FinancialTransaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  dueDate: string; // ISO String
  paymentDate?: string; // ISO String
  relatedOrderId?: string;
  relatedClientId?: string;
  paymentMethod?: PaymentMethod;
  attachment?: {
    name: string;
    url: string;
  };
}

export interface Receipt {
  id: string;
  supplierId: string;
  supplierName: string;
  cpfCnpj: string;
  amount: number;
  description: string;
  createdAt: string;
}

export type EquipmentStatus = 'operacional' | 'em_manutencao' | 'desativado';

export interface Equipment {
  id: string;
  name: string;
  serialNumber: string;
  purchaseDate: string; // ISO string
  purchaseInvoiceNumber: string;
  supplierCnpj: string;
  warrantyEndDate: string; // ISO string
  currentLocation: string;
  assignedTo: string; // ProductionProfessional ID
  status: EquipmentStatus;
}

export interface MaintenanceLog {
  id: string;
  equipmentId: string;
  maintenanceDate: string; // ISO string
  description: string;
  cost: number;
  performedBy: string; // User ID
  nextMaintenanceDate?: string; // ISO string
}
