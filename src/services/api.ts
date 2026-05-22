import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const BOOK_CATEGORY_OPTIONS = [
  "INGENIERIA_SISTEMAS",
  "INGENIERIA_CIVIL",
  "INGENIERIA_INDUSTRIAL",
  "ADMINISTRACION",
  "CONTADURIA",
  "ECONOMIA",
  "DERECHO",
  "MEDICINA",
  "ENFERMERIA",
  "PSICOLOGIA",
  "EDUCACION",
  "MATEMATICAS",
] as const;

export type BookCategory = (typeof BOOK_CATEGORY_OPTIONS)[number];
export const API_URL_PUBLIC = API_URL;

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const getErrorMessage = (error: unknown, fallbackMessage: string) => {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message.join(", ");
    if (typeof message === "string") return message;
  }
  return fallbackMessage;
};

export const api = {
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
  }) => {
    try {
      const response = await apiClient.post("/users", data);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Error al crear la cuenta"));
    }
  },

  getUsers: async () => {
    try {
      const response = await apiClient.get("/users");
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Error al obtener usuarios"));
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

  getSubjects: async () => {
    try {
      const response = await apiClient.get("/subjects");
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Error al obtener materias"));
    }
  },

  getSubjectById: async (id: number) => {
    try {
      const response = await apiClient.get(`/subjects/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Error al obtener la materia"));
    }
  },

  createSubject: async (data: {
    nombre: string;
    carrera: BookCategory;
    semestre: number;
    creditos: number;
    docenteId?: number;
  }) => {
    try {
      const response = await apiClient.post("/subjects", data);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Error al crear la materia"));
    }
  },

  updateSubject: async (
    id: number,
    data: {
      codigo?: string;
      nombre?: string;
      carrera?: BookCategory;
      semestre?: number;
      creditos?: number;
      docenteId?: number | null;
    },
  ) => {
    try {
      const response = await apiClient.put(`/subjects/${id}`, data);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Error al actualizar la materia"));
    }
  },

  deleteSubject: async (id: number) => {
    try {
      await apiClient.delete(`/subjects/${id}`);
    } catch (error) {
      throw new Error(getErrorMessage(error, "Error al eliminar la materia"));
    }
  },

  assignSubjectTeacher: async (id: number, docenteId: number | null) => {
    try {
      const response = await apiClient.put(`/subjects/${id}`, { docenteId });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Error al asignar docente"));
    }
  },

  getRoomReservations: async () => {
    try {
      const response = await apiClient.get("/study-rooms/reservations");
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Error al obtener reservas de salas"));
    }
  },

  getRoomReservationsByUser: async (userId: number) => {
    try {
      const response = await apiClient.get(`/study-rooms/reservations/user/${userId}`);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Error al obtener reservas del usuario"));
    }
  },

  getStudyRooms: async () => {
    try {
      const response = await apiClient.get("/study-rooms");
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Error al obtener salas de estudio"));
    }
  },

  createStudyRoom: async (data: { nombre: string; capacidad: number; ubicacion: string }) => {
    try {
      const response = await apiClient.post("/study-rooms", data);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Error al crear la sala"));
    }
  },

  updateStudyRoom: async (id: number, data: {
    nombre?: string;
    capacidad?: number;
    ubicacion?: string;
    estado?: "ACTIVA" | "INACTIVA" | "MANTENIMIENTO";
  }) => {
    try {
      const response = await apiClient.put(`/study-rooms/${id}`, data);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Error al actualizar la sala"));
    }
  },

  deleteStudyRoom: async (id: number) => {
    try {
      await apiClient.delete(`/study-rooms/${id}`);
    } catch (error) {
      throw new Error(getErrorMessage(error, "Error al eliminar la sala"));
    }
  },

  createRoomReservationAsAdmin: async (data: {
    salaId: number;
    userId: number;
    fechaReserva: string;
    horaInicio: string;
    horaFin: string;
    estado?: "ACTIVA" | "COMPLETADA" | "CANCELADA";
  }) => {
    try {
      const response = await apiClient.post("/study-rooms/reservations/admin", data);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Error al crear la reserva"));
    }
  },

  updateRoomReservationAsAdmin: async (id: number, data: {
    salaId?: number;
    userId?: number;
    fechaReserva?: string;
    horaInicio?: string;
    horaFin?: string;
    estado?: "ACTIVA" | "COMPLETADA" | "CANCELADA";
  }) => {
    try {
      const response = await apiClient.put(`/study-rooms/reservations/${id}`, data);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Error al actualizar la reserva"));
    }
  },

  adminCancelRoomReservation: async (id: number) => {
    try {
      const response = await apiClient.patch(`/study-rooms/reservations/${id}/admin-cancel`);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Error al cancelar la reserva"));
    }
  },

  deleteRoomReservationAsAdmin: async (id: number) => {
    try {
      await apiClient.delete(`/study-rooms/reservations/${id}`);
    } catch (error) {
      throw new Error(getErrorMessage(error, "Error al eliminar la reserva"));
    }
  },

  createLoan: async (data: { libroId: number; estudianteId: number; fechaLimiteDevolucion: string }) => {
    try {
      const response = await apiClient.post("/loans", data);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Error al crear el préstamo"));
    }
  },

  updateLoan: async (id: number, data: {
    libroId?: number;
    estudianteId?: number;
    fechaLimiteDevolucion?: string;
    estado?: "ACTIVO" | "DEVUELTO" | "VENCIDO" | "PERDIDO";
  }) => {
    try {
      const response = await apiClient.put(`/loans/${id}`, data);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Error al actualizar el préstamo"));
    }
  },

  deleteLoan: async (id: number) => {
    try {
      await apiClient.delete(`/loans/${id}`);
    } catch (error) {
      throw new Error(getErrorMessage(error, "Error al eliminar el préstamo"));
    }
  },

  getGrades: async (filters?: { periodo?: string; asignatura?: number }) => {
    try {
      const response = await apiClient.get("/grades", { params: filters });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Error al obtener calificaciones"));
    }
  },

  getStudentGrades: async (studentId: number, periodo?: string) => {
    try {
      const response = await apiClient.get(`/grades/estudiante/${studentId}`, {
        params: periodo ? { periodo } : undefined,
      });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Error al obtener calificaciones del estudiante"));
    }
  },

  updateGrade: async (id: number, valor: number) => {
    try {
      const response = await apiClient.put(`/grades/${id}`, { valor });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Error al actualizar la calificación"));
    }
  },

  createUser: async (data: unknown) => {
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
      rol?: "ESTUDIANTE" | "DOCENTE" | "BIBLIOTECARIO" | "ADMINISTRATIVO";
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

  getLoans: async () => {
    try {
      const response = await apiClient.get("/loans");
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Error al obtener préstamos"));
    }
  },

  getStudentLoans: async (userId: number) => {
    try {
      const response = await apiClient.get(`/loans/user/${userId}`);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Error al obtener préstamos del estudiante"));
    }
  },

  getPendingFines: async (userId: number) => {
    try {
      const response = await apiClient.get(`/loans/fines/pending/${userId}`);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Error al obtener multas pendientes"));
    }
  },

  getStats: async () => {
    try {
      const response = await apiClient.get("/stats");
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Error al obtener estadísticas"));
    }
  },

  // ✅ Nuevo endpoint de multas
  getAllFines: async () => {
    try {
      const response = await apiClient.get("/loans/fines/all");
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Error al obtener multas"));
    }
  },
};
