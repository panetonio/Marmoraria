import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import Card, { CardContent } from './ui/Card';
import Input from './ui/Input';

const ProductivityDashboard: React.FC = () => {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [stageStats, setStageStats] = useState<any>(null);
  const [employeeStats, setEmployeeStats] = useState<any>(null);
  const [isLoadingStageStats, setIsLoadingStageStats] = useState(false);
  const [isLoadingEmployeeStats, setIsLoadingEmployeeStats] = useState(false);

  useEffect(() => {
    const loadStats = async () => {
      if (startDate && endDate) {
        setIsLoadingStageStats(true);
        setIsLoadingEmployeeStats(true);
        try {
          const [stageResult, employeeResult] = await Promise.all([
            api.getStageDurationStats({ startDate, endDate }),
            api.getEmployeeRouteStats({ startDate, endDate })
          ]);
          setStageStats(stageResult);
          setEmployeeStats(employeeResult);
        } catch (error) {
          console.error('Erro ao carregar estatísticas:', error);
        } finally {
          setIsLoadingStageStats(false);
          setIsLoadingEmployeeStats(false);
        }
      }
    };
    loadStats();
  }, [startDate, endDate]);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent>
          <h2 className="text-xl font-semibold">Relatório de Produtividade</h2>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Data Inicial"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              label="Data Final"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {!startDate || !endDate ? (
        <Card>
          <CardContent>
            <p className="text-sm text-text-secondary dark:text-slate-400">Selecione um período para carregar os dados.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Primeira Coluna: Tempo por Etapa */}
          <Card>
            <CardContent>
              <h3 className="text-lg font-medium">Duração Média por Etapa</h3>
              {isLoadingStageStats ? (
                <div className="mt-4 flex items-center text-sm text-text-secondary dark:text-slate-400">
                  <span className="inline-block h-4 w-4 mr-2 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
                  Carregando...
                </div>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left border-b border-slate-200 dark:border-slate-700">
                        <th className="py-2 pr-4">Etapa</th>
                        <th className="py-2">Tempo Médio (Horas)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(stageStats?.data || []).map((stat: any) => (
                        <tr key={stat.stage} className="border-b border-slate-100 dark:border-slate-800">
                          <td className="py-2 pr-4 capitalize">{stat.stage || '-'}</td>
                          <td className="py-2">{stat.avgDurationHours != null ? Number(stat.avgDurationHours).toFixed(1) : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Segunda Coluna: Entregas por Funcionário */}
          <Card>
            <CardContent>
              <h3 className="text-lg font-medium">Rotas por Funcionário</h3>
              {isLoadingEmployeeStats ? (
                <div className="mt-4 flex items-center text-sm text-text-secondary dark:text-slate-400">
                  <span className="inline-block h-4 w-4 mr-2 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
                  Carregando...
                </div>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left border-b border-slate-200 dark:border-slate-700">
                        <th className="py-2 pr-4">Funcionário</th>
                        <th className="py-2 pr-4">Função</th>
                        <th className="py-2 pr-4">Total Rotas</th>
                        <th className="py-2 pr-4">Entregas</th>
                        <th className="py-2">Instalações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(employeeStats?.data || []).map((stat: any) => (
                        <tr key={stat.employeeId} className="border-b border-slate-100 dark:border-slate-800">
                          <td className="py-2 pr-4">{stat.employeeName || '-'}</td>
                          <td className="py-2 pr-4 capitalize">{stat.employeeRole || '-'}</td>
                          <td className="py-2 pr-4">{stat.totalRoutes ?? '-'}</td>
                          <td className="py-2 pr-4">{stat.totalDeliveries ?? '-'}</td>
                          <td className="py-2">{stat.totalInstallations ?? '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ProductivityDashboard;