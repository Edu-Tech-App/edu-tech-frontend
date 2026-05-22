import { useState } from "react";
import { PageLayout } from "../components/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";

export const LoanManagementPage = () => {
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<any>(null);

  const loans = [
    { id: '1', book: 'Introducción a los Algoritmos', user: 'Juan Pérez', userId: 'E001', loanDate: '25/03/2026', dueDate: '24/04/2026', status: 'Activo', overdue: false },
    { id: '2', book: 'Código Limpio', user: 'María González', userId: 'E002', loanDate: '01/04/2026', dueDate: '01/05/2026', status: 'Activo', overdue: false },
    { id: '3', book: 'Patrones de Diseño', user: 'Carlos Ruiz', userId: 'E003', loanDate: '10/03/2026', dueDate: '09/04/2026', status: 'Activo', overdue: true },
  ];

  const handleReturn = (loan: any) => { setSelectedLoan(loan); setShowReturnDialog(true); };

  const confirmReturn = () => {
    if (selectedLoan?.overdue) {
      const daysOverdue = 16;
      toast.success(`Libro devuelto. Multa aplicada: $${(daysOverdue * 1000).toLocaleString()} (${daysOverdue} días de retraso)`);
    } else {
      toast.success('¡Libro devuelto exitosamente!');
    }
    setShowReturnDialog(false);
    setSelectedLoan(null);
  };

  return (
    <PageLayout>
      <div className="p-6">
        <Card>
          <CardHeader><CardTitle>Gestión de Préstamos</CardTitle></CardHeader>
          <CardContent>
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">💡 <strong>Ayuda:</strong> Aquí puedes ver todos los préstamos activos y procesar devoluciones de libros.</p>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Libro</TableHead><TableHead>Estudiante</TableHead><TableHead>ID Estudiante</TableHead>
                  <TableHead>Fecha de Préstamo</TableHead><TableHead>Fecha de Vencimiento</TableHead>
                  <TableHead>Estado</TableHead><TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loans.map((loan) => (
                  <TableRow key={loan.id} className={loan.overdue ? 'bg-red-50' : ''}>
                    <TableCell className="font-medium">{loan.book}</TableCell>
                    <TableCell>{loan.user}</TableCell>
                    <TableCell>{loan.userId}</TableCell>
                    <TableCell>{loan.loanDate}</TableCell>
                    <TableCell className={loan.overdue ? 'text-red-600 font-medium' : ''}>{loan.dueDate}</TableCell>
                    <TableCell><Badge className={loan.overdue ? 'bg-red-500' : 'bg-green-500'}>{loan.overdue ? 'Atrasado' : 'Activo'}</Badge></TableCell>
                    <TableCell><Button size="sm" onClick={() => handleReturn(loan)}>Procesar Devolución</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Procesar Devolución de Libro</DialogTitle>
              <DialogDescription>Confirma la devolución de "{selectedLoan?.book}"</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {selectedLoan?.overdue && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-sm font-medium text-red-800">⚠️ Aviso de Retraso</p>
                  <p className="text-sm text-red-600 mt-1">Este libro tiene 16 días de retraso. Se aplicará una multa de $16.000.</p>
                </div>
              )}
              <div className="space-y-2">
                <p className="text-sm text-gray-600"><strong>Estudiante:</strong> {selectedLoan?.user}</p>
                <p className="text-sm text-gray-600"><strong>Fecha de Préstamo:</strong> {selectedLoan?.loanDate}</p>
                <p className="text-sm text-gray-600"><strong>Fecha de Vencimiento:</strong> {selectedLoan?.dueDate}</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowReturnDialog(false)}>Cancelar</Button>
              <Button onClick={confirmReturn} className="bg-blue-900 hover:bg-blue-800">Confirmar Devolución</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  );
};