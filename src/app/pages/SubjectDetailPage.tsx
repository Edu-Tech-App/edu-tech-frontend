import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useAuth } from "../context/AuthContext";
import { Sidebar } from "../components/Sidebar";
import { TopBar } from "../components/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Input } from "../components/ui/input";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../services/api";

interface SubjectRecord {
  id: number;
  codigo: string;
  nombre: string;
  docenteId: number;
  docente?: { user?: { nombreCompleto: string } };
}

interface GradeRecord {
  id: number;
  periodoAcademico: string;
  valor: number;
  fechaRegistro: string;
  estudianteId: number;
  asignaturaId: number;
  estudiante?: { codigoEstudiantil?: string; user?: { nombreCompleto: string } };
  asignatura?: { nombre: string; codigo: string };
}

interface EnrollmentRecord {
  id: number;
  estudianteId: number;
  estudiante?: {
    codigoEstudiantil?: string;
    user?: { nombreCompleto: string };
  };
}

type GradeSlotKey = "corte1" | "corte2" | "corte3";

const GRADE_SLOTS: Array<{ key: GradeSlotKey; label: string; period: string; weight: number }> = [
  { key: "corte1", label: "Nota 1", period: "CORTE1", weight: 0.3 },
  { key: "corte2", label: "Nota 2", period: "CORTE2", weight: 0.3 },
  { key: "corte3", label: "Nota 3", period: "CORTE3", weight: 0.4 },
];

const normalizePeriod = (value?: string) => String(value || "").toUpperCase().replace(/[\s_-]/g, "");

const getSlotFromGrade = (grade?: GradeRecord | null) => {
  const period = normalizePeriod(grade?.periodoAcademico);
  if (period === "CORTE1") return "corte1";
  if (period === "CORTE2") return "corte2";
  if (period === "CORTE3") return "corte3";
  return null;
};

