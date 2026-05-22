import { useEffect, useState } from "react";
import { Sidebar } from "../components/Sidebar";
import { TopBar } from "../components/TopBar";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Label } from "../components/ui/label";
import { Edit, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../services/api";

interface RoomRecord {
  id: number;
  nombre: string;
  capacidad: number;
  ubicacion: string;
  estado: "ACTIVA" | "INACTIVA" | "MANTENIMIENTO";
}

const STATUS_OPTIONS = [
  { value: "ACTIVA", label: "Activa" },
  { value: "INACTIVA", label: "Inactiva" },
  { value: "MANTENIMIENTO", label: "Mantenimiento" },
] as const;

export const RoomsManagementPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rooms, setRooms] = useState<RoomRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingRoom, setEditingRoom] = useState<RoomRecord | null>(null);
  const [roomToDelete, setRoomToDelete] = useState<RoomRecord | null>(null);
  const [formData, setFormData] = useState({
    nombre: "", capacidad: 1, ubicacion: "", estado: "ACTIVA" as RoomRecord["estado"],
  });

  const loadRooms = async () => {
    try {
      setLoading(true);
      const data = await api.getStudyRooms();
      setRooms(data);
    } catch (error: any) {
      toast.error(error.message || "No se pudieron cargar las salas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadRooms(); }, []);

  const filteredRooms = rooms.filter((room) =>
    room.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.ubicacion.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleOpenDialog = (room?: RoomRecord) => {
    if (room) {
      setEditingRoom(room);
      setFormData({ nombre: room.nombre, capacidad: room.capacidad, ubicacion: room.ubicacion, estado: room.estado });
    } else {
      setEditingRoom(null);
      setFormData({ nombre: "", capacidad: 1, ubicacion: "", estado: "ACTIVA" });
    }
    setShowFormDialog(true);
  };

  const handleSaveRoom = async () => {
    if (!formData.nombre || !formData.ubicacion) { toast.error("Completa todos los campos"); return; }
    try {
      setSaving(true);
      const basePayload = { nombre: formData.nombre, capacidad: Number(formData.capacidad), ubicacion: formData.ubicacion };
      if (editingRoom) {
        await api.updateStudyRoom(editingRoom.id, { ...basePayload, estado: formData.estado });
        toast.success("Sala actualizada exitosamente");
      } else {
        await api.createStudyRoom(basePayload);
        toast.success("Sala creada exitosamente");
      }
      setShowFormDialog(false);
      await loadRooms();
    } catch (error: any) {
      toast.error(error.message || "No se pudo guardar la sala");
    } finally { setSaving(false); }
  };

  const handleConfirmDelete = async () => {
    if (!roomToDelete) return;
    try {
      setSaving(true);
      await api.deleteStudyRoom(roomToDelete.id);
      toast.success("Sala eliminada exitosamente");
      setShowDeleteDialog(false);
      setRoomToDelete(null);
      await loadRooms();
    } catch (error: any) {
      toast.error(error.message || "No se pudo eliminar la sala");
    } finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <TopBar onMenuToggle={() => setSidebarOpen((prev) => !prev)} />
      <main className="lg:ml-64 pt-[4.5rem] px-6 pb-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Salas</h1>
        </div>
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <Input placeholder="Buscar por nombre o ubicación..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400" />
          </div>
          <Button onClick={() => handleOpenDialog()} className="bg-blue-900 hover:bg-blue-800">
            <Plus size={16} className="mr-2" />Crear Sala
          </Button>
        </div>
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="p-3 text-left dark:text-gray-300">Nombre</th>
                    <th className="p-3 text-left dark:text-gray-300">Capacidad</th>
                    <th className="p-3 text-left dark:text-gray-300">Ubicación</th>
                    <th className="p-3 text-left dark:text-gray-300">Estado</th>
                    <th className="p-3 text-right dark:text-gray-300">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} className="p-8 text-center text-gray-500 dark:text-gray-400">Cargando salas...</td></tr>
                  ) : filteredRooms.length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center text-gray-500 dark:text-gray-400">No se encontraron salas</td></tr>
                  ) : filteredRooms.map((room) => (
                    <tr key={room.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="p-3 font-medium dark:text-white">{room.nombre}</td>
                      <td className="p-3 text-gray-600 dark:text-gray-400">{room.capacidad}</td>
                      <td className="p-3 text-gray-600 dark:text-gray-400">{room.ubicacion}</td>
                      <td className="p-3 text-gray-600 dark:text-gray-400">{STATUS_OPTIONS.find((s) => s.value === room.estado)?.label || room.estado}</td>
                      <td className="p-3">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="ghost" onClick={() => handleOpenDialog(room)}><Edit size={16} /></Button>
                          <Button size="sm" variant="ghost" onClick={() => { setRoomToDelete(room); setShowDeleteDialog(true); }}><Trash2 size={16} className="text-red-600" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
          <DialogContent className="dark:bg-gray-800 dark:border-gray-700">
            <DialogHeader>
              <DialogTitle className="dark:text-white">{editingRoom ? "Editar Sala" : "Crear Sala"}</DialogTitle>
              <DialogDescription className="dark:text-gray-400">Completa la información base de la sala.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div><Label className="dark:text-gray-300">Nombre</Label><Input value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" /></div>
              <div><Label className="dark:text-gray-300">Capacidad</Label><Input type="number" min={1} value={formData.capacidad} onChange={(e) => setFormData({ ...formData, capacidad: Number(e.target.value) || 1 })} className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" /></div>
              <div><Label className="dark:text-gray-300">Ubicación</Label><Input value={formData.ubicacion} onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })} className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" /></div>
              <div>
                <Label className="dark:text-gray-300">Estado</Label>
                <Select value={formData.estado} onValueChange={(value) => setFormData({ ...formData, estado: value as RoomRecord["estado"] })}>
                  <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:border-gray-700">{STATUS_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value} className="dark:text-white dark:focus:bg-gray-700">{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowFormDialog(false)} className="dark:border-gray-600 dark:text-gray-300">Cancelar</Button>
              <Button onClick={handleSaveRoom} disabled={saving} className="bg-blue-900 hover:bg-blue-800">{saving ? "Guardando..." : "Guardar"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="dark:bg-gray-800 dark:border-gray-700">
            <DialogHeader>
              <DialogTitle className="dark:text-white">Eliminar Sala</DialogTitle>
              <DialogDescription className="dark:text-gray-400">¿Seguro que quieres eliminar "{roomToDelete?.nombre}"?</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="dark:border-gray-600 dark:text-gray-300">Cancelar</Button>
              <Button onClick={handleConfirmDelete} disabled={saving} className="bg-red-600 hover:bg-red-700">{saving ? "Eliminando..." : "Eliminar"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};
