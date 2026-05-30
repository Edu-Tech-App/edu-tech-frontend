import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "../components/Sidebar";
import { TopBar } from "../components/TopBar";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { Label } from "../components/ui/label";
import { AlertTriangle, DollarSign, History, Plus, Search, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../services/api";

interface BackendFine {
  id: number;
  monto: number;
  diasRetraso: number;
  estado: "PENDIENTE" | "PAGADA" | "ANULADA";
  fechaGeneracion?: string;
  prestamo?: {
    id: number;
    libro?: { id?: number; titulo?: string };
    estudiante?: { user?: { id?: number; nombreCompleto?: string; correoInstitucional?: string } };
  };
}

interface BackendPayment {
  multaId: number;
  referenciaPasarela: string;
  monto: number;
  estado: "APROBADO" | "RECHAZADO" | "PENDIENTE";
  fechaPago: string;
  multa?: BackendFine;
}

interface UserRecord {
  id: number;
  nombreCompleto: string;
  correoInstitucional: string;
  rol: "estudiante" | "docente" | "bibliotecario" | "administrativo" | "supervisor";
  estado: "activo" | "inactivo";
}

interface BookRecord {
  id: number;
  titulo: string;
  autor: string;
}

type ManualFineType = "RETRASO" | "DANO" | "PERDIDA";
type FineState = "PENDIENTE" | "PAGADA" | "ANULADA";

interface ManualFine {
  id: string;
  source: "manual";
  tipo: ManualFineType;
  userId: number;
  userName: string;
  userEmail: string;
  bookId: number | null;
  bookTitle: string;
  monto: number;
  estado: FineState;
  descripcion: string;
  fechaGeneracion: string;
}

interface ManualPayment {
  id: string;
  fineId: string;
  fineType: ManualFineType;
  userName: string;
  bookTitle: string;
  monto: number;
  estado: "APROBADO" | "RECHAZADO" | "PENDIENTE";
  referencia: string;
  fechaPago: string;
}

type CombinedFine = {
  id: string;
  source: "backend" | "manual";
  tipo: ManualFineType;
  estado: FineState;
  monto: number;
  diasRetraso: number;
  fechaGeneracion: string;
  userName: string;
  userEmail: string;
  bookTitle: string;
  descripcion: string;
  backendId?: number;
};

const MANUAL_FINES_STORAGE_KEY = "edu_tech_admin_manual_fines";
const MANUAL_FINE_PAYMENTS_STORAGE_KEY = "edu_tech_admin_manual_fine_payments";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value);

const formatDate = (value?: string | null) => {
  if (!value) return "Sin fecha";
  return new Date(value).toLocaleDateString("es-ES");
};

const getTypeLabel = (type: ManualFineType) => {
  if (type === "RETRASO") return "Multas por retraso";
  if (type === "DANO") return "Multas por daño";
  return "Multas por pérdida";
};

const getStatusClass = (status: FineState) => {
  if (status === "PAGADA") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
  if (status === "ANULADA") return "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200";
  return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
};

const getPaymentStatusClass = (status: "APROBADO" | "RECHAZADO" | "PENDIENTE") => {
  if (status === "APROBADO") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
  if (status === "RECHAZADO") return "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300";
  return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
};

