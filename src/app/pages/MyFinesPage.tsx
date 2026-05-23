import { useEffect, useState } from "react";
import { PageLayout } from "../components/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { DollarSign, AlertCircle, CheckCircle, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { api } from "../../services/api";

interface Fine {
  id: number;
  monto: number;
  diasRetraso: number;
  estado: "PENDIENTE" | "PAGADA" | "ANULADA";
  prestamo: {
    id: number;
    fechaPrestamo: string;
    fechaLimiteDevolucion: string;
    fechaDevolucionReal: string | null;
    libro: { titulo: string };
  };
}

export const MyFinesPage = () => {
  const { user } = useAuth();
  const [fines, setFines] = useState<Fine[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedFine, setSelectedFine] = useState<Fine | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    const fetchFines = async () => {
      try {
        const data = await api.getPendingFines(user.id);
        setFines(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Error cargando multas:", e);
      } finally {
        setLoading(false);
      }
    };
    void fetchFines();
  }, [user?.id]);

  const pendingFines = fines.filter((f) => f.estado === "PENDIENTE");
  const paidFines = fines.filter((f) => f.estado === "PAGADA");
  const totalPending = pendingFines.reduce((sum, f) => sum + Number(f.monto), 0);
  const totalPaid = paidFines.reduce((sum, f) => sum + Number(f.monto), 0);

  const handlePayClick = (fine: Fine) => {
    setSelectedFine(fine);
    setShowPaymentDialog(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedFine) return;
    setPaying(true);
    try {
      await api.payFine(selectedFine.id);
      setFines(fines.map((f) => f.id === selectedFine.id ? { ...f, estado: "PAGADA" as const } : f));
      toast.success(`Multa pagada exitosamente: $${selectedFine.monto}`);
      setShowPaymentDialog(false);
      setSelectedFine(null);
    } catch (error: any) {
      toast.error(error.message || "Error al procesar el pago");
    } finally {
      setPaying(false);
    }
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case "PENDIENTE": return <Badge className="bg-red-500">Pendiente</Badge>;
      case "PAGADA": return <Badge className="bg-green-500">Pagada</Badge>;
      case "ANULADA": return <Badge className="bg-gray-500">Anulada</Badge>;
      default: return <Badge>{estado}</Badge>;
    }
  };

  return (
    <PageLayout>
      <div className="page-shell">
        <div className="page-header">
          <h1 className="page-title">Mis Multas</h1>
          <p className="page-subtitle">Gestiona tus multas por devoluciones tardías</p>
        </div>

        {!loading && pendingFines.length > 0 && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/40 dark:bg-red-950/20">
            <AlertCircle size={24} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-800 dark:text-red-200">Tienes multas pendientes de pago</p>
              <p className="mt-1 text-sm text-red-700 dark:text-red-100/85">No podrás realizar nuevos préstamos hasta que pagues tus multas pendientes.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="dark:border-gray-700 dark:bg-gray-800"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600 dark:text-[#B7BDD6]">Total Pendiente</p><p className="text-3xl font-bold text-red-600">{loading ? "..." : `$${totalPending}`}</p><p className="mt-1 text-xs text-gray-500 dark:text-[#8E95B5]">{pendingFines.length} multa{pendingFines.length !== 1 ? "s" : ""}</p></div><DollarSign size={40} className="text-red-600" /></div></CardContent></Card>
          <Card className="dark:border-gray-700 dark:bg-gray-800"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600 dark:text-[#B7BDD6]">Total Pagado</p><p className="text-3xl font-bold text-green-600">{loading ? "..." : `$${totalPaid}`}</p><p className="mt-1 text-xs text-gray-500 dark:text-[#8E95B5]">{paidFines.length} multa{paidFines.length !== 1 ? "s" : ""}</p></div><CheckCircle size={40} className="text-green-600" /></div></CardContent></Card>
          <Card className="dark:border-gray-700 dark:bg-gray-800"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600 dark:text-[#B7BDD6]">Total Multas</p><p className="text-3xl font-bold text-[#6C5CE7]">{loading ? "..." : fines.length}</p><p className="mt-1 text-xs text-gray-500 dark:text-[#8E95B5]">Historial completo</p></div><BookOpen size={40} className="text-[#6C5CE7]" /></div></CardContent></Card>
        </div>

        {!loading && pendingFines.length > 0 && (
          <Card className="mb-6 dark:border-gray-700 dark:bg-gray-800">
            <CardHeader><CardTitle className="section-title">Multas Pendientes de Pago</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingFines.map((fine) => (
                  <div key={fine.id} className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/40 dark:bg-red-950/20">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="mb-1 text-lg font-semibold text-gray-900 dark:text-[#F5F7FF]">{fine.prestamo?.libro?.titulo}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-sm">
                          <div><p className="text-gray-600 dark:text-[#B7BDD6]">Fecha Préstamo</p><p className="font-medium text-gray-900 dark:text-[#F5F7FF]">{new Date(fine.prestamo?.fechaPrestamo).toLocaleDateString("es-ES")}</p></div>
                          <div><p className="text-gray-600 dark:text-[#B7BDD6]">Fecha Vencimiento</p><p className="font-medium text-gray-900 dark:text-[#F5F7FF]">{new Date(fine.prestamo?.fechaLimiteDevolucion).toLocaleDateString("es-ES")}</p></div>
                          <div><p className="text-gray-600 dark:text-[#B7BDD6]">Fecha Devolución</p><p className="font-medium text-gray-900 dark:text-[#F5F7FF]">{fine.prestamo?.fechaDevolucionReal ? new Date(fine.prestamo.fechaDevolucionReal).toLocaleDateString("es-ES") : "-"}</p></div>
                          <div><p className="text-gray-600 dark:text-[#B7BDD6]">Días de Retraso</p><p className="font-medium text-red-600 dark:text-red-300">{fine.diasRetraso} día{fine.diasRetraso !== 1 ? "s" : ""}</p></div>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <AlertCircle size={16} className="text-red-600" />
                          <p className="text-sm text-red-700 dark:text-red-100/85">Multa: $1 por día de retraso</p>
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <p className="text-2xl font-bold text-red-600 mb-2">${fine.monto}</p>
                        <Button onClick={() => handlePayClick(fine)} className="bg-green-600 hover:bg-green-700">Pagar Multa</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-gray-100 bg-white/70 px-6 pb-8 dark:border-gray-700 dark:bg-gray-800/40">
          <CardHeader><CardTitle className="section-title">Historial de Multas</CardTitle></CardHeader>
          <div>
            {loading ? (
              <p className="py-8 text-center text-gray-500 dark:text-[#8E95B5]">Cargando multas...</p>
            ) : fines.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle size={48} className="mx-auto mb-3 text-gray-400 dark:text-[#8E95B5]" />
                <p className="text-gray-600 dark:text-[#B7BDD6]">No tienes multas registradas</p>
                <p className="mt-1 text-sm text-gray-500 dark:text-[#8E95B5]">¡Sigue devolviendo tus libros a tiempo!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b dark:border-gray-700">
                      <th className="p-3 text-left text-gray-700 dark:text-[#F5F7FF]">Libro</th>
                      <th className="p-3 text-left text-gray-700 dark:text-[#F5F7FF]">Préstamo</th>
                      <th className="p-3 text-left text-gray-700 dark:text-[#F5F7FF]">Vencimiento</th>
                      <th className="p-3 text-left text-gray-700 dark:text-[#F5F7FF]">Devolución</th>
                      <th className="p-3 text-left text-gray-700 dark:text-[#F5F7FF]">Días Tarde</th>
                      <th className="p-3 text-left text-gray-700 dark:text-[#F5F7FF]">Monto</th>
                      <th className="p-3 text-left text-gray-700 dark:text-[#F5F7FF]">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fines.map((fine) => (
                      <tr key={fine.id} className="border-b hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50">
                        <td className="p-3 font-medium text-gray-900 dark:text-[#F5F7FF]">{fine.prestamo?.libro?.titulo}</td>
                        <td className="p-3 text-gray-600 dark:text-[#B7BDD6]">{new Date(fine.prestamo?.fechaPrestamo).toLocaleDateString("es-ES")}</td>
                        <td className="p-3 text-gray-600 dark:text-[#B7BDD6]">{new Date(fine.prestamo?.fechaLimiteDevolucion).toLocaleDateString("es-ES")}</td>
                        <td className="p-3 text-gray-600 dark:text-[#B7BDD6]">{fine.prestamo?.fechaDevolucionReal ? new Date(fine.prestamo.fechaDevolucionReal).toLocaleDateString("es-ES") : "-"}</td>
                        <td className="p-3 font-medium text-red-600 dark:text-red-300">{fine.diasRetraso}</td>
                        <td className="p-3 font-bold text-gray-900 dark:text-[#F5F7FF]">${fine.monto}</td>
                        <td className="p-3">{getStatusBadge(fine.estado)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>

        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="dark:text-[#F5F7FF]">Confirmar Pago de Multa</DialogTitle>
              <DialogDescription className="dark:text-[#B7BDD6]">Estás a punto de pagar la multa por "{selectedFine?.prestamo?.libro?.titulo}"</DialogDescription>
            </DialogHeader>
            {selectedFine && (
              <div className="py-4">
                <div className="rounded-lg border border-[#6C5CE7]/20 bg-[#6C5CE7]/8 p-4 dark:border-gray-700 dark:bg-gray-700/50">
                  <p className="mb-2 text-sm font-medium text-[#5b4bd1] dark:text-[#C9C3E8]">Detalles de la multa:</p>
                  <div className="space-y-1 text-sm text-[#6C5CE7] dark:text-[#B7BDD6]">
                    <p><strong>Libro:</strong> {selectedFine.prestamo?.libro?.titulo}</p>
                    <p><strong>Días de retraso:</strong> {selectedFine.diasRetraso} día{selectedFine.diasRetraso !== 1 ? "s" : ""}</p>
                    <p><strong>Monto a pagar:</strong> ${selectedFine.monto}</p>
                  </div>
                </div>
                <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900/40 dark:bg-green-950/20">
                  <p className="text-xs text-green-800 dark:text-green-100/85">Una vez pagada esta multa, podrás volver a realizar préstamos de libros.</p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>Cancelar</Button>
              <Button onClick={handleConfirmPayment} disabled={paying} className="bg-green-600 hover:bg-green-700">
                {paying ? "Procesando..." : "Confirmar Pago"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  );
};
