import { useEffect, useState } from "react";
import { PageLayout } from "../components/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { BookOpen, Calendar, AlertCircle, CheckCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../../services/api";

interface Loan {
  id: number;
  libroId: number;
  estudianteId: number;
  fechaPrestamo: string;
  fechaLimiteDevolucion: string;
  fechaDevolucionReal: string | null;
  estado: "ACTIVO" | "DEVUELTO" | "VENCIDO" | "PERDIDO";
  libro: { id: number; titulo: string; autor: string };
}

export const MyLoansPage = () => {
  const { user } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    const fetch = async () => {
      try {
        const data = await api.getStudentLoans(user.id);
        setLoans(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Error cargando préstamos:", e);
      } finally {
        setLoading(false);
      }
    };
    void fetch();
  }, [user?.id]);

  const activeLoans = loans.filter((l) => l.estado === "ACTIVO" || l.estado === "VENCIDO");
  const returnedLoans = loans.filter((l) => l.estado === "DEVUELTO");

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getStatusBadge = (loan: Loan) => {
    if (loan.estado === "DEVUELTO") return <Badge className="bg-gray-500">Devuelto</Badge>;
    const days = getDaysUntilDue(loan.fechaLimiteDevolucion);
    if (days < 0) return <Badge className="bg-red-500">Vencido</Badge>;
    if (days <= 3) return <Badge className="bg-yellow-500">Próximo a vencer</Badge>;
    return <Badge className="bg-green-500">Activo</Badge>;
  };

  return (
    <PageLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mis Préstamos</h1>
          <p className="text-gray-600">Gestiona tus libros prestados</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Préstamos Activos</p><p className="text-3xl font-bold text-blue-600">{loading ? "..." : activeLoans.length}</p></div><BookOpen size={40} className="text-blue-600" /></div></CardContent></Card>
          <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Libros Vencidos</p><p className="text-3xl font-bold text-red-600">{loading ? "..." : activeLoans.filter((l) => getDaysUntilDue(l.fechaLimiteDevolucion) < 0).length}</p></div><AlertCircle size={40} className="text-red-600" /></div></CardContent></Card>
          <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Devueltos</p><p className="text-3xl font-bold text-green-600">{loading ? "..." : returnedLoans.length}</p></div><CheckCircle size={40} className="text-green-600" /></div></CardContent></Card>
        </div>

        <Card className="mb-6">
          <CardHeader><CardTitle>Préstamos Activos</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-gray-500 py-8">Cargando préstamos...</p>
            ) : activeLoans.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen size={48} className="mx-auto text-gray-400 mb-3" />
                <p className="text-gray-600">No tienes préstamos activos</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeLoans.map((loan) => {
                  const days = getDaysUntilDue(loan.fechaLimiteDevolucion);
                  const isOverdue = days < 0;
                  return (
                    <div key={loan.id} className={`p-4 border rounded-lg ${isOverdue ? "bg-red-50 border-red-200" : "bg-white border-gray-200"}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-gray-900">{loan.libro?.titulo}</h3>
                          <p className="text-sm text-gray-600 mt-1">{loan.libro?.autor}</p>
                          <div className="flex gap-6 mt-3">
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar size={16} className="text-gray-400" />
                              <span className="text-gray-600">Prestado: {new Date(loan.fechaPrestamo).toLocaleDateString("es-ES")}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar size={16} className="text-gray-400" />
                              <span className={isOverdue ? "text-red-600 font-semibold" : "text-gray-600"}>
                                Vence: {new Date(loan.fechaLimiteDevolucion).toLocaleDateString("es-ES")}
                              </span>
                            </div>
                          </div>
                          {isOverdue && (
                            <div className="mt-3 flex items-center gap-2 text-red-600">
                              <AlertCircle size={16} />
                              <span className="text-sm font-semibold">Vencido hace {Math.abs(days)} día{Math.abs(days) !== 1 ? "s" : ""}</span>
                            </div>
                          )}
                          {!isOverdue && days <= 3 && (
                            <div className="mt-3 flex items-center gap-2 text-yellow-600">
                              <AlertCircle size={16} />
                              <span className="text-sm font-semibold">Vence en {days} día{days !== 1 ? "s" : ""}</span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">{getStatusBadge(loan)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Historial de Devoluciones</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-gray-500 py-8">Cargando historial...</p>
            ) : returnedLoans.length === 0 ? (
              <p className="text-center text-gray-600 py-8">No tienes historial de devoluciones</p>
            ) : (
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
                        <td className="p-3 font-medium">{loan.libro?.titulo}</td>
                        <td className="p-3 text-gray-600">{loan.libro?.autor}</td>
                        <td className="p-3 text-gray-600">{new Date(loan.fechaPrestamo).toLocaleDateString("es-ES")}</td>
                        <td className="p-3 text-gray-600">{loan.fechaDevolucionReal ? new Date(loan.fechaDevolucionReal).toLocaleDateString("es-ES") : "-"}</td>
                        <td className="p-3">{getStatusBadge(loan)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};