import { createContext, useContext, useState, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('tumomito_user')); } catch { return null; }
  });

  const login = useCallback(async (email, password) => {
    const form = new FormData();
    form.append('username', email);
    form.append('password', password);
    const { data } = await api.post('/api/auth/login', form);
    localStorage.setItem('tumomito_token', data.access_token);
    localStorage.setItem('tumomito_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('tumomito_token');
    localStorage.removeItem('tumomito_user');
    setUser(null);
  }, []);

  const isAdmin = user?.rol === 'Administrador';
  const isVendedor = user?.rol === 'Vendedor';
  const isAlmacen = user?.rol === 'Almacen';

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin, isVendedor, isAlmacen }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
