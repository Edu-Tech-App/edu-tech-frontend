import { useNavigate, useLocation } from "react-router";
import { useAuth } from "../context/AuthContext";
import { BookOpen, LayoutDashboard, GraduationCap, Calendar, DollarSign, Users, LogOut, BarChart3, BookMarked, Library, DoorOpen, CalendarCheck } from "lucide-react";

export const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const getMenuItemsByRole = () => {
    switch (user?.rol) {  // ✅ "rol" en vez de "role"
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
          { icon: Library, label: 'Gestión de Libros', path: '/book-management' },
          { icon: BookMarked, label: 'Préstamos Activos', path: '/active-loans' },
          { icon: CalendarCheck, label: 'Gestión de Reservas', path: '/room-reservations-management' },
          { icon: Users, label: 'Usuarios', path: '/users' },
        ];

      case 'administrativo':
        return [
          { icon: LayoutDashboard, label: 'Inicio', path: '/dashboard' },
          { icon: BarChart3, label: 'Estadísticas', path: '/statistics' },
          { icon: Library, label: 'Gestión de Libros', path: '/book-management' },
          { icon: CalendarCheck, label: 'Gestión de Reservas', path: '/room-reservations-management' },
          { icon: Users, label: 'Usuarios', path: '/users' },
          { icon: GraduationCap, label: 'Materias', path: '/subjects' },
          { icon: DollarSign, label: 'Multas', path: '/fines' },
        ];

      default:
        return [
          { icon: LayoutDashboard, label: 'Inicio', path: '/dashboard' },
        ];
    }
  };

  const menuItems = getMenuItemsByRole();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="w-64 bg-blue-900 text-white h-screen fixed left-0 top-0 flex flex-col">
      <div className="p-6 border-b border-blue-800">
        <h1 className="text-2xl font-bold">Edu-Tech</h1>
        <p className="text-blue-200 text-sm mt-1">Sistema Institucional</p>
      </div>

      <nav className="flex-1 p-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
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
  );
};