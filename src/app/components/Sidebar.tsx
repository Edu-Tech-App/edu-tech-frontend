import { useNavigate, useLocation } from "react-router";
import { FaGraduationCap } from "react-icons/fa6";
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
        w-64 text-[var(--color-sidebar-foreground)] h-screen fixed left-0 top-0 flex flex-col z-40
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}
      style={{ background: "var(--sidebar-gradient)" }}>
        <div className="p-6 border-b" style={{ borderColor: "var(--sidebar-border)" }}>
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "var(--sidebar-icon-surface)" }}
            >
              <FaGraduationCap size={22} className="text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Edu Tech</h1>
              <p className="text-sm mt-1" style={{ color: "var(--sidebar-muted)" }}>Sistema Institucional</p>
            </div>
            {/* Botón cerrar solo en móvil */}
            <button
              onClick={onClose}
              className="lg:hidden p-1 rounded-lg transition-colors"
              style={{ backgroundColor: "transparent" }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--sidebar-item-hover)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
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
                className="w-full flex items-center gap-3 px-4 py-3 rounded-[12px] mb-2 transition-colors text-left"
                style={{
                  backgroundColor: isActive ? "var(--sidebar-item-active)" : "transparent",
                  color: isActive ? "#FFFFFF" : "var(--sidebar-item)",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = "var(--sidebar-item-hover)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <Icon size={20} className="shrink-0" />
                <span className="whitespace-nowrap text-sm leading-none">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t" style={{ borderColor: "var(--sidebar-border)" }}>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-[12px] transition-colors"
            style={{ color: "var(--sidebar-item)" }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--sidebar-item-hover)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
          >
            <LogOut size={20} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </>
  );
};
