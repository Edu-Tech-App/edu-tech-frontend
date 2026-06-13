import { type BookCategory } from "./catalogs";
import { apiClient, getErrorMessage } from "./http";

export const booksApi = {
  getBooks: async (filters?: {
    titulo?: string;
    autor?: string;
    categoria?: BookCategory;
  }) => {
    try {
      const response = await apiClient.get("/books", { params: filters });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Error al obtener libros"));
    }
  },

  getBookById: async (id: number) => {
    try {
      const response = await apiClient.get(`/books/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Error al obtener el libro"));
    }
  },

  uploadBookCover: async (id: number, file: File) => {
    try {
      const formData = new FormData();
      formData.append("cover", file);
      const response = await apiClient.post(`/books/${id}/cover`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Error al subir la portada"));
    }
  },

  createBook: async (data: {
    titulo: string;
    autor: string;
    categoria?: BookCategory;
    editorial?: string;
    cantidadDisponible?: number;
    estado?: "DISPONIBLE" | "MANTENIMIENTO" | "BAJA";
  }) => {
    try {
      const response = await apiClient.post("/books", data);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Error al crear el libro"));
    }
  },

  updateBook: async (
    id: number,
    data: {
      titulo?: string;
      autor?: string;
      categoria?: BookCategory;
      editorial?: string;
      cantidadDisponible?: number;
      estado?: "DISPONIBLE" | "MANTENIMIENTO" | "BAJA";
    },
  ) => {
    try {
      const response = await apiClient.patch(`/books/${id}`, data);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Error al actualizar el libro"));
    }
  },

  deleteBook: async (id: number) => {
    try {
      await apiClient.delete(`/books/${id}`);
    } catch (error) {
      throw new Error(getErrorMessage(error, "Error al eliminar el libro"));
    }
  },
};
