import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useAuth } from "../context/AuthContext";
import { Sidebar } from "../components/Sidebar";
import { TopBar } from "../components/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Input } from "../components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const SubjectDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [newGrade, setNewGrade] = useState('');

  const subject = {
    id: id,
    code: 'POO101',
    name: 'Programación Orientada a Objetos',
    teacher: 'Prof. María González',
    credits: 4,
    description: 'Introducción a los conceptos fundamentales de la programación orientada a objetos, incluyendo clases, herencia, polimorfismo y encapsulamiento.',
  };

  const studentGrades = [
    { period: 'Parcial 1', grade: '4.5', weight: '30%', date: '15/02/2026' },
    { period: 'Taller 1', grade: '4.3', weight: '10%', date: '01/03/2026' },
    { period: 'Parcial 2', grade: '4.0', weight: '30%', date: '20/03/2026' },
    { period: 'Proyecto Final', grade: '-', weight: '30%', date: 'Pendiente' },
  ];

  const teacherStudents = [
    { id: '1', name: 'Juan Pérez', studentId: 'E001', midterm1: '4.5', midterm2: '4.0', final: '4.1.', average: '4.3' },
    { id: '2', name: 'María González', studentId: 'E002', midterm1: '4.0', midterm2: '4.3', final: '4.5', average: '4.2' },
    { id: '3', name: 'Carlos Ruiz', studentId: 'E003', midterm1: '4.0', midterm2: '4.5', final: '4.4', average: '4.1' },
  ];

  const handleEditGrade = (student: any) => {
    setSelectedStudent(student);
    setShowEditDialog(true);
  };

  const confirmEditGrade = () => {
    toast.success(`Calificación actualizada exitosamente para ${selectedStudent.name}`);
    setShowEditDialog(false);
    setSelectedStudent(null);
    setNewGrade('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <TopBar />
      <main className="ml-64 pt-16 p-6">
        <Button variant="ghost" onClick={() => navigate('/subjects')} className="mb-4">
          <ArrowLeft size={16} className="mr-2" />
          Volver a Materias
        </Button>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">{subject.name}</CardTitle>
            <p className="text-gray-600">{subject.code} · {subject.credits} créditos</p>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">{subject.description}</p>
            <p className="text-sm text-gray-600">Profesor: {subject.teacher}</p>
          </CardContent>
        </Card>

        {user?.role === 'student' ? (
          <Card>
            <CardHeader>
              <CardTitle>Mis Calificaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  💡 Las notas se califican en escala de 0.0 a 5.0
                </p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Evaluación</TableHead>
                    <TableHead>Calificación</TableHead>
                    <TableHead>Porcentaje</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentGrades.map((grade, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{grade.period}</TableCell>
                      <TableCell>
                        <span className={`font-bold ${grade.grade === '-' ? 'text-gray-400' : 'text-blue-600'}`}>
                          {grade.grade}
                        </span>
                      </TableCell>
                      <TableCell>{grade.weight}</TableCell>
                      <TableCell>{grade.date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-gray-600">Promedio Actual</p>
                <p className="text-3xl font-bold text-blue-600">4.2</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Calificaciones de Estudiantes</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre del Estudiante</TableHead>
                    <TableHead>ID Estudiante</TableHead>
                    <TableHead>Parcial 1</TableHead>
                    <TableHead>Parcial 2</TableHead>
                    <TableHead>Final</TableHead>
                    <TableHead>Promedio</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teacherStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.studentId}</TableCell>
                      <TableCell>{student.midterm1}</TableCell>
                      <TableCell>{student.midterm2}</TableCell>
                      <TableCell>{student.final}</TableCell>
                      <TableCell className="font-bold text-blue-600">{student.average}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => handleEditGrade(student)}>
                          Editar Notas
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Calificación</DialogTitle>
              <DialogDescription>
                Actualizar calificación para {selectedStudent?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Nota del Proyecto Final (0.0 - 5.0)</label>
                <Input
                  placeholder="Ejemplo: 4.5"
                  value={newGrade}
                  onChange={(e) => setNewGrade(e.target.value)}
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={confirmEditGrade} className="bg-blue-900 hover:bg-blue-800">
                Guardar Nota
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};
