import { ROLES } from './roles';

export type Page = 'dashboard' | 'quotes' | 'orders' | 'production' | 'assembly' | 'stock' | 'suppliers' | 'crm' | 'finance' | 'invoices' | 'receipts' | 'catalog' | 'logistics' | 'users' | 'equipment' | 'vehicles' | 'production_employees' | 'activity_log';
export type Role = keyof typeof ROLES;
export type SortDirection = 'ascending' | 'descending';
export type PaymentMethod = 'pix' | 'cartao_credito' | 'boleto' | 'dinheiro';
export type Priority = 'normal' | 'alta' | 'urgente';

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

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  customPermissions?: Page[]; // Páginas específicas que o usuário pode acessar
  isActive: boolean;
  createdAt: string;
}

export type ProductionEmployeeRole = 'cortador' | 'acabador' | 'montador' | 'entregador' | 'supervisor' | 'auxiliar';

export interface ProductionEmployee {
  id: string;
  name: string;
  role: ProductionEmployeeRole;
  phone: string;
  email?: string;
  isActive: boolean;
  hireDate: string;
  createdAt: string;
}

// Manter compatibilidade com o sistema antigo
export type ProductionProfessionalRole = ProductionEmployeeRole;
export interface ProductionProfessional extends ProductionEmployee {}

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
  deliveryStart?: string;
  deliveryEnd?: string;
  vehicleId?: string;
  deliveryTeamIds?: string[];
  departureChecklist?: { id: string; text: string; checked: boolean; }[];
  observations?: string;
}

export type InvoiceStatus = 'pending' | 'issued' | 'canceled';

export type DeliveryRouteStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface DeliveryRoute {
  id: string;
  vehicleId: string;
  serviceOrderId: string;
  start: string;
  end: string;
  status: DeliveryRouteStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  orderId: string;
  clientName: string;
  total: number;
  status: InvoiceStatus;
  issueDate: string | null;
  createdAt: string;
}

export type StockItemStatus =
  | 'disponivel'
  | 'reservada'
  | 'em_uso'
  | 'consumida'
  | 'em_corte'
  | 'em_acabamento'
  | 'pronto_para_expedicao';

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
export type EquipmentCategory = 'maquina' | 'veiculo';

export type VehicleType = 'van' | 'caminhao';
export type VehicleStatus = 'disponivel' | 'em_uso' | 'em_manutencao';

export interface Vehicle {
  id: string;
  name: string;
  licensePlate: string;
  capacity: number;
  type: VehicleType;
  status: VehicleStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Equipment {
  id: string;
  name: string;
  serialNumber: string;
  category: EquipmentCategory;
  purchaseDate: string;
  warrantyEndDate: string;
  purchaseInvoiceId?: string; // Link para Invoice de compra
  assignedTo: string; // ID do funcionário de produção (obrigatório)
  status: EquipmentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceLog {
  id: string;
  equipmentId: string;
  maintenanceDate: string;
  description: string;
  cost: number;
  performedBy: string; // Nome da empresa terceirizada
  companyCnpj: string; // CNPJ da empresa terceirizada
  invoiceNumber: string; // Número da NF da manutenção
  nextMaintenanceDate?: string;
  maintenanceWarrantyDate?: string; // Data de garantia da manutenção (opcional)
  warrantyClaim: boolean; // indica se foi coberto pela garantia do equipamento
  createdAt: string;
}

export type ActivityType = 
  | 'quote_created' | 'quote_updated' | 'quote_sent' | 'quote_approved' | 'quote_rejected'
  | 'order_created' | 'order_updated' | 'order_approved' | 'order_cancelled'
  | 'client_created' | 'client_updated' | 'client_deleted'
  | 'equipment_created' | 'equipment_updated' | 'equipment_deleted' | 'equipment_assigned'
  | 'maintenance_created' | 'maintenance_updated' | 'maintenance_completed'
  | 'employee_created' | 'employee_updated' | 'employee_deleted'
  | 'invoice_created' | 'invoice_updated' | 'invoice_paid' | 'invoice_cancelled'
  | 'delivery_scheduled' | 'delivery_started' | 'delivery_completed'
  | 'installation_scheduled' | 'installation_completed'
  | 'user_login' | 'user_logout' | 'user_created' | 'user_updated'
  | 'system_backup' | 'system_restore' | 'data_export' | 'data_import';

export interface ActivityLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string; // Nome do usuário para facilitar exibição
  activityType: ActivityType;
  activityTypeLabel: string; // Label legível em português
  relatedEntityType?: string; // Tipo da entidade relacionada (quote, order, client, etc.)
  relatedEntityId?: string; // ID da entidade relacionada
  relatedEntityName?: string; // Nome da entidade para facilitar exibição
  details?: Record<string, any>; // Detalhes específicos da atividade em JSON
  ipAddress?: string; // IP do usuário (para auditoria)
  userAgent?: string; // User agent do navegador
  createdAt: string;
}