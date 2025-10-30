import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Breadcrumbs from './components/Breadcrumbs';
import Dashboard from './pages/Dashboard';
import QuotesPage from './pages/QuotesPage';
import OrdersPage from './pages/OrdersPage';
import StockPage from './pages/StockPage';
import CatalogPage from './pages/CatalogPage';
import SuppliersPage from './pages/SuppliersPage';
import CrmPage from './pages/CrmPage';
import FinancePage from './pages/FinancePage';
import InvoicesPage from './pages/InvoicesPage';
import ReceiptsPage from './pages/ReceiptsPage';
import EquipmentPage from './pages/EquipmentPage';
import VehiclesPage from './pages/VehiclesPage';
import ProductionEmployeesPage from './pages/ProductionEmployeesPage';
import ActivityLogPage from './pages/ActivityLogPage';
import UsersPage from './pages/UsersPage';
import ChecklistTemplatesPage from './pages/ChecklistTemplatesPage';
import ShopfloorDashboard from './pages/ShopfloorDashboard';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import type { Page } from './types';
import ThemeToggle from './components/ThemeToggle';
import GlobalSearch from './components/GlobalSearch';
import Button from './components/ui/Button';
import { DataProvider } from './context/DataContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

const UserInfo: React.FC = () => {
  const { currentUser, logout } = useAuth();

  if (!currentUser) return null;

  return (
    <div className="flex items-center gap-3 bg-white dark:bg-slate-800 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-600 dark:text-slate-400" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
      </svg>
      <div className="flex-1">
        <p className="text-sm font-medium text-slate-800 dark:text-white">
          {currentUser.name}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {currentUser.email}
        </p>
      </div>
      <Button
        variant="secondary"
        onClick={logout}
        title="Sair"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
        </svg>
      </Button>
    </div>
  );
};


const MainApp: React.FC = () => {
  const { currentUser, hasAccessToPage } = useAuth();
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
  
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [searchTarget, setSearchTarget] = useState<{ page: Page; id: string } | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    // When accessing a page, check if user has permission
    if (!hasAccessToPage(currentPage)) {
      setCurrentPage('dashboard');
    }
  }, [currentPage, hasAccessToPage]);

  const handleSearchNavigate = (page: Page, id: string) => {
    setCurrentPage(page);
    setSearchTarget({ page, id });
  };
  
  const clearSearchTarget = () => setSearchTarget(null);

  const renderPage = () => {
    if (!hasAccessToPage(currentPage)) {
      return <Dashboard />;
    }

    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'quotes':
        return <QuotesPage searchTarget={searchTarget} clearSearchTarget={clearSearchTarget} />;
      case 'orders':
        return <OrdersPage searchTarget={searchTarget} clearSearchTarget={clearSearchTarget} />;
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
      case 'equipment':
          return <EquipmentPage />;
      case 'vehicles':
        return <VehiclesPage />;
        case 'production_employees':
            return <ProductionEmployeesPage />;
      case 'activity_log':
        return <ActivityLogPage />;
      case 'users':
        return <UsersPage />;
      case 'checklist_templates':
        return <ChecklistTemplatesPage />;
      case 'shopfloor_dashboard':
        return <ShopfloorDashboard />;
      default:
        return <Dashboard />;
    }
  };

  if (!currentUser) {
    return null; // Será tratado pelo App principal
  }

  return (
    <DataProvider>
      <div className="flex h-screen font-sans overflow-hidden">
        <Sidebar 
          currentPage={currentPage} 
          setCurrentPage={setCurrentPage} 
          theme={theme} 
          onCollapseChange={setSidebarCollapsed}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-background dark:bg-slate-900 p-4 flex justify-end items-center space-x-4 border-b border-border dark:border-slate-700">
              <GlobalSearch onNavigate={handleSearchNavigate} />
              <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
              <UserInfo />
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

const App: React.FC = () => {
  const [showRegister, setShowRegister] = useState(false);

  return (
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#fff',
            color: '#333',
          },
          success: {
            style: {
              background: '#16a34a', // Cor de sucesso
              color: '#fff',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#16a34a',
            },
          },
          error: {
            style: {
              background: '#dc2626', // Cor de erro
              color: '#fff',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#dc2626',
            },
          },
        }}
      />
      <AuthWrapper showRegister={showRegister} setShowRegister={setShowRegister} />
    </AuthProvider>
  );
};

const AuthWrapper: React.FC<{ 
  showRegister: boolean; 
  setShowRegister: (show: boolean) => void;
}> = ({ showRegister, setShowRegister }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    if (showRegister) {
      return <RegisterPage onLoginClick={() => setShowRegister(false)} />;
    }
    return <LoginPage onRegisterClick={() => setShowRegister(true)} />;
  }

  return <MainApp />;
};

export default App;