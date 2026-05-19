import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../../services/api';

export type UserRole = 'estudiante' | 'docente' | 'bibliotecario' | 'administrativo';

interface User {
  id: number;
  nombreCompleto: string;
  correoInstitucional: string;
  rol: UserRole;
}

interface AuthContextType {
  user: User | null;
  login: (correo: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  // ✅ Al recargar la página, recupera el usuario del localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (correo: string, password: string) => {
    // ✅ Llama al backend real
    const data = await api.login({ correo, password });

    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('user', JSON.stringify(data.user));

    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};