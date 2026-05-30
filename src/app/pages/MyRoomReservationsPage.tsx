import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Sidebar } from "../components/Sidebar";
import { TopBar } from "../components/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
      await api.cancelRoomReservation(selectedReservation.id);
      setReservations(reservations.map((r) => r.id === selectedReservation.id ? { ...r, estado: "CANCELADA" as const } : r));
      toast.success("Reserva cancelada exitosamente");
    } catch { toast.error("Error al cancelar la reserva"); }
    finally { setShowCancelDialog(false); setSelectedReservation(null); }
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case "ACTIVA": return <Badge className="bg-[#6C5CE7]/12 text-[#5b4bd1] dark:bg-[#6C5CE7]/20 dark:text-[#d9d4ff]">Activa</Badge>;
      case "COMPLETADA": return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">Completada</Badge>;
      case "CANCELADA": return <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">Cancelada</Badge>;
      default: return <Badge>{estado}</Badge>;
    }
  };

  const cardClass = "border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800";
  const sectionBg = "rounded-lg bg-gray-50 dark:bg-gray-700/50 p-3";

  return (
    <div className="h-screen overflow-hidden bg-background transition-colors">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <TopBar onMenuToggle={() => setSidebarOpen((prev) => !prev)} />
      <main className="lg:ml-64 mt-16 box-border flex h-[calc(100vh-4rem)] flex-col overflow-y-auto p-4">
        <div className="page-header">
          <h1 className="page-title">Mis Reservas</h1>
          <p className="page-subtitle">Gestiona tus horarios y revisa el historial de uso de salas.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <Card className={cardClass}><CardContent className="p-5"><div className="flex items-center justify-between"><div><p className="metric-label">Activas</p><p className="mt-2 text-3xl font-bold text-[#6C5CE7]">{loading ? "..." : activeReservations.length}</p></div><div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#6C5CE7]/14 text-[#6C5CE7]"><DoorOpen size={24} /></div></div></CardContent></Card>
          <Card className={cardClass}><CardContent className="p-5"><div className="flex items-center justify-between"><div><p className="metric-label">Completadas</p><p className="mt-2 text-3xl font-bold text-emerald-600">{loading ? "..." : reservations.filter((r) => r.estado === "COMPLETADA").length}</p></div><div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600"><Calendar size={24} /></div></div></CardContent></Card>
          <Card className={cardClass}><CardContent className="p-5"><div className="flex items-center justify-between"><div><p className="metric-label">Canceladas</p><p className="mt-2 text-3xl font-bold text-rose-600">{loading ? "..." : reservations.filter((r) => r.estado === "CANCELADA").length}</p></div><div className="flex h-12 w-12 items-center justify-center rounded-lg bg-rose-100 text-rose-600"><AlertCircle size={24} /></div></div></CardContent></Card>
        </div>

        <Card className={`${cardClass} mb-6 overflow-hidden`}>
          <CardHeader><CardTitle className="section-title px-1">Próximas Reservas</CardTitle></CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <p className="py-12 text-center text-gray-500">Cargando reservas...</p>
            ) : activeReservations.length === 0 ? (
              <div className="text-center py-12">
                <DoorOpen size={48} className="mx-auto mb-3 text-gray-300 dark:text-[#8E95B5]" />
                <p className="text-gray-600 dark:text-[#B7BDD6] mb-4">No tienes reservas activas.</p>
                <Button className="bg-[#6C5CE7] hover:bg-[#5b4bd1]" onClick={() => navigate('/rooms')}>
                  Explorar Salas Disponibles
                </Button>
              </div>
            ) : (
              <div className="space-y-0 divide-y dark:divide-gray-700">
                {activeReservations.map((r) => (
                  <div key={r.id} className="p-5 transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-700/30">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <DoorOpen size={20} className="text-[#6C5CE7]" />
                          <h3 className="text-lg font-bold text-gray-800 dark:text-white leading-tight">{r.sala?.nombre}</h3>
                        </div>
                        <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-xs font-medium uppercase tracking-wider text-gray-400">
                          <div className="flex items-center gap-2">
                            <Calendar size={14} />
                            <span>{new Date(r.fechaReserva).toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock size={14} />
                            <span>{r.horaInicio} - {r.horaFin}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {getStatusBadge(r.estado)}
                        <Button variant="outline" size="sm" onClick={() => handleCancelClick(r)} disabled={!canCancel(r)} className="text-rose-600 hover:text-rose-700 dark:border-gray-700">Cancelar</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className={`${cardClass} flex-1 overflow-hidden`}>
          <CardHeader><CardTitle className="section-title px-1">Historial de Ocupación</CardTitle></CardHeader>
          <CardContent className="h-full p-0">
            <div className="h-full overflow-auto">
              <Table className="w-full text-sm">
                <TableHeader>
                  <TableRow className="border-b border-gray-100 bg-[#EEF2FF] dark:border-gray-700 dark:bg-[#2F355F]">
                    <TableHead className="h-11 font-semibold text-gray-700 dark:text-[#E6EBFF]">Sala</TableHead>
                    <TableHead className="h-11 font-semibold text-gray-700 dark:text-[#E6EBFF]">Fecha</TableHead>
                    <TableHead className="h-11 font-semibold text-gray-700 dark:text-[#E6EBFF]">Horario</TableHead>
                    <TableHead className="h-11 font-semibold text-gray-700 dark:text-[#E6EBFF]">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="[&_tr:last-child]:border-0">
                  {loading ? (
                    <TableRow><TableCell colSpan={4} className="py-12 text-center text-gray-500">Cargando historial...</TableCell></TableRow>
                  ) : pastReservations.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="py-12 text-center text-gray-500">No hay historial de reservas.</TableCell></TableRow>
                  ) : (
                    pastReservations.map((r) => (
                      <TableRow key={r.id} className="border-b border-gray-100 transition-colors hover:bg-gray-50/80 dark:border-gray-700 dark:hover:bg-gray-700/50">
                        <TableCell className="font-medium text-gray-700 dark:text-white">{r.sala?.nombre}</TableCell>
                        <TableCell className="text-gray-600 dark:text-[#B7BDD6]">{new Date(r.fechaReserva).toLocaleDateString("es-ES")}</TableCell>
                        <TableCell className="text-gray-600 dark:text-[#B7BDD6]">{r.horaInicio} - {r.horaFin}</TableCell>
                        <TableCell>{getStatusBadge(r.estado)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogContent className="dark:bg-gray-800 dark:border-gray-700">
            <DialogHeader>
              <DialogTitle className="dark:text-[#F5F7FF]">Confirmar Cancelación</DialogTitle>
              <DialogDescription className="dark:text-[#B7BDD6]">¿Estás seguro de que quieres cancelar la reserva de "{selectedReservation?.sala?.nombre}"?</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className={`${sectionBg} border border-rose-100 dark:border-rose-900/30 bg-rose-50/30 dark:bg-rose-950/10`}>
                <p className="text-xs font-bold uppercase tracking-widest text-rose-600 mb-2">Detalles de la reserva</p>
                <ul className="space-y-1 text-sm text-gray-700 dark:text-[#F5F7FF]">
                  <li><span className="font-medium">Fecha:</span> {selectedReservation && new Date(selectedReservation.fechaReserva).toLocaleDateString("es-ES")}</li>
                  <li><span className="font-medium">Horario:</span> {selectedReservation?.horaInicio} - {selectedReservation?.horaFin}</li>
                </ul>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCancelDialog(false)} className="dark:border-gray-600">Mantener Reserva</Button>
              <Button onClick={handleConfirmCancel} className="bg-rose-600 hover:bg-rose-700 font-bold">Confirmar Cancelación</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};
