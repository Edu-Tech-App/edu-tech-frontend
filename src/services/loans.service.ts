import { apiClient, getErrorMessage } from "./http";

export const loansApi = {
  createLoan: async (data: { libroId: number; estudianteId: number; fechaLimiteDevolucion: string }) => {
    try {
      const response = await apiClient.post("/loans", data);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Error al crear el préstamo"));
    }
  },

  updateLoan: async (
    id: number,
    data: {
      libroId?: number;
      estudianteId?: number;
      fechaLimiteDevolucion?: string;
      estado?: "ACTIVO" | "DEVUELTO" | "VENCIDO" | "PERDIDO";
    },
  ) => {
    try {
      const response = await apiClient.put(`/loans/${id}`, data);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Error al actualizar el préstamo"));
    }
  },

  returnLoan: async (id: number) => {
    try {
      const response = await apiClient.patch(`/loans/${id}/return`);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Error al registrar la devolución"));
    }
  },

  deleteLoan: async (id: number) => {
    try {
      await apiClient.delete(`/loans/${id}`);
    } catch (error) {
      throw new Error(getErrorMessage(error, "Error al eliminar el préstamo"));
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
      const response = await apiClient.get(`/loans/student/${userId}`);
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

  getUserFines: async (userId: number) => {
    try {
      const response = await apiClient.get(`/loans/fines/user/${userId}`);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Error al obtener el historial de multas"));
    }
  },

  getAllFines: async () => {
    try {
      const response = await apiClient.get("/loans/fines/all");
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Error al obtener multas"));
    }
  },

  getAllFinePayments: async () => {
    try {
      const response = await apiClient.get("/loans/fines/payments/all");
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Error al obtener historial de pagos"));
    }
  },

  payFine: async (fineId: number) => {
    try {
      const response = await apiClient.post(`/loans/fines/${fineId}/pay`);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Error al procesar el pago de la multa"));
    }
  },
};
