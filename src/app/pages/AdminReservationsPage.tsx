import { PageLayout } from "../components/PageLayout";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { DoorOpen, Library, Clock, CheckCircle, XCircle } from "lucide-react";
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { api } from "../../services/api";

interface SummaryReservation {
  estado?: string;
}

export const AdminReservationsPage = () => {
  const navigate = useNavigate();
  const [activeCount, setActiveCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [cancelledCount, setCancelledCount] = useState(0);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const [roomReservations, bookReservations] = await Promise.all([
          api.getRoomReservations(),
          api.getLoans(),
        ]);
        const allStatuses = [...(roomReservations as SummaryReservation[]), ...(bookReservations as SummaryReservation[])].map((item) => item.estado);
        setActiveCount(allStatuses.filter((s) => s === "ACTIVA" || s === "ACTIVO").length);
        setCompletedCount(allStatuses.filter((s) => s === "COMPLETADA" || s === "DEVUELTO").length);
        setCancelledCount(allStatuses.filter((s) => s === "CANCELADA" || s === "PERDIDO" || s === "VENCIDO").length);
      } catch {
        setActiveCount(0); setCompletedCount(0); setCancelledCount(0);
      }
    };
    void loadSummary();
  }, []);

  return (
    <PageLayout>
      <div className="px-6 pb-6 pt-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Reservas</h1>
        </div>

        <div className="grid grid-cols-1 gap-6 mb-6 md:grid-cols-3">
          <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Activas</p><p className="text-3xl font-bold text-blue-600">{activeCount}</p></div><Clock size={40} className="text-blue-600" /></div></CardContent></Card>
          <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Completadas</p><p className="text-3xl font-bold text-green-600">{completedCount}</p></div><CheckCircle size={40} className="text-green-600" /></div></CardContent></Card>
          <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Canceladas</p><p className="text-3xl font-bold text-red-600">{cancelledCount}</p></div><XCircle size={40} className="text-red-600" /></div></CardContent></Card>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card>
            <CardContent className="p-6">
              <div className="mb-4 flex items-center gap-3">
                <DoorOpen className="text-blue-700" />
                <h2 className="text-xl font-semibold text-gray-900">Reservas de Sala</h2>
              </div>
              <p className="mb-6 text-gray-600">CRUD completo para reservas de salas de estudio.</p>
              <Button onClick={() => navigate("/reservations/rooms")} className="bg-blue-900 hover:bg-blue-800">Ir a Reservas de Sala</Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="mb-4 flex items-center gap-3">
                <Library className="text-blue-700" />
                <h2 className="text-xl font-semibold text-gray-900">Reservas de Libro</h2>
              </div>
              <p className="mb-6 text-gray-600">CRUD completo para préstamos o reservas de libros.</p>
              <Button onClick={() => navigate("/reservations/books")} className="bg-blue-900 hover:bg-blue-800">Ir a Reservas de Libro</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
};
