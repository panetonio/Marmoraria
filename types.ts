import { ROLES } from './roles';

export type Page = 'dashboard' | 'quotes' | 'orders' | 'stock' | 'suppliers' | 'crm' | 'finance' | 'invoices' | 'receipts' | 'catalog' | 'users' | 'equipment' | 'vehicles' | 'production_employees' | 'activity_log' | 'checklist_templates' | 'shopfloor_dashboard' | 'productivity';
export type Role = keyof typeof ROLES;
export type SortDirection = 'ascending' | 'descending';
export type PaymentMethod = 'pix' | 'cartao_credito' | 'boleto' | 'dinheiro';
export type Priority = 'normal' | 'alta' | 'urgente';
export type OrderAddendumStatus = 'pending' | 'approved' | 'rejected';

// Interface genérica para configuração de colunas Kanban
export interface KanbanColumnConfig<T extends string> {
  id: T;
  title: string;
  color: string;
}

// Tipo para visualização do card
export type OrderCardView = 'production' | 'logistics' | 'assembly' | 'installation';

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
export type ItemCategory = 'pia' | 'bancada' | 'soleira' | 'revestimento' | 'outro';

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
  category?: ItemCategory | string; // Categoria do item, permitindo string para categorias customizadas
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
  clientCpf?: string;
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

export type ProductionStatus = 'pending_production' | 'cutting' | 'finishing' | 'quality_check' | 'awaiting_logistics';

export type ServiceOrderStatus = 
  // Status normais de produção
  | 'pending_production' | 'cutting' | 'finishing' | 'quality_check' | 'ready_for_logistics'
  // Status normais de logística
  | 'scheduled' | 'in_transit' | 'delivered' | 'awaiting_installation' | 'completed'
  // Status de exceção
  | 'rework_needed' | 'delivery_issue' | 'installation_pending_review'
  // Status de exceção adicionais
  | 'installation_issue' | 'quality_issue' | 'material_shortage' | 'equipment_failure'
  | 'customer_not_available' | 'weather_delay' | 'permit_issue' | 'measurement_error' | 'design_change'
  // Status finais
  | 'cancelled';

export type LogisticsStatus = 'awaiting_scheduling' | 'scheduled' | 'in_transit' | 'delivered' | 'in_installation' | 'completed' | 'picked_up' | 'canceled';

export interface Order {
  id: string; // PED-
  originalQuoteId: string; // ORC-
  clientName: string;
  clientCpf?: string;
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
  addendums?: OrderAddendum[];
}

export interface OrderAddendum {
  id: string;
  orderId: string;
  addendumNumber: number;
  reason: string;
  status: OrderAddendumStatus;
  addedItems: QuoteItem[];
  removedItemIds: string[];
  changedItems: Array<{ originalItemId: string; updatedItem: QuoteItem }>;
  priceAdjustment: number;
  approvedBy?: string;
  approvedAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
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
  status: ServiceOrderStatus; // Status unificado da OS
  productionStatus: ProductionStatus; // Legacy, mantido para compatibilidade
  logisticsStatus: LogisticsStatus; // Legacy, mantido para compatibilidade
  isFinalized: boolean;
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
  history?: Array<{
    status: ServiceOrderStatus;
    timestamp: string;
    action: string;
    details?: string;
    userId?: string;
  }>;
}

export interface ChecklistTemplateItem {
  id?: string;
  text: string;
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  type: 'entrega' | 'montagem';
  items: ChecklistTemplateItem[];
  createdAt?: string;
  updatedAt?: string;
}

export type InvoiceStatus = 'pending' | 'issued' | 'canceled';

export type DeliveryRouteStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type DeliveryRouteType = 'delivery' | 'installation';

export interface DeliveryRoutePhoto {
  url: string;
  description?: string;
}

export interface DeliveryRouteSignature {
  url: string;
  timestamp: string;
}

export interface DeliveryRoute {
  id: string;
  vehicleId: string;
  serviceOrderId: string;
  type: DeliveryRouteType;
  start: string;
  end: string;
  scheduledStart: string;
  scheduledEnd: string;
  actualStart?: string;
  actualEnd?: string;
  teamIds: string[];
  status: DeliveryRouteStatus;
  notes?: string;
  checklistCompleted: boolean;
  photos?: DeliveryRoutePhoto[];
  customerSignature?: DeliveryRouteSignature;
  createdAt: string;
  updatedAt: string;
}

// Tipo para disponibilidade de recursos do backend
export interface ResourceAvailability {
  id: string;
  name: string;
  [key: string]: any; // Campos específicos dependem do tipo (vehicle/employee)
}

export interface Invoice {
  id: string;
  orderId: string;
  clientId?: string;
  clientName: string;
  buyerDocument?: string;
  buyerAddress?: Address;
  items: QuoteItem[]; // espelha os itens do pedido
  total: number;
  status: InvoiceStatus;
  issueDate?: string | null;
  nfeKey?: string;
  nfeXmlUrl?: string;
  nfePdfUrl?: string;
  createdAt: string;
  updatedAt?: string;
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
  attachmentUrl?: string;
  attachmentName?: string;
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

export type CutPieceStatus = 'pending_cut' | 'cut' | 'finishing' | 'assembly' | 'quality_check' | 'ready_for_delivery' | 'delivered' | 'installed' | 'defective' | 'rework';

export interface CutPiece {
  id: string;
  pieceId: string;
  serviceOrderId: string;
  originalQuoteItemId: string;
  originalStockItemId: string;
  materialId: string;
  description: string;
  category?: string;
  dimensions: string;
  status: CutPieceStatus;
  location?: string;
  qrCodeValue: string;
  createdAt: string;
  updatedAt: string;
}

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
  purchaseInvoiceNumber: string;
  supplierCnpj: string;
  assignedTo: string; // ID do funcionário de produção (obrigatório)
  status: EquipmentStatus;
  currentLocation: string;
  notes?: string;
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
  | 'service_order_checklist_updated' | 'service_order_checklist_item_checked'
  | 'asset_scanned' | 'asset_status_updated' | 'asset_location_updated' | 'asset_status_location_updated'
  | 'stock_scanned' | 'stock_status_updated' | 'stock_location_updated' | 'stock_status_location_updated'
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

export type ContractStatus = 'draft' | 'sent' | 'signed' | 'archived';

export interface Contract {
  id: string;
  orderId: string;
  quoteId: string;
  clientId: string;
  documentNumber?: string;
  status: ContractStatus;
  contentTemplate?: string;
  variables?: Record<string, any>;
  signatoryInfo?: { name: string; documentNumber: string };
  digitalSignatureUrl?: string;
  signedAt?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
}