

import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Drawer } from 'antd';
import {
  DashboardOutlined,
  FileTextOutlined,
  ShoppingCartOutlined,
  ToolOutlined,
  BuildOutlined,
  TruckOutlined,
  InboxOutlined,
  AppstoreOutlined,
  CarOutlined,
  TeamOutlined,
  FileOutlined,
  UserOutlined,
  DollarOutlined,
  FileDoneOutlined,
  BankOutlined,
  SettingOutlined,
  UsergroupAddOutlined,
  HistoryOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  CheckSquareOutlined,
} from '@ant-design/icons';
import type { Page } from '../types';
import { useAuth } from '../context/AuthContext';

const { Sider } = Layout;

interface SidebarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  theme?: 'light' | 'dark';
  onCollapseChange?: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage, theme = 'light', onCollapseChange }) => {
  const { hasAccessToPage } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileDrawerVisible, setMobileDrawerVisible] = useState(false);

  // Detectar se é mobile
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setMobileDrawerVisible(false);
      }
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Mapear páginas para ícones do Ant Design
  const getIcon = (page: Page) => {
    const iconMap: Record<Page, React.ReactNode> = {
      dashboard: <DashboardOutlined />,
      quotes: <FileTextOutlined />,
      orders: <ShoppingCartOutlined />,
      production: <ToolOutlined />,
      assembly: <BuildOutlined />,
      logistics: <TruckOutlined />,
      operations_dashboard: <FileDoneOutlined />,
      stock: <InboxOutlined />,
      catalog: <AppstoreOutlined />,
      suppliers: <TeamOutlined />,
      receipts: <FileOutlined />,
      crm: <UserOutlined />,
      invoices: <DollarOutlined />,
      finance: <BankOutlined />,
      equipment: <SettingOutlined />,
      vehicles: <CarOutlined />,
      production_employees: <UsergroupAddOutlined />,
      activity_log: <HistoryOutlined />,
      users: <UserOutlined />,
      checklist_templates: <CheckSquareOutlined />,
    };
    return iconMap[page] || <DashboardOutlined />;
  };

  // Mapear páginas para labels
  const getLabel = (page: Page) => {
    const labelMap: Record<Page, string> = {
      dashboard: 'Dashboard',
      quotes: 'Orçamentos',
      orders: 'Pedidos',
      production: 'Produção',
      assembly: 'Montagem',
      logistics: 'Logística',
      operations_dashboard: 'Operações',
      stock: 'Estoque',
      catalog: 'Catálogo',
      suppliers: 'Fornecedores',
      receipts: 'Recibos',
      crm: 'CRM',
      invoices: 'Faturamento',
      finance: 'Financeiro',
      equipment: 'Equipamentos',
      vehicles: 'Veículos',
      production_employees: 'Funcionários',
      activity_log: 'Histórico',
      users: 'Usuários',
      checklist_templates: 'Checklists',
    };
    return labelMap[page] || page;
  };

  // Criar itens do menu baseado nas permissões
  const menuItems = [
    { key: 'dashboard', icon: getIcon('dashboard'), label: getLabel('dashboard') },
    { key: 'quotes', icon: getIcon('quotes'), label: getLabel('quotes') },
    { key: 'orders', icon: getIcon('orders'), label: getLabel('orders') },
    { key: 'operations_dashboard', icon: getIcon('operations_dashboard'), label: getLabel('operations_dashboard') },
    { key: 'production', icon: getIcon('production'), label: getLabel('production') },
    { key: 'assembly', icon: getIcon('assembly'), label: getLabel('assembly') },
    { key: 'logistics', icon: getIcon('logistics'), label: getLabel('logistics') },
    { key: 'checklist_templates', icon: getIcon('checklist_templates'), label: getLabel('checklist_templates') },
    { key: 'stock', icon: getIcon('stock'), label: getLabel('stock') },
    { key: 'catalog', icon: getIcon('catalog'), label: getLabel('catalog') },
    { key: 'suppliers', icon: getIcon('suppliers'), label: getLabel('suppliers') },
    { key: 'receipts', icon: getIcon('receipts'), label: getLabel('receipts') },
    { key: 'crm', icon: getIcon('crm'), label: getLabel('crm') },
    { key: 'invoices', icon: getIcon('invoices'), label: getLabel('invoices') },
    { key: 'finance', icon: getIcon('finance'), label: getLabel('finance') },
    { key: 'equipment', icon: getIcon('equipment'), label: getLabel('equipment') },
    { key: 'vehicles', icon: getIcon('vehicles'), label: getLabel('vehicles') },
    { key: 'production_employees', icon: getIcon('production_employees'), label: getLabel('production_employees') },
    { key: 'activity_log', icon: getIcon('activity_log'), label: getLabel('activity_log') },
    { key: 'users', icon: getIcon('users'), label: getLabel('users') },
  ].filter(item => hasAccessToPage(item.key as Page));

  const handleMenuClick = ({ key }: { key: string }) => {
    setCurrentPage(key as Page);
    if (isMobile) {
      setMobileDrawerVisible(false);
    }
  };

  const toggleCollapse = () => {
    const newCollapsed = !collapsed;
    setCollapsed(newCollapsed);
    onCollapseChange?.(newCollapsed);
  };

  const showMobileDrawer = () => {
    setMobileDrawerVisible(true);
  };

  const menuContent = (
    <div className="flex items-center justify-center h-16 border-b border-gray-200 dark:border-gray-700">
      {!collapsed && (
        <h1 className="text-xl font-bold text-gray-800 dark:text-white">
          Marmoraria ERP
        </h1>
      )}
      {collapsed && (
        <h1 className="text-lg font-bold text-gray-800 dark:text-white">
          ME
        </h1>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <>
        <Button
          type="text"
          icon={<MenuUnfoldOutlined />}
          onClick={showMobileDrawer}
          className={`fixed top-4 left-4 z-50 shadow-lg ${
            theme === 'dark' 
              ? 'bg-gray-800 text-white hover:bg-gray-700' 
              : 'bg-white text-gray-800 hover:bg-gray-50'
          }`}
          size="large"
        />
        <Drawer
          title="Marmoraria ERP"
          placement="left"
          onClose={() => setMobileDrawerVisible(false)}
          open={mobileDrawerVisible}
          width={280}
          className={`mobile-drawer ${theme === 'dark' ? 'dark' : ''}`}
          styles={{
            body: {
              backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
              color: theme === 'dark' ? '#ffffff' : '#000000'
            },
            header: {
              backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
              color: theme === 'dark' ? '#ffffff' : '#000000',
              borderBottom: theme === 'dark' ? '1px solid #374151' : '1px solid #e5e7eb'
            }
          }}
        >
          <div className="h-full flex flex-col">
            {menuContent}
            <div className="flex-1 overflow-y-auto">
              <Menu
                mode="inline"
                selectedKeys={[currentPage]}
                items={menuItems}
                onClick={handleMenuClick}
                className="border-r-0"
                style={{ 
                  backgroundColor: 'transparent'
                }}
                theme={theme}
              />
            </div>
          </div>
        </Drawer>
      </>
    );
  }

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      width={256}
      collapsedWidth={80}
      className="bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-shrink-0"
      style={{
        overflow: 'hidden',
        height: '100vh',
        transition: 'all 0.3s ease-in-out',
      }}
    >
      <div className="flex flex-col h-full">
        {menuContent}
        <div className="flex-1 overflow-y-auto">
          <Menu
            mode="inline"
            selectedKeys={[currentPage]}
            items={menuItems}
            onClick={handleMenuClick}
            className="border-r-0"
            style={{ 
              backgroundColor: 'transparent'
            }}
            theme={theme}
          />
        </div>
        <div className="flex-shrink-0 p-2 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={toggleCollapse}
            className="w-full h-10 flex items-center justify-center"
            size="large"
          />
        </div>
      </div>
    </Sider>
  );
};

export default Sidebar;