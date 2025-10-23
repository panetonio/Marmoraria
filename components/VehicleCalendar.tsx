import React, { useState, useMemo } from 'react';
import type { Vehicle, DeliveryRoute, ServiceOrder } from '../types';
import Card, { CardHeader, CardContent } from './ui/Card';
import Button from './ui/Button';
import Badge from './ui/Badge';

interface VehicleCalendarProps {
  vehicles: Vehicle[];
  deliveryRoutes: DeliveryRoute[];
  serviceOrders: ServiceOrder[];
  onRouteClick?: (route: DeliveryRoute) => void;
}

const VehicleCalendar: React.FC<VehicleCalendarProps> = ({
  vehicles,
  deliveryRoutes,
  serviceOrders,
  onRouteClick
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');

  // Gerar dias da semana
  const getWeekDays = (baseDate: string): string[] => {
    const date = new Date(baseDate);
    const dayOfWeek = date.getDay();
    const monday = new Date(date);
    monday.setDate(date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));

    const days: string[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      days.push(day.toISOString().split('T')[0]);
    }
    return days;
  };

  const displayDates = viewMode === 'day' ? [selectedDate] : getWeekDays(selectedDate);

  // Filtrar rotas por data
  const getRoutesForDateAndVehicle = (vehicleId: string, date: string) => {
    return deliveryRoutes.filter(route => {
      if (route.vehicleId !== vehicleId) return false;
      
      const routeStart = new Date(route.scheduledStart || route.start);
      const routeDate = routeStart.toISOString().split('T')[0];
      
      return routeDate === date;
    });
  };

  // Verificar conflitos
  const hasConflict = (route: DeliveryRoute): boolean => {
    const routeStart = new Date(route.scheduledStart || route.start);
    const routeEnd = new Date(route.scheduledEnd || route.end);

    const conflicts = deliveryRoutes.filter(other => {
      if (other.id === route.id) return false;
      if (other.vehicleId !== route.vehicleId) return false;

      const otherStart = new Date(other.scheduledStart || other.start);
      const otherEnd = new Date(other.scheduledEnd || other.end);

      // Verificar sobreposição de horários
      return (
        (routeStart >= otherStart && routeStart < otherEnd) ||
        (routeEnd > otherStart && routeEnd <= otherEnd) ||
        (routeStart <= otherStart && routeEnd >= otherEnd)
      );
    });

    return conflicts.length > 0;
  };

  // Obter OS da rota
  const getServiceOrderForRoute = (route: DeliveryRoute): ServiceOrder | undefined => {
    return serviceOrders.find(os => os.id === route.serviceOrderId);
  };

  // Calcular posição e altura do bloco de rota
  const getRouteBlockStyle = (route: DeliveryRoute) => {
    const start = new Date(route.scheduledStart || route.start);
    const end = new Date(route.scheduledEnd || route.end);
    
    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;
    
    // Timeline de 6h às 20h (14 horas)
    const timelineStart = 6;
    const timelineEnd = 20;
    const timelineRange = timelineEnd - timelineStart;
    
    const top = ((startHour - timelineStart) / timelineRange) * 100;
    const height = ((endHour - startHour) / timelineRange) * 100;
    
    return {
      top: `${Math.max(0, Math.min(100, top))}%`,
      height: `${Math.max(5, Math.min(100 - top, height))}%`
    };
  };

  const getRouteColor = (route: DeliveryRoute) => {
    if (hasConflict(route)) return 'bg-red-500 border-red-700';
    if (route.status === 'completed') return 'bg-green-500 border-green-700';
    if (route.status === 'in_progress') return 'bg-orange-500 border-orange-700';
    if (route.type === 'installation') return 'bg-purple-500 border-purple-700';
    return 'bg-blue-500 border-blue-700';
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const current = new Date(selectedDate);
    const days = viewMode === 'day' ? 1 : 7;
    current.setDate(current.getDate() + (direction === 'next' ? days : -days));
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const goToToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-text-primary dark:text-slate-100">
            Calendário de Veículos
          </h2>
          <div className="flex items-center space-x-3">
            {/* Navegação de data */}
            <div className="flex items-center space-x-2">
              <Button size="sm" variant="ghost" onClick={() => navigateDate('prev')}>
                ←
              </Button>
              <Button size="sm" variant="secondary" onClick={goToToday}>
                Hoje
              </Button>
              <Button size="sm" variant="ghost" onClick={() => navigateDate('next')}>
                →
              </Button>
            </div>

            {/* Toggle de visualização */}
            <div className="flex bg-slate-200 dark:bg-slate-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('day')}
                className={`px-3 py-1 rounded text-sm font-medium transition ${
                  viewMode === 'day'
                    ? 'bg-white dark:bg-slate-600 shadow'
                    : 'text-text-secondary dark:text-slate-400'
                }`}
              >
                Dia
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-1 rounded text-sm font-medium transition ${
                  viewMode === 'week'
                    ? 'bg-white dark:bg-slate-600 shadow'
                    : 'text-text-secondary dark:text-slate-400'
                }`}
              >
                Semana
              </button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Legenda */}
        <div className="flex flex-wrap gap-4 mb-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-xs text-text-secondary dark:text-slate-400">Entrega</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-500 rounded"></div>
            <span className="text-xs text-text-secondary dark:text-slate-400">Instalação</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500 rounded"></div>
            <span className="text-xs text-text-secondary dark:text-slate-400">Em Andamento</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-xs text-text-secondary dark:text-slate-400">Concluído</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-xs text-text-secondary dark:text-slate-400">Conflito</span>
          </div>
        </div>

        {/* Calendário */}
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header com datas */}
            <div className="grid gap-1 mb-2" style={{ gridTemplateColumns: `120px repeat(${displayDates.length}, 1fr)` }}>
              <div className="p-2 font-semibold text-sm text-text-secondary dark:text-slate-400">
                Veículo
              </div>
              {displayDates.map(date => {
                const dateObj = new Date(date);
                const isToday = date === new Date().toISOString().split('T')[0];
                return (
                  <div
                    key={date}
                    className={`p-2 text-center rounded-t-lg ${
                      isToday
                        ? 'bg-primary text-white font-bold'
                        : 'bg-slate-100 dark:bg-slate-700'
                    }`}
                  >
                    <div className="text-xs">
                      {dateObj.toLocaleDateString('pt-BR', { weekday: 'short' })}
                    </div>
                    <div className="text-sm font-semibold">
                      {dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Grid de veículos e rotas */}
            {vehicles.map(vehicle => (
              <div
                key={vehicle.id}
                className="grid gap-1 mb-2"
                style={{ gridTemplateColumns: `120px repeat(${displayDates.length}, 1fr)` }}
              >
                {/* Coluna do veículo */}
                <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-l-lg flex flex-col justify-center">
                  <div className="font-semibold text-sm text-text-primary dark:text-slate-100">
                    {vehicle.name}
                  </div>
                  <div className="text-xs text-text-secondary dark:text-slate-400">
                    {vehicle.licensePlate}
                  </div>
                  <Badge
                    variant={
                      vehicle.status === 'disponivel'
                        ? 'success'
                        : vehicle.status === 'em_manutencao'
                        ? 'error'
                        : 'warning'
                    }
                    className="mt-1 text-xs"
                  >
                    {vehicle.status === 'disponivel' ? 'Disponível' : 
                     vehicle.status === 'em_manutencao' ? 'Manutenção' : 'Em Uso'}
                  </Badge>
                </div>

                {/* Colunas de datas */}
                {displayDates.map(date => {
                  const routes = getRoutesForDateAndVehicle(vehicle.id, date);
                  const isToday = date === new Date().toISOString().split('T')[0];

                  return (
                    <div
                      key={`${vehicle.id}-${date}`}
                      className={`relative border-2 border-border dark:border-slate-600 rounded-lg min-h-[120px] ${
                        isToday ? 'bg-primary/5' : 'bg-white dark:bg-slate-800'
                      }`}
                      style={{ minHeight: '200px' }}
                    >
                      {/* Timeline de horas (visual) */}
                      <div className="absolute inset-0 opacity-20">
                        {[8, 12, 16].map(hour => (
                          <div
                            key={hour}
                            className="absolute w-full border-t border-slate-300 dark:border-slate-600"
                            style={{ top: `${((hour - 6) / 14) * 100}%` }}
                          />
                        ))}
                      </div>

                      {/* Rotas */}
                      {routes.map(route => {
                        const os = getServiceOrderForRoute(route);
                        const style = getRouteBlockStyle(route);
                        const color = getRouteColor(route);
                        const isConflict = hasConflict(route);

                        return (
                          <div
                            key={route.id}
                            className={`absolute left-1 right-1 ${color} text-white rounded px-2 py-1 cursor-pointer hover:opacity-90 transition border-2 overflow-hidden`}
                            style={style}
                            onClick={() => onRouteClick?.(route)}
                            title={`${os?.clientName || 'Cliente'} - ${new Date(route.scheduledStart || route.start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
                          >
                            <div className="text-xs font-semibold truncate">
                              {os?.id || route.serviceOrderId}
                            </div>
                            <div className="text-xs truncate">
                              {os?.clientName || 'Cliente'}
                            </div>
                            <div className="text-xs">
                              {new Date(route.scheduledStart || route.start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              {' - '}
                              {new Date(route.scheduledEnd || route.end).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            {isConflict && (
                              <div className="text-xs font-bold mt-1">⚠️ CONFLITO</div>
                            )}
                          </div>
                        );
                      })}

                      {/* Indicador de vazio */}
                      {routes.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center text-text-secondary dark:text-slate-500 text-xs">
                          Livre
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

            {vehicles.length === 0 && (
              <div className="text-center p-8 text-text-secondary dark:text-slate-400">
                Nenhum veículo cadastrado
              </div>
            )}
          </div>
        </div>

        {/* Escala de horários */}
        <div className="mt-4 flex justify-center gap-4 text-xs text-text-secondary dark:text-slate-400">
          <span>6h</span>
          <span>8h</span>
          <span>10h</span>
          <span>12h</span>
          <span>14h</span>
          <span>16h</span>
          <span>18h</span>
          <span>20h</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default VehicleCalendar;

