import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { PageLayout } from "../components/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { ArrowLeft, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { api, API_URL_PUBLIC } from "../../services/api";
import { formatBookCategory } from "../../services/catalogs";
import { formatDateEs, parseLocalDate, toDateInputValue } from "../../services/dates";

interface BookDetail {
  id: number;
  titulo: string;
  autor: string;
  categoria: string | null;
  editorial: string | null;
  portadaUrl?: string | null;
  cantidadDisponible: number;
  estado: string;
}

const formatCategory = (categoria: string | null) =>
  !categoria ? "Sin categoría" : formatBookCategory(categoria) || categoria;

export const BookDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showBorrowDialog, setShowBorrowDialog] = useState(false);
  const [book, setBook] = useState<BookDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submittingLoan, setSubmittingLoan] = useState(false);

  useEffect(() => {
    const loadBook = async () => {
      if (!id) { toast.error("No se encontró el identificador del libro"); navigate("/library"); return; }
      setLoading(true);
      try {
        const data = await api.getBookById(Number(id));
        setBook(data);
      } catch (error: any) {
        toast.error(error.message || "No se pudo cargar el libro");
        navigate("/library");
      } finally {
        setLoading(false);
      }
    };
    void loadBook();
  }, [id, navigate]);

  const handleBorrow = async () => {
    if (!book) return;
    if (book.cantidadDisponible <= 0 || book.estado !== "DISPONIBLE") {
      toast.error("Este libro no está disponible para préstamo en este momento.");
      return;
    }

    if (user?.id) {
      try {
        const loans = await api.getStudentLoans(user.id);
        const hasActiveLoan = (Array.isArray(loans) ? loans : []).some(
          (loan) => loan?.libroId === book.id && loan?.estado === "ACTIVO",
        );

        if (hasActiveLoan) {
          toast.error("Ya tienes este libro prestado actualmente. Debes devolverlo antes de solicitarlo de nuevo.");
          return;
        }
      } catch {
        // Si esta validación falla, dejamos que el backend conserve la última palabra.
      }
    }

    setShowBorrowDialog(true);
  };

  const dueDate = (() => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return toDateInputValue(date);
  })();

  const dueDateLabel = new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parseLocalDate(dueDate));

  const confirmBorrow = async () => {
    if (!book || !user?.id) return;

    try {
      setSubmittingLoan(true);
      await api.createLoan({
        libroId: book.id,
        estudianteId: user.id,
        fechaLimiteDevolucion: dueDate,
      });

      setBook((current) =>
        current
          ? {
              ...current,
              cantidadDisponible: Math.max(0, current.cantidadDisponible - 1),
            }
          : current,
      );

      setShowBorrowDialog(false);
      toast.success("Préstamo solicitado correctamente");
      navigate("/my-loans");
    } catch (error: any) {
      toast.error(error?.message || "No se pudo solicitar el préstamo");
    } finally {
      setSubmittingLoan(false);
    }
  };

  const formatStatus = (estado: string) => {
    if (estado === "DISPONIBLE") return "Disponible";
    if (estado === "MANTENIMIENTO") return "Mantenimiento";
    if (estado === "BAJA") return "Baja";
    return estado;
  };

  const getCoverStyles = (categoria: string | null) => {
    const styles: Record<string, string> = {
      INGENIERIA_SISTEMAS: "from-slate-900 via-[#6C5CE7] to-cyan-700",
      INGENIERIA_CIVIL: "from-stone-800 via-amber-700 to-orange-500",
      INGENIERIA_INDUSTRIAL: "from-zinc-900 via-neutral-700 to-lime-600",
      ADMINISTRACION: "from-emerald-900 via-green-700 to-teal-500",
      CONTADURIA: "from-sky-950 via-[#6C5CE7] to-sky-500",
      ECONOMIA: "from-emerald-950 via-emerald-700 to-yellow-500",
      DERECHO: "from-neutral-950 via-neutral-800 to-red-700",
      MEDICINA: "from-red-950 via-rose-700 to-pink-500",
      ENFERMERIA: "from-cyan-900 via-teal-700 to-sky-400",
      PSICOLOGIA: "from-fuchsia-950 via-purple-700 to-pink-500",
      EDUCACION: "from-indigo-950 via-indigo-700 to-yellow-500",
      MATEMATICAS: "from-slate-950 via-violet-800 to-indigo-500",
    };
    return styles[categoria || ""] || "from-slate-800 via-slate-700 to-slate-500";
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="p-6">
          <Card className="border-gray-200 dark:border-gray-700 dark:bg-gray-800">
            <CardContent className="p-6 text-gray-600 dark:text-gray-300">Cargando libro...</CardContent>
          </Card>
        </div>
      </PageLayout>
    );
  }

  if (!book) return null;

  return (
    <PageLayout>
      <div className="p-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/library')}
          className="mb-4 text-gray-700 hover:text-gray-900 dark:text-gray-200 dark:hover:text-white"
        >
          <ArrowLeft size={16} className="mr-2" />
          Volver al Catálogo
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Card className="border-gray-200 dark:border-gray-700 dark:bg-gray-800">
              <CardContent className="p-6">
                {book.portadaUrl ? (
                  <img
                    src={`${API_URL_PUBLIC}${book.portadaUrl}`}
                    alt={book.titulo}
                    className="mb-4 aspect-[3/4] w-full rounded-lg border border-gray-200 object-cover dark:border-gray-700"
                  />
                ) : (
                  <div className={`aspect-[3/4] rounded-lg mb-4 overflow-hidden bg-gradient-to-br ${getCoverStyles(book.categoria)}`}>
                    <div className="h-full flex flex-col justify-between p-6 text-white">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold tracking-[0.3em] uppercase opacity-80">Edu-Tech</span>
                        <BookOpen size={28} className="opacity-80" />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.25em] opacity-75 mb-3">{formatCategory(book.categoria)}</p>
                        <h3 className="text-2xl font-bold leading-tight mb-3 line-clamp-4">{book.titulo}</h3>
                        <p className="text-sm opacity-85 line-clamp-2">{book.autor}</p>
                      </div>
                      <div className="pt-4 border-t border-white/20">
                        <p className="text-xs uppercase tracking-[0.2em] opacity-70">Biblioteca Institucional</p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Badge className={book.estado === "DISPONIBLE" ? "bg-emerald-600 text-white dark:bg-emerald-500" : "bg-amber-500 text-slate-950 dark:bg-amber-400"}>
                    {formatStatus(book.estado)}
                  </Badge>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{book.cantidadDisponible} copias disponibles</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2 space-y-6">
            <Card className="border-gray-200 dark:border-gray-700 dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="text-2xl font-semibold text-gray-900 dark:text-white">{book.titulo}</CardTitle>
                <p className="text-base font-medium text-gray-700 dark:text-gray-300">{book.autor}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-6 text-gray-700 dark:text-gray-300">
                  Consulta la información principal del libro seleccionado dentro del catálogo institucional.
                </p>
                <div className="grid grid-cols-2 gap-4 border-t border-gray-200 pt-4 dark:border-gray-700">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">ID</p>
                    <p className="text-base font-semibold text-gray-900 dark:text-white">{book.id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Categoría</p>
                    <p className="text-base font-semibold text-gray-900 dark:text-white">{formatCategory(book.categoria)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Editorial</p>
                    <p className="text-base font-semibold text-gray-900 dark:text-white">{book.editorial || "Sin editorial"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Estado</p>
                    <p className="text-base font-semibold text-gray-900 dark:text-white">{formatStatus(book.estado)}</p>
                  </div>
                </div>
                {(user?.rol === "estudiante" || user?.rol === "docente") && (
                  <div className="pt-4">
                    <Button onClick={() => void handleBorrow()} className="w-full bg-[#6C5CE7] hover:bg-[#5b4bd1]">
                      Solicitar Préstamo
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <Dialog open={showBorrowDialog} onOpenChange={setShowBorrowDialog}>
          <DialogContent className="dark:border-gray-700 dark:bg-gray-800">
            <DialogHeader>
              <DialogTitle className="text-gray-900 dark:text-white">Confirmar Préstamo</DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-300">
                ¿Estás seguro de que quieres solicitar "{book.titulo}"?
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Fecha de vencimiento: {dueDateLabel} (30 días)</p>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Las devoluciones tardías tendrán una multa de $1 por día.</p>
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
                Al solicitar este libro, tu pedido quedará registrado y se te notificará cuando el bibliotecario apruebe la solicitud para que puedas pasar por el libro en la biblioteca.
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowBorrowDialog(false)} className="dark:border-gray-600 dark:text-gray-200">
                Cancelar
              </Button>
              <Button onClick={confirmBorrow} disabled={submittingLoan} className="bg-[#6C5CE7] hover:bg-[#5b4bd1]">
                {submittingLoan ? "Procesando..." : "Confirmar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  );
};
