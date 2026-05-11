import { useState } from "react";
import { Sidebar } from "../components/Sidebar";
import { TopBar } from "../components/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { DoorOpen, Calendar, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";

interface RoomReservation {
  id: string;
  roomName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
}

export const MyRoomReservationsPage = () => {
  const { user } = useAuth();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<RoomReservation | null>(null);

  const [reservations, setReservations] = useState<RoomReservation[]>([
    {
      id: '1',
      roomName: 'Sala A - Estudio Grupal',
      date: '2026-04-26',
      startTime: '10:00',
      endTime: '12:00',
      status: 'upcoming',
    },
    {
      id: '2',
      roomName: 'Sala C - Conferencias',
      date: '2026-04-27',
      startTime: '14:00',
      endTime: '16:00',
      status: 'upcoming',
    },
    {
      id: '3',
      roomName: 'Sala B - Estudio Individual',
      date: '2026-04-25',
      startTime: '09:00',
      endTime: '11:00',
      status: 'active',
    },
    {
      id: '4',
      roomName: 'Sala E - Multimedia',
      date: '2026-04-20',
      startTime: '15:00',
      endTime: '17:00',
      status: 'completed',
    },
  ]);

  const upcomingReservations = reservations.filter(r => r.status === 'upcoming' || r.status === 'active');
  const pastReservations = reservations.filter(r => r.status === 'completed' || r.status === 'cancelled');

  const canCancelReservation = (reservation: RoomReservation) => {
    const reservationDateTime = new Date(`${reservation.date}T${reservation.startTime}`);
    const now = new Date();
    const hoursDifference = (reservationDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursDifference > 1;
  };

  const handleCancelClick = (reservation: RoomReservation) => {
    if (!canCancelReservation(reservation)) {
      toast.error('Solo puedes cancelar con más de 1 hora de anticipación');
      return;
    }
    setSelectedReservation(reservation);
    setShowCancelDialog(true);
  };

  const handleConfirmCancel = () => {
    if (selectedReservation) {
      setReservations(reservations.map(r =>
        r.id === selectedReservation.id
          ? { ...r, status: 'cancelled' as const }
          : r
      ));
      toast.success('Reserva cancelada exitosamente');
      setShowCancelDialog(false);
      setSelectedReservation(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <Badge className="bg-blue-500">Próxima</Badge>;
      case 'active':
        return <Badge className="bg-green-500">En Curso</Badge>;
      case 'completed':
        return <Badge className="bg-gray-500">Completada</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500">Cancelada</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTimeUntilReservation = (reservation: RoomReservation) => {
    const reservationDateTime = new Date(`${reservation.date}T${reservation.startTime}`);
    const now = new Date();
    const hoursDifference = (reservationDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursDifference < 0) return null;
    if (hoursDifference < 24) {
      return `En ${Math.floor(hoursDifference)} hora${Math.floor(hoursDifference) !== 1 ? 's' : ''}`;
    }
    const days = Math.floor(hoursDifference / 24);
    return `En ${days} día${days !== 1 ? 's' : ''}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <TopBar />
      <main className="ml-64 pt-16 p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mis Reservas de Salas</h1>
          <p className="text-gray-600">Gestiona tus reservas de salas de estudio</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Reservas Activas</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {reservations.filter(r => r.status === 'upcoming' || r.status === 'active').length}
                  </p>
                </div>
                <DoorOpen size={40} className="text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completadas</p>
                  <p className="text-3xl font-bold text-green-600">
                    {reservations.filter(r => r.status === 'completed').length}
                  </p>
                </div>
                <Calendar size={40} className="text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Canceladas</p>
                  <p className="text-3xl font-bold text-red-600">
                    {reservations.filter(r => r.status === 'cancelled').length}
                  </p>
                </div>
                <AlertCircle size={40} className="text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Próximas Reservas</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingReservations.length > 0 ? (
              <div className="space-y-4">
                {upcomingReservations.map((reservation) => {
                  const timeUntil = getTimeUntilReservation(reservation);
                  const canCancel = canCancelReservation(reservation);

                  return (
                    <div
                      key={reservation.id}
                      className={`p-4 border rounded-lg ${reservation.status === 'active' ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <DoorOpen size={20} className="text-blue-600" />
                            <h3 className="font-semibold text-lg text-gray-900">{reservation.roomName}</h3>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-3">
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar size={16} className="text-gray-400" />
                              <span className="text-gray-600">
                                {new Date(reservation.date).toLocaleDateString('es-ES', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Clock size={16} className="text-gray-400" />
                              <span className="text-gray-600">
                                {reservation.startTime} - {reservation.endTime}
                              </span>
                            </div>
                            {timeUntil && (
                              <div className="flex items-center gap-2 text-sm">
                                <AlertCircle size={16} className="text-blue-400" />
                                <span className="text-blue-600 font-medium">{timeUntil}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="ml-4 flex flex-col items-end gap-2">
                          {getStatusBadge(reservation.status)}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelClick(reservation)}
                            disabled={!canCancel}
                            className="text-red-600 hover:text-red-700"
                          >
                            Cancelar
                          </Button>
                          {!canCancel && (
                            <p className="text-xs text-gray-500 text-right">
                              Cancelación no permitida
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <DoorOpen size={48} className="mx-auto text-gray-400 mb-3" />
                <p className="text-gray-600 mb-4">No tienes reservas próximas</p>
                <Button className="bg-blue-900 hover:bg-blue-800">
                  Explorar Salas Disponibles
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historial de Reservas</CardTitle>
          </CardHeader>
          <CardContent>
            {pastReservations.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Sala</th>
                      <th className="text-left p-3">Fecha</th>
                      <th className="text-left p-3">Horario</th>
                      <th className="text-left p-3">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pastReservations.map((reservation) => (
                      <tr key={reservation.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium">{reservation.roomName}</td>
                        <td className="p-3 text-gray-600">
                          {new Date(reservation.date).toLocaleDateString('es-ES')}
                        </td>
                        <td className="p-3 text-gray-600">
                          {reservation.startTime} - {reservation.endTime}
                        </td>
                        <td className="p-3">{getStatusBadge(reservation.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">No tienes historial de reservas</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Cancelación</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que quieres cancelar la reserva de "{selectedReservation?.roomName}"?
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Detalles de la reserva:</strong>
                </p>
                <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                  <li>Fecha: {selectedReservation && new Date(selectedReservation.date).toLocaleDateString('es-ES')}</li>
                  <li>Horario: {selectedReservation?.startTime} - {selectedReservation?.endTime}</li>
                </ul>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                Mantener Reserva
              </Button>
              <Button onClick={handleConfirmCancel} className="bg-red-600 hover:bg-red-700">
                Cancelar Reserva
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};
