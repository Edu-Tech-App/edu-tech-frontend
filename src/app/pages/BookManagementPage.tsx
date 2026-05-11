import { useState } from "react";
import { Sidebar } from "../components/Sidebar";
import { TopBar } from "../components/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { toast } from "sonner";

interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  publisher: string;
  year: number;
  pages: number;
  copies: number;
  status: string;
}

export const BookManagementPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    category: '',
    publisher: '',
    year: new Date().getFullYear(),
    pages: 0,
    copies: 1,
  });

  const [books, setBooks] = useState<Book[]>([
    {
      id: '1',
      title: 'Introducción a los Algoritmos',
      author: 'Thomas H. Cormen, Charles E. Leiserson',
      isbn: '978-0262033848',
      category: 'Ciencias de la Computación',
      publisher: 'MIT Press',
      year: 2009,
      pages: 1312,
      copies: 5,
      status: 'Disponible',
    },
    {
      id: '2',
      title: 'Cálculo: Una Variable',
      author: 'James Stewart',
      isbn: '978-1285740621',
      category: 'Matemáticas',
      publisher: 'Cengage Learning',
      year: 2015,
      pages: 920,
      copies: 8,
      status: 'Disponible',
    },
    {
      id: '3',
      title: 'Física para Ciencias e Ingeniería',
      author: 'Raymond A. Serway',
      isbn: '978-1133954057',
      category: 'Física',
      publisher: 'Cengage Learning',
      year: 2013,
      pages: 1344,
      copies: 3,
      status: 'Disponible',
    },
  ]);

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.isbn.includes(searchTerm)
  );

  const handleOpenDialog = (book?: Book) => {
    if (book) {
      setEditingBook(book);
      setFormData({
        title: book.title,
        author: book.author,
        isbn: book.isbn,
        category: book.category,
        publisher: book.publisher,
        year: book.year,
        pages: book.pages,
        copies: book.copies,
      });
    } else {
      setEditingBook(null);
      setFormData({
        title: '',
        author: '',
        isbn: '',
        category: '',
        publisher: '',
        year: new Date().getFullYear(),
        pages: 0,
        copies: 1,
      });
    }
    setShowDialog(true);
  };

  const handleSaveBook = () => {
    if (!formData.title || !formData.author || !formData.isbn) {
      toast.error('Por favor completa los campos obligatorios');
      return;
    }

    if (editingBook) {
      setBooks(books.map(book =>
        book.id === editingBook.id
          ? { ...book, ...formData, status: 'Disponible' }
          : book
      ));
      toast.success('Libro actualizado exitosamente');
    } else {
      const newBook: Book = {
        id: Date.now().toString(),
        ...formData,
        status: 'Disponible',
      };
      setBooks([...books, newBook]);
      toast.success('Libro creado exitosamente');
    }

    setShowDialog(false);
    setEditingBook(null);
  };

  const handleDeleteClick = (book: Book) => {
    setBookToDelete(book);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (bookToDelete) {
      setBooks(books.filter(book => book.id !== bookToDelete.id));
      toast.success('Libro eliminado exitosamente');
      setShowDeleteDialog(false);
      setBookToDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <TopBar />
      <main className="ml-64 pt-16 p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Libros</h1>
          <p className="text-gray-600">Administra el catálogo completo de la biblioteca</p>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              placeholder="Buscar por título, autor o ISBN..."
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
          <CardHeader>
            <CardTitle>Catálogo de Libros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Título</th>
                    <th className="text-left p-3">Autor</th>
                    <th className="text-left p-3">ISBN</th>
                    <th className="text-left p-3">Categoría</th>
                    <th className="text-left p-3">Copias</th>
                    <th className="text-left p-3">Estado</th>
                    <th className="text-right p-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBooks.map((book) => (
                    <tr key={book.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{book.title}</td>
                      <td className="p-3 text-gray-600">{book.author}</td>
                      <td className="p-3 text-gray-600">{book.isbn}</td>
                      <td className="p-3 text-gray-600">{book.category}</td>
                      <td className="p-3 text-gray-600">{book.copies}</td>
                      <td className="p-3">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                          {book.status}
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
                  ))}
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
                <label className="text-sm font-medium mb-2 block">Título *</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Título del libro"
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium mb-2 block">Autor *</label>
                <Input
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  placeholder="Nombre del autor"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">ISBN *</label>
                <Input
                  value={formData.isbn}
                  onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                  placeholder="978-0000000000"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Categoría</label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Ciencias, Literatura, etc."
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Editorial</label>
                <Input
                  value={formData.publisher}
                  onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                  placeholder="Nombre de la editorial"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Año</label>
                <Input
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Páginas</label>
                <Input
                  type="number"
                  value={formData.pages}
                  onChange={(e) => setFormData({ ...formData, pages: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Copias Disponibles</label>
                <Input
                  type="number"
                  value={formData.copies}
                  onChange={(e) => setFormData({ ...formData, copies: parseInt(e.target.value) })}
                  min={1}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveBook} className="bg-blue-900 hover:bg-blue-800">
                {editingBook ? 'Guardar Cambios' : 'Crear Libro'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Eliminación</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que quieres eliminar "{bookToDelete?.title}"? Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">
                Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};
