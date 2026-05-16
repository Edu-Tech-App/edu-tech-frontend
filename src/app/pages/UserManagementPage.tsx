import { useState, useEffect } from "react";
import { Sidebar } from "../components/Sidebar";
import { TopBar } from "../components/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../services/api";

export const UserManagementPage = () => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUser, setNewUser] = useState({
    nombreCompleto: '',
    correo: '',
    documentoIdentidad: '',
    password: '',
    rol: '',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");
      console.log("Token:", token);
      const data = await api.getUsers();
      setUsers(data);
    } catch (error: any) {
      console.log("Error completo:", error);
      toast.error(error.message || "Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.correoInstitucional.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateUser = async () => {
    if (!newUser.nombreCompleto || !newUser.correo || !newUser.rol || !newUser.password || !newUser.documentoIdentidad) {
      toast.error('Por favor completa todos los campos');
      return;
    }
    try {
      await api.createUser(newUser);
      toast.success(`Usuario ${newUser.nombreCompleto} creado exitosamente`);
      setShowCreateDialog(false);
      setNewUser({ nombreCompleto: '', correo: '', documentoIdentidad: '', password: '', rol: '' });
      loadUsers();
    } catch (error: any) {
      toast.error(error.message || "Error al crear usuario");
    }
  };

  const handleDeactivate = async (user: any) => {
    try {
      await api.updateUserStatus(user.id, 'inactivo');
      toast.success(`${user.nombreCompleto} ha sido desactivado`);
      loadUsers();
    } catch (error: any) {
      toast.error(error.message || "Error al desactivar usuario");
    }
  };

  const getRolColor = (rol: string) => {
    switch (rol) {
      case 'estudiante': return 'bg-blue-100 text-blue-800';
      case 'docente': return 'bg-green-100 text-green-800';
      case 'bibliotecario': return 'bg-purple-100 text-purple-800';
      case 'administrativo': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <TopBar />
      <main className="ml-64 pt-16 p-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Gestión de Usuarios</CardTitle>
              <Button onClick={() => setShowCreateDialog(true)} className="bg-blue-900 hover:bg-blue-800">
                <Plus size={16} className="mr-2" />
                Crear Usuario
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-6 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                placeholder="Buscar usuarios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

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
                        <Badge className={getRolColor(user.rol)}>{user.rol}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={user.estado === 'activo' ? 'bg-green-500' : 'bg-gray-500'}>
                          {user.estado}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {user.estado === 'activo' && (
                            <Button size="sm" variant="destructive" onClick={() => handleDeactivate(user)}>
                              Desactivar
                            </Button>
                          )}
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
          <DialogContent>
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
                    <SelectItem value="estudiante">Estudiante</SelectItem>
                    <SelectItem value="docente">Docente</SelectItem>
                    <SelectItem value="bibliotecario">Bibliotecario</SelectItem>
                    <SelectItem value="administrativo">Administrativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancelar</Button>
              <Button onClick={handleCreateUser} className="bg-blue-900 hover:bg-blue-800">Crear Usuario</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};