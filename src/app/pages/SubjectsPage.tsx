import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { Sidebar } from "../components/Sidebar";
import { TopBar } from "../components/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { BookOpen, Users, GraduationCap } from "lucide-react";

export const SubjectsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const studentSubjects = [
    { id: '1', code: 'POO101', name: 'Programación Orientada a Objetos', teacher: 'Prof. María González', credits: 4, grade: '4.5', status: 'Activa' },
    { id: '2', code: 'ED201', name: 'Estructuras de Datos', teacher: 'Prof. Carlos Mendoza', credits: 3, grade: '4.0', status: 'Activa' },
    { id: '3', code: 'BD150', name: 'Bases de Datos', teacher: 'Prof. Ana Martínez', credits: 4, grade: '4.3', status: 'Activa' },
  ];

  const teacherSubjects = [
    { id: '1', code: 'POO101', name: 'Programación Orientada a Objetos', students: 45, pendingGrades: 5, credits: 4 },
    { id: '2', code: 'ED202', name: 'Estructuras de Datos Avanzadas', students: 38, pendingGrades: 7, credits: 4 },
    { id: '3', code: 'ALG301', name: 'Algoritmos y Complejidad', students: 30, pendingGrades: 0, credits: 3 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <TopBar />
      <main className="ml-64 pt-16 p-6">
        <Card>
          <CardHeader>
            <CardTitle>
              {user?.role === 'student' ? 'Mis Materias' : 'Materias Asignadas'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {user?.role === 'student' ? (
                studentSubjects.map((subject) => (
                  <Card key={subject.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/subjects/${subject.id}`)}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <BookOpen size={24} className="text-blue-600" />
                        </div>
                        <Badge className="bg-green-500">{subject.status}</Badge>
                      </div>
                      <h3 className="font-semibold text-lg text-gray-800">{subject.name}</h3>
                      <p className="text-sm text-gray-600 mb-3">{subject.code} · {subject.credits} créditos</p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{subject.teacher}</span>
                        <span className="font-bold text-blue-600">Nota: {subject.grade}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                teacherSubjects.map((subject) => (
                  <Card key={subject.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/subjects/${subject.id}`)}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                          <GraduationCap size={24} className="text-green-600" />
                        </div>
                        {subject.pendingGrades > 0 && (
                          <Badge className="bg-orange-500">{subject.pendingGrades} pendientes</Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-lg text-gray-800">{subject.name}</h3>
                      <p className="text-sm text-gray-600 mb-3">{subject.code} · {subject.credits} créditos</p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Users size={16} />
                          <span>{subject.students} estudiantes</span>
                        </div>
                      </div>
                      <Button size="sm" className="w-full mt-4">
                        Gestionar Materia
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};
