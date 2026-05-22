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
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Salas de Estudio</h1>
          <p className="text-gray-600">Reserva salas para estudio individual o grupal</p>
        </div>

        <Card className="mb-6">
          <CardHeader><CardTitle>Filtrar Disponibilidad</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Fecha</label>
                <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} min={new Date().toISOString().split('T')[0]} max={getMaxDate()} />
                <p className="text-xs text-gray-500 mt-1">Reservas permitidas hasta 7 días de anticipación</p>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Hora (Opcional)</label>
                <Input type="time" value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)} min="08:00" max="20:00" />
                <p className="text-xs text-gray-500 mt-1">Horario: 8:00 AM - 8:00 PM</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map((room) => (
            <Card key={room.id} className={room.status === 'available' ? 'border-green-200' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center"><DoorOpen size={24} className="text-blue-600" /></div>
                    <CardTitle className="text-lg">{room.name}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-gray-600"><Users size={16} /><span>Capacidad: {room.capacity} personas</span></div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Equipamiento:</p>
                  <div className="flex flex-wrap gap-2">{room.equipment.map((item, index) => <Badge key={index} variant="outline" className="text-xs">{item}</Badge>)}</div>
                </div>
                <div className="pt-2 border-t">{getStatusBadge(room.status)}</div>
                <Button onClick={() => handleReserveClick(room)} disabled={room.status !== 'available'} className="w-full bg-blue-900 hover:bg-blue-800">Reservar Sala</Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredRooms.length === 0 && (
          <Card><CardContent className="p-12 text-center"><DoorOpen size={48} className="mx-auto text-gray-400 mb-3" /><p className="text-gray-600">No hay salas disponibles para los criterios seleccionados</p></CardContent></Card>
        )}

        <Dialog open={showReservationDialog} onOpenChange={setShowReservationDialog}>
          <DialogContent>
            <DialogHeader><DialogTitle>Reservar {selectedRoom?.name}</DialogTitle><DialogDescription>Completa los datos para tu reserva</DialogDescription></DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Fecha *</label>
                <Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} min={new Date().toISOString().split('T')[0]} max={getMaxDate()} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-medium mb-2 block">Hora Inicio *</label><Input type="time" value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} min="08:00" max="20:00" /></div>
                <div><label className="text-sm font-medium mb-2 block">Hora Fin *</label><Input type="time" value={formData.endTime} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} min="08:00" max="20:00" /></div>
              </div>
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                <p className="text-xs text-blue-800"><strong>Reglas de reserva:</strong></p>
                <ul className="text-xs text-blue-700 mt-1 space-y-1 ml-4 list-disc">
                  <li>Horario permitido: 8:00 AM - 8:00 PM</li>
                  <li>Reservas hasta 7 días de anticipación</li>
                  <li>La hora de fin debe ser mayor que la de inicio</li>
                  <li>Cancelación permitida solo 1 hora antes del inicio</li>
                </ul>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowReservationDialog(false)}>Cancelar</Button>
              <Button onClick={handleConfirmReservation} className="bg-blue-900 hover:bg-blue-800">Confirmar Reserva</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  );
};