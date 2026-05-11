import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { BookOpen, DollarSign, BookMarked, Calendar } from "lucide-react";

export const StudentDashboard = () => {
  const navigate = useNavigate();

  const stats = [
    { title: 'Materias Activas', value: '3', icon: BookOpen, color: 'bg-blue-100 text-blue-600' },
    { title: 'Libros Prestados', value: '5', icon: BookMarked, color: 'bg-green-100 text-green-600' },
    { title: 'Multas Pendientes', value: '$0', icon: DollarSign, color: 'bg-yellow-100 text-yellow-600' },
    { title: 'Reservas', value: '2', icon: Calendar, color: 'bg-purple-100 text-purple-600' }
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Panel de Estudiante</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-800 mt-2">{stat.value}</p>
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
          <Button onClick={() => navigate('/subjects')} variant="outline" className="justify-start">
            Ver Calificaciones
          </Button>
          <Button onClick={() => navigate('/library')} variant="outline" className="justify-start">
            Buscar Libros
          </Button>
          <Button onClick={() => navigate('/library/rooms')} variant="outline" className="justify-start">
            Reservar Sala de Estudio
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mis Materias</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {['Programación Orientada a Objetos', 'Estructuras de Datos', 'Bases de Datos', 'Matemáticas Discretas'].map((subject) => (
              <div key={subject} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-700">{subject}</span>
                <Button size="sm" variant="ghost" onClick={() => navigate('/subjects/1')}>
                  Ver Detalles
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
