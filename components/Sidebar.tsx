

import React from 'react';
import type { Page } from '../types';
import { ICONS } from '../constants';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
}

const NavLink: React.FC<{
  page: Page;
  label: string;
  icon: React.ReactNode;
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
}> = ({ page, label, icon, currentPage, setCurrentPage }) => {
  const isActive = currentPage === page;
  return (
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        setCurrentPage(page);
      }}
      className={`flex items-center px-4 py-2 mt-5 text-gray-100 transition-colors duration-200 transform rounded-md hover:bg-slate-700 ${isActive ? 'bg-slate-700' : ''}`}
    >
      {icon}
      <span className="mx-4 font-medium">{label}</span>
    </a>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage }) => {
  const { hasAccessToPage } = useAuth();

  return (
    <div className="flex flex-col w-64 bg-dark h-full text-white">
      <div className="flex items-center justify-center h-20 border-b border-slate-700">
        <h1 className="text-2xl font-bold">Marmoraria ERP</h1>
      </div>
      <div className="flex flex-col flex-1 p-4">
        <nav>
          {hasAccessToPage('dashboard') && <NavLink page="dashboard" label="Dashboard" icon={ICONS.dashboard} currentPage={currentPage} setCurrentPage={setCurrentPage} />}
          {hasAccessToPage('quotes') && <NavLink page="quotes" label="Orçamentos" icon={ICONS.quotes} currentPage={currentPage} setCurrentPage={setCurrentPage} />}
          {hasAccessToPage('orders') && <NavLink page="orders" label="Pedidos" icon={ICONS.orders} currentPage={currentPage} setCurrentPage={setCurrentPage} />}
          {hasAccessToPage('production') && <NavLink page="production" label="Produção" icon={ICONS.production} currentPage={currentPage} setCurrentPage={setCurrentPage} />}
          {hasAccessToPage('logistics') && <NavLink page="logistics" label="Logística" icon={ICONS.logistics} currentPage={currentPage} setCurrentPage={setCurrentPage} />}
          {hasAccessToPage('stock') && <NavLink page="stock" label="Estoque" icon={ICONS.stock} currentPage={currentPage} setCurrentPage={setCurrentPage} />}
          {hasAccessToPage('catalog') && <NavLink page="catalog" label="Catálogo" icon={ICONS.catalog} currentPage={currentPage} setCurrentPage={setCurrentPage} />}
          {hasAccessToPage('suppliers') && <NavLink page="suppliers" label="Fornecedores" icon={ICONS.suppliers} currentPage={currentPage} setCurrentPage={setCurrentPage} />}
          {hasAccessToPage('receipts') && <NavLink page="receipts" label="Recibos" icon={ICONS.receipts} currentPage={currentPage} setCurrentPage={setCurrentPage} />}
          {hasAccessToPage('crm') && <NavLink page="crm" label="CRM" icon={ICONS.crm} currentPage={currentPage} setCurrentPage={setCurrentPage} />}
          {hasAccessToPage('invoices') && <NavLink page="invoices" label="Faturamento" icon={ICONS.invoices} currentPage={currentPage} setCurrentPage={setCurrentPage} />}
          {hasAccessToPage('finance') && <NavLink page="finance" label="Financeiro" icon={ICONS.finance} currentPage={currentPage} setCurrentPage={setCurrentPage} />}
          {hasAccessToPage('users') && <NavLink page="users" label="Usuários" icon={ICONS.users} currentPage={currentPage} setCurrentPage={setCurrentPage} />}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;