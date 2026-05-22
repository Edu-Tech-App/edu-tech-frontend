import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Users, BookOpen, Activity, GraduationCap, UserCheck, Library } from "lucide-react";
import { api } from "../../../services/api";
import { toast } from "sonner";

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

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

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <p className="text-gray-500">Cargando estadísticas...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Panel Administrativo</h1>

      {/* Tarjetas principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Usuarios</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{stats?.totalUsuarios ?? 0}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                <Users size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Libros</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{stats?.totalLibros ?? 0}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
                <BookOpen size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Préstamos Activos</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{stats?.prestamosActivos ?? 0}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                <Activity size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Acciones rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button onClick={() => navigate('/users')} variant="outline" className="justify-start">
            Gestionar Usuarios
          </Button>
          <Button onClick={() => navigate('/statistics')} variant="outline" className="justify-start">
            Ver Estadísticas
          </Button>
          <Button onClick={() => navigate('/book-management')} variant="outline" className="justify-start">
            Gestionar Libros
          </Button>
          <Button onClick={() => navigate('/subjects')} variant="outline" className="justify-start">
            Gestionar Materias
          </Button>
        </CardContent>
      </Card>

      {/* Resumen por roles */}
      <Card>
        <CardHeader>
          <CardTitle>Usuarios por Rol</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <GraduationCap size={24} className="mx-auto text-blue-600 mb-2" />
              <p className="text-2xl font-bold text-blue-600">{stats?.totalEstudiantes ?? 0}</p>
              <p className="text-sm text-gray-600">Estudiantes</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <UserCheck size={24} className="mx-auto text-green-600 mb-2" />
              <p className="text-2xl font-bold text-green-600">{stats?.totalDocentes ?? 0}</p>
              <p className="text-sm text-gray-600">Docentes</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Library size={24} className="mx-auto text-purple-600 mb-2" />
              <p className="text-2xl font-bold text-purple-600">{stats?.totalBibliotecarios ?? 0}</p>
              <p className="text-sm text-gray-600">Bibliotecarios</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <Users size={24} className="mx-auto text-red-600 mb-2" />
              <p className="text-2xl font-bold text-red-600">{stats?.totalAdministrativos ?? 0}</p>
              <p className="text-sm text-gray-600">Administrativos</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

