import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { KeyRound, LogOut, Moon, Search, Sun } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { api } from "../../services/api";
import { formatDateTimeEs } from "../../services/dates";

type InvitationCode = {
  id: number;
  codigo: string;
  generadoPor: string | null;
  registradoNombre: string | null;
  usado: boolean;
  usadoEn: string | null;
  creadoEn: string;
};

export const ParticipantsAdminPage = () => {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const [invitationCodes, setInvitationCodes] = useState<InvitationCode[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [generatingInvitationCode, setGeneratingInvitationCode] = useState(false);

  const loadInvitationCodes = async () => {
    try {
      setLoading(true);
      const invitations = await api.getParticipantInvitationCodes();
      setInvitationCodes(Array.isArray(invitations) ? invitations : []);
    } catch (error: any) {
      toast.error(error.message || "No se pudieron cargar los códigos de participantes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadInvitationCodes();
  }, []);

  const registeredParticipants = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const registered = invitationCodes.filter((code) => code.usado && code.registradoNombre);

    if (!term) {
      return registered;
    }

    return registered.filter((item) =>
      item.registradoNombre!.toLowerCase().includes(term) || item.codigo.toLowerCase().includes(term),
    );
  }, [invitationCodes, searchTerm]);

  const availableCodes = useMemo(
    () => invitationCodes.filter((code) => !code.usado),
    [invitationCodes],
  );

  const handleGenerateInvitationCode = async () => {
    setGeneratingInvitationCode(true);
    try {
      const result = await api.generateParticipantInvitationCode();
      toast.success(`Código generado: ${result.codigo}`);
      await loadInvitationCodes();
    } catch (error: any) {
      toast.error(error.message || "No se pudo generar el código");
    } finally {
      setGeneratingInvitationCode(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
    toast.success("Sesión cerrada");
  };

  return (
    <div className="min-h-screen bg-[#f3f6fb] px-4 py-6 transition-colors dark:bg-[#202445] sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl flex-col">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">Administrar participantes</h1>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleLogout}
              className="gap-2 rounded-xl border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              <LogOut size={16} />
              Cerrar sesión
            </Button>
            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center justify-center rounded-xl border border-gray-200 bg-white p-2 text-gray-500 shadow-sm transition hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
              aria-label="Cambiar tema"
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>

        <Card className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-[#202445]">
          <CardHeader className="border-b border-gray-100 px-5 py-4 dark:border-gray-700">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Participantes registrados</CardTitle>
              <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
                <div className="flex min-w-[280px] items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 dark:border-gray-700 dark:bg-gray-800">
                  <Search size={16} className="text-gray-400" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por nombre o código"
                    className="h-9 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0 dark:bg-transparent dark:text-white dark:placeholder-gray-500"
                  />
                </div>
                <Button
                  onClick={handleGenerateInvitationCode}
                  disabled={generatingInvitationCode}
                  className="h-9 gap-2 bg-[#6C5CE7] px-4 hover:bg-[#5b4bd1]"
                >
                  <KeyRound size={16} />
                  {generatingInvitationCode ? "Generando..." : "Generar código"}
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-auto">
              <table className="w-full min-w-[760px] table-fixed border-collapse text-sm">
                <colgroup>
                  <col className="w-[28%]" />
                  <col className="w-[18%]" />
                  <col className="w-[18%]" />
                  <col className="w-[18%]" />
                  <col className="w-[18%]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-gray-100 bg-[#EEF2FF] dark:border-gray-700 dark:bg-[#2F355F]">
                    <th className="h-10 px-4 text-left font-semibold text-gray-700 dark:text-[#E6EBFF]">Nombre</th>
                    <th className="h-10 px-4 text-left font-semibold text-gray-700 dark:text-[#E6EBFF]">Código usado</th>
                    <th className="h-10 px-4 text-left font-semibold text-gray-700 dark:text-[#E6EBFF]">Estado</th>
                    <th className="h-10 px-4 text-left font-semibold text-gray-700 dark:text-[#E6EBFF]">Registrado en</th>
                    <th className="h-10 px-4 text-left font-semibold text-gray-700 dark:text-[#E6EBFF]">Generado en</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-gray-500 dark:text-gray-400">
                        Cargando participantes registrados...
                      </td>
                    </tr>
                  ) : registeredParticipants.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-gray-500 dark:text-gray-400">
                        Todavía no hay participantes registrados con códigos de invitación.
                      </td>
                    </tr>
                  ) : (
                    registeredParticipants.map((item) => (
                      <tr key={item.id} className="border-b border-gray-100 transition-colors hover:bg-gray-50/70 dark:border-gray-700 dark:hover:bg-gray-800/60">
                        <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">{item.registradoNombre}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-[#E6EBFF]">
                          <span className="inline-flex rounded-lg bg-gray-100 px-2.5 py-1 font-medium dark:bg-[#2F355F]">{item.codigo}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                            Registrado
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-[#B7BDD6]">
                          {item.usadoEn ? formatDateTimeEs(item.usadoEn) : "-"}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-[#B7BDD6]">
                          {formatDateTimeEs(item.creadoEn)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4 border border-gray-200 bg-white dark:border-gray-700 dark:bg-[#202445]">
          <CardHeader className="border-b border-gray-100 px-5 py-4 dark:border-gray-700">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Códigos disponibles</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-auto">
              <table className="w-full min-w-[560px] table-fixed border-collapse text-sm">
                <colgroup>
                  <col className="w-[28%]" />
                  <col className="w-[24%]" />
                  <col className="w-[24%]" />
                  <col className="w-[24%]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-gray-100 bg-[#EEF2FF] dark:border-gray-700 dark:bg-[#2F355F]">
                    <th className="h-10 px-4 text-left font-semibold text-gray-700 dark:text-[#E6EBFF]">Código</th>
                    <th className="h-10 px-4 text-left font-semibold text-gray-700 dark:text-[#E6EBFF]">Estado</th>
                    <th className="h-10 px-4 text-left font-semibold text-gray-700 dark:text-[#E6EBFF]">Generado por</th>
                    <th className="h-10 px-4 text-left font-semibold text-gray-700 dark:text-[#E6EBFF]">Creado en</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                        Cargando códigos disponibles...
                      </td>
                    </tr>
                  ) : availableCodes.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                        No hay códigos disponibles en este momento.
                      </td>
                    </tr>
                  ) : (
                    availableCodes.map((item) => (
                      <tr key={item.id} className="border-b border-gray-100 dark:border-gray-700">
                        <td className="px-4 py-3 text-gray-800 dark:text-white">
                          <span className="inline-flex rounded-lg bg-gray-100 px-2.5 py-1 font-medium dark:bg-[#2F355F]">{item.codigo}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                            Disponible
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-[#B7BDD6]">{item.generadoPor || "-"}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-[#B7BDD6]">{formatDateTimeEs(item.creadoEn)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
