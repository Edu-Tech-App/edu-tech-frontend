import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Sidebar } from "../components/Sidebar";
import { TopBar } from "../components/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Label } from "../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { CalendarDays, Edit, MapPin, Plus, Search, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../services/api";

interface RoomRecord {
  id: number;
  nombre: string;
  capacidad: number;
  ubicacion: string;
  estado: "ACTIVA" | "INACTIVA";
}

interface ReservationRecord {
  id: number;
  salaId: number;
  fechaReserva: string;
  horaInicio: string;
  horaFin: string;
  estado: "ACTIVA" | "COMPLETADA" | "CANCELADA";
  sala?: { nombre?: string };
  estudiante?: { user?: { nombreCompleto: string } };
  docente?: { user?: { nombreCompleto: string } };
}

const STATUS_OPTIONS = [
  { value: "ACTIVA", label: "Activa" },
  { value: "INACTIVA", label: "Inactiva" },
] as const;

const formatDate = (value?: string) => {
  if (!value) return "Sin fecha";
  return new Date(value).toLocaleDateString("es-ES");
};

const getRoomStatusClass = (estado: RoomRecord["estado"]) => {
  return estado === "ACTIVA"
    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
    : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200";
};

const getReservationStatusClass = (estado: ReservationRecord["estado"]) => {
  if (estado === "ACTIVA") return "bg-[#6C5CE7]/12 text-[#5b4bd1] dark:bg-[#6C5CE7]/20 dark:text-[#d9d4ff]";
  if (estado === "COMPLETADA") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
  return "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300";
};

export const RoomsManagementPage = () => {
  const { user: authUser } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rooms, setRooms] = useState<RoomRecord[]>([]);
  const [reservations, setReservations] = useState<ReservationRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [tab, setTab] = useState("salas");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [editingRoom, setEditingRoom] = useState<RoomRecord | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<RoomRecord | null>(null);
  const [roomToDelete, setRoomToDelete] = useState<RoomRecord | null>(null);
  const [formData, setFormData] = useState({
    nombre: "",
    capacidad: 1,
    ubicacion: "",
    estado: "ACTIVA" as RoomRecord["estado"],
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [roomsData, reservationsData] = await Promise.all([
          api.getStudyRooms(),
          api.getRoomReservations().catch(() => []),
        ]);

        setRooms(roomsData);
        setReservations(reservationsData);
      } catch (error: any) {
        toast.error(error.message || "No se pudieron cargar las salas");
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

  const filteredRooms = useMemo(() => {
    return rooms.filter((room) =>
      room.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.ubicacion.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [rooms, searchTerm]);

  const filteredReservations = useMemo(() => {
    return reservations.filter((reservation) => {
      const roomName = reservation.sala?.nombre || "";
      const userName = reservation.estudiante?.user?.nombreCompleto || reservation.docente?.user?.nombreCompleto || "";
      return (
        roomName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        userName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [reservations, searchTerm]);

  const metrics = useMemo(() => {
    const activeRooms = rooms.filter((room) => room.estado === "ACTIVA").length;
    const inactiveRooms = rooms.filter((room) => room.estado === "INACTIVA").length;
    const activeReservations = reservations.filter((reservation) => reservation.estado === "ACTIVA").length;

    return [
      { label: "Total de salas", value: rooms.length },
      { label: "Habilitadas", value: activeRooms },
      { label: "Deshabilitadas", value: inactiveRooms },
      { label: "Reservas activas", value: activeReservations },
    ];
  }, [reservations, rooms]);

  const getRoomReservations = (roomId: number) =>
    reservations
      .filter((reservation) => reservation.salaId === roomId)
      .sort((left, right) => new Date(right.fechaReserva).getTime() - new Date(left.fechaReserva).getTime());

  const openDialog = (room?: RoomRecord) => {
    if (room) {
      setEditingRoom(room);
      setFormData({
        nombre: room.nombre,
        capacidad: room.capacidad,
        ubicacion: room.ubicacion,
        estado: room.estado,
      });
    } else {
      setEditingRoom(null);
      setFormData({
        nombre: "",
        capacidad: 1,
        ubicacion: "",
        estado: "ACTIVA",
      });
    }
    setShowFormDialog(true);
  };

  const handleSaveRoom = async () => {
    if (!formData.nombre || !formData.ubicacion) {
      toast.error("Completa todos los campos obligatorios");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        nombre: formData.nombre,
        capacidad: Number(formData.capacidad),
        ubicacion: formData.ubicacion,
      };

      if (editingRoom) {
        await api.updateStudyRoom(editingRoom.id, { ...payload, estado: formData.estado });
        toast.success("Sala actualizada exitosamente");
      } else {
        await api.createStudyRoom(payload);
        toast.success("Sala creada exitosamente");
      }

      setShowFormDialog(false);

      const [roomsData, reservationsData] = await Promise.all([
        api.getStudyRooms(),
        api.getRoomReservations().catch(() => reservations),
      ]);
      setRooms(roomsData);
      setReservations(reservationsData);
    } catch (error: any) {
      toast.error(error.message || "No se pudo guardar la sala");
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!roomToDelete) return;

    try {
      setSaving(true);
      await api.deleteStudyRoom(roomToDelete.id);
      toast.success("Sala eliminada exitosamente");
      setShowDeleteDialog(false);

      const [roomsData, reservationsData] = await Promise.all([
        api.getStudyRooms(),
        api.getRoomReservations().catch(() => reservations),
      ]);
      setRooms(roomsData);
      setReservations(reservationsData);
      setRoomToDelete(null);
    } catch (error: any) {
      toast.error(error.message || "No se pudo eliminar la sala");
    } finally {
      setSaving(false);
    }
  };

  const openDetailDialog = (room: RoomRecord) => {
    setSelectedRoom(room);
    setShowDetailDialog(true);
  };

  return (
    <div className="h-screen overflow-hidden bg-background transition-colors">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <TopBar onMenuToggle={() => setSidebarOpen((prev) => !prev)} />
      <main className="lg:ml-64 mt-16 box-border flex h-[calc(100vh-4rem)] flex-col overflow-hidden p-4">
        <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
          {metrics.map((item) => (
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
              placeholder="Buscar por nombre o ubicación"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 dark:bg-transparent dark:text-white dark:placeholder-gray-400"
            />
          </div>
          <Button onClick={() => openDialog()} className="h-10 shrink-0 bg-[#6C5CE7] hover:bg-[#5b4bd1]">
            <Plus size={16} className="mr-2" />Crear sala
          </Button>
        </div>

        <Card className="mt-2 flex min-h-0 flex-1 gap-0 overflow-hidden border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden p-0 last:pb-0 [&:last-child]:pb-0">
            {loading ? (
              <div className="flex flex-1 items-center justify-center px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                Cargando salas...
              </div>
            ) : (
              <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col">
                <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                  <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1 lg:grid-cols-4 dark:bg-gray-900/60">
                    <TabsTrigger value="salas">Lista de Salas</TabsTrigger>
                    <TabsTrigger value="ocupacion">Ocupación / Reservas</TabsTrigger>
                  </TabsList>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto">
                  <TabsContent value="salas" className="mt-0">
                    <div className="min-h-0 overflow-auto">
                      <table className="w-full min-w-[760px] table-fixed text-sm">
                        <colgroup>
                          <col className="w-[30%]" />
                          <col className="w-[15%]" />
                          <col className="w-[25%]" />
                          <col className="w-[15%]" />
                          <col className="w-[15%]" />
                        </colgroup>
                        <thead className="[&_tr]:border-b [&_tr]:border-gray-100 [&_tr]:bg-[#EEF2FF] dark:[&_tr]:border-gray-700 dark:[&_tr]:bg-[#2F355F]">
                          <tr>
                            <th className="sticky top-0 z-10 h-11 bg-[#EEF2FF] px-4 text-left align-middle text-sm font-semibold text-gray-700 dark:bg-[#2F355F] dark:text-[#E6EBFF]">Nombre</th>
                            <th className="sticky top-0 z-10 h-11 bg-[#EEF2FF] px-4 text-left align-middle text-sm font-semibold text-gray-700 dark:bg-[#2F355F] dark:text-[#E6EBFF]">Capacidad</th>
                            <th className="sticky top-0 z-10 h-11 bg-[#EEF2FF] px-4 text-left align-middle text-sm font-semibold text-gray-700 dark:bg-[#2F355F] dark:text-[#E6EBFF]">Ubicación</th>
                            <th className="sticky top-0 z-10 h-11 bg-[#EEF2FF] px-4 text-left align-middle text-sm font-semibold text-gray-700 dark:bg-[#2F355F] dark:text-[#E6EBFF]">Estado</th>
                            <th className="sticky top-0 z-10 h-11 bg-[#EEF2FF] px-4 text-right align-middle text-sm font-semibold text-gray-700 dark:bg-[#2F355F] dark:text-[#E6EBFF]">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                          {filteredRooms.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                                No se encontraron salas.
                              </td>
                            </tr>
                          ) : (
                            filteredRooms.map((room) => (
                              <tr key={room.id} className="border-b border-gray-100 transition-colors hover:bg-gray-50/80 dark:border-gray-700 dark:hover:bg-gray-700/50">
                                <td className="px-4 py-3 align-middle lg:py-2">
                                  <p className="truncate font-medium text-gray-700 dark:text-white">{room.nombre}</p>
                                </td>
                                <td className="px-4 py-3 align-middle text-gray-700 dark:text-gray-400 lg:py-2">{room.capacidad} pers.</td>
                                <td className="px-4 py-3 align-middle text-gray-700 dark:text-gray-400 lg:py-2">{room.ubicacion}</td>
                                <td className="px-4 py-3 align-middle lg:py-2">
                                  <Badge className={getRoomStatusClass(room.estado)}>
                                    {STATUS_OPTIONS.find((status) => status.value === room.estado)?.label || room.estado}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3 align-middle lg:py-2">
                                  <div className="flex justify-end gap-1">
                                    <Button size="sm" variant="ghost" onClick={() => openDetailDialog(room)} title="Ver detalle">
                                      <CalendarDays size={16} />
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => openDialog(room)} title="Editar sala">
                                      <Edit size={16} />
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => { setRoomToDelete(room); setShowDeleteDialog(true); }} title="Eliminar sala">
                                      <Trash2 size={16} className="text-rose-600" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </TabsContent>

                  <TabsContent value="ocupacion" className="mt-0 space-y-3 p-4">
                    {filteredReservations.length === 0 ? (
                      <p className="text-gray-500 dark:text-gray-400">No hay reservas registradas.</p>
                    ) : (
                      filteredReservations.map((reservation) => (
                        <div key={reservation.id} className="rounded-lg bg-gray-50 p-3.5 dark:bg-gray-700/50">
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                              <p className="font-medium text-gray-700 dark:text-white">{reservation.sala?.nombre || `Sala ${reservation.salaId}`}</p>
                              <p className="text-sm text-gray-500 dark:text-[#B7BDD6]">
                                {reservation.estudiante?.user?.nombreCompleto || reservation.docente?.user?.nombreCompleto || "Usuario"} · {formatDate(reservation.fechaReserva)} · {reservation.horaInicio} - {reservation.horaFin}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge className={getReservationStatusClass(reservation.estado)}>{reservation.estado}</Badge>
                              {authUser?.rol === 'supervisor' && (
                                <div className="flex gap-1">
                                  <Button size="sm" variant="ghost" title="Reprogramar (Solo Supervisor)" onClick={() => {/* TODO: Conectar lógica de edición si existe */}}>
                                    <Edit size={14} />
                                  </Button>
                                  <Button size="sm" variant="ghost" title="Cancelar (Solo Supervisor)" className="text-rose-600">
                                    <Trash2 size={14} />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </TabsContent>
                </div>
              </Tabs>
            )}
          </CardContent>
        </Card>

        <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
          <DialogContent className="max-w-2xl dark:border-gray-700 dark:bg-gray-800">
            <DialogHeader>
              <DialogTitle className="dark:text-white">{editingRoom ? "Editar sala" : "Crear sala"}</DialogTitle>
              <DialogDescription className="dark:text-gray-400">
                Configura los datos básicos y el estado operativo de la sala.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label className="dark:text-gray-300">Nombre de la sala</Label>
                <Input value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} className="dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <Label className="dark:text-gray-300">Capacidad máxima</Label>
                  <Input
                    type="number"
                    min={1}
                    value={formData.capacidad}
                    onChange={(e) => setFormData({ ...formData, capacidad: Number(e.target.value) || 1 })}
                    className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <Label className="dark:text-gray-300">Estado operativo</Label>
                  <Select value={formData.estado} onValueChange={(value) => setFormData({ ...formData, estado: value as RoomRecord["estado"] })}>
                    <SelectTrigger className="dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="dark:border-gray-700 dark:bg-gray-800">
                      {STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status.value} value={status.value} className="dark:text-white dark:focus:bg-gray-700">
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="dark:text-gray-300">Ubicación física</Label>
                <Input value={formData.ubicacion} onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })} className="dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowFormDialog(false)} className="dark:border-gray-600 dark:text-gray-300">
                Cancelar
              </Button>
              <Button onClick={handleSaveRoom} disabled={saving} className="bg-[#6C5CE7] hover:bg-[#5b4bd1]">
                {saving ? "Guardando..." : "Guardar sala"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="dark:border-gray-700 dark:bg-gray-800">
            <DialogHeader>
              <DialogTitle className="dark:text-white">Eliminar sala</DialogTitle>
              <DialogDescription className="dark:text-gray-400">
                ¿Seguro que quieres eliminar "{roomToDelete?.nombre}"? Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="dark:border-gray-600 dark:text-gray-300">
                Cancelar
              </Button>
              <Button onClick={handleConfirmDelete} disabled={saving} className="bg-rose-600 hover:bg-rose-700">
                {saving ? "Eliminando..." : "Eliminar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-h-[88vh] w-[95vw] max-w-4xl overflow-hidden p-0 dark:border-gray-700 dark:bg-gray-800">
            <DialogHeader className="border-b border-gray-200 px-5 py-4 text-left dark:border-gray-700">
              <DialogTitle className="text-xl dark:text-white">{selectedRoom?.nombre}</DialogTitle>
              <DialogDescription className="dark:text-gray-400">
                Resumen de capacidad, ubicación e historial de ocupación.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 overflow-y-auto px-5 py-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <Card className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900/40">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-[#B7BDD6]">Capacidad</p>
                        <p className="mt-1.5 text-2xl font-bold text-gray-800 dark:text-[#F5F7FF]">{selectedRoom?.capacidad ?? "-"}</p>
                      </div>
                      <div className="mt-0.5 shrink-0 rounded-xl bg-[#6C5CE7]/12 p-2.5 text-[#5b4bd1] dark:bg-[#6C5CE7]/20 dark:text-[#d9d4ff]">
                        <Users size={16} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900/40">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-[#B7BDD6]">Ubicación</p>
                        <p className="mt-1.5 text-base font-bold text-gray-800 dark:text-[#F5F7FF]">{selectedRoom?.ubicacion ?? "-"}</p>
                      </div>
                      <div className="mt-0.5 shrink-0 rounded-xl bg-[#6C5CE7]/12 p-2.5 text-[#5b4bd1] dark:bg-[#6C5CE7]/20 dark:text-[#d9d4ff]">
                        <MapPin size={16} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900/40">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-[#B7BDD6]">Estado</p>
                        <div className="mt-2">
                          {selectedRoom && <Badge className={getRoomStatusClass(selectedRoom.estado)}>{STATUS_OPTIONS.find((status) => status.value === selectedRoom.estado)?.label || selectedRoom.estado}</Badge>}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900/40">
                <CardHeader><CardTitle className="text-base dark:text-white">Calendario de ocupación</CardTitle></CardHeader>
                <CardContent className="space-y-2.5">
                  {!selectedRoom || getRoomReservations(selectedRoom.id).length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No hay reservas registradas para esta sala.</p>
                  ) : (
                    getRoomReservations(selectedRoom.id).map((reservation) => (
                      <div key={reservation.id} className="rounded-lg bg-gray-50 p-3.5 dark:bg-gray-700/50">
                        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                          <div>
                            <p className="font-medium text-gray-700 dark:text-white">{formatDate(reservation.fechaReserva)} · {reservation.horaInicio} - {reservation.horaFin}</p>
                            <p className="text-sm text-gray-500 dark:text-[#B7BDD6]">
                              {reservation.estudiante?.user?.nombreCompleto || reservation.docente?.user?.nombreCompleto || "Usuario"}
                            </p>
                          </div>
                          <Badge className={getReservationStatusClass(reservation.estado)}>{reservation.estado}</Badge>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};
