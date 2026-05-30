import { useEffect, useState } from "react";
import { Sidebar } from "../components/Sidebar";
import { TopBar } from "../components/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
      case "PENDIENTE": return <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">Pendiente</Badge>;
      case "PAGADA": return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">Pagada</Badge>;
      case "ANULADA": return <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200">Anulada</Badge>;
      default: return <Badge>{estado}</Badge>;
    }
  };

  const cardClass = "border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800";
  const sectionBg = "rounded-lg bg-gray-50 dark:bg-gray-700/50 p-3";

  return (
    <div className="h-screen overflow-hidden bg-background transition-colors">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <TopBar onMenuToggle={() => setSidebarOpen((prev) => !prev)} />
      <main className="lg:ml-64 mt-16 box-border flex h-[calc(100vh-4rem)] flex-col overflow-y-auto p-4">
        <div className="page-header">
          <h1 className="page-title">Mis Multas</h1>
          <p className="page-subtitle">Gestiona tus multas por devoluciones tardías y regulariza tu estado.</p>
        </div>

        {!loading && pendingFines.length > 0 && (
          <div className="mb-6 flex items-start gap-4 rounded-xl border border-rose-200 bg-rose-50/50 p-4 dark:border-rose-900/40 dark:bg-rose-950/20 backdrop-blur-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-600 dark:bg-rose-900/50">
              <AlertCircle size={22} />
            </div>
            <div>
              <p className="font-bold text-rose-800 dark:text-rose-200">Tienes multas pendientes</p>
              <p className="mt-1 text-sm text-rose-700/80 dark:text-rose-300/80">
                Debes estar al día con tus pagos para poder realizar nuevos préstamos de libros.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <Card className={cardClass}><CardContent className="p-5"><div className="flex items-center justify-between"><div><p className="metric-label">Total Pendiente</p><p className="mt-2 text-3xl font-bold text-rose-600">{loading ? "..." : `$${totalPending}`}</p></div><div className="flex h-12 w-12 items-center justify-center rounded-lg bg-rose-100 text-rose-600"><DollarSign size={24} /></div></div></CardContent></Card>
          <Card className={cardClass}><CardContent className="p-5"><div className="flex items-center justify-between"><div><p className="metric-label">Total Pagado</p><p className="mt-2 text-3xl font-bold text-emerald-600">{loading ? "..." : `$${totalPaid}`}</p></div><div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600"><CheckCircle size={24} /></div></div></CardContent></Card>
          <Card className={cardClass}><CardContent className="p-5"><div className="flex items-center justify-between"><div><p className="metric-label">Multas Totales</p><p className="mt-2 text-3xl font-bold text-gray-800 dark:text-[#F5F7FF]">{loading ? "..." : fines.length}</p></div><div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#6C5CE7]/14 text-[#6C5CE7]"><BookOpen size={24} /></div></div></CardContent></Card>
        </div>

        {pendingFines.length > 0 && (
          <Card className={`${cardClass} mb-6 overflow-hidden`}>
            <CardHeader><CardTitle className="section-title px-1">Multas por pagar</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="space-y-0 divide-y dark:divide-gray-700">
                {pendingFines.map((fine) => (
                  <div key={fine.id} className="p-5 transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-700/30">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-800 dark:text-white leading-tight">{fine.prestamo?.libro?.titulo}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-2 mt-4 text-xs font-medium uppercase tracking-wider text-gray-400">
                          <div><p>Prestado</p><p className="text-gray-600 dark:text-[#B7BDD6]">{new Date(fine.prestamo?.fechaPrestamo).toLocaleDateString("es-ES")}</p></div>
                          <div><p>Vencimiento</p><p className="text-gray-600 dark:text-[#B7BDD6]">{new Date(fine.prestamo?.fechaLimiteDevolucion).toLocaleDateString("es-ES")}</p></div>
                          <div><p>Devolución</p><p className="text-gray-600 dark:text-[#B7BDD6]">{fine.prestamo?.fechaDevolucionReal ? new Date(fine.prestamo.fechaDevolucionReal).toLocaleDateString("es-ES") : "-"}</p></div>
                          <div><p>Retraso</p><p className="text-rose-600 font-bold">{fine.diasRetraso} día{fine.diasRetraso !== 1 ? "s" : ""}</p></div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="text-2xl font-black text-rose-600">${fine.monto}</p>
                        <Button onClick={() => handlePayClick(fine)} className="bg-emerald-600 hover:bg-emerald-700 h-10 px-6 font-bold shadow-lg shadow-emerald-600/20">Pagar ahora</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className={`${cardClass} flex-1 overflow-hidden`}>
          <CardHeader><CardTitle className="section-title px-1">Historial completo</CardTitle></CardHeader>
          <CardContent className="h-full p-0">
            <div className="h-full overflow-auto">
              <Table className="w-full text-sm">
                <TableHeader>
                  <TableRow className="border-b border-gray-100 bg-[#EEF2FF] dark:border-gray-700 dark:bg-[#2F355F]">
                    <TableHead className="h-11 font-semibold text-gray-700 dark:text-[#E6EBFF]">Libro</TableHead>
                    <TableHead className="h-11 font-semibold text-gray-700 dark:text-[#E6EBFF]">Vencimiento</TableHead>
                    <TableHead className="h-11 font-semibold text-gray-700 dark:text-[#E6EBFF]">Días Tarde</TableHead>
                    <TableHead className="h-11 font-semibold text-gray-700 dark:text-[#E6EBFF]">Monto</TableHead>
                    <TableHead className="h-11 font-semibold text-gray-700 dark:text-[#E6EBFF]">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="[&_tr:last-child]:border-0">
                  {loading ? (
                    <TableRow><TableCell colSpan={5} className="py-12 text-center text-gray-500">Cargando multas...</TableCell></TableRow>
                  ) : fines.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="py-12 text-center text-gray-500">No hay registros de multas.</TableCell></TableRow>
                  ) : (
                    fines.map((fine) => (
                      <TableRow key={fine.id} className="border-b border-gray-100 transition-colors hover:bg-gray-50/80 dark:border-gray-700 dark:hover:bg-gray-700/50">
                        <TableCell className="font-medium text-gray-700 dark:text-white">{fine.prestamo?.libro?.titulo}</TableCell>
                        <TableCell className="text-gray-600 dark:text-[#B7BDD6]">{new Date(fine.prestamo?.fechaLimiteDevolucion).toLocaleDateString("es-ES")}</TableCell>
                        <TableCell className="text-rose-600 font-medium">{fine.diasRetraso}</TableCell>
                        <TableCell className="font-bold text-gray-800 dark:text-[#F5F7FF]">${fine.monto}</TableCell>
                        <TableCell>{getStatusBadge(fine.estado)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent className="dark:bg-gray-800 dark:border-gray-700">
            <DialogHeader>
              <DialogTitle className="dark:text-[#F5F7FF]">Confirmar Pago</DialogTitle>
              <DialogDescription className="dark:text-[#B7BDD6]">Estás a punto de pagar la multa por "{selectedFine?.prestamo?.libro?.titulo}"</DialogDescription>
            </DialogHeader>
            {selectedFine && (
              <div className="py-4">
                <div className={`${sectionBg} border border-gray-200 dark:border-gray-600`}>
                  <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#5b4bd1] dark:text-[#C9C3E8]">Resumen de deuda</p>
                  <div className="space-y-1 text-sm text-gray-700 dark:text-[#F5F7FF]">
                    <div className="flex justify-between"><span>Días de retraso:</span><span className="font-bold">{selectedFine.diasRetraso}</span></div>
                    <div className="flex justify-between text-lg mt-2 border-t pt-2 border-gray-200 dark:border-gray-600"><span className="font-bold">Total a pagar:</span><span className="font-black text-[#6C5CE7]">${selectedFine.monto}</span></div>
                  </div>
                </div>
                <div className="mt-4 flex items-start gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                  <CheckCircle size={14} className="shrink-0 mt-0.5" />
                  <p>Al pagar quedarás habilitado inmediatamente para solicitar nuevos libros en la biblioteca.</p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPaymentDialog(false)} className="dark:border-gray-600">Cancelar</Button>
              <Button onClick={handleConfirmPayment} disabled={paying} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                {paying ? "Procesando..." : "Confirmar Pago"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};
