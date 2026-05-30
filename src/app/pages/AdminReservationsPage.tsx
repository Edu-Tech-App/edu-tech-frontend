import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Sidebar } from "../components/Sidebar";
import { TopBar } from "../components/TopBar";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { BookMarked, CalendarCheck, CheckCircle2, Clock3, DoorOpen, History, RefreshCcw, Search, XCircle } from "lucide-react";
import { api } from "../../services/api";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";

interface RoomReservationRecord {
  id: number;
  salaId: number;
  fechaReserva: string;
  horaInicio: string;
  horaFin: string;
  estado: "ACTIVA" | "COMPLETADA" | "CANCELADA";
  sala?: { nombre?: string };
  estudiante?: { user?: { nombreCompleto?: string } };
  docente?: { user?: { nombreCompleto?: string } };
}

interface BookReservationRecord {
  id: number;
  fechaPrestamo: string;
  fechaLimiteDevolucion?: string;
  fechaDevolucion?: string;
  estado: "ACTIVO" | "DEVUELTO" | "VENCIDO" | "PERDIDO";
  libro?: { titulo?: string };
  estudiante?: { user?: { nombreCompleto?: string } };
}

type UnifiedReservation = {
  id: string;
  type: "room" | "book";
  status: "pending" | "approved" | "rejected" | "completed" | "rescheduled" | "cancelled";
  title: string;
  subtitle: string;
  dateLabel: string;
};

const mapRoomStatus = (status: RoomReservationRecord["estado"]): UnifiedReservation["status"] => {
  if (status === "ACTIVA") return "approved";
  if (status === "COMPLETADA") return "completed";
  return "cancelled";
};

const mapBookStatus = (status: BookReservationRecord["estado"]): UnifiedReservation["status"] => {
  if (status === "ACTIVO") return "approved";
  if (status === "DEVUELTO") return "completed";
  if (status === "VENCIDO") return "rejected";
  return "cancelled";
};

const formatDate = (value?: string) => {
  if (!value) return "Sin fecha";
  return new Date(value).toLocaleDateString("es-ES");
};

const getStatusLabel = (status: UnifiedReservation["status"]) => {
  const labels: Record<UnifiedReservation["status"], string> = {
    pending: "Solicitudes pendientes",
    approved: "Reservas aprobadas",
    rejected: "Reservas rechazadas",
    completed: "Historial de reservas",
    rescheduled: "Reprogramaciones",
    cancelled: "Cancelaciones",
  };
  return labels[status];
};

const getStatusClass = (status: UnifiedReservation["status"]) => {
  const classes: Record<UnifiedReservation["status"], string> = {
    pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    approved: "bg-[#6C5CE7]/12 text-[#5b4bd1] dark:bg-[#6C5CE7]/20 dark:text-[#d9d4ff]",
    rejected: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
    completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    rescheduled: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
    cancelled: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
  };
  return classes[status];
};

