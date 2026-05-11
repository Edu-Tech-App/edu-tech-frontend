import { useState } from "react";
import { Sidebar } from "../components/Sidebar";
import { TopBar } from "../components/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { BookOpen, Calendar, AlertCircle, CheckCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface Loan {
  id: string;
  bookTitle: string;
  author: string;
  loanDate: string;
  dueDate: string;
  status: 'active' | 'overdue' | 'returned';
  fine?: number;
}

export const MyLoansPage = () => {
  const { user } = useAuth();

  const [loans] = useState<Loan[]>([
    {
      id: '1',
      bookTitle: 'Introducción a los Algoritmos',
      author: 'Thomas H. Cormen',
      loanDate: '2026-03-25',
      dueDate: '2026-04-24',
      status: 'active',
    },
    {
      id: '2',
      bookTitle: 'Cálculo: Una Variable',
      author: 'James Stewart',
      loanDate: '2026-04-01',
      dueDate: '2026-05-01',
      status: 'active',
    },
    {
      id: '3',
      bookTitle: 'Física para Ciencias e Ingeniería',
      author: 'Raymond A. Serway',
      loanDate: '2026-02-15',
      dueDate: '2026-03-17',
      status: 'returned',
    },
  ]);

  const activeLoans = loans.filter(loan => loan.status === 'active' || loan.status === 'overdue');
  const returnedLoans = loans.filter(loan => loan.status === 'returned');
  const overdueLoans = activeLoans.filter(loan => new Date(loan.dueDate) < new Date());

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusBadge = (loan: Loan) => {
    const daysUntilDue = getDaysUntilDue(loan.dueDate);

    if (loan.status === 'returned') {
      return <Badge className="bg-gray-500">Devuelto</Badge>;
    }

    if (daysUntilDue < 0) {
      return <Badge className="bg-red-500">Vencido</Badge>;
    }

    if (daysUntilDue <= 3) {
      return <Badge className="bg-yellow-500">Próximo a vencer</Badge>;
    }

    return <Badge className="bg-green-500">Activo</Badge>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <TopBar />
      <main className="ml-64 pt-16 p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mis Préstamos</h1>
          <p className="text-gray-600">Gestiona tus libros prestados</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Préstamos Activos</p>
                  <p className="text-3xl font-bold text-blue-600">{activeLoans.length}</p>
                </div>
                <BookOpen size={40} className="text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Libros Vencidos</p>
                  <p className="text-3xl font-bold text-red-600">{overdueLoans.length}</p>
                </div>
                <AlertCircle size={40} className="text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Devueltos</p>
                  <p className="text-3xl font-bold text-green-600">{returnedLoans.length}</p>
                </div>
                <CheckCircle size={40} className="text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Préstamos Activos</CardTitle>
          </CardHeader>
          <CardContent>
            {activeLoans.length > 0 ? (
              <div className="space-y-4">
                {activeLoans.map((loan) => {
                  const daysUntilDue = getDaysUntilDue(loan.dueDate);
                  const isOverdue = daysUntilDue < 0;

                  return (
                    <div
                      key={loan.id}
                      className={`p-4 border rounded-lg ${isOverdue ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-gray-900">{loan.bookTitle}</h3>
                          <p className="text-sm text-gray-600 mt-1">{loan.author}</p>

                          <div className="flex gap-6 mt-3">
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar size={16} className="text-gray-400" />
                              <span className="text-gray-600">
                                Prestado: {new Date(loan.loanDate).toLocaleDateString('es-ES')}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar size={16} className="text-gray-400" />
                              <span className={isOverdue ? 'text-red-600 font-semibold' : 'text-gray-600'}>
                                Vence: {new Date(loan.dueDate).toLocaleDateString('es-ES')}
                              </span>
                            </div>
                          </div>

                          {isOverdue ? (
                            <div className="mt-3 flex items-center gap-2 text-red-600">
                              <AlertCircle size={16} />
                              <span className="text-sm font-semibold">
                                Vencido hace {Math.abs(daysUntilDue)} día{Math.abs(daysUntilDue) !== 1 ? 's' : ''}
                              </span>
                            </div>
                          ) : daysUntilDue <= 3 ? (
                            <div className="mt-3 flex items-center gap-2 text-yellow-600">
                              <AlertCircle size={16} />
                              <span className="text-sm font-semibold">
                                Vence en {daysUntilDue} día{daysUntilDue !== 1 ? 's' : ''}
                              </span>
                            </div>
                          ) : null}
                        </div>

                        <div className="ml-4">
                          {getStatusBadge(loan)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpen size={48} className="mx-auto text-gray-400 mb-3" />
                <p className="text-gray-600">No tienes préstamos activos</p>
                <Button className="mt-4 bg-blue-900 hover:bg-blue-800">
                  Explorar Catálogo
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historial de Devoluciones</CardTitle>
          </CardHeader>
          <CardContent>
            {returnedLoans.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Libro</th>
                      <th className="text-left p-3">Autor</th>
                      <th className="text-left p-3">Fecha Préstamo</th>
                      <th className="text-left p-3">Fecha Devolución</th>
                      <th className="text-left p-3">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {returnedLoans.map((loan) => (
                      <tr key={loan.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium">{loan.bookTitle}</td>
                        <td className="p-3 text-gray-600">{loan.author}</td>
                        <td className="p-3 text-gray-600">{new Date(loan.loanDate).toLocaleDateString('es-ES')}</td>
                        <td className="p-3 text-gray-600">{new Date(loan.dueDate).toLocaleDateString('es-ES')}</td>
                        <td className="p-3">{getStatusBadge(loan)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">No tienes historial de devoluciones</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};
