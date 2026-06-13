import { type BookCategory } from "./catalogs";
import { apiClient, getErrorMessage } from "./http";

export const subjectsApi = {
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

  getSubjectEnrollments: async (id: number) => {
    try {
      const response = await apiClient.get(`/subjects/${id}/enrollments`);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Error al obtener inscritos"));
    }
  },

  getSubjectEnrollmentsByStudent: async () => {
    try {
      const response = await apiClient.get("/subjects/enrollments/my");
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Error al obtener mis inscripciones"));
    }
  },

  getStudentSubjectProfile: async () => {
    try {
      const response = await apiClient.get("/subjects/student/profile");
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Error al obtener el perfil academico"));
    }
  },

  enrollStudent: async (id: number, estudianteId: number) => {
    try {
      const response = await apiClient.post(`/subjects/${id}/enrollments`, { estudianteId });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Error al inscribir estudiante"));
    }
  },

  removeEnrollment: async (id: number, estudianteId: number) => {
    try {
      await apiClient.delete(`/subjects/${id}/enrollments/${estudianteId}`);
    } catch (error) {
      throw new Error(getErrorMessage(error, "Error al retirar estudiante"));
    }
  },

  getSubjectTasks: async (subjectId: number) => {
    try {
      const response = await apiClient.get(`/subjects/${subjectId}/tasks`);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Error al obtener tareas"));
    }
  },

  createSubjectTask: async (
    subjectId: number,
    data: {
      titulo: string;
      descripcion: string;
      file?: File | null;
    },
  ) => {
    try {
      const formData = new FormData();
      formData.append("titulo", data.titulo);
      formData.append("descripcion", data.descripcion);
      if (data.file) {
        formData.append("file", data.file);
      }
      const response = await apiClient.post(`/subjects/${subjectId}/tasks`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Error al crear la tarea"));
    }
  },

  submitSubjectTask: async (
    taskId: number,
    data: {
      mensaje?: string;
      file?: File | null;
    },
  ) => {
    try {
      const formData = new FormData();
      if (data.mensaje) {
        formData.append("mensaje", data.mensaje);
      }
      if (data.file) {
        formData.append("file", data.file);
      }
      const response = await apiClient.post(`/subjects/tasks/${taskId}/submissions`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Error al subir la entrega"));
    }
  },
};
