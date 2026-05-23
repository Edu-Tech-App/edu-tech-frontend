import { useState, useEffect, useRef } from "react";
import { Bell, User, BookOpen, DoorOpen, DollarSign, AlertCircle, CheckCircle, Menu, Sun, Moon, Settings } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../../services/api";
import { useTheme } from "../context/ThemeContext";
import { EditProfileModal } from "./EditProfileModal";

interface Notification {
  id: number;
  type: "loan" | "fine" | "reservation" | "room";
  message: string;
  read: boolean;
  icon: "BookOpen" | "DollarSign" | "CalendarCheck" | "DoorOpen";
}

interface TopBarProps {
  onMenuToggle: () => void;
}

const iconMap: Record<Notification["icon"], React.ReactNode> = {
  BookOpen: <BookOpen size={16} />,
  DollarSign: <DollarSign size={16} />,
  CalendarCheck: <CheckCircle size={16} />,
  DoorOpen: <DoorOpen size={16} />,
};

export const TopBar = ({ onMenuToggle }: TopBarProps) => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Cargar foto de perfil
  useEffect(() => {
    if (user?.id) {
      const saved = localStorage.getItem(`profilePhoto_${user.id}`);
      if (saved) setProfilePhoto(saved);
    }
  }, [user?.id, showEditProfile]); // se recarga al cerrar el modal

  useEffect(() => {
    const buildNotifications = async () => {
      const list: Notification[] = [];
      try {
        if ((user?.rol === "estudiante" || user?.rol === "docente") && user.id) {
          const loans = await api.getStudentLoans(user.id);
          if (loans?.some((l: any) => l.estado === "VENCIDO")) {
            list.push({ id: 1, type: "loan", message: "Tienes préstamos vencidos pendientes", read: false, icon: "BookOpen" });
          }
          const fines = await api.getPendingFines(user.id);
          if (fines?.some((f: any) => f.estado === "PENDIENTE")) {
            list.push({ id: 2, type: "fine", message: "Tienes multas pendientes por pagar", read: false, icon: "DollarSign" });
          }
        }
      } catch {
        // silencioso
      }
      setNotifications(list);
    };
    void buildNotifications();
  }, [user]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setShowUserMenu(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  return (
    <>
      <div className="fixed top-0 right-0 left-0 z-20 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 transition-colors dark:border-[#3C4270] dark:bg-[#25294D] lg:left-64 lg:px-6">

        {/* Izquierda */}
        <div className="flex items-center gap-3">
          <button onClick={onMenuToggle} className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-[#323866] lg:hidden">
            <Menu size={22} className="text-gray-600 dark:text-[#F5F7FF]" />
          </button>
          <div>
            <h2 className="text-base lg:text-xl font-semibold text-gray-800 dark:text-[#F5F7FF] leading-tight">
              {user?.nombreCompleto}
            </h2>
            <p className="text-xs lg:text-sm text-gray-500 dark:text-[#B7BDD6] capitalize">{user?.rol}</p>
          </div>
        </div>

        {/* Derecha */}
        <div className="flex items-center gap-2">

          {/* Modo oscuro */}
          <button onClick={toggleTheme} className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-[#323866]">
            {isDark
              ? <Sun size={20} className="text-yellow-400" />
              : <Moon size={20} className="text-gray-600" />}
          </button>

          {/* Campana */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => { setShowNotifications((p) => !p); setShowUserMenu(false); }}
              className="relative rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-[#323866]"
            >
              <Bell size={20} className="text-gray-600 dark:text-[#F5F7FF]" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-12 z-50 w-80 rounded-xl border border-gray-200 bg-white shadow-lg dark:border-[#3C4270] dark:bg-[#2A2F57]">
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-[#3C4270]">
                  <span className="font-semibold text-gray-800 dark:text-[#F5F7FF] text-sm">Notificaciones</span>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-[#6C5CE7] hover:underline">
                      Marcar todas como leídas
                    </button>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center py-8 text-gray-400 dark:text-[#8E95B5]">
                      <CheckCircle size={28} className="mb-2 text-green-400" />
                      <p className="text-sm">Sin notificaciones</p>
                    </div>
                  ) : notifications.map((n) => (
                    <div key={n.id} className={`flex items-start gap-3 border-b border-gray-50 px-4 py-3 dark:border-[#3C4270] ${!n.read ? "bg-[#6C5CE7]/8 dark:bg-[#323866]" : ""}`}>
                      <div className={`mt-0.5 ${n.type === "fine" ? "text-red-500" : "text-[#6C5CE7]"}`}>
                        {n.type === "fine" ? <AlertCircle size={16} /> : iconMap[n.icon]}
                      </div>
                      <p className="text-sm text-gray-700 dark:text-[#F5F7FF]">{n.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Avatar / menú usuario */}
          <div className="relative" ref={userRef}>
            <button
              onClick={() => { setShowUserMenu((p) => !p); setShowNotifications(false); }}
              className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-[#323866]"
            >
              <div className="w-8 h-8 rounded-full bg-[#6C5CE7] flex items-center justify-center overflow-hidden">
                {profilePhoto ? (
                  <img src={profilePhoto} alt="Perfil" className="w-full h-full object-cover" />
                ) : (
                  <User size={16} className="text-white" />
                )}
              </div>
              {/* <span className="hidden lg:block text-sm font-medium text-gray-700 dark:text-[#F5F7FF] max-w-[120px] truncate">
                {user?.nombreCompleto}
              </span> */}
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-12 z-50 w-52 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-[#3C4270] dark:bg-[#2A2F57]">
                {/* Info usuario */}
                <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3 dark:border-[#3C4270]">
                  <div className="w-10 h-10 rounded-full bg-[#6C5CE7] flex items-center justify-center overflow-hidden flex-shrink-0">
                    {profilePhoto ? (
                      <img src={profilePhoto} alt="Perfil" className="w-full h-full object-cover" />
                    ) : (
                      <User size={18} className="text-white" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-[#F5F7FF] truncate">{user?.nombreCompleto}</p>
                    <p className="text-xs text-gray-500 dark:text-[#B7BDD6] capitalize">{user?.rol}</p>
                  </div>
                </div>

                {/* Editar perfil */}
                <button
                  onClick={() => { setShowUserMenu(false); setShowEditProfile(true); }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-[#F5F7FF] dark:hover:bg-[#323866]"
                >
                  <Settings size={16} />
                  Editar Perfil
                </button>


              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de editar perfil */}
      <EditProfileModal open={showEditProfile} onClose={() => setShowEditProfile(false)} />
    </>
  );
};
