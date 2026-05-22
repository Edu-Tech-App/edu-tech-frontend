import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { PageLayout } from "../components/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { DoorOpen, Calendar, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { api } from "../../services/api";

interface Reservation {
  id: number;
  salaId: number;
  estudianteId: number | null;
  docenteId: number | null;
  fechaReserva: string;
  horaInicio: string;
  horaFin: string;
  estado: "ACTIVA" | "COMPLETADA" | "CANCELADA";
  sala: { id: number; nombre: string; capacidad: number; ubicacion: string };
}

export const MyRoomReservationsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    const fetch = async () => {
      try {
        const data = await api.getRoomReservationsByUser(user.id);
        setReservations(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Error cargando reservas:", e);
      } finally {
        setLoading(false);
      }
    };
    void fetch();
  }, [user?.id]);

  const activeReservations = reservations.filter((r) => r.estado === "ACTIVA");
  const pastReservations = reservations.filter((r) => r.estado === "COMPLETADA" || r.estado === "CANCELADA");

  const canCancel = (r: Reservation) => {
    const dt = new Date(`${r.fechaReserva.split("T")[0]}T${r.horaInicio}`);
    return (dt.getTime() - Date.now()) / (1000 * 60 * 60) > 1;
  };

  const handleCancelClick = (r: Reservation) => {
    if (!canCancel(r)) { toast.error("Solo puedes cancelar con más de 1 hora de anticipación"); return; }
    setSelectedReservation(r);
    setShowCancelDialog(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedReservation) return;
    try {
      await api.adminCancelRoomReservation(selectedReservation.id);
      setReservations(reservations.map((r) => r.id === selectedReservation.id ? { ...r, estado: "CANCELADA" as const } : r));
      toast.success("Reserva cancelada exitosamente");
    } catch { toast.error("Error al cancelar la reserva"); }
    finally { setShowCancelDialog(false); setSelectedReservation(null); }
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case "ACTIVA": return <Badge className="bg-blue-500">Activa</Badge>;
      case "COMPLETADA": return <Badge className="bg-gray-500">Completada</Badge>;
      case "CANCELADA": return <Badge className="bg-red-500">Cancelada</Badge>;
      default: return <Badge>{estado}</Badge>;
    }
  };

  return (
    <PageLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mis Reservas de Salas</h1>
          <p className="text-gray-600">Gestiona tus reservas de salas de estudio</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Reservas Activas</p><p className="text-3xl font-bold text-blue-600">{loading ? "..." : activeReservations.length}</p></div><DoorOpen size={40} className="text-blue-600" /></div></CardContent></Card>
          <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Completadas</p><p className="text-3xl font-bold text-green-600">{loading ? "..." : reservations.filter((r) => r.estado === "COMPLETADA").length}</p></div><Calendar size={40} className="text-green-600" /></div></CardContent></Card>
          <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Canceladas</p><p className="text-3xl font-bold text-red-600">{loading ? "..." : reservations.filter((r) => r.estado === "CANCELADA").length}</p></div><AlertCircle size={40} className="text-red-600" /></div></CardContent></Card>
        </div>

        <Card className="mb-6">
          <CardHeader><CardTitle>Reservas Activas</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-gray-500 py-8">Cargando reservas...</p>
            ) : activeReservations.length === 0 ? (
              <div className="text-center py-12">
                <DoorOpen size={48} className="mx-auto text-gray-400 mb-3" />
                <p className="text-gray-600 mb-4">No tienes reservas activas</p>
                {/* ✅ Botón corregido con navigate */}
                <Button className="bg-blue-900 hover:bg-blue-800" onClick={() => navigate('/rooms')}>
                  Explorar Salas Disponibles
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {activeReservations.map((r) => (
                  <div key={r.id} className="p-4 border rounded-lg bg-white border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <DoorOpen size={20} className="text-blue-600" />
                          <h3 className="font-semibold text-lg text-gray-900">{r.sala?.nombre}</h3>
                        </div>
                        <div className="flex gap-6 mt-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar size={16} className="text-gray-400" />
                            <span className="text-gray-600">{new Date(r.fechaReserva).toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Clock size={16} className="text-gray-400" />
                            <span className="text-gray-600">{r.horaInicio} - {r.horaFin}</span>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4 flex flex-col items-end gap-2">
                        {getStatusBadge(r.estado)}
                        <Button variant="outline" size="sm" onClick={() => handleCancelClick(r)} disabled={!canCancel(r)} className="text-red-600 hover:text-red-700">Cancelar</Button>
                        {!canCancel(r) && <p className="text-xs text-gray-500">Cancelación no permitida</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Historial de Reservas</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-gray-500 py-8">Cargando historial...</p>
            ) : pastReservations.length === 0 ? (
              <p className="text-center text-gray-600 py-8">No tienes historial de reservas</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="border-b"><th className="text-left p-3">Sala</th><th className="text-left p-3">Fecha</th><th className="text-left p-3">Horario</th><th className="text-left p-3">Estado</th></tr></thead>
                  <tbody>
                    {pastReservations.map((r) => (
                      <tr key={r.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium">{r.sala?.nombre}</td>
                        <td className="p-3 text-gray-600">{new Date(r.fechaReserva).toLocaleDateString("es-ES")}</td>
                        <td className="p-3 text-gray-600">{r.horaInicio} - {r.horaFin}</td>
                        <td className="p-3">{getStatusBadge(r.estado)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Cancelación</DialogTitle>
              <DialogDescription>¿Estás seguro de que quieres cancelar la reserva de "{selectedReservation?.sala?.nombre}"?</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                <p className="text-sm text-yellow-800"><strong>Detalles:</strong></p>
                <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                  <li>Fecha: {selectedReservation && new Date(selectedReservation.fechaReserva).toLocaleDateString("es-ES")}</li>
                  <li>Horario: {selectedReservation?.horaInicio} - {selectedReservation?.horaFin}</li>
                </ul>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCancelDialog(false)}>Mantener Reserva</Button>
              <Button onClick={handleConfirmCancel} className="bg-red-600 hover:bg-red-700">Cancelar Reserva</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  );
};
