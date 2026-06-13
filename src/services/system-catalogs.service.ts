import { apiClient, getErrorMessage } from "./http";

export interface CatalogOption {
  value: string;
  label: string;
}

export interface SystemCatalogs {
  bookCategories: CatalogOption[];
  userRoles: CatalogOption[];
  userStatuses: CatalogOption[];
  studyRoomStatuses: CatalogOption[];
  bookStatuses: CatalogOption[];
}

export const systemCatalogsApi = {
  getSystemCatalogs: async (): Promise<SystemCatalogs> => {
    try {
      const response = await apiClient.get("/catalogs");
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Error al obtener los catálogos del sistema"));
    }
  },
};
