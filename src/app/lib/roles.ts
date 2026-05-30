import type { UserRole } from "../context/AuthContext";

export const MANAGEMENT_ROLES: UserRole[] = ["administrativo", "supervisor"];

export const isManagementRole = (role?: UserRole | null) =>
  !!role && MANAGEMENT_ROLES.includes(role);

export const formatSystemRole = (role?: string) => {
  switch (role) {
    case "estudiante":
      return "Estudiante";
    case "docente":
      return "Docente";
    case "bibliotecario":
      return "Bibliotecario";
    case "administrativo":
      return "Administrativo";
    case "supervisor":
      return "Supervisor";
    default:
      return "Sin rol";
  }
};
