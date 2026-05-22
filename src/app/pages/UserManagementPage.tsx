import { useEffect, useState } from "react";
import { Sidebar } from "../components/Sidebar";
import { TopBar } from "../components/TopBar";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Edit, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../services/api";

const ROLE_OPTIONS = [
  { value: "ESTUDIANTE", label: "Estudiante" },
  { value: "DOCENTE", label: "Docente" },
  { value: "BIBLIOTECARIO", label: "Bibliotecario" },
  { value: "ADMINISTRATIVO", label: "Administrativo" },
] as const;

const STATUS_OPTIONS = [
  { value: "ACTIVO", label: "Activo" },
  { value: "INACTIVO", label: "Inactivo" },
] as const;

interface UserRecord {
  id: number; nombreCompleto: string; correoInstitucional: string;
  rol: "estudiante" | "docente" | "bibliotecario" | "administrativo";
  estado: "activo" | "bloqueado" | "inactivo";
}

export const UserManagementPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [newUser, setNewUser] = useState({ nombreCompleto: "", correo: "", documentoIdentidad: "", password: "", rol: "" });
  const [editUser, setEditUser] = useState({ nombreCompleto: "", correo: "", documentoIdentidad: "", password: "", rol: "", estado: "ACTIVO" });

  useEffect(() => { void loadUsers(); }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await api.getUsers();
      setUsers(data);
    } catch (error: any) {
      toast.error(error.message || "Error al cargar usuarios");
    } finally { setLoading(false); }
  };

  const filteredUsers = users.filter((user) =>
    user.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.correoInstitucional.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleCreateUser = async () => {
    if (!newUser.nombreCompleto || !newUser.correo || !newUser.rol || !newUser.password || !newUser.documentoIdentidad) {
      toast.error("Por favor completa todos los campos"); return;
    }
    setSaving(true);
    try {
      await api.createUser({ ...newUser, rol: newUser.rol });
      toast.success(`Usuario ${newUser.nombreCompleto} creado exitosamente`);
      setShowCreateDialog(false);
      setNewUser({ nombreCompleto: "", correo: "", documentoIdentidad: "", password: "", rol: "" });
      await loadUsers();
    } catch (error: any) { toast.error(error.message || "Error al crear usuario"); }
    finally { setSaving(false); }
  };

  const handleOpenEdit = (user: UserRecord) => {
    setSelectedUser(user);
    setEditUser({ nombreCompleto: user.nombreCompleto, correo: user.correoInstitucional, documentoIdentidad: "", password: "", rol: user.rol.toUpperCase(), estado: user.estado.toUpperCase() === "INACTIVO" ? "INACTIVO" : "ACTIVO" });
    setShowEditDialog(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser || !editUser.nombreCompleto || !editUser.correo || !editUser.rol) { toast.error("Completa los campos obligatorios"); return; }
    if (editUser.estado === "INACTIVO") { setShowDeactivateDialog(true); return; }
    await saveUserChanges();
  };

  const saveUserChanges = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      await api.updateUser(selectedUser.id, { nombreCompleto: editUser.nombreCompleto, correo: editUser.correo, documentoIdentidad: editUser.documentoIdentidad || undefined, password: editUser.password || undefined, rol: editUser.rol as "ESTUDIANTE" | "DOCENTE" | "BIBLIOTECARIO" | "ADMINISTRATIVO" });
      await api.updateUserStatus(selectedUser.id, editUser.estado);
      toast.success(editUser.estado === "INACTIVO" ? `${selectedUser.nombreCompleto} ha sido desactivado` : "Usuario actualizado exitosamente");
      setShowEditDialog(false); setShowDeactivateDialog(false); setSelectedUser(null); await loadUsers();
    } catch (error: any) { toast.error(error.message || "Error al actualizar usuario"); }
    finally { setSaving(false); }
  };

  const getRolColor = (rol: string) => {
    switch (rol) {
      case "estudiante": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "docente": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "bibliotecario": return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
      case "administrativo": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case "activo": return "bg-green-500";
      case "bloqueado": return "bg-yellow-500";
      default: return "bg-gray-500";
    }
  };

  const formatLabel = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <TopBar onMenuToggle={() => setSidebarOpen((prev) => !prev)} />
      <main className="lg:ml-64 pt-[4.5rem] px-6 pb-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestión de Usuarios</h1>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input placeholder="Buscar usuarios..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400" />
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="bg-blue-900 hover:bg-blue-800">
            <Plus size={16} className="mr-2" />Crear Usuario
          </Button>
        </div>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent>
            {loading ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">Cargando usuarios...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="dark:border-gray-700">
                    <TableHead className="dark:text-gray-300">Nombre</TableHead>
                    <TableHead className="dark:text-gray-300">Correo Electrónico</TableHead>
                    <TableHead className="dark:text-gray-300">Rol</TableHead>
                    <TableHead className="dark:text-gray-300">Estado</TableHead>
                    <TableHead className="dark:text-gray-300">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} className="dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <TableCell className="font-medium dark:text-white">{user.nombreCompleto}</TableCell>
                      <TableCell className="dark:text-gray-400">{user.correoInstitucional}</TableCell>
                      <TableCell><Badge className={getRolColor(user.rol)}>{formatLabel(user.rol)}</Badge></TableCell>
                      <TableCell><Badge className={getStatusColor(user.estado)}>{formatLabel(user.estado)}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => handleOpenEdit(user)}><Edit size={16} /></Button>
                          <Button size="sm" variant="ghost" onClick={() => handleOpenEdit(user)}><Trash2 size={16} className="text-red-600" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl dark:bg-gray-800 dark:border-gray-700">
            <DialogHeader>
              <DialogTitle className="dark:text-white">Crear Nuevo Usuario</DialogTitle>
              <DialogDescription className="dark:text-gray-400">Agrega un nuevo usuario al sistema</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div><Label className="dark:text-gray-300">Nombre Completo</Label><Input placeholder="Ingresa el nombre completo" value={newUser.nombreCompleto} onChange={(e) => setNewUser({ ...newUser, nombreCompleto: e.target.value })} className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" /></div>
              <div><Label className="dark:text-gray-300">Documento de Identidad</Label><Input placeholder="Número de documento" value={newUser.documentoIdentidad} onChange={(e) => setNewUser({ ...newUser, documentoIdentidad: e.target.value })} className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" /></div>
              <div><Label className="dark:text-gray-300">Correo Electrónico</Label><Input type="email" placeholder="usuario@edutech.edu" value={newUser.correo} onChange={(e) => setNewUser({ ...newUser, correo: e.target.value })} className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" /></div>
              <div><Label className="dark:text-gray-300">Contraseña</Label><Input type="password" placeholder="••••••••" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" /></div>
              <div>
                <Label className="dark:text-gray-300">Rol</Label>
                <Select value={newUser.rol} onValueChange={(v) => setNewUser({ ...newUser, rol: v })}>
                  <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"><SelectValue placeholder="Selecciona un rol" /></SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:border-gray-700">{ROLE_OPTIONS.map((r) => <SelectItem key={r.value} value={r.value} className="dark:text-white dark:focus:bg-gray-700">{r.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="dark:border-gray-600 dark:text-gray-300">Cancelar</Button>
              <Button onClick={handleCreateUser} disabled={saving} className="bg-blue-900 hover:bg-blue-800">{saving ? "Creando..." : "Crear Usuario"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl dark:bg-gray-800 dark:border-gray-700">
            <DialogHeader>
              <DialogTitle className="dark:text-white">Editar Usuario</DialogTitle>
              <DialogDescription className="dark:text-gray-400">Actualiza la información y el estado del usuario</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div><Label className="dark:text-gray-300">Nombre Completo</Label><Input value={editUser.nombreCompleto} onChange={(e) => setEditUser({ ...editUser, nombreCompleto: e.target.value })} className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" /></div>
              <div><Label className="dark:text-gray-300">Documento de Identidad</Label><Input placeholder="Solo si deseas actualizarlo" value={editUser.documentoIdentidad} onChange={(e) => setEditUser({ ...editUser, documentoIdentidad: e.target.value })} className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" /></div>
              <div><Label className="dark:text-gray-300">Correo Electrónico</Label><Input type="email" value={editUser.correo} onChange={(e) => setEditUser({ ...editUser, correo: e.target.value })} className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" /></div>
              <div><Label className="dark:text-gray-300">Nueva Contraseña</Label><Input type="password" placeholder="Déjala vacía si no cambiará" value={editUser.password} onChange={(e) => setEditUser({ ...editUser, password: e.target.value })} className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" /></div>
              <div>
                <Label className="dark:text-gray-300">Rol</Label>
                <Select value={editUser.rol} onValueChange={(v) => setEditUser({ ...editUser, rol: v })}>
                  <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:border-gray-700">{ROLE_OPTIONS.map((r) => <SelectItem key={r.value} value={r.value} className="dark:text-white dark:focus:bg-gray-700">{r.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="dark:text-gray-300">Estado</Label>
                <Select value={editUser.estado} onValueChange={(v) => setEditUser({ ...editUser, estado: v })}>
                  <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:border-gray-700">{STATUS_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value} className="dark:text-white dark:focus:bg-gray-700">{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)} className="dark:border-gray-600 dark:text-gray-300">Cancelar</Button>
              <Button onClick={handleUpdateUser} disabled={saving} className="bg-blue-900 hover:bg-blue-800">{saving ? "Guardando..." : "Guardar Cambios"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
          <DialogContent className="dark:bg-gray-800 dark:border-gray-700">
            <DialogHeader>
              <DialogTitle className="dark:text-white">Confirmar Desactivación</DialogTitle>
              <DialogDescription className="dark:text-gray-400">¿Confirmas que deseas desactivar a "{selectedUser?.nombreCompleto}"?</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeactivateDialog(false)} className="dark:border-gray-600 dark:text-gray-300">Cancelar</Button>
              <Button onClick={saveUserChanges} disabled={saving} className="bg-red-600 hover:bg-red-700">{saving ? "Guardando..." : "Confirmar y Guardar"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};
