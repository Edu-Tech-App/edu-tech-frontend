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
import { BookOpen, Eye, GraduationCap, Pencil, Plus, Search, Trash2, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { api, BOOK_CATEGORY_OPTIONS, type BookCategory } from "../../services/api";

interface SubjectRecord {
  id: number;
  codigo: string;
  nombre: string;
  carrera: string;
  semestre: number;
  creditos: number;
  docenteId: number | null;
  docente?: { user?: { nombreCompleto: string } };
  inscritosCount?: number;
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

interface StudentProfile {
  usuarioId: number;
  codigoEstudiantil: string;
  carrera: string;
  semestreActual: number;
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
  const [showEnrollDialog, setShowEnrollDialog] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectRecord | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<SubjectRecord | null>(null);
  const [subjectGrades, setSubjectGrades] = useState<GradeRecord[]>([]);
  const [subjectEnrollments, setSubjectEnrollments] = useState<any[]>([]);
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);
  const [assigningStudentId, setAssigningStudentId] = useState<number | null>(null);
  const [unrollingStudentId, setUnrollingStudentId] = useState<number | null>(null);
  const [assignStudentSearch, setAssignStudentSearch] = useState("");
  const [formData, setFormData] = useState({ nombre: "", carrera: "", semestre: 1, creditos: 1 });
  const [teacherAssignment, setTeacherAssignment] = useState({ docenteId: "" });

  const [myEnrollments, setMyEnrollments] = useState<number[]>([]);
  const [enrollingId, setEnrollingId] = useState<number | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const isAdmin = user?.rol === "administrativo";
        const isAcademic = isAdmin || user?.rol === "docente";
        const isStudent = user?.rol === "estudiante";

        const [subjectsData, teachersData, usersData, gradesData, myEnrollmentsData, studentProfileData] = await Promise.all([
          api.getSubjects(),
          isAdmin ? api.getTeachers().catch(() => []) : Promise.resolve([]),
          isAdmin ? api.getUsers().catch(() => []) : Promise.resolve([]),
          isAcademic
            ? api.getGrades().catch(() => [])
            : isStudent && user?.id
              ? api.getStudentGrades(user.id).catch(() => [])
              : Promise.resolve([]),
          isStudent ? api.getSubjectEnrollmentsByStudent() : Promise.resolve([]),
          isStudent ? api.getStudentSubjectProfile().catch(() => null) : Promise.resolve(null),
        ]);

        setSubjects(subjectsData);
        setTeachers(teachersData);
        setStudents((usersData as UserRecord[]).filter((item) => item.rol === "estudiante"));
        setGrades(gradesData);
        setMyEnrollments((myEnrollmentsData as any[]).map((e) => e.asignaturaId));
        setStudentProfile(studentProfileData);
      } catch (error: any) {
        toast.error(error.message || "No se pudieron cargar las materias");
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [user]);

  const loadStudentData = async () => {
    try {
      const myEnrollmentsData = await api.getSubjectEnrollmentsByStudent();
      setMyEnrollments((myEnrollmentsData as any[]).map((e) => e.asignaturaId));
      await loadSubjects(); // Refrescar lista general para ver contadores actualizados
    } catch (error: any) {
      toast.error("Error al actualizar tus inscripciones");
    }
  };

  const handleSelfEnroll = async (subjectId: number) => {
    if (!user) return;
    setEnrollingId(subjectId);
    try {
      await api.enrollStudent(subjectId, user.id);
      toast.success("Te has inscrito exitosamente");
      await loadStudentData();
    } catch (error: any) {
      toast.error(error.message || "No se pudo realizar la inscripción");
    } finally {
      setEnrollingId(null);
    }
  };

  const loadSubjects = async () => {
    try {
      const [subjectsData, gradesData] = await Promise.all([api.getSubjects(), api.getGrades().catch(() => [])]);
      setSubjects(subjectsData);
      setGrades(gradesData);
    } catch (error: any) {
      toast.error(error.message || "No se pudieron actualizar las materias");
    }
  };

  const loadEnrollments = async (subjectId: number) => {
    try {
      setEnrollmentLoading(true);
      const enrollments = await api.getSubjectEnrollments(subjectId);
      setSubjectEnrollments(enrollments);
    } catch (error: any) {
      toast.error(error.message || "Error al cargar inscripciones");
    } finally {
      setEnrollmentLoading(false);
    }
  };

  const managedSubjects = useMemo(() => {
    if (user?.rol === "estudiante") {
      return subjects.filter((subject) => myEnrollments.includes(subject.id));
    }

    if (user?.rol === "docente") {
      return subjects.filter((subject) => subject.docenteId === user.id);
    }

    return subjects;
  }, [myEnrollments, subjects, user]);

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

  const availableSubjectsForEnrollment = useMemo(() => {
    return subjects.filter((subject) => !myEnrollments.includes(subject.id));
  }, [myEnrollments, subjects]);

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

  const currentSubjectStudents = useMemo(() => {
    // Cruce de inscritos con notas (opcional, para ver promedios si existen)
    return subjectEnrollments.map((enroll) => {
      const studentId = enroll.estudianteId;
      const studentGrades = grades.filter((g) => g.asignaturaId === enroll.asignaturaId && g.estudianteId === studentId);
      
      return {
        id: studentId,
        name: enroll.estudiante?.user?.nombreCompleto || `Estudiante ${studentId}`,
        code: enroll.estudiante?.codigoEstudiantil || `EST-${studentId}`,
        grades: studentGrades,
        average: studentGrades.length
          ? (studentGrades.reduce((sum, grade) => sum + Number(grade.valor || 0), 0) / studentGrades.length).toFixed(2)
          : "0.00",
      };
    });
  }, [subjectEnrollments, grades]);

  const availableStudents = useMemo(() => {
    const linkedIds = new Set(subjectEnrollments.map((enroll) => enroll.estudianteId));
    return students.filter((student) => {
      const matchesSearch =
        normalizeSearchValue(student.nombreCompleto).includes(normalizeSearchValue(assignStudentSearch)) ||
        normalizeSearchValue(student.correoInstitucional).includes(normalizeSearchValue(assignStudentSearch));
      return !linkedIds.has(student.id) && matchesSearch;
    });
  }, [assignStudentSearch, subjectEnrollments, students]);

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
    setTeacherAssignment({ docenteId: subject.docenteId ? String(subject.docenteId) : "none" });
    setShowTeacherDialog(true);
  };

  const handleAssignTeacher = async () => {
    if (!selectedSubject) return;

    setSaving(true);
    try {
      await api.assignSubjectTeacher(
        selectedSubject.id,
        teacherAssignment.docenteId && teacherAssignment.docenteId !== "none"
          ? Number(teacherAssignment.docenteId)
          : null,
      );
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
      setEnrollmentLoading(true);
      
      const subjectGradeList = grades.filter((grade) => grade.asignaturaId === subject.id);
      setSubjectGrades(subjectGradeList);
      setAssignStudentSearch("");

      // Solo cargar inscritos reales si el rol tiene permiso (Admin o Docente)
      if (user?.rol === "administrativo" || user?.rol === "docente") {
        const enrollments = await api.getSubjectEnrollments(subject.id);
        setSubjectEnrollments(enrollments);
      } else {
        setSubjectEnrollments([]);
      }

      if (openStudents) {
        setShowStudentsDialog(true);
      } else {
        setShowDetailDialog(true);
      }
    } catch (error: any) {
      toast.error(error.message || "No se pudo cargar el detalle de la materia");
    } finally {
      setEnrollmentLoading(false);
    }
  };

  const handleEnrollStudent = async (studentId: number) => {
    if (!selectedSubject) return;

    setAssigningStudentId(studentId);
    try {
      await api.enrollStudent(selectedSubject.id, studentId);
      toast.success("Estudiante inscrito exitosamente");
      await loadEnrollments(selectedSubject.id);
    } catch (error: any) {
      toast.error(error.message || "Error al inscribir");
    } finally {
      setAssigningStudentId(null);
    }
  };

  const handleRemoveEnrollment = async (studentId: number) => {
    if (!selectedSubject) return;

    setUnrollingStudentId(studentId);
    try {
      await api.removeEnrollment(selectedSubject.id, studentId);
      toast.success("Inscripción retirada");
      await loadEnrollments(selectedSubject.id);
    } catch (error: any) {
      toast.error(error.message || "Error al retirar inscripción");
    } finally {
      setUnrollingStudentId(null);
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
          {user?.rol === "administrativo" && (
            <Button onClick={() => openSubjectDialog()} className="h-10 shrink-0 bg-[#6C5CE7] hover:bg-[#5b4bd1]">
              <Plus size={16} className="mr-2" />Crear materia
            </Button>
          )}
          {user?.rol === "estudiante" && (
            <Button onClick={() => setShowEnrollDialog(true)} className="h-10 shrink-0 bg-[#6C5CE7] hover:bg-[#5b4bd1]">
              <Plus size={16} className="mr-2" />Inscribirse
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
                          {user?.rol === "estudiante" ? "No tienes materias inscritas." : "No hay materias registradas."}
                        </td>
                      </tr>
                    ) : (
                      visibleSubjects.map((subject) => {
                        return (
                          <tr key={subject.id} className="border-b border-gray-100 transition-colors hover:bg-gray-50/80 dark:border-gray-700 dark:hover:bg-gray-700/50">
                            <td className="px-4 py-3 align-middle lg:py-2">
                              <div>
                                <p className="truncate font-medium text-gray-700 dark:text-white">{subject.nombre}</p>
                                <p className="mt-1 text-xs text-gray-500 dark:text-[#B7BDD6]">
                                  {subject.inscritosCount ?? 0}/30 inscritos (Cupo máximo)
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
                                {user?.rol === "estudiante" && (
                                  <Button
                                    size="sm"
                                    className="bg-[#6C5CE7] hover:bg-[#5b4bd1]"
                                    onClick={() => navigate(`/subjects/${subject.id}`)}
                                  >
                                    Ver notas
                                  </Button>
                                )}
                                {user?.rol !== "estudiante" && (
                                  <Button size="sm" variant="ghost" onClick={() => void openDetailDialog(subject)} title="Ver detalle">
                                    <Eye size={16} />
                                  </Button>
                                )}
                                {user?.rol === "administrativo" && (
                                  <>
                                    <Button size="sm" variant="ghost" onClick={() => openSubjectDialog(subject)} title="Editar materia">
                                      <Pencil size={16} />
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

        <Dialog open={showEnrollDialog} onOpenChange={setShowEnrollDialog}>
          <DialogContent className="max-w-3xl dark:border-gray-700 dark:bg-gray-800">
            <DialogHeader>
              <DialogTitle className="dark:text-white">Inscribirse a materias</DialogTitle>
              <DialogDescription className="dark:text-gray-400">
                {studentProfile?.carrera && studentProfile.carrera !== "Por definir"
                  ? `Solo se muestran materias de tu carrera: ${formatCategory(studentProfile.carrera)}.`
                  : "Debes tener una carrera asignada para poder inscribirte a una materia."}
              </DialogDescription>
            </DialogHeader>

            {!studentProfile?.carrera || studentProfile.carrera === "Por definir" ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
                Tienes que inscribirte a una carrera para inscribirte a una materia.
              </div>
            ) : availableSubjectsForEnrollment.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-700/40 dark:text-gray-300">
                No hay materias disponibles para inscripción en tu carrera.
              </div>
            ) : (
              <div className="max-h-[55vh] space-y-3 overflow-y-auto py-2">
                {availableSubjectsForEnrollment.map((subject) => (
                  <div key={subject.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50">
                    <div>
                      <p className="font-medium text-gray-700 dark:text-white">{subject.nombre}</p>
                      <p className="text-sm text-gray-500 dark:text-[#B7BDD6]">
                        {subject.codigo} · Semestre {subject.semestre} · {subject.creditos} créditos
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="bg-[#6C5CE7] hover:bg-[#5b4bd1]"
                      disabled={enrollingId === subject.id}
                      onClick={async () => {
                        await handleSelfEnroll(subject.id);
                        setShowEnrollDialog(false);
                      }}
                    >
                      {enrollingId === subject.id ? "Inscribiendo..." : "Inscribirme"}
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEnrollDialog(false)} className="dark:border-gray-600 dark:text-gray-300">
                Cerrar
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
                    <SelectItem value="none" className="dark:text-white dark:focus:bg-gray-700">
                      Sin asignar
                    </SelectItem>
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
          <DialogContent className="max-h-[88vh] w-[96vw] max-w-5xl overflow-hidden p-0 dark:border-gray-700 dark:bg-gray-800">
            <DialogHeader className="border-b border-gray-200 px-5 py-4 text-left dark:border-gray-700">
              <DialogTitle className="dark:text-white">Asignar estudiantes</DialogTitle>
              <DialogDescription className="dark:text-gray-400">
                Vista operativa de estudiantes vinculados y candidatos para "{selectedSubject?.nombre}".
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
              <div>
                <Label className="dark:text-gray-300">Buscar estudiante disponible</Label>
                <Input
                  placeholder="Buscar por nombre o correo"
                  value={assignStudentSearch}
                  onChange={(e) => setAssignStudentSearch(e.target.value)}
                  className="mt-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Card className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900/40">
                  <CardHeader><CardTitle className="text-base dark:text-white">Estudiantes inscritos</CardTitle></CardHeader>
                  <CardContent className="space-y-2.5">
                    {enrollmentLoading ? (
                      <p className="text-sm text-gray-500">Cargando inscritos...</p>
                    ) : currentSubjectStudents.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">No hay estudiantes inscritos.</p>
                    ) : (
                      currentSubjectStudents.map((student) => (
                        <div key={student.id} className="flex flex-col gap-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-medium text-gray-700 dark:text-white">{student.name}</p>
                            <p className="text-sm text-gray-500 dark:text-[#B7BDD6]">{student.code}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                            disabled={unrollingStudentId === student.id}
                            onClick={() => void handleRemoveEnrollment(student.id)}
                          >
                            <Trash2 size={16} />
                          </Button>
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
                        <div key={student.id} className="flex flex-col gap-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-medium text-gray-700 dark:text-white">{student.nombreCompleto}</p>
                            <p className="text-sm text-gray-500 dark:text-[#B7BDD6]">{student.correoInstitucional}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-[#6C5CE7] hover:bg-[#6C5CE7]/10"
                            disabled={assigningStudentId === student.id}
                            onClick={() => void handleEnrollStudent(student.id)}
                          >
                            <Plus size={16} />
                          </Button>
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
                      { label: "Código", value: selectedSubject?.codigo || "-" },
                      { label: "Semestre", value: selectedSubject?.semestre || "-" },
                      { label: "Créditos", value: selectedSubject?.creditos || "-" },
                      { label: "Estudiantes inscritos", value: currentSubjectStudents.length },
                    ].map((item) => {
                      return (
                        <Card key={item.label} className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900/40">
                          <CardContent className="p-3">
                            <p className="text-sm text-gray-500 dark:text-[#B7BDD6]">{item.label}</p>
                            <p className="mt-1.5 text-2xl font-bold text-gray-800 dark:text-[#F5F7FF]">{item.value}</p>
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
