import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { BookMarked, Clock, DollarSign, Library } from "lucide-react";

interface LibrarianDashboardProps {
  data: {
    activeLoansCount: number;
    overdueLoansCount: number;
    pendingFines: number;
    recentLoans: any[];
    availableBooks: number;
  };
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value);

const formatDate = (value?: string | null) => {
  if (!value) return "Sin fecha";
  return new Date(value).toLocaleDateString("es-ES");
};

export const LibrarianDashboard = ({ data }: LibrarianDashboardProps) => {
  const navigate = useNavigate();

  const cardClass = "border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800";
  const titleClass = "metric-label";
  const valueClass = "mt-2 text-3xl font-bold text-gray-800 dark:text-[#F5F7FF]";
  const iconClass = "flex h-12 w-12 items-center justify-center rounded-lg bg-[#6C5CE7]/14 dark:bg-gray-700/50 text-[#6C5CE7] dark:text-[#F5F7FF]";
  const sectionBg = "rounded-lg bg-gray-50 dark:bg-gray-700/50 p-3";

  return (
    <div className="space-y-4">
      <div className="page-header">
        <h1 className="page-title">Panel de Biblioteca</h1>
        <p className="page-subtitle">Gestión de recursos bibliográficos y préstamos</p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Préstamos Activos", value: data.activeLoansCount, icon: BookMarked },
          { title: "Préstamos Vencidos", value: data.overdueLoansCount, icon: Clock },
          { title: "Multas Pendientes", value: formatCurrency(data.pendingFines), icon: DollarSign },
          { title: "Libros Disponibles", value: data.availableBooks, icon: Library },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.title} className={cardClass}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={titleClass}>{item.title}</p>
                    <p className={valueClass}>{item.value}</p>
                  </div>
                  <div className={iconClass}><Icon size={24} /></div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1.5fr]">
        <Card className={cardClass}>
          <CardHeader>
            <CardTitle className="section-title">Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3">
            <Button onClick={() => navigate('/active-loans')} variant="outline" className="justify-start dark:border-gray-600 dark:text-gray-300">
              Registrar Préstamo
            </Button>
            <Button onClick={() => navigate('/active-loans')} variant="outline" className="justify-start dark:border-gray-600 dark:text-gray-300">
              Registrar Devolución
            </Button>
            <Button onClick={() => navigate('/book-management')} variant="outline" className="justify-start dark:border-gray-600 dark:text-gray-300">
              Gestionar Libros
            </Button>
          </CardContent>
        </Card>

        <Card className={cardClass}>
          <CardHeader><CardTitle className="section-title">Actividad reciente</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {data.recentLoans.length === 0
              ? <p className="text-gray-500 dark:text-gray-400">No hay movimientos recientes.</p>
              : data.recentLoans.map((loan: any) => (
                <div key={loan.id} className={`flex items-center justify-between ${sectionBg}`}>
                  <div>
                    <p className="font-medium text-gray-700 dark:text-[#F5F7FF]">{loan.libro?.titulo || "Libro"}</p>
                    <p className="text-sm text-gray-500 dark:text-[#B7BDD6]">{loan.estudiante?.user?.nombreCompleto || "Estudiante"} · {formatDate(loan.fechaPrestamo)}</p>
                  </div>
                  <Badge className="bg-[#6C5CE7]/80">{loan.estado}</Badge>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
