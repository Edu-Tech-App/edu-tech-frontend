import { apiClient, getErrorMessage } from "./http";

export const participantsApi = {
  getParticipantStatus: async (nombre: string) => {
    try {
      const response = await apiClient.get("/participants/estado", {
        params: { nombre },
      });
      return response.data as {
        nombre: string;
        autorizado: boolean;
        confirmado: boolean;
      };
    } catch (error) {
      throw new Error(getErrorMessage(error, "Error al consultar el estado del participante"));
    }
  },

  validateParticipantAccess: async (data: { nombre: string; codigo: string }) => {
    try {
      const response = await apiClient.post("/participants/acceso", data);
      return response.data as {
        autorizado: true;
        nombre: string;
        confirmado: true;
        yaEstabaRegistrado: boolean;
      };
    } catch (error) {
      throw new Error(getErrorMessage(error, "Error al validar el acceso del participante"));
    }
  },

  registerParticipantWithInvitation: async (data: { nombre: string; codigo: string }) => {
    try {
      const response = await apiClient.post("/participants/registro-invitacion", data);
      return response.data as {
        registrado: true;
        nombre: string;
        codigo: string;
      };
    } catch (error) {
      throw new Error(getErrorMessage(error, "Error al registrar al participante con el código"));
    }
  },

  validateParticipantInvitationCode: async (codigo: string) => {
    try {
      const response = await apiClient.post("/participants/validar-codigo-invitacion", { codigo });
      return response.data as {
        valido: true;
        codigo: string;
      };
    } catch (error) {
      throw new Error(getErrorMessage(error, "Error al validar el código de invitación"));
    }
  },

  getAuthorizedParticipants: async () => {
    try {
      const response = await apiClient.get("/participants");
      return response.data as Array<{
        id: number;
        nombre: string;
        codigo: string | null;
        confirmado: boolean;
        confirmadoEn: string | null;
        creadoEn: string;
      }>;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Error al obtener participantes autorizados"));
    }
  },

  createAuthorizedParticipant: async (data: { nombre: string }) => {
    try {
      const response = await apiClient.post("/participants", data);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Error al agregar participante autorizado"));
    }
  },

  generateParticipantCode: async (data: { nombre: string }) => {
    try {
      const response = await apiClient.post("/participants/generar-codigo", data);
      return response.data as { nombre: string; codigo: string };
    } catch (error) {
      throw new Error(getErrorMessage(error, "Error al generar el código del participante"));
    }
  },

  generateParticipantInvitationCode: async () => {
    try {
      const response = await apiClient.post("/participants/generar-codigo-invitacion");
      return response.data as {
        codigo: string;
        generadoPor: string | null;
      };
    } catch (error) {
      throw new Error(getErrorMessage(error, "Error al generar el código de invitación"));
    }
  },

  getParticipantInvitationCodes: async () => {
    try {
      const response = await apiClient.get("/participants/codigos-invitacion");
      return response.data as Array<{
        id: number;
        codigo: string;
        generadoPor: string | null;
        registradoNombre: string | null;
        usado: boolean;
        usadoEn: string | null;
        creadoEn: string;
      }>;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Error al obtener los códigos de invitación"));
    }
  },
};
