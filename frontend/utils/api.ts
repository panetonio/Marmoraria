// API URL: usar caminho relativo quando servido pelo backend, ou absoluto em desenvolvimento
const API_URL = "https://marmoraria.onrender.com/api"

// Função auxiliar para obter a URL base da API
export const getApiUrl = () => API_URL;

// Pegar token do localStorage
const getToken = () => localStorage.getItem('token');

// Headers padrão
const getHeaders = (includeAuth = true) => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (includeAuth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  return headers;
};

// Interceptor global para erros 401
const apiFetch = async (url: string, options: RequestInit = {}, skipRedirect = false): Promise<Response> => {
  // Debug: verificar se token está sendo enviado
  const token = getToken();
  if (!token && !url.includes('/auth/login') && !url.includes('/auth/register')) {
    console.warn('⚠️  Requisição sem token:', url);
  }
  
  const response = await fetch(url, options);
  
  // Verificar se é erro 401 e não é a rota de login
  if (response.status === 401 && !url.includes('/auth/login') && !skipRedirect) {
    const errorData = await response.clone().json().catch(() => ({}));
    console.error('🔒 Sessão expirada ou não autorizada:', {
      url,
      message: errorData.message || 'Token não fornecido ou inválido',
      hasToken: !!token
    });
    
    // Limpar dados do localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Redirecionar para a raiz (página de login)
    window.location.href = '/';
    
    // Lançar erro para interromper o fluxo
    throw new Error('Sessão expirada. Redirecionando...');
  }
  
  // Retornar a resposta normalmente
  return response;
};

// Função para validar token sem redirecionar (usado na verificação inicial)
export const validateToken = async (): Promise<any> => {
  const token = localStorage.getItem('token');
  if (!token) {
    return { success: false };
  }
  
  try {
    const response = await apiFetch(`${API_URL}/auth/me`, {
      headers: getHeaders(),
    }, true); // skipRedirect = true para não redirecionar durante validação inicial
    
    const result = await response.json();
    return result;
  } catch (error) {
    return { success: false, error };
  }
};

