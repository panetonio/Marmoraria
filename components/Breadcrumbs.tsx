import React from 'react';
import type { Page } from '../types';

interface BreadcrumbProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
}

const PAGE_LABELS: Record<Page, string> = {
  dashboard: 'Dashboard',
  quotes: 'Orçamentos',
  orders: 'Pedidos',
  production: 'Produção',
  assembly: 'Montagem',
  logistics: 'Logística',
  stock: 'Estoque',
  suppliers: 'Fornecedores',
  crm: 'CRM',
  finance: 'Financeiro',
  invoices: 'Faturamento',
  receipts: 'Recibos',
  catalog: 'Catálogo',
  equipment: 'Equipamentos',
  production_employees: 'Funcionários',
  activity_log: 'Histórico',
  users: 'Usuários',
};

const Breadcrumbs: React.FC<BreadcrumbProps> = ({ currentPage, setCurrentPage }) => {
  const path = [
    { label: 'Início', page: 'dashboard' as Page },
  ];

  if (currentPage !== 'dashboard') {
    path.push({ label: PAGE_LABELS[currentPage], page: currentPage });
  }

  return (
    <nav className="mb-4 text-sm" aria-label="Breadcrumb">
      <ol className="list-none p-0 inline-flex items-center space-x-2 text-text-secondary dark:text-slate-400">
        {path.map((item, index) => {
          const isLast = index === path.length - 1;
          return (
            <li key={item.page} className="flex items-center">
              
              <a
                href="#"
                onClick={(e) => {
                  if (isLast) {
                    e.preventDefault();
                    return;
                  };
                  e.preventDefault();
                  setCurrentPage(item.page);
                }}
                className={`flex items-center hover:text-primary ${isLast ? 'pointer-events-none' : 'hover:underline'}`}
                aria-current={isLast ? 'page' : undefined}
              >
                {index === 0 && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                    </svg>
                )}
                 <span className={`${isLast ? 'font-semibold text-text-primary dark:text-slate-100' : ''} ${index > 0 ? 'ml-2' : 'sr-only'}`}>
                    {item.label}
                 </span>
              </a>
              
              {!isLast && (
                <svg className="h-5 w-5 text-gray-400 dark:text-slate-500 ml-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;