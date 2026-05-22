import { useEffect, useState } from "react";
import { PageLayout } from "../components/PageLayout";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Edit, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../services/api";

interface BookRecord { id: number; titulo: string; cantidadDisponible: number; estado: string; }
interface UserRecord { id: number; nombreCompleto: string; rol: string; }
interface LoanRecord {
  id: number; libroId: number; estudianteId: number;
  bookTitle: string; studentName: string; dueDate: string; loanDate: string;
  status: "ACTIVO" | "DEVUELTO" | "VENCIDO" | "PERDIDO";
}

export const BookReservationsManagementPage = () => {
  const [loans, setLoans] = useState<LoanRecord[]>([]);
  const [books, setBooks] = useState<BookRecord[]>([]);
  const [students, setStudents] = useState<UserRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingLoan, setEditingLoan] = useState<LoanRecord | null>(null);
  const [loanToDelete, setLoanToDelete] = useState<LoanRecord | null>(null);
  const [formData, setFormData] = useState({ libroId: "", estudianteId: "", fechaLimiteDevolucion: "", estado: "ACTIVO" as LoanRecord["status"] });

  const loadData = async () => {
    try {
      setLoading(true);
      const [loansData, booksData, usersData] = await Promise.all([api.getLoans(), api.getBooks(), api.getUsers()]);
      const mappedLoans = (Array.isArray(loansData) ? loansData : []).map((loan: any) => ({
        id: loan.id, libroId: loan.libroId, estudianteId: loan.estudianteId,
        bookTitle: loan.libro?.titulo || "Libro no disponible",
        studentName: loan.estudiante?.user?.nombreCompleto || "Estudiante no disponible",
        dueDate: String(loan.fechaLimiteDevolucion).slice(0, 10),
        loanDate: String(loan.fechaPrestamo).slice(0, 10),
        status: loan.estado,
      }));
      setLoans(mappedLoans);
      setBooks((booksData as any[]).map((book) => ({ id: book.id, titulo: book.titulo, cantidadDisponible: book.cantidadDisponible, estado: book.estado })));
      setStudents((usersData as any[]).filter((user) => user.rol === "estudiante").map((user) => ({ id: user.id, nombreCompleto: user.nombreCompleto, rol: user.rol })));
    } catch (error: any) {
      toast.error(error.message || "No se pudieron cargar los préstamos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadData(); }, []);

  const filteredLoans = loans.filter((loan) =>
    loan.bookTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loan.studentName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenDialog = (loan?: LoanRecord) => {
    if (loan) {
      setEditingLoan(loan);
      setFormData({ libroId: String(loan.libroId), estudianteId: String(loan.estudianteId), fechaLimiteDevolucion: loan.dueDate, estado: loan.status });
    } else {
      setEditingLoan(null);
      setFormData({ libroId: "", estudianteId: "", fechaLimiteDevolucion: "", estado: "ACTIVO" });
    }
    setShowFormDialog(true);
  };

  const handleSave = async () => {
    if (!formData.libroId || !formData.estudianteId || !formData.fechaLimiteDevolucion) { toast.error("Completa todos los campos"); return; }
    try {
      setSaving(true);
      const basePayload = { libroId: Number(formData.libroId), estudianteId: Number(formData.estudianteId), fechaLimiteDevolucion: formData.fechaLimiteDevolucion };
      if (editingLoan) {
        await api.updateLoan(editingLoan.id, { ...basePayload, estado: formData.estado });
        toast.success("Reserva de libro actualizada exitosamente");
      } else {
        await api.createLoan(basePayload);
        toast.success("Reserva de libro creada exitosamente");
      }
      setShowFormDialog(false);
      await loadData();
    } catch (error: any) {
      toast.error(error.message || "No se pudo guardar la reserva de libro");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!loanToDelete) return;
    try {
      setSaving(true);
      await api.deleteLoan(loanToDelete.id);
      toast.success("Reserva de libro eliminada exitosamente");
      setShowDeleteDialog(false);
      setLoanToDelete(null);
      await loadData();
    } catch (error: any) {
      toast.error(error.message || "No se pudo eliminar la reserva de libro");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageLayout>
      <div className="px-6 pb-6 pt-6">
        <div className="mb-6"><h1 className="text-3xl font-bold text-gray-900">Reservas de Libro</h1></div>
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <Input placeholder="Buscar por libro o estudiante..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
          <Button onClick={() => handleOpenDialog()} className="bg-blue-900 hover:bg-blue-800"><Plus size={16} className="mr-2" />Crear Reserva</Button>
        </div>
        <Card>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b"><th className="p-3 text-left">Libro</th><th className="p-3 text-left">Estudiante</th><th className="p-3 text-left">Fecha préstamo</th><th className="p-3 text-left">Fecha límite</th><th className="p-3 text-left">Estado</th><th className="p-3 text-right">Acciones</th></tr></thead>
                <tbody>
                  {loading ? <tr><td colSpan={6} className="p-8 text-center text-gray-500">Cargando reservas...</td></tr> :
                    filteredLoans.length === 0 ? <tr><td colSpan={6} className="p-8 text-center text-gray-500">No se encontraron reservas</td></tr> :
                      filteredLoans.map((loan) => (
                        <tr key={loan.id} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-medium">{loan.bookTitle}</td>
                          <td className="p-3 text-gray-600">{loan.studentName}</td>
                          <td className="p-3 text-gray-600">{new Date(loan.loanDate).toLocaleDateString("es-ES")}</td>
                          <td className="p-3 text-gray-600">{new Date(loan.dueDate).toLocaleDateString("es-ES")}</td>
                          <td className="p-3"><Badge className="bg-blue-500">{loan.status}</Badge></td>
                          <td className="p-3"><div className="flex justify-end gap-2">
                            <Button size="sm" variant="ghost" onClick={() => handleOpenDialog(loan)}><Edit size={16} /></Button>
                            <Button size="sm" variant="ghost" onClick={() => { setLoanToDelete(loan); setShowDeleteDialog(true); }}><Trash2 size={16} className="text-red-600" /></Button>
                          </div></td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingLoan ? "Editar Reserva de Libro" : "Crear Reserva de Libro"}</DialogTitle><DialogDescription>Completa la información del préstamo.</DialogDescription></DialogHeader>
            <div className="space-y-4 py-4">
              <div><Label>Libro</Label><Select value={formData.libroId} onValueChange={(value) => setFormData({ ...formData, libroId: value })}><SelectTrigger><SelectValue placeholder="Selecciona un libro" /></SelectTrigger><SelectContent>{books.map((book) => <SelectItem key={book.id} value={String(book.id)}>{book.titulo}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Estudiante</Label><Select value={formData.estudianteId} onValueChange={(value) => setFormData({ ...formData, estudianteId: value })}><SelectTrigger><SelectValue placeholder="Selecciona un estudiante" /></SelectTrigger><SelectContent>{students.map((student) => <SelectItem key={student.id} value={String(student.id)}>{student.nombreCompleto}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Fecha límite de devolución</Label><Input type="date" value={formData.fechaLimiteDevolucion} onChange={(e) => setFormData({ ...formData, fechaLimiteDevolucion: e.target.value })} /></div>
              <div><Label>Estado</Label><Select value={formData.estado} onValueChange={(value) => setFormData({ ...formData, estado: value as LoanRecord["status"] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ACTIVO">Activo</SelectItem><SelectItem value="DEVUELTO">Devuelto</SelectItem><SelectItem value="VENCIDO">Vencido</SelectItem><SelectItem value="PERDIDO">Perdido</SelectItem></SelectContent></Select></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setShowFormDialog(false)}>Cancelar</Button><Button onClick={handleSave} disabled={saving} className="bg-blue-900 hover:bg-blue-800">{saving ? "Guardando..." : "Guardar"}</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader><DialogTitle>Eliminar Reserva de Libro</DialogTitle><DialogDescription>¿Seguro que quieres eliminar esta reserva?</DialogDescription></DialogHeader>
            <DialogFooter><Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancelar</Button><Button onClick={handleDelete} disabled={saving} className="bg-red-600 hover:bg-red-700">{saving ? "Eliminando..." : "Eliminar"}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  );
};