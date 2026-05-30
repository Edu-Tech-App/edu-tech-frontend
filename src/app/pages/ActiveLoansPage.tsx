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
import { BookMarked, History, Plus, RotateCcw, Search, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../services/api";

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
  cantidadDisponible: number;
  estado: "DISPONIBLE" | "MANTENIMIENTO" | "BAJA";
}

interface LoanRecord {
  id: number;
  fechaPrestamo: string;
  fechaLimiteDevolucion: string;
  fechaDevolucionReal?: string | null;
  estado: "ACTIVO" | "DEVUELTO" | "VENCIDO" | "PERDIDO";
  libroId: number;
  estudianteId: number;
  libro?: { id: number; titulo: string; autor?: string };
  estudiante?: { user?: { nombreCompleto?: string; correoInstitucional?: string } };
  multa?: { monto?: number; diasRetraso?: number; estado?: string } | null;
}

type LoanFilter = "all" | "active" | "overdue" | "returned";

const formatDate = (value?: string | null) => {
  if (!value) return "Sin fecha";
  return new Date(value).toLocaleDateString("es-ES");
};

const formatRole = (role: UserRecord["rol"]) => role.charAt(0).toUpperCase() + role.slice(1);

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value);

const toDateInputValue = (value: Date) => value.toISOString().split("T")[0];

const addDays = (date: Date, days: number) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
};

const getLoanViewStatus = (loan: LoanRecord) => {
  if (loan.estado === "DEVUELTO") return "returned";
  if (loan.estado === "PERDIDO") return "overdue";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(loan.fechaLimiteDevolucion);
  dueDate.setHours(0, 0, 0, 0);

  if (loan.estado === "VENCIDO" || dueDate < today) return "overdue";
  return "active";
};

const getStatusLabel = (loan: LoanRecord) => {
  const status = getLoanViewStatus(loan);
  if (status === "returned") return "Devuelto";
  if (status === "overdue") return "Vencido";
  return "Activo";
};

const getStatusClass = (loan: LoanRecord) => {
  const status = getLoanViewStatus(loan);
  if (status === "active") return "bg-[#6C5CE7]/12 text-[#5b4bd1] dark:bg-[#6C5CE7]/20 dark:text-[#d9d4ff]";
  if (status === "returned") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
  return "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300";
};

