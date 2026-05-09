import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Plus, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function UsuariosPage() {
  const { isAdmin } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ nombre: '', email: '', password: '', rol_id: '' });

  useEffect(() => {
    api.get('/api/usuarios/').then(r => setUsuarios(r.data));
    api.get('/api/usuarios/roles').then(r => setRoles(r.data));
  }, []);

  const crearUsuario = async () => {
    try {
      await api.post('/api/usuarios/', { ...form, rol_id: parseInt(form.rol_id) });
      toast.success('Usuario creado');
      setModal(false);
      api.get('/api/usuarios/').then(r => setUsuarios(r.data));
    } catch (e) { toast.error(e.response?.data?.detail || 'Error'); }
  };

  return (
    <div className="page-body">
      <div className="page-header">
        <div><h2 className="page-title">Usuarios</h2><p className="page-subtitle">Gestión de accesos al sistema</p></div>
        <button className="btn btn-primary" onClick={() => setModal(true)}><Plus size={15}/> Nuevo Usuario</button>
      </div>
      <div className="table-wrapper">
        <table>
          <thead><tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Estado</th><th>Creado</th></tr></thead>
          <tbody>
            {usuarios.map(u => (
              <tr key={u.id}>
                <td style={{fontWeight:600}}>{u.nombre}</td>
                <td>{u.email}</td>
                <td><span className={`badge ${u.rol==='Administrador' ? 'badge-purple' : u.rol==='Vendedor' ? 'badge-info' : 'badge-warning'}`}>{u.rol}</span></td>
                <td><span className={`badge ${u.activo ? 'badge-success' : 'badge-gray'}`}>{u.activo ? 'Activo' : 'Inactivo'}</span></td>
                <td style={{fontSize:12,color:'var(--text-muted)'}}>{new Date(u.created_at).toLocaleDateString('es-BO')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal" style={{maxWidth:440}}>
            <div className="modal-header">
              <span className="modal-title">Nuevo Usuario</span>
              <button className="btn btn-icon btn-secondary" onClick={() => setModal(false)}><X size={16}/></button>
            </div>
            <div className="modal-body">
              <div className="form-grid" style={{gridTemplateColumns:'1fr'}}>
                <div className="form-group"><label className="form-label">Nombre *</label><input className="form-control" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})}/></div>
                <div className="form-group"><label className="form-label">Email *</label><input type="email" className="form-control" value={form.email} onChange={e => setForm({...form, email: e.target.value})}/></div>
                <div className="form-group"><label className="form-label">Contraseña *</label><input type="password" className="form-control" value={form.password} onChange={e => setForm({...form, password: e.target.value})}/></div>
                <div className="form-group">
                  <label className="form-label">Rol *</label>
                  <select className="form-control" value={form.rol_id} onChange={e => setForm({...form, rol_id: e.target.value})}>
                    <option value="">Seleccionar...</option>
                    {roles.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={crearUsuario}>Crear Usuario</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
