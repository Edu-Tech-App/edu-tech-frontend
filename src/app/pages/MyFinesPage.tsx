import { useState } from "react";
import { Sidebar } from "../components/Sidebar";
import { TopBar } from "../components/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { DollarSign, AlertCircle, CheckCircle, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";

interface Fine {
  id: string;
  bookTitle: string;
  loanDate: string;
  dueDate: string;
  returnDate: string;
  daysLate: number;
  amount: number;
  status: 'pending' | 'paid';
}

export const MyFinesPage = () => {
  const { user } = useAuth();
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedFine, setSelectedFine] = useState<Fine | null>(null);

  const [fines, setFines] = useState<Fine[]>([
    {
      id: '1',
      bookTitle: 'Introducción a los Algoritmos',
      loanDate: '2026-03-15',
      dueDate: '2026-04-14',
      returnDate: '2026-04-20',
      daysLate: 6,
      amount: 6,
      status: 'pending',
    },
    {
      id: '2',
      bookTitle: 'Cálculo: Una Variable',
      loanDate: '2026-02-10',
      dueDate: '2026-03-12',
      returnDate: '2026-03-15',
      daysLate: 3,
      amount: 3,
      status: 'paid',
    },
  ]);

  const pendingFines = fines.filter(f => f.status === 'pending');
  const paidFines = fines.filter(f => f.status === 'paid');
  const totalPending = pendingFines.reduce((sum, fine) => sum + fine.amount, 0);
  const totalPaid = paidFines.reduce((sum, fine) => sum + fine.amount, 0);

  const handlePayClick = (fine: Fine) => {
    setSelectedFine(fine);
    setShowPaymentDialog(true);
  };

  const handleConfirmPayment = () => {
    if (selectedFine) {
      setFines(fines.map(f =>
        f.id === selectedFine.id
          ? { ...f, status: 'paid' as const }
          : f
      ));
      toast.success(`Multa pagada exitosamente: $${selectedFine.amount}`);
      setShowPaymentDialog(false);
      setSelectedFine(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-red-500">Pendiente</Badge>;
      case 'paid':
        return <Badge className="bg-green-500">Pagada</Badge>;
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mis Multas</h1>
          <p className="text-gray-600">Gestiona tus multas por devoluciones tardías</p>
        </div>

        {totalPending > 0 && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-6 flex items-start gap-3">
            <AlertCircle size={24} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-red-800">Tienes multas pendientes de pago</p>
              <p className="text-sm text-red-700 mt-1">
                No podrás realizar nuevos préstamos hasta que pagues tus multas pendientes.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Pendiente</p>
                  <p className="text-3xl font-bold text-red-600">${totalPending}</p>
                  <p className="text-xs text-gray-500 mt-1">{pendingFines.length} multa{pendingFines.length !== 1 ? 's' : ''}</p>
                </div>
                <DollarSign size={40} className="text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Pagado</p>
                  <p className="text-3xl font-bold text-green-600">${totalPaid}</p>
                  <p className="text-xs text-gray-500 mt-1">{paidFines.length} multa{paidFines.length !== 1 ? 's' : ''}</p>
                </div>
                <CheckCircle size={40} className="text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Multas</p>
                  <p className="text-3xl font-bold text-blue-600">{fines.length}</p>
                  <p className="text-xs text-gray-500 mt-1">Historial completo</p>
                </div>
                <BookOpen size={40} className="text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {pendingFines.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Multas Pendientes de Pago</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingFines.map((fine) => (
                  <div
                    key={fine.id}
                    className="p-4 border border-red-200 rounded-lg bg-red-50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900 mb-1">{fine.bookTitle}</h3>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-sm">
                          <div>
                            <p className="text-gray-600">Fecha Préstamo</p>
                            <p className="font-medium">{new Date(fine.loanDate).toLocaleDateString('es-ES')}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Fecha Vencimiento</p>
                            <p className="font-medium">{new Date(fine.dueDate).toLocaleDateString('es-ES')}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Fecha Devolución</p>
                            <p className="font-medium">{new Date(fine.returnDate).toLocaleDateString('es-ES')}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Días de Retraso</p>
                            <p className="font-medium text-red-600">{fine.daysLate} día{fine.daysLate !== 1 ? 's' : ''}</p>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center gap-2">
                          <AlertCircle size={16} className="text-red-600" />
                          <p className="text-sm text-red-700">
                            Multa: $1 por día de retraso
                          </p>
                        </div>
                      </div>

                      <div className="ml-4 text-right">
                        <p className="text-2xl font-bold text-red-600 mb-2">${fine.amount}</p>
                        <Button
                          onClick={() => handlePayClick(fine)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Pagar Multa
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Historial de Multas</CardTitle>
          </CardHeader>
          <CardContent>
            {fines.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Libro</th>
                      <th className="text-left p-3">Préstamo</th>
                      <th className="text-left p-3">Vencimiento</th>
                      <th className="text-left p-3">Devolución</th>
                      <th className="text-left p-3">Días Tarde</th>
                      <th className="text-left p-3">Monto</th>
                      <th className="text-left p-3">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fines.map((fine) => (
                      <tr key={fine.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium">{fine.bookTitle}</td>
                        <td className="p-3 text-gray-600">
                          {new Date(fine.loanDate).toLocaleDateString('es-ES')}
                        </td>
                        <td className="p-3 text-gray-600">
                          {new Date(fine.dueDate).toLocaleDateString('es-ES')}
                        </td>
                        <td className="p-3 text-gray-600">
                          {new Date(fine.returnDate).toLocaleDateString('es-ES')}
                        </td>
                        <td className="p-3 text-red-600 font-medium">
                          {fine.daysLate}
                        </td>
                        <td className="p-3 font-bold text-gray-900">
                          ${fine.amount}
                        </td>
                        <td className="p-3">{getStatusBadge(fine.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <CheckCircle size={48} className="mx-auto text-gray-400 mb-3" />
                <p className="text-gray-600">No tienes multas registradas</p>
                <p className="text-sm text-gray-500 mt-1">¡Sigue devolviendo tus libros a tiempo!</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Pago de Multa</DialogTitle>
              <DialogDescription>
                Estás a punto de pagar la multa por "{selectedFine?.bookTitle}"
              </DialogDescription>
            </DialogHeader>
            {selectedFine && (
              <div className="py-4">
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <p className="text-sm font-medium text-blue-800 mb-2">Detalles de la multa:</p>
                  <div className="space-y-1 text-sm text-blue-700">
                    <p><strong>Libro:</strong> {selectedFine.bookTitle}</p>
                    <p><strong>Días de retraso:</strong> {selectedFine.daysLate} día{selectedFine.daysLate !== 1 ? 's' : ''}</p>
                    <p><strong>Monto a pagar:</strong> ${selectedFine.amount}</p>
                  </div>
                </div>
                <div className="mt-4 bg-green-50 border border-green-200 p-3 rounded-lg">
                  <p className="text-xs text-green-800">
                    Una vez pagada esta multa, podrás volver a realizar préstamos de libros.
                  </p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleConfirmPayment} className="bg-green-600 hover:bg-green-700">
                Confirmar Pago
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};
