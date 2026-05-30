import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "../components/Sidebar";
import { TopBar } from "../components/TopBar";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Label } from "../components/ui/label";
import { BookOpen, CalendarRange, DoorOpen, Download, FileSpreadsheet, FileText, GraduationCap, Search, ShieldAlert, Users } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../services/api";
import { useAuth } from "../context/AuthContext";

interface UserRecord {
  id: number;
  nombreCompleto: string;
  correoInstitucional: string;
  rol: "estudiante" | "docente" | "bibliotecario" | "administrativo" | "supervisor";
}

interface LoanRecord {
  id: number;
  fechaPrestamo: string;
  fechaLimiteDevolucion: string;
  estado: string;
  libro?: { titulo?: string };
  estudiante?: { user?: { id?: number; nombreCompleto?: string; correoInstitucional?: string } };
  multa?: { monto?: number };
}

interface FineRecord {
  id: number;
  monto: number;
  estado: string;
  diasRetraso: number;
  fechaGeneracion?: string;
  prestamo?: {
    libro?: { titulo?: string };
    estudiante?: { user?: { id?: number; nombreCompleto?: string; correoInstitucional?: string } };
  };
}

interface RoomReservationRecord {
  id: number;
  fechaReserva: string;
  horaInicio: string;
  horaFin: string;
  estado: string;
  sala?: { nombre?: string };
  estudiante?: { user?: { id?: number; nombreCompleto?: string } };
  docente?: { user?: { id?: number; nombreCompleto?: string } };
}

interface GradeRecord {
  id: number;
  valor: number;
  periodoAcademico: string;
  fechaRegistro?: string;
  estudianteId: number;
  asignaturaId: number;
}

interface SubjectRecord {
  id: number;
  nombre: string;
}

const formatDate = (value?: string | null) => {
  if (!value) return "Sin fecha";
  return new Date(value).toLocaleDateString("es-ES");
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value);

const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.URL.revokeObjectURL(url);
};

const toCsvBlob = (headers: string[], rows: string[][]) => {
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(","))
    .join("\n");
  return new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
};

const toHtmlReportBlob = (title: string, headers: string[], rows: string[][]) => {
  const tableHeaders = headers.map((header) => `<th>${header}</th>`).join("");
  const tableRows = rows
    .map((row) => `<tr>${row.map((cell) => `<td>${String(cell ?? "")}</td>`).join("")}</tr>`)
    .join("");

  const html = `
    <!doctype html>
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #1f2937; }
          h1 { margin-bottom: 8px; }
          p { margin-top: 0; margin-bottom: 24px; color: #6b7280; }
          table { width: 100%; border-collapse: collapse; font-size: 14px; }
          th, td { border: 1px solid #d1d5db; padding: 10px; text-align: left; }
          th { background: #eef2ff; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <p>Generado el ${new Date().toLocaleDateString("es-ES")}</p>
        <table>
          <thead><tr>${tableHeaders}</tr></thead>
          <tbody>${tableRows}</tbody>
        </table>
      </body>
    </html>
  `;

  return new Blob([html], { type: "text/html;charset=utf-8" });
};

