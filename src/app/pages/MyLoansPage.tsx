import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "../components/Sidebar";
import { TopBar } from "../components/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { BookOpen, Calendar, AlertCircle, CheckCircle, Search, Clock } from "lucide-react";
import { Input } from "../components/ui/input";
import { useAuth } from "../context/AuthContext";
import { api } from "../../services/api";

interface Loan {
  id: number;
  libroId: number;
  estudianteId: number;
  fechaPrestamo: string;
  fechaLimiteDevolucion: string;
  fechaDevolucionReal: string | null;
  estado: "ACTIVO" | "DEVUELTO" | "VENCIDO" | "PERDIDO";
  libro: { id: number; titulo: string; autor: string };
}

const formatDate = (value?: string | null) => {
  if (!value) return "Sin fecha";
  return new Date(value).toLocaleDateString("es-ES");
};

export const MyLoansPage = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [tab, setTab] = useState("activos");

  useEffect(() => {
    if (!user?.id) return;
    const fetch = async () => {
      try {
        setLoading(true);
        const data = await api.getStudentLoans(user.id);
        setLoans(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Error cargando préstamos:", e);
      } finally {
        setLoading(false);
      }
    };
    void fetch();
  }, [user?.id]);

  const filteredLoans = useMemo(() => {
    return loans.filter((loan) =>
      loan.libro?.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.libro?.autor.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [loans, searchTerm]);

  const activeLoans = useMemo(() => 
    filteredLoans.filter((l) => l.estado === "ACTIVO" || l.estado === "VENCIDO"),
    [filteredLoans]
  );
  
  const returnedLoans = useMemo(() => 
    filteredLoans.filter((l) => l.estado === "DEVUELTO"),
    [filteredLoans]
  );

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getStatusBadge = (loan: Loan) => {
    if (loan.estado === "DEVUELTO") return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">Devuelto</Badge>;
    const days = getDaysUntilDue(loan.fechaLimiteDevolucion);
    if (days < 0 || loan.estado === "VENCIDO") return <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">Vencido</Badge>;
    if (days <= 3) return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">Próximo a vencer</Badge>;
    return <Badge className="bg-[#6C5CE7]/12 text-[#5b4bd1] dark:bg-[#6C5CE7]/20 dark:text-[#d9d4ff]">Activo</Badge>;
  };

  const metrics = useMemo(() => [
    { label: "Préstamos activos", value: loans.filter(l => l.estado === "ACTIVO" || l.estado === "VENCIDO").length },
    { label: "Libros vencidos", value: loans.filter(l => getDaysUntilDue(l.fechaLimiteDevolucion) < 0).length },
    { label: "Total devueltos", value: loans.filter(l => l.estado === "DEVUELTO").length },
    { label: "Historial total", value: loans.length },
  ], [loans]);

  const cardClass = "border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800";

  return (
    <div className="h-screen overflow-hidden bg-background transition-colors">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <TopBar onMenuToggle={() => setSidebarOpen((prev) => !prev)} />
      
      <main className="lg:ml-64 mt-16 box-border flex h-[calc(100vh-4rem)] flex-col overflow-hidden p-4">
        <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
          {metrics.map((item) => (
            <Card key={item.label} className={cardClass}>
              <CardContent className="px-3 py-2">
                <p className="text-[12px] leading-tight text-gray-500 dark:text-[#B7BDD6]">{item.label}</p>
                <p className="mt-0.5 text-[1.45rem] font-bold leading-none text-gray-800 dark:text-[#F5F7FF]">{item.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 dark:border-gray-700 dark:bg-gray-800">
          <Search className="shrink-0 text-gray-400" size={18} />
          <Input
            placeholder="Buscar por libro o autor"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 dark:bg-transparent dark:text-white dark:placeholder-gray-400"
          />
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
                  <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1 lg:w-[400px] dark:bg-gray-900/60">
                    <TabsTrigger value="activos">Préstamos en curso</TabsTrigger>
                    <TabsTrigger value="historial">Historial completo</TabsTrigger>
                  </TabsList>
                </div>

                <div className="min-h-0 flex-1 overflow-auto">
                  <TabsContent value="activos" className="mt-0">
                    <Table className="w-full min-w-[800px] table-fixed text-sm">
                      <colgroup>
                        <col className="w-[40%]" />
                        <col className="w-[20%]" />
                        <col className="w-[20%]" />
                        <col className="w-[20%]" />
                      </colgroup>
                      <thead className="[&_tr]:border-b [&_tr]:border-gray-100 [&_tr]:bg-[#EEF2FF] dark:[&_tr]:border-gray-700 dark:[&_tr]:bg-[#2F355F]">
                        <tr>
                          <th className="sticky top-0 z-10 h-11 bg-[#EEF2FF] px-4 text-left align-middle text-sm font-semibold text-gray-700 dark:bg-[#2F355F] dark:text-[#E6EBFF]">Libro</th>
                          <th className="sticky top-0 z-10 h-11 bg-[#EEF2FF] px-4 text-left align-middle text-sm font-semibold text-gray-700 dark:bg-[#2F355F] dark:text-[#E6EBFF]">Préstamo</th>
                          <th className="sticky top-0 z-10 h-11 bg-[#EEF2FF] px-4 text-left align-middle text-sm font-semibold text-gray-700 dark:bg-[#2F355F] dark:text-[#E6EBFF]">Vencimiento</th>
                          <th className="sticky top-0 z-10 h-11 bg-[#EEF2FF] px-4 text-left align-middle text-sm font-semibold text-gray-700 dark:bg-[#2F355F] dark:text-[#E6EBFF]">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="[&_tr:last-child]:border-0">
                        {activeLoans.length === 0 ? (
                          <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">No tienes préstamos activos.</td></tr>
                        ) : (
                          activeLoans.map((loan) => (
                            <tr key={loan.id} className="border-b border-gray-100 transition-colors hover:bg-gray-50/80 dark:border-gray-700 dark:hover:bg-gray-700/50">
                              <td className="px-4 py-3 align-middle lg:py-2">
                                <p className="truncate font-medium text-gray-700 dark:text-white">{loan.libro?.titulo}</p>
                                <p className="text-xs text-gray-500 dark:text-[#B7BDD6]">{loan.libro?.autor}</p>
                              </td>
                              <td className="px-4 py-3 align-middle text-gray-600 dark:text-gray-400 lg:py-2">{formatDate(loan.fechaPrestamo)}</td>
                              <td className="px-4 py-3 align-middle text-gray-600 dark:text-gray-400 lg:py-2">{formatDate(loan.fechaLimiteDevolucion)}</td>
                              <td className="px-4 py-3 align-middle lg:py-2">{getStatusBadge(loan)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </Table>
                  </TabsContent>

                  <TabsContent value="historial" className="mt-0">
                    <Table className="w-full min-w-[800px] table-fixed text-sm">
                      <colgroup>
                        <col className="w-[35%]" />
                        <col className="w-[15%]" />
                        <col className="w-[15%]" />
                        <col className="w-[15%]" />
                        <col className="w-[20%]" />
                      </colgroup>
                      <thead className="[&_tr]:border-b [&_tr]:border-gray-100 [&_tr]:bg-[#EEF2FF] dark:[&_tr]:border-gray-700 dark:[&_tr]:bg-[#2F355F]">
                        <tr>
                          <th className="sticky top-0 z-10 h-11 bg-[#EEF2FF] px-4 text-left align-middle text-sm font-semibold text-gray-700 dark:bg-[#2F355F] dark:text-[#E6EBFF]">Libro</th>
                          <th className="sticky top-0 z-10 h-11 bg-[#EEF2FF] px-4 text-left align-middle text-sm font-semibold text-gray-700 dark:bg-[#2F355F] dark:text-[#E6EBFF]">Préstamo</th>
                          <th className="sticky top-0 z-10 h-11 bg-[#EEF2FF] px-4 text-left align-middle text-sm font-semibold text-gray-700 dark:bg-[#2F355F] dark:text-[#E6EBFF]">Devolución</th>
                          <th className="sticky top-0 z-10 h-11 bg-[#EEF2FF] px-4 text-left align-middle text-sm font-semibold text-gray-700 dark:bg-[#2F355F] dark:text-[#E6EBFF]">Días Tarde</th>
                          <th className="sticky top-0 z-10 h-11 bg-[#EEF2FF] px-4 text-left align-middle text-sm font-semibold text-gray-700 dark:bg-[#2F355F] dark:text-[#E6EBFF]">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="[&_tr:last-child]:border-0">
                        {returnedLoans.length === 0 ? (
                          <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No hay historial de devoluciones.</td></tr>
                        ) : (
                          returnedLoans.map((loan) => (
                            <tr key={loan.id} className="border-b border-gray-100 transition-colors hover:bg-gray-50/80 dark:border-gray-700 dark:hover:bg-gray-700/50">
                              <td className="px-4 py-3 align-middle lg:py-2">
                                <p className="truncate font-medium text-gray-700 dark:text-white">{loan.libro?.titulo}</p>
                              </td>
                              <td className="px-4 py-3 align-middle text-gray-600 dark:text-gray-400 lg:py-2">{formatDate(loan.fechaPrestamo)}</td>
                              <td className="px-4 py-3 align-middle text-gray-600 dark:text-gray-400 lg:py-2">{formatDate(loan.fechaDevolucionReal)}</td>
                              <td className="px-4 py-3 align-middle text-gray-600 dark:text-gray-400 lg:py-2">
                                {loan.fechaDevolucionReal && getDaysUntilDue(loan.fechaLimiteDevolucion) < 0 ? Math.abs(getDaysUntilDue(loan.fechaLimiteDevolucion)) : 0}
                              </td>
                              <td className="px-4 py-3 align-middle lg:py-2">{getStatusBadge(loan)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </Table>
                  </TabsContent>
                </div>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};
