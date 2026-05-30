import type { UserRole } from "../context/AuthContext";

export const MANAGEMENT_ROLES: UserRole[] = ["administrativo", "supervisor", "bibliotecario"];

export const isAdmin = (role?: UserRole | null) => role === "administrativo";
export const isSupervisor = (role?: UserRole | null) => role === "supervisor";
export const isLibrarian = (role?: UserRole | null) => role === "bibliotecario";
export const isTeacher = (role?: UserRole | null) => role === "docente";
export const isStudent = (role?: UserRole | null) => role === "estudiante";

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
