import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { Sidebar } from "../components/Sidebar";
import { TopBar } from "../components/TopBar";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Users, Plus, Edit, Trash2, UserPlus, Search, Eye } from "lucide-react";
import { toast } from "sonner";
import { api, BOOK_CATEGORY_OPTIONS, type BookCategory } from "../../services/api";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";

interface SubjectRecord {
  id: number; codigo: string; nombre: string; carrera: string;
  semestre: number; creditos: number; docenteId: number;
  docente?: { user?: { nombreCompleto: string } };
}
interface TeacherOption { id: number; nombreCompleto: string; }

const normalizeSearchValue = (value?: string | null) =>
  (value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const formatCategory = (categoria?: string | null) => {
  const labels: Record<BookCategory, string> = {
    INGENIERIA_SISTEMAS: "Ingeniería de Sistemas", INGENIERIA_CIVIL: "Ingeniería Civil",
    INGENIERIA_INDUSTRIAL: "Ingeniería Industrial", ADMINISTRACION: "Administración",
    CONTADURIA: "Contaduría", ECONOMIA: "Economía", DERECHO: "Derecho",
    MEDICINA: "Medicina", ENFERMERIA: "Enfermería", PSICOLOGIA: "Psicología",
    EDUCACION: "Educación", MATEMATICAS: "Matemáticas",
  };
  return labels[categoria as BookCategory] || categoria || "";
};

export const SubjectsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [subjects, setSubjects] = useState<SubjectRecord[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAssignTeacherDialog, setShowAssignTeacherDialog] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectRecord | null>(null);
  const [subjectToDelete, setSubjectToDelete] = useState<SubjectRecord | null>(null);
  const [subjectToAssignTeacher, setSubjectToAssignTeacher] = useState<SubjectRecord | null>(null);
  const [formData, setFormData] = useState({ nombre: "", carrera: "", semestre: 1, creditos: 1 });
  const [teacherAssignment, setTeacherAssignment] = useState({ docenteId: "" });

  useEffect(() => {
    const loadData = async () => {
      // ✅ Carga materias primero, sin depender de teachers
      try {
        setLoading(true);
        const subjectsData = await api.getSubjects();
        setSubjects(subjectsData);
      } catch (error: any) {
        toast.error(error.message || "No se pudieron cargar las materias");
      } finally {
        setLoading(false);
      }

      // ✅ Carga teachers por separado sin bloquear
      try {
        const usersData = await api.getTeachers();
        setTeachers(usersData);
      } catch {
        // silencioso — los teachers son opcionales
      }
    };
    void loadData();
  }, []);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      const subjectsData = await api.getSubjects();
      setSubjects(subjectsData);
    } catch (error: any) {
      toast.error(error.message || "No se pudieron cargar las materias");
    } finally {
      setLoading(false);
    }
  };

  const filteredSubjects = user?.rol === "docente" ? subjects.filter((s) => s.docenteId === user.id) : subjects;
  const visibleSubjects = filteredSubjects.filter((subject) => {
    const term = normalizeSearchValue(searchTerm);
    return normalizeSearchValue(subject.nombre).includes(term) ||
      normalizeSearchValue(subject.codigo).includes(term) ||
      normalizeSearchValue(formatCategory(subject.carrera)).includes(term);
  });

  const handleOpenDialog = (subject?: SubjectRecord) => {
    if (subject) {
      setEditingSubject(subject);
      setFormData({ nombre: subject.nombre, carrera: subject.carrera, semestre: subject.semestre, creditos: subject.creditos });
    } else {
      setEditingSubject(null);
      setFormData({ nombre: "", carrera: "", semestre: 1, creditos: 1 });
    }
    setShowDialog(true);
  };

  const handleSaveSubject = async () => {
    if (!formData.nombre || !formData.carrera) { toast.error("Completa todos los campos"); return; }
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
      setShowDialog(false);
      setEditingSubject(null);
      await loadSubjects();
    } catch (error: any) {
      toast.error(error.message || "No se pudo guardar la materia");
    } finally {
      setSaving(false);
    }
  };

  const handleOpenAssignTeacherDialog = (subject: SubjectRecord) => {
    setSubjectToAssignTeacher(subject);
    setTeacherAssignment({ docenteId: subject.docenteId ? String(subject.docenteId) : "" });
    setShowAssignTeacherDialog(true);
  };

  const handleAssignTeacher = async () => {
    if (!subjectToAssignTeacher) return;
    setSaving(true);
    try {
      await api.assignSubjectTeacher(subjectToAssignTeacher.id, teacherAssignment.docenteId ? Number(teacherAssignment.docenteId) : null);
      toast.success("Docente asignado exitosamente");
      setShowAssignTeacherDialog(false);
      setSubjectToAssignTeacher(null);
      await loadSubjects();
    } catch (error: any) {
      toast.error(error.message || "No se pudo asignar el docente");
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!subjectToDelete) return;
    setSaving(true);
    try {
      await api.deleteSubject(subjectToDelete.id);
      toast.success("Materia eliminada exitosamente");
      setShowDeleteDialog(false);
      setSubjectToDelete(null);
      await loadSubjects();
    } catch (error: any) {
      toast.error(error.message || "No se pudo eliminar la materia");
    } finally {
      setSaving(false);
    }
  };

  const semesterOptions = Array.from({ length: 10 }, (_, i) => i + 1);
  const creditOptions = Array.from({ length: 5 }, (_, i) => i + 1);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#202445] transition-colors">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <TopBar onMenuToggle={() => setSidebarOpen((prev) => !prev)} />
      <main className="lg:ml-64 pt-[4.5rem]">
        <div className="page-shell">
        <div className="page-header">
          <h1 className="page-title">
            {user?.rol === "estudiante" ? "Mis Materias" : user?.rol === "administrativo" ? "Gestión de Materias" : "Materias Asignadas"}
          </h1>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input placeholder="Buscar materias..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400" />
          </div>
          {user?.rol === "administrativo" && (
            <Button onClick={() => handleOpenDialog()} className="bg-[#6C5CE7] hover:bg-[#5b4bd1]">
              <Plus size={16} className="mr-2" />Crear Materia
            </Button>
          )}
        </div>

        <Card className="mt-1 border-gray-100 bg-white/70 px-6 pb-8 dark:border-gray-700 dark:bg-gray-800">
          <div>
            {loading ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">Cargando materias...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="dark:border-gray-700">
                    <TableHead className="dark:text-gray-300">Nombre</TableHead>
                    <TableHead className="dark:text-gray-300">Código</TableHead>
                    <TableHead className="dark:text-gray-300">Carrera</TableHead>
                    <TableHead className="dark:text-gray-300">Semestre</TableHead>
                    <TableHead className="dark:text-gray-300">Créditos</TableHead>
                    <TableHead className="dark:text-gray-300">Docente</TableHead>
                    <TableHead className="dark:text-gray-300">Estado</TableHead>
                    <TableHead className="dark:text-gray-300">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleSubjects.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500 dark:text-gray-400">
                        No hay materias registradas.
                      </TableCell>
                    </TableRow>
                  ) : visibleSubjects.map((subject) => (
                    <TableRow key={subject.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 dark:border-gray-700">
                      <TableCell className="font-medium dark:text-white">{subject.nombre}</TableCell>
                      <TableCell className="dark:text-gray-400">{subject.codigo}</TableCell>
                      <TableCell className="dark:text-gray-400">{formatCategory(subject.carrera)}</TableCell>
                      <TableCell className="dark:text-gray-400">{subject.semestre}</TableCell>
                      <TableCell className="dark:text-gray-400">{subject.creditos}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Users size={16} />
                          <span>{subject.docente?.user?.nombreCompleto || "Docente no asignado"}</span>
                        </div>
                      </TableCell>
                      <TableCell><Badge className="bg-green-500">Activa</Badge></TableCell>
                      <TableCell>
                        {user?.rol === "administrativo" ? (
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost" onClick={() => handleOpenDialog(subject)}><Edit size={16} /></Button>
                            <Button size="sm" variant="ghost" onClick={() => handleOpenAssignTeacherDialog(subject)}><UserPlus size={16} className="text-[#6C5CE7]" /></Button>
                            <Button size="sm" variant="ghost" onClick={() => { setSubjectToDelete(subject); setShowDeleteDialog(true); }}><Trash2 size={16} className="text-red-600" /></Button>
                          </div>
                        ) : user?.rol === "estudiante" ? (
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="dark:border-gray-600 dark:text-gray-300" onClick={() => toast.success(`Solicitud de inscripción iniciada para "${subject.nombre}"`)}><Plus size={16} /></Button>
                            <Button size="sm" onClick={() => navigate(`/subjects/${subject.id}`)}><Eye size={16} /></Button>
                          </div>
                        ) : (
                          <Button size="sm" onClick={() => navigate(`/subjects/${subject.id}`)}>Gestionar Materia</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </Card>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="dark:bg-gray-800 dark:border-gray-700">
            <DialogHeader>
              <DialogTitle className="dark:text-white">{editingSubject ? "Editar Materia" : "Crear Materia"}</DialogTitle>
              <DialogDescription className="dark:text-gray-400">{editingSubject ? "Actualiza la información base de la materia" : "Completa los datos de la nueva materia"}</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div>
                <Label className="dark:text-gray-300">Nombre</Label>
                <Input value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} placeholder="Nombre de la materia" className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                <Label className="dark:text-gray-300">Carrera</Label>
                <Select value={formData.carrera} onValueChange={(v) => setFormData({ ...formData, carrera: v })}>
                  <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"><SelectValue placeholder="Selecciona una carrera" /></SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                    {BOOK_CATEGORY_OPTIONS.map((c) => <SelectItem key={c} value={c} className="dark:text-white dark:focus:bg-gray-700">{formatCategory(c)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="dark:text-gray-300">Semestre</Label>
                <Select value={String(formData.semestre)} onValueChange={(v) => setFormData({ ...formData, semestre: Number(v) })}>
                  <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                    {semesterOptions.map((s) => <SelectItem key={s} value={String(s)} className="dark:text-white dark:focus:bg-gray-700">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="dark:text-gray-300">Créditos</Label>
                <Select value={String(formData.creditos)} onValueChange={(v) => setFormData({ ...formData, creditos: Number(v) })}>
                  <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                    {creditOptions.map((c) => <SelectItem key={c} value={String(c)} className="dark:text-white dark:focus:bg-gray-700">{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)} className="dark:border-gray-600 dark:text-gray-300">Cancelar</Button>
              <Button onClick={handleSaveSubject} disabled={saving} className="bg-[#6C5CE7] hover:bg-[#5b4bd1]">{saving ? "Guardando..." : editingSubject ? "Guardar Cambios" : "Crear Materia"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showAssignTeacherDialog} onOpenChange={setShowAssignTeacherDialog}>
          <DialogContent className="dark:bg-gray-800 dark:border-gray-700">
            <DialogHeader>
              <DialogTitle className="dark:text-white">Docente</DialogTitle>
              <DialogDescription className="dark:text-gray-400">Selecciona el docente para "{subjectToAssignTeacher?.nombre}".</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div>
                <Label className="dark:text-gray-300">Docente</Label>
                <Select value={teacherAssignment.docenteId || "NONE"} onValueChange={(v) => setTeacherAssignment({ docenteId: v === "NONE" ? "" : v })}>
                  <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"><SelectValue placeholder="Selecciona un docente" /></SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                    <SelectItem value="NONE" className="dark:text-white dark:focus:bg-gray-700">Sin docente asignado</SelectItem>
                    {teachers.map((t) => <SelectItem key={t.id} value={String(t.id)} className="dark:text-white dark:focus:bg-gray-700">{t.nombreCompleto}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAssignTeacherDialog(false)} className="mr-auto dark:border-gray-600 dark:text-gray-300">Cancelar</Button>
              <Button onClick={handleAssignTeacher} disabled={saving} className="bg-[#6C5CE7] hover:bg-[#5b4bd1]">{saving ? "Guardando..." : "Guardar Asignación"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="dark:bg-gray-800 dark:border-gray-700">
            <DialogHeader>
              <DialogTitle className="dark:text-white">Confirmar Eliminación</DialogTitle>
              <DialogDescription className="dark:text-gray-400">¿Estás seguro de que quieres eliminar "{subjectToDelete?.nombre}"?</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="dark:border-gray-600 dark:text-gray-300">Cancelar</Button>
              <Button onClick={handleConfirmDelete} disabled={saving} className="bg-red-600 hover:bg-red-700">{saving ? "Eliminando..." : "Eliminar"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </main>
    </div>
  );
};
