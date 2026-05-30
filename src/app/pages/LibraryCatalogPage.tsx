import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Sidebar } from "../components/Sidebar";
import { TopBar } from "../components/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Search, Eye } from "lucide-react";
import { toast } from "sonner";
import { api, type BookCategory } from "../../services/api";

interface LibraryBook {
  id: number; titulo: string; autor: string; categoria: string | null;
  editorial: string | null; cantidadDisponible: number; estado: string;
}

const formatCategory = (categoria: string | null) => {
  if (!categoria) return "Sin categoría";
  const labels: Record<BookCategory, string> = {
    INGENIERIA_SISTEMAS: "Ingeniería de Sistemas", INGENIERIA_CIVIL: "Ingeniería Civil",
    INGENIERIA_INDUSTRIAL: "Ingeniería Industrial", ADMINISTRACION: "Administración",
    CONTADURIA: "Contaduría", ECONOMIA: "Economía", DERECHO: "Derecho",
    MEDICINA: "Medicina", ENFERMERIA: "Enfermería", PSICOLOGIA: "Psicología",
    EDUCACION: "Educación", MATEMATICAS: "Matemáticas",
  };
  return labels[categoria as BookCategory] || categoria;
};

export const LibraryCatalogPage = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("all");
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBooks = async () => {
      setLoading(true);
      try {
        const data = await api.getBooks();
        setBooks(data);
      } catch (error: any) {
        toast.error(error.message || "No se pudieron cargar los libros");
      } finally {
        setLoading(false);
      }
    };
    void loadBooks();
  }, []);

  const categories = useMemo(() => {
    const uniqueCategories = new Set(books.map((book) => book.categoria).filter((value): value is string => Boolean(value)));
    return Array.from(uniqueCategories).sort((a, b) => a.localeCompare(b));
  }, [books]);

  const filteredBooks = books.filter((book) => {
    const matchesSearch = book.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || book.autor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = category === "all" || book.categoria === category;
    return matchesSearch && matchesCategory;
  });

  const getStatusClasses = (estado: string) => {
    if (estado === "DISPONIBLE") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
    if (estado === "MANTENIMIENTO") return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
    return "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300";
  };

  const formatStatus = (estado: string) => {
    if (estado === "DISPONIBLE") return "Disponible";
    if (estado === "MANTENIMIENTO") return "Mantenimiento";
    if (estado === "BAJA") return "Baja";
    return estado;
  };

  return (
    <div className="h-screen overflow-hidden bg-background transition-colors">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <TopBar onMenuToggle={() => setSidebarOpen((prev) => !prev)} />
      <main className="lg:ml-64 mt-16 box-border flex h-[calc(100vh-4rem)] flex-col overflow-y-auto p-4">
        <div className="page-header">
          <h1 className="page-title">Catálogo de Biblioteca</h1>
          <p className="page-subtitle">Consulta el inventario completo de libros y recursos disponibles.</p>
        </div>

        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 dark:border-gray-700 dark:bg-gray-800">
            <Search className="shrink-0 text-gray-400" size={18} />
            <Input 
              placeholder="Buscar por título o autor..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="h-10 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 dark:bg-transparent dark:text-white dark:placeholder-gray-400" 
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-10 w-full lg:w-64 border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
              <SelectItem value="all">Todas las Categorías</SelectItem>
              {categories.map((item) => <SelectItem key={item} value={item}>{formatCategory(item)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Card className="flex-1 overflow-hidden border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <CardContent className="h-full p-0">
            <div className="h-full overflow-auto">
              <Table className="w-full text-sm">
                <TableHeader>
                  <TableRow className="border-b border-gray-100 bg-[#EEF2FF] dark:border-gray-700 dark:bg-[#2F355F]">
                    <TableHead className="h-11 font-semibold text-gray-700 dark:text-[#E6EBFF]">Título</TableHead>
                    <TableHead className="h-11 font-semibold text-gray-700 dark:text-[#E6EBFF]">Autor</TableHead>
                    <TableHead className="h-11 font-semibold text-gray-700 dark:text-[#E6EBFF]">Categoría</TableHead>
                    <TableHead className="h-11 font-semibold text-gray-700 dark:text-[#E6EBFF]">Editorial</TableHead>
                    <TableHead className="h-11 font-semibold text-gray-700 dark:text-[#E6EBFF]">Estado</TableHead>
                    <TableHead className="h-11 font-semibold text-gray-700 dark:text-[#E6EBFF]">Copias</TableHead>
                    <TableHead className="h-11 text-right font-semibold text-gray-700 dark:text-[#E6EBFF]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="[&_tr:last-child]:border-0">
                  {loading ? (
                    <TableRow><TableCell colSpan={7} className="py-12 text-center text-gray-500">Cargando libros...</TableCell></TableRow>
                  ) : filteredBooks.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="py-12 text-center text-gray-500">No se encontraron libros.</TableCell></TableRow>
                  ) : (
                    filteredBooks.map((book) => (
                      <TableRow key={book.id} className="border-b border-gray-100 transition-colors hover:bg-gray-50/80 dark:border-gray-700 dark:hover:bg-gray-700/50">
                        <TableCell className="font-medium text-gray-700 dark:text-white">{book.titulo}</TableCell>
                        <TableCell className="text-gray-600 dark:text-[#B7BDD6]">{book.autor}</TableCell>
                        <TableCell className="text-gray-600 dark:text-[#B7BDD6]">{formatCategory(book.categoria)}</TableCell>
                        <TableCell className="text-gray-600 dark:text-[#B7BDD6]">{book.editorial || "Sin editorial"}</TableCell>
                        <TableCell><span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClasses(book.estado)}`}>{formatStatus(book.estado)}</span></TableCell>
                        <TableCell className="text-gray-600 dark:text-[#B7BDD6]">{book.cantidadDisponible}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" onClick={() => navigate(`/library/book/${book.id}`)} className="text-[#6C5CE7] hover:bg-[#6C5CE7]/10">
                            <Eye size={16} className="mr-2" />Ver
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};
