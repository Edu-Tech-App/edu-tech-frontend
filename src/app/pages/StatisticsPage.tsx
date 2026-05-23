import { useEffect, useState } from "react";
import { Sidebar } from "../components/Sidebar";
import { TopBar } from "../components/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { BookOpen, Users, DollarSign, TrendingUp, GraduationCap, Calendar } from "lucide-react";
import { api } from "../../services/api";
import { toast } from "sonner";

export const StatisticsPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { void loadStats(); }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await api.getStats();
      setStats(data);
    } catch (error: any) {
      toast.error(error.message || "Error al cargar estadísticas");
    } finally {
      setLoading(false);
    }
  };

  const totalUsuarios = stats?.totalUsuarios ?? 0;
  const userStats = [
    { role: "Estudiantes", count: stats?.totalEstudiantes ?? 0, percentage: totalUsuarios ? Math.round((stats?.totalEstudiantes / totalUsuarios) * 100) : 0 },
    { role: "Docentes", count: stats?.totalDocentes ?? 0, percentage: totalUsuarios ? Math.round((stats?.totalDocentes / totalUsuarios) * 100) : 0 },
    { role: "Bibliotecarios", count: stats?.totalBibliotecarios ?? 0, percentage: totalUsuarios ? Math.round((stats?.totalBibliotecarios / totalUsuarios) * 100) : 0 },
    { role: "Administrativos", count: stats?.totalAdministrativos ?? 0, percentage: totalUsuarios ? Math.round((stats?.totalAdministrativos / totalUsuarios) * 100) : 0 },
  ];
  const topLibros = stats?.topLibros ?? [];
  const librosPorCategoria = stats?.librosPorCategoria ?? [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#202445] transition-colors">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <TopBar onMenuToggle={() => setSidebarOpen((prev) => !prev)} />
      <main className="lg:ml-64 pt-16">
        <div className="page-shell">
        <div className="page-header">
          <h1 className="page-title">Estadísticas del Sistema</h1>
          <p className="page-subtitle">Panel general de métricas y análisis</p>
        </div>

        {loading ? (
          <p className="py-16 text-center text-gray-500 dark:text-[#B6AFD8]">Cargando estadísticas...</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              <Card className="dark:bg-gray-800 dark:border-gray-700"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600 dark:text-[#B7BDD6]">Total de Libros</p><p className="text-3xl font-bold text-[#6C5CE7]">{stats?.totalLibros ?? 0}</p><p className="mt-1 text-xs text-gray-500 dark:text-[#B6AFD8]">En catálogo</p></div><BookOpen size={40} className="text-[#6C5CE7]" /></div></CardContent></Card>
              <Card className="dark:bg-gray-800 dark:border-gray-700"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600 dark:text-[#B7BDD6]">Usuarios Registrados</p><p className="text-3xl font-bold text-green-600">{stats?.totalUsuarios ?? 0}</p><p className="mt-1 text-xs text-gray-500 dark:text-[#B6AFD8]">Total activos</p></div><Users size={40} className="text-green-600" /></div></CardContent></Card>
              <Card className="dark:bg-gray-800 dark:border-gray-700"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600 dark:text-[#B7BDD6]">Préstamos Activos</p><p className="text-3xl font-bold text-purple-600">{stats?.prestamosActivos ?? 0}</p><p className="mt-1 text-xs text-gray-500 dark:text-[#B6AFD8]">En curso</p></div><Calendar size={40} className="text-purple-600" /></div></CardContent></Card>
              <Card className="dark:bg-gray-800 dark:border-gray-700"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600 dark:text-[#B7BDD6]">Multas Pendientes</p><p className="text-3xl font-bold text-red-600">${stats?.multasPendientes ?? 0}</p><p className="mt-1 text-xs text-gray-500 dark:text-[#B6AFD8]">Por cobrar</p></div><DollarSign size={40} className="text-red-600" /></div></CardContent></Card>
              <Card className="dark:bg-gray-800 dark:border-gray-700"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600 dark:text-[#B7BDD6]">Materias Activas</p><p className="text-3xl font-bold text-yellow-600">{stats?.totalMaterias ?? 0}</p><p className="mt-1 text-xs text-gray-500 dark:text-[#B6AFD8]">Este semestre</p></div><GraduationCap size={40} className="text-yellow-600" /></div></CardContent></Card>
              <Card className="dark:bg-gray-800 dark:border-gray-700"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600 dark:text-[#B7BDD6]">Préstamos del Mes</p><p className="text-3xl font-bold text-indigo-600">{stats?.prestamosDelMes ?? 0}</p><p className="mt-1 text-xs text-gray-500 dark:text-[#B6AFD8]">Mes actual</p></div><TrendingUp size={40} className="text-indigo-600" /></div></CardContent></Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader><CardTitle className="section-title">Libros Más Prestados</CardTitle></CardHeader>
                <CardContent>
                  {topLibros.length === 0 ? (
                    <p className="py-4 text-center text-sm text-gray-500 dark:text-[#B6AFD8]">No hay préstamos registrados</p>
                  ) : (
                    <div className="space-y-4">
                      {topLibros.map((book: any, index: number) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-[#6C5CE7]/14 dark:bg-[#6C5CE7]/30 rounded-full flex items-center justify-center text-[#6C5CE7] font-bold text-sm">{index + 1}</div>
                            <span className="font-medium text-sm dark:text-white">{book.titulo}</span>
                          </div>
                          <span className="text-sm font-bold text-gray-600 dark:text-[#D5D0EE]">{book.totalPrestamos} préstamos</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader><CardTitle className="section-title">Distribución de Usuarios por Rol</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {userStats.map((user, index) => (
                      <div key={index}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium dark:text-white">{user.role}</span>
                          <span className="text-sm text-gray-600 dark:text-[#D5D0EE]">{user.count} ({user.percentage}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div className="bg-[#6C5CE7] h-2 rounded-full" style={{ width: `${user.percentage}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader><CardTitle className="section-title">Libros por Categoría</CardTitle></CardHeader>
              <CardContent>
                {librosPorCategoria.length === 0 ? (
                  <p className="py-4 text-center text-sm text-gray-500 dark:text-[#B6AFD8]">No hay libros registrados por categoría</p>
                ) : (
                  <div className="space-y-4">
                    {librosPorCategoria.map((cat: any, index: number) => {
                      const maxCat = Math.max(...librosPorCategoria.map((c: any) => Number(c.total)));
                      const percentage = Math.round((Number(cat.total) / maxCat) * 100);
                      return (
                        <div key={index}>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium dark:text-white">{cat.categoria || "Sin categoría"}</span>
                            <span className="text-sm text-gray-600 dark:text-[#D5D0EE]">{cat.total} libros</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div className="bg-green-600 h-2 rounded-full" style={{ width: `${percentage}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
        </div>
      </main>
    </div>
  );
};