export const AdminReservationsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [tab, setTab] = useState("resumen");
  const [loading, setLoading] = useState(true);
  const [roomReservations, setRoomReservations] = useState<RoomReservationRecord[]>([]);
  const [bookReservations, setBookReservations] = useState<BookReservationRecord[]>([]);

  useEffect(() => {
    if (user) void loadData();
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const isAdmin = user?.rol === "administrativo";
      const isSupervisor = user?.rol === "supervisor";

      const [roomsData, booksData] = await Promise.all([
        (isAdmin || isSupervisor) ? api.getRoomReservations().catch(() => []) : Promise.resolve([]),
        isAdmin ? api.getLoans().catch(() => []) : Promise.resolve([]),
      ]);
      setRoomReservations(roomsData);
      setBookReservations(booksData);
    } catch (error: any) {
      toast.error(error.message || "No se pudieron cargar las reservas");
    } finally {
      setLoading(false);
    }
  };

  const unifiedReservations = useMemo<UnifiedReservation[]>(() => {
    const roomItems = roomReservations.map((reservation) => ({
      id: `room-${reservation.id}`,
      type: "room" as const,
      status: mapRoomStatus(reservation.estado),
      title: reservation.sala?.nombre || `Sala ${reservation.salaId}`,
      subtitle: reservation.estudiante?.user?.nombreCompleto || reservation.docente?.user?.nombreCompleto || "Usuario no disponible",
      dateLabel: `${formatDate(reservation.fechaReserva)} · ${reservation.horaInicio.slice(0, 5)} - ${reservation.horaFin.slice(0, 5)}`,
    }));

    const bookItems = bookReservations.map((loan) => ({
      id: `book-${loan.id}`,
      type: "book" as const,
      status: mapBookStatus(loan.estado),
      title: loan.libro?.titulo || "Reserva de libro",
      subtitle: loan.estudiante?.user?.nombreCompleto || "Usuario no disponible",
      dateLabel: `${formatDate(loan.fechaPrestamo)} · límite ${formatDate(loan.fechaLimiteDevolucion || loan.fechaDevolucion)}`,
    }));

    return [...roomItems, ...bookItems]
      .filter((item) => {
        const term = searchTerm.toLowerCase();
        return item.title.toLowerCase().includes(term) || item.subtitle.toLowerCase().includes(term);
      })
      .sort((left, right) => right.id.localeCompare(left.id));
  }, [bookReservations, roomReservations, searchTerm]);

  const metrics = useMemo(() => {
    const roomCount = roomReservations.length;
    const bookCount = bookReservations.length;
    const pendingCount = unifiedReservations.filter((item) => item.status === "pending").length;
    const approvedCount = unifiedReservations.filter((item) => item.status === "approved").length;
    const rejectedCount = unifiedReservations.filter((item) => item.status === "rejected").length;
    const cancelledCount = unifiedReservations.filter((item) => item.status === "cancelled").length;

    return [
      { label: "Reservas de salas", value: roomCount },
      { label: "Reservas de libros", value: bookCount },
      { label: "Solicitudes pendientes", value: pendingCount },
      { label: "Reservas aprobadas", value: approvedCount },
      { label: "Reservas rechazadas", value: rejectedCount },
      { label: "Cancelaciones", value: cancelledCount },
    ];
  }, [bookReservations.length, roomReservations.length, unifiedReservations]);

  const grouped = useMemo(() => ({
    pending: unifiedReservations.filter((item) => item.status === "pending"),
    approved: unifiedReservations.filter((item) => item.status === "approved"),
    rejected: unifiedReservations.filter((item) => item.status === "rejected"),
    rescheduled: unifiedReservations.filter((item) => item.status === "rescheduled"),
    cancelled: unifiedReservations.filter((item) => item.status === "cancelled"),
    history: unifiedReservations.filter((item) => item.status === "completed"),
  }), [unifiedReservations]);

  const renderReservationList = (items: UnifiedReservation[], emptyMessage: string) => {
    if (items.length === 0) {
      return <p className="text-sm text-gray-500 dark:text-gray-400">{emptyMessage}</p>;
    }

    return items.map((item) => (
      <div key={item.id} className="rounded-lg bg-gray-50 p-3.5 dark:bg-gray-700/50">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="font-medium text-gray-700 dark:text-white">{item.title}</p>
            <p className="text-sm text-gray-500 dark:text-[#B7BDD6]">{item.subtitle}</p>
            <p className="mt-1 text-xs text-gray-500 dark:text-[#B7BDD6]">{item.dateLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusClass(item.status)}>{getStatusLabel(item.status)}</Badge>
            <Badge className={item.type === "room" ? "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300" : "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"}>
              {item.type === "room" ? "Sala" : "Libro"}
            </Badge>
          </div>
        </div>
      </div>
    ));
  };

  const isSupervisor = user?.rol === "supervisor";
  const isAdmin = user?.rol === "administrativo";

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
          </div>
          {isSupervisor && (
            <Button onClick={() => navigate("/rooms")} className="h-10 shrink-0 bg-[#6C5CE7] hover:bg-[#5b4bd1]">
              <DoorOpen size={16} className="mr-2" />Ver salas
            </Button>
          )}
        </div>

        <Card className="mt-2 flex min-h-0 flex-1 gap-0 overflow-hidden border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden p-0 last:pb-0 [&:last-child]:pb-0">
            {loading ? (
              <div className="flex flex-1 items-center justify-center px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                Cargando reservas...
              </div>
            ) : (
              <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col">
                <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                  <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1 lg:grid-cols-4 dark:bg-gray-900/60">
                    <TabsTrigger value="resumen">Resumen</TabsTrigger>
                    <TabsTrigger value="estados">Estados</TabsTrigger>
                    {isSupervisor && <TabsTrigger value="operacion">Operación</TabsTrigger>}
                    <TabsTrigger value="historial">Historial</TabsTrigger>
                  </TabsList>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto p-4">
                  <TabsContent value="resumen" className="mt-0">
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                      <Card className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900/40">
                        <CardContent className="p-4">
                          <div className="mb-3 flex items-center gap-3">
                            <DoorOpen className="text-[#6C5CE7]" size={18} />
                            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Gestión de salas</h2>
                          </div>
                          <p className="mb-4 text-sm text-gray-600 dark:text-[#B7BDD6]">Gestión operativa de salas, consulta de disponibilidad y agenda de ocupación en tiempo real.</p>
                          <Button onClick={() => navigate(isSupervisor ? "/rooms" : "/rooms-management")} className="bg-[#6C5CE7] hover:bg-[#5b4bd1]">
                            {isSupervisor ? "Ver salas" : "Gestionar catálogo"}
                          </Button>
                        </CardContent>
                      </Card>

                      {isAdmin && (
                        <Card className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900/40">
                          <CardContent className="p-4">
                            <div className="mb-3 flex items-center gap-3">
                              <BookMarked className="text-[#6C5CE7]" size={18} />
                              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Auditoría de biblioteca</h2>
                            </div>
                            <p className="mb-4 text-sm text-gray-600 dark:text-[#B7BDD6]">Consulta de préstamos activos y devoluciones registradas en el sistema.</p>
                            <Button onClick={() => navigate("/active-loans")} variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                              Auditar préstamos
                            </Button>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="estados" className="mt-0 space-y-4">
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                      <Card className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900/40">
                        <CardContent className="p-4">
                          <div className="mb-3 flex items-center gap-2">
                            <Clock3 size={18} className="text-amber-500" />
                            <h3 className="font-semibold text-gray-900 dark:text-white">Solicitudes pendientes</h3>
                          </div>
                          {renderReservationList(grouped.pending, "No hay solicitudes pendientes.")}
                        </CardContent>
                      </Card>
                      <Card className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900/40">
                        <CardContent className="p-4">
                          <div className="mb-3 flex items-center gap-2">
                            <CheckCircle2 size={18} className="text-[#6C5CE7]" />
                            <h3 className="font-semibold text-gray-900 dark:text-white">Reservas aprobadas</h3>
                          </div>
                          {renderReservationList(grouped.approved, "No hay reservas aprobadas.")}
                        </CardContent>
                      </Card>
                      <Card className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900/40">
                        <CardContent className="p-4">
                          <div className="mb-3 flex items-center gap-2">
                            <XCircle size={18} className="text-rose-500" />
                            <h3 className="font-semibold text-gray-900 dark:text-white">Reservas rechazadas</h3>
                          </div>
                          {renderReservationList(grouped.rejected, "No hay reservas rechazadas.")}
                        </CardContent>
                      </Card>
                      <Card className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900/40">
                        <CardContent className="p-4">
                          <div className="mb-3 flex items-center gap-2">
                            <CalendarCheck size={18} className="text-slate-500" />
                            <h3 className="font-semibold text-gray-900 dark:text-white">Cancelaciones</h3>
                          </div>
                          {renderReservationList(grouped.cancelled, "No hay cancelaciones registradas.")}
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {isSupervisor && (
                    <TabsContent value="operacion" className="mt-0 space-y-4">
                      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                        <Card className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900/40">
                          <CardContent className="p-4">
                            <div className="mb-3 flex items-center gap-2">
                              <RefreshCcw size={18} className="text-sky-500" />
                              <h3 className="font-semibold text-gray-900 dark:text-white">Reprogramaciones</h3>
                            </div>
                            {renderReservationList(grouped.rescheduled, "No hay reprogramaciones pendientes.")}
                          </CardContent>
                        </Card>
                        <Card className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900/40">
                          <CardContent className="p-4">
                            <div className="mb-3 flex items-center gap-2">
                              <DoorOpen size={18} className="text-[#6C5CE7]" />
                              <h3 className="font-semibold text-gray-900 dark:text-white">Accesos rápidos</h3>
                            </div>
                            <div className="flex flex-col gap-3">
                              <Button onClick={() => navigate("/rooms")} className="justify-start bg-[#6C5CE7] hover:bg-[#5b4bd1]">
                                Consultar disponibilidad de salas
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>
                  )}

                  <TabsContent value="historial" className="mt-0">
                    <Card className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900/40">
                      <CardContent className="p-4">
                        <div className="mb-3 flex items-center gap-2">
                          <History size={18} className="text-emerald-500" />
                          <h3 className="font-semibold text-gray-900 dark:text-white">Historial de reservas</h3>
                        </div>
                        {renderReservationList(grouped.history, "No hay historial de reservas completadas.")}
                      </CardContent>
                    </Card>
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
