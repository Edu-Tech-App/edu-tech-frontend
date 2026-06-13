import { apiClient, getErrorMessage } from "./http";

export const gradesApi = {
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

  createGrade: async (data: {
    estudianteId: number;
    asignaturaId: number;
    periodoAcademico: string;
    valor: number;
  }) => {
    try {
      const response = await apiClient.post("/grades", data);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Error al crear la calificación"));
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
};
