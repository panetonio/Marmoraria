import React from 'react';
import { ICONS } from '../constants';
import Card, { CardContent } from '../components/ui/Card';

const KPICard: React.FC<{ title: string; value: string; icon: React.ReactNode }> = ({ title, value, icon }) => (
  <Card className="p-6">
    <div className="flex items-center">
      <div className="p-3 bg-primary rounded-full text-white">
        {icon}
      </div>
      <div className="ml-4">
        <p className="text-text-secondary dark:text-slate-400 text-sm">{title}</p>
        <p className="text-2xl font-semibold text-text-primary dark:text-slate-100">{value}</p>
      </div>
    </div>
  </Card>
);

const Dashboard: React.FC = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold text-text-primary dark:text-slate-100">Dashboard</h1>
      <p className="mt-2 text-text-secondary dark:text-slate-400">Visão geral dos indicadores da empresa.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
        <KPICard title="Faturamento Mensal" value="R$ 45.850,00" icon={ICONS.finance} />
        <KPICard title="Ticket Médio" value="R$ 3.526,92" icon={ICONS.quotes} />
        <KPICard title="Orçamentos em Aberto" value="12" icon={ICONS.quotes} />
        <KPICard title="Ordens em Produção" value="8" icon={ICONS.production} />
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent>
            <h2 className="text-xl font-semibold text-text-primary dark:text-slate-100">Atividades Recentes</h2>
            <ul className="mt-4 space-y-4">
              <li className="flex items-center text-text-primary dark:text-slate-300">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                Orçamento #ORC-2024-001 aprovado por João da Silva.
              </li>
              <li className="flex items-center text-text-primary dark:text-slate-300">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                Nova ordem de produção #OP-102 iniciada.
              </li>
              <li className="flex items-center text-text-primary dark:text-slate-300">
                <span className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></span>
                Medição agendada para o cliente Carlos Andrade.
              </li>
               <li className="flex items-center text-text-primary dark:text-slate-300">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
                Estoque baixo para o item "Cola Epóxi".
              </li>
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <h2 className="text-xl font-semibold text-text-primary dark:text-slate-100">Status da Produção</h2>
            <p className="mt-4 text-text-secondary dark:text-slate-400">Em breve: Gráfico de funil de produção aqui.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;