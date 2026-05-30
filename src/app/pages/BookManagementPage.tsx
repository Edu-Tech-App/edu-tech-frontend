import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "../components/Sidebar";
import { TopBar } from "../components/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { Label } from "../components/ui/label";
import { BookOpen, CalendarClock, Edit, History, Plus, RotateCcw, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, API_URL_PUBLIC, BOOK_CATEGORY_OPTIONS, type BookCategory } from "../../services/api";

interface Book {
  id: number;
  titulo: string;
  autor: string;
  categoria: string | null;
  editorial: string | null;
  portadaUrl?: string | null;
  cantidadDisponible: number;
  estado: string;
}

interface LoanRecord {
  id: number;
  fechaPrestamo: string;
  fechaDevolucion?: string | null;
  fechaLimite?: string | null;
  estado: string;
  libroId: number;
  libro?: { id: number; titulo: string };
  estudiante?: { user?: { nombreCompleto: string } };
  multa?: { monto?: number; estado?: string };
}

const formatCategory = (categoria: string | null) => {
  if (!categoria) return "Sin categoría";

  const labels: Record<BookCategory, string> = {
    INGENIERIA_SISTEMAS: "Ingeniería de Sistemas",
    INGENIERIA_CIVIL: "Ingeniería Civil",
    INGENIERIA_INDUSTRIAL: "Ingeniería Industrial",
    ADMINISTRACION: "Administración",
    CONTADURIA: "Contaduría",
    ECONOMIA: "Economía",
    DERECHO: "Derecho",
    MEDICINA: "Medicina",
    ENFERMERIA: "Enfermería",
    PSICOLOGIA: "Psicología",
    EDUCACION: "Educación",
    MATEMATICAS: "Matemáticas",
  };

  return labels[categoria as BookCategory] || categoria;
};

const formatDate = (value?: string | null) => {
  if (!value) return "Sin fecha";
  return new Date(value).toLocaleDateString("es-ES");
};

const formatStatus = (estado: string) => {
  if (estado === "DISPONIBLE") return "Disponible";
  if (estado === "MANTENIMIENTO") return "Mantenimiento";
  if (estado === "BAJA") return "Baja";
  if (estado === "ACTIVO") return "Activo";
  if (estado === "DEVUELTO") return "Devuelto";
  if (estado === "VENCIDO") return "Vencido";
  return estado;
};

const getBookStatusClass = (estado: string) => {
  if (estado === "DISPONIBLE") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
  if (estado === "MANTENIMIENTO") return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
  return "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300";
};

const getLoanStatusClass = (estado: string) => {
  if (estado === "ACTIVO") return "bg-[#6C5CE7]/12 text-[#5b4bd1] dark:bg-[#6C5CE7]/20 dark:text-[#d9d4ff]";
  if (estado === "DEVUELTO") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
  if (estado === "VENCIDO") return "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300";
  return "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200";
};

