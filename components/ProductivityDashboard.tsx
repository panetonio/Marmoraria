import React, { useState, useEffect, useMemo } from 'react';
import type { ProductionEmployee, ServiceOrder } from '../types';
import Card, { CardHeader, CardContent } from './ui/Card';
import Button from './ui/Button';
import Badge from './ui/Badge';
import StatusBadge from './ui/StatusBadge';
import { api } from '../utils/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart
} from 'recharts';

interface ProductivityFilters {
  startDate: string;
  endDate: string;
  role: string;
  employeeId: string;
}

interface EmployeeProductivity {
  employeeId: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  hireDate: string;
  metrics: {
    totalOrders: number;
    completedOrders: number;
    completionRate: number;
    totalRoutes: number;
    completedRoutes: number;
    routeCompletionRate: number;
    avgCompletionTime: number;
    totalActivities: number;
    avgActivitiesPerDay: number;
    efficiencyScore: number;
  };
  activitiesByDay: Record<string, number>;
  recentOrders: Array<{
    id: string;
    clientName: string;
    status: string;
    deliveryDate: string;
    total: number;
  }>;
  recentRoutes: Array<{
    id: string;
    type: string;
    status: string;
    scheduledStart: string;
    scheduledEnd: string;
  }>;
}

interface CompanyProductivity {
  period: { start: string; end: string };
  summary: {
    totalOrders: number;
    completedOrders: number;
    completionRate: number;
    totalRoutes: number;
    completedRoutes: number;
    routeCompletionRate: number;
    totalRevenue: number;
    completedRevenue: number;
    revenueCompletionRate: number;
  };
  productivityByRole: Array<{
    role: string;
    totalEmployees: number;
    orderCompletionRate: number;
    routeCompletionRate: number;
    avgEfficiency: number;
  }>;
}

interface ProductivityDashboardProps {
  serviceOrders: ServiceOrder[];
  productionEmployees: ProductionEmployee[];
}

