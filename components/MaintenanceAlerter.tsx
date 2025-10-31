import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

interface MaintenanceAlert {
  type: 'warranty' | 'maintenance';
  equipmentName: string;
  date: string;
  equipmentId: string;
}

// Adicione a prop setCurrentPage se não estiver usando react-router
interface MaintenanceAlerterProps {
  setCurrentPage?: (page: 'equipment', id: string) => void;
  onAlertClick?: (page: 'equipment', id: string) => void;
}

const MaintenanceAlerter: React.FC<MaintenanceAlerterProps> = ({ setCurrentPage, onAlertClick }) => {
  const { currentUser, hasAccessToPage } = useAuth();

  const handleAlertClick = (equipmentId: string, toastId: string) => {
    if (onAlertClick) {
      onAlertClick('equipment', equipmentId);
    } else if (setCurrentPage) {
      setCurrentPage('equipment', equipmentId);
    }
    toast.dismiss(toastId);
  };

  useEffect(() => {
    const hasAccess = hasAccessToPage('equipment');
    const todayStr = new Date().toDateString();
    const checkedToday = localStorage.getItem('maintenanceAlertChecked') === todayStr;

    if (currentUser && hasAccess && !checkedToday) {
      localStorage.setItem('maintenanceAlertChecked', todayStr); // Evita spam de alertas por dia

      api.getMaintenanceAlerts()
        .then(result => {
          if (result?.success && Array.isArray(result.data) && result.data.length > 0) {
            (result.data as MaintenanceAlert[]).forEach((alert: MaintenanceAlert) => {
              const message = alert.type === 'warranty'
                ? `Garantia do equipamento "${alert.equipmentName}" vence em ${new Date(alert.date).toLocaleDateString()}`
                : `Manutenção preventiva para "${alert.equipmentName}" agendada para ${new Date(alert.date).toLocaleDateString()}`;

              toast.error(
                (t) => (
                  <span onClick={() => handleAlertClick(alert.equipmentId, t.id)}>
                    <b>ALERTA DE MANUTENÇÃO:</b><br />
                    {message}
                    <br />
                    <b style={{ textDecoration: 'underline' }}>Clique aqui para ver o equipamento.</b>
                  </span>
                ),
                {
                  id: `maint-alert-${alert.equipmentId}-${alert.type}`,
                  duration: 10000,
                  style: {
                    background: '#fffbe6',
                    color: '#92400e',
                    border: '1px solid #fde68a',
                  },
                  iconTheme: {
                    primary: '#f59e0b',
                    secondary: '#fffbe6',
                  },
                }
              );
            });
          }
        })
        .catch(err => console.error('Erro ao buscar alertas de manutenção:', err));
    }
  }, [currentUser, hasAccessToPage, setCurrentPage]);

  return null;
};

export default MaintenanceAlerter;