export const BookManagementPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [tab, setTab] = useState("catalogo");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [returningLoanId, setReturningLoanId] = useState<number | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [loans, setLoans] = useState<LoanRecord[]>([]);
  const [formData, setFormData] = useState({
    titulo: "",
    autor: "",
    categoria: "",
    editorial: "",
    cantidadDisponible: 1,
    estado: "DISPONIBLE",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [booksData, loansData] = await Promise.all([api.getBooks(), api.getLoans().catch(() => [])]);
      setBooks(booksData);
      setLoans(loansData);
    } catch (error: any) {
      toast.error(error.message || "No se pudieron cargar los datos de biblioteca");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        book.titulo.toLowerCase().includes(term) ||
        book.autor.toLowerCase().includes(term) ||
        (book.categoria || "").toLowerCase().includes(term);
      const matchesCategory = categoryFilter === "all" || book.categoria === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [books, categoryFilter, searchTerm]);

  const filteredLoans = useMemo(() => {
    return loans.filter((loan) => {
      const bookTitle = loan.libro?.titulo || "";
      const borrower = loan.estudiante?.user?.nombreCompleto || "";
      return (
        bookTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        borrower.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [loans, searchTerm]);

  const metrics = useMemo(() => {
    const inventory = books.reduce((sum, book) => sum + Number(book.cantidadDisponible || 0), 0);
    const available = books.filter((book) => book.estado === "DISPONIBLE").length;
    const activeLoans = loans.filter((loan) => loan.estado === "ACTIVO").length;
    const historicalLoans = loans.length;

    return [
      { label: "Catálogo de libros", value: books.length },
      { label: "Inventario", value: inventory },
      { label: "Disponibilidad", value: available },
      { label: "Libros prestados", value: activeLoans },
      { label: "Historial de préstamos", value: historicalLoans },
    ];
  }, [books, loans]);

  const categories = useMemo(() => {
    const uniqueCategories = new Set(books.map((book) => book.categoria).filter((value): value is string => Boolean(value)));
    return Array.from(uniqueCategories).sort((left, right) => left.localeCompare(right));
  }, [books]);

  const openDialog = (book?: Book) => {
    if (book) {
      setEditingBook(book);
      setCoverFile(null);
      setFormData({
        titulo: book.titulo,
        autor: book.autor,
        categoria: book.categoria || "",
        editorial: book.editorial || "",
        cantidadDisponible: book.cantidadDisponible,
        estado: book.estado,
      });
    } else {
      setEditingBook(null);
      setCoverFile(null);
      setFormData({
        titulo: "",
        autor: "",
        categoria: "",
        editorial: "",
        cantidadDisponible: 1,
        estado: "DISPONIBLE",
      });
    }
    setShowDialog(true);
  };

  const handleSaveBook = async () => {
    if (!formData.titulo || !formData.autor) {
      toast.error("Completa los campos obligatorios");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        titulo: formData.titulo,
        autor: formData.autor,
        categoria: formData.categoria || undefined,
        editorial: formData.editorial || undefined,
        cantidadDisponible: formData.cantidadDisponible,
        estado: formData.estado as "DISPONIBLE" | "MANTENIMIENTO" | "BAJA",
      };

      if (editingBook) {
        await api.updateBook(editingBook.id, payload);
        if (coverFile) await api.uploadBookCover(editingBook.id, coverFile);
        toast.success("Libro actualizado exitosamente");
      } else {
        const createdBook = await api.createBook(payload);
        if (coverFile) await api.uploadBookCover(createdBook.id, coverFile);
        toast.success("Libro registrado exitosamente");
      }

      setShowDialog(false);
      await loadData();
    } catch (error: any) {
      toast.error(error.message || "No se pudo guardar el libro");
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!bookToDelete) return;

    setDeleting(true);
    try {
      await api.deleteBook(bookToDelete.id);
      toast.success("Libro eliminado exitosamente");
      setShowDeleteDialog(false);
      setBookToDelete(null);
      await loadData();
    } catch (error: any) {
      toast.error(error.message || "No se pudo eliminar el libro");
    } finally {
      setDeleting(false);
    }
  };

  const handleReturnLoan = async (loanId: number) => {
    setReturningLoanId(loanId);
    try {
      await api.returnLoan(loanId);
      toast.success("Devolución registrada exitosamente");
      await loadData();
    } catch (error: any) {
      toast.error(error.message || "No se pudo registrar la devolución");
    } finally {
      setReturningLoanId(null);
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-background transition-colors">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <TopBar onMenuToggle={() => setSidebarOpen((prev) => !prev)} />
      <main className="lg:ml-64 mt-16 box-border flex h-[calc(100vh-4rem)] flex-col overflow-hidden p-4">
        <div className="grid grid-cols-2 gap-2 xl:grid-cols-5">
          {metrics.map((item) => (
            <Card key={item.label} className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
              <CardContent className="px-3 py-2">
                <p className="text-[12px] leading-tight text-gray-500 dark:text-[#B7BDD6]">{item.label}</p>
                <p className="mt-0.5 text-[1.45rem] font-bold leading-none text-gray-800 dark:text-[#F5F7FF]">{item.value}</p>
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
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-9 w-[170px] justify-end border-0 bg-transparent px-0 text-right shadow-none focus:ring-0 dark:bg-transparent dark:text-white">
                <SelectValue placeholder="Categorías" />
              </SelectTrigger>
              <SelectContent className="dark:border-gray-700 dark:bg-gray-800">
                <SelectItem value="all" className="dark:text-white dark:focus:bg-gray-700">Todas</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category} className="dark:text-white dark:focus:bg-gray-700">
                    {formatCategory(category)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => openDialog()} className="h-10 shrink-0 bg-[#6C5CE7] hover:bg-[#5b4bd1]">
            <Plus size={16} className="mr-2" />Registrar libro
          </Button>
        </div>

        <Card className="mt-2 flex min-h-0 flex-1 gap-0 overflow-hidden border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden p-0 last:pb-0 [&:last-child]:pb-0">
            {loading ? (
              <div className="flex flex-1 items-center justify-center px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                Cargando biblioteca...
              </div>
            ) : (
              <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col">
                <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                  <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1 lg:grid-cols-4 dark:bg-gray-900/60">
                    <TabsTrigger value="catalogo">Catálogo</TabsTrigger>
                    <TabsTrigger value="inventario">Inventario</TabsTrigger>
                    <TabsTrigger value="prestados">Prestados</TabsTrigger>
                    <TabsTrigger value="historial">Historial</TabsTrigger>
                  </TabsList>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto">
                  <TabsContent value="catalogo" className="mt-0">
                    <div className="min-h-0 overflow-auto">
                      <table className="w-full min-w-[980px] table-fixed text-sm">
                        <colgroup>
                          <col className="w-[24%]" />
                          <col className="w-[18%]" />
                          <col className="w-[18%]" />
                          <col className="w-[15%]" />
                          <col className="w-[10%]" />
                          <col className="w-[15%]" />
                        </colgroup>
                        <thead className="[&_tr]:border-b [&_tr]:border-gray-100 [&_tr]:bg-[#EEF2FF] dark:[&_tr]:border-gray-700 dark:[&_tr]:bg-[#2F355F]">
                          <tr>
                            <th className="sticky top-0 z-10 h-11 bg-[#EEF2FF] px-4 text-left align-middle text-sm font-semibold text-gray-700 dark:bg-[#2F355F] dark:text-[#E6EBFF]">Catálogo de libros</th>
                            <th className="sticky top-0 z-10 h-11 bg-[#EEF2FF] px-4 text-left align-middle text-sm font-semibold text-gray-700 dark:bg-[#2F355F] dark:text-[#E6EBFF]">Autor</th>
                            <th className="sticky top-0 z-10 h-11 bg-[#EEF2FF] px-4 text-left align-middle text-sm font-semibold text-gray-700 dark:bg-[#2F355F] dark:text-[#E6EBFF]">Categorías</th>
                            <th className="sticky top-0 z-10 h-11 bg-[#EEF2FF] px-4 text-left align-middle text-sm font-semibold text-gray-700 dark:bg-[#2F355F] dark:text-[#E6EBFF]">Editorial</th>
                            <th className="sticky top-0 z-10 h-11 bg-[#EEF2FF] px-4 text-left align-middle text-sm font-semibold text-gray-700 dark:bg-[#2F355F] dark:text-[#E6EBFF]">Inventario</th>
                            <th className="sticky top-0 z-10 h-11 bg-[#EEF2FF] px-4 text-right align-middle text-sm font-semibold text-gray-700 dark:bg-[#2F355F] dark:text-[#E6EBFF]">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                          {filteredBooks.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                                No hay libros registrados con esos criterios.
                              </td>
                            </tr>
                          ) : (
                            filteredBooks.map((book) => (
                              <tr key={book.id} className="border-b border-gray-100 transition-colors hover:bg-gray-50/80 dark:border-gray-700 dark:hover:bg-gray-700/50">
                                <td className="px-4 py-3 align-middle lg:py-2">
                                  <div className="flex items-center gap-3">
                                    <div className="relative flex h-12 w-9 shrink-0 flex-col items-center justify-center gap-0.5 rounded-md bg-[#EEF2FF] dark:bg-[#2F355F]">
                                      <BookOpen size={14} className="text-[#6C5CE7] dark:text-[#a99df5]" />
                                      {!book.portadaUrl && (
                                        <span className="text-[7px] font-semibold leading-none tracking-tight text-[#6C5CE7] dark:text-[#a99df5]">SIN<br/>IMG</span>
                                      )}
                                      {book.portadaUrl && (
                                        <img
                                          src={`${API_URL_PUBLIC}${book.portadaUrl}`}
                                          alt={book.titulo}
                                          className="absolute inset-0 h-full w-full rounded-md object-cover"
                                          onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                            const label = e.currentTarget.previousElementSibling as HTMLElement | null;
                                            if (label) label.style.display = 'flex';
                                          }}
                                        />
                                      )}
                                    </div>
                                    <div>
                                      <p className="truncate font-medium text-gray-700 dark:text-white">{book.titulo}</p>
                                      <p className="mt-1 text-xs text-gray-500 dark:text-[#B7BDD6]">{formatStatus(book.estado)}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="truncate px-4 py-3 align-middle text-gray-700 dark:text-gray-400 lg:py-2">{book.autor}</td>
                                <td className="truncate px-4 py-3 align-middle text-gray-700 dark:text-gray-400 lg:py-2">{formatCategory(book.categoria)}</td>
                                <td className="truncate px-4 py-3 align-middle text-gray-700 dark:text-gray-400 lg:py-2">{book.editorial || "Sin editorial"}</td>
                                <td className="px-4 py-3 align-middle lg:py-2">
                                  <div className="flex items-center gap-2">
                                    <Badge className={getBookStatusClass(book.estado)}>{book.cantidadDisponible} copia(s)</Badge>
                                  </div>
                                </td>
                                <td className="px-4 py-3 align-middle lg:py-2">
                                  <div className="flex justify-end gap-1">
                                    <Button size="sm" variant="ghost" onClick={() => openDialog(book)} title="Editar libro">
                                      <Edit size={16} />
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => { setBookToDelete(book); setShowDeleteDialog(true); }} title="Eliminar libro">
                                      <Trash2 size={16} className="text-rose-600" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </TabsContent>

                  <TabsContent value="inventario" className="mt-0 space-y-3 p-4">
                    {filteredBooks.length === 0 ? (
                      <p className="text-gray-500 dark:text-gray-400">No hay inventario para mostrar.</p>
                    ) : (
                      filteredBooks.map((book) => (
                        <div key={book.id} className="rounded-lg bg-gray-50 p-3.5 dark:bg-gray-700/50">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="font-medium text-gray-700 dark:text-white">{book.titulo}</p>
                              <p className="text-sm text-gray-500 dark:text-[#B7BDD6]">{formatCategory(book.categoria)} · {book.editorial || "Sin editorial"}</p>
                            </div>
                            <div className="text-right">
                              <Badge className={getBookStatusClass(book.estado)}>{formatStatus(book.estado)}</Badge>
                              <p className="mt-2 text-sm font-medium text-gray-700 dark:text-white">{book.cantidadDisponible} unidades</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </TabsContent>

                  <TabsContent value="prestados" className="mt-0 space-y-3 p-4">
                    {filteredLoans.filter((loan) => loan.estado === "ACTIVO").length === 0 ? (
                      <p className="text-gray-500 dark:text-gray-400">No hay libros prestados actualmente.</p>
                    ) : (
                      filteredLoans
                        .filter((loan) => loan.estado === "ACTIVO")
                        .map((loan) => (
                          <div key={loan.id} className="rounded-lg bg-gray-50 p-3.5 dark:bg-gray-700/50">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                              <div>
                                <p className="font-medium text-gray-700 dark:text-white">{loan.libro?.titulo || "Libro prestado"}</p>
                                <p className="text-sm text-gray-500 dark:text-[#B7BDD6]">
                                  {loan.estudiante?.user?.nombreCompleto || "Usuario"} · Prestado el {formatDate(loan.fechaPrestamo)}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={getLoanStatusClass(loan.estado)}>Activo</Badge>
                                <Button
                                  size="sm"
                                  onClick={() => void handleReturnLoan(loan.id)}
                                  disabled={returningLoanId === loan.id}
                                  className="bg-[#6C5CE7] hover:bg-[#5b4bd1]"
                                >
                                  <RotateCcw size={14} className="mr-2" />
                                  {returningLoanId === loan.id ? "Procesando..." : "Devoluciones"}
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                    )}
                  </TabsContent>

                  <TabsContent value="historial" className="mt-0 space-y-3 p-4">
                    {filteredLoans.length === 0 ? (
                      <p className="text-gray-500 dark:text-gray-400">No hay historial de préstamos disponible.</p>
                    ) : (
                      filteredLoans.map((loan) => (
                        <div key={loan.id} className="rounded-lg bg-gray-50 p-3.5 dark:bg-gray-700/50">
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                              <p className="font-medium text-gray-700 dark:text-white">{loan.libro?.titulo || "Movimiento de préstamo"}</p>
                              <p className="text-sm text-gray-500 dark:text-[#B7BDD6]">
                                {loan.estudiante?.user?.nombreCompleto || "Usuario"} · Inicio {formatDate(loan.fechaPrestamo)} · Fin {formatDate(loan.fechaDevolucion || loan.fechaLimite)}
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge className={getLoanStatusClass(loan.estado)}>{formatStatus(loan.estado)}</Badge>
                              {loan.multa?.monto ? (
                                <p className="mt-2 text-xs text-gray-500 dark:text-[#B7BDD6]">Multa: {loan.multa.monto} · {loan.multa.estado}</p>
                              ) : (
                                <p className="mt-2 text-xs text-gray-500 dark:text-[#B7BDD6]">Sin multa asociada</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </TabsContent>
                </div>
              </Tabs>
            )}
          </CardContent>
        </Card>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-2xl dark:border-gray-700 dark:bg-gray-800">
            <DialogHeader>
              <DialogTitle className="dark:text-white">{editingBook ? "Editar libro" : "Registrar libro"}</DialogTitle>
              <DialogDescription className="dark:text-gray-400">
                {editingBook ? "Actualiza la información del libro." : "Completa los datos del nuevo libro en biblioteca."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-4 py-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label className="mb-2 block dark:text-gray-300">Portada del libro</Label>
                <div className="flex items-center gap-4">
                  <Input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} className="dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                  {editingBook?.portadaUrl && (
                    <img src={`${API_URL_PUBLIC}${editingBook.portadaUrl}`} alt={editingBook.titulo} className="h-20 w-14 rounded-md border object-cover" />
                  )}
                </div>
              </div>
              <div className="md:col-span-2">
                <Label className="mb-2 block dark:text-gray-300">Título</Label>
                <Input value={formData.titulo} onChange={(e) => setFormData({ ...formData, titulo: e.target.value })} className="dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
              </div>
              <div className="md:col-span-2">
                <Label className="mb-2 block dark:text-gray-300">Autor</Label>
                <Input value={formData.autor} onChange={(e) => setFormData({ ...formData, autor: e.target.value })} className="dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
              </div>
              <div>
                <Label className="mb-2 block dark:text-gray-300">Categorías</Label>
                <Select value={formData.categoria || "NONE"} onValueChange={(value) => setFormData({ ...formData, categoria: value === "NONE" ? "" : value })}>
                  <SelectTrigger className="dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent className="dark:border-gray-700 dark:bg-gray-800">
                    <SelectItem value="NONE" className="dark:text-white dark:focus:bg-gray-700">Sin categoría</SelectItem>
                    {BOOK_CATEGORY_OPTIONS.map((category) => (
                      <SelectItem key={category} value={category} className="dark:text-white dark:focus:bg-gray-700">
                        {formatCategory(category)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block dark:text-gray-300">Editorial</Label>
                <Input value={formData.editorial} onChange={(e) => setFormData({ ...formData, editorial: e.target.value })} className="dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
              </div>
              <div>
                <Label className="mb-2 block dark:text-gray-300">Inventario</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.cantidadDisponible}
                  onChange={(e) => setFormData({ ...formData, cantidadDisponible: Number(e.target.value) || 0 })}
                  className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <Label className="mb-2 block dark:text-gray-300">Disponibilidad</Label>
                <Select value={formData.estado} onValueChange={(value) => setFormData({ ...formData, estado: value })}>
                  <SelectTrigger className="dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dark:border-gray-700 dark:bg-gray-800">
                    <SelectItem value="DISPONIBLE" className="dark:text-white dark:focus:bg-gray-700">Disponible</SelectItem>
                    <SelectItem value="MANTENIMIENTO" className="dark:text-white dark:focus:bg-gray-700">Mantenimiento</SelectItem>
                    <SelectItem value="BAJA" className="dark:text-white dark:focus:bg-gray-700">Baja</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)} className="dark:border-gray-600 dark:text-gray-300">
                Cancelar
              </Button>
              <Button onClick={handleSaveBook} disabled={saving} className="bg-[#6C5CE7] hover:bg-[#5b4bd1]">
                {saving ? "Guardando..." : editingBook ? "Guardar cambios" : "Registrar libro"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="dark:border-gray-700 dark:bg-gray-800">
            <DialogHeader>
              <DialogTitle className="dark:text-white">Eliminar libro</DialogTitle>
              <DialogDescription className="dark:text-gray-400">
                ¿Deseas eliminar "{bookToDelete?.titulo}" del catálogo?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="dark:border-gray-600 dark:text-gray-300">
                Cancelar
              </Button>
              <Button onClick={handleConfirmDelete} disabled={deleting} className="bg-rose-600 hover:bg-rose-700">
                {deleting ? "Eliminando..." : "Eliminar libro"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};
