import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Breadcrumbs from './components/Breadcrumbs';
import Dashboard from './pages/Dashboard';
import QuotesPage from './pages/QuotesPage';
import OrdersPage from './pages/OrdersPage';
import ProductionPage from './pages/ProductionPage';
import StockPage from './pages/StockPage';
import SuppliersPage from './pages/SuppliersPage';
import CrmPage from './pages/CrmPage';
import FinancePage from './pages/FinancePage';
import InvoicesPage from './pages/InvoicesPage';
import type { Page, User, Order, ServiceOrder, Invoice } from './types';
import { mockUsers, mockOrders, mockServiceOrders, mockInvoices } from './data/mockData';
import { ROLES, PERMISSIONS } from './roles';
import Card from './components/ui/Card';
import ThemeToggle from './components/ThemeToggle';
import GlobalSearch from './components/GlobalSearch';

const UserSwitcher: React.FC<{
  currentUser: User;
  onUserChange: (user: User) => void;
}> = ({ currentUser, onUserChange }) => {
  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedUserId = event.target.value;
    const selectedUser = mockUsers.find(u => u.id === selectedUserId);
    if (selectedUser) {
      onUserChange(selectedUser);
    }
  };

  return (
    <Card className="p-4 flex items-center space-x-4">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-text-secondary dark:text-slate-400" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
      </svg>
      <div>
        <label htmlFor="user-select" className="block text-sm font-medium text-text-secondary dark:text-slate-400">
          Usuário Simulado
        </label>
        <select
          id="user-select"
          value={currentUser.id}
          onChange={handleSelectChange}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-border dark:border-slate-600 dark:bg-slate-700 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
        >
          {mockUsers.map(user => (
            <option key={user.id} value={user.id}>
              {user.name} ({ROLES[user.role].displayName})
            </option>
          ))}
        </select>
      </div>
    </Card>
  );
};


const App: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || savedTheme === 'light') {
      return savedTheme;
    }
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };
  
  const [currentUser, setCurrentUser] = useState<User>(mockUsers[0]);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [searchTarget, setSearchTarget] = useState<{ page: Page; id: string } | null>(null);

  // Lifted state for shared data
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>(mockServiceOrders);
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);


  useEffect(() => {
    // When user changes, check if they can still view the current page.
    // If not, redirect them to their default page (dashboard).
    const requiredPermission = PERMISSIONS[currentPage];
    if (requiredPermission) {
        const hasAccess = ROLES[currentUser.role].permissions.includes(requiredPermission);
        if (!hasAccess) {
        setCurrentPage('dashboard');
        }
    }
  }, [currentUser, currentPage]);

  const handleSearchNavigate = (page: Page, id: string) => {
    setCurrentPage(page);
    setSearchTarget({ page, id });
  };
  
  const clearSearchTarget = () => setSearchTarget(null);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'quotes':
        return <QuotesPage searchTarget={searchTarget} clearSearchTarget={clearSearchTarget} />;
      case 'orders':
        return <OrdersPage orders={orders} setOrders={setOrders} serviceOrders={serviceOrders} setServiceOrders={setServiceOrders} searchTarget={searchTarget} clearSearchTarget={clearSearchTarget} />;
      case 'production':
        return <ProductionPage serviceOrders={serviceOrders} setServiceOrders={setServiceOrders} />;
      case 'stock':
        return <StockPage />;
      case 'suppliers':
        return <SuppliersPage />;
      case 'crm':
        return <CrmPage searchTarget={searchTarget} clearSearchTarget={clearSearchTarget} />;
      case 'invoices':
        return <InvoicesPage orders={orders} invoices={invoices} setInvoices={setInvoices} searchTarget={searchTarget} clearSearchTarget={clearSearchTarget} />;
      case 'finance':
        return <FinancePage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen font-sans">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} user={currentUser} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-background dark:bg-slate-900 p-4 flex justify-end items-center space-x-4 border-b border-border dark:border-slate-700">
            <GlobalSearch onNavigate={handleSearchNavigate} />
            <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
            <UserSwitcher currentUser={currentUser} onUserChange={setCurrentUser} />
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background dark:bg-slate-900">
          <div className="container mx-auto px-6 py-8">
            <Breadcrumbs currentPage={currentPage} setCurrentPage={setCurrentPage} />
            {renderPage()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;