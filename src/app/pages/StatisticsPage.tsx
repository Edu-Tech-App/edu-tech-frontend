import { Sidebar } from "../components/Sidebar";
import { TopBar } from "../components/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { BookOpen, Users, DollarSign, TrendingUp, GraduationCap, Calendar } from "lucide-react";

export const StatisticsPage = () => {
  const stats = {
    totalBooks: 245,
    totalUsers: 1240,
    activeLoans: 156,
    totalFines: 340,
    totalSubjects: 45,
    monthlyLoans: 423,
  };

  const topBooks = [
    { title: 'Introducción a los Algoritmos', loans: 45 },
    { title: 'Cálculo: Una Variable', loans: 38 },
    { title: 'Física para Ciencias e Ingeniería', loans: 32 },
    { title: 'Química Orgánica', loans: 28 },
    { title: 'Programación en Python', loans: 25 },
  ];

  const categoryStats = [
    { category: 'Ciencias de la Computación', books: 65, percentage: 26 },
    { category: 'Matemáticas', books: 48, percentage: 20 },
    { category: 'Física', books: 42, percentage: 17 },
    { category: 'Química', books: 35, percentage: 14 },
    { category: 'Literatura', books: 55, percentage: 23 },
  ];

  const loansByMonth = [
    { month: 'Oct', loans: 320 },
    { month: 'Nov', loans: 385 },
    { month: 'Dic', loans: 290 },
    { month: 'Ene', loans: 410 },
    { month: 'Feb', loans: 395 },
    { month: 'Mar', loans: 420 },
    { month: 'Abr', loans: 423 },
  ];

  const userStats = [
    { role: 'Estudiantes', count: 980, percentage: 79 },
    { role: 'Maestros', count: 185, percentage: 15 },
    { role: 'Bibliotecarios', count: 5, percentage: 0.4 },
    { role: 'Administradores', count: 3, percentage: 0.2 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <TopBar />
      <main className="ml-64 pt-16 p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Estadísticas del Sistema</h1>
          <p className="text-gray-600">Panel general de métricas y análisis</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total de Libros</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.totalBooks}</p>
                  <p className="text-xs text-gray-500 mt-1">En catálogo</p>
                </div>
                <BookOpen size={40} className="text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Usuarios Registrados</p>
                  <p className="text-3xl font-bold text-green-600">{stats.totalUsers}</p>
                  <p className="text-xs text-gray-500 mt-1">Total activos</p>
                </div>
                <Users size={40} className="text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Préstamos Activos</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.activeLoans}</p>
                  <p className="text-xs text-gray-500 mt-1">En curso</p>
                </div>
                <Calendar size={40} className="text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Multas Pendientes</p>
                  <p className="text-3xl font-bold text-red-600">${stats.totalFines}</p>
                  <p className="text-xs text-gray-500 mt-1">Por cobrar</p>
                </div>
                <DollarSign size={40} className="text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Materias Activas</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats.totalSubjects}</p>
                  <p className="text-xs text-gray-500 mt-1">Este semestre</p>
                </div>
                <GraduationCap size={40} className="text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Préstamos del Mes</p>
                  <p className="text-3xl font-bold text-indigo-600">{stats.monthlyLoans}</p>
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <TrendingUp size={12} /> +8% vs mes anterior
                  </p>
                </div>
                <TrendingUp size={40} className="text-indigo-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Libros Más Prestados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topBooks.map((book, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                        {index + 1}
                      </div>
                      <span className="font-medium text-sm">{book.title}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-600">{book.loans} préstamos</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Distribución de Usuarios por Rol</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userStats.map((user, index) => (
                  <div key={index}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">{user.role}</span>
                      <span className="text-sm text-gray-600">{user.count} ({user.percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${user.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Préstamos por Mes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {loansByMonth.map((data, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <span className="text-sm font-medium w-12">{data.month}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-8 relative">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-8 rounded-full flex items-center justify-end pr-3"
                        style={{ width: `${(data.loans / 450) * 100}%` }}
                      >
                        <span className="text-white text-xs font-bold">{data.loans}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Libros por Categoría</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoryStats.map((cat, index) => (
                  <div key={index}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">{cat.category}</span>
                      <span className="text-sm text-gray-600">{cat.books} libros</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};
