import { useState } from "react";
import { useNavigate } from "react-router";
import { FaGraduationCap } from "react-icons/fa6";
import { Eye, EyeOff } from "lucide-react";
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#6C5CE7]/8 via-white to-[#6C5CE7]/16 p-4 transition-colors dark:from-[#202445] dark:via-[#25294D] dark:to-[#202445]">
      <Card className="w-full max-w-md border-gray-200/80 bg-white/95 shadow-xl backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/95 dark:shadow-[0_20px_50px_rgba(8,12,34,0.38)]">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#6C5CE7] shadow-[0_12px_30px_rgba(108,92,231,0.28)]">
              <FaGraduationCap size={30} className="text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl text-gray-900 dark:text-white">Edu Tech</CardTitle>
          <CardDescription className="text-gray-500 dark:text-[#B7BDD6]">Crea tu cuenta de estudiante</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombreCompleto" className="text-gray-700 dark:text-[#F5F7FF]">Nombre Completo</Label>
              <Input
                id="nombreCompleto"
                placeholder="Tu nombre completo"
                value={newStudent.nombreCompleto}
                onChange={(e) =>
                  setNewStudent({ ...newStudent, nombreCompleto: e.target.value })
                }
                required
                className="border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus-visible:border-[#6C5CE7] dark:border-gray-700 dark:bg-gray-700/60 dark:text-[#F5F7FF] dark:placeholder-[#8E95B5]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="documentoIdentidad" className="text-gray-700 dark:text-[#F5F7FF]">Documento de Identidad</Label>
              <Input
                id="documentoIdentidad"
                placeholder="Número de documento"
                value={newStudent.documentoIdentidad}
                onChange={(e) =>
                  setNewStudent({ ...newStudent, documentoIdentidad: e.target.value })
                }
                required
                className="border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus-visible:border-[#6C5CE7] dark:border-gray-700 dark:bg-gray-700/60 dark:text-[#F5F7FF] dark:placeholder-[#8E95B5]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="correo" className="text-gray-700 dark:text-[#F5F7FF]">Correo Electrónico</Label>
              <Input
                id="correo"
                type="email"
                placeholder="tu@correo.com"
                value={newStudent.correo}
                onChange={handleEmailChange}
                onInvalid={handleEmailInvalid}
                required
                className="border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus-visible:border-[#6C5CE7] dark:border-gray-700 dark:bg-gray-700/60 dark:text-[#F5F7FF] dark:placeholder-[#8E95B5]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 dark:text-[#F5F7FF]">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={newStudent.password}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, password: e.target.value })
                  }
                  required
                  className="border-gray-200 bg-white pr-10 text-gray-900 placeholder:text-gray-400 focus-visible:border-[#6C5CE7] dark:border-gray-700 dark:bg-gray-700/60 dark:text-[#F5F7FF] dark:placeholder-[#8E95B5]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600 dark:text-[#8E95B5] dark:hover:text-[#F5F7FF]"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmarPassword" className="text-gray-700 dark:text-[#F5F7FF]">Confirmar Contraseña</Label>
              <div className="relative">
                <Input
                  id="confirmarPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={newStudent.confirmarPassword}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, confirmarPassword: e.target.value })
                  }
                  required
                  className="border-gray-200 bg-white pr-10 text-gray-900 placeholder:text-gray-400 focus-visible:border-[#6C5CE7] dark:border-gray-700 dark:bg-gray-700/60 dark:text-[#F5F7FF] dark:placeholder-[#8E95B5]"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600 dark:text-[#8E95B5] dark:hover:text-[#F5F7FF]"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#6C5CE7] hover:bg-[#5b4bd1]"
            >
              {loading ? "Creando cuenta..." : "Crear Cuenta"}
            </Button>

            <div className="text-center pt-2">
              <span className="text-sm text-gray-500 dark:text-[#B7BDD6]">¿Ya tienes cuenta? </span>
              <button
                type="button"
                onClick={() => navigate("/")}
                className="text-sm font-medium text-[#6C5CE7] hover:underline dark:text-[#b6adff]"
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
