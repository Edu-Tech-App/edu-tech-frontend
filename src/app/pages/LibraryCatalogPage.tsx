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
  id: number;
  titulo: string;
  autor: string;
  categoria: string | null;
  editorial: string | null;
  cantidadDisponible: number;
  estado: string;
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
    const uniqueCategories = new Set(
      books
        .map((book) => book.categoria)
        .filter((value): value is string => Boolean(value)),
    );

    return Array.from(uniqueCategories).sort((a, b) => a.localeCompare(b));
  }, [books]);

  const filteredBooks = books.filter((book) => {
    const matchesSearch =
      book.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.autor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = category === "all" || book.categoria === category;
    return matchesSearch && matchesCategory;
  });

  const getStatusClasses = (estado: string) => {
    if (estado === "DISPONIBLE") {
      return "bg-green-100 text-green-700";
    }

    if (estado === "MANTENIMIENTO") {
      return "bg-yellow-100 text-yellow-700";
    }

    return "bg-red-100 text-red-700";
  };

  const formatStatus = (estado: string) => {
    if (estado === "DISPONIBLE") return "Disponible";
    if (estado === "MANTENIMIENTO") return "Mantenimiento";
    if (estado === "BAJA") return "Baja";
    return estado;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <TopBar />
      <main className="ml-64 pt-16 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Catálogo de Biblioteca</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  placeholder="Buscar por título o autor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las Categorías</SelectItem>
                  {categories.map((item) => (
                    <SelectItem key={item} value={item}>
                      {formatCategory(item)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Autor</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Editorial</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Copias</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      Cargando libros...
                    </TableCell>
                  </TableRow>
                ) : filteredBooks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No se encontraron libros con los filtros actuales.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBooks.map((book) => (
                    <TableRow key={book.id}>
                      <TableCell className="font-medium">{book.titulo}</TableCell>
                      <TableCell>{book.autor}</TableCell>
                      <TableCell>{formatCategory(book.categoria)}</TableCell>
                      <TableCell>{book.editorial || "Sin editorial"}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusClasses(book.estado)}`}>
                          {formatStatus(book.estado)}
                        </span>
                      </TableCell>
                      <TableCell>{book.cantidadDisponible}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`/library/book/${book.id}`)}
                        >
                          <Eye size={16} className="mr-2" />
                          Ver
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};
