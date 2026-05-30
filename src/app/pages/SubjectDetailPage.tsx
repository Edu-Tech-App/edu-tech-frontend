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
import { ArrowLeft, Download, FileUp, Plus } from "lucide-react";
import { toast } from "sonner";
import { api, API_URL_PUBLIC } from "../../services/api";

interface SubjectRecord {
  id: number; codigo: string; nombre: string; docenteId: number;
  docente?: { user?: { nombreCompleto: string } };
}
interface GradeRecord {
  id: number; periodoAcademico: string; valor: number; fechaRegistro: string;
  estudianteId: number; asignaturaId: number;
  estudiante?: { codigoEstudiantil?: string; user?: { nombreCompleto: string } };
  asignatura?: { nombre: string; codigo: string };
}

interface SubjectTask {
  id: number;
  titulo: string;
  descripcion: string;
  archivoUrl?: string | null;
  creadoEn: string;
  entregasRealizadas?: number;
  entregasPendientes?: number;
  estadoEntrega?: "PENDIENTE" | "ENTREGADA";
  miEntrega?: {
    id: number;
    mensaje?: string | null;
    archivoUrl?: string | null;
    entregadoEn: string;
  } | null;
}

export const SubjectDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [showSubmissionDialog, setShowSubmissionDialog] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<GradeRecord | null>(null);
  const [selectedTask, setSelectedTask] = useState<SubjectTask | null>(null);
  const [newGrade, setNewGrade] = useState("");
  const [tasks, setTasks] = useState<SubjectTask[]>([]);
  const [subject, setSubject] = useState<SubjectRecord | null>(null);
  const [grades, setGrades] = useState<GradeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingTask, setSavingTask] = useState(false);
  const [submittingTask, setSubmittingTask] = useState(false);
  const [taskForm, setTaskForm] = useState({ titulo: "", descripcion: "", file: null as File | null });
  const [submissionForm, setSubmissionForm] = useState({ mensaje: "", file: null as File | null });

  const loadTasks = async (subjectId: number) => {
    const tasksData = await api.getSubjectTasks(subjectId);
    setTasks(Array.isArray(tasksData) ? tasksData : []);
  };

  useEffect(() => {
    const loadData = async () => {
      if (!id) { toast.error("No se encontró la materia"); navigate("/subjects"); return; }
      try {
        setLoading(true);
        const subjectData = await api.getSubjectById(Number(id));
        setSubject(subjectData);
        await loadTasks(Number(id));
        if (user?.rol === "estudiante") {
          const gradesData = await api.getStudentGrades(user.id);
          setGrades(gradesData.filter((g: GradeRecord) => g.asignaturaId === Number(id)));
        } else {
          const gradesData = await api.getGrades({ asignatura: Number(id) });
          setGrades(gradesData);
        }
      } catch (error: any) {
        toast.error(error.message || "No se pudo cargar la materia");
        navigate("/subjects");
      } finally { setLoading(false); }
    };
    void loadData();
  }, [id, navigate, user]);

  const groupedTeacherGrades = useMemo(() => {
    const grouped = new Map<number, { id: number; name: string; studentId: string; average: string; latestGradeId: number }>();
    grades.forEach((grade) => {
      const studentId = grade.estudianteId;
      if (!grouped.has(studentId)) {
        grouped.set(studentId, {
          id: studentId,
          name: grade.estudiante?.user?.nombreCompleto || `Estudiante ${studentId}`,
          studentId: grade.estudiante?.codigoEstudiantil || `EST-${studentId}`,
          average: grade.valor.toFixed(2),
          latestGradeId: grade.id,
        });
      }
    });
    return Array.from(grouped.values());
  }, [grades]);

  const currentAverage = useMemo(() => {
    if (grades.length === 0) return "Sin notas";
    const total = grades.reduce((sum, g) => sum + Number(g.valor), 0);
    return (total / grades.length).toFixed(2);
  }, [grades]);

  const handleEditGrade = (grade: GradeRecord) => {
    setSelectedGrade(grade); setNewGrade(String(grade.valor)); setShowEditDialog(true);
  };

  const confirmEditGrade = async () => {
    if (!selectedGrade) return;
    try {
      await api.updateGrade(selectedGrade.id, Number(newGrade));
      toast.success("Calificación actualizada exitosamente");
      setShowEditDialog(false); setSelectedGrade(null); setNewGrade("");
      const gradesData = await api.getGrades({ asignatura: Number(id) });
      setGrades(gradesData);
    } catch (error: any) {
      toast.error(error.message || "No se pudo actualizar la calificación");
    }
  };

  const handleCreateTask = async () => {
    if (!id || !taskForm.titulo || !taskForm.descripcion) {
      toast.error("Completa título y descripción");
      return;
    }

    try {
      setSavingTask(true);
      await api.createSubjectTask(Number(id), taskForm);
      toast.success("Tarea creada exitosamente");
      setShowTaskDialog(false);
      setTaskForm({ titulo: "", descripcion: "", file: null });
      await loadTasks(Number(id));
    } catch (error: any) {
      toast.error(error.message || "No se pudo crear la tarea");
    } finally {
      setSavingTask(false);
    }
  };

  const handleSubmitTask = async () => {
    if (!selectedTask) return;

    try {
      setSubmittingTask(true);
      await api.submitSubjectTask(selectedTask.id, submissionForm);
      toast.success("Tarea subida correctamente");
      setShowSubmissionDialog(false);
      setSelectedTask(null);
      setSubmissionForm({ mensaje: "", file: null });
      if (id) {
        await loadTasks(Number(id));
      }
    } catch (error: any) {
      toast.error(error.message || "No se pudo subir la tarea");
    } finally {
      setSubmittingTask(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#202445] transition-colors">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <TopBar onMenuToggle={() => setSidebarOpen((prev) => !prev)} />
        <main className="lg:ml-64 pt-16 p-6">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-6 text-gray-500 dark:text-gray-400">Cargando materia...</CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (!subject) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#202445] transition-colors">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <TopBar onMenuToggle={() => setSidebarOpen((prev) => !prev)} />
      <main className="lg:ml-64 pt-16 p-6">
        <Button variant="ghost" onClick={() => navigate("/subjects")} className="mb-4 dark:text-gray-300 dark:hover:bg-gray-800">
          <ArrowLeft size={16} className="mr-2" />Volver a Materias
        </Button>

        <Card className="mb-6 dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="text-2xl dark:text-white">{subject.nombre}</CardTitle>
                <p className="text-gray-600 dark:text-gray-400">{subject.codigo}</p>
              </div>
              {(user?.rol === "docente" || user?.rol === "administrativo") && (
                <Button onClick={() => setShowTaskDialog(true)} className="bg-[#6C5CE7] hover:bg-[#5b4bd1]">
                  <Plus size={16} className="mr-2" />Nueva tarea
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300 mb-4">Consulta la información y el seguimiento académico de esta materia.</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Profesor: {subject.docente?.user?.nombreCompleto || "Docente no asignado"}</p>
          </CardContent>
        </Card>

        {user?.rol === "estudiante" ? (
          <div className="space-y-6">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader><CardTitle className="dark:text-white">Mis Tareas</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {tasks.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400">No hay tareas asignadas para esta materia.</p>
                ) : (
                  tasks.map((task) => (
                    <div key={task.id} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700 dark:bg-gray-900/30">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-1">
                          <p className="font-semibold text-gray-800 dark:text-white">{task.titulo}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{task.descripcion}</p>
                          <p className="text-xs text-gray-500 dark:text-[#B7BDD6]">Creada: {new Date(task.creadoEn).toLocaleDateString()}</p>
                          {task.miEntrega?.mensaje && (
                            <p className="text-xs text-[#6C5CE7] dark:text-[#d9d4ff]">Tu mensaje: {task.miEntrega.mensaje}</p>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${task.estadoEntrega === "ENTREGADA" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"}`}>
                            {task.estadoEntrega === "ENTREGADA" ? "Entregada" : "Pendiente"}
                          </span>
                          {task.archivoUrl && (
                            <Button variant="outline" size="sm" asChild className="dark:border-gray-600 dark:text-gray-300">
                              <a href={`${API_URL_PUBLIC}${task.archivoUrl}`} target="_blank" rel="noreferrer">
                                <Download size={14} className="mr-2" />Archivo
                              </a>
                            </Button>
                          )}
                          {task.miEntrega?.archivoUrl && (
                            <Button variant="outline" size="sm" asChild className="dark:border-gray-600 dark:text-gray-300">
                              <a href={`${API_URL_PUBLIC}${task.miEntrega.archivoUrl}`} target="_blank" rel="noreferrer">
                                <Download size={14} className="mr-2" />Mi entrega
                              </a>
                            </Button>
                          )}
                          <Button size="sm" onClick={() => { setSelectedTask(task); setShowSubmissionDialog(true); }} className="bg-[#6C5CE7] hover:bg-[#5b4bd1]">
                            <FileUp size={14} className="mr-2" />{task.estadoEntrega === "ENTREGADA" ? "Actualizar entrega" : "Subir tarea"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader><CardTitle className="dark:text-white">Mis Calificaciones</CardTitle></CardHeader>
              <CardContent>
                <div className="mb-4 rounded-lg border border-[#6C5CE7]/20 bg-[#6C5CE7]/8 p-3 dark:border-[#6C5CE7]/35 dark:bg-[#6C5CE7]/20">
                  <p className="text-sm text-[#5b4bd1] dark:text-[#d9d4ff]">Las notas se califican en escala de 0.0 a 5.0</p>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="dark:border-gray-700">
                      <TableHead className="dark:text-gray-300">Periodo</TableHead>
                      <TableHead className="dark:text-gray-300">Calificación</TableHead>
                      <TableHead className="dark:text-gray-300">Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grades.length === 0 ? (
                      <TableRow><TableCell colSpan={3} className="text-center py-6 text-gray-500 dark:text-gray-400">No hay calificaciones registradas.</TableCell></TableRow>
                    ) : grades.map((grade) => (
                      <TableRow key={grade.id} className="dark:border-gray-700">
                        <TableCell className="font-medium dark:text-white">{grade.periodoAcademico}</TableCell>
                        <TableCell><span className="font-bold text-[#6C5CE7]">{Number(grade.valor).toFixed(2)}</span></TableCell>
                        <TableCell className="dark:text-gray-400">{new Date(grade.fechaRegistro).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-6 rounded-lg border border-[#6C5CE7]/20 bg-[#6C5CE7]/8 p-4 dark:border-[#6C5CE7]/35 dark:bg-[#6C5CE7]/20">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Promedio Actual</p>
                  <p className="text-3xl font-bold text-[#6C5CE7]">{currentAverage}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader><CardTitle className="dark:text-white">Tareas asignadas</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {tasks.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400">Aún no hay tareas creadas para esta materia.</p>
                ) : (
                  tasks.map((task) => (
                    <div key={task.id} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700 dark:bg-gray-900/30">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="font-semibold text-gray-800 dark:text-white">{task.titulo}</p>
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{task.descripcion}</p>
                          <p className="mt-1 text-xs text-gray-500 dark:text-[#B7BDD6]">Creada: {new Date(task.creadoEn).toLocaleDateString()}</p>
                        </div>
                        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                          <p>Entregadas: <span className="font-semibold text-emerald-600">{task.entregasRealizadas ?? 0}</span></p>
                          <p>Pendientes: <span className="font-semibold text-amber-600">{task.entregasPendientes ?? 0}</span></p>
                          {task.archivoUrl && (
                            <Button variant="outline" size="sm" asChild className="dark:border-gray-600 dark:text-gray-300">
                              <a href={`${API_URL_PUBLIC}${task.archivoUrl}`} target="_blank" rel="noreferrer">
                                <Download size={14} className="mr-2" />Adjunto
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader><CardTitle className="dark:text-white">Calificaciones de Estudiantes</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="dark:border-gray-700">
                      <TableHead className="dark:text-gray-300">Nombre del Estudiante</TableHead>
                      <TableHead className="dark:text-gray-300">ID Estudiante</TableHead>
                      <TableHead className="dark:text-gray-300">Última Nota</TableHead>
                      <TableHead className="dark:text-gray-300">Promedio</TableHead>
                      <TableHead className="dark:text-gray-300">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupedTeacherGrades.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-6 text-gray-500 dark:text-gray-400">No hay calificaciones registradas.</TableCell></TableRow>
                    ) : groupedTeacherGrades.map((student) => (
                      <TableRow key={student.id} className="dark:border-gray-700">
                        <TableCell className="font-medium dark:text-white">{student.name}</TableCell>
                        <TableCell className="dark:text-gray-400">{student.studentId}</TableCell>
                        <TableCell className="dark:text-gray-400">{student.average}</TableCell>
                        <TableCell className="font-bold text-[#6C5CE7]">{student.average}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700" onClick={() => {
                            const grade = grades.find((g) => g.id === student.latestGradeId);
                            if (grade) handleEditGrade(grade);
                          }}>Editar Nota</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="dark:bg-gray-800 dark:border-gray-700">
            <DialogHeader>
              <DialogTitle className="dark:text-white">Editar Calificación</DialogTitle>
              <DialogDescription className="dark:text-gray-400">Actualizar calificación para {selectedGrade?.estudiante?.user?.nombreCompleto || "estudiante"}</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block dark:text-gray-300">Nueva nota (0.0 - 5.0)</label>
                <Input placeholder="Ejemplo: 4.5" value={newGrade} onChange={(e) => setNewGrade(e.target.value)} type="number" min="0" max="5" step="0.1" className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)} className="dark:border-gray-600 dark:text-gray-300">Cancelar</Button>
              <Button onClick={confirmEditGrade} className="bg-[#6C5CE7] hover:bg-[#5b4bd1]">Guardar Nota</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
          <DialogContent className="dark:bg-gray-800 dark:border-gray-700">
            <DialogHeader>
              <DialogTitle className="dark:text-white">Nueva tarea</DialogTitle>
              <DialogDescription className="dark:text-gray-400">Crea una tarea para los estudiantes inscritos en esta materia.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="mb-2 block text-sm font-medium dark:text-gray-300">Título</label>
                <Input value={taskForm.titulo} onChange={(e) => setTaskForm({ ...taskForm, titulo: e.target.value })} className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium dark:text-gray-300">Descripción</label>
                <textarea value={taskForm.descripcion} onChange={(e) => setTaskForm({ ...taskForm, descripcion: e.target.value })} className="min-h-[120px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium dark:text-gray-300">Archivo</label>
                <Input type="file" onChange={(e) => setTaskForm({ ...taskForm, file: e.target.files?.[0] || null })} className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowTaskDialog(false)} className="dark:border-gray-600 dark:text-gray-300">Cancelar</Button>
              <Button onClick={handleCreateTask} disabled={savingTask} className="bg-[#6C5CE7] hover:bg-[#5b4bd1]">{savingTask ? "Guardando..." : "Crear tarea"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showSubmissionDialog} onOpenChange={setShowSubmissionDialog}>
          <DialogContent className="dark:bg-gray-800 dark:border-gray-700">
            <DialogHeader>
              <DialogTitle className="dark:text-white">Subir tarea</DialogTitle>
              <DialogDescription className="dark:text-gray-400">Entrega tu archivo o deja un mensaje para "{selectedTask?.titulo}".</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="mb-2 block text-sm font-medium dark:text-gray-300">Mensaje</label>
                <textarea value={submissionForm.mensaje} onChange={(e) => setSubmissionForm({ ...submissionForm, mensaje: e.target.value })} className="min-h-[110px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium dark:text-gray-300">Archivo</label>
                <Input type="file" onChange={(e) => setSubmissionForm({ ...submissionForm, file: e.target.files?.[0] || null })} className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSubmissionDialog(false)} className="dark:border-gray-600 dark:text-gray-300">Cancelar</Button>
              <Button onClick={handleSubmitTask} disabled={submittingTask} className="bg-[#6C5CE7] hover:bg-[#5b4bd1]">{submittingTask ? "Subiendo..." : "Enviar tarea"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};
