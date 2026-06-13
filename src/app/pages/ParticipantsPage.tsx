import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, CheckCircle2, KeyRound, LogOut, Moon, ShieldCheck, Sun } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { isParticipantsAdmin } from "../utils/participants-admin";
import { api } from "../../services/api";

type InvitationValidationResult = {
  valido: true;
  codigo: string;
};

type InvitationRegisterResult = {
  registrado: true;
  nombre: string;
  codigo: string;
};

export const ParticipantsPage = () => {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [validatedCode, setValidatedCode] = useState<InvitationValidationResult | null>(null);
  const [invitationResult, setInvitationResult] = useState<InvitationRegisterResult | null>(null);
  const [validatingCode, setValidatingCode] = useState(false);
  const [registeringInvitation, setRegisteringInvitation] = useState(false);

  const trimmedName = useMemo(() => nombre.trim(), [nombre]);
  const canShowNameForm = !!validatedCode && !invitationResult;

  const resetFlow = () => {
    setCodigo("");
    setNombre("");
    setValidatedCode(null);
    setInvitationResult(null);
  };

  const handleValidateCode = async () => {
    if (codigo.trim().length !== 6) {
      toast.error("El código debe tener 6 dígitos");
      return;
    }

    setValidatingCode(true);
    setInvitationResult(null);
    try {
      const response = await api.validateParticipantInvitationCode(codigo.trim());
      setValidatedCode(response);
      toast.success("Código válido. Ahora completa tu nombre para registrarte.");
    } catch (error: any) {
      toast.error(error.message || "No se pudo validar el código");
    } finally {
      setValidatingCode(false);
    }
  };

  const handleRegisterWithInvitation = async () => {
    if (!validatedCode) {
      toast.error("Primero valida un código de invitación");
      return;
    }

    if (!trimmedName) {
      toast.error("Ingresa el nombre del participante");
      return;
    }

    setRegisteringInvitation(true);
    try {
      const response = await api.registerParticipantWithInvitation({
        nombre: trimmedName,
        codigo: validatedCode.codigo,
      });
      setInvitationResult(response);
      toast.success("Registro completado correctamente");
    } catch (error: any) {
      toast.error(error.message || "No se pudo registrar con el código");
    } finally {
      setRegisteringInvitation(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/participants");
    toast.success("Sesión cerrada");
  };

  return (
    <div className="min-h-screen bg-[#f3f6fb] px-4 py-6 transition-colors dark:bg-[#202445] sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-5xl flex-col">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/")}
              className="gap-2 rounded-xl border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              <ArrowLeft size={16} />
              Volver
            </Button>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">Participantes</h1>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && isParticipantsAdmin(user) && (
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/participants/admin")}
                className="gap-2 rounded-xl border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                <ShieldCheck size={16} />
                Administrar
              </Button>
            )}
            {isAuthenticated && (
              <Button
                type="button"
                variant="outline"
                onClick={handleLogout}
                className="gap-2 rounded-xl border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                <LogOut size={16} />
                Cerrar sesión
              </Button>
            )}
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

        <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-[#202445]">
            <CardHeader className="border-b border-gray-100 px-5 py-4 dark:border-gray-700">
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Registro con código único</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-5 py-5">
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
                Ingresa primero el código único que te compartió el administrador. Si es válido, el sistema te mostrará el formulario para registrar tu nombre.
              </div>

              <div>
                <Label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Código de invitación</Label>
                <Input
                  value={codigo}
                  onChange={(e) => {
                    setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6));
                    setValidatedCode(null);
                    setInvitationResult(null);
                  }}
                  placeholder="Código de 6 dígitos"
                  className="dark:border-gray-600 dark:bg-[#1e2340] dark:text-white"
                />
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button onClick={handleValidateCode} disabled={validatingCode} className="gap-2 bg-[#6C5CE7] hover:bg-[#5b4bd1]">
                  <KeyRound size={16} />
                  {validatingCode ? "Validando..." : "Validar código"}
                </Button>
                {(validatedCode || invitationResult || codigo || nombre) && (
                  <Button variant="outline" onClick={resetFlow} className="dark:border-gray-600 dark:text-gray-200">
                    Reiniciar
                  </Button>
                )}
              </div>

              {canShowNameForm && (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-[#1b203d]">
                  <div className="mb-3 flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-[#6C5CE7]" />
                    <p className="text-sm font-medium text-gray-800 dark:text-white">Código aprobado</p>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre completo</Label>
                      <Input
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        placeholder="Ej. Laura Gomez"
                        className="dark:border-gray-600 dark:bg-[#202445] dark:text-white"
                      />
                    </div>
                    <Button onClick={handleRegisterWithInvitation} disabled={registeringInvitation} className="bg-[#6C5CE7] hover:bg-[#5b4bd1]">
                      {registeringInvitation ? "Registrando..." : "Registrar participante"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-[#202445]">
            <CardHeader className="border-b border-gray-100 px-5 py-4 dark:border-gray-700">
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Estado del proceso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-5 py-5">
              {!validatedCode && !invitationResult ? (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500 dark:border-gray-700 dark:bg-[#1b203d] dark:text-gray-400">
                  Esperando un código válido para habilitar el formulario de registro.
                </div>
              ) : null}

              {validatedCode && !invitationResult && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium">El código {validatedCode.codigo} está disponible.</p>
                      <p className="mt-1 text-xs opacity-80">Ahora puedes completar el nombre para dejar el registro confirmado.</p>
                    </div>
                  </div>
                </div>
              )}

              {invitationResult && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium">{invitationResult.nombre} quedó registrado con el código {invitationResult.codigo}.</p>
                      <p className="mt-1 text-xs opacity-80">Ese código ya quedó consumido y no podrá reutilizarse.</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-gray-700 dark:bg-[#1b203d] dark:text-gray-300">
                <p className="font-medium text-gray-800 dark:text-white">Nuevo flujo</p>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>1. El administrador genera un código único.</li>
                  <li>2. El participante valida ese código en esta ruta.</li>
                  <li>3. Si el código sirve, se habilita el formulario de nombre.</li>
                  <li>4. Al guardar, el código queda marcado como usado.</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
