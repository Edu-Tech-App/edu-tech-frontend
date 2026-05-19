const API_URL = "http://localhost:3000";

const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
});

export const api = {
  login: async (data: { correo: string; password: string }) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Error al iniciar sesión");
    return result;
  },

  getUsers: async () => {
    const response = await fetch(`${API_URL}/users`, {
      headers: getHeaders(),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Error al obtener usuarios");
    return result;
  },

  createUser: async (data: any) => {
    const response = await fetch(`${API_URL}/users`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Error al crear usuario");
    return result;
  },

  updateUserStatus: async (id: number, estado: string) => {
    const response = await fetch(`${API_URL}/users/${id}/status`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ estado }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Error al actualizar estado");
    return result;
  },
};