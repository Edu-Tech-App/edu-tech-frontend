import { useAuth } from "../context/AuthContext";
import { Sidebar } from "../components/Sidebar";
import { TopBar } from "../components/TopBar";
import { StudentDashboard } from "../components/dashboards/StudentDashboard";
import { TeacherDashboard } from "../components/dashboards/TeacherDashboard";
import { LibrarianDashboard } from "../components/dashboards/LibrarianDashboard";
import { AdminDashboard } from "../components/dashboards/AdminDashboard";

export const DashboardPage = () => {
  const { user } = useAuth();

  const renderDashboard = () => {
    switch (user?.rol) {  // ✅ "rol" en vez de "role"
      case 'estudiante':
        return <StudentDashboard />;
      case 'docente':
        return <TeacherDashboard />;
      case 'bibliotecario':
        return <LibrarianDashboard />;
      case 'administrativo':
        return <AdminDashboard />;
      default:
        return <div className="p-8 text-gray-500">Rol no reconocido: {user?.rol}</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <TopBar />
      <main className="ml-64 pt-16">
        {renderDashboard()}
      </main>
    </div>
  );
};