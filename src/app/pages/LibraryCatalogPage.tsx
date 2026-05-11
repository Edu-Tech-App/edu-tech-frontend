import { useState } from "react";
import { useNavigate } from "react-router";
import { Sidebar } from "../components/Sidebar";
import { TopBar } from "../components/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Search, Eye } from "lucide-react";

export const LibraryCatalogPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');

  const books = [
    { id: '1', title: 'Introducción a los Algoritmos', author: 'Thomas H. Cormen', isbn: '978-0262033848', category: 'Ingeniería de Sistemas', status: 'Disponible', copies: 5 },
    { id: '2', title: 'Código Limpio', author: 'Robert C. Martin', isbn: '978-0132350884', category: 'Ingeniería de Sistemas', status: 'Disponible', copies: 3 },
    { id: '3', title: 'Patrones de Diseño', author: 'Gang of Four', isbn: '978-0201633612', category: 'Ingeniería de Sistemas', status: 'Limitado', copies: 1 },
    { id: '4', title: 'El Programador Pragmático', author: 'Andrew Hunt', isbn: '978-0135957059', category: 'Ingeniería de Sistemas', status: 'Disponible', copies: 4 },
    { id: '5', title: 'Cálculo', author: 'James Stewart', isbn: '978-1285740621', category: 'Matemáticas', status: 'Disponible', copies: 8 },
  ];

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = category === 'all' || book.category === category;
    return matchesSearch && matchesCategory;
  });

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
                  <SelectItem value="Ingeniería de Sistemas">Ingeniería de Sistemas</SelectItem>
                  <SelectItem value="Ingeniería Civil">Ingeniería Civil</SelectItem>
                  <SelectItem value="Matemáticas">Matemáticas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Autor</TableHead>
                  <TableHead>ISBN</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Copias</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBooks.map((book) => (
                  <TableRow key={book.id}>
                    <TableCell className="font-medium">{book.title}</TableCell>
                    <TableCell>{book.author}</TableCell>
                    <TableCell>{book.isbn}</TableCell>
                    <TableCell>{book.category}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        book.status === 'Disponible' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {book.status}
                      </span>
                    </TableCell>
                    <TableCell>{book.copies}</TableCell>
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
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};
