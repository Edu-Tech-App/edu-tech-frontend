import { useEffect, useState, useMemo } from "react";
import { Sidebar } from "../components/Sidebar";
import { TopBar } from "../components/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { BarChart3, BookOpen, CalendarCheck, DoorOpen, DollarSign, GraduationCap, Users } from "lucide-react";
import { api } from "../../services/api";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value);

const getPercentage = (value: number, total: number) => {
  if (!total) return 0;
  return Math.round((value / total) * 100);
};

const formatAcademicAverage = (value: number) => {
  if (!Number.isFinite(value)) return "0.0";
  return value.toFixed(1);
};

const accentStyles = {
  primary: {
    value: "text-[#5b4bd1] dark:text-[#c8c2ff]",
    icon: "text-[#5b4bd1] dark:text-[#c8c2ff]",
    chip: "bg-[#6C5CE7]/12 text-[#5b4bd1] dark:bg-[#6C5CE7]/18 dark:text-[#d7d2ff]",
    fill: "bg-[#6C5CE7] dark:bg-[#8a7dff]",
  },
  success: {
    fill: "bg-emerald-600 dark:bg-emerald-400",
  },
  danger: {
    value: "text-rose-700 dark:text-rose-300",
    icon: "text-rose-700 dark:text-rose-300",
    chip: "bg-rose-100 text-rose-700 dark:bg-rose-500/12 dark:text-rose-300",
    fill: "bg-rose-600 dark:bg-rose-400",
  },
} as const;

