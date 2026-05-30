import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { BookOpen, Calendar, CheckCircle } from "lucide-react";

interface TeacherDashboardProps {
  data: {
    subjectCount: number;
    activeReservations: number;
    completedReservations: number;
    subjects: any[];
  };
}

export const TeacherDashboard = ({ data }: TeacherDashboardProps) => {
  const navigate = useNavigate();

  const cardClass = "border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800";
  const titleClass = "metric-label";
  const valueClass = "mt-2 text-3xl font-bold text-gray-800 dark:text-[#F5F7FF]";
  const iconClass = "flex h-12 w-12 items-center justify-center rounded-lg bg-[#6C5CE7]/14 dark:bg-gray-700/50 text-[#6C5CE7] dark:text-[#F5F7FF]";
  const sectionBg = "rounded-lg bg-gray-50 dark:bg-gray-700/50 p-3";

  return (
    <div className="space-y-4">
      <div className="page-header">
        <h1 className="page-title">Panel Docente</h1>
        <p className="page-subtitle">Gestión académica y reserva de espacios</p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {[
          { title: "Materias Asignadas", value: data.subjectCount, icon: BookOpen },
          { title: "Reservas Activas", value: data.activeReservations, icon: Calendar },
          { title: "Reservas Completadas", value: data.completedReservations, icon: CheckCircle },
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

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1.5fr]">
        <Card className={cardClass}>
          <CardHeader>
            <CardTitle className="section-title">Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3">
            <Button onClick={() => navigate('/subjects')} variant="outline" className="justify-start dark:border-gray-600 dark:text-gray-300">
              Registrar Calificaciones
            </Button>
            <Button onClick={() => navigate('/subjects')} variant="outline" className="justify-start dark:border-gray-600 dark:text-gray-300">
              Ver Mis Estudiantes
            </Button>
            <Button onClick={() => navigate('/rooms')} variant="outline" className="justify-start dark:border-gray-600 dark:text-gray-300">
              Reservar Sala
            </Button>
          </CardContent>
        </Card>

        <Card className={cardClass}>
          <CardHeader><CardTitle className="section-title">Mis materias</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {data.subjects.length === 0
              ? <p className="text-gray-500 dark:text-gray-400">No tienes materias asignadas aún.</p>
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
    </div>
  );
};
