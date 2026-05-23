import { useState } from "react";
import { useNavigate } from "react-router";
import { FaGraduationCap } from "react-icons/fa6";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Eye, EyeOff } from "lucide-react";
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#6C5CE7]/8 via-white to-[#6C5CE7]/16 p-4 transition-colors dark:from-[#202445] dark:via-[#25294D] dark:to-[#202445]">
      <Card className="w-full max-w-md border-gray-200/80 bg-white/95 shadow-xl backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/95 dark:shadow-[0_20px_50px_rgba(8,12,34,0.38)]">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#6C5CE7] shadow-[0_12px_30px_rgba(108,92,231,0.28)]">
              <FaGraduationCap size={30} className="text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl text-gray-900 dark:text-white">Edu Tech</CardTitle>
          <CardDescription className="text-gray-500 dark:text-[#B7BDD6]">Sistema Educativo Institucional</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="correo" className="text-gray-700 dark:text-[#F5F7FF]">Correo Electrónico</Label>
              <Input
                id="correo"
                type="email"
                placeholder="user@edutech.edu"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border-gray-200 bg-white pr-10 text-gray-900 placeholder:text-gray-400 focus-visible:border-[#6C5CE7] dark:border-gray-700 dark:bg-gray-700/60 dark:text-[#F5F7FF] dark:placeholder-[#8E95B5]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-[#8E95B5] dark:hover:text-[#F5F7FF] transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-[#6C5CE7] hover:bg-[#7C6CF0]">
              {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>

            <div className="text-center pt-2">
              <span className="text-sm text-gray-500 dark:text-[#B7BDD6]">¿No tienes cuenta? </span>
              <button
                type="button"
                onClick={() => navigate("/register")}
                className="text-sm text-[#6C5CE7] dark:text-[#b6adff] font-medium hover:underline"
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
