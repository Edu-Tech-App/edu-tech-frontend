import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { BookOpen, DollarSign, BookMarked, Calendar } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../../services/api";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);

export const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    materias: 0,
    librosPrestados: 0,
    multasPendientes: 0,
    reservas: 0,
  });
  const [subjects, setSubjects] = useState<any[]>([]);

  useEffect(() => {
    if (!user?.id) return;

    const load = async () => {
      try {
        setLoading(true);
        const [subjectsData, loansData, reservationsData, finesData] = await Promise.all([
          api.getSubjects(),
          api.getStudentLoans(user.id),
          api.getRoomReservationsByUser(user.id),
          api.getPendingFines(user.id),
        ]);

        const activeLoans = loansData.filter((l: any) => l.estado === "ACTIVO");
        const activeReservations = reservationsData.filter((r: any) => r.estado === "ACTIVA");
        const finesAmount = (finesData as any[]).reduce(
          (sum, fine) => sum + Number(fine.monto || 0),
          0
        );

        setStats({
          materias: subjectsData.length,
          librosPrestados: activeLoans.length,
          multasPendientes: finesAmount,
          reservas: activeReservations.length,
        });
        setSubjects(subjectsData.slice(0, 4));
      } catch (error) {
        console.error("Error cargando dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [user?.id]);

  const statCards = [
    { title: "Materias Activas", value: stats.materias.toString(), icon: BookOpen, color: "bg-[#6C5CE7]/14 text-[#6C5CE7]" },
    { title: "Libros Prestados", value: stats.librosPrestados.toString(), icon: BookMarked, color: "bg-green-100 text-green-600" },
    { title: "Multas Pendientes", value: formatCurrency(stats.multasPendientes), icon: DollarSign, color: "bg-yellow-100 text-yellow-600" },
    { title: "Reservas", value: stats.reservas.toString(), icon: Calendar, color: "bg-purple-100 text-purple-600" },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Panel de Estudiante</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-800 mt-2">
                      {loading ? "..." : stat.value}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                    <Icon size={24} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button onClick={() => navigate("/subjects")} variant="outline" className="justify-start">
            Ver Materias
          </Button>
          <Button onClick={() => navigate("/library")} variant="outline" className="justify-start">
            Buscar Libros
          </Button>
          <Button onClick={() => navigate("/library/rooms")} variant="outline" className="justify-start">
            Reservar Sala de Estudio
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mis Materias</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-gray-500 text-sm">Cargando materias...</p>
          ) : subjects.length === 0 ? (
            <p className="text-gray-500 text-sm">No tienes materias asignadas aún.</p>
          ) : (
            <div className="space-y-3">
              {subjects.map((subject) => (
                <div key={subject.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-700">{subject.nombre}</span>
                  <Button size="sm" variant="ghost" onClick={() => navigate(`/subjects/${subject.id}`)}>
                    Ver Detalles
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
