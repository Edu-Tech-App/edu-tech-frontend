import { useEffect, useState } from "react";
import { Sidebar } from "../components/Sidebar";
import { TopBar } from "../components/TopBar";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Label } from "../components/ui/label";
import { Search, XCircle, CheckCircle, Clock, Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../services/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { formatSystemRole } from "../lib/roles";

type ReservationStatus = "ACTIVA" | "COMPLETADA" | "CANCELADA";

interface RoomOption { id: number; nombre: string; }
interface UserOption { id: number; nombreCompleto: string; rol: string; }
interface ReservationRecord {
  id: number; roomId: number; roomName: string; userId: number | null;
  userName: string; userRole: string; date: string; startTime: string;
  endTime: string; status: "active" | "completed" | "cancelled"; rawStatus: ReservationStatus;
}
interface ApiReservation {
  id: number; salaId: number; fechaReserva: string; horaInicio: string; horaFin: string; estado: ReservationStatus;
  sala?: { nombre?: string };
  estudiante?: { usuarioId?: number; user?: { id?: number; nombreCompleto?: string; rol?: string } };
  docente?: { usuarioId?: number; user?: { id?: number; nombreCompleto?: string; rol?: string } };
}

const normalizeSearchValue = (value?: string | null) =>
  (value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const formatUserRole = (role?: string) => formatSystemRole(role);

const mapReservationStatus = (status: ReservationStatus): ReservationRecord["status"] => {
  switch (status) {
    case "COMPLETADA": return "completed";
    case "CANCELADA": return "cancelled";
    default: return "active";
  }
};

const formatTime = (time?: string) => (time ? time.slice(0, 5) : "");

const STATUS_OPTIONS: { value: ReservationStatus; label: string }[] = [
  { value: "ACTIVA", label: "Activa" },
  { value: "COMPLETADA", label: "Completada" },
  { value: "CANCELADA", label: "Cancelada" },
];

export const RoomReservationsManagementPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [reservations, setReservations] = useState<ReservationRecord[]>([]);
  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingReservation, setEditingReservation] = useState<ReservationRecord | null>(null);
  const [selectedReservation, setSelectedReservation] = useState<ReservationRecord | null>(null);
  const [formData, setFormData] = useState({
    salaId: "", userId: "", fechaReserva: "", horaInicio: "", horaFin: "", estado: "ACTIVA" as ReservationStatus,
  });

  const loadPageData = async () => {
    try {
      setLoading(true);
      const [reservationsData, roomsData, usersData] = await Promise.all([
        api.getRoomReservations(), api.getStudyRooms(), api.getUsers(),
      ]);
      const mappedReservations = (reservationsData as ApiReservation[]).map((reservation) => {
        const linkedUser = reservation.estudiante?.user ?? reservation.docente?.user;
        const linkedUserId = reservation.estudiante?.usuarioId ?? reservation.docente?.usuarioId ?? linkedUser?.id ?? null;
        return {
          id: reservation.id, roomId: reservation.salaId,
          roomName: reservation.sala?.nombre || "Sala sin nombre",
          userId: linkedUserId, userName: linkedUser?.nombreCompleto || "Usuario no disponible",
          userRole: formatUserRole(linkedUser?.rol), date: reservation.fechaReserva,
          startTime: formatTime(reservation.horaInicio), endTime: formatTime(reservation.horaFin),
          status: mapReservationStatus(reservation.estado), rawStatus: reservation.estado,
        };
      });
      setReservations(mappedReservations);
      setRooms((roomsData as RoomOption[]).map((room) => ({ id: room.id, nombre: room.nombre })));
      setUsers((usersData as UserOption[]).filter((u) => u.rol === "estudiante" || u.rol === "docente")
        .map((u) => ({ id: u.id, nombreCompleto: u.nombreCompleto, rol: u.rol })));
    } catch (error: any) {
      toast.error(error.message || "No se pudieron cargar las reservas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadPageData(); }, []);

  const filteredReservations = reservations.filter((r) => {
    const matchesSearch =
      normalizeSearchValue(r.roomName).includes(normalizeSearchValue(searchTerm)) ||
      normalizeSearchValue(r.userName).includes(normalizeSearchValue(searchTerm));
    const matchesStatus = filterStatus === "all" || r.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const activeCount = reservations.filter((r) => r.status === "active").length;
  const completedCount = reservations.filter((r) => r.status === "completed").length;
  const cancelledCount = reservations.filter((r) => r.status === "cancelled").length;

  const resetForm = () => setFormData({ salaId: "", userId: "", fechaReserva: "", horaInicio: "", horaFin: "", estado: "ACTIVA" });

  const handleOpenCreateDialog = () => { setEditingReservation(null); resetForm(); setShowFormDialog(true); };

  const handleOpenEditDialog = (reservation: ReservationRecord) => {
    setEditingReservation(reservation);
    setFormData({
      salaId: String(reservation.roomId), userId: reservation.userId ? String(reservation.userId) : "",
      fechaReserva: reservation.date.slice(0, 10), horaInicio: reservation.startTime,
      horaFin: reservation.endTime, estado: reservation.rawStatus,
    });
    setShowFormDialog(true);
  };

  const handleSaveReservation = async () => {
    if (!formData.salaId || !formData.userId || !formData.fechaReserva || !formData.horaInicio || !formData.horaFin) {
      toast.error("Completa todos los campos"); return;
    }
    try {
      setSaving(true);
      const payload = {
        salaId: Number(formData.salaId), userId: Number(formData.userId),
        fechaReserva: formData.fechaReserva, horaInicio: formData.horaInicio,
        horaFin: formData.horaFin, estado: formData.estado,
      };
      if (editingReservation) {
        await api.updateRoomReservationAsAdmin(editingReservation.id, payload);
        toast.success("Reserva actualizada exitosamente");
      } else {
        await api.createRoomReservationAsAdmin(payload);
        toast.success("Reserva creada exitosamente");
      }
      setShowFormDialog(false); setEditingReservation(null); resetForm(); await loadPageData();
    } catch (error: any) {
      toast.error(error.message || "No se pudo guardar la reserva");
    } finally { setSaving(false); }
  };

  const handleConfirmCancel = async () => {
    if (!selectedReservation) return;
    try {
      setSaving(true);
      await api.adminCancelRoomReservation(selectedReservation.id);
      toast.success("Reserva cancelada exitosamente");
      setShowCancelDialog(false); setSelectedReservation(null); await loadPageData();
    } catch (error: any) {
      toast.error(error.message || "No se pudo cancelar la reserva");
    } finally { setSaving(false); }
  };

  const handleConfirmDelete = async () => {
    if (!selectedReservation) return;
    try {
      setSaving(true);
      await api.deleteRoomReservationAsAdmin(selectedReservation.id);
      toast.success("Reserva eliminada exitosamente");
      setShowDeleteDialog(false); setSelectedReservation(null); await loadPageData();
    } catch (error: any) {
      toast.error(error.message || "No se pudo eliminar la reserva");
    } finally { setSaving(false); }
  };

  const getStatusBadge = (status: ReservationRecord["status"]) => {
    switch (status) {
      case "active": return <Badge className="bg-[#6C5CE7]/80">Activa</Badge>;
      case "completed": return <Badge className="bg-green-500">Completada</Badge>;
      case "cancelled": return <Badge className="bg-red-500">Cancelada</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background transition-colors">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <TopBar onMenuToggle={() => setSidebarOpen((prev) => !prev)} />
      <main className="lg:ml-64 pt-[4.5rem]">
        <div className="page-shell">
        <div className="page-header">
          <h1 className="page-title">Gestión de Reservas de Salas</h1>
        </div>

        <div className="grid grid-cols-1 gap-6 mb-6 md:grid-cols-3">
          <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Activas</p><p className="text-3xl font-bold text-[#6C5CE7]">{activeCount}</p></div><Clock size={40} className="text-[#6C5CE7]" /></div></CardContent></Card>
          <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Completadas</p><p className="text-3xl font-bold text-green-600">{completedCount}</p></div><CheckCircle size={40} className="text-green-600" /></div></CardContent></Card>
          <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Canceladas</p><p className="text-3xl font-bold text-red-600">{cancelledCount}</p></div><XCircle size={40} className="text-red-600" /></div></CardContent></Card>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input placeholder="Buscar por sala o usuario..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
          <div className="w-48">
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]">
              <option value="all">Todos los estados</option>
              <option value="active">Activas</option>
              <option value="completed">Completadas</option>
              <option value="cancelled">Canceladas</option>
            </select>
          </div>
          <Button onClick={handleOpenCreateDialog} className="bg-[#6C5CE7] hover:bg-[#5b4bd1]">
            <Plus size={16} className="mr-2" />Crear Reserva
          </Button>
        </div>

        <Card className="mt-1 border-gray-100 bg-white/70 px-6 pb-8 dark:border-gray-700 dark:bg-gray-800">
          <div>
            {loading ? (
              <p className="py-8 text-center text-gray-500 dark:text-gray-400">Cargando reservas...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="dark:border-gray-700">
                    <TableHead className="dark:text-gray-300">Sala</TableHead>
                    <TableHead className="dark:text-gray-300">Usuario</TableHead>
                    <TableHead className="dark:text-gray-300">Rol</TableHead>
                    <TableHead className="dark:text-gray-300">Fecha</TableHead>
                    <TableHead className="dark:text-gray-300">Horario</TableHead>
                    <TableHead className="dark:text-gray-300">Estado</TableHead>
                    <TableHead className="text-right dark:text-gray-300">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReservations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-gray-500 dark:text-gray-400">
                        No se encontraron reservas
                      </TableCell>
                    </TableRow>
                  ) : filteredReservations.map((reservation) => (
                    <TableRow key={reservation.id} className="hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50">
                      <TableCell className="font-medium dark:text-white">{reservation.roomName}</TableCell>
                      <TableCell className="dark:text-gray-400">{reservation.userName}</TableCell>
                      <TableCell className="dark:text-gray-400">{reservation.userRole}</TableCell>
                      <TableCell className="dark:text-gray-400">{new Date(reservation.date).toLocaleDateString("es-ES")}</TableCell>
                      <TableCell className="dark:text-gray-400">{reservation.startTime} - {reservation.endTime}</TableCell>
                      <TableCell>{getStatusBadge(reservation.status)}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="ghost" onClick={() => handleOpenEditDialog(reservation)}><Edit size={16} /></Button>
                          {reservation.status === "active" && (
                            <Button size="sm" variant="ghost" onClick={() => { setSelectedReservation(reservation); setShowCancelDialog(true); }}>
                              <XCircle size={16} className="text-red-600" />
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => { setSelectedReservation(reservation); setShowDeleteDialog(true); }}>
                            <Trash2 size={16} className="text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </Card>

        <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingReservation ? "Editar Reserva" : "Crear Reserva"}</DialogTitle>
              <DialogDescription>{editingReservation ? "Actualiza la información de la reserva" : "Completa los datos de la nueva reserva"}</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div>
                <Label>Sala</Label>
                <Select value={formData.salaId} onValueChange={(v) => setFormData({ ...formData, salaId: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecciona una sala" /></SelectTrigger>
                  <SelectContent>{rooms.map((r) => <SelectItem key={r.id} value={String(r.id)}>{r.nombre}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Usuario</Label>
                <Select value={formData.userId} onValueChange={(v) => setFormData({ ...formData, userId: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecciona un usuario" /></SelectTrigger>
                  <SelectContent>{users.map((u) => <SelectItem key={u.id} value={String(u.id)}>{u.nombreCompleto} - {formatUserRole(u.rol)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Fecha</Label>
                <Input type="date" value={formData.fechaReserva} onChange={(e) => setFormData({ ...formData, fechaReserva: e.target.value })} />
              </div>
              <div>
                <Label>Estado</Label>
                <Select value={formData.estado} onValueChange={(v) => setFormData({ ...formData, estado: v as ReservationStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUS_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Hora Inicio</Label>
                <Input type="time" value={formData.horaInicio} onChange={(e) => setFormData({ ...formData, horaInicio: e.target.value })} />
              </div>
              <div>
                <Label>Hora Fin</Label>
                <Input type="time" value={formData.horaFin} onChange={(e) => setFormData({ ...formData, horaFin: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowFormDialog(false)}>Cancelar</Button>
              <Button onClick={handleSaveReservation} disabled={saving} className="bg-[#6C5CE7] hover:bg-[#5b4bd1]">
                {saving ? "Guardando..." : editingReservation ? "Guardar Cambios" : "Crear Reserva"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancelar Reserva</DialogTitle>
              <DialogDescription>¿Estás seguro de que quieres cancelar la reserva de "{selectedReservation?.userName}"?</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCancelDialog(false)}>Volver</Button>
              <Button onClick={handleConfirmCancel} disabled={saving} className="bg-red-600 hover:bg-red-700">{saving ? "Cancelando..." : "Cancelar Reserva"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Eliminar Reserva</DialogTitle>
              <DialogDescription>¿Estás seguro de que quieres eliminar esta reserva? Esta acción no se puede deshacer.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Volver</Button>
              <Button onClick={handleConfirmDelete} disabled={saving} className="bg-red-600 hover:bg-red-700">{saving ? "Eliminando..." : "Eliminar Reserva"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </main>
    </div>
  );
};
