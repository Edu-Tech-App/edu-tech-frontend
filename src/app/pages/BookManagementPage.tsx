import { useEffect, useState } from "react";
import { Sidebar } from "../components/Sidebar";
import { TopBar } from "../components/TopBar";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { api, API_URL_PUBLIC, BOOK_CATEGORY_OPTIONS, type BookCategory } from "../../services/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";

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

export const BookManagementPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    titulo: "",
    autor: "",
    categoria: "",
    editorial: "",
    cantidadDisponible: 1,
    estado: "DISPONIBLE",
  });

  const [books, setBooks] = useState<Book[]>([]);

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

  useEffect(() => {
    void loadBooks();
  }, []);

  const filteredBooks = books.filter(book =>
    book.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.autor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (book.categoria || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenDialog = (book?: Book) => {
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
      toast.error("Por favor completa los campos obligatorios");
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
        const updatedBook = await api.updateBook(editingBook.id, payload);
        if (coverFile) {
          await api.uploadBookCover(editingBook.id, coverFile);
        }
        toast.success("Libro actualizado exitosamente");
      } else {
        const createdBook = await api.createBook(payload);
        if (coverFile) {
          await api.uploadBookCover(createdBook.id, coverFile);
        }
        toast.success("Libro creado exitosamente");
      }

      setShowDialog(false);
      setEditingBook(null);
      await loadBooks();
    } catch (error: any) {
      toast.error(error.message || "No se pudo guardar el libro");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (book: Book) => {
    setBookToDelete(book);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!bookToDelete) {
      return;
    }

    setDeleting(true);

    try {
      await api.deleteBook(bookToDelete.id);
      toast.success("Libro eliminado exitosamente");
      setShowDeleteDialog(false);
      setBookToDelete(null);
      await loadBooks();
    } catch (error: any) {
      toast.error(error.message || "No se pudo eliminar el libro");
    } finally {
      setDeleting(false);
    }
  };

  const formatStatus = (estado: string) => {
    if (estado === "DISPONIBLE") return "Disponible";
    if (estado === "MANTENIMIENTO") return "Mantenimiento";
    if (estado === "BAJA") return "Baja";
    return estado;
  };

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

  const getStatusClass = (estado: string) => {
    if (estado === "DISPONIBLE") return "bg-green-100 text-green-800";
    if (estado === "MANTENIMIENTO") return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <TopBar />
      <main className="ml-64 pt-[4.5rem] px-6 pb-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Libros</h1>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              placeholder="Buscar por título, autor o categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={() => handleOpenDialog()} className="bg-blue-900 hover:bg-blue-800">
            <Plus size={20} className="mr-2" />
            Agregar Libro
          </Button>
        </div>

        <Card>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Título</th>
                    <th className="text-left p-3">Autor</th>
                    <th className="text-left p-3">Categoría</th>
                    <th className="text-left p-3">Editorial</th>
                    <th className="text-center p-3">Copias</th>
                    <th className="text-left p-3">Estado</th>
                    <th className="text-right p-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-gray-500">
                        Cargando libros...
                      </td>
                    </tr>
                  ) : filteredBooks.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-gray-500">
                        No hay libros registrados con esos criterios.
                      </td>
                    </tr>
                  ) : (
                    filteredBooks.map((book) => (
                      <tr key={book.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium">{book.titulo}</td>
                        <td className="p-3 text-gray-600">{book.autor}</td>
                        <td className="p-3 text-gray-600">{formatCategory(book.categoria)}</td>
                        <td className="p-3 text-gray-600">{book.editorial || "Sin editorial"}</td>
                        <td className="p-3 text-center text-gray-600">{book.cantidadDisponible}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-sm ${getStatusClass(book.estado)}`}>
                            {formatStatus(book.estado)}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDialog(book)}
                            >
                              <Edit size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(book)}
                            >
                              <Trash2 size={16} className="text-red-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingBook ? 'Editar Libro' : 'Agregar Nuevo Libro'}</DialogTitle>
              <DialogDescription>
                {editingBook ? 'Modifica la información del libro' : 'Completa los datos del nuevo libro'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="col-span-2">
                <label className="text-sm font-medium mb-2 block">Portada del libro</label>
                <div className="flex items-center gap-4">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                  />
                  {editingBook?.portadaUrl ? (
                    <img
                      src={`${API_URL_PUBLIC}${editingBook.portadaUrl}`}
                      alt={editingBook.titulo}
                      className="w-14 h-20 object-cover rounded-md border"
                    />
                  ) : null}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Formatos sugeridos: JPG, PNG o WEBP. Tamaño máximo: 5 MB.
                </p>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium mb-2 block">Título *</label>
                <Input
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  placeholder="Título del libro"
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium mb-2 block">Autor *</label>
                <Input
                  value={formData.autor}
                  onChange={(e) => setFormData({ ...formData, autor: e.target.value })}
                  placeholder="Nombre del autor"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Categoría</label>
                <Select
                  value={formData.categoria || "NONE"}
                  onValueChange={(value) =>
                    setFormData({ ...formData, categoria: value === "NONE" ? "" : value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Sin categoría</SelectItem>
                    {BOOK_CATEGORY_OPTIONS.map((category) => (
                      <SelectItem key={category} value={category}>
                        {formatCategory(category)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Editorial</label>
                <Input
                  value={formData.editorial}
                  onChange={(e) => setFormData({ ...formData, editorial: e.target.value })}
                  placeholder="Nombre de la editorial"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Copias Disponibles</label>
                <Input
                  type="number"
                  value={formData.cantidadDisponible}
                  onChange={(e) => setFormData({ ...formData, cantidadDisponible: Number(e.target.value) || 0 })}
                  onFocus={(e) => e.currentTarget.select()}
                  min={0}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Estado</label>
                <Select
                  value={formData.estado}
                  onValueChange={(value) => setFormData({ ...formData, estado: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DISPONIBLE">Disponible</SelectItem>
                    <SelectItem value="MANTENIMIENTO">Mantenimiento</SelectItem>
                    <SelectItem value="BAJA">Baja</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveBook} disabled={saving} className="bg-blue-900 hover:bg-blue-800">
                {saving ? "Guardando..." : editingBook ? 'Guardar Cambios' : 'Crear Libro'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Eliminación</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que quieres eliminar "{bookToDelete?.titulo}"? Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleConfirmDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700">
                {deleting ? "Eliminando..." : "Eliminar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};
