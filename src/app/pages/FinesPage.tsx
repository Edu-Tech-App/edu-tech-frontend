import { Sidebar } from "../components/Sidebar";
import { TopBar } from "../components/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";

export const FinesPage = () => {
  const fines = [
    { id: '1', user: 'Carlos Ruiz', userId: 'E003', book: 'Patrones de Diseño', amount: 15000, daysOverdue: 15, status: 'Pendiente' },
    { id: '2', user: 'Laura Martínez', userId: 'E004', book: 'El Programador Pragmático', amount: 8000, daysOverdue: 8, status: 'Pendiente' },
    { id: '3', user: 'Diego Fernández', userId: 'E005', book: 'Arquitectura Limpia', amount: 22000, daysOverdue: 22, status: 'Pagada' },
  ];

  const totalPending = fines.filter(f => f.status === 'Pendiente').reduce((sum, f) => sum + f.amount, 0);
  const totalPaid = 230000;
  const usersWithFines = 23;

  const handlePayFine = (fine: any) => {
    toast.success(`Multa de $${fine.amount.toLocaleString()} marcada como pagada para ${fine.user}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <TopBar />
      <main className="ml-64 pt-16 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Gestión de Multas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 <strong>Información:</strong> Las multas se calculan a $1.000 por día de retraso en la devolución de libros.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">Total de Multas Pendientes</p>
                <p className="text-2xl font-bold text-yellow-700">${totalPending.toLocaleString()}</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">Total Pagado Este Mes</p>
                <p className="text-2xl font-bold text-green-700">${totalPaid.toLocaleString()}</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">Usuarios con Multas Pendientes</p>
                <p className="text-2xl font-bold text-blue-700">{usersWithFines}</p>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estudiante</TableHead>
                  <TableHead>ID Estudiante</TableHead>
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
                    <TableCell className="font-medium">{fine.user}</TableCell>
                    <TableCell>{fine.userId}</TableCell>
                    <TableCell>{fine.book}</TableCell>
                    <TableCell>{fine.daysOverdue} días</TableCell>
                    <TableCell className="font-bold">${fine.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className={fine.status === 'Pagada' ? 'bg-green-500' : 'bg-yellow-500'}>
                        {fine.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {fine.status === 'Pendiente' && (
                        <Button size="sm" onClick={() => handlePayFine(fine)}>
                          Marcar como Pagada
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};
