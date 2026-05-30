import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Sidebar } from "../components/Sidebar";
import { TopBar } from "../components/TopBar";
import { useAuth } from "../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { BookMarked, BookOpen, Calendar, DollarSign, DoorOpen, Library, Users } from "lucide-react";
import { api } from "../../services/api";
import { toast } from "sonner";
import { LibrarianDashboard } from "../components/dashboards/LibrarianDashboard";
import { TeacherDashboard } from "../components/dashboards/TeacherDashboard";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value);

const formatDateTime = (value?: string) => {
  if (!value) return "Sin fecha";
  return new Date(value).toLocaleString("es-ES", {
    dateStyle: "short",
    timeStyle: "short",
  });
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

          const pendingFinesAmount = loans.reduce((sum: number, loan: any) => {
            if (loan.multa?.estado === "PENDIENTE") {
              return sum + Number(loan.multa.monto || 0);
            }
            return sum;
          }, 0);

          const recentActivity = [
            ...roomReservations.map((reservation: any) => ({
              id: `reservation-${reservation.id}`,
              title: `Reserva de sala ${reservation.sala?.nombre || `#${reservation.salaId}`}`,
              subtitle: reservation.estudiante?.user?.nombreCompleto || reservation.docente?.user?.nombreCompleto || "Usuario no disponible",
              date: reservation.fechaReserva,
              status: reservation.estado,
            })),
            ...loans.map((loan: any) => ({
              id: `loan-${loan.id}`,
              title: `Préstamo de ${loan.libro?.titulo || "libro"}`,
              subtitle: loan.estudiante?.user?.nombreCompleto || "Estudiante no disponible",
              date: loan.fechaPrestamo,
              status: loan.estado,
            })),
          ]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 6);

          setData({
            totalUsers: users.length,
            totalBooks: books.length,
            totalSubjects: subjects.length,
            totalRooms: rooms.length,
            activeReservations: roomReservations.filter((item: any) => item.estado === "ACTIVA").length,
            activeLoans: loans.filter((item: any) => item.estado === "ACTIVO").length,
            pendingFinesAmount,
            recentUsers: [...users].slice(-5).reverse(),
            recentActivity,
          });
          return;
        }

        if (user.rol === "supervisor") {
          const [rooms, roomReservations] = await Promise.all([
            api.getStudyRooms(),
            api.getRoomReservations(),
          ]);

          const recentActivity = roomReservations
            .map((reservation: any) => ({
              id: `reservation-${reservation.id}`,
              title: `Reserva de sala ${reservation.sala?.nombre || `#${reservation.salaId}`}`,
              subtitle: reservation.estudiante?.user?.nombreCompleto || reservation.docente?.user?.nombreCompleto || "Usuario no disponible",
              date: reservation.fechaReserva,
              status: reservation.estado,
            }))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 6);

          setData({
            totalRooms: rooms.length,
            activeReservations: roomReservations.filter((item: any) => item.estado === "ACTIVA").length,
            completedReservations: roomReservations.filter((item: any) => item.estado === "COMPLETADA").length,
            cancelledReservations: roomReservations.filter((item: any) => item.estado === "CANCELADA").length,
            recentActivity,
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
          const [enrollments, loans, reservations, pendingFines] = await Promise.all([
            api.getSubjectEnrollmentsByStudent(),
            api.getStudentLoans(user.id),
            api.getRoomReservationsByUser(user.id),
            api.getPendingFines ? api.getPendingFines(user.id) : Promise.resolve([]),
          ]);

          const activeLoans = loans.filter((loan: any) => loan.estado === "ACTIVO");
          const finesAmount = (pendingFines as any[]).reduce((sum, fine) => sum + Number(fine.monto || 0), 0);
          const enrolledSubjects = (enrollments as any[]).map((item) => item.asignatura).filter(Boolean);

          setData({
            subjectsCount: enrolledSubjects.length,
            activeLoansCount: activeLoans.length,
            reservationsCount: reservations.filter((item: any) => item.estado === "ACTIVA").length,
            finesAmount,
            subjects: enrolledSubjects.slice(0, 4),
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

  const cardClass = "border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800";
  const titleClass = "metric-label";
  const valueClass = "mt-2 text-3xl font-bold text-gray-800 dark:text-[#F5F7FF]";
  const iconClass = "flex h-12 w-12 items-center justify-center rounded-lg bg-[#6C5CE7]/14 dark:bg-gray-700/50 text-[#6C5CE7] dark:text-[#F5F7FF]";
  const sectionBg = "rounded-lg bg-gray-50 dark:bg-gray-700/50 p-3";

  const renderAdmin = () => (
    <div className="space-y-4">
      <div className="page-header">
        <h1 className="page-title">Inicio</h1>
        <p className="page-subtitle">Resumen general del sistema</p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {[
          { title: "Reservas Activas", value: data.activeReservations, icon: Calendar },
          { title: "Préstamos Activos", value: data.activeLoans, icon: BookMarked },
          { title: "Multas Pendientes", value: formatCurrency(data.pendingFinesAmount), icon: DollarSign },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.title} className={`${cardClass} overflow-hidden`}>
              <CardContent className="p-5">
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

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_0.95fr]">
        <Card className={cardClass}>
          <CardHeader><CardTitle className="section-title">Actividad reciente</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {data.recentActivity.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">No hay actividad reciente para mostrar.</p>
            ) : data.recentActivity.map((item: any) => (
              <div key={item.id} className={`flex items-center justify-between gap-4 ${sectionBg}`}>
                <div>
                  <p className="font-medium text-gray-700 dark:text-[#F5F7FF]">{item.title}</p>
                  <p className="text-sm text-gray-500 dark:text-[#B7BDD6]">{item.subtitle}</p>
                </div>
                <div className="text-right">
                  <Badge className="bg-[#6C5CE7]/80">{item.status}</Badge>
                  <p className="mt-2 text-xs text-gray-500 dark:text-[#B7BDD6]">{formatDateTime(item.date)}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className={cardClass}>
          <CardHeader><CardTitle className="section-title">Usuarios recientes</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {data.recentUsers.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">No hay usuarios recientes.</p>
            ) : data.recentUsers.map((item: any) => (
              <div key={item.id} className={`flex items-center justify-between gap-3 ${sectionBg}`}>
                <div>
                  <p className="font-medium text-gray-700 dark:text-[#F5F7FF]">{item.nombreCompleto}</p>
                  <p className="text-sm text-gray-500 dark:text-[#B7BDD6]">{item.correoInstitucional}</p>
                </div>
                <Badge className="bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200">{item.rol}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className={cardClass}>
        <CardHeader><CardTitle className="section-title">Estadísticas rápidas</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {[
              { title: "Usuarios", value: data.totalUsers, icon: Users },
              { title: "Materias", value: data.totalSubjects, icon: BookOpen },
              { title: "Biblioteca", value: data.totalBooks, icon: Library },
              { title: "Salas", value: data.totalRooms, icon: DoorOpen },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className={sectionBg}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-[#B7BDD6]">{item.title}</p>
                      <p className="mt-2 text-2xl font-bold text-gray-800 dark:text-[#F5F7FF]">{item.value}</p>
                    </div>
                    <div className={iconClass}><Icon size={20} /></div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSupervisor = () => (
    <div className="space-y-4">
      <div className="page-header">
        <h1 className="page-title">Panel de Supervisión</h1>
        <p className="page-subtitle">Ocupación y gestión de espacios</p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[
          { title: "Total de Salas", value: data.totalRooms, icon: DoorOpen },
          { title: "Reservas Activas", value: data.activeReservations, icon: Calendar },
          { title: "Completadas", value: data.completedReservations, icon: BookMarked },
          { title: "Cancelaciones", value: data.cancelledReservations, icon: Users },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.title} className={cardClass}>
              <CardContent className="p-5">
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
        <CardHeader><CardTitle className="section-title">Actividad de reservas reciente</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {data.recentActivity.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No hay actividad reciente en salas.</p>
          ) : data.recentActivity.map((item: any) => (
            <div key={item.id} className={`flex items-center justify-between gap-4 SectionBg`}>
              <div>
                <p className="font-medium text-gray-700 dark:text-[#F5F7FF]">{item.title}</p>
                <p className="text-sm text-gray-500 dark:text-[#B7BDD6]">{item.subtitle}</p>
              </div>
              <div className="text-right">
                <Badge className="bg-[#6C5CE7]/80">{item.status}</Badge>
                <p className="mt-2 text-xs text-gray-500 dark:text-[#B7BDD6]">{formatDateTime(item.date)}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );

  const renderStudent = () => (
    <div className="space-y-4">
      <div className="page-header">
        <h1 className="page-title">Panel de Estudiante</h1>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Materias", value: data.subjectsCount, icon: BookOpen },
          { title: "Libros Prestados", value: data.activeLoansCount, icon: BookMarked },
          { title: "Multas Pendientes", value: formatCurrency(data.finesAmount), icon: DollarSign },
          { title: "Reservas Activas", value: data.reservationsCount, icon: Calendar },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.title} className={cardClass}>
              <CardContent className="p-5">
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
      case "supervisor": return renderSupervisor();
      case "bibliotecario": return <LibrarianDashboard data={data} />;
      case "docente": return <TeacherDashboard data={data} />;
      case "estudiante": return renderStudent();
      default: return <div className="p-8 text-gray-500 dark:text-gray-400">Rol no reconocido.</div>;
    }
  };

  return (
    <div className="h-screen overflow-hidden transition-colors">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <TopBar onMenuToggle={() => setSidebarOpen(prev => !prev)} />
      <main className="lg:ml-64 mt-16 box-border flex h-[calc(100vh-4rem)] flex-col overflow-y-auto bg-background p-4">
        {renderContent()}
      </main>
    </div>
  );
};
