import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Sidebar } from "../components/Sidebar";
import { TopBar } from "../components/TopBar";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { BookMarked, CalendarCheck, ChevronLeft, ChevronRight, Edit, Eye, GraduationCap, Plus, Search, ShieldCheck, Users } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../services/api";
import { useAuth } from "../context/AuthContext";

const ROLE_OPTIONS = [
  { value: "ESTUDIANTE", label: "Estudiante" },
  { value: "DOCENTE", label: "Docente" },
  { value: "BIBLIOTECARIO", label: "Bibliotecario" },
  { value: "ADMINISTRATIVO", label: "Administrativo" },
  { value: "SUPERVISOR", label: "Supervisor" },
] as const;

const STATUS_OPTIONS = [
  { value: "ACTIVO", label: "Activo" },
  { value: "INACTIVO", label: "Inactivo" },
] as const;

const FILTER_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "estudiante", label: "Estudiantes" },
  { value: "docente", label: "Docentes" },
  { value: "bibliotecario", label: "Bibliotecarios" },
  { value: "administrativo", label: "Administrativos" },
  { value: "supervisor", label: "Supervisores" },
  { value: "activo", label: "Activos" },
  { value: "inactivo", label: "Inactivos" },
] as const;

interface UserRecord {
  id: number;
  nombreCompleto: string;
  correoInstitucional: string;
  rol: "estudiante" | "docente" | "bibliotecario" | "administrativo" | "supervisor";
  estado: "activo" | "inactivo";
}

interface UserDetailData {
  loans: any[];
  reservations: any[];
  fines: any[];
  grades: any[];
  subjects: any[];
}

const ROLE_PERMISSIONS: Record<UserRecord["rol"], string[]> = {
  estudiante: ["Consultar materias", "Ver notas", "Ver préstamos", "Gestionar reservas propias"],
  docente: ["Gestionar materias asignadas", "Registrar notas", "Reservar salas", "Consultar historial académico"],
  bibliotecario: ["Gestionar biblioteca", "Registrar préstamos", "Administrar multas", "Consultar usuarios"],
  administrativo: ["Control total del sistema", "Gestionar usuarios", "Gestionar reportes", "Configurar operación"],
  supervisor: ["Supervisión operativa", "Consulta global", "Seguimiento de recursos", "Apoyo administrativo"],
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value);

const formatDate = (value?: string) => {
  if (!value) return "Sin fecha";
  return new Date(value).toLocaleDateString("es-ES");
};

