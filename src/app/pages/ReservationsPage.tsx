import { useState } from "react";
import { Sidebar } from "../components/Sidebar";
import { TopBar } from "../components/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { toast } from "sonner";

export const ReservationsPage = () => {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<any>(null);

  const reservations = [
    { id: '1', room: 'Sala de Estudio 101', date: '25/04/2026', time: '14:00 - 16:00', status: 'Próxima', canCancel: true },
    { id: '2', room: 'Sala de Conferencias 201', date: '27/04/2026', time: '10:00 - 12:00', status: 'Próxima', canCancel: true },
    { id: '3', room: 'Sala de Estudio 102', date: '20/04/2026', time: '16:00 - 18:00', status: 'Completada', canCancel: false },
  ];

  const handleCancel = (reservation: any) => {
    if (!reservation.canCancel) {
      toast.error('No se pueden cancelar reservas con menos de 24 horas de anticipación');
      return;
    }
    setSelectedReservation(reservation);
    setShowCancelDialog(true);
  };

  const confirmCancel = () => {
    toast.success('Reserva cancelada exitosamente');
    setShowCancelDialog(false);
    setSelectedReservation(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <TopBar />
      <main className="ml-64 pt-16 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Mis Reservas</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sala</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Horario</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservations.map((reservation) => (
                  <TableRow key={reservation.id}>
                    <TableCell className="font-medium">{reservation.room}</TableCell>
                    <TableCell>{reservation.date}</TableCell>
                    <TableCell>{reservation.time}</TableCell>
                    <TableCell>
                      <Badge className={reservation.status === 'Próxima' ? 'bg-blue-500' : 'bg-gray-500'}>
                        {reservation.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {reservation.status === 'Próxima' && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleCancel(reservation)}
                        >
                          Cancelar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-800">📋 Política de Cancelación</p>
              <p className="text-sm text-blue-600 mt-1">
                Las reservas pueden cancelarse hasta 24 horas antes del horario programado.
              </p>
            </div>
          </CardContent>
        </Card>

        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancelar Reserva</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que deseas cancelar esta reserva?
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-gray-600">Sala: {selectedReservation?.room}</p>
              <p className="text-sm text-gray-600">Fecha: {selectedReservation?.date}</p>
              <p className="text-sm text-gray-600">Horario: {selectedReservation?.time}</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                Mantener Reserva
              </Button>
              <Button variant="destructive" onClick={confirmCancel}>
                Cancelar Reserva
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};
