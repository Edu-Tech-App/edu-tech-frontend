import { useState, useEffect } from "react";
import { PageLayout } from "../components/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import { api } from "../../services/api";

export const FinesPage = () => {
  const [fines, setFines] = useState<any[]>([]);
  const [totalPendiente, setTotalPendiente] = useState(0);
  const [usuariosConMultas, setUsuariosConMultas] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadFines = async () => {
    try {
      setLoading(true);
      const data = await api.getAllFines();
      setFines(data.fines);
      setTotalPendiente(data.totalPendiente);
      setUsuariosConMultas(data.usuariosConMultas);
    } catch (error: any) {
      toast.error(error.message || "Error al cargar multas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadFines(); }, []);

  const handlePayFine = async (fine: any) => {
    try {
      await api.getPendingFines(fine.id);
      toast.success("Multa marcada como pagada");
      loadFines();
    } catch (error: any) {
      toast.error(error.message || "Error al procesar el pago");
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'PAGADA': return 'bg-green-500';
      case 'PENDIENTE': return 'bg-yellow-500';
      case 'ANULADA': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <PageLayout>
      <div className="p-6">
        <Card>
          <CardHeader><CardTitle>Gestión de Multas</CardTitle></CardHeader>
          <CardContent>
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">💡 <strong>Información:</strong> Las multas se calculan a $1.000 por día de retraso en la devolución de libros.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">Total de Multas Pendientes</p>
                <p className="text-2xl font-bold text-yellow-700">${totalPendiente.toLocaleString()}</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">Usuarios con Multas Pendientes</p>
                <p className="text-2xl font-bold text-blue-700">{usuariosConMultas}</p>
              </div>
            </div>
            {loading ? (
              <p className="text-center text-gray-500 py-8">Cargando multas...</p>
            ) : fines.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No hay multas registradas</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estudiante</TableHead>
                    <TableHead>Libro</TableHead>
                    <TableHead>Días de Retraso</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fines.map((fine) => (
                    <TableRow key={fine.id}>
                      <TableCell className="font-medium">{fine.prestamo?.estudiante?.user?.nombreCompleto ?? 'Sin nombre'}</TableCell>
                      <TableCell>{fine.prestamo?.libro?.titulo ?? 'Sin libro'}</TableCell>
                      <TableCell>{fine.diasRetraso} días</TableCell>
                      <TableCell className="font-bold">${Number(fine.monto).toLocaleString()}</TableCell>
                      <TableCell><Badge className={getEstadoColor(fine.estado)}>{fine.estado}</Badge></TableCell>
                      <TableCell>{fine.estado === 'PENDIENTE' && <Button size="sm" onClick={() => handlePayFine(fine)}>Marcar como Pagada</Button>}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};