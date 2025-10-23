const API_URL = 'http://localhost:5000/api';

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

export const api = {
  // Autenticação
  async login(email: string, password: string) {
    const response = await fetch(`${API_URL}/auth/login`, {
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
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify(userData),
    });
    return response.json();
  },

  async getMe() {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: getHeaders(),
    });
    return response.json();
  },

  // Usuários
  async getUsers() {
    const response = await fetch(`${API_URL}/users`, {
      headers: getHeaders(),
    });
    return response.json();
  },

  async createUser(userData: any) {
    const response = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(userData),
    });
    return response.json();
  },

  async updateUser(id: string, userData: any) {
    const response = await fetch(`${API_URL}/users/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(userData),
    });
    return response.json();
  },

  async deleteUser(id: string) {
    const response = await fetch(`${API_URL}/users/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return response.json();
  },

  async toggleUserStatus(id: string) {
    const response = await fetch(`${API_URL}/users/${id}/toggle-status`, {
      method: 'PATCH',
      headers: getHeaders(),
    });
    return response.json();
  },

  async updateUserPermissions(id: string, permissions: string[]) {
    const response = await fetch(`${API_URL}/users/${id}/permissions`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ customPermissions: permissions }),
    });
    return response.json();
  },

  // Clientes
  async getClients() {
    const response = await fetch(`${API_URL}/clients`, {
      headers: getHeaders(),
    });
    return response.json();
  },

  async getClientById(id: string) {
    const response = await fetch(`${API_URL}/clients/${id}`, {
      headers: getHeaders(),
    });
    return response.json();
  },

  async createClient(clientData: any) {
    const response = await fetch(`${API_URL}/clients`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(clientData),
    });
    return response.json();
  },

  async updateClient(id: string, clientData: any) {
    const response = await fetch(`${API_URL}/clients/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(clientData),
    });
    return response.json();
  },

  async deleteClient(id: string) {
    const response = await fetch(`${API_URL}/clients/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return response.json();
  },

  // Anotações de clientes
  async getClientNotes(clientId: string) {
    const response = await fetch(`${API_URL}/clients/${clientId}/notes`, {
      headers: getHeaders(),
    });
    return response.json();
  },

  async createClientNote(clientId: string, content: string) {
    const response = await fetch(`${API_URL}/clients/${clientId}/notes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ content }),
    });
    return response.json();
  },

  async updateClientNote(clientId: string, noteId: string, content: string) {
    const response = await fetch(`${API_URL}/clients/${clientId}/notes/${noteId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ content }),
    });
    return response.json();
  },

  async deleteClientNote(clientId: string, noteId: string) {
    const response = await fetch(`${API_URL}/clients/${clientId}/notes/${noteId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return response.json();
  },

  async getChecklistTemplates() {
    const response = await fetch(`${API_URL}/checklist-templates`, {
      headers: getHeaders(),
    });
    return response.json();
  },

  async createChecklistTemplate(template: { name: string; type: 'entrega' | 'montagem'; items: { text: string }[] }) {
    const response = await fetch(`${API_URL}/checklist-templates`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(template),
    });
    return response.json();
  },

  async updateChecklistTemplate(id: string, template: { name: string; type: 'entrega' | 'montagem'; items: { text: string }[] }) {
    const response = await fetch(`${API_URL}/checklist-templates/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(template),
    });
    return response.json();
  },

  async deleteChecklistTemplate(id: string) {
    const response = await fetch(`${API_URL}/checklist-templates/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return response.json();
  },

  async updateServiceOrderChecklist(id: string, checklist: { id: string; text: string; checked: boolean }[]) {
    const response = await fetch(`${API_URL}/serviceorders/${id}/checklist`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ checklist }),
    });
    return response.json();
  },

  // Fornecedores
  async getSuppliers() {
    const response = await fetch(`${API_URL}/suppliers`, {
      headers: getHeaders(),
    });
    return response.json();
  },

  async getSupplierById(id: string) {
    const response = await fetch(`${API_URL}/suppliers/${id}`, {
      headers: getHeaders(),
    });
    return response.json();
  },

  async createSupplier(supplierData: any) {
    const response = await fetch(`${API_URL}/suppliers`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(supplierData),
    });
    return response.json();
  },

  async updateSupplier(id: string, supplierData: any) {
    const response = await fetch(`${API_URL}/suppliers/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(supplierData),
    });
    return response.json();
  },

  async deleteSupplier(id: string) {
    const response = await fetch(`${API_URL}/suppliers/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return response.json();
  },

  // Orçamentos
  async getQuotes() {
    const response = await fetch(`${API_URL}/quotes`, {
      headers: getHeaders(),
    });
    return response.json();
  },

  async getQuoteById(id: string) {
    const response = await fetch(`${API_URL}/quotes/${id}`, {
      headers: getHeaders(),
    });
    return response.json();
  },

  async createQuote(quoteData: any) {
    const response = await fetch(`${API_URL}/quotes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(quoteData),
    });
    return response.json();
  },

  async updateQuote(id: string, quoteData: any) {
    const response = await fetch(`${API_URL}/quotes/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(quoteData),
    });
    return response.json();
  },

  async deleteQuote(id: string) {
    const response = await fetch(`${API_URL}/quotes/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return response.json();
  },

  // Pedidos
  async getOrders() {
    const response = await fetch(`${API_URL}/orders`, {
      headers: getHeaders(),
    });
    return response.json();
  },

  async getOrderById(id: string) {
    const response = await fetch(`${API_URL}/orders/${id}`, {
      headers: getHeaders(),
    });
    return response.json();
  },

  async createOrder(orderData: any) {
    const response = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(orderData),
    });
    return response.json();
  },

  async updateOrder(id: string, orderData: any) {
    const response = await fetch(`${API_URL}/orders/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(orderData),
    });
    return response.json();
  },

  async deleteOrder(id: string) {
    const response = await fetch(`${API_URL}/orders/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return response.json();
  },

  // Veículos
  async getVehicles() {
    const response = await fetch(`${API_URL}/vehicles`, {
      headers: getHeaders(),
    });
    return response.json();
  },

  async createVehicle(vehicleData: any) {
    const response = await fetch(`${API_URL}/vehicles`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(vehicleData),
    });
    return response.json();
  },

  async updateVehicle(id: string, vehicleData: any) {
    const response = await fetch(`${API_URL}/vehicles/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(vehicleData),
    });
    return response.json();
  },

  async deleteVehicle(id: string) {
    const response = await fetch(`${API_URL}/vehicles/${id}`, {
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
    const response = await fetch(`${API_URL}/delivery-routes${qs ? `?${qs}` : ''}`, {
      headers: getHeaders(),
    });
    return response.json();
  },

  async createDeliveryRoute(routeData: any) {
    const response = await fetch(`${API_URL}/delivery-routes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(routeData),
    });
    return response.json();
  },

  async updateDeliveryRoute(id: string, routeData: any) {
    const response = await fetch(`${API_URL}/delivery-routes/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(routeData),
    });
    return response.json();
  },

  async deleteDeliveryRoute(id: string) {
    const response = await fetch(`${API_URL}/delivery-routes/${id}`, {
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
    const response = await fetch(`${API_URL}/delivery-routes/availability/check?${query.toString()}`, {
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
    const response = await fetch(`${API_URL}/delivery-routes/resources/availability?${query.toString()}`, {
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
    const response = await fetch(`${API_URL}/production-employees${qs ? `?${qs}` : ''}`, {
      headers: getHeaders(),
    });
    return response.json();
  },

  async getProductionEmployeeById(id: string) {
    const response = await fetch(`${API_URL}/production-employees/${id}`, {
      headers: getHeaders(),
    });
    return response.json();
  },

  async createProductionEmployee(employeeData: any) {
    const response = await fetch(`${API_URL}/production-employees`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(employeeData),
    });
    return response.json();
  },

  async updateProductionEmployee(id: string, employeeData: any) {
    const response = await fetch(`${API_URL}/production-employees/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(employeeData),
    });
    return response.json();
  },

  async deleteProductionEmployee(id: string) {
    const response = await fetch(`${API_URL}/production-employees/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return response.json();
  },

  async assignEmployeeToTask(id: string, taskData: { taskId: string; taskType: 'delivery_route' | 'service_order' }) {
    const response = await fetch(`${API_URL}/production-employees/${id}/assign`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(taskData),
    });
    return response.json();
  },

  async releaseEmployeeFromTask(id: string) {
    const response = await fetch(`${API_URL}/production-employees/${id}/release`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return response.json();
  },

  // Estoque
  async getStockItemByQrCode(id: string) {
    const response = await fetch(`${API_URL}/stock/qrcode/${encodeURIComponent(id)}`, {
      headers: getHeaders(),
    });
    return response.json();
  },

  async updateStockItemStatus(id: string, data: { status?: string; location?: string }) {
    const response = await fetch(`${API_URL}/stock/qrcode/${encodeURIComponent(id)}/status`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return response.json();
  },

  // Ativos
  async scanAssetQrCode(data: string) {
    const query = new URLSearchParams({ data });
    const response = await fetch(`${API_URL}/assets/qrcode-scan?${query.toString()}`, {
      headers: getHeaders(),
    });
    return response.json();
  },

  async updateAssetStatus(type: string, id: string, payload: { status: string }) {
    const response = await fetch(`${API_URL}/assets/${encodeURIComponent(type)}/${encodeURIComponent(id)}/status`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return response.json();
  },

  async updateAssetLocation(type: string, id: string, payload: { location: string }) {
    const response = await fetch(`${API_URL}/assets/${encodeURIComponent(type)}/${encodeURIComponent(id)}/location`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return response.json();
  },
};
