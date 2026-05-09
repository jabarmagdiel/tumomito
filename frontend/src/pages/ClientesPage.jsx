import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Search, Edit2, X } from 'lucide-react';

function CrudPage({ title, subtitle, apiPath, fields, columns }) {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({});

  const load = () => api.get(apiPath + (search ? `?search=${search}` : '')).then(r => setItems(r.data));
  useEffect(() => { load(); }, [search]);

  const initForm = () => {
    const f = {};
    fields.forEach(field => { f[field.key] = field.default ?? ''; });
    return f;
  };

  const openCreate = () => { setEditItem(null); setForm(initForm()); setModal(true); };
  const openEdit = (item) => { setEditItem(item); setForm({ ...initForm(), ...item }); setModal(true); };

  const handleSave = async () => {
    try {
      if (editItem) {
        await api.put(`${apiPath}${editItem.id}`, form);
        toast.success('Actualizado correctamente');
      } else {
        await api.post(apiPath, form);
        toast.success('Creado correctamente');
      }
      setModal(false);
      load();
    } catch (e) { toast.error(e.response?.data?.detail || 'Error'); }
  };

  return (
    <div className="page-body">
      <div className="page-header">
        <div><h2 className="page-title">{title}</h2><p className="page-subtitle">{subtitle}</p></div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={15}/> Nuevo</button>
      </div>
      <div className="search-bar">
        <div className="search-input-wrap" style={{flex:1}}>
          <Search size={16}/>
          <input className="form-control search-input" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
      </div>
      <div className="table-wrapper">
        <table>
          <thead><tr>{columns.map(c => <th key={c.key}>{c.label}</th>)}<th>Acciones</th></tr></thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id}>
                {columns.map(c => <td key={c.key}>{c.render ? c.render(item[c.key], item) : item[c.key]}</td>)}
                <td>
                  <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openEdit(item)}><Edit2 size={13}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal" style={{maxWidth:500}}>
            <div className="modal-header">
              <span className="modal-title">{editItem ? `Editar ${title.slice(0,-1)}` : `Nuevo ${title.slice(0,-1)}`}</span>
              <button className="btn btn-icon btn-secondary" onClick={() => setModal(false)}><X size={16}/></button>
            </div>
            <div className="modal-body">
              <div className="form-grid" style={{gridTemplateColumns:'1fr'}}>
                {fields.map(f => (
                  <div className="form-group" key={f.key}>
                    <label className="form-label">{f.label}</label>
                    {f.type === 'textarea' ? (
                      <textarea className="form-control" rows={3} value={form[f.key] || ''} onChange={e => setForm({...form, [f.key]: e.target.value})}/>
                    ) : (
                      <input type={f.type || 'text'} className="form-control" value={form[f.key] || ''} onChange={e => setForm({...form, [f.key]: e.target.value})}/>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSave}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function ClientesPage() {
  return <CrudPage
    title="Clientes"
    subtitle="Base de clientes mayoristas"
    apiPath="/api/clientes/"
    fields={[
      { key: 'nombre', label: 'Nombre *' },
      { key: 'nit_ci', label: 'NIT / CI' },
      { key: 'telefono', label: 'Teléfono' },
      { key: 'email', label: 'Email', type: 'email' },
      { key: 'direccion', label: 'Dirección', type: 'textarea' },
      { key: 'descuento_pct', label: 'Descuento (%)', type: 'number', default: 0 },
      { key: 'limite_credito', label: 'Límite de crédito (Bs.)', type: 'number', default: 0 },
    ]}
    columns={[
      { key: 'nombre', label: 'Nombre' },
      { key: 'nit_ci', label: 'NIT/CI' },
      { key: 'telefono', label: 'Teléfono' },
      { key: 'descuento_pct', label: 'Descuento', render: v => `${v}%` },
      { key: 'limite_credito', label: 'Límite crédito', render: v => `Bs. ${Number(v).toFixed(2)}` },
    ]}
  />;
}

export function ProveedoresPage() {
  return <CrudPage
    title="Proveedores"
    subtitle="Proveedores e importadores"
    apiPath="/api/proveedores/"
    fields={[
      { key: 'nombre', label: 'Nombre *' },
      { key: 'contacto', label: 'Persona de Contacto' },
      { key: 'telefono', label: 'Teléfono' },
      { key: 'email', label: 'Email', type: 'email' },
      { key: 'pais', label: 'País de Origen' },
      { key: 'direccion', label: 'Dirección', type: 'textarea' },
    ]}
    columns={[
      { key: 'nombre', label: 'Proveedor' },
      { key: 'contacto', label: 'Contacto' },
      { key: 'telefono', label: 'Teléfono' },
      { key: 'pais', label: 'País' },
      { key: 'activo', label: 'Estado', render: v => <span className={`badge ${v ? 'badge-success' : 'badge-gray'}`}>{v ? 'Activo' : 'Inactivo'}</span> },
    ]}
  />;
}

export default ClientesPage;
