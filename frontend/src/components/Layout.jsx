import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Package, Warehouse, ShoppingCart, TrendingUp,
  Users, Truck, BarChart3, LogOut, UserCog, CreditCard, Globe
} from 'lucide-react';

const navItems = [
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard',    roles: null },
  { to: '/ventas',      icon: ShoppingCart,    label: 'Ventas',       roles: ['Administrador','Vendedor'] },
  { to: '/clientes',    icon: Users,           label: 'Clientes',     roles: ['Administrador','Vendedor'] },
  { to: '/productos',   icon: Package,         label: 'Productos',    roles: ['Administrador','Almacen'] },
  { to: '/inventario',  icon: Warehouse,       label: 'Inventario',   roles: ['Administrador','Almacen'] },
  { to: '/compras',     icon: Truck,           label: 'Compras',      roles: ['Administrador','Almacen'] },
  { to: '/proveedores', icon: TrendingUp,      label: 'Proveedores',  roles: ['Administrador'] },
  { to: '/cuentas',     icon: CreditCard,      label: 'Cuentas C/P',  roles: ['Administrador'] },
  { to: '/reportes',    icon: BarChart3,       label: 'Reportes',     roles: ['Administrador'] },
  { to: '/usuarios',    icon: UserCog,         label: 'Usuarios',     roles: ['Administrador'] },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>📦 TUMOMITO</h1>
          <span>Sistema ERP v1.0</span>
        </div>
        <nav className="sidebar-nav">
          <div className="sidebar-section">Menú Principal</div>
          {navItems.map(({ to, icon: Icon, label, roles }) => {
            if (roles && !roles.includes(user?.rol)) return null;
            return (
              <NavLink key={to} to={to} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                <Icon size={17} />
                {label}
              </NavLink>
            );
          })}
          <div className="sidebar-section">Comercial</div>
          <a href="/catalogo" target="_blank" rel="noopener noreferrer" className="nav-item">
            <Globe size={17} />
            Catálogo Público
          </a>
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{user?.nombre?.[0]?.toUpperCase()}</div>
            <div>
              <div className="user-name">{user?.nombre}</div>
              <div className="user-role">{user?.rol}</div>
            </div>
          </div>
          <button className="btn btn-danger btn-sm" style={{width:'100%'}} onClick={handleLogout}>
            <LogOut size={14} /> Cerrar Sesión
          </button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
