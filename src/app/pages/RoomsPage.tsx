import { useState } from "react";
import { PageLayout } from "../components/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Users, DoorOpen } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";

interface Room { id: string; name: string; capacity: number; equipment: string[]; status: 'available' | 'occupied' | 'maintenance'; }
interface Reservation { id: string; roomId: string; roomName: string; date: string; startTime: string; endTime: string; }

export const RoomsPage = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState('');
  const [showReservationDialog, setShowReservationDialog] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState({ date: new Date().toISOString().split('T')[0], startTime: '', endTime: '' });

  const rooms: Room[] = [
    { id: '1', name: 'Sala A - Estudio Grupal', capacity: 8, equipment: ['Proyector', 'Pizarra', 'WiFi'], status: 'available' },
    { id: '2', name: 'Sala B - Estudio Individual', capacity: 4, equipment: ['WiFi', 'Escritorios'], status: 'available' },
    { id: '3', name: 'Sala C - Conferencias', capacity: 20, equipment: ['Proyector', 'Sistema de Audio', 'Pantalla Grande', 'WiFi'], status: 'available' },
    { id: '4', name: 'Sala D - Estudio Grupal', capacity: 6, equipment: ['Pizarra', 'WiFi'], status: 'occupied' },
    { id: '5', name: 'Sala E - Multimedia', capacity: 10, equipment: ['Computadoras', 'Proyector', 'WiFi'], status: 'available' },
  ];

  const [existingReservations] = useState<Reservation[]>([{ id: '1', roomId: '4', roomName: 'Sala D - Estudio Grupal', date: new Date().toISOString().split('T')[0], startTime: '10:00', endTime: '12:00' }]);

  const getMaxDate = () => { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().split('T')[0]; };

  const isRoomAvailable = (roomId: string, date: string, startTime: string, endTime: string) => {
    const roomReservations = existingReservations.filter(r => r.roomId === roomId && r.date === date);
    for (const reservation of roomReservations) {
      if ((startTime >= reservation.startTime && startTime < reservation.endTime) || (endTime > reservation.startTime && endTime <= reservation.endTime) || (startTime <= reservation.startTime && endTime >= reservation.endTime)) return false;
    }
    return true;
  };

  const handleReserveClick = (room: Room) => {
    if (room.status !== 'available') { toast.error('Esta sala no está disponible'); return; }
    setSelectedRoom(room);
    setFormData({ date: selectedDate, startTime: '', endTime: '' });
    setShowReservationDialog(true);
  };

  const handleConfirmReservation = () => {
    if (!formData.date || !formData.startTime || !formData.endTime) { toast.error('Por favor completa todos los campos'); return; }
    if (formData.endTime <= formData.startTime) { toast.error('La hora de fin debe ser mayor que la hora de inicio'); return; }
    const today = new Date().toISOString().split('T')[0];
    if (formData.date < today || formData.date > getMaxDate()) { toast.error('Solo puedes reservar con hasta 7 días de anticipación'); return; }
    if (formData.startTime < '08:00' || formData.endTime > '20:00') { toast.error('El horario permitido es de 8:00 AM a 8:00 PM'); return; }
    if (!selectedRoom || !isRoomAvailable(selectedRoom.id, formData.date, formData.startTime, formData.endTime)) { toast.error('La sala no está disponible en el horario seleccionado'); return; }
    toast.success(`Reserva creada para ${selectedRoom.name}`);
    setShowReservationDialog(false);
    setSelectedRoom(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available': return <Badge className="bg-green-500">Disponible</Badge>;
      case 'occupied': return <Badge className="bg-red-500">Ocupada</Badge>;
      case 'maintenance': return <Badge className="bg-yellow-500">Mantenimiento</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const filteredRooms = selectedTime
    ? rooms.filter(room => {
        if (room.status !== 'available') return false;
        const endTime = selectedTime.split(':').map(n => parseInt(n));
        endTime[0] += 1;
        return isRoomAvailable(room.id, selectedDate, selectedTime, `${endTime[0].toString().padStart(2, '0')}:${endTime[1].toString().padStart(2, '0')}`);
      })
    : rooms;

  return (
    <PageLayout>
      <div className="page-shell">
        <div className="page-header">
          <h1 className="page-title">Salas de Estudio</h1>
          <p className="page-subtitle">Reserva salas para estudio individual o grupal</p>
        </div>

        <Card className="mb-6 dark:border-gray-700 dark:bg-gray-800">
          <CardHeader><CardTitle className="section-title">Filtrar Disponibilidad</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-[#F5F7FF]">Fecha</label>
                <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} min={new Date().toISOString().split('T')[0]} max={getMaxDate()} />
                <p className="mt-1 text-xs text-gray-500 dark:text-[#8E95B5]">Reservas permitidas hasta 7 días de anticipación</p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-[#F5F7FF]">Hora (Opcional)</label>
                <Input type="time" value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)} min="08:00" max="20:00" />
                <p className="mt-1 text-xs text-gray-500 dark:text-[#8E95B5]">Horario: 8:00 AM - 8:00 PM</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map((room) => (
            <Card
              key={room.id}
              className={`dark:border-gray-700 dark:bg-gray-800 ${
                room.status === 'available' ? 'border-green-200 dark:border-green-900/40' : ''
              }`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#6C5CE7]/14 rounded-lg flex items-center justify-center"><DoorOpen size={24} className="text-[#6C5CE7]" /></div>
                    <CardTitle className="text-lg dark:text-[#F5F7FF]">{room.name}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-[#B7BDD6]"><Users size={16} /><span>Capacidad: {room.capacity} personas</span></div>
                <div>
                  <p className="mb-2 text-sm font-medium text-gray-700 dark:text-[#F5F7FF]">Equipamiento:</p>
                  <div className="flex flex-wrap gap-2">
                    {room.equipment.map((item, index) => <Badge key={index} variant="outline" className="text-xs dark:border-gray-700 dark:bg-gray-700/50 dark:text-[#C9C3E8]">{item}</Badge>)}
                  </div>
                </div>
                <div className="border-t pt-2 dark:border-gray-700">{getStatusBadge(room.status)}</div>
                <Button onClick={() => handleReserveClick(room)} disabled={room.status !== 'available'} className="w-full bg-[#6C5CE7] hover:bg-[#5b4bd1]">Reservar Sala</Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredRooms.length === 0 && (
          <Card className="dark:border-gray-700 dark:bg-gray-800"><CardContent className="p-12 text-center"><DoorOpen size={48} className="mx-auto mb-3 text-gray-400 dark:text-[#8E95B5]" /><p className="text-gray-600 dark:text-[#B7BDD6]">No hay salas disponibles para los criterios seleccionados</p></CardContent></Card>
        )}

        <Dialog open={showReservationDialog} onOpenChange={setShowReservationDialog}>
          <DialogContent>
            <DialogHeader><DialogTitle className="dark:text-[#F5F7FF]">Reservar {selectedRoom?.name}</DialogTitle><DialogDescription className="dark:text-[#B7BDD6]">Completa los datos para tu reserva</DialogDescription></DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-[#F5F7FF]">Fecha *</label>
                <Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} min={new Date().toISOString().split('T')[0]} max={getMaxDate()} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="mb-2 block text-sm font-medium text-gray-700 dark:text-[#F5F7FF]">Hora Inicio *</label><Input type="time" value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} min="08:00" max="20:00" /></div>
                <div><label className="mb-2 block text-sm font-medium text-gray-700 dark:text-[#F5F7FF]">Hora Fin *</label><Input type="time" value={formData.endTime} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} min="08:00" max="20:00" /></div>
              </div>
              <div className="rounded-lg border border-[#6C5CE7]/20 bg-[#6C5CE7]/8 p-3 dark:border-gray-700 dark:bg-gray-700/50">
                <p className="text-xs text-[#5b4bd1] dark:text-[#C9C3E8]"><strong>Reglas de reserva:</strong></p>
                <ul className="ml-4 mt-1 list-disc space-y-1 text-xs text-[#6C5CE7] dark:text-[#B7BDD6]">
                  <li>Horario permitido: 8:00 AM - 8:00 PM</li>
                  <li>Reservas hasta 7 días de anticipación</li>
                  <li>La hora de fin debe ser mayor que la de inicio</li>
                  <li>Cancelación permitida solo 1 hora antes del inicio</li>
                </ul>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowReservationDialog(false)}>Cancelar</Button>
              <Button onClick={handleConfirmReservation} className="bg-[#6C5CE7] hover:bg-[#5b4bd1]">Confirmar Reserva</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  );
};