export const api = {
  // Autenticação
  async login(email: string, password: string) {
    const response = await apiFetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify({ email, password }),
    });
    return response.json();
  },

  async register(userData: {
    name: string;
    email: string;
    password: string;
    role: string;
  }) {
    const response = await apiFetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify(userData),
    });
    return response.json();
  },

  async getMe() {
    const response = await apiFetch(`${API_URL}/auth/me`, {
      headers: getHeaders(),
    });
    return response.json();
  },

  // Upload de imagens
  async uploadImage(imageData: string) {
    const response = await apiFetch(`${API_URL}/uploads/image`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ imageData }),
    });
    return response.json();
  },

  // Usuários
  async getUsers() {
    const response = await apiFetch(`${API_URL}/users`, {
      headers: getHeaders(),
    });
    return response.json();
  },

  async createUser(userData: any) {
    const response = await apiFetch(`${API_URL}/users`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(userData),
    });
    return response.json();
  },

  async updateUser(id: string, userData: any) {
    const response = await apiFetch(`${API_URL}/users/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(userData),
    });
    return response.json();
  },

  async deleteUser(id: string) {
    const response = await apiFetch(`${API_URL}/users/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return response.json();
  },

  async toggleUserStatus(id: string) {
    const response = await apiFetch(`${API_URL}/users/${id}/toggle-status`, {
      method: 'PATCH',
      headers: getHeaders(),
    });
    return response.json();
  },

  async updateUserPermissions(id: string, permissions: string[]) {
    const response = await apiFetch(`${API_URL}/users/${id}/permissions`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ customPermissions: permissions }),
    });
    return response.json();
  },

  // Clientes
  async getClients() {
    const response = await apiFetch(`${API_URL}/clients`, {
      headers: getHeaders(),
    });
    return response.json();
  },

  // Materiais
  async getMaterials() {
    const response = await apiFetch(`${API_URL}/materials`, { headers: getHeaders() });
    return response.json();
  },
  async createMaterial(material: any) {
    const response = await apiFetch(`${API_URL}/materials`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(material) });
    return response.json();
  },
  async updateMaterial(id: string, material: any) {
    const response = await apiFetch(`${API_URL}/materials/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(material) });
    return response.json();
  },
  async deleteMaterial(id: string) {
    const response = await apiFetch(`${API_URL}/materials/${id}`, { method: 'DELETE', headers: getHeaders() });
    return response.json();
  },

  async getClientById(id: string) {
    const response = await apiFetch(`${API_URL}/clients/${id}`, {
      headers: getHeaders(),
    });
    return response.json();
  },

  async createClient(clientData: any) {
    const response = await apiFetch(`${API_URL}/clients`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(clientData),
    });
    return response.json();
  },

  async updateClient(id: string, clientData: any) {
    const response = await apiFetch(`${API_URL}/clients/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(clientData),
    });
    return response.json();
  },

  async deleteClient(id: string) {
    const response = await apiFetch(`${API_URL}/clients/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return response.json();
  },

  // Anotações de clientes
  async getClientNotes(clientId: string) {
    const response = await apiFetch(`${API_URL}/clients/${clientId}/notes`, {
      headers: getHeaders(),
    });
    return response.json();
  },

  async createClientNote(clientId: string, content: string) {
    const response = await apiFetch(`${API_URL}/clients/${clientId}/notes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ content }),
    });
    return response.json();
  },

  async updateClientNote(clientId: string, noteId: string, content: string) {
    const response = await apiFetch(`${API_URL}/clients/${clientId}/notes/${noteId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ content }),
    });
    return response.json();
  },

  async deleteClientNote(clientId: string, noteId: string) {
    const response = await apiFetch(`${API_URL}/clients/${clientId}/notes/${noteId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return response.json();
  },

  async getChecklistTemplates() {
    const response = await apiFetch(`${API_URL}/checklist-templates`, {
      headers: getHeaders(),
    });
    return response.json();
  },

  async createChecklistTemplate(template: { name: string; type: 'entrega' | 'montagem'; items: { text: string }[] }) {
    const response = await apiFetch(`${API_URL}/checklist-templates`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(template),
    });
    return response.json();
  },

  async updateChecklistTemplate(id: string, template: { name: string; type: 'entrega' | 'montagem'; items: { text: string }[] }) {
    const response = await apiFetch(`${API_URL}/checklist-templates/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(template),
    });
    return response.json();
  },

  async deleteChecklistTemplate(id: string) {
    const response = await apiFetch(`${API_URL}/checklist-templates/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return response.json();
  },

  async updateServiceOrderChecklist(id: string, checklist: { id: string; text: string; checked: boolean }[]) {
    const response = await apiFetch(`${API_URL}/serviceorders/${id}/checklist`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ checklist }),
    });
    return response.json();
  },

  // Fornecedores
  async getSuppliers() {
    const response = await apiFetch(`${API_URL}/suppliers`, {
      headers: getHeaders(),
    });
    return response.json();
  },

  async getSupplierById(id: string) {
    const response = await apiFetch(`${API_URL}/suppliers/${id}`, {
      headers: getHeaders(),
    });
    return response.json();
  },

  async createSupplier(supplierData: any) {
    const response = await apiFetch(`${API_URL}/suppliers`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(supplierData),
    });
    return response.json();
  },

  async updateSupplier(id: string, supplierData: any) {
    const response = await apiFetch(`${API_URL}/suppliers/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(supplierData),
    });
    return response.json();
  },

  async deleteSupplier(id: string) {
    const response = await apiFetch(`${API_URL}/suppliers/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return response.json();
  },

  // Orçamentos
  async getQuotes() {
    const response = await apiFetch(`${API_URL}/quotes`, {
      headers: getHeaders(),
    });
    return response.json();
  },

  async getQuoteById(id: string) {
    const response = await apiFetch(`${API_URL}/quotes/${id}`, {
      headers: getHeaders(),
    });
    return response.json();
  },

  async createQuote(quoteData: any) {
    const response = await apiFetch(`${API_URL}/quotes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(quoteData),
    });
    return response.json();
  },

  async updateQuote(id: string, quoteData: any) {
    const response = await apiFetch(`${API_URL}/quotes/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(quoteData),
    });
    return response.json();
  },

  async deleteQuote(id: string) {
    const response = await apiFetch(`${API_URL}/quotes/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return response.json();
  },

  // Pedidos
  async getOrders() {
    const response = await apiFetch(`${API_URL}/orders`, {
      headers: getHeaders(),
    });
    return response.json();
  },

  async getOrderById(id: string) {
    const response = await apiFetch(`${API_URL}/orders/${id}`, {
      headers: getHeaders(),
    });
    return response.json();
  },

  async createOrder(orderData: any) {
    const response = await apiFetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(orderData),
    });
    return response.json();
  },

  async updateOrder(id: string, orderData: any) {
    const response = await apiFetch(`${API_URL}/orders/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(orderData),
    });
    return response.json();
  },

  async deleteOrder(id: string) {
    const response = await apiFetch(`${API_URL}/orders/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return response.json();
  },

  // Veículos
  async getVehicles() {
    const response = await apiFetch(`${API_URL}/vehicles`, {
      headers: getHeaders(),
    });
    return response.json();
  },

  async createVehicle(vehicleData: any) {
    const response = await apiFetch(`${API_URL}/vehicles`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(vehicleData),
    });
    return response.json();
  },

  async updateVehicle(id: string, vehicleData: any) {
    const response = await apiFetch(`${API_URL}/vehicles/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(vehicleData),
    });
    return response.json();
  },

  async deleteVehicle(id: string) {
    const response = await apiFetch(`${API_URL}/vehicles/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return response.json();
  },

  // Rotas de entrega
  async getDeliveryRoutes(params: { vehicleId?: string; start?: string; end?: string } = {}) {
    const query = new URLSearchParams();
    if (params.vehicleId) query.append('vehicleId', params.vehicleId);
    if (params.start) query.append('start', params.start);
    if (params.end) query.append('end', params.end);

    const qs = query.toString();
    const response = await apiFetch(`${API_URL}/delivery-routes${qs ? `?${qs}` : ''}`, {
      headers: getHeaders(),
    });
    return response.json();
  },

  async createDeliveryRoute(routeData: any) {
    const response = await apiFetch(`${API_URL}/delivery-routes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(routeData),
    });
    return response.json();
  },

  async createInstallationRoute(routeData: {
    serviceOrderId: string;
    scheduledStart: string;
    scheduledEnd: string;
    teamIds: string[];
    vehicleId?: string;
    notes?: string;
  }) {
    const response = await apiFetch(`${API_URL}/delivery-routes/installation`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(routeData),
    });
    return response.json();
  },

  async updateDeliveryRoute(id: string, routeData: any) {
    const response = await apiFetch(`${API_URL}/delivery-routes/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(routeData),
    });
    return response.json();
  },

  async deleteDeliveryRoute(id: string) {
    const response = await apiFetch(`${API_URL}/delivery-routes/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return response.json();
  },

  async checkVehicleAvailability(vehicleId: string, start: string, end: string, routeId?: string) {
    const query = new URLSearchParams({ vehicleId, start, end });
    if (routeId) {
      query.append('routeId', routeId);
    }
    const response = await apiFetch(`${API_URL}/delivery-routes/availability/check?${query.toString()}`, {
      headers: getHeaders(),
    });
    return response.json();
  },

  async getResourceAvailability(params: { 
    type: 'vehicle' | 'employee'; 
    start: string; 
    end: string; 
    role?: string 
  }) {
    const query = new URLSearchParams({ 
      type: params.type, 
      start: params.start, 
      end: params.end 
    });
    if (params.role) {
      query.append('role', params.role);
    }
    const response = await apiFetch(`${API_URL}/delivery-routes/resources/availability?${query.toString()}`, {
      headers: getHeaders(),
    });
    return response.json();
  },

  // Production Employees
  async getProductionEmployees(params: { role?: string; availability?: string; active?: boolean } = {}) {
    const query = new URLSearchParams();
    if (params.role) query.append('role', params.role);
    if (params.availability) query.append('availability', params.availability);
    if (params.active !== undefined) query.append('active', String(params.active));

    const qs = query.toString();
    const response = await apiFetch(`${API_URL}/production-employees${qs ? `?${qs}` : ''}`, {
      headers: getHeaders(),
    });
    return response.json();
  },

  async getProductionEmployeeById(id: string) {
    const response = await apiFetch(`${API_URL}/production-employees/${id}`, {
      headers: getHeaders(),
    });
    return response.json();
  },

  async createProductionEmployee(employeeData: any) {
    const response = await apiFetch(`${API_URL}/production-employees`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(employeeData),
    });
    return response.json();
  },

  async updateProductionEmployee(id: string, employeeData: any) {
    const response = await apiFetch(`${API_URL}/production-employees/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(employeeData),
    });
    return response.json();
  },

  async deleteProductionEmployee(id: string) {
    const response = await apiFetch(`${API_URL}/production-employees/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return response.json();
  },

  async assignEmployeeToTask(id: string, taskData: { taskId: string; taskType: 'delivery_route' | 'service_order' }) {
    const response = await apiFetch(`${API_URL}/production-employees/${id}/assign`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(taskData),
    });
    return response.json();
  },

  async releaseEmployeeFromTask(id: string) {
    const response = await apiFetch(`${API_URL}/production-employees/${id}/release`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return response.json();
  },

  // Ativos (Endpoints Universais de Assets)
  async scanAssetQrCode(data: string) {
    const query = new URLSearchParams({ data });
    const response = await apiFetch(`${API_URL}/assets/qrcode-scan?${query.toString()}`, {
      headers: getHeaders(),
    });
    return response.json();
  },

  async updateAssetStatus(type: string, id: string, payload: { status: string }) {
    const response = await apiFetch(`${API_URL}/assets/${encodeURIComponent(type)}/${encodeURIComponent(id)}/status`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return response.json();
  },

  async updateAssetLocation(type: string, id: string, payload: { location: string }) {
    const response = await apiFetch(`${API_URL}/assets/${encodeURIComponent(type)}/${encodeURIComponent(id)}/location`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return response.json();
  },

  // Relatórios de produtividade
  async getEmployeeProductivity(params: {
    startDate: string;
    endDate: string;
    role?: string;
    employeeId?: string;
  }) {
    const query = new URLSearchParams({
      startDate: params.startDate,
      endDate: params.endDate
    });
    if (params.role) query.append('role', params.role);
    if (params.employeeId) query.append('employeeId', params.employeeId);

    const response = await apiFetch(`${API_URL}/reports/productivity/employees?${query.toString()}`, {
      headers: getHeaders(),
    });
    return response.json();
  },

  async getCompanyProductivity(params: {
    startDate: string;
    endDate: string;
  }) {
    const query = new URLSearchParams({
      startDate: params.startDate,
      endDate: params.endDate
    });

    const response = await apiFetch(`${API_URL}/reports/productivity/company?${query.toString()}`, {
      headers: getHeaders(),
    });
    return response.json();
  },

  async getMaintenanceAlerts() {
    const response = await apiFetch(`${API_URL}/reports/maintenance-alerts`, {
      headers: getHeaders(),
    });
    return response.json();
  },

  // Relatórios adicionais
  async getStageDurationStats(params: { startDate: string; endDate: string }) {
    const query = new URLSearchParams({
      startDate: params.startDate,
      endDate: params.endDate,
    });
    const response = await apiFetch(`${API_URL}/reports/stage-durations?${query.toString()}`, {
      headers: getHeaders(),
    });
    return response.json();
  },

  async getEmployeeRouteStats(params: { startDate: string; endDate: string }) {
    const query = new URLSearchParams({
      startDate: params.startDate,
      endDate: params.endDate,
    });
    const response = await apiFetch(`${API_URL}/reports/employee-route-stats?${query.toString()}`, {
      headers: getHeaders(),
    });
    return response.json();
  },

  // Order Addendums
  async getOrderAddendums(orderId: string) {
    const response = await apiFetch(`${API_URL}/order-addendums/order/${orderId}`, {
      headers: getHeaders(),
    });
    return response.json();
  },

  async createOrderAddendum(orderId: string, addendumData: any) {
    const response = await apiFetch(`${API_URL}/order-addendums/order/${orderId}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(addendumData),
    });
    return response.json();
  },

  async updateOrderAddendumStatus(addendumId: string, status: 'approved' | 'rejected') {
    const response = await apiFetch(`${API_URL}/order-addendums/${addendumId}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
    return response.json();
  },

  // Service Order Exception Management
  async markOrderForRework(id: string, reason?: string) {
    const response = await apiFetch(`${API_URL}/serviceorders/${id}/mark-rework`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ reason }),
    });
    return response.json();
  },

  async reportDeliveryIssue(id: string, details: string) {
    const response = await apiFetch(`${API_URL}/serviceorders/${id}/report-delivery-issue`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ reason: details }),
    });
    return response.json();
  },

  async requestInstallationReview(id: string, reason?: string) {
    const response = await apiFetch(`${API_URL}/serviceorders/${id}/request-review`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ reason }),
    });
    return response.json();
  },

  async resolveOrderIssue(id: string, resolutionDetails?: string, nextStatus?: string) {
    const response = await apiFetch(`${API_URL}/serviceorders/${id}/resolve-issue`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ resolutionDetails, nextStatus }),
    });
    return response.json();
  },

  async resolveRework(id: string, resolutionDetails?: string, nextStatus?: string) {
    const response = await apiFetch(`${API_URL}/serviceorders/${id}/resolve-rework`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ resolutionDetails, nextStatus }),
    });
    return response.json();
  },

  async resolveDeliveryIssue(id: string, resolutionDetails?: string, nextStatus?: string) {
    const response = await apiFetch(`${API_URL}/serviceorders/${id}/resolve-delivery-issue`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ resolutionDetails, nextStatus }),
    });
    return response.json();
  },

  async completeReview(id: string, resolutionDetails?: string, nextStatus?: string) {
    const response = await apiFetch(`${API_URL}/serviceorders/${id}/complete-review`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ resolutionDetails, nextStatus }),
    });
    return response.json();
  },

  // Service Order Management
  async getAllServiceOrders() {
    const response = await apiFetch(`${API_URL}/serviceorders`, {
      headers: getHeaders(),
    });
    return response.json();
  },
  async createServiceOrder(serviceOrderData: any) {
    const response = await apiFetch(`${API_URL}/serviceorders`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(serviceOrderData),
    });
    return response.json();
  },

  async updateServiceOrderStatus(id: string, status: string, allocatedSlabId?: string) {
    const response = await apiFetch(`${API_URL}/serviceorders/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status, allocatedSlabId }),
    });
    return response.json();
  },

  async updateServiceOrder(id: string, updateData: any) {
    const response = await apiFetch(`${API_URL}/serviceorders/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updateData),
    });
    return response.json();
  },

  // CutPiece Management
  async getCutPiecesForOS(serviceOrderId: string) {
    const response = await apiFetch(`${API_URL}/cut-pieces/by-os/${encodeURIComponent(serviceOrderId)}`, {
      headers: getHeaders(),
    });
    return response.json();
  },

  async getCutPieceByPieceId(pieceId: string) {
    const response = await apiFetch(`${API_URL}/cut-pieces/by-id/${encodeURIComponent(pieceId)}`, {
      headers: getHeaders(),
    });
    return response.json();
  },

  async updateCutPieceStatus(pieceId: string, status: string, reason?: string) {
    const response = await apiFetch(`${API_URL}/cut-pieces/${encodeURIComponent(pieceId)}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status, reason }),
    });
    return response.json();
  },

  async updateCutPieceLocation(pieceId: string, location: string) {
    const response = await apiFetch(`${API_URL}/cut-pieces/${encodeURIComponent(pieceId)}/location`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ location }),
    });
    return response.json();
  },

  // Confirmação de entrega
  async confirmDeliveryData(serviceOrderId: string, data: {
    checklistItems?: Array<{ id?: string; text: string; checked: boolean }>;
    photoUrls?: Array<{ url: string; description?: string }>;
    signatureUrl?: string;
    signatoryName?: string;
    signatoryDocument?: string;
  }) {
    const response = await apiFetch(`${API_URL}/serviceorders/${encodeURIComponent(serviceOrderId)}/confirm-delivery`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return response.json();
  },

  // Invoices (NF-e)
  async getInvoices() {
    const response = await apiFetch(`${API_URL}/invoices`, {
      headers: getHeaders(),
    });
    return response.json();
  },

  async getInvoiceById(id: string) {
    const response = await apiFetch(`${API_URL}/invoices/${encodeURIComponent(id)}`, {
      headers: getHeaders(),
    });
    return response.json();
  },

  async createInvoiceFromOrder(orderId: string) {
    const response = await apiFetch(`${API_URL}/invoices/from-order`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ orderId }),
    });
    return response.json();
  },

  async simulateIssueNFe(id: string) {
    const response = await apiFetch(`${API_URL}/invoices/${encodeURIComponent(id)}/issue`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return response.json();
  },

  // Contracts
  async createContractFromOrder(orderId: string) {
    const response = await apiFetch(`${API_URL}/contracts/from-order`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ orderId }),
    });
    return response.json();
  },

  async getContractById(id: string) {
    const response = await apiFetch(`${API_URL}/contracts/${encodeURIComponent(id)}`, {
      headers: getHeaders(),
    });
    return response.json();
  },

  async signContract(id: string, signData: { name: string; documentNumber: string; signatureDataUrl: string }) {
    const response = await apiFetch(`${API_URL}/contracts/${encodeURIComponent(id)}/sign`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(signData),
    });
    return response.json();
  },

  async uploadFinancialAttachment(file: File) {
    const formData = new FormData();
    formData.append('attachment', file);

    const response = await apiFetch(`${API_URL}/financial-transactions/upload`, {
      method: 'POST',
      headers: getHeaders(), // não definir Content-Type manualmente
      body: formData,
    } as any);
    return response.json();
  },
};
