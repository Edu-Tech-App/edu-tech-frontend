import { type BookCategory } from "./catalogs";
import { apiClient, getErrorMessage } from "./http";

export const authApi = {
  login: async (data: { correo: string; password: string }) => {
    try {
      const response = await apiClient.post("/auth/login", data);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Error al iniciar sesión"));
    }
  },

  registerStudent: async (data: {
    nombreCompleto: string;
    documentoIdentidad: string;
    correo: string;
    password: string;
    rol: "ESTUDIANTE";
    carrera: BookCategory;
  }) => {
    try {
      const response = await apiClient.post("/users/register", data);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Error al crear la cuenta"));
    }
  },
};
