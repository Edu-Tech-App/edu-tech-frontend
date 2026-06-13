type AppUserLike = {
  rol?: string;
  nombreCompleto?: string;
  correoInstitucional?: string;
} | null;

const PARTICIPANTS_ADMIN_NAME = "Administrador";

export const isParticipantsAdmin = (user: AppUserLike) => {
  if (!user) return false;

  const normalizedName = user.nombreCompleto?.trim().toLowerCase() || "";
  const allowedRoles = ["supervisor", "administrativo"];

  return allowedRoles.includes(user.rol ?? "") && normalizedName === PARTICIPANTS_ADMIN_NAME.toLowerCase();
};

export const getStoredAppUser = (): AppUserLike => {
  const rawUser = localStorage.getItem("user");

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as Exclude<AppUserLike, null>;
  } catch {
    return null;
  }
};