const LoanTable = ({
  loans,
  emptyMessage,
  onRenew,
  onReturn,
  actionMode,
}: {
  loans: LoanRecord[];
  emptyMessage: string;
  onRenew: (loan: LoanRecord) => void;
  onReturn: (loan: LoanRecord) => void;
  actionMode: "active" | "renew" | "return" | "history";
}) => (
  <div className="min-h-0 overflow-auto">
    <table className="w-full min-w-[1040px] table-fixed text-sm">
      <colgroup>
        <col className="w-[24%]" />
        <col className="w-[18%]" />
        <col className="w-[18%]" />
        <col className="w-[12%]" />
        <col className="w-[12%]" />
        <col className="w-[8%]" />
        <col className="w-[8%]" />
      </colgroup>
      <thead className="[&_tr]:border-b [&_tr]:border-gray-100 [&_tr]:bg-[#EEF2FF] dark:[&_tr]:border-gray-700 dark:[&_tr]:bg-[#2F355F]">
        <tr>
          <th className="sticky top-0 z-10 h-11 bg-[#EEF2FF] px-4 text-left align-middle text-sm font-semibold text-gray-700 dark:bg-[#2F355F] dark:text-[#E6EBFF]">Libro</th>
          <th className="sticky top-0 z-10 h-11 bg-[#EEF2FF] px-4 text-left align-middle text-sm font-semibold text-gray-700 dark:bg-[#2F355F] dark:text-[#E6EBFF]">Usuario</th>
          <th className="sticky top-0 z-10 h-11 bg-[#EEF2FF] px-4 text-left align-middle text-sm font-semibold text-gray-700 dark:bg-[#2F355F] dark:text-[#E6EBFF]">Correo</th>
          <th className="sticky top-0 z-10 h-11 bg-[#EEF2FF] px-4 text-left align-middle text-sm font-semibold text-gray-700 dark:bg-[#2F355F] dark:text-[#E6EBFF]">Préstamo</th>
          <th className="sticky top-0 z-10 h-11 bg-[#EEF2FF] px-4 text-left align-middle text-sm font-semibold text-gray-700 dark:bg-[#2F355F] dark:text-[#E6EBFF]">Límite</th>
          <th className="sticky top-0 z-10 h-11 bg-[#EEF2FF] px-4 text-left align-middle text-sm font-semibold text-gray-700 dark:bg-[#2F355F] dark:text-[#E6EBFF]">Estado</th>
          <th className="sticky top-0 z-10 h-11 bg-[#EEF2FF] px-4 text-right align-middle text-sm font-semibold text-gray-700 dark:bg-[#2F355F] dark:text-[#E6EBFF]">Acciones</th>
        </tr>
      </thead>
      <tbody className="[&_tr:last-child]:border-0">
        {loans.length === 0 ? (
          <tr>
            <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
              {emptyMessage}
            </td>
          </tr>
        ) : (
          loans.map((loan) => (
            <tr key={loan.id} className="border-b border-gray-100 transition-colors hover:bg-gray-50/80 dark:border-gray-700 dark:hover:bg-gray-700/50">
              <td className="px-4 py-3 align-middle lg:py-2">
                <div>
                  <p className="truncate font-medium text-gray-700 dark:text-white">{loan.libro?.titulo || `Libro #${loan.libroId}`}</p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-[#B7BDD6]">{loan.libro?.autor || "Biblioteca general"}</p>
                </div>
              </td>
              <td className="truncate px-4 py-3 align-middle text-gray-700 dark:text-white lg:py-2">{loan.estudiante?.user?.nombreCompleto || `Usuario #${loan.estudianteId}`}</td>
              <td className="truncate px-4 py-3 align-middle text-gray-700 dark:text-gray-400 lg:py-2">{loan.estudiante?.user?.correoInstitucional || "Sin correo"}</td>
              <td className="px-4 py-3 align-middle text-gray-700 dark:text-gray-400 lg:py-2">{formatDate(loan.fechaPrestamo)}</td>
              <td className="px-4 py-3 align-middle text-gray-700 dark:text-gray-400 lg:py-2">{formatDate(loan.fechaLimiteDevolucion)}</td>
              <td className="px-4 py-3 align-middle lg:py-2">
                <Badge className={getStatusClass(loan)}>{getStatusLabel(loan)}</Badge>
                {loan.multa?.monto ? (
                  <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-300">Multa: {formatCurrency(Number(loan.multa.monto))}</p>
                ) : null}
              </td>
              <td className="px-4 py-3 align-middle lg:py-2">
                <div className="flex justify-end gap-1">
                  {actionMode === "renew" ? (
                    <Button size="sm" variant="ghost" onClick={() => onRenew(loan)} title="Renovar préstamo">
                      <RotateCcw size={16} />
                    </Button>
                  ) : null}
                  {actionMode === "return" || actionMode === "active" ? (
                    <Button size="sm" variant="ghost" onClick={() => onReturn(loan)} title="Registrar devolución">
                      <Undo2 size={16} />
                    </Button>
                  ) : null}
                  {actionMode === "history" ? (
                    <span className="text-xs text-gray-400 dark:text-gray-500">Historial</span>
                  ) : null}
                </div>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

export const ActiveLoansPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [renewing, setRenewing] = useState(false);
  const [returning, setReturning] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<LoanFilter>("all");
  const [tab, setTab] = useState("activos");
  const [loans, setLoans] = useState<LoanRecord[]>([]);
  const [books, setBooks] = useState<BookRecord[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showRenewDialog, setShowRenewDialog] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<LoanRecord | null>(null);
  const [newLoan, setNewLoan] = useState({
    libroId: "",
    estudianteId: "",
    fechaLimiteDevolucion: toDateInputValue(addDays(new Date(), 14)),
  });
  const [renewDate, setRenewDate] = useState(toDateInputValue(addDays(new Date(), 7)));

  const loadData = async () => {
    try {
      setLoading(true);
      const [loansData, booksData, usersData] = await Promise.all([
        api.getLoans(),
        api.getBooks(),
        api.getUsers(),
      ]);
      setLoans(loansData);
      setBooks(booksData);
      setUsers(usersData);
    } catch (error: any) {
      toast.error(error.message || "No se pudieron cargar los préstamos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const activeStudents = useMemo(
    () => users.filter((user) => user.rol === "estudiante" && user.estado === "activo"),
    [users],
  );

  const availableBooks = useMemo(
    () => books.filter((book) => book.estado === "DISPONIBLE" && Number(book.cantidadDisponible) > 0),
    [books],
  );

  const filteredLoans = useMemo(() => {
    return loans
      .filter((loan) => {
        const status = getLoanViewStatus(loan);
        const term = searchTerm.toLowerCase();
        const bookTitle = loan.libro?.titulo?.toLowerCase() || "";
        const borrower = loan.estudiante?.user?.nombreCompleto?.toLowerCase() || "";
        const borrowerMail = loan.estudiante?.user?.correoInstitucional?.toLowerCase() || "";
        const matchesSearch = !term || bookTitle.includes(term) || borrower.includes(term) || borrowerMail.includes(term);
        const matchesFilter =
          activeFilter === "all" ||
          (activeFilter === "active" && status === "active") ||
          (activeFilter === "overdue" && status === "overdue") ||
          (activeFilter === "returned" && status === "returned");
        return matchesSearch && matchesFilter;
      })
      .sort((left, right) => new Date(right.fechaPrestamo).getTime() - new Date(left.fechaPrestamo).getTime());
  }, [activeFilter, loans, searchTerm]);

  const activeLoans = useMemo(
    () => filteredLoans.filter((loan) => getLoanViewStatus(loan) === "active"),
    [filteredLoans],
  );

  const overdueLoans = useMemo(
    () => filteredLoans.filter((loan) => getLoanViewStatus(loan) === "overdue"),
    [filteredLoans],
  );

  const returnedLoans = useMemo(
    () => filteredLoans.filter((loan) => getLoanViewStatus(loan) === "returned"),
    [filteredLoans],
  );

  const metrics = useMemo(() => {
    const allActive = loans.filter((loan) => getLoanViewStatus(loan) === "active").length;
    const allOverdue = loans.filter((loan) => getLoanViewStatus(loan) === "overdue").length;
    const allReturned = loans.filter((loan) => getLoanViewStatus(loan) === "returned").length;
    const renewals = loans.filter((loan) => getLoanViewStatus(loan) === "active").length;
    const finesTotal = loans.reduce((sum, loan) => sum + Number(loan.multa?.monto || 0), 0);

    return [
      { label: "Préstamos activos", value: allActive },
      { label: "Renovaciones", value: renewals },
      { label: "Devoluciones", value: allReturned },
      { label: "Préstamos vencidos", value: allOverdue },
      { label: "Historial de préstamos", value: loans.length },
      { label: "Multas asociadas", value: formatCurrency(finesTotal) },
    ];
  }, [loans]);

  const openRenewDialog = (loan: LoanRecord) => {
    setSelectedLoan(loan);
    setRenewDate(toDateInputValue(addDays(new Date(loan.fechaLimiteDevolucion), 7)));
    setShowRenewDialog(true);
  };

  const openReturnDialog = (loan: LoanRecord) => {
    setSelectedLoan(loan);
    setShowReturnDialog(true);
  };

  const handleCreateLoan = async () => {
    if (!newLoan.libroId || !newLoan.estudianteId || !newLoan.fechaLimiteDevolucion) {
      toast.error("Completa los datos del préstamo");
      return;
    }

    setSaving(true);
    try {
      await api.createLoan({
        libroId: Number(newLoan.libroId),
        estudianteId: Number(newLoan.estudianteId),
        fechaLimiteDevolucion: newLoan.fechaLimiteDevolucion,
      });
      toast.success("Préstamo registrado exitosamente");
      setShowCreateDialog(false);
      setNewLoan({
        libroId: "",
        estudianteId: "",
        fechaLimiteDevolucion: toDateInputValue(addDays(new Date(), 14)),
      });
      await loadData();
    } catch (error: any) {
      toast.error(error.message || "No se pudo registrar el préstamo");
    } finally {
      setSaving(false);
    }
  };

  const handleRenewLoan = async () => {
    if (!selectedLoan || !renewDate) {
      toast.error("Selecciona una nueva fecha de devolución");
      return;
    }

    setRenewing(true);
    try {
      await api.updateLoan(selectedLoan.id, { fechaLimiteDevolucion: renewDate });
      toast.success("Renovación registrada exitosamente");
      setShowRenewDialog(false);
      setSelectedLoan(null);
      await loadData();
    } catch (error: any) {
      toast.error(error.message || "No se pudo renovar el préstamo");
    } finally {
      setRenewing(false);
    }
  };

  const handleReturnLoan = async () => {
    if (!selectedLoan) return;

    setReturning(true);
    try {
      await api.returnLoan(selectedLoan.id);
      toast.success("Devolución registrada exitosamente");
      setShowReturnDialog(false);
      setSelectedLoan(null);
      await loadData();
    } catch (error: any) {
      toast.error(error.message || "No se pudo registrar la devolución");
    } finally {
      setReturning(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-background transition-colors dark:bg-[#202445]">
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
            <Select value={activeFilter} onValueChange={(value: LoanFilter) => setActiveFilter(value)}>
              <SelectTrigger className="h-9 w-[150px] justify-end border-0 bg-transparent px-0 text-right shadow-none focus:ring-0 dark:bg-transparent dark:text-white">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent className="dark:border-gray-700 dark:bg-gray-800">
                <SelectItem value="all" className="dark:text-white dark:focus:bg-gray-700">Todos</SelectItem>
                <SelectItem value="active" className="dark:text-white dark:focus:bg-gray-700">Activos</SelectItem>
                <SelectItem value="overdue" className="dark:text-white dark:focus:bg-gray-700">Vencidos</SelectItem>
                <SelectItem value="returned" className="dark:text-white dark:focus:bg-gray-700">Devueltos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="h-10 shrink-0 bg-[#6C5CE7] hover:bg-[#5b4bd1]">
            <Plus size={16} className="mr-2" />Registrar préstamo
          </Button>
        </div>

        <Card className="mt-2 flex min-h-0 flex-1 gap-0 overflow-hidden border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden p-0 last:pb-0 [&:last-child]:pb-0">
            {loading ? (
              <div className="flex flex-1 items-center justify-center px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                Cargando préstamos...
              </div>
            ) : (
              <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col">
                <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                  <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1 lg:grid-cols-5 dark:bg-gray-900/60">
                    <TabsTrigger value="activos">Préstamos activos</TabsTrigger>
                    <TabsTrigger value="renovaciones">Renovaciones</TabsTrigger>
                    <TabsTrigger value="devoluciones">Devoluciones</TabsTrigger>
                    <TabsTrigger value="vencidos">Préstamos vencidos</TabsTrigger>
                    <TabsTrigger value="historial">Historial</TabsTrigger>
                  </TabsList>
                </div>

                <div className="min-h-0 flex-1 overflow-hidden">
                  <TabsContent value="activos" className="mt-0 h-full">
                    <LoanTable
                      loans={activeLoans}
                      emptyMessage="No hay préstamos activos para mostrar."
                      onRenew={openRenewDialog}
                      onReturn={openReturnDialog}
                      actionMode="active"
                    />
                  </TabsContent>

                  <TabsContent value="renovaciones" className="mt-0 h-full">
                    <LoanTable
                      loans={activeLoans}
                      emptyMessage="No hay préstamos disponibles para renovación."
                      onRenew={openRenewDialog}
                      onReturn={openReturnDialog}
                      actionMode="renew"
                    />
                  </TabsContent>

                  <TabsContent value="devoluciones" className="mt-0 h-full">
                    <LoanTable
                      loans={[...activeLoans, ...overdueLoans]}
                      emptyMessage="No hay préstamos pendientes de devolución."
                      onRenew={openRenewDialog}
                      onReturn={openReturnDialog}
                      actionMode="return"
                    />
                  </TabsContent>

                  <TabsContent value="vencidos" className="mt-0 h-full">
                    <LoanTable
                      loans={overdueLoans}
                      emptyMessage="No hay préstamos vencidos actualmente."
                      onRenew={openRenewDialog}
                      onReturn={openReturnDialog}
                      actionMode="return"
                    />
                  </TabsContent>

                  <TabsContent value="historial" className="mt-0 h-full">
                    <LoanTable
                      loans={filteredLoans}
                      emptyMessage="No hay historial de préstamos disponible."
                      onRenew={openRenewDialog}
                      onReturn={openReturnDialog}
                      actionMode="history"
                    />
                  </TabsContent>
                </div>
              </Tabs>
            )}
          </CardContent>
        </Card>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl dark:border-gray-700 dark:bg-gray-800">
            <DialogHeader>
              <DialogTitle className="dark:text-white">Registrar préstamo</DialogTitle>
              <DialogDescription className="dark:text-gray-400">
                Selecciona el libro, el estudiante y la fecha límite de devolución.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-4 py-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label className="mb-2 block dark:text-gray-300">Libro</Label>
                <Select value={newLoan.libroId || "NONE"} onValueChange={(value) => setNewLoan((prev) => ({ ...prev, libroId: value === "NONE" ? "" : value }))}>
                  <SelectTrigger className="dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                    <SelectValue placeholder="Selecciona un libro" />
                  </SelectTrigger>
                  <SelectContent className="dark:border-gray-700 dark:bg-gray-800">
                    <SelectItem value="NONE" className="dark:text-white dark:focus:bg-gray-700">Seleccionar</SelectItem>
                    {availableBooks.map((book) => (
                      <SelectItem key={book.id} value={String(book.id)} className="dark:text-white dark:focus:bg-gray-700">
                        {book.titulo} · {book.cantidadDisponible} disponible(s)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label className="mb-2 block dark:text-gray-300">Estudiante</Label>
                <Select value={newLoan.estudianteId || "NONE"} onValueChange={(value) => setNewLoan((prev) => ({ ...prev, estudianteId: value === "NONE" ? "" : value }))}>
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
              <div className="md:col-span-2">
                <Label className="mb-2 block dark:text-gray-300">Fecha límite de devolución</Label>
                <Input
                  type="date"
                  value={newLoan.fechaLimiteDevolucion}
                  onChange={(e) => setNewLoan((prev) => ({ ...prev, fechaLimiteDevolucion: e.target.value }))}
                  className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="dark:border-gray-600 dark:text-gray-300">
                Cancelar
              </Button>
              <Button onClick={handleCreateLoan} disabled={saving} className="bg-[#6C5CE7] hover:bg-[#5b4bd1]">
                {saving ? "Registrando..." : "Registrar préstamo"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showRenewDialog} onOpenChange={setShowRenewDialog}>
          <DialogContent className="dark:border-gray-700 dark:bg-gray-800">
            <DialogHeader>
              <DialogTitle className="dark:text-white">Renovar préstamo</DialogTitle>
              <DialogDescription className="dark:text-gray-400">
                Ajusta la nueva fecha límite para {selectedLoan?.libro?.titulo || "este libro"}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label className="mb-2 block dark:text-gray-300">Nueva fecha límite</Label>
                <Input
                  type="date"
                  value={renewDate}
                  onChange={(e) => setRenewDate(e.target.value)}
                  className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRenewDialog(false)} className="dark:border-gray-600 dark:text-gray-300">
                Cancelar
              </Button>
              <Button onClick={handleRenewLoan} disabled={renewing} className="bg-[#6C5CE7] hover:bg-[#5b4bd1]">
                {renewing ? "Renovando..." : "Guardar renovación"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
          <DialogContent className="dark:border-gray-700 dark:bg-gray-800">
            <DialogHeader>
              <DialogTitle className="dark:text-white">Registrar devolución</DialogTitle>
              <DialogDescription className="dark:text-gray-400">
                Confirma la devolución de {selectedLoan?.libro?.titulo || "este libro"} por parte de {selectedLoan?.estudiante?.user?.nombreCompleto || "este usuario"}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-4">
              <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50">
                <p className="text-sm text-gray-600 dark:text-gray-300">Fecha de préstamo: {formatDate(selectedLoan?.fechaPrestamo)}</p>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Fecha límite: {formatDate(selectedLoan?.fechaLimiteDevolucion)}</p>
              </div>
              {selectedLoan?.multa?.monto ? (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-300">
                  Este préstamo ya registra una multa de {formatCurrency(Number(selectedLoan.multa.monto))}.
                </div>
              ) : null}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowReturnDialog(false)} className="dark:border-gray-600 dark:text-gray-300">
                Cancelar
              </Button>
              <Button onClick={handleReturnLoan} disabled={returning} className="bg-[#6C5CE7] hover:bg-[#5b4bd1]">
                {returning ? "Procesando..." : "Confirmar devolución"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};
