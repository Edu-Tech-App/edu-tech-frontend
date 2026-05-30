import { useState } from "react";
import { useNavigate } from "react-router";
import { Eye, EyeOff, ArrowRight, Sun, Moon } from "lucide-react";
import { FaGraduationCap } from "react-icons/fa6";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export const LoginPage = () => {
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const { isDark, toggleTheme } = useTheme();

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
    // <div className="flex min-h-screen overflow-hidden bg-[#0f1225] font-sans">
    <div className="flex flex-row-reverse min-h-screen overflow-hidden bg-[#0f1225] font-sans">

      {/* ── LEFT PANEL ── */}
      <div className="relative hidden lg:flex lg:w-[58%] xl:w-[62%] flex-col">
        {/* Background image */}
        <img
          src="/img/img-login.png"
          alt="Campus EduTech"
          className="absolute inset-0 h-full w-full object-cover object-right"
        />
        {/* Dark blue gradient overlay */}
        {/* <div className="absolute inset-0 bg-gradient-to-br from-[#1a0f3d]/88 via-[#2d1f6e]/72 to-[#1a0f3d]/85" /> */}
        {/* Subtle vignette */}
        {/* <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,transparent_40%,rgba(15,8,40,0.55)_100%)]" /> */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_right,transparent_25%,rgba(15,8,40,0.65)_100%)]" />

        {/* Desaturation filter */}
        {/* <div className="absolute inset-0 backdrop-saturate-[0.55]" /> */}

        {/* Content over image */}

        {/* <div className="relative z-10 flex h-full flex-col justify-between p-10 xl:p-14"> */}
        <div className="relative z-10 flex h-full justify-end p-10 xl:p-14">


          {/* Logo top-left */}
          {/* <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur-md ring-1 ring-white/20">
              <GraduationCap size={18} className="text-white" />
            </div>
            <span className="text-[15px] font-semibold tracking-wide text-white/90">EduTech</span>
          </div> */}

          {/* Bottom copy */}
          {/* <div className="max-w-md"> */}
          {/* <div className="max-w-md text-right self-start mt-4"> */}


            {/* <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="text-xs font-medium tracking-wide text-white/80">Plataforma Educativa Institucional</span>
            </div>
            <h1 className="text-4xl xl:text-5xl font-bold leading-[1.1] text-white">
              El conocimiento<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#c4b5fd] to-[#a78bfa]">sin límites.</span>
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed text-white/60">
              Gestiona préstamos, reservas, calificaciones y más desde un solo lugar diseñado para toda la comunidad académica.
            </p> */}

            {/* Stats row */}
            {/* <div className="mt-8 flex gap-8">
              {[
                { value: "12k+", label: "Estudiantes" },
                { value: "340+", label: "Docentes" },
                { value: "98%", label: "Satisfacción" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-white/50 mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div> */}
          {/* </div> */}
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="relative flex flex-1 flex-col items-center justify-center bg-[#f3f6fb] px-6 py-12 sm:px-10 dark:bg-[#202445]">

        {/* Botón dark/light — esquina superior izquierda */}
        <button
          type="button"
          onClick={toggleTheme}
          className="absolute left-5 top-5 flex items-center justify-center rounded-xl border border-gray-200 bg-white p-2 text-gray-500 shadow-sm transition hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
          aria-label="Cambiar tema"
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <div className="w-full max-w-[380px] rounded-2xl bg-[#F4F4F8] px-8 py-8 dark:bg-[#202445]">

          {/* Logo — icóno con doble-click camuflado → registro */}
          <div className="mb-8 flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-3">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#6C5CE7] select-none"
                onDoubleClick={() => navigate("/register")}
              >
                <FaGraduationCap size={22} className="text-white" />
              </div>
              <span className="text-[37px] font-bold leading-[48px] tracking-tight text-gray-900 dark:text-white">
                Edu Tech
              </span>
            </div>
            <p className="text-[13px] text-gray-400 dark:text-gray-500">Sistema Institucional</p>
          </div>

          {/* Google button */}
          {/* <button
            type="button"
            className="mb-5 flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 active:scale-[0.98] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path fill="#EA4335" d="M24 9.5c3.14 0 5.95 1.08 8.17 2.85l6.1-6.1C34.46 3.08 29.5 1 24 1 14.82 1 7.07 6.48 3.68 14.18l7.13 5.54C12.57 13.29 17.85 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.52 24.5c0-1.64-.15-3.22-.42-4.75H24v9h12.71c-.55 2.98-2.22 5.5-4.73 7.2l7.24 5.63C43.33 37.45 46.52 31.43 46.52 24.5z"/>
              <path fill="#FBBC05" d="M10.81 28.28A14.5 14.5 0 0 1 9.5 24c0-1.49.26-2.93.71-4.28l-7.13-5.54A22.97 22.97 0 0 0 1 24c0 3.74.9 7.28 2.49 10.4l7.32-6.12z"/>
              <path fill="#34A853" d="M24 47c5.75 0 10.58-1.9 14.1-5.17l-7.24-5.63c-1.97 1.32-4.49 2.1-6.86 2.1-6.15 0-11.43-3.79-13.19-9.22l-7.32 6.12C7.07 41.52 14.82 47 24 47z"/>
            </svg>
            Continuar con Google
          </button> */}

          {/* Divider */}
          {/* <div className="relative mb-5 flex items-center">
            <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
            <span className="mx-3 text-xs text-gray-400">o con tu correo</span>
            <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
          </div> */}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="correo" className="mb-1.5 block text-[13px] font-semibold text-gray-800 dark:text-gray-300">
                Correo institucional
              </label>
              <input
                id="correo"
                type="email"
                placeholder="usuario@edutech.edu"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-400 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/15 dark:border-gray-600 dark:bg-[#1e2340] dark:text-white dark:placeholder-gray-500 dark:focus:border-[#6C5CE7]"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="password" className="text-[13px] font-semibold text-gray-800 dark:text-gray-300">Contraseña</label>
                <button type="button" className="text-[12px] text-[#6C5CE7] hover:underline dark:text-[#a99df5]">¿Olvidaste tu contraseña?</button>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-400 bg-white px-3.5 py-2.5 pr-10 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/15 dark:border-gray-600 dark:bg-[#1e2340] dark:text-white dark:placeholder-gray-500 dark:focus:border-[#6C5CE7]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 transition hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                role="checkbox"
                aria-checked={rememberMe}
                onClick={() => setRememberMe((p) => !p)}
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
                  rememberMe
                    ? "border-[#6C5CE7] bg-[#6C5CE7]"
                    : "border-gray-400 bg-white dark:border-gray-600 dark:bg-gray-800"
                }`}
              >
                {rememberMe && (
                  <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                    <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
              <span className="text-[13px] text-gray-700 dark:text-gray-400">Recordar mi sesión</span>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="group mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-[#6C5CE7] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5b4bd1] active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? (
                "Iniciando sesión..."
              ) : (
                <>
                  Iniciar sesión
                  <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};
