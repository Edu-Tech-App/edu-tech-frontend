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
  id: number;
  codigo: string;
  nombre: string;
  carrera: string;
  semestre: number;
  creditos: number;
  docenteId: number;
  docente?: {
    user?: {
      nombreCompleto: string;
    };
  };
}

interface TeacherOption {
  id: number;
  nombreCompleto: string;
}

const normalizeSearchValue = (value?: string | null) =>
  (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

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

export const SubjectsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
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
  const [formData, setFormData] = useState({
    nombre: "",
    carrera: "",
    semestre: 1,
    creditos: 1,
  });
  const [teacherAssignment, setTeacherAssignment] = useState({
    docenteId: "",
  });

  useEffect(() => {
    const loadSubjects = async () => {
      try {
        setLoading(true);
        const [subjectsData, usersData] = await Promise.all([
          api.getSubjects(),
          api.getTeachers(),
        ]);
        setTeachers(usersData);
        setSubjects(subjectsData);
      } catch (error: any) {
        toast.error(error.message || "No se pudieron cargar las materias");
      } finally {
        setLoading(false);
      }
    };

    void loadSubjects();
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

  const filteredSubjects =
    user?.rol === "docente"
      ? subjects.filter((subject) => subject.docenteId === user.id)
      : subjects;

  const visibleSubjects = filteredSubjects.filter((subject) => {
    const term = normalizeSearchValue(searchTerm);
    return (
      normalizeSearchValue(subject.nombre).includes(term) ||
      normalizeSearchValue(subject.codigo).includes(term) ||
      normalizeSearchValue(formatCategory(subject.carrera)).includes(term)
    );
  });

  const handleOpenDialog = (subject?: SubjectRecord) => {
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
      setFormData({
        nombre: "",
        carrera: "",
        semestre: 1,
        creditos: 1,
      });
    }
    setShowDialog(true);
  };

  const handleSaveSubject = async () => {
    if (!formData.nombre || !formData.carrera) {
      toast.error("Completa todos los campos");
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

      setShowDialog(false);
      setEditingSubject(null);
      await loadSubjects();
    } catch (error: any) {
      toast.error(error.message || "No se pudo guardar la materia");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (subject: SubjectRecord) => {
    setSubjectToDelete(subject);
    setShowDeleteDialog(true);
  };

  const handleOpenAssignTeacherDialog = (subject: SubjectRecord) => {
    setSubjectToAssignTeacher(subject);
    setTeacherAssignment({
      docenteId: subject.docenteId ? String(subject.docenteId) : "",
    });
    setShowAssignTeacherDialog(true);
  };

  const handleStudentEnroll = (subject: SubjectRecord) => {
    toast.success(`Solicitud de inscripción iniciada para "${subject.nombre}"`);
  };

  const handleAssignTeacher = async () => {
    if (!subjectToAssignTeacher) {
      return;
    }

    setSaving(true);
    try {
      await api.assignSubjectTeacher(
        subjectToAssignTeacher.id,
        teacherAssignment.docenteId ? Number(teacherAssignment.docenteId) : null,
      );
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

  const semesterOptions = Array.from({ length: 10 }, (_, index) => index + 1);
  const creditOptions = Array.from({ length: 5 }, (_, index) => index + 1);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <TopBar />
      <main className="ml-64 pt-[4.5rem] px-5 pb-8 md:px-6">
        <div className="mb-6 mt-1">
          <h1 className="text-3xl font-bold text-gray-900">
            {user?.rol === "estudiante"
              ? "Mis Materias"
              : user?.rol === "administrativo"
                ? "Gestión de Materias"
                : "Materias Asignadas"}
          </h1>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              placeholder="Buscar materias..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          {user?.rol === "administrativo" && (
            <Button onClick={() => handleOpenDialog()} className="bg-blue-900 hover:bg-blue-800">
              <Plus size={16} className="mr-2" />
              Crear Materia
            </Button>
          )}
        </div>

        <Card className="mt-1">
          <CardContent className="pb-8">
            {loading ? (
              <p className="text-center text-gray-500 py-8">Cargando materias...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Carrera</TableHead>
                    <TableHead>Semestre</TableHead>
                    <TableHead>Créditos</TableHead>
                    <TableHead>Docente</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleSubjects.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        No hay materias registradas.
                      </TableCell>
                    </TableRow>
                  ) : (
                    visibleSubjects.map((subject) => (
                      <TableRow key={subject.id} className="cursor-pointer hover:bg-gray-50">
                        <TableCell className="font-medium">{subject.nombre}</TableCell>
                        <TableCell>{subject.codigo}</TableCell>
                        <TableCell>{formatCategory(subject.carrera)}</TableCell>
                        <TableCell>{subject.semestre}</TableCell>
                        <TableCell>{subject.creditos}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Users size={16} />
                            <span>{subject.docente?.user?.nombreCompleto || "Docente no asignado"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-green-500">Activa</Badge>
                        </TableCell>
                        <TableCell>
                          {user?.rol === "administrativo" ? (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleOpenDialog(subject)}
                              >
                                <Edit size={16} />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleOpenAssignTeacherDialog(subject)}
                              >
                                <UserPlus size={16} className="text-blue-700" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteClick(subject)}
                              >
                                <Trash2 size={16} className="text-red-600" />
                              </Button>
                            </div>
                          ) : user?.rol === "estudiante" ? (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStudentEnroll(subject)}
                                title="Inscribirse"
                              >
                                <Plus size={16} />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => navigate(`/subjects/${subject.id}`)}
                                title="Ver materia"
                              >
                                <Eye size={16} />
                              </Button>
                            </div>
                          ) : (
                            <Button size="sm" onClick={() => navigate(`/subjects/${subject.id}`)}>
                              Gestionar Materia
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSubject ? "Editar Materia" : "Crear Materia"}</DialogTitle>
              <DialogDescription>
                {editingSubject ? "Actualiza la información base de la materia" : "Completa los datos de la nueva materia"}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div>
                <Label>Nombre</Label>
                <Input
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Nombre de la materia"
                />
              </div>
              <div>
                <Label>Carrera</Label>
                <Select
                  value={formData.carrera}
                  onValueChange={(value) => setFormData({ ...formData, carrera: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una carrera" />
                  </SelectTrigger>
                  <SelectContent>
                    {BOOK_CATEGORY_OPTIONS.map((category) => (
                      <SelectItem key={category} value={category}>
                        {formatCategory(category)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Semestre</Label>
                <Select
                  value={String(formData.semestre)}
                  onValueChange={(value) => setFormData({ ...formData, semestre: Number(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un semestre" />
                  </SelectTrigger>
                  <SelectContent>
                    {semesterOptions.map((semester) => (
                      <SelectItem key={semester} value={String(semester)}>
                        {semester}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Créditos</Label>
                <Select
                  value={String(formData.creditos)}
                  onValueChange={(value) => setFormData({ ...formData, creditos: Number(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona créditos" />
                  </SelectTrigger>
                  <SelectContent>
                    {creditOptions.map((credit) => (
                      <SelectItem key={credit} value={String(credit)}>
                        {credit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveSubject} disabled={saving} className="bg-blue-900 hover:bg-blue-800">
                {saving ? "Guardando..." : editingSubject ? "Guardar Cambios" : "Crear Materia"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showAssignTeacherDialog} onOpenChange={setShowAssignTeacherDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Docente</DialogTitle>
              <DialogDescription>
                Selecciona el docente para la materia "{subjectToAssignTeacher?.nombre}".
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div>
                <Label>Docente</Label>
                <Select
                  value={teacherAssignment.docenteId || "NONE"}
                  onValueChange={(value) =>
                    setTeacherAssignment({ docenteId: value === "NONE" ? "" : value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un docente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Sin docente asignado</SelectItem>
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={String(teacher.id)}>
                        {teacher.nombreCompleto}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAssignTeacherDialog(false)} className="mr-auto">
                Cancelar
              </Button>
              <Button onClick={handleAssignTeacher} disabled={saving} className="bg-blue-900 hover:bg-blue-800">
                {saving ? "Guardando..." : "Guardar Asignación"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Eliminación</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que quieres eliminar la materia "{subjectToDelete?.nombre}"?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleConfirmDelete} disabled={saving} className="bg-red-600 hover:bg-red-700">
                {saving ? "Eliminando..." : "Eliminar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};
