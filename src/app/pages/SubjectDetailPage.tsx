import { useEffect, useMemo, useState } from "react";
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
import { api } from "../../services/api";

interface SubjectRecord {
  id: number;
  codigo: string;
  nombre: string;
  docenteId: number;
  docente?: {
    user?: {
      nombreCompleto: string;
    };
  };
}

interface GradeRecord {
  id: number;
  periodoAcademico: string;
  valor: number;
  fechaRegistro: string;
  estudianteId: number;
  asignaturaId: number;
  estudiante?: {
    codigoEstudiantil?: string;
    user?: {
      nombreCompleto: string;
    };
  };
  asignatura?: {
    nombre: string;
    codigo: string;
  };
}

export const SubjectDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<GradeRecord | null>(null);
  const [newGrade, setNewGrade] = useState("");
  const [subject, setSubject] = useState<SubjectRecord | null>(null);
  const [grades, setGrades] = useState<GradeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!id) {
        toast.error("No se encontró la materia");
        navigate("/subjects");
        return;
      }

      try {
        setLoading(true);
        const subjectData = await api.getSubjectById(Number(id));
        setSubject(subjectData);

        if (user?.rol === "estudiante") {
          const gradesData = await api.getStudentGrades(user.id);
          setGrades(
            gradesData.filter((grade: GradeRecord) => grade.asignaturaId === Number(id)),
          );
        } else {
          const gradesData = await api.getGrades({ asignatura: Number(id) });
          setGrades(gradesData);
        }
      } catch (error: any) {
        toast.error(error.message || "No se pudo cargar la materia");
        navigate("/subjects");
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [id, navigate, user]);

  const groupedTeacherGrades = useMemo(() => {
    const grouped = new Map<number, { id: number; name: string; studentId: string; average: string; latestGradeId: number }>();

    grades.forEach((grade) => {
      const studentId = grade.estudianteId;
      const current = grouped.get(studentId);
      const studentName = grade.estudiante?.user?.nombreCompleto || `Estudiante ${studentId}`;
      const studentCode = grade.estudiante?.codigoEstudiantil || `EST-${studentId}`;

      if (!current) {
        grouped.set(studentId, {
          id: studentId,
          name: studentName,
          studentId: studentCode,
          average: grade.valor.toFixed(2),
          latestGradeId: grade.id,
        });
      }
    });

    return Array.from(grouped.values());
  }, [grades]);

  const currentAverage = useMemo(() => {
    if (grades.length === 0) return "Sin notas";
    const total = grades.reduce((sum, grade) => sum + Number(grade.valor), 0);
    return (total / grades.length).toFixed(2);
  }, [grades]);

  const handleEditGrade = (grade: GradeRecord) => {
    setSelectedGrade(grade);
    setNewGrade(String(grade.valor));
    setShowEditDialog(true);
  };

  const confirmEditGrade = async () => {
    if (!selectedGrade) {
      return;
    }

    try {
      await api.updateGrade(selectedGrade.id, Number(newGrade));
      toast.success("Calificación actualizada exitosamente");
      setShowEditDialog(false);
      setSelectedGrade(null);
      setNewGrade("");

      const gradesData = await api.getGrades({ asignatura: Number(id) });
      setGrades(gradesData);
    } catch (error: any) {
      toast.error(error.message || "No se pudo actualizar la calificación");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <TopBar />
        <main className="ml-64 pt-16 p-6">
          <Card>
            <CardContent className="p-6 text-gray-500">Cargando materia...</CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (!subject) {
    return null;
  }

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
            <CardTitle className="text-2xl">{subject.nombre}</CardTitle>
            <p className="text-gray-600">{subject.codigo}</p>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">
              Consulta la información y el seguimiento académico de esta materia.
            </p>
            <p className="text-sm text-gray-600">
              Profesor: {subject.docente?.user?.nombreCompleto || "Docente no asignado"}
            </p>
          </CardContent>
        </Card>

        {user?.rol === 'estudiante' ? (
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
                    <TableHead>Periodo</TableHead>
                    <TableHead>Calificación</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grades.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-6 text-gray-500">
                        No hay calificaciones registradas para esta materia.
                      </TableCell>
                    </TableRow>
                  ) : (
                    grades.map((grade) => (
                      <TableRow key={grade.id}>
                        <TableCell className="font-medium">{grade.periodoAcademico}</TableCell>
                        <TableCell>
                          <span className="font-bold text-blue-600">
                            {Number(grade.valor).toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell>{new Date(grade.fechaRegistro).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-gray-600">Promedio Actual</p>
                <p className="text-3xl font-bold text-blue-600">{currentAverage}</p>
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
                    <TableHead>Última Nota</TableHead>
                    <TableHead>Promedio</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupedTeacherGrades.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-gray-500">
                        No hay calificaciones registradas para esta materia.
                      </TableCell>
                    </TableRow>
                  ) : (
                    groupedTeacherGrades.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell>{student.studentId}</TableCell>
                        <TableCell>{student.average}</TableCell>
                        <TableCell className="font-bold text-blue-600">{student.average}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const grade = grades.find((item) => item.id === student.latestGradeId);
                              if (grade) handleEditGrade(grade);
                            }}
                          >
                            Editar Nota
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
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
                Actualizar calificación para {selectedGrade?.estudiante?.user?.nombreCompleto || "estudiante"}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Nueva nota (0.0 - 5.0)</label>
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
