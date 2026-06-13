import { authorizedBlobGet, getErrorMessage } from "./http";

export const reportsApi = {
  downloadLoansReport: async (params: {
    startDate: string;
    endDate: string;
    format: "pdf" | "excel";
    estudianteId?: number;
  }) => {
    try {
      return await authorizedBlobGet("/reportes/prestamos", params);
    } catch (error) {
      throw new Error(getErrorMessage(error, "Error al exportar reporte de biblioteca"));
    }
  },

  downloadGradesReport: async (params: {
    startDate: string;
    endDate: string;
    format: "pdf" | "excel";
    periodoAcademico?: string;
    asignaturaId?: number;
    estudianteId?: number;
  }) => {
    try {
      return await authorizedBlobGet("/reportes/calificaciones", params);
    } catch (error) {
      throw new Error(getErrorMessage(error, "Error al exportar reporte académico"));
    }
  },
};
