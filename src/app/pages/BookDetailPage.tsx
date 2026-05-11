import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Sidebar } from "../components/Sidebar";
import { TopBar } from "../components/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { ArrowLeft, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";

export const BookDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showBorrowDialog, setShowBorrowDialog] = useState(false);

  const book = {
    id: id,
    title: 'Introducción a los Algoritmos',
    author: 'Thomas H. Cormen, Charles E. Leiserson',
    isbn: '978-0262033848',
    category: 'Ingeniería de Sistemas',
    publisher: 'MIT Press',
    year: 2009,
    pages: 1312,
    status: 'Disponible',
    copies: 5,
    description: 'Un libro completo que explica muchos algoritmos paso a paso, facilitando entender cómo se diseñan y cómo funcionan.',
};

  const handleBorrow = () => {
    if (user?.hasPendingFines) {
      toast.error('Cannot borrow books. You have pending fines.');
      return;
    }
    setShowBorrowDialog(true);
  };

  const confirmBorrow = () => {
    setShowBorrowDialog(false);
    toast.success('Book borrowed successfully! Due date: May 24, 2026');
    setTimeout(() => navigate('/library'), 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <TopBar />
      <main className="ml-64 pt-16 p-6">
        <Button variant="ghost" onClick={() => navigate('/library')} className="mb-4">
          <ArrowLeft size={16} className="mr-2" />
          Volver al Catálogo
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Card>
              <CardContent className="p-6">
                <div className="aspect-[3/4] bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center mb-4">
                  <BookOpen size={64} className="text-white" />
                </div>
                <div className="space-y-2">
                  <Badge className={book.status === 'Available' ? 'bg-green-500' : 'bg-yellow-500'}>
                    {book.status}
                  </Badge>
                  <p className="text-sm text-gray-600">{book.copies} copias disponibles</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{book.title}</CardTitle>
                <p className="text-gray-600">{book.author}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">{book.description}</p>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-gray-600">ISBN</p>
                    <p className="font-medium">{book.isbn}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Categoría</p>
                    <p className="font-medium">{book.category}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Editorial</p>
                    <p className="font-medium">{book.publisher}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Año</p>
                    <p className="font-medium">{book.year}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Páginas</p>
                    <p className="font-medium">{book.pages}</p>
                  </div>
                </div>

                {user?.role === 'student' && (
                  <div className="pt-4">
                    <Button onClick={handleBorrow} className="w-full bg-blue-900 hover:bg-blue-800">
                      Solicitar Préstamo
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <Dialog open={showBorrowDialog} onOpenChange={setShowBorrowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Préstamo</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que quieres solicitar "{book.title}"?
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-gray-600">Fecha de vencimiento: 24 de mayo, 2026 (30 días)</p>
              <p className="text-sm text-gray-600 mt-2">Las devoluciones tardías tendrán una multa de $1 por día.</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowBorrowDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={confirmBorrow} className="bg-blue-900 hover:bg-blue-800">
                Confirmar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};