const ProductivityDashboard: React.FC<ProductivityDashboardProps> = ({
  serviceOrders,
  productionEmployees
}) => {
  const [filters, setFilters] = useState<ProductivityFilters>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    role: '',
    employeeId: ''
  });

  const [employeeData, setEmployeeData] = useState<EmployeeProductivity[]>([]);
  const [companyData, setCompanyData] = useState<CompanyProductivity | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Carregar dados
  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const [employeeResponse, companyResponse] = await Promise.all([
        api.getEmployeeProductivity({
          startDate: filters.startDate,
          endDate: filters.endDate,
          role: filters.role || undefined,
          employeeId: filters.employeeId || undefined
        }),
        api.getCompanyProductivity({
          startDate: filters.startDate,
          endDate: filters.endDate
        })
      ]);

      if (employeeResponse.success) {
        setEmployeeData(employeeResponse.data.employees);
      } else {
        throw new Error(employeeResponse.message);
      }

      if (companyResponse.success) {
        setCompanyData(companyResponse.data);
      } else {
        throw new Error(companyResponse.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
      console.error('Erro ao carregar produtividade:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters]);

  // Dados para gráficos
  const chartData = useMemo(() => {
    return employeeData.map(emp => ({
      name: emp.name,
      efficiency: emp.metrics.efficiencyScore,
      completionRate: emp.metrics.completionRate,
      routeCompletionRate: emp.metrics.routeCompletionRate,
      totalOrders: emp.metrics.totalOrders,
      totalRoutes: emp.metrics.totalRoutes,
      activities: emp.metrics.totalActivities
    }));
  }, [employeeData]);

  const roleData = useMemo(() => {
    if (!companyData) return [];
    return companyData.productivityByRole.map(role => ({
      role: role.role,
      employees: role.totalEmployees,
      orderCompletion: role.orderCompletionRate,
      routeCompletion: role.routeCompletionRate,
      efficiency: role.avgEfficiency
    }));
  }, [companyData]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  const getEfficiencyColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getEfficiencyBadge = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-secondary dark:text-slate-400">Carregando dados de produtividade...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 mb-4">❌ {error}</div>
        <Button onClick={loadData}>Tentar Novamente</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-text-primary dark:text-slate-100">
            📊 Filtros de Produtividade
          </h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-2">
                Data Inicial
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full p-2 border border-border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-text-primary dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-2">
                Data Final
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full p-2 border border-border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-text-primary dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-2">
                Função
              </label>
              <select
                value={filters.role}
                onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
                className="w-full p-2 border border-border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-text-primary dark:text-slate-100"
              >
                <option value="">Todas as funções</option>
                <option value="cortador">Cortador</option>
                <option value="acabador">Acabador</option>
                <option value="montador">Montador</option>
                <option value="entregador">Entregador</option>
                <option value="supervisor">Supervisor</option>
                <option value="auxiliar">Auxiliar</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-2">
                Funcionário
              </label>
              <select
                value={filters.employeeId}
                onChange={(e) => setFilters(prev => ({ ...prev, employeeId: e.target.value }))}
                className="w-full p-2 border border-border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-text-primary dark:text-slate-100"
              >
                <option value="">Todos os funcionários</option>
                {productionEmployees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo Geral */}
      {companyData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-500">{companyData.summary.totalOrders}</div>
              <div className="text-sm text-text-secondary dark:text-slate-400">Total de OSs</div>
              <div className="text-xs text-green-600 mt-1">
                {companyData.summary.completionRate.toFixed(1)}% concluídas
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">{companyData.summary.totalRoutes}</div>
              <div className="text-sm text-text-secondary dark:text-slate-400">Total de Rotas</div>
              <div className="text-xs text-green-600 mt-1">
                {companyData.summary.routeCompletionRate.toFixed(1)}% concluídas
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">
                R$ {companyData.summary.completedRevenue.toLocaleString('pt-BR')}
              </div>
              <div className="text-sm text-text-secondary dark:text-slate-400">Receita Concluída</div>
              <div className="text-xs text-green-600 mt-1">
                {companyData.summary.revenueCompletionRate.toFixed(1)}% do total
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-500">{employeeData.length}</div>
              <div className="text-sm text-text-secondary dark:text-slate-400">Funcionários</div>
              <div className="text-xs text-blue-600 mt-1">
                {employeeData.length > 0 
                  ? (employeeData.reduce((sum, emp) => sum + emp.metrics.efficiencyScore, 0) / employeeData.length).toFixed(1)
                  : 0
                }% eficiência média
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Eficiência por Funcionário */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-text-primary dark:text-slate-100">
              📈 Eficiência por Funcionário
            </h3>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="efficiency" fill="#8884d8" name="Eficiência (%)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Produtividade por Função */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-text-primary dark:text-slate-100">
              🎯 Produtividade por Função
            </h3>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={roleData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="efficiency"
                  nameKey="role"
                  label={({ role, efficiency }) => `${role}: ${efficiency.toFixed(1)}%`}
                >
                  {roleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabela Detalhada */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-text-primary dark:text-slate-100">
            👥 Detalhes por Funcionário
          </h3>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border dark:border-slate-700">
                  <th className="text-left py-3 px-4 text-text-primary dark:text-slate-100">Funcionário</th>
                  <th className="text-left py-3 px-4 text-text-primary dark:text-slate-100">Função</th>
                  <th className="text-center py-3 px-4 text-text-primary dark:text-slate-100">OSs</th>
                  <th className="text-center py-3 px-4 text-text-primary dark:text-slate-100">Rotas</th>
                  <th className="text-center py-3 px-4 text-text-primary dark:text-slate-100">Eficiência</th>
                  <th className="text-center py-3 px-4 text-text-primary dark:text-slate-100">Atividades</th>
                </tr>
              </thead>
              <tbody>
                {employeeData.map((employee) => (
                  <tr key={employee.employeeId} className="border-b border-border dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium text-text-primary dark:text-slate-100">{employee.name}</div>
                        <div className="text-sm text-text-secondary dark:text-slate-400">{employee.email}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="info">{employee.role}</Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="text-sm">
                        <div className="font-medium">{employee.metrics.totalOrders}</div>
                        <div className="text-xs text-text-secondary dark:text-slate-400">
                          {employee.metrics.completedOrders} concluídas
                        </div>
                        <div className="text-xs text-green-600">
                          {employee.metrics.completionRate.toFixed(1)}%
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="text-sm">
                        <div className="font-medium">{employee.metrics.totalRoutes}</div>
                        <div className="text-xs text-text-secondary dark:text-slate-400">
                          {employee.metrics.completedRoutes} concluídas
                        </div>
                        <div className="text-xs text-green-600">
                          {employee.metrics.routeCompletionRate.toFixed(1)}%
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center">
                        <div className={`text-sm font-medium ${getEfficiencyColor(employee.metrics.efficiencyScore)}`}>
                          {employee.metrics.efficiencyScore.toFixed(1)}%
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="text-sm">
                        <div className="font-medium">{employee.metrics.totalActivities}</div>
                        <div className="text-xs text-text-secondary dark:text-slate-400">
                          {employee.metrics.avgActivitiesPerDay.toFixed(1)}/dia
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Top Performers */}
      {employeeData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-text-primary dark:text-slate-100">
                🏆 Top Performers
              </h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {employeeData.slice(0, 3).map((employee, index) => (
                  <div key={employee.employeeId} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-text-primary dark:text-slate-100">{employee.name}</div>
                        <div className="text-sm text-text-secondary dark:text-slate-400">{employee.role}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">{employee.metrics.efficiencyScore.toFixed(1)}%</div>
                      <div className="text-xs text-text-secondary dark:text-slate-400">Eficiência</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-text-primary dark:text-slate-100">
                📈 Áreas de Melhoria
              </h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {employeeData.slice(-3).reverse().map((employee, index) => (
                  <div key={employee.employeeId} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {employeeData.length - index}
                      </div>
                      <div>
                        <div className="font-medium text-text-primary dark:text-slate-100">{employee.name}</div>
                        <div className="text-sm text-text-secondary dark:text-slate-400">{employee.role}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-orange-600">{employee.metrics.efficiencyScore.toFixed(1)}%</div>
                      <div className="text-xs text-text-secondary dark:text-slate-400">Eficiência</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ProductivityDashboard;