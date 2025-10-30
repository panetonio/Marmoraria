import React from 'react';
import Card, { CardContent } from './ui/Card';

const ProductivityDashboard: React.FC = () => (
  <Card>
    <CardContent>
      <h2 className="text-xl font-semibold">Relatório de Produtividade</h2>
      <p className="text-text-secondary dark:text-slate-400">
        Gráficos e estatísticas de produtividade (tempo médio por etapa, OS por funcionário, etc.) serão exibidos aqui.
      </p>
    </CardContent>
  </Card>
);

export default ProductivityDashboard;