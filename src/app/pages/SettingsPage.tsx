import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "../components/Sidebar";
import { TopBar } from "../components/TopBar";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Building2, LockKeyhole, MoonStar, Palette, Save, ShieldCheck, TimerReset } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "../context/ThemeContext";

const SETTINGS_STORAGE_KEY = "edu_tech_admin_settings";

interface SystemSettings {
  institutionName: string;
  institutionCode: string;
  institutionEmail: string;
  institutionPhone: string;
  maxLoanDays: number;
  maxRenewals: number;
  maxRoomReservationHours: number;
  maxBookReservationDays: number;
  lateFineValue: number;
  damageFineValue: number;
  lossFineValue: number;
  sessionTimeoutMinutes: number;
  passwordMinLength: number;
  requireUppercase: boolean;
  requireNumbers: boolean;
  appearanceDensity: "compacta" | "media" | "amplia";
  highlightStyle: "suave" | "estandar" | "alto";
}

const defaultSettings: SystemSettings = {
  institutionName: "Edu Tech",
  institutionCode: "ET-UNI",
  institutionEmail: "admin@edutech.edu.co",
  institutionPhone: "300 000 0000",
  maxLoanDays: 14,
  maxRenewals: 2,
  maxRoomReservationHours: 3,
  maxBookReservationDays: 2,
  lateFineValue: 1000,
  damageFineValue: 25000,
  lossFineValue: 80000,
  sessionTimeoutMinutes: 30,
  passwordMinLength: 8,
  requireUppercase: true,
  requireNumbers: true,
  appearanceDensity: "media",
  highlightStyle: "estandar",
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value);

