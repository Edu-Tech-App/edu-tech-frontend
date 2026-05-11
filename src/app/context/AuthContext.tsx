import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'student' | 'teacher' | 'librarian' | 'admin';

interface User {
  email: string;
  name: string;
  role: UserRole;
  id: string;
  hasPendingFines?: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  selectRole: (role: UserRole) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = (email: string, password: string) => {
    if (email && password) {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const selectRole = (role: UserRole) => {
    const names = {
      student: 'Estudiante Angela Aguilar',
      teacher: 'Profesor Cristian Nodal',
      librarian: 'Bibliotecario Cazzu De Nodal',
      admin: 'Admin Camila Arteaga'
    };

    setUser({
      email: 'user@edutech.edu',
      name: names[role],
      role,
      id: `${role}-001`,
      hasPendingFines: role === 'student' ? false : undefined
    });
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, login, selectRole, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
