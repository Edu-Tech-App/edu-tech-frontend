import { useState } from "react";
import { Sidebar } from "../components/Sidebar";
import { TopBar } from "../components/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Search, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface Reservation {
  id: string;
  roomName: string;
  userName: string;
  userRole: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'approved' | 'active' | 'completed' | 'cancelled';
  createdAt: string;
}

export const RoomReservationsManagementPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'cancel'>('approve');
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

  const [reservations, setReservations] = useState<Reservation[]>([
    {
      id: '1',
      roomName: 'Sala A - Estudio Grupal',
      userName: 'Juan Pérez',
      userRole: 'Estudiante',
      date: '2026-04-26',
      startTime: '10:00',
      endTime: '12:00',
      status: 'pending',
      createdAt: '2026-04-25T08:30:00',
    },
    {
      id: '2',
      roomName: 'Sala C - Conferencias',
      userName: 'María González',
      userRole: 'Maestro',
      date: '2026-04-27',
      startTime: '14:00',
      endTime: '16:00',
      status: 'approved',
      createdAt: '2026-04-25T09:15:00',
    },
    {
      id: '3',
      roomName: 'Sala B - Estudio Individual',
      userName: 'Carlos Rodríguez',
      userRole: 'Estudiante',
      date: '2026-04-25',
      startTime: '09:00',
      endTime: '11:00',
      status: 'active',
      createdAt: '2026-04-24T16:20:00',
    },
    {
      id: '4',
      roomName: 'Sala E - Multimedia',
      userName: 'Ana López',
      userRole: 'Estudiante',
      date: '2026-04-20',
      startTime: '15:00',
      endTime: '17:00',
      status: 'completed',
      createdAt: '2026-04-19T10:00:00',
    },
    {
      id: '5',
      roomName: 'Sala D - Estudio Grupal',
      userName: 'Pedro Martínez',
      userRole: 'Maestro',
      date: '2026-04-28',
      startTime: '11:00',
      endTime: '13:00',
      status: 'pending',
      createdAt: '2026-04-25T10:45:00',
    },
  ]);

  const filteredReservations = reservations.filter(reservation => {
    const matchesSearch =
      reservation.roomName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.userName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || reservation.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const pendingCount = reservations.filter(r => r.status === 'pending').length;
  const approvedCount = reservations.filter(r => r.status === 'approved' || r.status === 'active').length;
  const completedCount = reservations.filter(r => r.status === 'completed').length;
  const cancelledCount = reservations.filter(r => r.status === 'cancelled').length;

  const handleActionClick = (reservation: Reservation, action: 'approve' | 'cancel') => {
    setSelectedReservation(reservation);
    setActionType(action);
    setShowActionDialog(true);
  };

  const handleConfirmAction = () => {
    if (!selectedReservation) return;

    if (actionType === 'approve') {
      setReservations(reservations.map(r =>
        r.id === selectedReservation.id
          ? { ...r, status: 'approved' as const }
          : r
      ));
      toast.success('Reserva aprobada exitosamente');
    } else {
      setReservations(reservations.map(r =>
        r.id === selectedReservation.id
          ? { ...r, status: 'cancelled' as const }
          : r
      ));
      toast.success('Reserva cancelada exitosamente');
    }

    setShowActionDialog(false);
    setSelectedReservation(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500">Pendiente</Badge>;
      case 'approved':
        return <Badge className="bg-blue-500">Aprobada</Badge>;
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <TopBar />
      <main className="ml-64 pt-16 p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Reservas de Salas</h1>
          <p className="text-gray-600">Administra todas las reservas de salas de estudio</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pendientes</p>
                  <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
                </div>
                <Clock size={40} className="text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Aprobadas/Activas</p>
                  <p className="text-3xl font-bold text-blue-600">{approvedCount}</p>
                </div>
                <CheckCircle size={40} className="text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completadas</p>
                  <p className="text-3xl font-bold text-green-600">{completedCount}</p>
                </div>
                <CheckCircle size={40} className="text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Canceladas</p>
                  <p className="text-3xl font-bold text-red-600">{cancelledCount}</p>
                </div>
                <XCircle size={40} className="text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  placeholder="Buscar por sala o usuario..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="w-full md:w-48">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos los estados</option>
                  <option value="pending">Pendientes</option>
                  <option value="approved">Aprobadas</option>
                  <option value="active">En Curso</option>
                  <option value="completed">Completadas</option>
                  <option value="cancelled">Canceladas</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Reservas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Sala</th>
                    <th className="text-left p-3">Usuario</th>
                    <th className="text-left p-3">Rol</th>
                    <th className="text-left p-3">Fecha</th>
                    <th className="text-left p-3">Horario</th>
                    <th className="text-left p-3">Estado</th>
                    <th className="text-left p-3">Solicitado</th>
                    <th className="text-right p-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReservations.map((reservation) => (
                    <tr
                      key={reservation.id}
                      className={`border-b hover:bg-gray-50 ${reservation.status === 'pending' ? 'bg-yellow-50' : ''}`}
                    >
                      <td className="p-3 font-medium">{reservation.roomName}</td>
                      <td className="p-3 text-gray-600">{reservation.userName}</td>
                      <td className="p-3 text-gray-600">{reservation.userRole}</td>
                      <td className="p-3 text-gray-600">
                        {new Date(reservation.date).toLocaleDateString('es-ES')}
                      </td>
                      <td className="p-3 text-gray-600">
                        {reservation.startTime} - {reservation.endTime}
                      </td>
                      <td className="p-3">{getStatusBadge(reservation.status)}</td>
                      <td className="p-3 text-gray-600 text-sm">
                        {new Date(reservation.createdAt).toLocaleDateString('es-ES')}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2 justify-end">
                          {reservation.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleActionClick(reservation, 'approve')}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle size={16} className="mr-1" />
                                Aprobar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleActionClick(reservation, 'cancel')}
                                className="text-red-600 hover:text-red-700"
                              >
                                <XCircle size={16} className="mr-1" />
                                Rechazar
                              </Button>
                            </>
                          )}
                          {(reservation.status === 'approved' || reservation.status === 'active') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleActionClick(reservation, 'cancel')}
                              className="text-red-600 hover:text-red-700"
                            >
                              <XCircle size={16} className="mr-1" />
                              Cancelar
                            </Button>
                          )}
                          {(reservation.status === 'completed' || reservation.status === 'cancelled') && (
                            <span className="text-sm text-gray-500 px-3">-</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredReservations.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-gray-500">
                        No se encontraron reservas
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionType === 'approve' ? 'Aprobar Reserva' : 'Cancelar Reserva'}
              </DialogTitle>
              <DialogDescription>
                {actionType === 'approve'
                  ? `¿Confirmas que quieres aprobar la reserva de "${selectedReservation?.userName}"?`
                  : `¿Estás seguro de que quieres cancelar la reserva de "${selectedReservation?.userName}"?`
                }
              </DialogDescription>
            </DialogHeader>
            {selectedReservation && (
              <div className={`py-4 ${actionType === 'approve' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border p-4 rounded-lg`}>
                <p className={`text-sm font-medium ${actionType === 'approve' ? 'text-green-800' : 'text-red-800'}`}>
                  Detalles de la reserva:
                </p>
                <ul className={`text-sm ${actionType === 'approve' ? 'text-green-700' : 'text-red-700'} mt-2 space-y-1`}>
                  <li><strong>Sala:</strong> {selectedReservation.roomName}</li>
                  <li><strong>Usuario:</strong> {selectedReservation.userName} ({selectedReservation.userRole})</li>
                  <li><strong>Fecha:</strong> {new Date(selectedReservation.date).toLocaleDateString('es-ES')}</li>
                  <li><strong>Horario:</strong> {selectedReservation.startTime} - {selectedReservation.endTime}</li>
                </ul>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowActionDialog(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmAction}
                className={actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
              >
                {actionType === 'approve' ? 'Aprobar' : 'Rechazar'} Reserva
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};
