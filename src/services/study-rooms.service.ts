import { apiClient, getErrorMessage } from "./http";

export const studyRoomsApi = {
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

  updateStudyRoom: async (
    id: number,
    data: {
      nombre?: string;
      capacidad?: number;
      ubicacion?: string;
      estado?: "ACTIVA" | "INACTIVA" | "MANTENIMIENTO";
    },
  ) => {
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

  createRoomReservation: async (data: {
    salaId: number;
    userId: number;
    isEstudiante: boolean;
    fechaReserva: string;
    horaInicio: string;
    horaFin: string;
  }) => {
    try {
      const response = await apiClient.post("/study-rooms/reservations", data);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Error al crear la reserva"));
    }
  },

  updateRoomReservationAsAdmin: async (
    id: number,
    data: {
      salaId?: number;
      userId?: number;
      fechaReserva?: string;
      horaInicio?: string;
      horaFin?: string;
      estado?: "ACTIVA" | "COMPLETADA" | "CANCELADA";
    },
  ) => {
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

  cancelRoomReservation: async (id: number) => {
    try {
      const response = await apiClient.patch(`/study-rooms/reservations/${id}/cancel`);
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
};