const readManualFines = (): ManualFine[] => {
  try {
    const raw = localStorage.getItem(MANUAL_FINES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const writeManualFines = (fines: ManualFine[]) => {
  localStorage.setItem(MANUAL_FINES_STORAGE_KEY, JSON.stringify(fines));
};

const readManualPayments = (): ManualPayment[] => {
  try {
    const raw = localStorage.getItem(MANUAL_FINE_PAYMENTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const writeManualPayments = (payments: ManualPayment[]) => {
  localStorage.setItem(MANUAL_FINE_PAYMENTS_STORAGE_KEY, JSON.stringify(payments));
};

export const FinesPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("activas");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | ManualFineType>("all");
  const [backendFines, setBackendFines] = useState<BackendFine[]>([]);
  const [backendPayments, setBackendPayments] = useState<BackendPayment[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [books, setBooks] = useState<BookRecord[]>([]);
  const [manualFines, setManualFines] = useState<ManualFine[]>([]);
  const [manualPayments, setManualPayments] = useState<ManualPayment[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedFine, setSelectedFine] = useState<CombinedFine | null>(null);
  const [newFine, setNewFine] = useState({
    userId: "",
    bookId: "NONE",
    tipo: "DANO" as ManualFineType,
    monto: "",
    descripcion: "",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [finesResponse, paymentsResponse, usersData, booksData] = await Promise.all([
        api.getAllFines(),
        api.getAllFinePayments().catch(() => []),
        api.getUsers(),
        api.getBooks(),
      ]);

      setBackendFines(finesResponse.fines || []);
      setBackendPayments(Array.isArray(paymentsResponse) ? paymentsResponse : []);
      setUsers(usersData);
      setBooks(booksData);
      setManualFines(readManualFines());
      setManualPayments(readManualPayments());
    } catch (error: any) {
      toast.error(error.message || "No se pudieron cargar las multas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const combinedFines = useMemo<CombinedFine[]>(() => {
    const mappedBackend = backendFines.map((fine) => ({
      id: `backend-${fine.id}`,
      source: "backend" as const,
      tipo: "RETRASO" as const,
      estado: fine.estado,
      monto: Number(fine.monto),
      diasRetraso: Number(fine.diasRetraso || 0),
      fechaGeneracion: fine.fechaGeneracion || "",
      userName: fine.prestamo?.estudiante?.user?.nombreCompleto || "Usuario no disponible",
      userEmail: fine.prestamo?.estudiante?.user?.correoInstitucional || "Sin correo",
      bookTitle: fine.prestamo?.libro?.titulo || "Libro no disponible",
      descripcion: fine.diasRetraso > 0 ? `Retraso de ${fine.diasRetraso} día(s)` : "Multa por retraso",
      backendId: fine.id,
    }));

    return [...mappedBackend, ...manualFines].sort(
      (left, right) => new Date(right.fechaGeneracion).getTime() - new Date(left.fechaGeneracion).getTime(),
    );
  }, [backendFines, manualFines]);

  const filteredFines = useMemo(() => {
    return combinedFines.filter((fine) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        !term ||
        fine.userName.toLowerCase().includes(term) ||
        fine.bookTitle.toLowerCase().includes(term) ||
        fine.descripcion.toLowerCase().includes(term);
      const matchesType = typeFilter === "all" || fine.tipo === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [combinedFines, searchTerm, typeFilter]);

  const activeFines = useMemo(() => filteredFines.filter((fine) => fine.estado === "PENDIENTE"), [filteredFines]);
  const delayFines = useMemo(() => filteredFines.filter((fine) => fine.tipo === "RETRASO"), [filteredFines]);
  const damageFines = useMemo(() => filteredFines.filter((fine) => fine.tipo === "DANO"), [filteredFines]);
  const lossFines = useMemo(() => filteredFines.filter((fine) => fine.tipo === "PERDIDA"), [filteredFines]);

  const combinedPayments = useMemo(() => {
    const mappedBackendPayments = backendPayments.map((payment) => ({
      id: `backend-payment-${payment.multaId}`,
      fineId: `backend-${payment.multaId}`,
      fineType: "RETRASO" as ManualFineType,
      userName: payment.multa?.prestamo?.estudiante?.user?.nombreCompleto || "Usuario no disponible",
      bookTitle: payment.multa?.prestamo?.libro?.titulo || "Libro no disponible",
      monto: Number(payment.monto),
      estado: payment.estado,
      referencia: payment.referenciaPasarela,
      fechaPago: payment.fechaPago,
    }));

    return [...mappedBackendPayments, ...manualPayments].sort(
      (left, right) => new Date(right.fechaPago).getTime() - new Date(left.fechaPago).getTime(),
    );
  }, [backendPayments, manualPayments]);

  const metrics = useMemo(() => {
    const activeCount = combinedFines.filter((fine) => fine.estado === "PENDIENTE").length;
    const delayCount = combinedFines.filter((fine) => fine.tipo === "RETRASO").length;
    const damageCount = combinedFines.filter((fine) => fine.tipo === "DANO").length;
    const lossCount = combinedFines.filter((fine) => fine.tipo === "PERDIDA").length;
    const totalPending = combinedFines
      .filter((fine) => fine.estado === "PENDIENTE")
      .reduce((sum, fine) => sum + Number(fine.monto), 0);
    const paymentCount = combinedPayments.length;

    return [
      { label: "Multas activas", value: activeCount },
      { label: "Multas por retraso", value: delayCount },
      { label: "Multas por daño", value: damageCount },
      { label: "Multas por pérdida", value: lossCount },
      { label: "Registrar pago", value: paymentCount },
      { label: "Saldo pendiente", value: formatCurrency(totalPending) },
    ];
  }, [combinedFines, combinedPayments]);

  const activeStudents = useMemo(
    () => users.filter((user) => user.rol === "estudiante" && user.estado === "activo"),
    [users],
  );

  const openPaymentDialog = (fine: CombinedFine) => {
    setSelectedFine(fine);
    setShowPaymentDialog(true);
  };

  const handleCreateFine = async () => {
    if (!newFine.userId || !newFine.monto || !newFine.descripcion.trim()) {
      toast.error("Completa los datos de la multa");
      return;
    }

    const user = users.find((item) => item.id === Number(newFine.userId));
    if (!user) {
      toast.error("Selecciona un estudiante válido");
      return;
    }

    const book = books.find((item) => item.id === Number(newFine.bookId));

    setSaving(true);
    try {
      const record: ManualFine = {
        id: `manual-${Date.now()}`,
        source: "manual",
        tipo: newFine.tipo,
        userId: user.id,
        userName: user.nombreCompleto,
        userEmail: user.correoInstitucional,
        bookId: book?.id ?? null,
        bookTitle: book?.titulo || "Sin libro asociado",
        monto: Number(newFine.monto),
        estado: "PENDIENTE",
        descripcion: newFine.descripcion.trim(),
        fechaGeneracion: new Date().toISOString(),
      };

      const updatedFines = [record, ...manualFines];
      writeManualFines(updatedFines);
      setManualFines(updatedFines);
      setShowCreateDialog(false);
      setNewFine({
        userId: "",
        bookId: "NONE",
        tipo: "DANO",
        monto: "",
        descripcion: "",
      });
      toast.success("Multa registrada exitosamente");
    } finally {
      setSaving(false);
    }
  };

  const handlePayFine = async () => {
    if (!selectedFine) return;

    setPaying(true);
    try {
      if (selectedFine.source === "backend" && selectedFine.backendId) {
        const payment = await api.payFine(selectedFine.backendId);
        const paymentStatus = payment?.estado as "APROBADO" | "RECHAZADO" | "PENDIENTE";

        if (paymentStatus === "APROBADO") {
          toast.success("Pago simulado aprobado");
        } else if (paymentStatus === "PENDIENTE") {
          toast.success("Pago simulado pendiente de confirmación");
        } else {
          toast.error("Pago simulado rechazado");
        }

        await loadData();
      } else {
        const random = Math.random();
        const status = random > 0.4 ? "APROBADO" : random > 0.2 ? "PENDIENTE" : "RECHAZADO";
        const paymentRecord: ManualPayment = {
          id: `manual-payment-${Date.now()}`,
          fineId: selectedFine.id,
          fineType: selectedFine.tipo,
          userName: selectedFine.userName,
          bookTitle: selectedFine.bookTitle,
          monto: selectedFine.monto,
          estado: status,
          referencia: `SIM-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
          fechaPago: new Date().toISOString(),
        };

        const updatedPayments = [paymentRecord, ...manualPayments];
        writeManualPayments(updatedPayments);
        setManualPayments(updatedPayments);

        if (status === "APROBADO") {
          const updatedFines = manualFines.map((fine) =>
            fine.id === selectedFine.id ? { ...fine, estado: "PAGADA" as FineState } : fine,
          );
          writeManualFines(updatedFines);
          setManualFines(updatedFines);
          toast.success("Pago simulado aprobado");
        } else if (status === "PENDIENTE") {
          toast.success("Pago simulado pendiente");
        } else {
          toast.error("Pago simulado rechazado");
        }
      }

      setShowPaymentDialog(false);
      setSelectedFine(null);
    } catch (error: any) {
      toast.error(error.message || "No se pudo procesar el pago");
    } finally {
      setPaying(false);
    }
  };

  const renderFineTable = (items: CombinedFine[], emptyMessage: string) => (
    <div className="min-h-0 overflow-auto">
      <table className="w-full min-w-[1080px] table-fixed text-sm">
        <colgroup>
          <col className="w-[18%]" />
          <col className="w-[18%]" />
          <col className="w-[14%]" />
          <col className="w-[16%]" />
          <col className="w-[10%]" />
          <col className="w-[10%]" />
          <col className="w-[14%]" />
        </colgroup>
        <thead className="[&_tr]:border-b [&_tr]:border-gray-100 [&_tr]:bg-[#EEF2FF] dark:[&_tr]:border-gray-700 dark:[&_tr]:bg-[#2F355F]">
          <tr>
            <th className="sticky top-0 z-10 h-11 bg-[#EEF2FF] px-4 text-left align-middle text-sm font-semibold text-gray-700 dark:bg-[#2F355F] dark:text-[#E6EBFF]">Usuario</th>
            <th className="sticky top-0 z-10 h-11 bg-[#EEF2FF] px-4 text-left align-middle text-sm font-semibold text-gray-700 dark:bg-[#2F355F] dark:text-[#E6EBFF]">Libro</th>
            <th className="sticky top-0 z-10 h-11 bg-[#EEF2FF] px-4 text-left align-middle text-sm font-semibold text-gray-700 dark:bg-[#2F355F] dark:text-[#E6EBFF]">Tipo</th>
            <th className="sticky top-0 z-10 h-11 bg-[#EEF2FF] px-4 text-left align-middle text-sm font-semibold text-gray-700 dark:bg-[#2F355F] dark:text-[#E6EBFF]">Detalle</th>
            <th className="sticky top-0 z-10 h-11 bg-[#EEF2FF] px-4 text-left align-middle text-sm font-semibold text-gray-700 dark:bg-[#2F355F] dark:text-[#E6EBFF]">Monto</th>
            <th className="sticky top-0 z-10 h-11 bg-[#EEF2FF] px-4 text-left align-middle text-sm font-semibold text-gray-700 dark:bg-[#2F355F] dark:text-[#E6EBFF]">Estado</th>
            <th className="sticky top-0 z-10 h-11 bg-[#EEF2FF] px-4 text-right align-middle text-sm font-semibold text-gray-700 dark:bg-[#2F355F] dark:text-[#E6EBFF]">Acciones</th>
          </tr>
        </thead>
        <tbody className="[&_tr:last-child]:border-0">
          {items.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            items.map((fine) => (
              <tr key={fine.id} className="border-b border-gray-100 transition-colors hover:bg-gray-50/80 dark:border-gray-700 dark:hover:bg-gray-700/50">
                <td className="px-4 py-3 align-middle lg:py-2">
                  <p className="truncate font-medium text-gray-700 dark:text-white">{fine.userName}</p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-[#B7BDD6]">{fine.userEmail}</p>
                </td>
                <td className="truncate px-4 py-3 align-middle text-gray-700 dark:text-gray-400 lg:py-2">{fine.bookTitle}</td>
                <td className="px-4 py-3 align-middle lg:py-2">
                  <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200">{getTypeLabel(fine.tipo)}</Badge>
                </td>
                <td className="px-4 py-3 align-middle text-gray-700 dark:text-gray-400 lg:py-2">
                  {fine.descripcion}
                  {fine.tipo === "RETRASO" && fine.diasRetraso > 0 ? (
                    <p className="mt-1 text-xs text-gray-500 dark:text-[#B7BDD6]">{fine.diasRetraso} día(s) de retraso</p>
                  ) : null}
                </td>
                <td className="px-4 py-3 align-middle font-medium text-gray-700 dark:text-white lg:py-2">{formatCurrency(fine.monto)}</td>
                <td className="px-4 py-3 align-middle lg:py-2">
                  <Badge className={getStatusClass(fine.estado)}>{fine.estado}</Badge>
                </td>
                <td className="px-4 py-3 align-middle lg:py-2">
                  <div className="flex justify-end gap-1">
                    {fine.estado === "PENDIENTE" ? (
                      <Button size="sm" variant="ghost" onClick={() => openPaymentDialog(fine)} title="Registrar pago">
                        <DollarSign size={16} />
                      </Button>
                    ) : (
                      <span className="text-xs text-gray-400 dark:text-gray-500">Pagada</span>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="h-screen overflow-hidden bg-background transition-colors">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <TopBar onMenuToggle={() => setSidebarOpen((prev) => !prev)} />

      <main className="lg:ml-64 mt-16 box-border flex h-[calc(100vh-4rem)] flex-col overflow-hidden p-4">
        <div className="grid grid-cols-2 gap-2 xl:grid-cols-6">
          {metrics.map((item) => (
            <Card key={item.label} className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
              <CardContent className="px-3 py-2">
                <p className="text-[12px] leading-tight text-gray-500 dark:text-[#B7BDD6]">{item.label}</p>
                <p className="mt-0.5 truncate text-[1.45rem] font-bold leading-none text-gray-800 dark:text-[#F5F7FF]">{item.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 dark:border-gray-700 dark:bg-gray-800">
            <Search className="shrink-0 text-gray-400" size={18} />
            <Input
              placeholder="Buscar"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 dark:bg-transparent dark:text-white dark:placeholder-gray-400"
            />
            <div className="h-5 w-px bg-gray-200 dark:bg-gray-700" />
            <Select value={typeFilter} onValueChange={(value: "all" | ManualFineType) => setTypeFilter(value)}>
              <SelectTrigger className="h-9 w-[170px] justify-end border-0 bg-transparent px-0 text-right shadow-none focus:ring-0 dark:bg-transparent dark:text-white">
                <SelectValue placeholder="Tipos" />
              </SelectTrigger>
              <SelectContent className="dark:border-gray-700 dark:bg-gray-800">
                <SelectItem value="all" className="dark:text-white dark:focus:bg-gray-700">Todos</SelectItem>
                <SelectItem value="RETRASO" className="dark:text-white dark:focus:bg-gray-700">Retraso</SelectItem>
                <SelectItem value="DANO" className="dark:text-white dark:focus:bg-gray-700">Daño</SelectItem>
                <SelectItem value="PERDIDA" className="dark:text-white dark:focus:bg-gray-700">Pérdida</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="h-10 shrink-0 bg-[#6C5CE7] hover:bg-[#5b4bd1]">
            <Plus size={16} className="mr-2" />Registrar multa
          </Button>
        </div>

        <Card className="mt-2 flex min-h-0 flex-1 gap-0 overflow-hidden border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden p-0 last:pb-0 [&:last-child]:pb-0">
            {loading ? (
              <div className="flex flex-1 items-center justify-center px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                Cargando multas...
              </div>
            ) : (
              <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col">
                <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                  <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1 lg:grid-cols-6 dark:bg-gray-900/60">
                    <TabsTrigger value="activas">Multas activas</TabsTrigger>
                    <TabsTrigger value="retraso">Retraso</TabsTrigger>
                    <TabsTrigger value="dano">Daño</TabsTrigger>
                    <TabsTrigger value="perdida">Pérdida</TabsTrigger>
                    <TabsTrigger value="pagos">Registrar pago</TabsTrigger>
                    <TabsTrigger value="historial">Historial de pagos</TabsTrigger>
                  </TabsList>
                </div>

                <div className="min-h-0 flex-1 overflow-hidden">
                  <TabsContent value="activas" className="mt-0 h-full">
                    {renderFineTable(activeFines, "No hay multas activas registradas.")}
                  </TabsContent>

                  <TabsContent value="retraso" className="mt-0 h-full">
                    {renderFineTable(delayFines, "No hay multas por retraso registradas.")}
                  </TabsContent>

                  <TabsContent value="dano" className="mt-0 h-full">
                    {renderFineTable(damageFines, "No hay multas por daño registradas.")}
                  </TabsContent>

                  <TabsContent value="perdida" className="mt-0 h-full">
                    {renderFineTable(lossFines, "No hay multas por pérdida registradas.")}
                  </TabsContent>

                  <TabsContent value="pagos" className="mt-0 h-full overflow-y-auto p-4">
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                      <Card className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900/40">
                        <CardContent className="p-4">
                          <div className="mb-3 flex items-center gap-2">
                            <DollarSign size={18} className="text-[#6C5CE7]" />
                            <h3 className="font-semibold text-gray-900 dark:text-white">Pago simulado</h3>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-[#B7BDD6]">
                            Cada pago se procesa como simulación. Puede quedar `APROBADO`, `PENDIENTE` o `RECHAZADO`, y si se aprueba la multa pasa a `PAGADA`.
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900/40">
                        <CardContent className="p-4">
                          <div className="mb-3 flex items-center gap-2">
                            <ShieldAlert size={18} className="text-amber-500" />
                            <h3 className="font-semibold text-gray-900 dark:text-white">Flujo administrativo</h3>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-[#B7BDD6]">
                            Usa el icono de pago sobre cualquier multa pendiente para simular el registro del pago y conservar trazabilidad dentro del historial.
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="historial" className="mt-0 h-full">
                    <div className="min-h-0 overflow-auto">
                      <table className="w-full min-w-[980px] table-fixed text-sm">
                        <colgroup>
                          <col className="w-[18%]" />
                          <col className="w-[18%]" />
                          <col className="w-[14%]" />
                          <col className="w-[12%]" />
                          <col className="w-[12%]" />
                          <col className="w-[14%]" />
                          <col className="w-[12%]" />
                        </colgroup>
                        <thead className="[&_tr]:border-b [&_tr]:border-gray-100 [&_tr]:bg-[#EEF2FF] dark:[&_tr]:border-gray-700 dark:[&_tr]:bg-[#2F355F]">
                          <tr>
                            <th className="sticky top-0 z-10 h-11 bg-[#EEF2FF] px-4 text-left align-middle text-sm font-semibold text-gray-700 dark:bg-[#2F355F] dark:text-[#E6EBFF]">Usuario</th>
                            <th className="sticky top-0 z-10 h-11 bg-[#EEF2FF] px-4 text-left align-middle text-sm font-semibold text-gray-700 dark:bg-[#2F355F] dark:text-[#E6EBFF]">Libro</th>
                            <th className="sticky top-0 z-10 h-11 bg-[#EEF2FF] px-4 text-left align-middle text-sm font-semibold text-gray-700 dark:bg-[#2F355F] dark:text-[#E6EBFF]">Tipo</th>
                            <th className="sticky top-0 z-10 h-11 bg-[#EEF2FF] px-4 text-left align-middle text-sm font-semibold text-gray-700 dark:bg-[#2F355F] dark:text-[#E6EBFF]">Monto</th>
                            <th className="sticky top-0 z-10 h-11 bg-[#EEF2FF] px-4 text-left align-middle text-sm font-semibold text-gray-700 dark:bg-[#2F355F] dark:text-[#E6EBFF]">Estado</th>
                            <th className="sticky top-0 z-10 h-11 bg-[#EEF2FF] px-4 text-left align-middle text-sm font-semibold text-gray-700 dark:bg-[#2F355F] dark:text-[#E6EBFF]">Referencia</th>
                            <th className="sticky top-0 z-10 h-11 bg-[#EEF2FF] px-4 text-left align-middle text-sm font-semibold text-gray-700 dark:bg-[#2F355F] dark:text-[#E6EBFF]">Fecha</th>
                          </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                          {combinedPayments.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                                No hay historial de pagos registrado.
                              </td>
                            </tr>
                          ) : (
                            combinedPayments.map((payment) => (
                              <tr key={payment.id} className="border-b border-gray-100 transition-colors hover:bg-gray-50/80 dark:border-gray-700 dark:hover:bg-gray-700/50">
                                <td className="px-4 py-3 align-middle font-medium text-gray-700 dark:text-white lg:py-2">{payment.userName}</td>
                                <td className="truncate px-4 py-3 align-middle text-gray-700 dark:text-gray-400 lg:py-2">{payment.bookTitle}</td>
                                <td className="px-4 py-3 align-middle lg:py-2">
                                  <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200">{getTypeLabel(payment.fineType)}</Badge>
                                </td>
                                <td className="px-4 py-3 align-middle font-medium text-gray-700 dark:text-white lg:py-2">{formatCurrency(payment.monto)}</td>
                                <td className="px-4 py-3 align-middle lg:py-2">
                                  <Badge className={getPaymentStatusClass(payment.estado)}>{payment.estado}</Badge>
                                </td>
                                <td className="px-4 py-3 align-middle text-gray-700 dark:text-gray-400 lg:py-2">{payment.referencia}</td>
                                <td className="px-4 py-3 align-middle text-gray-700 dark:text-gray-400 lg:py-2">{formatDate(payment.fechaPago)}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            )}
          </CardContent>
        </Card>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl dark:border-gray-700 dark:bg-gray-800">
            <DialogHeader>
              <DialogTitle className="dark:text-white">Registrar multa</DialogTitle>
              <DialogDescription className="dark:text-gray-400">
                Crea una multa administrativa simulada por daño o pérdida, o manual por retraso si necesitas un caso de prueba.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-4 py-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label className="mb-2 block dark:text-gray-300">Estudiante</Label>
                <Select value={newFine.userId || "NONE"} onValueChange={(value) => setNewFine((prev) => ({ ...prev, userId: value === "NONE" ? "" : value }))}>
                  <SelectTrigger className="dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                    <SelectValue placeholder="Selecciona un estudiante" />
                  </SelectTrigger>
                  <SelectContent className="dark:border-gray-700 dark:bg-gray-800">
                    <SelectItem value="NONE" className="dark:text-white dark:focus:bg-gray-700">Seleccionar</SelectItem>
                    {activeStudents.map((student) => (
                      <SelectItem key={student.id} value={String(student.id)} className="dark:text-white dark:focus:bg-gray-700">
                        {student.nombreCompleto} · {student.correoInstitucional}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block dark:text-gray-300">Libro</Label>
                <Select value={newFine.bookId} onValueChange={(value) => setNewFine((prev) => ({ ...prev, bookId: value }))}>
                  <SelectTrigger className="dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                    <SelectValue placeholder="Selecciona un libro" />
                  </SelectTrigger>
                  <SelectContent className="dark:border-gray-700 dark:bg-gray-800">
                    <SelectItem value="NONE" className="dark:text-white dark:focus:bg-gray-700">Sin libro asociado</SelectItem>
                    {books.map((book) => (
                      <SelectItem key={book.id} value={String(book.id)} className="dark:text-white dark:focus:bg-gray-700">
                        {book.titulo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block dark:text-gray-300">Tipo</Label>
                <Select value={newFine.tipo} onValueChange={(value: ManualFineType) => setNewFine((prev) => ({ ...prev, tipo: value }))}>
                  <SelectTrigger className="dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dark:border-gray-700 dark:bg-gray-800">
                    <SelectItem value="RETRASO" className="dark:text-white dark:focus:bg-gray-700">Retraso</SelectItem>
                    <SelectItem value="DANO" className="dark:text-white dark:focus:bg-gray-700">Daño</SelectItem>
                    <SelectItem value="PERDIDA" className="dark:text-white dark:focus:bg-gray-700">Pérdida</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block dark:text-gray-300">Monto</Label>
                <Input
                  type="number"
                  min={1000}
                  value={newFine.monto}
                  onChange={(e) => setNewFine((prev) => ({ ...prev, monto: e.target.value }))}
                  className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="md:col-span-2">
                <Label className="mb-2 block dark:text-gray-300">Descripción</Label>
                <Input
                  value={newFine.descripcion}
                  onChange={(e) => setNewFine((prev) => ({ ...prev, descripcion: e.target.value }))}
                  placeholder="Detalle de la multa"
                  className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="dark:border-gray-600 dark:text-gray-300">
                Cancelar
              </Button>
              <Button onClick={handleCreateFine} disabled={saving} className="bg-[#6C5CE7] hover:bg-[#5b4bd1]">
                {saving ? "Registrando..." : "Registrar multa"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent className="dark:border-gray-700 dark:bg-gray-800">
            <DialogHeader>
              <DialogTitle className="dark:text-white">Registrar pago</DialogTitle>
              <DialogDescription className="dark:text-gray-400">
                Vas a procesar un pago simulado para la multa de {selectedFine?.userName}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-4">
              <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50">
                <p className="text-sm text-gray-600 dark:text-gray-300">Libro: {selectedFine?.bookTitle}</p>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Tipo: {selectedFine ? getTypeLabel(selectedFine.tipo) : "-"}</p>
                <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white">Monto: {selectedFine ? formatCurrency(selectedFine.monto) : "-"}</p>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300">
                El pago es simulado. El sistema decidirá si queda `APROBADO`, `PENDIENTE` o `RECHAZADO`, y se registrará en el historial.
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPaymentDialog(false)} className="dark:border-gray-600 dark:text-gray-300">
                Cancelar
              </Button>
              <Button onClick={handlePayFine} disabled={paying} className="bg-[#6C5CE7] hover:bg-[#5b4bd1]">
                {paying ? "Procesando..." : "Confirmar pago simulado"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};
