import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Breadcrumbs from './components/Breadcrumbs';
import Dashboard from './pages/Dashboard';
import QuotesPage from './pages/QuotesPage';
import OrdersPage from './pages/OrdersPage';
import ProductionPage from './pages/ProductionPage';
import LogisticsPage from './pages/LogisticsPage';
import StockPage from './pages/StockPage';
import CatalogPage from './pages/CatalogPage';
import SuppliersPage from './pages/SuppliersPage';
import CrmPage from './pages/CrmPage';
import FinancePage from './pages/FinancePage';
import InvoicesPage from './pages/InvoicesPage';
import ReceiptsPage from './pages/ReceiptsPage';
import type { Page, User } from './types';
import { mockUsers } from './data/mockData';
import { ROLES, PERMISSIONS } from './roles';
import Card from './components/ui/Card';
import ThemeToggle from './components/ThemeToggle';
import GlobalSearch from './components/GlobalSearch';
import { DataProvider } from './context/DataContext';
import Select from './components/ui/Select';

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
      <div className="w-48">
        <Select
          id="user-select"
          label="Usuário Simulado"
          value={currentUser.id}
          onChange={handleSelectChange}
        >
          {mockUsers.map(user => (
            <option key={user.id} value={user.id}>
              {user.name} ({ROLES[user.role].displayName})
            </option>
          ))}
        </Select>
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
        return <OrdersPage searchTarget={searchTarget} clearSearchTarget={clearSearchTarget} />;
      case 'production':
        return <ProductionPage />;
      case 'logistics':
        return <LogisticsPage />;
      case 'stock':
        return <StockPage />;
      case 'catalog':
        return <CatalogPage />;
      case 'suppliers':
        return <SuppliersPage />;
      case 'crm':
        return <CrmPage searchTarget={searchTarget} clearSearchTarget={clearSearchTarget} />;
      case 'invoices':
        return <InvoicesPage searchTarget={searchTarget} clearSearchTarget={clearSearchTarget} />;
      case 'finance':
        return <FinancePage />;
      case 'receipts':
        return <ReceiptsPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <DataProvider>
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
    </DataProvider>
  );
};

export default App;