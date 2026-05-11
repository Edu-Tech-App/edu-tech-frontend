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
    switch (user?.role) {
      case 'student':
        return <StudentDashboard />;
      case 'teacher':
        return <TeacherDashboard />;
      case 'librarian':
        return <LibrarianDashboard />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return null;
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
