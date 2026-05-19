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

export const LoginPage = () => {
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

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
                onClick={() => navigate("/register")}
                className="text-sm text-blue-900 font-medium hover:underline"
              >
                Registrarme
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
