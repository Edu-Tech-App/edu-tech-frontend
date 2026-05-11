import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Bell, User, BookOpen, DoorOpen, DollarSign, AlertCircle, CheckCircle } from "lucide-react";
import { Badge } from "./ui/badge";

interface Notification {
  id: string;
  type: 'warning' | 'success' | 'info' | 'error';
  title: string;
  message: string;
  icon: React.ReactNode;
  time: string;
  isRead: boolean;
}

export const TopBar = () => {
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  const getNotificationsByRole = (): Notification[] => {
    switch (user?.role) {
      case 'student':
      case 'teacher':
        return [
          {
            id: '1',
            type: 'warning',
            title: 'Préstamo por vencer',
            message: 'El libro "Introducción a los Algoritmos" vence mañana',
            icon: <BookOpen size={20} className="text-yellow-600" />,
            time: 'Hace 2 horas',
            isRead: false,
          },
          {
            id: '2',
            type: 'success',
            title: 'Reserva aprobada',
            message: 'Tu reserva de Sala A para el 26/04 fue aprobada',
            icon: <CheckCircle size={20} className="text-green-600" />,
            time: 'Hace 3 horas',
            isRead: false,
          },
          {
            id: '3',
            type: 'error',
            title: 'Multa pendiente',
            message: 'Tienes una multa de $6 por pagar',
            icon: <DollarSign size={20} className="text-red-600" />,
            time: 'Hace 5 horas',
            isRead: true,
          },
          {
            id: '4',
            type: 'info',
            title: 'Nuevo material disponible',
            message: 'Se agregaron 5 libros nuevos de tu categoría favorita',
            icon: <BookOpen size={20} className="text-blue-600" />,
            time: 'Hace 1 día',
            isRead: true,
          },
        ];

      case 'librarian':
        return [
          {
            id: '1',
            type: 'warning',
            title: 'Reserva pendiente',
            message: '3 reservas de salas esperan aprobación',
            icon: <DoorOpen size={20} className="text-yellow-600" />,
            time: 'Hace 1 hora',
            isRead: false,
          },
          {
            id: '2',
            type: 'error',
            title: 'Préstamo vencido',
            message: 'Juan Pérez tiene un libro vencido hace 3 días',
            icon: <AlertCircle size={20} className="text-red-600" />,
            time: 'Hace 2 horas',
            isRead: false,
          },
        ];

      case 'admin':
        return [
          {
            id: '1',
            type: 'warning',
            title: 'Reservas pendientes',
            message: '5 reservas de salas esperan aprobación',
            icon: <DoorOpen size={20} className="text-yellow-600" />,
            time: 'Hace 30 min',
            isRead: false,
          },
          {
            id: '2',
            type: 'error',
            title: 'Multas sin cobrar',
            message: '$340 en multas pendientes de cobro',
            icon: <DollarSign size={20} className="text-red-600" />,
            time: 'Hace 1 hora',
            isRead: false,
          },
          {
            id: '3',
            type: 'info',
            title: 'Reporte mensual',
            message: 'Reporte de actividad de abril disponible',
            icon: <BookOpen size={20} className="text-blue-600" />,
            time: 'Hace 2 horas',
            isRead: true,
          },
        ];

      default:
        return [];
    }
  };

  const notifications = getNotificationsByRole();
  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  const getNotificationBgColor = (type: string) => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="h-16 bg-white border-b border-gray-200 fixed top-0 right-0 left-64 z-10 flex items-center justify-between px-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-800">Bienvenido, {user?.name}</h2>
        <p className="text-sm text-gray-500 capitalize">{user?.role}</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Bell size={20} className="text-gray-600" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-1 -right-1 bg-red-500 text-white px-1.5 py-0.5 text-xs">
                {unreadCount}
              </Badge>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 max-h-[500px] overflow-hidden z-50">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Notificaciones</h3>
                {unreadCount > 0 && (
                  <Badge className="bg-red-500 text-white">
                    {unreadCount} nueva{unreadCount !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>

              <div className="overflow-y-auto max-h-[400px]">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                        !notification.isRead ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${getNotificationBgColor(notification.type)}`}>
                          {notification.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-1">
                            <h4 className="font-medium text-sm text-gray-900">
                              {notification.title}
                            </h4>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1.5" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{notification.message}</p>
                          <p className="text-xs text-gray-500">{notification.time}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <Bell size={32} className="mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No tienes notificaciones</p>
                  </div>
                )}
              </div>

              {notifications.length > 0 && (
                <div className="p-3 border-t border-gray-200 text-center">
                  <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    Ver todas las notificaciones
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
          <User size={20} className="text-gray-600" />
          <span className="text-sm text-gray-700">{user?.email}</span>
        </div>
      </div>
    </div>
  );
};
