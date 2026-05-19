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
  id: number;
  nombreCompleto: string;
  correoInstitucional: string;
  rol: "estudiante" | "docente" | "bibliotecario" | "administrativo";
  estado: "activo" | "bloqueado" | "inactivo";
}

export const UserManagementPage = () => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [newUser, setNewUser] = useState({
    nombreCompleto: "",
    correo: "",
    documentoIdentidad: "",
    password: "",
    rol: "",
  });
  const [editUser, setEditUser] = useState({
    nombreCompleto: "",
    correo: "",
    documentoIdentidad: "",
    password: "",
    rol: "",
    estado: "ACTIVO",
  });

  useEffect(() => {
    void loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await api.getUsers();
      setUsers(data);
    } catch (error: any) {
      toast.error(error.message || "Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) =>
    user.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.correoInstitucional.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleCreateUser = async () => {
    if (!newUser.nombreCompleto || !newUser.correo || !newUser.rol || !newUser.password || !newUser.documentoIdentidad) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    setSaving(true);
    try {
      await api.createUser({
        ...newUser,
        rol: newUser.rol,
      });
      toast.success(`Usuario ${newUser.nombreCompleto} creado exitosamente`);
      setShowCreateDialog(false);
      setNewUser({
        nombreCompleto: "",
        correo: "",
        documentoIdentidad: "",
        password: "",
        rol: "",
      });
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
      rol: user.rol.toUpperCase(),
      estado: user.estado.toUpperCase() === "INACTIVO" ? "INACTIVO" : "ACTIVO",
    });
    setShowEditDialog(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser || !editUser.nombreCompleto || !editUser.correo || !editUser.rol) {
      toast.error("Completa los campos obligatorios");
      return;
    }

    if (editUser.estado === "INACTIVO") {
      setShowDeactivateDialog(true);
      return;
    }

    await saveUserChanges();
  };

  const handleConfirmDeactivate = async () => {
    await saveUserChanges();
  };

  const saveUserChanges = async () => {
    if (!selectedUser) {
      return;
    }

    setSaving(true);
    try {
      await api.updateUser(selectedUser.id, {
        nombreCompleto: editUser.nombreCompleto,
        correo: editUser.correo,
        documentoIdentidad: editUser.documentoIdentidad || undefined,
        password: editUser.password || undefined,
        rol: editUser.rol as "ESTUDIANTE" | "DOCENTE" | "BIBLIOTECARIO" | "ADMINISTRATIVO",
      });

      await api.updateUserStatus(selectedUser.id, editUser.estado);

      toast.success(
        editUser.estado === "INACTIVO"
          ? `${selectedUser.nombreCompleto} ha sido desactivado`
          : "Usuario actualizado exitosamente",
      );

      setShowEditDialog(false);
      setShowDeactivateDialog(false);
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
      case "estudiante":
        return "bg-blue-100 text-blue-800";
      case "docente":
        return "bg-green-100 text-green-800";
      case "bibliotecario":
        return "bg-purple-100 text-purple-800";
      case "administrativo":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case "activo":
        return "bg-green-500";
      case "bloqueado":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const formatLabel = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <TopBar />
      <main className="ml-64 pt-[4.5rem] px-6 pb-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              placeholder="Buscar usuarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="bg-blue-900 hover:bg-blue-800">
            <Plus size={16} className="mr-2" />
            Crear Usuario
          </Button>
        </div>

        <Card>
          <CardContent>
            {loading ? (
              <p className="text-center text-gray-500 py-8">Cargando usuarios...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Correo Electrónico</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.nombreCompleto}</TableCell>
                      <TableCell>{user.correoInstitucional}</TableCell>
                      <TableCell>
                        <Badge className={getRolColor(user.rol)}>{formatLabel(user.rol)}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(user.estado)}>
                          {formatLabel(user.estado)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => handleOpenEdit(user)}>
                            <Edit size={16} />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleOpenEdit(user)}>
                            <Trash2 size={16} className="text-red-600" />
                          </Button>
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
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Usuario</DialogTitle>
              <DialogDescription>Agrega un nuevo usuario al sistema</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div>
                <Label>Nombre Completo</Label>
                <Input
                  placeholder="Ingresa el nombre completo"
                  value={newUser.nombreCompleto}
                  onChange={(e) => setNewUser({ ...newUser, nombreCompleto: e.target.value })}
                />
              </div>
              <div>
                <Label>Documento de Identidad</Label>
                <Input
                  placeholder="Número de documento"
                  value={newUser.documentoIdentidad}
                  onChange={(e) => setNewUser({ ...newUser, documentoIdentidad: e.target.value })}
                />
              </div>
              <div>
                <Label>Correo Electrónico</Label>
                <Input
                  type="email"
                  placeholder="usuario@edutech.edu"
                  value={newUser.correo}
                  onChange={(e) => setNewUser({ ...newUser, correo: e.target.value })}
                />
              </div>
              <div>
                <Label>Contraseña</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                />
              </div>
              <div>
                <Label>Rol</Label>
                <Select value={newUser.rol} onValueChange={(value) => setNewUser({ ...newUser, rol: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancelar</Button>
              <Button onClick={handleCreateUser} disabled={saving} className="bg-blue-900 hover:bg-blue-800">
                {saving ? "Creando..." : "Crear Usuario"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Usuario</DialogTitle>
              <DialogDescription>Actualiza la información y el estado del usuario</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div>
                <Label>Nombre Completo</Label>
                <Input
                  value={editUser.nombreCompleto}
                  onChange={(e) => setEditUser({ ...editUser, nombreCompleto: e.target.value })}
                />
              </div>
              <div>
                <Label>Documento de Identidad</Label>
                <Input
                  placeholder="Solo si deseas actualizarlo"
                  value={editUser.documentoIdentidad}
                  onChange={(e) => setEditUser({ ...editUser, documentoIdentidad: e.target.value })}
                />
              </div>
              <div>
                <Label>Correo Electrónico</Label>
                <Input
                  type="email"
                  value={editUser.correo}
                  onChange={(e) => setEditUser({ ...editUser, correo: e.target.value })}
                />
              </div>
              <div>
                <Label>Nueva Contraseña</Label>
                <Input
                  type="password"
                  placeholder="Déjala vacía si no cambiará"
                  value={editUser.password}
                  onChange={(e) => setEditUser({ ...editUser, password: e.target.value })}
                />
              </div>
              <div>
                <Label>Rol</Label>
                <Select value={editUser.rol} onValueChange={(value) => setEditUser({ ...editUser, rol: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Estado</Label>
                <Select value={editUser.estado} onValueChange={(value) => setEditUser({ ...editUser, estado: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancelar</Button>
              <Button onClick={handleUpdateUser} disabled={saving} className="bg-blue-900 hover:bg-blue-800">
                {saving ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Desactivación</DialogTitle>
              <DialogDescription>
                ¿Confirmas que deseas desactivar a "{selectedUser?.nombreCompleto}" al guardar los cambios?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeactivateDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleConfirmDeactivate} disabled={saving} className="bg-red-600 hover:bg-red-700">
                {saving ? "Guardando..." : "Confirmar y Guardar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};
