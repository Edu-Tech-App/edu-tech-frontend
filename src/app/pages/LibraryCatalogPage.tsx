import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { PageLayout } from "../components/PageLayout";
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
    if (estado === "DISPONIBLE") return "bg-green-100 text-green-700";
    if (estado === "MANTENIMIENTO") return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
  };

  const formatStatus = (estado: string) => {
    if (estado === "DISPONIBLE") return "Disponible";
    if (estado === "MANTENIMIENTO") return "Mantenimiento";
    if (estado === "BAJA") return "Baja";
    return estado;
  };

  return (
    <PageLayout>
      <div className="p-6">
        <Card className="border-gray-100 bg-white/70 px-6 pb-8 dark:border-gray-700 dark:bg-gray-800/40">
          <CardHeader><CardTitle className="section-title">Catálogo de Biblioteca</CardTitle></CardHeader>
          <div>
            <div className="flex gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <Input placeholder="Buscar por título o autor..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 dark:bg-gray-700 dark:border-gray-700 dark:text-white dark:placeholder-gray-400" />
              </div>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-64 dark:bg-gray-700 dark:border-gray-700 dark:text-white"><SelectValue placeholder="Categoría" /></SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                  <SelectItem value="all">Todas las Categorías</SelectItem>
                  {categories.map((item) => <SelectItem key={item} value={item}>{formatCategory(item)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="dark:border-gray-700">
                  <TableHead className="dark:text-[#F5F7FF]">Título</TableHead><TableHead className="dark:text-[#F5F7FF]">Autor</TableHead><TableHead className="dark:text-[#F5F7FF]">Categoría</TableHead>
                  <TableHead className="dark:text-[#F5F7FF]">Editorial</TableHead><TableHead className="dark:text-[#F5F7FF]">Estado</TableHead><TableHead className="dark:text-[#F5F7FF]">Copias</TableHead><TableHead className="dark:text-[#F5F7FF]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow className="dark:border-gray-700"><TableCell colSpan={7} className="text-center py-8 text-gray-500 dark:text-gray-400">Cargando libros...</TableCell></TableRow>
                ) : filteredBooks.length === 0 ? (
                  <TableRow className="dark:border-gray-700"><TableCell colSpan={7} className="text-center py-8 text-gray-500 dark:text-gray-400">No se encontraron libros con los filtros actuales.</TableCell></TableRow>
                ) : (
                  filteredBooks.map((book) => (
                    <TableRow key={book.id} className="dark:border-gray-700 dark:hover:bg-gray-700/50">
                      <TableCell className="font-medium dark:text-[#F5F7FF]">{book.titulo}</TableCell>
                      <TableCell className="dark:text-[#B7BDD6]">{book.autor}</TableCell>
                      <TableCell className="dark:text-[#B7BDD6]">{formatCategory(book.categoria)}</TableCell>
                      <TableCell className="dark:text-[#B7BDD6]">{book.editorial || "Sin editorial"}</TableCell>
                      <TableCell><span className={`px-2 py-1 rounded-full text-xs ${getStatusClasses(book.estado)}`}>{formatStatus(book.estado)}</span></TableCell>
                      <TableCell className="dark:text-[#B7BDD6]">{book.cantidadDisponible}</TableCell>
                      <TableCell><Button size="sm" variant="ghost" onClick={() => navigate(`/library/book/${book.id}`)}><Eye size={16} className="mr-2" />Ver</Button></TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </PageLayout>
  );
};
