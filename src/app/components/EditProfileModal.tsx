import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Camera, User, Lock, Mail, IdCard } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { api } from "../../services/api";

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
}

export const EditProfileModal = ({ open, onClose }: EditProfileModalProps) => {
  const { user, updateUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    nombreCompleto: "",
    correo: "",
    documentoIdentidad: "",
    password: "",
    confirmarPassword: "",
  });

  useEffect(() => {
    if (user) {
      setForm({
        nombreCompleto: user.nombreCompleto || "",
        correo: user.correoInstitucional || "",
        documentoIdentidad: "",
        password: "",
        confirmarPassword: "",
      });
    }
    // Cargar foto guardada
    const savedPhoto = localStorage.getItem(`profilePhoto_${user?.id}`);
    if (savedPhoto) setPhoto(savedPhoto);
  }, [user, open]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("La imagen no puede superar los 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setPhoto(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!user) return;

    if (form.password && form.password !== form.confirmarPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    if (form.password && form.password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setSaving(true);
    try {
      const payload: any = {};
      if (form.nombreCompleto && form.nombreCompleto !== user.nombreCompleto) {
        payload.nombreCompleto = form.nombreCompleto;
      }
      if (form.correo && form.correo !== user.correoInstitucional) {
        payload.correo = form.correo;
      }
      if (form.documentoIdentidad) {
        payload.documentoIdentidad = form.documentoIdentidad;
      }
      if (form.password) {
        payload.password = form.password;
      }

      if (Object.keys(payload).length > 0) {
        await api.updateUser(user.id, payload);
        updateUser({
          nombreCompleto: payload.nombreCompleto || user.nombreCompleto,
          correoInstitucional: payload.correo || user.correoInstitucional,
        });
      }

      // Guardar foto en localStorage
      if (photo) {
        localStorage.setItem(`profilePhoto_${user.id}`, photo);
      }

      toast.success("Perfil actualizado exitosamente");
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar el perfil");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Perfil</DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-5">
          {/* Foto de perfil */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-blue-900 flex items-center justify-center overflow-hidden">
                {photo ? (
                  <img src={photo} alt="Perfil" className="w-full h-full object-cover" />
                ) : (
                  <User size={36} className="text-white" />
                )}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-0 right-0 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
              >
                <Camera size={14} className="text-white" />
              </button>
            </div>
            <p className="text-xs text-gray-500">JPG o PNG, máximo 2MB</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>

          {/* Nombre */}
          <div>
            <Label className="flex items-center gap-2 mb-1">
              <User size={14} /> Nombre Completo
            </Label>
            <Input
              value={form.nombreCompleto}
              onChange={(e) => setForm({ ...form, nombreCompleto: e.target.value })}
              placeholder="Tu nombre completo"
            />
          </div>

          {/* Correo */}
          <div>
            <Label className="flex items-center gap-2 mb-1">
              <Mail size={14} /> Correo Electrónico
            </Label>
            <Input
              type="email"
              value={form.correo}
              onChange={(e) => setForm({ ...form, correo: e.target.value })}
              placeholder="tu@correo.com"
            />
          </div>

          {/* Documento */}
          <div>
            <Label className="flex items-center gap-2 mb-1">
              <IdCard size={14} /> Documento de Identidad
            </Label>
            <Input
              value={form.documentoIdentidad}
              onChange={(e) => setForm({ ...form, documentoIdentidad: e.target.value })}
              placeholder="Solo si deseas cambiarlo"
            />
          </div>

          {/* Contraseña */}
          <div>
            <Label className="flex items-center gap-2 mb-1">
              <Lock size={14} /> Nueva Contraseña
            </Label>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Dejar vacío para no cambiar"
            />
          </div>

          {form.password && (
            <div>
              <Label className="flex items-center gap-2 mb-1">
                <Lock size={14} /> Confirmar Contraseña
              </Label>
              <Input
                type="password"
                value={form.confirmarPassword}
                onChange={(e) => setForm({ ...form, confirmarPassword: e.target.value })}
                placeholder="Repite la nueva contraseña"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-blue-900 hover:bg-blue-800">
            {saving ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};