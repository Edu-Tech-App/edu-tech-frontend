import { useNavigate, useLocation } from "react-router";
import { useAuth } from "../context/AuthContext";
import { BookOpen, LayoutDashboard, GraduationCap, Calendar, DollarSign, Users, LogOut, BarChart3, BookMarked, Library, DoorOpen, CalendarCheck, X } from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const getMenuItemsByRole = () => {
    switch (user?.rol) {
      case 'estudiante':
      case 'docente':
        return [
          { icon: LayoutDashboard, label: 'Inicio', path: '/dashboard' },
          { icon: BookOpen, label: 'Biblioteca', path: '/library' },
          { icon: Calendar, label: 'Mis Préstamos', path: '/my-loans' },
          { icon: DoorOpen, label: 'Salas de Estudio', path: '/rooms' },
          { icon: CalendarCheck, label: 'Mis Reservas', path: '/my-room-reservations' },
          { icon: GraduationCap, label: 'Materias', path: '/subjects' },
          { icon: DollarSign, label: 'Mis Multas', path: '/my-fines' },
        ];
      case 'bibliotecario':
        return [
          { icon: LayoutDashboard, label: 'Inicio', path: '/dashboard' },
          { icon: Library, label: 'Libros', path: '/book-management' },
          { icon: BookMarked, label: 'Préstamos Activos', path: '/active-loans' },
          { icon: CalendarCheck, label: 'Reservas y Préstamos', path: '/reservations' },
          { icon: Users, label: 'Usuarios', path: '/users' },
        ];
      case 'administrativo':
        return [
          { icon: LayoutDashboard, label: 'Inicio', path: '/dashboard' },
          { icon: BarChart3, label: 'Estadísticas', path: '/statistics' },
          { icon: Library, label: 'Libros', path: '/book-management' },
          { icon: DoorOpen, label: 'Salas', path: '/rooms-management' },
          { icon: CalendarCheck, label: 'Reservas y Préstamos', path: '/reservations' },
          { icon: Users, label: 'Usuarios', path: '/users' },
          { icon: GraduationCap, label: 'Materias', path: '/subjects' },
          { icon: DollarSign, label: 'Multas', path: '/fines' },
        ];
      default:
        return [{ icon: LayoutDashboard, label: 'Inicio', path: '/dashboard' }];
    }
  };

  const menuItems = getMenuItemsByRole();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose(); // cierra en móvil al navegar
  };

  return (
    <>
      {/* Overlay oscuro en móvil */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        w-64 bg-blue-900 text-white h-screen fixed left-0 top-0 flex flex-col z-40
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="p-6 border-b border-blue-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-800 flex items-center justify-center shrink-0">
              <GraduationCap size={24} className="text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Edu-Tech</h1>
              <p className="text-blue-200 text-sm mt-1">Sistema Institucional</p>
            </div>
            {/* Botón cerrar solo en móvil */}
            <button
              onClick={onClose}
              className="lg:hidden p-1 rounded-lg hover:bg-blue-800 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                  isActive ? 'bg-blue-700' : 'hover:bg-blue-800'
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-blue-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-800 transition-colors"
          >
            <LogOut size={20} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </>
  );
};