export const SettingsPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tab, setTab] = useState("institucion");
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        setSettings({ ...defaultSettings, ...JSON.parse(stored) });
      }
    } catch {
      setSettings(defaultSettings);
    }
  }, []);

  const metrics = useMemo(
    () => [
      { label: "Datos de la institución", value: settings.institutionName },
      { label: "Parámetros de préstamos", value: `${settings.maxLoanDays} días` },
      { label: "Tiempo máximo de reserva", value: `${settings.maxRoomReservationHours} h` },
      { label: "Valor de multas", value: formatCurrency(settings.lateFineValue) },
      { label: "Seguridad", value: `${settings.sessionTimeoutMinutes} min` },
      { label: "Apariencia del sistema", value: isDark ? "Oscuro" : "Claro" },
    ],
    [isDark, settings],
  );

  const updateSettings = <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    setSaving(true);
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      toast.success("Configuración guardada exitosamente");
    } finally {
      setSaving(false);
    }
  };

  const sectionCard = "border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900/40";

  return (
    <div className="h-screen overflow-hidden bg-background transition-colors">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <TopBar onMenuToggle={() => setSidebarOpen((prev) => !prev)} />

      <main className="lg:ml-64 mt-16 box-border flex h-[calc(100vh-4rem)] flex-col overflow-hidden p-4">
        <div className="grid grid-cols-2 gap-2 xl:grid-cols-6">
          {metrics.map((item) => (
            <Card key={item.label} className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
              <CardContent className="px-3 py-2">
                <p className="text-[12px] leading-tight text-gray-500 dark:text-[#B7BDD6]">{item.label}</p>
                <p className="mt-0.5 truncate text-[1.15rem] font-bold leading-none text-gray-800 dark:text-[#F5F7FF]">{item.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-end">
          <Button onClick={handleSave} disabled={saving} className="h-10 bg-[#6C5CE7] hover:bg-[#5b4bd1]">
            <Save size={16} className="mr-2" />
            {saving ? "Guardando..." : "Guardar configuración"}
          </Button>
        </div>

        <Card className="mt-2 flex min-h-0 flex-1 gap-0 overflow-hidden border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden p-0 last:pb-0 [&:last-child]:pb-0">
            <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col">
              <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1 lg:grid-cols-6 dark:bg-gray-900/60">
                  <TabsTrigger value="institucion">Institución</TabsTrigger>
                  <TabsTrigger value="prestamos">Préstamos</TabsTrigger>
                  <TabsTrigger value="reservas">Reservas</TabsTrigger>
                  <TabsTrigger value="multas">Multas</TabsTrigger>
                  <TabsTrigger value="seguridad">Seguridad</TabsTrigger>
                  <TabsTrigger value="apariencia">Apariencia</TabsTrigger>
                </TabsList>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-4">
                <TabsContent value="institucion" className="mt-0">
                  <Card className={sectionCard}>
                    <CardContent className="p-4">
                      <div className="mb-4 flex items-center gap-2">
                        <Building2 size={18} className="text-[#6C5CE7]" />
                        <h2 className="font-semibold text-gray-900 dark:text-white">Datos de la institución</h2>
                      </div>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <Label className="mb-2 block dark:text-gray-300">Nombre</Label>
                          <Input value={settings.institutionName} onChange={(e) => updateSettings("institutionName", e.target.value)} className="dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
                        </div>
                        <div>
                          <Label className="mb-2 block dark:text-gray-300">Código institucional</Label>
                          <Input value={settings.institutionCode} onChange={(e) => updateSettings("institutionCode", e.target.value)} className="dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
                        </div>
                        <div>
                          <Label className="mb-2 block dark:text-gray-300">Correo institucional</Label>
                          <Input value={settings.institutionEmail} onChange={(e) => updateSettings("institutionEmail", e.target.value)} className="dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
                        </div>
                        <div>
                          <Label className="mb-2 block dark:text-gray-300">Teléfono</Label>
                          <Input value={settings.institutionPhone} onChange={(e) => updateSettings("institutionPhone", e.target.value)} className="dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="prestamos" className="mt-0">
                  <Card className={sectionCard}>
                    <CardContent className="p-4">
                      <div className="mb-4 flex items-center gap-2">
                        <TimerReset size={18} className="text-[#6C5CE7]" />
                        <h2 className="font-semibold text-gray-900 dark:text-white">Parámetros de préstamos</h2>
                      </div>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <Label className="mb-2 block dark:text-gray-300">Días máximos por préstamo</Label>
                          <Input type="number" min={1} value={settings.maxLoanDays} onChange={(e) => updateSettings("maxLoanDays", Number(e.target.value) || 1)} className="dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
                        </div>
                        <div>
                          <Label className="mb-2 block dark:text-gray-300">Número máximo de renovaciones</Label>
                          <Input type="number" min={0} value={settings.maxRenewals} onChange={(e) => updateSettings("maxRenewals", Number(e.target.value) || 0)} className="dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="reservas" className="mt-0">
                  <Card className={sectionCard}>
                    <CardContent className="p-4">
                      <div className="mb-4 flex items-center gap-2">
                        <TimerReset size={18} className="text-[#6C5CE7]" />
                        <h2 className="font-semibold text-gray-900 dark:text-white">Tiempo máximo de reserva</h2>
                      </div>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <Label className="mb-2 block dark:text-gray-300">Horas máximas por reserva de sala</Label>
                          <Input type="number" min={1} value={settings.maxRoomReservationHours} onChange={(e) => updateSettings("maxRoomReservationHours", Number(e.target.value) || 1)} className="dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
                        </div>
                        <div>
                          <Label className="mb-2 block dark:text-gray-300">Días máximos para reservar libro</Label>
                          <Input type="number" min={1} value={settings.maxBookReservationDays} onChange={(e) => updateSettings("maxBookReservationDays", Number(e.target.value) || 1)} className="dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="multas" className="mt-0">
                  <Card className={sectionCard}>
                    <CardContent className="p-4">
                      <div className="mb-4 flex items-center gap-2">
                        <ShieldCheck size={18} className="text-[#6C5CE7]" />
                        <h2 className="font-semibold text-gray-900 dark:text-white">Valor de multas</h2>
                      </div>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div>
                          <Label className="mb-2 block dark:text-gray-300">Multa por retraso</Label>
                          <Input type="number" min={0} value={settings.lateFineValue} onChange={(e) => updateSettings("lateFineValue", Number(e.target.value) || 0)} className="dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
                        </div>
                        <div>
                          <Label className="mb-2 block dark:text-gray-300">Multa por daño</Label>
                          <Input type="number" min={0} value={settings.damageFineValue} onChange={(e) => updateSettings("damageFineValue", Number(e.target.value) || 0)} className="dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
                        </div>
                        <div>
                          <Label className="mb-2 block dark:text-gray-300">Multa por pérdida</Label>
                          <Input type="number" min={0} value={settings.lossFineValue} onChange={(e) => updateSettings("lossFineValue", Number(e.target.value) || 0)} className="dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="seguridad" className="mt-0">
                  <Card className={sectionCard}>
                    <CardContent className="p-4">
                      <div className="mb-4 flex items-center gap-2">
                        <LockKeyhole size={18} className="text-[#6C5CE7]" />
                        <h2 className="font-semibold text-gray-900 dark:text-white">Seguridad</h2>
                      </div>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div>
                          <Label className="mb-2 block dark:text-gray-300">Tiempo de sesión (min)</Label>
                          <Input type="number" min={5} value={settings.sessionTimeoutMinutes} onChange={(e) => updateSettings("sessionTimeoutMinutes", Number(e.target.value) || 5)} className="dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
                        </div>
                        <div>
                          <Label className="mb-2 block dark:text-gray-300">Longitud mínima de contraseña</Label>
                          <Input type="number" min={6} value={settings.passwordMinLength} onChange={(e) => updateSettings("passwordMinLength", Number(e.target.value) || 6)} className="dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
                        </div>
                        <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50">
                          <p className="text-sm font-medium text-gray-700 dark:text-white">Requisitos de contraseña</p>
                          <div className="mt-3 space-y-3">
                            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-[#B7BDD6]">
                              <input type="checkbox" checked={settings.requireUppercase} onChange={(e) => updateSettings("requireUppercase", e.target.checked)} />
                              Requerir mayúsculas
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-[#B7BDD6]">
                              <input type="checkbox" checked={settings.requireNumbers} onChange={(e) => updateSettings("requireNumbers", e.target.checked)} />
                              Requerir números
                            </label>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="apariencia" className="mt-0">
                  <Card className={sectionCard}>
                    <CardContent className="p-4">
                      <div className="mb-4 flex items-center gap-2">
                        <Palette size={18} className="text-[#6C5CE7]" />
                        <h2 className="font-semibold text-gray-900 dark:text-white">Apariencia del sistema</h2>
                      </div>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700/50">
                          <div className="mb-3 flex items-center gap-2">
                            <MoonStar size={16} className="text-[#6C5CE7]" />
                            <p className="font-medium text-gray-700 dark:text-white">Modo visual</p>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-[#B7BDD6]">
                            Estado actual: {isDark ? "Oscuro" : "Claro"}
                          </p>
                          <Button onClick={toggleTheme} variant="outline" className="mt-3 dark:border-gray-600 dark:text-gray-300">
                            Cambiar tema
                          </Button>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <Label className="mb-2 block dark:text-gray-300">Densidad visual</Label>
                            <Select value={settings.appearanceDensity} onValueChange={(value: "compacta" | "media" | "amplia") => updateSettings("appearanceDensity", value)}>
                              <SelectTrigger className="dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="dark:border-gray-700 dark:bg-gray-800">
                                <SelectItem value="compacta">Compacta</SelectItem>
                                <SelectItem value="media">Media</SelectItem>
                                <SelectItem value="amplia">Amplia</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="mb-2 block dark:text-gray-300">Estilo de resaltado</Label>
                            <Select value={settings.highlightStyle} onValueChange={(value: "suave" | "estandar" | "alto") => updateSettings("highlightStyle", value)}>
                              <SelectTrigger className="dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="dark:border-gray-700 dark:bg-gray-800">
                                <SelectItem value="suave">Suave</SelectItem>
                                <SelectItem value="estandar">Estándar</SelectItem>
                                <SelectItem value="alto">Alto contraste</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};