export const ReportsPage = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);
  const [tab, setTab] = useState("biblioteca");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [startDate, setStartDate] = useState(() => new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [academicPeriod, setAcademicPeriod] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [subjects, setSubjects] = useState<SubjectRecord[]>([]);
  const [loans, setLoans] = useState<LoanRecord[]>([]);
  const [fines, setFines] = useState<FineRecord[]>([]);
  const [reservations, setReservations] = useState<RoomReservationRecord[]>([]);
  const [grades, setGrades] = useState<GradeRecord[]>([]);

  useEffect(() => {
    if (user) {
      void loadData();
      // Set default tab based on role
      if (user.rol === "supervisor") setTab("salas");
      else if (user.rol === "bibliotecario") setTab("biblioteca");
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const isAdmin = user?.rol === "administrativo";
      const isLibrarian = user?.rol === "bibliotecario";
      const isSupervisor = user?.rol === "supervisor";

      const [usersData, subjectsData, loansData, finesData, reservationsData, gradesData] = await Promise.all([
        isAdmin ? api.getUsers().catch(() => []) : Promise.resolve([]),
        isAdmin ? api.getSubjects().catch(() => []) : Promise.resolve([]),
        (isAdmin || isLibrarian) ? api.getLoans().catch(() => []) : Promise.resolve([]),
        (isAdmin || isLibrarian) ? api.getAllFines().catch(() => ({ fines: [] })) : Promise.resolve({ fines: [] }),
        (isAdmin || isSupervisor) ? api.getRoomReservations().catch(() => []) : Promise.resolve([]),
        isAdmin ? api.getGrades().catch(() => []) : Promise.resolve([]),
      ]);

      setUsers(usersData);
      setSubjects(subjectsData);
      setLoans(loansData);
      setFines(finesData.fines || []);
      setReservations(reservationsData);
      setGrades(gradesData);
    } catch (error: any) {
      toast.error(error.message || "No se pudieron cargar los reportes");
    } finally {
      setLoading(false);
    }
  };

  const periods = useMemo(
    () => Array.from(new Set(grades.map((grade) => grade.periodoAcademico).filter(Boolean))).sort(),
    [grades],
  );

  const matchesSearch = (values: Array<string | undefined>) => {
    const term = searchTerm.toLowerCase();
    if (!term) return true;
    return values.some((value) => value?.toLowerCase().includes(term));
  };

  const withinRange = (value?: string) => {
    if (!value) return false;
    const date = new Date(value);
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    return date >= start && date <= end;
  };

  const filteredLoans = useMemo(() => {
    return loans.filter((loan) => {
      const loanUser = loan.estudiante?.user;
      const matchesRole = roleFilter === "all" || users.find((item) => item.id === loanUser?.id)?.rol === roleFilter;
      const matchesUser = userFilter === "all" || String(loanUser?.id) === userFilter;
      return (
        withinRange(loan.fechaPrestamo) &&
        matchesRole &&
        matchesUser &&
        matchesSearch([loan.libro?.titulo, loanUser?.nombreCompleto, loanUser?.correoInstitucional])
      );
    });
  }, [loans, roleFilter, userFilter, searchTerm, startDate, endDate, users]);

  const filteredFines = useMemo(() => {
    return fines.filter((fine) => {
      const fineUser = fine.prestamo?.estudiante?.user;
      const matchesRole = roleFilter === "all" || users.find((item) => item.id === fineUser?.id)?.rol === roleFilter;
      const matchesUser = userFilter === "all" || String(fineUser?.id) === userFilter;
      return (
        withinRange(fine.fechaGeneracion) &&
        matchesRole &&
        matchesUser &&
        matchesSearch([fine.prestamo?.libro?.titulo, fineUser?.nombreCompleto, fineUser?.correoInstitucional, fine.estado])
      );
    });
  }, [fines, roleFilter, userFilter, searchTerm, startDate, endDate, users]);

  const filteredReservations = useMemo(() => {
    return reservations.filter((reservation) => {
      const resUser = reservation.estudiante?.user || reservation.docente?.user;
      const userRole = users.find((item) => item.id === resUser?.id)?.rol;
      const matchesRole = roleFilter === "all" || userRole === roleFilter;
      const matchesUser = userFilter === "all" || String(resUser?.id) === userFilter;
      return (
        withinRange(reservation.fechaReserva) &&
        matchesRole &&
        matchesUser &&
        matchesSearch([reservation.sala?.nombre, resUser?.nombreCompleto, reservation.estado])
      );
    });
  }, [reservations, roleFilter, userFilter, searchTerm, startDate, endDate, users]);

  const filteredGrades = useMemo(() => {
    return grades.filter((grade) => {
      const gradeUser = users.find((item) => item.id === grade.estudianteId);
      const matchesRole = roleFilter === "all" || gradeUser?.rol === roleFilter;
      const matchesUser = userFilter === "all" || String(grade.estudianteId) === userFilter;
      const matchesPeriod = academicPeriod === "all" || grade.periodoAcademico === academicPeriod;
      const matchesSubject = subjectFilter === "all" || String(grade.asignaturaId) === subjectFilter;
      return (
        withinRange(grade.fechaRegistro || startDate) &&
        matchesRole &&
        matchesUser &&
        matchesPeriod &&
        matchesSubject &&
        matchesSearch([gradeUser?.nombreCompleto, gradeUser?.correoInstitucional])
      );
    });
  }, [academicPeriod, grades, roleFilter, searchTerm, startDate, endDate, subjectFilter, userFilter, users]);

  const metrics = useMemo(() => {
    const multasPendientes = filteredFines.filter((fine) => fine.estado === "PENDIENTE").reduce((sum, fine) => sum + Number(fine.monto), 0);
    return [
      { label: "Reporte de biblioteca", value: filteredLoans.length },
      { label: "Reporte de salas", value: filteredReservations.length },
      { label: "Reporte de multas", value: filteredFines.length },
      { label: "Reporte académico", value: filteredGrades.length },
      { label: "Exportar PDF/Excel", value: 4 },
      { label: "Multas filtradas", value: formatCurrency(multasPendientes) },
    ];
  }, [filteredFines, filteredGrades.length, filteredLoans.length, filteredReservations.length]);

  const triggerBackendExport = async (kind: "biblioteca" | "academico", format: "pdf" | "excel") => {
    setExporting(`${kind}-${format}`);
    try {
      if (kind === "biblioteca") {
        const blob = await api.downloadLoansReport({
          startDate,
          endDate,
          format,
          estudianteId: userFilter === "all" ? undefined : Number(userFilter),
        });
        downloadBlob(blob, `reporte-biblioteca-${Date.now()}.${format === "excel" ? "xlsx" : "pdf"}`);
      } else {
        const blob = await api.downloadGradesReport({
          startDate,
          endDate,
          format,
          periodoAcademico: academicPeriod === "all" ? undefined : academicPeriod,
          asignaturaId: subjectFilter === "all" ? undefined : Number(subjectFilter),
          estudianteId: userFilter === "all" ? undefined : Number(userFilter),
        });
        downloadBlob(blob, `reporte-academico-${Date.now()}.${format === "excel" ? "xlsx" : "pdf"}`);
      }
      toast.success("Reporte exportado correctamente");
    } catch (error: any) {
      toast.error(error.message || "No se pudo exportar el reporte");
    } finally {
      setExporting(null);
    }
  };

  const triggerLocalExport = (kind: "salas" | "multas", format: "pdf" | "excel") => {
    try {
      if (kind === "salas") {
        const headers = ["Sala", "Usuario", "Fecha", "Horario", "Estado"];
        const rows = filteredReservations.map((reservation) => [
          reservation.sala?.nombre || "Sala",
          reservation.estudiante?.user?.nombreCompleto || reservation.docente?.user?.nombreCompleto || "Usuario",
          formatDate(reservation.fechaReserva),
          `${reservation.horaInicio.slice(0, 5)} - ${reservation.horaFin.slice(0, 5)}`,
          reservation.estado,
        ]);
        const blob = format === "excel"
          ? toCsvBlob(headers, rows)
          : toHtmlReportBlob("Reporte de salas", headers, rows);
        downloadBlob(blob, `reporte-salas-${Date.now()}.${format === "excel" ? "csv" : "html"}`);
      } else {
        const headers = ["Usuario", "Libro", "Monto", "Estado", "Días retraso", "Fecha"];
        const rows = filteredFines.map((fine) => [
          fine.prestamo?.estudiante?.user?.nombreCompleto || "Usuario",
          fine.prestamo?.libro?.titulo || "Libro",
          formatCurrency(Number(fine.monto)),
          fine.estado,
          String(fine.diasRetraso || 0),
          formatDate(fine.fechaGeneracion),
        ]);
        const blob = format === "excel"
          ? toCsvBlob(headers, rows)
          : toHtmlReportBlob("Reporte de multas", headers, rows);
        downloadBlob(blob, `reporte-multas-${Date.now()}.${format === "excel" ? "csv" : "html"}`);
      }
      toast.success("Reporte exportado correctamente");
    } catch {
      toast.error("No se pudo exportar el reporte");
    }
  };

  const reportCardClass = "border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900/40";
  const isAdmin = user?.rol === "administrativo";
  const isLibrarian = user?.rol === "bibliotecario";
  const isSupervisor = user?.rol === "supervisor";

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

        <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_180px_180px_180px]">
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 dark:border-gray-700 dark:bg-gray-800">
            <Search className="shrink-0 text-gray-400" size={18} />
            <Input
              placeholder="Buscar"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 dark:bg-transparent dark:text-white dark:placeholder-gray-400"
            />
          </div>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-10 dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-10 dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="h-10 dark:border-gray-700 dark:bg-gray-800 dark:text-white">
              <SelectValue placeholder="Rol" />
            </SelectTrigger>
            <SelectContent className="dark:border-gray-700 dark:bg-gray-800">
              <SelectItem value="all">Todos los roles</SelectItem>
              <SelectItem value="estudiante">Estudiantes</SelectItem>
              <SelectItem value="docente">Docentes</SelectItem>
              <SelectItem value="bibliotecario">Bibliotecarios</SelectItem>
              <SelectItem value="administrativo">Administrativos</SelectItem>
              <SelectItem value="supervisor">Supervisores</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-3 flex flex-col gap-3 lg:flex-row">
          {isAdmin && (
            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger className="h-10 w-full lg:w-[320px] dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                <SelectValue placeholder="Usuario" />
              </SelectTrigger>
              <SelectContent className="dark:border-gray-700 dark:bg-gray-800">
                <SelectItem value="all">Todos los usuarios</SelectItem>
                {users.map((item) => (
                  <SelectItem key={item.id} value={String(item.id)}>{item.nombreCompleto}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {isAdmin && (
            <Select value={academicPeriod} onValueChange={setAcademicPeriod}>
              <SelectTrigger className="h-10 w-full lg:w-[220px] dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                <SelectValue placeholder="Período académico" />
              </SelectTrigger>
              <SelectContent className="dark:border-gray-700 dark:bg-gray-800">
                <SelectItem value="all">Todos los períodos</SelectItem>
                {periods.map((period) => (
                  <SelectItem key={period} value={period}>{period}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {isAdmin && (
            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
              <SelectTrigger className="h-10 w-full lg:w-[260px] dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                <SelectValue placeholder="Materia" />
              </SelectTrigger>
              <SelectContent className="dark:border-gray-700 dark:bg-gray-800">
                <SelectItem value="all">Todas las materias</SelectItem>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={String(subject.id)}>{subject.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <Card className="mt-2 flex min-h-0 flex-1 gap-0 overflow-hidden border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden p-0 last:pb-0 [&:last-child]:pb-0">
            {loading ? (
              <div className="flex flex-1 items-center justify-center px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                Cargando reportes...
              </div>
            ) : (
              <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col">
                <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                  <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1 lg:grid-cols-4 dark:bg-gray-900/60">
                    {(isAdmin || isLibrarian) && <TabsTrigger value="biblioteca">Biblioteca</TabsTrigger>}
                    {(isAdmin || isSupervisor) && <TabsTrigger value="salas">Salas</TabsTrigger>}
                    {(isAdmin || isLibrarian) && <TabsTrigger value="multas">Multas</TabsTrigger>}
                    {isAdmin && <TabsTrigger value="academico">Académico</TabsTrigger>}
                  </TabsList>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto p-4">
                  {(isAdmin || isLibrarian) && (
                    <TabsContent value="biblioteca" className="mt-0">
                      <Card className={reportCardClass}>
                        <CardContent className="p-4">
                          <div className="mb-4 flex items-center justify-between gap-4">
                            <div>
                              <div className="mb-2 flex items-center gap-2">
                                <BookOpen size={18} className="text-[#6C5CE7]" />
                                <h2 className="font-semibold text-gray-900 dark:text-white">Reporte de biblioteca</h2>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-[#B7BDD6]">Préstamos, devoluciones y trazabilidad por fechas, rol o usuario.</p>
                            </div>
                            <div className="flex gap-2">
                              <Button onClick={() => void triggerBackendExport("biblioteca", "pdf")} disabled={exporting !== null} className="bg-[#6C5CE7] hover:bg-[#5b4bd1]">
                                <FileText size={15} className="mr-2" />PDF
                              </Button>
                              <Button onClick={() => void triggerBackendExport("biblioteca", "excel")} disabled={exporting !== null} variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                                <FileSpreadsheet size={15} className="mr-2" />Excel
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-3">
                            {filteredLoans.length === 0 ? (
                              <p className="text-gray-500">No hay préstamos para los filtros seleccionados.</p>
                            ) : (
                              filteredLoans.slice(0, 8).map((loan) => (
                                <div key={loan.id} className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50">
                                  <p className="font-medium text-gray-700 dark:text-white">{loan.libro?.titulo || "Libro"}</p>
                                  <p className="text-sm text-gray-500 dark:text-[#B7BDD6]">{loan.estudiante?.user?.nombreCompleto || "Usuario"} · {formatDate(loan.fechaPrestamo)} · {loan.estado}</p>
                                </div>
                              ))
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  )}

                  {(isAdmin || isSupervisor) && (
                    <TabsContent value="salas" className="mt-0">
                      <Card className={reportCardClass}>
                        <CardContent className="p-4">
                          <div className="mb-4 flex items-center justify-between gap-4">
                            <div>
                              <div className="mb-2 flex items-center gap-2">
                                <DoorOpen size={18} className="text-[#6C5CE7]" />
                                <h2 className="font-semibold text-gray-900 dark:text-white">Reporte de salas</h2>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-[#B7BDD6]">Ocupación, reservas y uso de salas filtrado por fechas, rol o usuario.</p>
                            </div>
                            <div className="flex gap-2">
                              <Button onClick={() => triggerLocalExport("salas", "pdf")} className="bg-[#6C5CE7] hover:bg-[#5b4bd1]">
                                <Download size={15} className="mr-2" />PDF
                              </Button>
                              <Button onClick={() => triggerLocalExport("salas", "excel")} variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                                <FileSpreadsheet size={15} className="mr-2" />Excel
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-3">
                            {filteredReservations.length === 0 ? (
                              <p className="text-gray-500">No hay reservas para los filtros seleccionados.</p>
                            ) : (
                              filteredReservations.slice(0, 8).map((reservation) => (
                                <div key={reservation.id} className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50">
                                  <p className="font-medium text-gray-700 dark:text-white">{reservation.sala?.nombre || "Sala"}</p>
                                  <p className="text-sm text-gray-500 dark:text-[#B7BDD6]">
                                    {reservation.estudiante?.user?.nombreCompleto || reservation.docente?.user?.nombreCompleto || "Usuario"} · {formatDate(reservation.fechaReserva)} · {reservation.estado}
                                  </p>
                                </div>
                              ))
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  )}

                  {(isAdmin || isLibrarian) && (
                    <TabsContent value="multas" className="mt-0">
                      <Card className={reportCardClass}>
                        <CardContent className="p-4">
                          <div className="mb-4 flex items-center justify-between gap-4">
                            <div>
                              <div className="mb-2 flex items-center gap-2">
                                <ShieldAlert size={18} className="text-[#6C5CE7]" />
                                <h2 className="font-semibold text-gray-900 dark:text-white">Reporte de multas</h2>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-[#B7BDD6]">Multas activas, pagadas y por retraso dentro del rango filtrado.</p>
                            </div>
                            <div className="flex gap-2">
                              <Button onClick={() => triggerLocalExport("multas", "pdf")} className="bg-[#6C5CE7] hover:bg-[#5b4bd1]">
                                <FileText size={15} className="mr-2" />PDF
                              </Button>
                              <Button onClick={() => triggerLocalExport("multas", "excel")} variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                                <FileSpreadsheet size={15} className="mr-2" />Excel
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-3">
                            {filteredFines.length === 0 ? (
                              <p className="text-gray-500">No hay multas para los filtros seleccionados.</p>
                            ) : (
                              filteredFines.slice(0, 8).map((fine) => (
                                <div key={fine.id} className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50">
                                  <p className="font-medium text-gray-700 dark:text-white">{fine.prestamo?.libro?.titulo || "Libro"}</p>
                                  <p className="text-sm text-gray-500 dark:text-[#B7BDD6]">
                                    {fine.prestamo?.estudiante?.user?.nombreCompleto || "Usuario"} · {formatCurrency(Number(fine.monto))} · {fine.estado}
                                  </p>
                                </div>
                              ))
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  )}

                  {isAdmin && (
                    <TabsContent value="academico" className="mt-0">
                      <Card className={reportCardClass}>
                        <CardContent className="p-4">
                          <div className="mb-4 flex items-center justify-between gap-4">
                            <div>
                              <div className="mb-2 flex items-center gap-2">
                                <GraduationCap size={18} className="text-[#6C5CE7]" />
                                <h2 className="font-semibold text-gray-900 dark:text-white">Reporte académico</h2>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-[#B7BDD6]">Calificaciones filtradas por fecha, rol, usuario, período académico y materia.</p>
                            </div>
                            <div className="flex gap-2">
                              <Button onClick={() => void triggerBackendExport("academico", "pdf")} disabled={exporting !== null} className="bg-[#6C5CE7] hover:bg-[#5b4bd1]">
                                <FileText size={15} className="mr-2" />PDF
                              </Button>
                              <Button onClick={() => void triggerBackendExport("academico", "excel")} disabled={exporting !== null} variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                                <FileSpreadsheet size={15} className="mr-2" />Excel
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-3">
                            {filteredGrades.length === 0 ? (
                              <p className="text-gray-500">No hay notas para los filtros seleccionados.</p>
                            ) : (
                              filteredGrades.slice(0, 8).map((grade) => (
                                <div key={grade.id} className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50">
                                  <p className="font-medium text-gray-700 dark:text-white">{users.find((u) => u.id === grade.estudianteId)?.nombreCompleto || "Estudiante"}</p>
                                  <p className="text-sm text-gray-500 dark:text-[#B7BDD6]">
                                    {subjects.find((s) => s.id === grade.asignaturaId)?.nombre || "Materia"} · {grade.periodoAcademico} · Nota {Number(grade.valor).toFixed(1)}
                                  </p>
                                </div>
                              ))
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  )}
                </div>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};
