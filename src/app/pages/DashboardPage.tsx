import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Sidebar } from "../components/Sidebar";
import { TopBar } from "../components/TopBar";
import { useAuth } from "../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { BookMarked, BookOpen, Calendar, CheckCircle, Clock, DollarSign, DoorOpen, Library, Users } from "lucide-react";
import { api } from "../../services/api";
import { toast } from "sonner";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value);

const formatDate = (value?: string) => {
  if (!value) return "Sin fecha";
  return new Date(value).toLocaleDateString("es-ES");
};

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const loadDashboard = async () => {
      if (!user) return;

      try {
        setLoading(true);

        if (user.rol === "administrativo") {
          const [users, books, subjects, rooms, roomReservations, loans] = await Promise.all([
            api.getUsers(),
            api.getBooks(),
            api.getSubjects(),
            api.getStudyRooms(),
            api.getRoomReservations(),
            api.getLoans(),
          ]);

          setData({
            totalUsers: users.length,
            totalBooks: books.length,
            totalSubjects: subjects.length,
            totalRooms: rooms.length,
            activeReservations: roomReservations.filter((item: any) => item.estado === "ACTIVA").length,
            activeLoans: loans.filter((item: any) => item.estado === "ACTIVO").length,
          });
          return;
        }

        if (user.rol === "bibliotecario") {
          const [books, loans] = await Promise.all([api.getBooks(), api.getLoans()]);
          const activeLoans = loans.filter((loan: any) => loan.estado === "ACTIVO");
          const overdueLoans = loans.filter((loan: any) => loan.estado === "VENCIDO");
          const pendingFines = loans.reduce((sum: number, loan: any) => {
            if (loan.multa?.estado === "PENDIENTE") {
              return sum + Number(loan.multa.monto || 0);
            }
            return sum;
          }, 0);

          setData({
            activeLoansCount: activeLoans.length,
            overdueLoansCount: overdueLoans.length,
            pendingFines,
            recentLoans: loans.slice(0, 5),
            availableBooks: books.filter((book: any) => book.estado === "DISPONIBLE").length,
          });
          return;
        }

        if (user.rol === "docente") {
          const [subjects, reservations] = await Promise.all([
            api.getSubjects(),
            api.getRoomReservationsByUser(user.id),
          ]);

          const mySubjects = subjects.filter((subject: any) => subject.docenteId === user.id);
          setData({
            subjectCount: mySubjects.length,
            activeReservations: reservations.filter((item: any) => item.estado === "ACTIVA").length,
            completedReservations: reservations.filter((item: any) => item.estado === "COMPLETADA").length,
            subjects: mySubjects.slice(0, 5),
          });
          return;
        }

        if (user.rol === "estudiante") {
          const [subjects, loans, reservations, pendingFines] = await Promise.all([
            api.getSubjects(),
            api.getStudentLoans(user.id),
            api.getRoomReservationsByUser(user.id),
            api.getPendingFines ? api.getPendingFines(user.id) : Promise.resolve([]),
          ]);

          const activeLoans = loans.filter((loan: any) => loan.estado === "ACTIVO");
          const finesAmount = (pendingFines as any[]).reduce((sum, fine) => sum + Number(fine.monto || 0), 0);

          setData({
            subjectsCount: subjects.length,
            activeLoansCount: activeLoans.length,
            reservationsCount: reservations.filter((item: any) => item.estado === "ACTIVA").length,
            finesAmount,
            subjects: subjects.slice(0, 4),
          });
        }
      } catch (error: any) {
        toast.error(error.message || "No se pudo cargar la información de inicio");
      } finally {
        setLoading(false);
      }
    };

    void loadDashboard();
  }, [user]);

  const cardClass = "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700";
  const titleClass = "metric-label";
  const valueClass = "mt-2 text-3xl font-bold text-gray-800 dark:text-[#F5F7FF]";
  const iconClass = "flex h-12 w-12 items-center justify-center rounded-lg bg-[#6C5CE7]/14 dark:bg-gray-700/50 text-[#6C5CE7] dark:text-[#F5F7FF]";
  const sectionBg = "rounded-lg bg-gray-50 dark:bg-gray-700/50 p-3";

  const renderAdmin = () => (
    <div className="page-shell space-y-6">
      <div className="page-header">
        <h1 className="page-title">Panel Administrativo</h1>
        <p className="page-subtitle">Visibilidad central del sistema, recursos institucionales y actividad operativa en un solo lugar.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[
          { title: "Usuarios", value: data.totalUsers, icon: Users },
          { title: "Libros", value: data.totalBooks, icon: Library },
          { title: "Materias", value: data.totalSubjects, icon: BookOpen },
          { title: "Salas", value: data.totalRooms, icon: DoorOpen },
          { title: "Reservas Activas", value: data.activeReservations, icon: Calendar },
          { title: "Préstamos Activos", value: data.activeLoans, icon: BookMarked },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.title} className={`${cardClass} overflow-hidden`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className={titleClass}>{item.title}</p>
                    <p className={valueClass}>{item.value}</p>
                  </div>
                  <div className={iconClass}><Icon size={24} /></div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const renderLibrarian = () => (
    <div className="page-shell space-y-6">
      <div className="page-header">
        <h1 className="page-title">Panel de Biblioteca</h1>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {[
          { title: "Préstamos Activos", value: data.activeLoansCount, icon: BookMarked },
          { title: "Préstamos Vencidos", value: data.overdueLoansCount, icon: Clock },
          { title: "Multas Pendientes", value: formatCurrency(data.pendingFines), icon: DollarSign },
          { title: "Libros Disponibles", value: data.availableBooks, icon: Library },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.title} className={cardClass}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={titleClass}>{item.title}</p>
                    <p className={valueClass}>{item.value}</p>
                  </div>
                  <div className={iconClass}><Icon size={24} /></div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <Card className={cardClass}>
        <CardHeader><CardTitle className="section-title">Actividad reciente</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {data.recentLoans.length === 0
            ? <p className="text-gray-500 dark:text-gray-400">No hay movimientos recientes.</p>
            : data.recentLoans.map((loan: any) => (
              <div key={loan.id} className={`flex items-center justify-between ${sectionBg}`}>
                <div>
                  <p className="font-medium text-gray-700 dark:text-[#F5F7FF]">{loan.libro?.titulo || "Libro"}</p>
                  <p className="text-sm text-gray-500 dark:text-[#B7BDD6]">{loan.estudiante?.user?.nombreCompleto || "Estudiante"} · {formatDate(loan.fechaPrestamo)}</p>
                </div>
                <Badge className="bg-[#6C5CE7]/80">{loan.estado}</Badge>
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  );

  const renderTeacher = () => (
    <div className="page-shell space-y-6">
      <div className="page-header">
        <h1 className="page-title">Panel Docente</h1>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          { title: "Materias Asignadas", value: data.subjectCount, icon: BookOpen },
          { title: "Reservas Activas", value: data.activeReservations, icon: Calendar },
          { title: "Reservas Completadas", value: data.completedReservations, icon: CheckCircle },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.title} className={cardClass}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={titleClass}>{item.title}</p>
                    <p className={valueClass}>{item.value}</p>
                  </div>
                  <div className={iconClass}><Icon size={24} /></div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <Card className={cardClass}>
        <CardHeader><CardTitle className="section-title">Mis materias</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {data.subjects.length === 0
            ? <p className="text-gray-500 dark:text-gray-400">No tienes materias asignadas.</p>
            : data.subjects.map((subject: any) => (
              <div key={subject.id} className={`flex items-center justify-between ${sectionBg}`}>
                <div>
                  <p className="font-medium text-gray-700 dark:text-[#F5F7FF]">{subject.nombre}</p>
                  <p className="text-sm text-gray-500 dark:text-[#B7BDD6]">{subject.codigo} · Semestre {subject.semestre}</p>
                </div>
                <Button size="sm" onClick={() => navigate(`/subjects/${subject.id}`)}>Gestionar</Button>
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  );

  const renderStudent = () => (
    <div className="page-shell space-y-6">
      <div className="page-header">
        <h1 className="page-title">Panel de Estudiante</h1>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Materias", value: data.subjectsCount, icon: BookOpen },
          { title: "Libros Prestados", value: data.activeLoansCount, icon: BookMarked },
          { title: "Multas Pendientes", value: formatCurrency(data.finesAmount), icon: DollarSign },
          { title: "Reservas Activas", value: data.reservationsCount, icon: Calendar },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.title} className={cardClass}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={titleClass}>{item.title}</p>
                    <p className={valueClass}>{item.value}</p>
                  </div>
                  <div className={iconClass}><Icon size={24} /></div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <Card className={cardClass}>
        <CardHeader><CardTitle className="section-title">Materias disponibles</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {data.subjects.length === 0
            ? <p className="text-gray-500 dark:text-gray-400">No hay materias para mostrar.</p>
            : data.subjects.map((subject: any) => (
              <div key={subject.id} className={`flex items-center justify-between ${sectionBg}`}>
                <span className="font-medium text-gray-700 dark:text-[#F5F7FF]">{subject.nombre}</span>
                <Button size="sm" variant="ghost" onClick={() => navigate(`/subjects/${subject.id}`)}>Ver Detalles</Button>
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  );

  const renderContent = () => {
    if (loading) return <div className="p-8 text-gray-500 dark:text-gray-400">Cargando inicio...</div>;
    if (!data) return <div className="p-8 text-gray-500 dark:text-gray-400">No se pudo cargar la información.</div>;
    switch (user?.rol) {
      case "administrativo": return renderAdmin();
      case "bibliotecario": return renderLibrarian();
      case "docente": return renderTeacher();
      case "estudiante": return renderStudent();
      default: return <div className="p-8 text-gray-500 dark:text-gray-400">Rol no reconocido.</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#202445] transition-colors">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <TopBar onMenuToggle={() => setSidebarOpen(prev => !prev)} />
      <main className="ml-0 bg-transparent lg:ml-64 pt-16">
        {renderContent()}
      </main>
    </div>
  );
};
