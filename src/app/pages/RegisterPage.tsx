import { useState } from "react";
import { useNavigate } from "react-router";
import { GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../services/api";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

export const RegisterPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [newStudent, setNewStudent] = useState({
    nombreCompleto: "",
    documentoIdentidad: "",
    correo: "",
    password: "",
    confirmarPassword: "",
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

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

    setLoading(true);

    try {
      await api.registerStudent({
        nombreCompleto: newStudent.nombreCompleto,
        documentoIdentidad: newStudent.documentoIdentidad,
        correo: newStudent.correo,
        password: newStudent.password,
        rol: "ESTUDIANTE",
      });

      toast.success("¡Cuenta creada! Ya puedes iniciar sesión.");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Error al crear la cuenta");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailInvalid = (e: React.InvalidEvent<HTMLInputElement>) => {
    e.currentTarget.setCustomValidity("Ingresa un correo electronico valido.");
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.currentTarget.setCustomValidity("");
    setNewStudent({ ...newStudent, correo: e.target.value });
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
          <CardDescription>Crea tu cuenta de estudiante</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombreCompleto">Nombre Completo</Label>
              <Input
                id="nombreCompleto"
                placeholder="Tu nombre completo"
                value={newStudent.nombreCompleto}
                onChange={(e) =>
                  setNewStudent({ ...newStudent, nombreCompleto: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="documentoIdentidad">Documento de Identidad</Label>
              <Input
                id="documentoIdentidad"
                placeholder="Número de documento"
                value={newStudent.documentoIdentidad}
                onChange={(e) =>
                  setNewStudent({ ...newStudent, documentoIdentidad: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="correo">Correo Electrónico</Label>
              <Input
                id="correo"
                type="email"
                placeholder="tu@correo.com"
                value={newStudent.correo}
                onChange={handleEmailChange}
                onInvalid={handleEmailInvalid}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={newStudent.password}
                onChange={(e) =>
                  setNewStudent({ ...newStudent, password: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmarPassword">Confirmar Contraseña</Label>
              <Input
                id="confirmarPassword"
                type="password"
                placeholder="••••••••"
                value={newStudent.confirmarPassword}
                onChange={(e) =>
                  setNewStudent({ ...newStudent, confirmarPassword: e.target.value })
                }
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-900 hover:bg-blue-800"
            >
              {loading ? "Creando cuenta..." : "Crear Cuenta"}
            </Button>

            <div className="text-center pt-2">
              <span className="text-sm text-gray-500">¿Ya tienes cuenta? </span>
              <button
                type="button"
                onClick={() => navigate("/")}
                className="text-sm text-blue-900 font-medium hover:underline"
              >
                Inicia sesión
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
