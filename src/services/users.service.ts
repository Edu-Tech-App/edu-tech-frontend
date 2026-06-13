import { type BookCategory } from "./catalogs";
import { apiClient, getErrorMessage } from "./http";

export const usersApi = {
  getUsers: async () => {
    try {
      const response = await apiClient.get("/users");
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Error al obtener usuarios"));
    }
  },

  getUserById: async (id: number) => {
    try {
      const response = await apiClient.get(`/users/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Error al obtener el usuario"));
    }
  },

  getTeachers: async () => {
    try {
      const response = await apiClient.get("/users/teachers/list");
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Error al obtener docentes"));
    }
  },

  createUser: async (data: {
    nombreCompleto: string;
    correo: string;
    documentoIdentidad: string;
    password: string;
    rol: "ESTUDIANTE" | "DOCENTE" | "BIBLIOTECARIO" | "ADMINISTRATIVO" | "SUPERVISOR";
    carrera?: BookCategory;
  }) => {
    try {
      const response = await apiClient.post("/users", data);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Error al crear usuario"));
    }
  },

  updateUser: async (
    id: number,
    data: {
      nombreCompleto?: string;
      documentoIdentidad?: string;
      correo?: string;
      password?: string;
      rol?: "ESTUDIANTE" | "DOCENTE" | "BIBLIOTECARIO" | "ADMINISTRATIVO" | "SUPERVISOR";
      carrera?: BookCategory;
    },
  ) => {
    try {
      const response = await apiClient.put(`/users/${id}`, data);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Error al actualizar usuario"));
    }
  },

  updateUserStatus: async (id: number, estado: string) => {
    try {
      const response = await apiClient.patch(`/users/${id}/status`, { estado });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Error al actualizar estado"));
    }
  },
};