export const SubjectDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [subject, setSubject] = useState<SubjectRecord | null>(null);
  const [grades, setGrades] = useState<GradeRecord[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingStudentId, setSavingStudentId] = useState<number | null>(null);
  const [gradeDrafts, setGradeDrafts] = useState<Record<number, Record<GradeSlotKey, string>>>({});
  const [editingStudentId, setEditingStudentId] = useState<number | null>(null);

  const loadTeacherData = async (subjectId: number) => {
    const [gradesData, enrollmentsData] = await Promise.all([
      api.getGrades({ asignatura: subjectId }),
      api.getSubjectEnrollments(subjectId),
    ]);
    setGrades(Array.isArray(gradesData) ? gradesData : []);
    setEnrollments(Array.isArray(enrollmentsData) ? enrollmentsData : []);
  };

  const loadStudentData = async (subjectId: number, studentId: number) => {
    const gradesData = await api.getStudentGrades(studentId);
    setGrades((Array.isArray(gradesData) ? gradesData : []).filter((grade: GradeRecord) => grade.asignaturaId === subjectId));
  };

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
          await loadStudentData(Number(id), user.id);
        } else {
          await loadTeacherData(Number(id));
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

  const teacherRows = useMemo(() => {
    return enrollments.map((enrollment) => {
      const studentGrades = grades.filter((grade) => grade.estudianteId === enrollment.estudianteId);
      const bySlot = {
        corte1: studentGrades.find((grade) => getSlotFromGrade(grade) === "corte1") ?? null,
        corte2: studentGrades.find((grade) => getSlotFromGrade(grade) === "corte2") ?? null,
        corte3: studentGrades.find((grade) => getSlotFromGrade(grade) === "corte3") ?? null,
      };
      const studentDraft = gradeDrafts[enrollment.estudianteId] ?? {};

      const effectiveValues = {
        corte1: Object.prototype.hasOwnProperty.call(studentDraft, "corte1")
          ? studentDraft.corte1 ?? ""
          : bySlot.corte1
            ? String(Number(bySlot.corte1.valor))
            : "",
        corte2: Object.prototype.hasOwnProperty.call(studentDraft, "corte2")
          ? studentDraft.corte2 ?? ""
          : bySlot.corte2
            ? String(Number(bySlot.corte2.valor))
            : "",
        corte3: Object.prototype.hasOwnProperty.call(studentDraft, "corte3")
          ? studentDraft.corte3 ?? ""
          : bySlot.corte3
            ? String(Number(bySlot.corte3.valor))
            : "",
      };

      const finalGrade = GRADE_SLOTS.reduce((sum, slot) => {
        const numeric = Number(effectiveValues[slot.key] || 0);
        return sum + numeric * slot.weight;
      }, 0);

      return {
        id: enrollment.estudianteId,
        nombre: enrollment.estudiante?.user?.nombreCompleto || `Estudiante ${enrollment.estudianteId}`,
        codigo: enrollment.estudiante?.codigoEstudiantil || `EST-${enrollment.estudianteId}`,
        gradesBySlot: bySlot,
        effectiveValues,
        finalGrade,
      };
    });
  }, [enrollments, gradeDrafts, grades]);

  const studentSummary = useMemo(() => {
    const gradesBySlot = {
      corte1: grades.find((grade) => getSlotFromGrade(grade) === "corte1") ?? null,
      corte2: grades.find((grade) => getSlotFromGrade(grade) === "corte2") ?? null,
      corte3: grades.find((grade) => getSlotFromGrade(grade) === "corte3") ?? null,
    };

    const finalGrade = GRADE_SLOTS.reduce((sum, slot) => {
      const grade = gradesBySlot[slot.key];
      return sum + Number(grade?.valor || 0) * slot.weight;
    }, 0);

    return { gradesBySlot, finalGrade };
  }, [grades]);

  const handleDraftChange = (studentId: number, key: GradeSlotKey, value: string) => {
    if (value !== "") {
      const numeric = Number(value);
      if (Number.isNaN(numeric)) return;
      if (numeric > 5) {
        toast.error("La nota no puede ser mayor a 5.0");
        return;
      }
      if (numeric < 0) {
        toast.error("La nota no puede ser menor a 0.0");
        return;
      }
    }

    setGradeDrafts((current) => ({
      ...current,
      [studentId]: {
        ...(current[studentId] ?? {}),
        [key]: value,
      },
    }));
  };

  const handleResetStudentDraft = (studentId: number) => {
    setGradeDrafts((current) => {
      if (!current[studentId]) return current;
      const next = { ...current };
      delete next[studentId];
      return next;
    });
    setEditingStudentId(null);
  };

  const handleStartEditingStudent = (studentId: number) => {
    setEditingStudentId(studentId);
  };

  const handleSaveStudentGrades = async (studentId: number) => {
    if (!id) return;

    const row = teacherRows.find((item) => item.id === studentId);
    if (!row) return;

    const filledSlots = GRADE_SLOTS.filter((slot) => row.effectiveValues[slot.key] !== "");
    if (filledSlots.length === 0) {
      toast.error("Ingresa al menos una nota para guardar");
      return;
    }

    for (const slot of GRADE_SLOTS) {
      const rawValue = row.effectiveValues[slot.key];
      if (!rawValue) continue;

      const numeric = Number(rawValue);
      if (Number.isNaN(numeric) || numeric < 0 || numeric > 5) {
        toast.error(`${slot.label} debe estar entre 0.0 y 5.0`);
        return;
      }
    }

    try {
      setSavingStudentId(studentId);

      for (const slot of filledSlots) {
        const numeric = Number(row.effectiveValues[slot.key]);
        const existingGrade = row.gradesBySlot[slot.key];

        if (existingGrade) {
          await api.updateGrade(existingGrade.id, numeric);
        } else {
          await api.createGrade({
            estudianteId: studentId,
            asignaturaId: Number(id),
            periodoAcademico: slot.period,
            valor: numeric,
          });
        }
      }

      toast.success("Notas guardadas correctamente");
      await loadTeacherData(Number(id));
      setGradeDrafts((current) => {
        const next = { ...current };
        delete next[studentId];
        return next;
      });
      setEditingStudentId(null);
    } catch (error: any) {
      toast.error(error.message || "No se pudieron guardar las notas");
    } finally {
      setSavingStudentId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 transition-colors dark:bg-[#202445]">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <TopBar onMenuToggle={() => setSidebarOpen((prev) => !prev)} />
        <main className="p-6 pt-16 lg:ml-64">
          <Card className="dark:border-gray-700 dark:bg-gray-800">
            <CardContent className="p-6 text-gray-500 dark:text-gray-400">Cargando materia...</CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (!subject) return null;

  return (
    <div className="min-h-screen bg-gray-50 transition-colors dark:bg-[#202445]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <TopBar onMenuToggle={() => setSidebarOpen((prev) => !prev)} />
      <main className="p-6 pt-16 lg:ml-64">
        <Button variant="ghost" onClick={() => navigate("/subjects")} className="mb-4 dark:text-gray-300 dark:hover:bg-gray-800">
          <ArrowLeft size={16} className="mr-2" />Volver a Materias
        </Button>

        <Card className="mb-6 dark:border-gray-700 dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-2xl dark:text-white">{subject.nombre}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-2 text-gray-700 dark:text-gray-300">Consulta la información y el seguimiento académico de esta materia.</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Código: {subject.codigo}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Profesor: {subject.docente?.user?.nombreCompleto || "Docente no asignado"}</p>
          </CardContent>
        </Card>

        {user?.rol === "estudiante" ? (
          <div className="space-y-6">
            <Card className="dark:border-gray-700 dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="dark:text-white">Mis Notas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 rounded-lg border border-[#6C5CE7]/20 bg-[#6C5CE7]/8 p-3 dark:border-[#6C5CE7]/35 dark:bg-[#6C5CE7]/20">
                  <p className="text-sm text-[#5b4bd1] dark:text-[#d9d4ff]">Ponderación: Nota 1 = 30%, Nota 2 = 30%, Nota 3 = 40%</p>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="dark:border-gray-700">
                      <TableHead className="dark:text-gray-300">Nota 1</TableHead>
                      <TableHead className="dark:text-gray-300">Nota 2</TableHead>
                      <TableHead className="dark:text-gray-300">Nota 3</TableHead>
                      <TableHead className="dark:text-gray-300">Definitiva</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="dark:border-gray-700">
                      {GRADE_SLOTS.map((slot) => (
                        <TableCell key={slot.key} className="font-medium dark:text-white">
                          {studentSummary.gradesBySlot[slot.key] ? Number(studentSummary.gradesBySlot[slot.key]?.valor).toFixed(2) : "-"}
                        </TableCell>
                      ))}
                      <TableCell className="font-bold text-[#6C5CE7]">
                        {grades.length === 0 ? "Sin notas" : studentSummary.finalGrade.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            <Card className="dark:border-gray-700 dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="dark:text-white">Calificaciones de Estudiantes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 rounded-lg border border-[#6C5CE7]/20 bg-[#6C5CE7]/8 p-3 dark:border-[#6C5CE7]/35 dark:bg-[#6C5CE7]/20">
                  <p className="text-sm text-[#5b4bd1] dark:text-[#d9d4ff]">Ingresa las 3 notas del estudiante. La ponderación final es 30%, 30% y 40%.</p>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="dark:border-gray-700">
                      <TableHead className="dark:text-gray-300">Estudiante</TableHead>
                      <TableHead className="dark:text-gray-300">Código</TableHead>
                      <TableHead className="dark:text-gray-300">Nota 1</TableHead>
                      <TableHead className="dark:text-gray-300">Nota 2</TableHead>
                      <TableHead className="dark:text-gray-300">Nota 3</TableHead>
                      <TableHead className="dark:text-gray-300">Definitiva</TableHead>
                      <TableHead className="dark:text-gray-300">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teacherRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="py-6 text-center text-gray-500 dark:text-gray-400">
                          No hay estudiantes inscritos en esta materia.
                        </TableCell>
                      </TableRow>
                    ) : (
                      teacherRows.map((student) => (
                        <TableRow key={student.id} className="dark:border-gray-700">
                          <TableCell className="font-medium dark:text-white">{student.nombre}</TableCell>
                          <TableCell className="dark:text-gray-400">{student.codigo}</TableCell>
                          {GRADE_SLOTS.map((slot) => (
                            <TableCell key={slot.key}>
                              <Input
                                type="number"
                                min="0"
                                max="5"
                                step="0.1"
                                value={student.effectiveValues[slot.key]}
                                onChange={(e) => handleDraftChange(student.id, slot.key, e.target.value)}
                                disabled={editingStudentId !== student.id || savingStudentId === student.id}
                                className={
                                  editingStudentId === student.id
                                    ? "h-9 min-w-[88px] border-gray-300 bg-white text-gray-900 dark:border-gray-500 dark:bg-gray-700 dark:text-white"
                                    : "h-9 min-w-[88px] border-gray-300 bg-gray-100 text-gray-500 disabled:cursor-not-allowed disabled:opacity-100 dark:border-gray-600 dark:bg-gray-700/70 dark:text-gray-300"
                                }
                              />
                            </TableCell>
                          ))}
                          <TableCell className="font-bold text-[#6C5CE7]">{student.finalGrade.toFixed(2)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  if (editingStudentId === student.id) {
                                    handleResetStudentDraft(student.id);
                                    return;
                                  }
                                  handleStartEditingStudent(student.id);
                                }}
                                disabled={savingStudentId === student.id}
                                className="border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                              >
                                {editingStudentId === student.id ? "Cancelar" : "✏️"}
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => void handleSaveStudentGrades(student.id)}
                                disabled={savingStudentId === student.id || editingStudentId !== student.id}
                                className="bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                              >
                                {savingStudentId === student.id ? "Guardando..." : "Guardar"}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};