export const StatisticsPage = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => { 
    if (user) void loadStats(); 
  }, [user]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const isAdmin = user?.rol === "administrativo";
      const isSupervisor = user?.rol === "supervisor";

      const [stats, reservations, loans, grades] = await Promise.all([
        isAdmin ? api.getStats().catch(() => null) : Promise.resolve(null),
        (isAdmin || isSupervisor) ? api.getRoomReservations().catch(() => []) : Promise.resolve([]),
        isAdmin ? api.getLoans().catch(() => []) : Promise.resolve([]),
        isAdmin ? api.getGrades().catch(() => []) : Promise.resolve([]),
      ]);

      const totalLoans = loans.length;
      const totalReservations = reservations.length;

      const reservasActivas = reservations.filter((reservation: any) => reservation.estado === "ACTIVA").length;
      const reservasCompletadas = reservations.filter((reservation: any) => reservation.estado === "COMPLETADA").length;
      const reservasCanceladas = reservations.filter((reservation: any) => reservation.estado === "CANCELADA").length;

      const multasGeneradas = loans.reduce((sum: number, loan: any) => {
        if (loan.multa) {
          return sum + Number(loan.multa.monto || 0);
        }
        return sum;
      }, 0);

      const usuariosActivos = stats
        ? (stats.totalEstudiantes ?? 0) +
          (stats.totalDocentes ?? 0) +
          (stats.totalBibliotecarios ?? 0) +
          (stats.totalAdministrativos ?? 0) +
          (stats.totalSupervisores ?? 0)
        : 0;

      const academicAverage = grades.length
        ? grades.reduce((sum: number, grade: any) => sum + Number(grade.valor || 0), 0) / grades.length
        : 0;

      setData({
        stats,
        totalLoans,
        totalReservations,
        reservasActivas,
        reservasCompletadas,
        reservasCanceladas,
        multasGeneradas,
        usuariosActivos,
        academicAverage,
      });
    } catch (error: any) {
      toast.error(error.message || "Error al cargar estadísticas");
    } finally {
      setLoading(false);
    }
  };

  const cardClass = "border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800";
  const sectionBg = "rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50";

  const renderStats = () => {
    if (!data) return null;
    const isAdmin = user?.rol === "administrativo";

    return (
      <>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ...(isAdmin ? [{ title: "Uso de biblioteca", value: data.totalLoans, subtitle: "Préstamos registrados", icon: BookOpen, accent: accentStyles.primary }] : []),
            { title: "Uso de salas", value: data.totalReservations, subtitle: "Reservas totales", icon: DoorOpen, accent: accentStyles.primary },
            ...(isAdmin ? [
              { title: "Usuarios activos", value: data.usuariosActivos, subtitle: "Con participación en el sistema", icon: Users, accent: accentStyles.primary },
              { title: "Rendimiento académico general", value: formatAcademicAverage(data.academicAverage), subtitle: "Promedio global", icon: GraduationCap, accent: accentStyles.primary }
            ] : []),
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title} className={cardClass}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-[#B7BDD6]">{item.title}</p>
                      <p className={`mt-2 text-3xl font-bold ${item.accent.value}`}>{item.value}</p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-[#B6AFD8]">{item.subtitle}</p>
                    </div>
                    <div className={`rounded-2xl p-3 ${item.accent.chip}`}>
                      <Icon size={28} className={item.accent.icon} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
          {isAdmin && (
            <Card className={cardClass}>
              <CardHeader>
                <CardTitle className="section-title">Préstamos por mes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={sectionBg}>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-[#B7BDD6]">Actividad mensual</p>
                      <p className={`mt-2 text-3xl font-bold ${accentStyles.primary.value}`}>{data.stats?.prestamosDelMes ?? 0}</p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-[#B6AFD8]">Préstamos registrados en el mes actual</p>
                    </div>
                    <div className={`rounded-2xl p-3 ${accentStyles.primary.chip}`}>
                      <BarChart3 size={24} className={accentStyles.primary.icon} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {isAdmin && (
            <Card className={cardClass}>
              <CardHeader>
                <CardTitle className="section-title">Multas generadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={sectionBg}>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-[#B7BDD6]">Valor acumulado</p>
                      <p className={`mt-2 text-3xl font-bold ${accentStyles.danger.value}`}>{formatCurrency(data.multasGeneradas)}</p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-[#B6AFD8]">Incluye multas pendientes y registradas en préstamos</p>
                    </div>
                    <div className={`rounded-2xl p-3 ${accentStyles.danger.chip}`}>
                      <DollarSign size={24} className={accentStyles.danger.icon} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Card className={cardClass}>
            <CardHeader>
              <CardTitle className="section-title">Reservas por estado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Activas", count: data.reservasActivas, color: accentStyles.primary.fill },
                { label: "Completadas", count: data.reservasCompletadas, color: accentStyles.success.fill },
                { label: "Canceladas", count: data.reservasCanceladas, color: accentStyles.danger.fill },
              ].map((item) => {
                const percentage = getPercentage(item.count, data.totalReservations);
                return (
                  <div key={item.label}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-white">{item.label}</span>
                      <span className="text-sm text-gray-600 dark:text-[#D5D0EE]">{item.count} ({percentage}%)</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                      <div className={`h-2 rounded-full ${item.color}`} style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className={cardClass}>
            <CardHeader>
              <CardTitle className="section-title">Uso de salas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className={sectionBg}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-[#B7BDD6]">Reservas activas</p>
                    <p className={`mt-2 text-2xl font-bold ${accentStyles.primary.value}`}>{data.reservasActivas}</p>
                  </div>
                  <div className={`rounded-2xl p-3 ${accentStyles.primary.chip}`}>
                    <CalendarCheck size={20} className={accentStyles.primary.icon} />
                  </div>
                </div>
              </div>
              <div className={sectionBg}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-[#B7BDD6]">Capacidad de uso</p>
                    <p className="mt-2 text-2xl font-bold text-gray-800 dark:text-[#F5F7FF]">{getPercentage(data.reservasActivas + data.reservasCompletadas, data.totalReservations)}%</p>
                  </div>
                  <Badge className={accentStyles.primary.chip}>Salas</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {isAdmin && (
          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Card className={cardClass}>
              <CardHeader>
                <CardTitle className="section-title">Uso de biblioteca</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className={sectionBg}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-[#B7BDD6]">Préstamos activos</p>
                      <p className={`mt-2 text-2xl font-bold ${accentStyles.primary.value}`}>{data.stats?.prestamosActivos ?? 0}</p>
                    </div>
                    <div className={`rounded-2xl p-3 ${accentStyles.primary.chip}`}>
                      <BookOpen size={20} className={accentStyles.primary.icon} />
                    </div>
                  </div>
                </div>
                <div className={sectionBg}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-[#B7BDD6]">Libros en catálogo</p>
                      <p className="mt-2 text-2xl font-bold text-gray-800 dark:text-[#F5F7FF]">{data.stats?.totalLibros ?? 0}</p>
                    </div>
                    <Badge className={accentStyles.primary.chip}>Biblioteca</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={cardClass}>
              <CardHeader>
                <CardTitle className="section-title">Usuarios activos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "Estudiantes", count: data.stats?.totalEstudiantes ?? 0 },
                  { label: "Docentes", count: data.stats?.totalDocentes ?? 0 },
                  { label: "Bibliotecarios", count: data.stats?.totalBibliotecarios ?? 0 },
                  { label: "Administrativos", count: data.stats?.totalAdministrativos ?? 0 },
                  { label: "Supervisores", count: data.stats?.totalSupervisores ?? 0 },
                ].map((item) => {
                  const percentage = getPercentage(item.count, data.usuariosActivos);
                  return (
                    <div key={item.label}>
                      <div className="mb-1 flex justify-between">
                        <span className="text-sm font-medium text-gray-700 dark:text-white">{item.label}</span>
                        <span className="text-sm text-gray-600 dark:text-[#D5D0EE]">{item.count} ({percentage}%)</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                        <div className={`h-2 rounded-full ${accentStyles.primary.fill}`} style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="h-screen overflow-hidden bg-background transition-colors">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <TopBar onMenuToggle={() => setSidebarOpen((prev) => !prev)} />
      <main className="lg:ml-64 mt-16 box-border flex h-[calc(100vh-4rem)] flex-col overflow-y-auto p-4">
        <div className="page-header">
          <h1 className="page-title">Estadísticas</h1>
          <p className="page-subtitle">Indicadores clave de operación, uso institucional y desempeño académico general.</p>
        </div>

        {loading ? (
          <p className="py-16 text-center text-gray-500 dark:text-[#B6AFD8]">Cargando estadísticas...</p>
        ) : renderStats()}
      </main>
    </div>
  );
};
