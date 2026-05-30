import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { Sidebar } from "../components/Sidebar";
import { TopBar } from "../components/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { BookOpen, Eye, GraduationCap, Plus, Search, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { api, BOOK_CATEGORY_OPTIONS, type BookCategory } from "../../services/api";
import { isManagementRole } from "../lib/roles";

interface SubjectRecord {
  id: number;
  codigo: string;
  nombre: string;
  carrera: string;
  semestre: number;
  creditos: number;
  docenteId: number | null;
  docente?: { user?: { nombreCompleto: string } };
}

interface TeacherOption {
  id: number;
  nombreCompleto: string;
}

interface UserRecord {
  id: number;
  nombreCompleto: string;
  correoInstitucional: string;
  rol: "estudiante" | "docente" | "bibliotecario" | "administrativo" | "supervisor";
  estado: "activo" | "inactivo";
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

const normalizeSearchValue = (value?: string | null) =>
  (value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const formatCategory = (categoria?: string | null) => {
  const labels: Record<BookCategory, string> = {
    INGENIERIA_SISTEMAS: "Ingeniería de Sistemas",
    INGENIERIA_CIVIL: "Ingeniería Civil",
    INGENIERIA_INDUSTRIAL: "Ingeniería Industrial",
    ADMINISTRACION: "Administración",
    CONTADURIA: "Contaduría",
    ECONOMIA: "Economía",
    DERECHO: "Derecho",
    MEDICINA: "Medicina",
    ENFERMERIA: "Enfermería",
    PSICOLOGIA: "Psicología",
    EDUCACION: "Educación",
    MATEMATICAS: "Matemáticas",
  };
  return labels[categoria as BookCategory] || categoria || "";
};

const formatDate = (value?: string) => {
  if (!value) return "Sin fecha";
  return new Date(value).toLocaleDateString("es-ES");
};

const getSubjectStudents = (grades: GradeRecord[]) => {
  const studentMap = new Map<number, { id: number; name: string; code: string; grades: GradeRecord[] }>();

  grades.forEach((grade) => {
    const current = studentMap.get(grade.estudianteId);
    const nextGradeList = current ? [...current.grades, grade] : [grade];

    studentMap.set(grade.estudianteId, {
      id: grade.estudianteId,
      name: grade.estudiante?.user?.nombreCompleto || `Estudiante ${grade.estudianteId}`,
      code: grade.estudiante?.codigoEstudiantil || `EST-${grade.estudianteId}`,
      grades: nextGradeList,
    });
  });

  return Array.from(studentMap.values()).map((student) => ({
    ...student,
    average: student.grades.length
      ? (student.grades.reduce((sum, grade) => sum + Number(grade.valor || 0), 0) / student.grades.length).toFixed(2)
      : "0.00",
  }));
};

export const SubjectsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [subjects, setSubjects] = useState<SubjectRecord[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [students, setStudents] = useState<UserRecord[]>([]);
  const [grades, setGrades] = useState<GradeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [careerFilter, setCareerFilter] = useState("all");
  const [showSubjectDialog, setShowSubjectDialog] = useState(false);
  const [showTeacherDialog, setShowTeacherDialog] = useState(false);
  const [showStudentsDialog, setShowStudentsDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectRecord | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<SubjectRecord | null>(null);
  const [subjectGrades, setSubjectGrades] = useState<GradeRecord[]>([]);
  const [assignStudentSearch, setAssignStudentSearch] = useState("");
  const [formData, setFormData] = useState({ nombre: "", carrera: "", semestre: 1, creditos: 1 });
  const [teacherAssignment, setTeacherAssignment] = useState({ docenteId: "" });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [subjectsData, teachersData, usersData, gradesData] = await Promise.all([
          api.getSubjects(),
          api.getTeachers().catch(() => []),
          api.getUsers().catch(() => []),
          api.getGrades().catch(() => []),
        ]);

        setSubjects(subjectsData);
        setTeachers(teachersData);
        setStudents((usersData as UserRecord[]).filter((item) => item.rol === "estudiante"));
        setGrades(gradesData);
      } catch (error: any) {
        toast.error(error.message || "No se pudieron cargar las materias");
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

  const loadSubjects = async () => {
    try {
      const [subjectsData, gradesData] = await Promise.all([api.getSubjects(), api.getGrades().catch(() => [])]);
      setSubjects(subjectsData);
      setGrades(gradesData);
    } catch (error: any) {
      toast.error(error.message || "No se pudieron actualizar las materias");
    }
  };

  const managedSubjects = useMemo(() => {
    if (user?.rol === "docente") {
      return subjects.filter((subject) => subject.docenteId === user.id);
    }
    return subjects;
  }, [subjects, user]);

  const visibleSubjects = useMemo(() => {
    const term = normalizeSearchValue(searchTerm);
    return managedSubjects.filter((subject) => {
      const matchesSearch =
        normalizeSearchValue(subject.nombre).includes(term) ||
        normalizeSearchValue(subject.codigo).includes(term) ||
        normalizeSearchValue(formatCategory(subject.carrera)).includes(term);

      const matchesCareer = careerFilter === "all" || subject.carrera === careerFilter;
      return matchesSearch && matchesCareer;
    });
  }, [careerFilter, managedSubjects, searchTerm]);

  const subjectMetrics = useMemo(() => {
    const totalSubjects = managedSubjects.length;
    const subjectsWithTeacher = managedSubjects.filter((subject) => subject.docenteId).length;
    const subjectsWithoutTeacher = totalSubjects - subjectsWithTeacher;
    const linkedStudents = new Set(
      grades
        .filter((grade) => managedSubjects.some((subject) => subject.id === grade.asignaturaId))
        .map((grade) => grade.estudianteId),
    ).size;

    return [
      { label: "Total materias", value: totalSubjects },
      { label: "Con docente", value: subjectsWithTeacher },
      { label: "Sin docente", value: subjectsWithoutTeacher },
      { label: "Estudiantes vinculados", value: linkedStudents },
    ];
  }, [grades, managedSubjects]);

  const currentSubjectStudents = useMemo(() => getSubjectStudents(subjectGrades), [subjectGrades]);

  const availableStudents = useMemo(() => {
    const linkedIds = new Set(currentSubjectStudents.map((student) => student.id));
    return students.filter((student) => {
      const matchesSearch =
        normalizeSearchValue(student.nombreCompleto).includes(normalizeSearchValue(assignStudentSearch)) ||
        normalizeSearchValue(student.correoInstitucional).includes(normalizeSearchValue(assignStudentSearch));
      return !linkedIds.has(student.id) && matchesSearch;
    });
  }, [assignStudentSearch, currentSubjectStudents, students]);

  const openSubjectDialog = (subject?: SubjectRecord) => {
    if (subject) {
      setEditingSubject(subject);
      setFormData({
        nombre: subject.nombre,
        carrera: subject.carrera,
        semestre: subject.semestre,
        creditos: subject.creditos,
      });
    } else {
      setEditingSubject(null);
      setFormData({ nombre: "", carrera: "", semestre: 1, creditos: 1 });
    }
    setShowSubjectDialog(true);
  };

  const handleSaveSubject = async () => {
    if (!formData.nombre || !formData.carrera) {
      toast.error("Completa todos los campos obligatorios");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        nombre: formData.nombre,
        carrera: formData.carrera as BookCategory,
        semestre: Number(formData.semestre),
        creditos: Number(formData.creditos),
      };

      if (editingSubject) {
        await api.updateSubject(editingSubject.id, payload);
        toast.success("Materia actualizada exitosamente");
      } else {
        await api.createSubject(payload);
        toast.success("Materia creada exitosamente");
      }

      setShowSubjectDialog(false);
      setEditingSubject(null);
      await loadSubjects();
    } catch (error: any) {
      toast.error(error.message || "No se pudo guardar la materia");
    } finally {
      setSaving(false);
    }
  };

  const openTeacherDialog = (subject: SubjectRecord) => {
    setSelectedSubject(subject);
    setTeacherAssignment({ docenteId: subject.docenteId ? String(subject.docenteId) : "" });
    setShowTeacherDialog(true);
  };

  const handleAssignTeacher = async () => {
    if (!selectedSubject) return;

    setSaving(true);
    try {
      await api.assignSubjectTeacher(selectedSubject.id, teacherAssignment.docenteId ? Number(teacherAssignment.docenteId) : null);
      toast.success("Docente asignado exitosamente");
      setShowTeacherDialog(false);
      await loadSubjects();
    } catch (error: any) {
      toast.error(error.message || "No se pudo asignar el docente");
    } finally {
      setSaving(false);
    }
  };

  const openDetailDialog = async (subject: SubjectRecord, openStudents = false) => {
    try {
      setSelectedSubject(subject);
      const subjectGradeList = grades.filter((grade) => grade.asignaturaId === subject.id);
      setSubjectGrades(subjectGradeList);
      setAssignStudentSearch("");
      if (openStudents) {
        setShowStudentsDialog(true);
      } else {
        setShowDetailDialog(true);
      }
    } catch (error: any) {
      toast.error(error.message || "No se pudo cargar el detalle de la materia");
    }
  };

  const semesterOptions = Array.from({ length: 10 }, (_, index) => index + 1);
  const creditOptions = Array.from({ length: 5 }, (_, index) => index + 1);

  return (
    <div className="h-screen overflow-hidden bg-background transition-colors">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <TopBar onMenuToggle={() => setSidebarOpen((prev) => !prev)} />
      <main className="lg:ml-64 mt-16 box-border flex h-[calc(100vh-4rem)] flex-col overflow-hidden p-4">
        <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
          {subjectMetrics.map((item) => (
            <Card key={item.label} className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
              <CardContent className="px-3 py-2">
                <p className="text-[12px] leading-tight text-gray-500 dark:text-[#B7BDD6]">{item.label}</p>
                <p className="mt-0.5 text-[1.45rem] font-bold leading-none text-gray-800 dark:text-[#F5F7FF]">{item.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 dark:border-gray-700 dark:bg-gray-800">
            <Search className="shrink-0 text-gray-400" size={18} />
            <Input
              placeholder="Buscar"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 dark:bg-transparent dark:text-white dark:placeholder-gray-400"
            />
            <div className="h-5 w-px bg-gray-200 dark:bg-gray-700" />
            <Select value={careerFilter} onValueChange={setCareerFilter}>
              <SelectTrigger className="h-9 w-[170px] justify-end border-0 bg-transparent px-0 text-right shadow-none focus:ring-0 dark:bg-transparent dark:text-white">
                <SelectValue placeholder="Filtrar carrera" />
              </SelectTrigger>
              <SelectContent className="dark:border-gray-700 dark:bg-gray-800">
                <SelectItem value="all" className="dark:text-white dark:focus:bg-gray-700">Todas</SelectItem>
                {BOOK_CATEGORY_OPTIONS.map((career) => (
                  <SelectItem key={career} value={career} className="dark:text-white dark:focus:bg-gray-700">
                    {formatCategory(career)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {isManagementRole(user?.rol) && (
            <Button onClick={() => openSubjectDialog()} className="h-10 shrink-0 bg-[#6C5CE7] hover:bg-[#5b4bd1]">
              <Plus size={16} className="mr-2" />Crear materia
            </Button>
          )}
        </div>

        <Card className="mt-2 flex min-h-0 flex-1 gap-0 overflow-hidden border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden p-0 last:pb-0 [&:last-child]:pb-0">
            {loading ? (
              <div className="flex flex-1 items-center justify-center px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                Cargando materias...
              </div>
            ) : (
              <div className="min-h-0 flex-1 overflow-auto rounded-[inherit]">
                <table className="w-full min-w-[1020px] table-fixed text-sm">
                  <colgroup>
                    <col className="w-[21%]" />
                    <col className="w-[11%]" />
                    <col className="w-[18%]" />
                    <col className="w-[8%]" />
                    <col className="w-[8%]" />
                    <col className="w-[18%]" />
                    <col className="w-[16%]" />
                  </colgroup>
                  <thead className="[&_tr]:border-b [&_tr]:border-gray-100 [&_tr]:bg-[#EEF2FF] dark:[&_tr]:border-gray-700 dark:[&_tr]:bg-[#2F355F]">
                    <tr>
                      <th className="sticky top-0 z-10 h-11 bg-[#EEF2FF] px-4 text-left align-middle text-sm font-semibold text-gray-700 dark:bg-[#2F355F] dark:text-[#E6EBFF]">Materia</th>
                      <th className="sticky top-0 z-10 h-11 bg-[#EEF2FF] px-4 text-left align-middle text-sm font-semibold text-gray-700 dark:bg-[#2F355F] dark:text-[#E6EBFF]">Código</th>
                      <th className="sticky top-0 z-10 h-11 bg-[#EEF2FF] px-4 text-left align-middle text-sm font-semibold text-gray-700 dark:bg-[#2F355F] dark:text-[#E6EBFF]">Carrera</th>
                      <th className="sticky top-0 z-10 h-11 bg-[#EEF2FF] px-4 text-left align-middle text-sm font-semibold text-gray-700 dark:bg-[#2F355F] dark:text-[#E6EBFF]">Sem.</th>
                      <th className="sticky top-0 z-10 h-11 bg-[#EEF2FF] px-4 text-left align-middle text-sm font-semibold text-gray-700 dark:bg-[#2F355F] dark:text-[#E6EBFF]">Cred.</th>
                      <th className="sticky top-0 z-10 h-11 bg-[#EEF2FF] px-4 text-left align-middle text-sm font-semibold text-gray-700 dark:bg-[#2F355F] dark:text-[#E6EBFF]">Docente</th>
                      <th className="sticky top-0 z-10 h-11 bg-[#EEF2FF] px-4 text-right align-middle text-sm font-semibold text-gray-700 dark:bg-[#2F355F] dark:text-[#E6EBFF]">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    {visibleSubjects.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                          No hay materias registradas.
                        </td>
                      </tr>
                    ) : (
                      visibleSubjects.map((subject) => {
                        const gradesForSubject = grades.filter((grade) => grade.asignaturaId === subject.id);
                        const enrolledStudents = new Set(gradesForSubject.map((grade) => grade.estudianteId)).size;

                        return (
                          <tr key={subject.id} className="border-b border-gray-100 transition-colors hover:bg-gray-50/80 dark:border-gray-700 dark:hover:bg-gray-700/50">
                            <td className="px-4 py-3 align-middle lg:py-2">
                              <div>
                                <p className="truncate font-medium text-gray-700 dark:text-white">{subject.nombre}</p>
                                <p className="mt-1 text-xs text-gray-500 dark:text-[#B7BDD6]">
                                  {enrolledStudents} inscritos · {gradesForSubject.length} notas registradas
                                </p>
                              </div>
                            </td>
                            <td className="px-4 py-3 align-middle text-gray-700 dark:text-gray-400 lg:py-2">{subject.codigo}</td>
                            <td className="truncate px-4 py-3 align-middle text-gray-700 dark:text-gray-400 lg:py-2">{formatCategory(subject.carrera)}</td>
                            <td className="px-4 py-3 align-middle text-gray-700 dark:text-gray-400 lg:py-2">{subject.semestre}</td>
                            <td className="px-4 py-3 align-middle text-gray-700 dark:text-gray-400 lg:py-2">{subject.creditos}</td>
                            <td className="px-4 py-3 align-middle lg:py-2">
                              <Badge className={subject.docenteId ? "bg-[#6C5CE7]/12 text-[#5b4bd1] dark:bg-[#6C5CE7]/20 dark:text-[#d9d4ff]" : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200"}>
                                {subject.docente?.user?.nombreCompleto || "Sin asignar"}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 align-middle lg:py-2">
                              <div className="flex justify-end gap-1">
                                <Button size="sm" variant="ghost" onClick={() => void openDetailDialog(subject)} title="Ver detalle">
                                  <Eye size={16} />
                                </Button>
                                {isManagementRole(user?.rol) && (
                                  <>
                                    <Button size="sm" variant="ghost" onClick={() => openSubjectDialog(subject)} title="Editar materia">
                                      <BookOpen size={16} />
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => openTeacherDialog(subject)} title="Asignar docente">
                                      <UserPlus size={16} />
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => void openDetailDialog(subject, true)} title="Asignar estudiantes">
                                      <Users size={16} />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={showSubjectDialog} onOpenChange={setShowSubjectDialog}>
          <DialogContent className="max-w-2xl dark:border-gray-700 dark:bg-gray-800">
            <DialogHeader>
              <DialogTitle className="dark:text-white">{editingSubject ? "Editar materia" : "Crear materia"}</DialogTitle>
              <DialogDescription className="dark:text-gray-400">
                {editingSubject ? "Actualiza la información base de la materia." : "Completa los datos de la nueva materia."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-3">
              <div>
                <Label className="dark:text-gray-300">Nombre</Label>
                <Input
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <Label className="dark:text-gray-300">Carrera</Label>
                <Select value={formData.carrera} onValueChange={(value) => setFormData({ ...formData, carrera: value })}>
                  <SelectTrigger className="dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                    <SelectValue placeholder="Selecciona una carrera" />
                  </SelectTrigger>
                  <SelectContent className="dark:border-gray-700 dark:bg-gray-800">
                    {BOOK_CATEGORY_OPTIONS.map((career) => (
                      <SelectItem key={career} value={career} className="dark:text-white dark:focus:bg-gray-700">
                        {formatCategory(career)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <Label className="dark:text-gray-300">Semestre</Label>
                  <Select value={String(formData.semestre)} onValueChange={(value) => setFormData({ ...formData, semestre: Number(value) })}>
                    <SelectTrigger className="dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="dark:border-gray-700 dark:bg-gray-800">
                      {semesterOptions.map((semester) => (
                        <SelectItem key={semester} value={String(semester)} className="dark:text-white dark:focus:bg-gray-700">
                          {semester}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="dark:text-gray-300">Créditos</Label>
                  <Select value={String(formData.creditos)} onValueChange={(value) => setFormData({ ...formData, creditos: Number(value) })}>
                    <SelectTrigger className="dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="dark:border-gray-700 dark:bg-gray-800">
                      {creditOptions.map((credit) => (
                        <SelectItem key={credit} value={String(credit)} className="dark:text-white dark:focus:bg-gray-700">
                          {credit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSubjectDialog(false)} className="dark:border-gray-600 dark:text-gray-300">
                Cancelar
              </Button>
              <Button onClick={handleSaveSubject} disabled={saving} className="bg-[#6C5CE7] hover:bg-[#5b4bd1]">
                {saving ? "Guardando..." : editingSubject ? "Guardar cambios" : "Crear materia"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showTeacherDialog} onOpenChange={setShowTeacherDialog}>
          <DialogContent className="max-w-xl dark:border-gray-700 dark:bg-gray-800">
            <DialogHeader>
              <DialogTitle className="dark:text-white">Asignar docente</DialogTitle>
              <DialogDescription className="dark:text-gray-400">
                Selecciona el docente responsable para "{selectedSubject?.nombre}".
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-3">
              <div>
                <Label className="dark:text-gray-300">Docente</Label>
                <Select value={teacherAssignment.docenteId} onValueChange={(value) => setTeacherAssignment({ docenteId: value })}>
                  <SelectTrigger className="dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                    <SelectValue placeholder="Selecciona un docente" />
                  </SelectTrigger>
                  <SelectContent className="dark:border-gray-700 dark:bg-gray-800">
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={String(teacher.id)} className="dark:text-white dark:focus:bg-gray-700">
                        {teacher.nombreCompleto}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowTeacherDialog(false)} className="dark:border-gray-600 dark:text-gray-300">
                Cancelar
              </Button>
              <Button onClick={handleAssignTeacher} disabled={saving} className="bg-[#6C5CE7] hover:bg-[#5b4bd1]">
                {saving ? "Guardando..." : "Asignar docente"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showStudentsDialog} onOpenChange={setShowStudentsDialog}>
          <DialogContent className="max-h-[86vh] w-[95vw] max-w-4xl overflow-hidden p-0 dark:border-gray-700 dark:bg-gray-800">
            <DialogHeader className="border-b border-gray-200 px-5 py-4 text-left dark:border-gray-700">
              <DialogTitle className="dark:text-white">Asignar estudiantes</DialogTitle>
              <DialogDescription className="dark:text-gray-400">
                Vista operativa de estudiantes vinculados y candidatos para "{selectedSubject?.nombre}".
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 overflow-y-auto px-5 py-4">
              <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-500/10 dark:text-amber-200">
                La plataforma actual no expone un endpoint de inscripción directa por materia. Esta vista te permite revisar estudiantes vinculados por historial académico real y los estudiantes disponibles para gestión posterior.
              </div>

              <div>
                <Label className="dark:text-gray-300">Buscar estudiante disponible</Label>
                <Input
                  placeholder="Buscar por nombre o correo"
                  value={assignStudentSearch}
                  onChange={(e) => setAssignStudentSearch(e.target.value)}
                  className="mt-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <Card className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900/40">
                  <CardHeader><CardTitle className="text-base dark:text-white">Estudiantes inscritos</CardTitle></CardHeader>
                  <CardContent className="space-y-2.5">
                    {currentSubjectStudents.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">No hay estudiantes inscritos por historial académico.</p>
                    ) : (
                      currentSubjectStudents.map((student) => (
                        <div key={student.id} className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50">
                          <p className="font-medium text-gray-700 dark:text-white">{student.name}</p>
                          <p className="text-sm text-gray-500 dark:text-[#B7BDD6]">{student.code} · Promedio {student.average}</p>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                <Card className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900/40">
                  <CardHeader><CardTitle className="text-base dark:text-white">Estudiantes disponibles</CardTitle></CardHeader>
                  <CardContent className="space-y-2.5">
                    {availableStudents.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">No hay estudiantes adicionales para mostrar.</p>
                    ) : (
                      availableStudents.slice(0, 10).map((student) => (
                        <div key={student.id} className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50">
                          <p className="font-medium text-gray-700 dark:text-white">{student.nombreCompleto}</p>
                          <p className="text-sm text-gray-500 dark:text-[#B7BDD6]">{student.correoInstitucional}</p>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-h-[88vh] w-[95vw] max-w-5xl overflow-hidden p-0 dark:border-gray-700 dark:bg-gray-800">
            <DialogHeader className="border-b border-gray-200 px-5 py-4 text-left dark:border-gray-700">
              <DialogTitle className="text-xl dark:text-white">{selectedSubject?.nombre}</DialogTitle>
              <DialogDescription className="dark:text-gray-400">
                Lista de materia, estudiantes inscritos, notas por materia e historial académico consolidado.
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="resumen" className="flex max-h-[calc(88vh-88px)] w-full flex-col">
              <div className="border-b border-gray-200 px-5 py-3 dark:border-gray-700">
                <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1 sm:grid-cols-4 dark:bg-gray-900/60">
                  <TabsTrigger value="resumen">Materia</TabsTrigger>
                  <TabsTrigger value="inscritos">Inscritos</TabsTrigger>
                  <TabsTrigger value="notas">Notas</TabsTrigger>
                  <TabsTrigger value="historial">Historial</TabsTrigger>
                </TabsList>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                <TabsContent value="resumen" className="mt-0 space-y-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {[
                      { label: "Código", value: selectedSubject?.codigo || "-", icon: BookOpen },
                      { label: "Semestre", value: selectedSubject?.semestre || "-", icon: GraduationCap },
                      { label: "Créditos", value: selectedSubject?.creditos || "-", icon: BookOpen },
                      { label: "Estudiantes inscritos", value: currentSubjectStudents.length, icon: Users },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <Card key={item.label} className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900/40">
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm text-gray-500 dark:text-[#B7BDD6]">{item.label}</p>
                                <p className="mt-1.5 text-2xl font-bold text-gray-800 dark:text-[#F5F7FF]">{item.value}</p>
                              </div>
                              <div className="mt-0.5 shrink-0 rounded-xl bg-[#6C5CE7]/12 p-2.5 text-[#5b4bd1] dark:bg-[#6C5CE7]/20 dark:text-[#d9d4ff]">
                                <Icon size={16} />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  <Card className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900/40">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div>
                          <p className="text-sm text-gray-500 dark:text-[#B7BDD6]">Carrera</p>
                          <p className="mt-1 font-medium text-gray-800 dark:text-white">{formatCategory(selectedSubject?.carrera)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-[#B7BDD6]">Docente asignado</p>
                          <p className="mt-1 font-medium text-gray-800 dark:text-white">{selectedSubject?.docente?.user?.nombreCompleto || "Sin asignar"}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="inscritos" className="mt-0 space-y-2.5">
                  {currentSubjectStudents.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400">No hay estudiantes inscritos para esta materia.</p>
                  ) : (
                    currentSubjectStudents.map((student) => (
                      <div key={student.id} className="rounded-lg bg-gray-50 p-3.5 dark:bg-gray-700/50">
                        <p className="font-medium text-gray-700 dark:text-white">{student.name}</p>
                        <p className="text-sm text-gray-500 dark:text-[#B7BDD6]">{student.code} · {student.grades.length} nota(s) registrada(s)</p>
                      </div>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="notas" className="mt-0 space-y-2.5">
                  {subjectGrades.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400">No hay notas registradas para esta materia.</p>
                  ) : (
                    subjectGrades.map((grade) => (
                      <div key={grade.id} className="rounded-lg bg-gray-50 p-3.5 dark:bg-gray-700/50">
                        <p className="font-medium text-gray-700 dark:text-white">{grade.estudiante?.user?.nombreCompleto || `Estudiante ${grade.estudianteId}`}</p>
                        <p className="text-sm text-gray-500 dark:text-[#B7BDD6]">
                          Nota: {Number(grade.valor).toFixed(2)} · Periodo: {grade.periodoAcademico} · Fecha: {formatDate(grade.fechaRegistro)}
                        </p>
                      </div>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="historial" className="mt-0 space-y-2.5">
                  {currentSubjectStudents.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400">No hay historial académico consolidado para esta materia.</p>
                  ) : (
                    currentSubjectStudents.map((student) => (
                      <div key={student.id} className="rounded-lg bg-gray-50 p-3.5 dark:bg-gray-700/50">
                        <p className="font-medium text-gray-700 dark:text-white">{student.name}</p>
                        <p className="text-sm text-gray-500 dark:text-[#B7BDD6]">
                          Promedio acumulado: {student.average} · Registros: {student.grades.length}
                        </p>
                      </div>
                    ))
                  )}
                </TabsContent>
              </div>
            </Tabs>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};
