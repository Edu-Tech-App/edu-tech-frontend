import { useState } from "react";
import { useNavigate } from "react-router";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "../components/ui/card";
import { Label } from "../components/ui/label";
import { GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "../components/ui/dialog";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const LoginPage = () => {
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  // Estado del formulario de registro
  const [showRegister, setShowRegister] = useState(false);
  const [loadingRegister, setLoadingRegister] = useState(false);
  const [newStudent, setNewStudent] = useState({
    nombreCompleto: "",
    documentoIdentidad: "",
    correo: "",
    password: "",
    confirmarPassword: "",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(correo, password);
      toast.success("¡Bienvenido!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Credenciales inválidas");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (
      !newStudent.nombreCompleto ||
      !newStudent.documentoIdentidad ||
      !newStudent.correo ||
      !newStudent.password
    ) {
      toast.error("Por favor completa todos los campos");
      return;
    }
    if (newStudent.password !== newStudent.confirmarPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    if (newStudent.password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoadingRegister(true);
    try {
      const response = await fetch(`${API_URL}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombreCompleto: newStudent.nombreCompleto,
          documentoIdentidad: newStudent.documentoIdentidad,
          correo: newStudent.correo,
          password: newStudent.password,
          rol: "ESTUDIANTE", // ✅ En mayúsculas como lo espera el backend
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          Array.isArray(errorData.message)
            ? errorData.message.join(", ")
            : errorData.message || "Error al crear la cuenta"
        );
      }

      toast.success("¡Cuenta creada! Ya puedes iniciar sesión.");
      setShowRegister(false);
      setNewStudent({
        nombreCompleto: "",
        documentoIdentidad: "",
        correo: "",
        password: "",
        confirmarPassword: "",
      });
    } catch (error: any) {
      toast.error(error.message || "Error al crear la cuenta");
    } finally {
      setLoadingRegister(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-900 rounded-full flex items-center justify-center">
              <GraduationCap size={32} className="text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl">Edu-Tech</CardTitle>
          <CardDescription>Sistema Educativo Institucional</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="correo">Correo Electrónico</Label>
              <Input
                id="correo"
                type="email"
                placeholder="user@edutech.edu"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-900 hover:bg-blue-800"
            >
              {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>

            {/* Botón para abrir el registro */}
            <div className="text-center pt-2">
              <span className="text-sm text-gray-500">¿No tienes cuenta? </span>
              <button
                type="button"
                onClick={() => setShowRegister(true)}
                className="text-sm text-blue-900 font-medium hover:underline"
              >
                Regístrate como estudiante
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Dialog de registro */}
      <Dialog open={showRegister} onOpenChange={setShowRegister}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Cuenta de Estudiante</DialogTitle>
            <DialogDescription>Completa tus datos para registrarte</DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div>
              <Label>Nombre Completo</Label>
              <Input
                placeholder="Tu nombre completo"
                value={newStudent.nombreCompleto}
                onChange={(e) =>
                  setNewStudent({ ...newStudent, nombreCompleto: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Documento de Identidad</Label>
              <Input
                placeholder="Número de documento"
                value={newStudent.documentoIdentidad}
                onChange={(e) =>
                  setNewStudent({ ...newStudent, documentoIdentidad: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Correo Electrónico</Label>
              <Input
                type="email"
                placeholder="tu@correo.com"
                value={newStudent.correo}
                onChange={(e) =>
                  setNewStudent({ ...newStudent, correo: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Contraseña</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={newStudent.password}
                onChange={(e) =>
                  setNewStudent({ ...newStudent, password: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Confirmar Contraseña</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={newStudent.confirmarPassword}
                onChange={(e) =>
                  setNewStudent({ ...newStudent, confirmarPassword: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRegister(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleRegister}
              disabled={loadingRegister}
              className="bg-blue-900 hover:bg-blue-800"
            >
              {loadingRegister ? "Creando cuenta..." : "Crear Cuenta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
