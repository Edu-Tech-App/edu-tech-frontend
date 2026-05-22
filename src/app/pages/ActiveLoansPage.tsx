import { useState } from "react";
import { PageLayout } from "../components/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Search, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";

interface Loan {
  id: string;
  bookTitle: string;
  userName: string;
  userRole: string;
  loanDate: string;
  dueDate: string;
  status: 'active' | 'overdue' | 'returned';
  fine?: number;
}

export const ActiveLoansPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);

  const [loans, setLoans] = useState<Loan[]>([
    { id: '1', bookTitle: 'Introducción a los Algoritmos', userName: 'Juan Pérez', userRole: 'Estudiante', loanDate: '2026-03-25', dueDate: '2026-04-24', status: 'active' },
    { id: '2', bookTitle: 'Cálculo: Una Variable', userName: 'María González', userRole: 'Estudiante', loanDate: '2026-03-20', dueDate: '2026-04-19', status: 'active' },
    { id: '3', bookTitle: 'Física para Ciencias e Ingeniería', userName: 'Carlos Rodríguez', userRole: 'Maestro', loanDate: '2026-03-10', dueDate: '2026-04-09', status: 'overdue', fine: 16 },
    { id: '4', bookTitle: 'Química Orgánica', userName: 'Ana López', userRole: 'Estudiante', loanDate: '2026-04-01', dueDate: '2026-05-01', status: 'active' },
  ]);

  const filteredLoans = loans.filter(loan =>
    loan.status !== 'returned' && (
      loan.bookTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.userName.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const activeLoans = filteredLoans.filter(loan => loan.status === 'active');
  const overdueLoans = filteredLoans.filter(loan => loan.status === 'overdue');

  const handleReturnClick = (loan: Loan) => { setSelectedLoan(loan); setShowReturnDialog(true); };

  const handleConfirmReturn = () => {
    if (selectedLoan) {
      setLoans(loans.map(loan => loan.id === selectedLoan.id ? { ...loan, status: 'returned' as const } : loan));
      toast.success(`"${selectedLoan.bookTitle}" marcado como devuelto`);
      setShowReturnDialog(false);
      setSelectedLoan(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-blue-500">Activo</Badge>;
      case 'overdue': return <Badge className="bg-red-500">Vencido</Badge>;
      case 'returned': return <Badge className="bg-green-500">Devuelto</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <PageLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Préstamos Activos</h1>
          <p className="text-gray-600">Gestiona todos los préstamos de la biblioteca</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Total Activos</p><p className="text-3xl font-bold text-blue-600">{activeLoans.length}</p></div><Clock size={40} className="text-blue-600" /></div></CardContent></Card>
          <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Préstamos Vencidos</p><p className="text-3xl font-bold text-red-600">{overdueLoans.length}</p></div><XCircle size={40} className="text-red-600" /></div></CardContent></Card>
          <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Multas Pendientes</p><p className="text-3xl font-bold text-yellow-600">${overdueLoans.reduce((sum, loan) => sum + (loan.fine || 0), 0)}</p></div><CheckCircle size={40} className="text-yellow-600" /></div></CardContent></Card>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input placeholder="Buscar por libro o usuario..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
        </div>

        <Card>
          <CardHeader><CardTitle>Lista de Préstamos</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Libro</th>
                    <th className="text-left p-3">Usuario</th>
                    <th className="text-left p-3">Rol</th>
                    <th className="text-left p-3">Fecha Préstamo</th>
                    <th className="text-left p-3">Fecha Vencimiento</th>
                    <th className="text-left p-3">Estado</th>
                    <th className="text-left p-3">Multa</th>
                    <th className="text-right p-3">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLoans.map((loan) => (
                    <tr key={loan.id} className={`border-b hover:bg-gray-50 ${loan.status === 'overdue' ? 'bg-red-50' : ''}`}>
                      <td className="p-3 font-medium">{loan.bookTitle}</td>
                      <td className="p-3 text-gray-600">{loan.userName}</td>
                      <td className="p-3 text-gray-600">{loan.userRole}</td>
                      <td className="p-3 text-gray-600">{new Date(loan.loanDate).toLocaleDateString('es-ES')}</td>
                      <td className="p-3 text-gray-600">{new Date(loan.dueDate).toLocaleDateString('es-ES')}</td>
                      <td className="p-3">{getStatusBadge(loan.status)}</td>
                      <td className="p-3 text-gray-600">{loan.fine ? `$${loan.fine}` : '-'}</td>
                      <td className="p-3 text-right">
                        <Button size="sm" onClick={() => handleReturnClick(loan)} className="bg-green-600 hover:bg-green-700">Marcar Devuelto</Button>
                      </td>
                    </tr>
                  ))}
                  {filteredLoans.length === 0 && (
                    <tr><td colSpan={8} className="p-8 text-center text-gray-500">No se encontraron préstamos activos</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Devolución</DialogTitle>
              <DialogDescription>¿Confirmas que el libro "{selectedLoan?.bookTitle}" ha sido devuelto por {selectedLoan?.userName}?</DialogDescription>
            </DialogHeader>
            {selectedLoan?.fine && (
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <p className="text-sm font-medium text-yellow-800">Este préstamo tiene una multa pendiente de ${selectedLoan.fine}</p>
                <p className="text-xs text-yellow-700 mt-1">Asegúrate de cobrar la multa antes de completar la devolución</p>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowReturnDialog(false)}>Cancelar</Button>
              <Button onClick={handleConfirmReturn} className="bg-green-600 hover:bg-green-700">Confirmar Devolución</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  );
};