const toUpperRole = (role: UserRecord["rol"]) => role.toUpperCase() as "ESTUDIANTE" | "DOCENTE" | "BIBLIOTECARIO" | "ADMINISTRATIVO" | "SUPERVISOR";
const toUpperStatus = (status: UserRecord["estado"]) => status.toUpperCase() as "ACTIVO" | "INACTIVO";
const formatLabel = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export const UserManagementPage = () => {
  const { user: authUser } = useAuth();
  const pageShellRef = useRef<HTMLDivElement | null>(null);
  const tableHeaderRef = useRef<HTMLTableSectionElement | null>(null);
  const tableViewportRef = useRef<HTMLDivElement | null>(null);
  const paginatorRef = useRef<HTMLDivElement | null>(null);
  const firstRowRef = useRef<HTMLTableRowElement | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(8);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [detailData, setDetailData] = useState<UserDetailData>({ loans: [], reservations: [], fines: [], grades: [], subjects: [] });
  const [newUser, setNewUser] = useState({ nombreCompleto: "", correo: "", documentoIdentidad: "", password: "", rol: "" });
  const [editUser, setEditUser] = useState({ nombreCompleto: "", correo: "", documentoIdentidad: "", password: "", rol: "", estado: "ACTIVO" });

  useEffect(() => { void loadUsers(); }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeFilter, rowsPerPage]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await api.getUsers();
      setUsers(
        (Array.isArray(data) ? data : []).map((item) => ({
          ...item,
          rol: String(item.rol || "").toLowerCase(),
          estado: String(item.estado || "").toLowerCase(),
        })),
      );
    } catch (error: any) {
      toast.error(error.message || "Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.correoInstitucional.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.rol.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      activeFilter === "all" ||
      user.rol === activeFilter ||
      user.estado === activeFilter;

    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / rowsPerPage));
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  useLayoutEffect(() => {
    const calculateRowsPerPage = () => {
      const tableViewportEl = tableViewportRef.current;
      if (!tableViewportEl) return;

      const viewportHeight = tableViewportEl.getBoundingClientRect().height;
      const headerHeight = tableHeaderRef.current?.getBoundingClientRect().height ?? 44;
      const rowHeight = firstRowRef.current?.getBoundingClientRect().height ?? 53;
      const fitTolerance = Math.max(6, Math.round(rowHeight * 0.18));
      const availableHeight = viewportHeight - headerHeight + fitTolerance;
      const nextRowsPerPage = Math.max(5, Math.floor(availableHeight / rowHeight));

      setRowsPerPage((current) => (current === nextRowsPerPage ? current : nextRowsPerPage));
    };

    const rafId = window.requestAnimationFrame(calculateRowsPerPage);

    const resizeObserver = new ResizeObserver(() => {
      calculateRowsPerPage();
    });

    if (pageShellRef.current) resizeObserver.observe(pageShellRef.current);
    if (tableViewportRef.current) resizeObserver.observe(tableViewportRef.current);
    if (paginatorRef.current) resizeObserver.observe(paginatorRef.current);
    if (tableHeaderRef.current) resizeObserver.observe(tableHeaderRef.current);
    if (firstRowRef.current) resizeObserver.observe(firstRowRef.current);

    window.addEventListener("resize", calculateRowsPerPage);
    return () => {
      window.cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      window.removeEventListener("resize", calculateRowsPerPage);
    };
  }, [filteredUsers.length, loading]);

  const loadUserDetails = async (user: UserRecord) => {
    setDetailLoading(true);
    setSelectedUser(user);
    setShowDetailDialog(true);

    try {
      const [loans, reservations, allLoans, grades, subjects] = await Promise.all([
        api.getStudentLoans(user.id).catch(() => []),
        api.getRoomReservationsByUser(user.id).catch(() => []),
        api.getLoans().catch(() => []),
        user.rol === "estudiante" ? api.getStudentGrades(user.id).catch(() => []) : Promise.resolve([]),
        api.getSubjects().catch(() => []),
      ]);

      const fines = (allLoans as any[]).filter((loan) => {
        const fineUserId = loan.estudiante?.usuarioId ?? loan.estudianteId;
        return fineUserId === user.id && loan.multa;
      }).map((loan) => loan.multa);

      const relatedSubjects = user.rol === "docente"
        ? (subjects as any[]).filter((subject) => subject.docenteId === user.id)
        : user.rol === "estudiante"
          ? (grades as any[]).map((grade) => grade.asignatura).filter(Boolean)
          : [];

      setDetailData({
        loans: loans as any[],
        reservations: reservations as any[],
        fines,
        grades: grades as any[],
        subjects: relatedSubjects,
      });
    } catch (error: any) {
      toast.error(error.message || "No se pudo cargar el detalle del usuario");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.nombreCompleto || !newUser.correo || !newUser.rol || !newUser.password || !newUser.documentoIdentidad) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    setSaving(true);
    try {
      await api.createUser({ ...newUser, rol: newUser.rol });
      toast.success(`Usuario ${newUser.nombreCompleto} creado exitosamente`);
      setShowCreateDialog(false);
      setNewUser({ nombreCompleto: "", correo: "", documentoIdentidad: "", password: "", rol: "" });
      await loadUsers();
    } catch (error: any) {
      toast.error(error.message || "Error al crear usuario");
    } finally {
      setSaving(false);
    }
  };

  const handleOpenEdit = (user: UserRecord) => {
    setSelectedUser(user);
    setEditUser({
      nombreCompleto: user.nombreCompleto,
      correo: user.correoInstitucional,
      documentoIdentidad: "",
      password: "",
      rol: toUpperRole(user.rol),
      estado: toUpperStatus(user.estado),
    });
    setShowEditDialog(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser || !editUser.nombreCompleto || !editUser.correo || !editUser.rol) {
      toast.error("Completa los campos obligatorios");
      return;
    }

    setSaving(true);
    try {
      await api.updateUser(selectedUser.id, {
        nombreCompleto: editUser.nombreCompleto,
        correo: editUser.correo,
        documentoIdentidad: editUser.documentoIdentidad || undefined,
        password: editUser.password || undefined,
        rol: editUser.rol as "ESTUDIANTE" | "DOCENTE" | "BIBLIOTECARIO" | "ADMINISTRATIVO" | "SUPERVISOR",
      });
      await api.updateUserStatus(selectedUser.id, editUser.estado);
      toast.success("Usuario actualizado exitosamente");
      setShowEditDialog(false);
      setSelectedUser(null);
      await loadUsers();
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar usuario");
    } finally {
      setSaving(false);
    }
  };

  const getRolColor = (rol: string) => {
    switch (rol) {
      case "estudiante": return "bg-[#6C5CE7]/14 text-[#5b4bd1] dark:bg-[#6C5CE7]/24 dark:text-[#d9d4ff]";
      case "docente": return "bg-slate-100 text-slate-700 dark:bg-slate-700/60 dark:text-slate-200";
      case "bibliotecario": return "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300";
      case "administrativo": return "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300";
      case "supervisor": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case "activo": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
      default: return "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300";
    }
  };

  const metricCards = [
    { label: "Total usuarios", value: users.length },
    { label: "Inactivos", value: users.filter((user) => user.estado === "inactivo").length },
    { label: "Estudiantes", value: users.filter((user) => user.rol === "estudiante").length },
    { label: "Docentes", value: users.filter((user) => user.rol === "docente").length },
  ];

  return (
    <div className="h-screen overflow-hidden bg-background transition-colors">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <TopBar onMenuToggle={() => setSidebarOpen((prev) => !prev)} />
      <main ref={pageShellRef} className="lg:ml-64 mt-16 box-border flex h-[calc(100vh-4rem)] flex-col overflow-hidden p-4">
        <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
            {metricCards.map((item) => (
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
              <Select value={activeFilter} onValueChange={setActiveFilter}>
                <SelectTrigger className="h-9 w-[132px] border-0 bg-transparent px-0 justify-end text-right shadow-none focus:ring-0 dark:bg-transparent dark:text-white">
                  <SelectValue placeholder="Filtrar" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                  {FILTER_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="dark:text-white dark:focus:bg-gray-700">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => setShowCreateDialog(true)} className="h-10 shrink-0 bg-[#6C5CE7] hover:bg-[#5b4bd1]">
              <Plus size={16} className="mr-2" />Crear usuario
            </Button>
        </div>

        <Card className="mt-2 flex min-h-0 flex-1 gap-0 overflow-hidden border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden p-0 last:pb-0 [&:last-child]:pb-0">
            {loading ? (
              <div className="flex flex-1 items-center justify-center px-4 py-8 text-center text-gray-500 dark:text-gray-400">Cargando usuarios...</div>
            ) : (
              <>
                <div ref={tableViewportRef} className="min-h-0 flex-1 overflow-auto rounded-[inherit]">
                  <table className="w-full min-w-[760px] table-fixed self-start caption-bottom text-sm">
                      <colgroup>
                        <col className="w-[28%]" />
                        <col className="w-[30%]" />
                        <col className="w-[16%]" />
                        <col className="w-[14%]" />
                        <col className="w-[12%]" />
                      </colgroup>
                      <thead
                        ref={tableHeaderRef}
                        className="[&_tr]:border-b [&_tr]:border-gray-100 [&_tr]:bg-[#EEF2FF] dark:[&_tr]:border-gray-700 dark:[&_tr]:bg-[#2F355F]"
                      >
                        <tr className="hover:bg-transparent dark:border-gray-700 dark:hover:bg-transparent">
                          <th className="sticky top-0 z-10 h-11 whitespace-nowrap bg-[#EEF2FF] px-4 text-left align-middle text-sm font-semibold text-gray-700 backdrop-blur dark:bg-[#2F355F] dark:text-[#E6EBFF]">Nombre</th>
                          <th className="sticky top-0 z-10 h-11 whitespace-nowrap bg-[#EEF2FF] px-4 text-left align-middle text-sm font-semibold text-gray-700 backdrop-blur dark:bg-[#2F355F] dark:text-[#E6EBFF]">Correo</th>
                          <th className="sticky top-0 z-10 h-11 whitespace-nowrap bg-[#EEF2FF] px-4 text-left align-middle text-sm font-semibold text-gray-700 backdrop-blur dark:bg-[#2F355F] dark:text-[#E6EBFF]">Rol</th>
                          <th className="sticky top-0 z-10 h-11 whitespace-nowrap bg-[#EEF2FF] px-4 text-left align-middle text-sm font-semibold text-gray-700 backdrop-blur dark:bg-[#2F355F] dark:text-[#E6EBFF]">Estado</th>
                          <th className="sticky top-0 z-10 h-11 whitespace-nowrap bg-[#EEF2FF] px-4 text-right align-middle text-sm font-semibold text-gray-700 backdrop-blur dark:bg-[#2F355F] dark:text-[#E6EBFF]">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="[&_tr:last-child]:border-0">
                        {paginatedUsers.map((user, index) => (
                          <tr
                            ref={index === 0 ? firstRowRef : null}
                            key={user.id}
                            className="border-b border-gray-100 transition-colors hover:bg-gray-50/80 dark:border-gray-700 dark:hover:bg-gray-700/50"
                          >
                            <td className="truncate px-4 py-3 align-middle whitespace-nowrap font-medium text-gray-700 dark:text-white lg:py-2">{user.nombreCompleto}</td>
                            <td className="truncate px-4 py-3 align-middle whitespace-nowrap text-gray-700 dark:text-gray-400 lg:py-2">{user.correoInstitucional}</td>
                            <td className="px-4 py-3 align-middle whitespace-nowrap lg:py-2"><Badge className={getRolColor(user.rol)}>{formatLabel(user.rol)}</Badge></td>
                            <td className="px-4 py-3 align-middle whitespace-nowrap lg:py-2"><Badge className={getStatusColor(user.estado)}>{formatLabel(user.estado)}</Badge></td>
                            <td className="px-4 py-3 align-middle whitespace-nowrap lg:py-2">
                              <div className="flex justify-end gap-1">
                                <Button size="sm" variant="ghost" onClick={() => void loadUserDetails(user)}><Eye size={16} /></Button>
                                {authUser?.rol === "administrativo" && (
                                  <Button size="sm" variant="ghost" onClick={() => handleOpenEdit(user)}><Edit size={16} /></Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                  </table>
                </div>
                <div ref={paginatorRef} className="flex items-center justify-between gap-3 border-t border-gray-200 px-4 py-2 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-[#B7BDD6]">
                    Mostrando {(currentPage - 1) * rowsPerPage + (paginatedUsers.length ? 1 : 0)}-{Math.min(currentPage * rowsPerPage, filteredUsers.length)} de {filteredUsers.length}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="outline" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} className="dark:border-gray-600 dark:text-gray-300">
                      <ChevronLeft size={16} />
                    </Button>
                    <span className="min-w-10 text-center text-sm text-gray-600 dark:text-[#D5D0EE]">{currentPage} / {totalPages}</span>
                    <Button size="sm" variant="outline" disabled={currentPage === totalPages} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} className="dark:border-gray-600 dark:text-gray-300">
                      <ChevronRight size={16} />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogContent className="max-w-2xl dark:bg-gray-800 dark:border-gray-700">
              <DialogHeader>
                <DialogTitle className="dark:text-white">Crear usuario</DialogTitle>
                <DialogDescription className="dark:text-gray-400">Alta de nuevo usuario en el sistema.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-3">
                <div><Label className="dark:text-gray-300">Nombre completo</Label><Input value={newUser.nombreCompleto} onChange={(e) => setNewUser({ ...newUser, nombreCompleto: e.target.value })} className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" /></div>
                <div><Label className="dark:text-gray-300">Documento</Label><Input value={newUser.documentoIdentidad} onChange={(e) => setNewUser({ ...newUser, documentoIdentidad: e.target.value })} className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" /></div>
                <div><Label className="dark:text-gray-300">Correo</Label><Input type="email" value={newUser.correo} onChange={(e) => setNewUser({ ...newUser, correo: e.target.value })} className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" /></div>
                <div><Label className="dark:text-gray-300">Contraseña</Label><Input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" /></div>
                <div>
                  <Label className="dark:text-gray-300">Rol</Label>
                  <Select value={newUser.rol} onValueChange={(value) => setNewUser({ ...newUser, rol: value })}>
                    <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"><SelectValue placeholder="Selecciona un rol" /></SelectTrigger>
                    <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                      {ROLE_OPTIONS.map((role) => <SelectItem key={role.value} value={role.value} className="dark:text-white dark:focus:bg-gray-700">{role.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="dark:border-gray-600 dark:text-gray-300">Cancelar</Button>
                <Button onClick={handleCreateUser} disabled={saving} className="bg-[#6C5CE7] hover:bg-[#5b4bd1]">{saving ? "Creando..." : "Crear usuario"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent className="max-w-2xl dark:bg-gray-800 dark:border-gray-700">
              <DialogHeader>
                <DialogTitle className="dark:text-white">Editar usuario</DialogTitle>
                <DialogDescription className="dark:text-gray-400">Editar usuario, cambiar rol, asignar permisos derivados y activar o bloquear acceso.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-3">
                <div><Label className="dark:text-gray-300">Nombre completo</Label><Input value={editUser.nombreCompleto} onChange={(e) => setEditUser({ ...editUser, nombreCompleto: e.target.value })} className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" /></div>
                <div><Label className="dark:text-gray-300">Documento</Label><Input placeholder="Solo si deseas actualizarlo" value={editUser.documentoIdentidad} onChange={(e) => setEditUser({ ...editUser, documentoIdentidad: e.target.value })} className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" /></div>
                <div><Label className="dark:text-gray-300">Correo</Label><Input type="email" value={editUser.correo} onChange={(e) => setEditUser({ ...editUser, correo: e.target.value })} className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" /></div>
                <div><Label className="dark:text-gray-300">Nueva contraseña</Label><Input type="password" placeholder="Déjala vacía si no cambiará" value={editUser.password} onChange={(e) => setEditUser({ ...editUser, password: e.target.value })} className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" /></div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <Label className="dark:text-gray-300">Cambiar rol</Label>
                    <Select value={editUser.rol} onValueChange={(value) => setEditUser({ ...editUser, rol: value })}>
                      <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"><SelectValue /></SelectTrigger>
                      <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                        {ROLE_OPTIONS.map((role) => <SelectItem key={role.value} value={role.value} className="dark:text-white dark:focus:bg-gray-700">{role.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="dark:text-gray-300">Estado del usuario</Label>
                    <Select value={editUser.estado} onValueChange={(value) => setEditUser({ ...editUser, estado: value })}>
                      <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"><SelectValue /></SelectTrigger>
                      <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                        {STATUS_OPTIONS.map((status) => <SelectItem key={status.value} value={status.value} className="dark:text-white dark:focus:bg-gray-700">{status.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="rounded-lg bg-gray-50 p-3.5 dark:bg-gray-700/50">
                  <div className="mb-2 flex items-center gap-2">
                    <ShieldCheck size={18} className="text-[#6C5CE7]" />
                    <p className="text-sm font-semibold text-gray-700 dark:text-white">Asignar permisos</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(ROLE_PERMISSIONS[(editUser.rol.toLowerCase() || "estudiante") as UserRecord["rol"]] ?? []).map((permission) => (
                      <Badge key={permission} className="bg-[#6C5CE7]/12 text-[#5b4bd1] dark:bg-[#6C5CE7]/20 dark:text-[#d9d4ff]">{permission}</Badge>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-gray-500 dark:text-[#B7BDD6]">Los permisos visibles se derivan del rol asignado actualmente.</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowEditDialog(false)} className="dark:border-gray-600 dark:text-gray-300">Cancelar</Button>
                <Button onClick={handleUpdateUser} disabled={saving} className="bg-[#6C5CE7] hover:bg-[#5b4bd1]">{saving ? "Guardando..." : "Guardar cambios"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
            <DialogContent className="flex max-h-[80vh] w-[95vw] max-w-4xl flex-col overflow-hidden p-0 dark:border-gray-700 dark:bg-gray-800">
              <DialogHeader className="shrink-0 border-b border-gray-200 px-5 py-3 text-left dark:border-gray-700">
                <div className="flex items-center gap-2.5">
                  <DialogTitle className="text-base font-semibold dark:text-white">{selectedUser?.nombreCompleto}</DialogTitle>
                  {selectedUser && <Badge className={getRolColor(selectedUser.rol)}>{formatLabel(selectedUser.rol)}</Badge>}
                  {selectedUser && <Badge className={getStatusColor(selectedUser.estado)}>{formatLabel(selectedUser.estado)}</Badge>}
                </div>
                <DialogDescription className="text-xs dark:text-gray-400">
                  {selectedUser?.correoInstitucional}
                </DialogDescription>
              </DialogHeader>

              {detailLoading ? (
                <div className="flex flex-1 items-center justify-center text-gray-500 dark:text-gray-400">Cargando detalle del usuario...</div>
              ) : (
                <Tabs defaultValue="historial" className="flex min-h-0 flex-1 flex-col">
                  <div className="shrink-0 border-b border-gray-200 px-5 py-3 dark:border-gray-700">
                    <TabsList className="grid h-auto w-full grid-cols-3 gap-1 rounded-xl bg-gray-100 p-1 lg:grid-cols-6 dark:bg-gray-900/60">
                      <TabsTrigger value="historial" className="text-xs sm:text-sm">Historial</TabsTrigger>
                      <TabsTrigger value="prestamos" className="text-xs sm:text-sm">Préstamos</TabsTrigger>
                      <TabsTrigger value="reservas" className="text-xs sm:text-sm">Reservas</TabsTrigger>
                      <TabsTrigger value="multas" className="text-xs sm:text-sm">Multas</TabsTrigger>
                      <TabsTrigger value="academico" className="text-xs sm:text-sm">Académico</TabsTrigger>
                      <TabsTrigger value="permisos" className="text-xs sm:text-sm">Permisos</TabsTrigger>
                    </TabsList>
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                  <TabsContent value="historial" className="mt-0 space-y-3">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      {[
                        { label: "Préstamos", value: detailData.loans.length, icon: BookMarked },
                        { label: "Reservas", value: detailData.reservations.length, icon: CalendarCheck },
                        { label: "Multas", value: detailData.fines.length, icon: ShieldCheck },
                        { label: "Materias / Notas", value: selectedUser?.rol === "estudiante" ? detailData.grades.length : detailData.subjects.length, icon: GraduationCap },
                      ].map((item) => {
                        const Icon = item.icon;
                        return (
                          <Card key={item.label} className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900/40">
                            <CardContent className="p-3">
                              <div className="flex items-center justify-between gap-2">
                                <div>
                                  <p className="text-xs text-gray-500 dark:text-[#B7BDD6]">{item.label}</p>
                                  <p className="mt-1 text-xl font-bold text-gray-800 dark:text-[#F5F7FF]">{item.value}</p>
                                </div>
                                <div className="shrink-0 rounded-lg bg-[#6C5CE7]/12 p-2 text-[#5b4bd1] dark:bg-[#6C5CE7]/20 dark:text-[#d9d4ff]">
                                  <Icon size={14} />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </TabsContent>

                  <TabsContent value="prestamos" className="mt-0 space-y-2.5">
                    {detailData.loans.length === 0 ? <p className="text-gray-500 dark:text-gray-400">No hay préstamos para este usuario.</p> : detailData.loans.map((loan) => (
                      <div key={loan.id} className="rounded-lg bg-gray-50 p-3.5 dark:bg-gray-700/50">
                        <p className="font-medium text-gray-700 dark:text-white">{loan.libro?.titulo || "Préstamo registrado"}</p>
                        <p className="text-sm text-gray-500 dark:text-[#B7BDD6]">Estado: {loan.estado} · Fecha: {formatDate(loan.fechaPrestamo)}</p>
                      </div>
                    ))}
                  </TabsContent>

                  <TabsContent value="reservas" className="mt-0 space-y-2.5">
                    {detailData.reservations.length === 0 ? <p className="text-gray-500 dark:text-gray-400">No hay reservas para este usuario.</p> : detailData.reservations.map((reservation) => (
                      <div key={reservation.id} className="rounded-lg bg-gray-50 p-3.5 dark:bg-gray-700/50">
                        <p className="font-medium text-gray-700 dark:text-white">{reservation.sala?.nombre || `Sala ${reservation.salaId}`}</p>
                        <p className="text-sm text-gray-500 dark:text-[#B7BDD6]">Estado: {reservation.estado} · Fecha: {formatDate(reservation.fechaReserva)}</p>
                      </div>
                    ))}
                  </TabsContent>

                  <TabsContent value="multas" className="mt-0 space-y-2.5">
                    {detailData.fines.length === 0 ? <p className="text-gray-500 dark:text-gray-400">No hay multas para este usuario.</p> : detailData.fines.map((fine, index) => (
                      <div key={`${fine.id ?? index}`} className="rounded-lg bg-gray-50 p-3.5 dark:bg-gray-700/50">
                        <p className="font-medium text-gray-700 dark:text-white">{formatCurrency(Number(fine.monto || 0))}</p>
                        <p className="text-sm text-gray-500 dark:text-[#B7BDD6]">Estado: {fine.estado} · Días de retraso: {fine.diasRetraso ?? 0}</p>
                      </div>
                    ))}
                  </TabsContent>

                  <TabsContent value="academico" className="mt-0 space-y-2.5">
                    {selectedUser?.rol === "estudiante" ? (
                      detailData.grades.length === 0 ? <p className="text-gray-500 dark:text-gray-400">No hay notas registradas para este usuario.</p> : detailData.grades.map((grade) => (
                        <div key={grade.id} className="rounded-lg bg-gray-50 p-3.5 dark:bg-gray-700/50">
                          <p className="font-medium text-gray-700 dark:text-white">{grade.asignatura?.nombre || "Materia"}</p>
                          <p className="text-sm text-gray-500 dark:text-[#B7BDD6]">Nota: {grade.valor} · Periodo: {grade.periodoAcademico}</p>
                        </div>
                      ))
                    ) : selectedUser?.rol === "docente" ? (
                      detailData.subjects.length === 0 ? <p className="text-gray-500 dark:text-gray-400">No hay materias asignadas para este docente.</p> : detailData.subjects.map((subject) => (
                        <div key={subject.id} className="rounded-lg bg-gray-50 p-3.5 dark:bg-gray-700/50">
                          <p className="font-medium text-gray-700 dark:text-white">{subject.nombre}</p>
                          <p className="text-sm text-gray-500 dark:text-[#B7BDD6]">Código: {subject.codigo} · Semestre: {subject.semestre}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400">Este rol no tiene materias o notas aplicables.</p>
                    )}
                  </TabsContent>

                  <TabsContent value="permisos" className="mt-0">
                    <div className="rounded-lg bg-gray-50 p-3.5 dark:bg-gray-700/50">
                      <div className="mb-2 flex items-center gap-2">
                        <Users size={18} className="text-[#6C5CE7]" />
                        <p className="font-medium text-gray-700 dark:text-white">Permisos asignados</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(selectedUser ? ROLE_PERMISSIONS[selectedUser.rol] : []).map((permission) => (
                          <Badge key={permission} className="bg-[#6C5CE7]/12 text-[#5b4bd1] dark:bg-[#6C5CE7]/20 dark:text-[#d9d4ff]">{permission}</Badge>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                  </div>
                </Tabs>
              )}
            </DialogContent>
          </Dialog>
      </main>
    </div>
  );
};
