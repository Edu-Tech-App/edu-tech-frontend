import { useState } from "react";
import { useNavigate } from "react-router";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { GraduationCap, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";

export const LoginPage = () => {
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center p-4 transition-colors">
      <Card className="w-full max-w-md dark:bg-gray-800 dark:border-gray-700">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-900 rounded-full flex items-center justify-center">
              <GraduationCap size={32} className="text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl dark:text-white">Edu-Tech</CardTitle>
          <CardDescription className="dark:text-gray-400">Sistema Educativo Institucional</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="correo" className="dark:text-gray-300">Correo Electrónico</Label>
              <Input
                id="correo"
                type="email"
                placeholder="user@edutech.edu"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                required
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="dark:text-gray-300">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-blue-900 hover:bg-blue-800">
              {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>

            <div className="text-center pt-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">¿No tienes cuenta? </span>
              <button
                type="button"
                onClick={() => navigate("/register")}
                className="text-sm text-blue-900 dark:text-blue-400 font-medium hover:underline"
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
