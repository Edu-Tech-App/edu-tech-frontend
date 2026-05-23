import { useState } from "react";
import { PageLayout } from "../components/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Calendar } from "../components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { toast } from "sonner";

export const RoomReservationPage = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [room, setRoom] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const rooms = [
    { id: 'R101', name: 'Sala de Estudio 101', capacity: 4 },
    { id: 'R102', name: 'Sala de Estudio 102', capacity: 6 },
    { id: 'R201', name: 'Sala de Conferencias 201', capacity: 10 },
  ];

  const timeSlots = ['08:00 - 10:00', '10:00 - 12:00', '12:00 - 14:00', '14:00 - 16:00', '16:00 - 18:00', '18:00 - 20:00'];

  const handleReserve = () => {
    if (!room || !timeSlot || !date) { toast.error('Por favor selecciona una sala, horario y fecha'); return; }
    setShowConfirmDialog(true);
  };

  const confirmReservation = () => {
    toast.success('¡Sala reservada exitosamente!');
    setShowConfirmDialog(false);
    setRoom('');
    setTimeSlot('');
  };

  return (
    <PageLayout>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Reservar Sala de Estudio</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-[#6C5CE7]/8 border border-[#6C5CE7]/20 rounded-lg mb-4">
                <p className="text-sm text-[#5b4bd1]">💡 Selecciona la fecha, sala y horario para hacer tu reserva.</p>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Selecciona la Fecha</label>
                <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md border" disabled={(date) => date < new Date()} />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Selecciona la Sala</label>
                <Select value={room} onValueChange={setRoom}>
                  <SelectTrigger><SelectValue placeholder="Elige una sala" /></SelectTrigger>
                  <SelectContent>{rooms.map((r) => <SelectItem key={r.id} value={r.id}>{r.name} (Capacidad: {r.capacity} personas)</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Selecciona el Horario</label>
                <Select value={timeSlot} onValueChange={setTimeSlot}>
                  <SelectTrigger><SelectValue placeholder="Elige un horario" /></SelectTrigger>
                  <SelectContent>{timeSlots.map((slot) => <SelectItem key={slot} value={slot}>{slot}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button onClick={handleReserve} className="w-full bg-[#6C5CE7] hover:bg-[#5b4bd1]">Reservar Sala</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Mis Reservas</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { room: 'Sala de Estudio 101', date: '25/04/2026', time: '14:00 - 16:00' },
                  { room: 'Sala de Conferencias 201', date: '27/04/2026', time: '10:00 - 12:00' },
                ].map((reservation, idx) => (
                  <div key={idx} className="p-4 bg-[#6C5CE7]/8 border border-[#6C5CE7]/20 rounded-lg">
                    <p className="font-medium text-gray-800">{reservation.room}</p>
                    <p className="text-sm text-gray-600">{reservation.date} · {reservation.time}</p>
                    <Button size="sm" variant="destructive" className="mt-2">Cancelar Reserva</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Reserva</DialogTitle>
              <DialogDescription>Por favor confirma los detalles de tu reserva</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-2">
              <p className="text-sm"><span className="font-medium">Sala:</span> {rooms.find(r => r.id === room)?.name}</p>
              <p className="text-sm"><span className="font-medium">Fecha:</span> {date?.toLocaleDateString('es-ES')}</p>
              <p className="text-sm"><span className="font-medium">Horario:</span> {timeSlot}</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>Cancelar</Button>
              <Button onClick={confirmReservation} className="bg-[#6C5CE7] hover:bg-[#5b4bd1]">Confirmar Reserva</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  );
};