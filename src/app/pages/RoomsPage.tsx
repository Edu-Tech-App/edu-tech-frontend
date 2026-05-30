import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "../components/Sidebar";
import { TopBar } from "../components/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Users, DoorOpen, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { api } from "../../services/api";

interface StudyRoom {
  id: number;
  nombre: string;
  capacidad: number;
  ubicacion: string;
  estado: "ACTIVA" | "INACTIVA" | "MANTENIMIENTO";
}

interface RoomReservation {
  id: number;
  salaId: number;
  fechaReserva: string;
  horaInicio: string;
  horaFin: string;
  estado: "ACTIVA" | "COMPLETADA" | "CANCELADA";
  sala?: {
    id: number;
    nombre: string;
  };
}

export const RoomsPage = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedTime, setSelectedTime] = useState("");
  const [showReservationDialog, setShowReservationDialog] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<StudyRoom | null>(null);
  const [rooms, setRooms] = useState<StudyRoom[]>([]);
  const [myReservations, setMyReservations] = useState<RoomReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    startTime: "",
    endTime: "",
  });

  useEffect(() => {
    if (!user?.id) return;

    const fetchData = async () => {
      try {
        const [roomsData, reservationsData] = await Promise.all([
          api.getStudyRooms(),
          api.getRoomReservationsByUser(user.id),
        ]);

        setRooms(Array.isArray(roomsData) ? roomsData : []);
        setMyReservations(Array.isArray(reservationsData) ? reservationsData : []);
      } catch (error) {
        console.error("Error cargando salas:", error);
        toast.error("No se pudieron cargar las salas de estudio");
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, [user?.id]);

  const getMaxDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().split("T")[0];
  };

  const hasActiveReservationForRoom = (roomId: number) =>
    myReservations.some((reservation) => reservation.salaId === roomId && reservation.estado === "ACTIVA");

  const handleReserveClick = (room: StudyRoom) => {
    if (room.estado !== "ACTIVA") {
      toast.error("Esta sala no está disponible");
      return;
    }

    if (hasActiveReservationForRoom(room.id)) {
      toast.error("Ya tienes una reserva activa para esta sala");
      return;
    }

    setSelectedRoom(room);
    setFormData({ date: selectedDate, startTime: "", endTime: "" });
    setShowReservationDialog(true);
  };

  const handleConfirmReservation = async () => {
    if (!user?.id || !selectedRoom) return;

    if (!formData.date || !formData.startTime || !formData.endTime) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    if (formData.endTime <= formData.startTime) {
      toast.error("La hora de fin debe ser mayor que la hora de inicio");
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    if (formData.date < today || formData.date > getMaxDate()) {
      toast.error("Solo puedes reservar con hasta 7 días de anticipación");
      return;
    }

    if (formData.startTime < "08:00" || formData.endTime > "20:00") {
      toast.error("El horario permitido es de 8:00 AM a 8:00 PM");
      return;
    }

    try {
      setSaving(true);

      const reservation = await api.createRoomReservation({
        salaId: selectedRoom.id,
        userId: user.id,
        isEstudiante: user.rol === "estudiante",
        fechaReserva: formData.date,
        horaInicio: formData.startTime,
        horaFin: formData.endTime,
      });

      setMyReservations((current) => [
        {
          ...reservation,
          sala: reservation.sala ?? { id: selectedRoom.id, nombre: selectedRoom.nombre },
        },
        ...current,
      ]);

      toast.success(`Reserva creada para ${selectedRoom.nombre}`);
      setShowReservationDialog(false);
      setSelectedRoom(null);
    } catch (error) {
      console.error("Error creando reserva:", error);
      toast.error(error instanceof Error ? error.message : "No se pudo crear la reserva");
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: StudyRoom["estado"]) => {
    switch (status) {
      case "ACTIVA":
        return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">Disponible</Badge>;
      case "MANTENIMIENTO":
        return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">Mantenimiento</Badge>;
      case "INACTIVA":
        return <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">Inactiva</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const filteredRooms = useMemo(() => {
    const normalizedTime = selectedTime.trim();

    return rooms.filter((room) => {
      if (room.estado !== "ACTIVA") return !normalizedTime;
      if (!normalizedTime) return true;
      return !hasActiveReservationForRoom(room.id);
    });
  }, [rooms, selectedTime, myReservations]);

  const cardClass = "border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800";
  const sectionBg = "rounded-lg bg-gray-50 dark:bg-gray-700/50 p-3";

  return (
    <div className="h-screen overflow-hidden bg-background transition-colors">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <TopBar onMenuToggle={() => setSidebarOpen((prev) => !prev)} />
      <main className="lg:ml-64 mt-16 box-border flex h-[calc(100vh-4rem)] flex-col overflow-y-auto p-4">
        <div className="page-header">
          <h1 className="page-title">Salas de Estudio</h1>
          <p className="page-subtitle">Reserva salas para estudio individual o grupal según disponibilidad real del sistema.</p>
        </div>

        <Card className={`${cardClass} mb-6`}>
          <CardHeader>
            <CardTitle className="section-title">Filtrar Disponibilidad</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-[#F5F7FF]">Fecha de reserva</label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  max={getMaxDate()}
                  className="dark:bg-gray-700 dark:border-gray-600"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-[#8E95B5]">Reservas permitidas hasta 7 días de anticipación</p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-[#F5F7FF]">Hora de inicio (Opcional)</label>
                <Input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  min="08:00"
                  max="20:00"
                  className="dark:bg-gray-700 dark:border-gray-600"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-[#8E95B5]">Horario operativo: 8:00 AM - 8:00 PM</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className={`${sectionBg} py-12 text-center`}>
            <DoorOpen size={48} className="mx-auto mb-3 text-gray-300 dark:text-[#8E95B5]" />
            <p className="text-gray-600 dark:text-[#B7BDD6]">Cargando salas disponibles...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredRooms.map((room) => (
              <Card
                key={room.id}
                className={`${cardClass} transition-all hover:shadow-md ${
                  room.estado === "ACTIVA" ? "border-emerald-200 dark:border-emerald-900/40" : ""
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6C5CE7]/14 text-[#6C5CE7]">
                        <DoorOpen size={20} />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold dark:text-white">{room.nombre}</CardTitle>
                        <p className="mt-1 text-xs text-gray-500 dark:text-[#8E95B5]">{room.ubicacion}</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-[#B7BDD6]">
                    <Users size={16} />
                    <span>Capacidad: {room.capacidad} personas</span>
                  </div>
                  <div className="flex items-center justify-between border-t pt-3 dark:border-gray-700">
                    {getStatusBadge(room.estado)}
                    <Button
                      size="sm"
                      onClick={() => handleReserveClick(room)}
                      disabled={room.estado !== "ACTIVA" || hasActiveReservationForRoom(room.id)}
                      className="bg-[#6C5CE7] hover:bg-[#5b4bd1]"
                    >
                      {hasActiveReservationForRoom(room.id) ? "Ya reservada" : "Reservar"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && filteredRooms.length === 0 && (
          <div className={`${sectionBg} py-12 text-center`}>
            <DoorOpen size={48} className="mx-auto mb-3 text-gray-300 dark:text-[#8E95B5]" />
            <p className="text-gray-600 dark:text-[#B7BDD6]">No hay salas disponibles para los criterios seleccionados</p>
          </div>
        )}

        <Dialog open={showReservationDialog} onOpenChange={setShowReservationDialog}>
          <DialogContent className="dark:bg-gray-800 dark:border-gray-700">
            <DialogHeader>
              <DialogTitle className="dark:text-[#F5F7FF]">Reservar {selectedRoom?.nombre}</DialogTitle>
              <DialogDescription className="dark:text-[#B7BDD6]">
                Completa los datos para confirmar tu reserva.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-[#F5F7FF]">Fecha</label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  min={new Date().toISOString().split("T")[0]}
                  max={getMaxDate()}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-[#F5F7FF]">Hora Inicio</label>
                  <Input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    min="08:00"
                    max="20:00"
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-[#F5F7FF]">Hora Fin</label>
                  <Input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    min="08:00"
                    max="20:00"
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
              <div className="rounded-xl border border-[#6C5CE7]/20 bg-[#6C5CE7]/8 p-3 dark:border-gray-700 dark:bg-gray-700/50">
                <div className="mb-2 flex items-center gap-2 text-[#5b4bd1] dark:text-[#C9C3E8]">
                  <Calendar size={14} />
                  <span className="text-xs font-bold uppercase tracking-wide">Políticas de reserva</span>
                </div>
                <ul className="ml-5 list-disc space-y-1 text-xs text-[#6C5CE7] dark:text-[#B7BDD6]">
                  <li>Horario permitido: 8:00 AM - 8:00 PM</li>
                  <li>Reservas hasta con 7 días de antelación</li>
                  <li>Cancelaciones permitidas hasta 1 hora antes del inicio</li>
                </ul>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowReservationDialog(false)} className="dark:border-gray-600">
                Cancelar
              </Button>
              <Button onClick={handleConfirmReservation} disabled={saving} className="bg-[#6C5CE7] hover:bg-[#5b4bd1]">
                {saving ? "Guardando..." : "Confirmar Reserva"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};
