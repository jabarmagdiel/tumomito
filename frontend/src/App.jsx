import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import ProductosPage from './pages/ProductosPage';
import InventarioPage from './pages/InventarioPage';
import VentasPage from './pages/VentasPage';
import ComprasPage from './pages/ComprasPage';
import ClientesPage from './pages/ClientesPage';
import ProveedoresPage from './pages/ProveedoresPage';
import ReportesPage from './pages/ReportesPage';
import UsuariosPage from './pages/UsuariosPage';
import CuentasPage from './pages/CuentasPage';
import CatalogoPage from './pages/CatalogoPage';

function PrivateRoute({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.rol)) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
      <Route path="/catalogo" element={<CatalogoPage />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="productos" element={<PrivateRoute roles={['Administrador','Almacen']}><ProductosPage /></PrivateRoute>} />
        <Route path="inventario" element={<PrivateRoute roles={['Administrador','Almacen']}><InventarioPage /></PrivateRoute>} />
        <Route path="ventas" element={<PrivateRoute roles={['Administrador','Vendedor']}><VentasPage /></PrivateRoute>} />
        <Route path="compras" element={<PrivateRoute roles={['Administrador','Almacen']}><ComprasPage /></PrivateRoute>} />
        <Route path="clientes" element={<PrivateRoute roles={['Administrador','Vendedor']}><ClientesPage /></PrivateRoute>} />
        <Route path="proveedores" element={<PrivateRoute roles={['Administrador']}><ProveedoresPage /></PrivateRoute>} />
        <Route path="reportes" element={<PrivateRoute roles={['Administrador']}><ReportesPage /></PrivateRoute>} />
        <Route path="usuarios" element={<PrivateRoute roles={['Administrador']}><UsuariosPage /></PrivateRoute>} />
        <Route path="cuentas" element={<PrivateRoute roles={['Administrador']}><CuentasPage /></PrivateRoute>} />
      </Route>
    </Routes>
  );
}
