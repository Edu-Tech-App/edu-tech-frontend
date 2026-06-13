import { apiClient, getErrorMessage } from "./http";

export const statsApi = {
  getStats: async () => {
    try {
      const response = await apiClient.get("/stats");
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Error al obtener estadísticas"));
    }
  },
};
