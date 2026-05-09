import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Search, Edit2, X, Package } from 'lucide-react';

export default function ProductosPage() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [search, setSearch] = useState('');
  const [catFiltro, setCatFiltro] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({
    codigo_interno: '', nombre: '', codigo_barras: '', descripcion: '',
    categoria_id: '', proveedor_id: '', marca_id: '',
    precio_costo: 0, precio_mayorista: 0, precio_minorista: 0,
    stock_minimo: 5, en_catalogo: true, activo: true,
  });

  const load = () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (catFiltro) params.set('categoria_id', catFiltro);
    api.get(`/api/productos/?${params}`).then(r => setProductos(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => {
    api.get('/api/productos/meta/categorias').then(r => setCategorias(r.data));
    api.get('/api/proveedores/').then(r => setProveedores(r.data));
  }, []);

  useEffect(() => { load(); }, [search, catFiltro]);

  const openCreate = () => {
    setEditItem(null);
    setForm({ codigo_interno: '', nombre: '', codigo_barras: '', descripcion: '', categoria_id: '', proveedor_id: '', marca_id: '', precio_costo: 0, precio_mayorista: 0, precio_minorista: 0, stock_minimo: 5, en_catalogo: true, activo: true });
    setModal(true);
  };

  const openEdit = (p) => {
    setEditItem(p);
    setForm({ ...p, categoria_id: p.categoria_id || '', proveedor_id: p.proveedor_id || '', marca_id: p.marca_id || '' });
    setModal(true);
  };

  const handleSave = async () => {
    try {
      if (editItem) {
        await api.put(`/api/productos/${editItem.id}`, form);
        toast.success('Producto actualizado');
      } else {
        await api.post('/api/productos/', form);
        toast.success('Producto creado');
      }
      setModal(false);
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Error al guardar');
    }
  };

  const handleDesactivar = async (id) => {
    if (!confirm('¿Desactivar este producto?')) return;
    await api.delete(`/api/productos/${id}`);
    toast.success('Producto desactivado');
    load();
  };

  const fmt = (n) => `Bs. ${Number(n).toFixed(2)}`;
  const stockBadge = (n, min) => n <= min ? 'badge-danger' : n <= min * 2 ? 'badge-warning' : 'badge-success';

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <h2 className="page-title">Productos</h2>
          <p className="page-subtitle">{productos.length} productos activos</p>
        </div>
        <button id="btn-nuevo-producto" className="btn btn-primary" onClick={openCreate}>
          <Plus size={15} /> Nuevo Producto
        </button>
      </div>

      <div className="search-bar">
        <div className="search-input-wrap" style={{flex:1}}>
          <Search size={16} />
          <input id="search-productos" className="form-control search-input" placeholder="Buscar por nombre, código..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-control" style={{width:200}} value={catFiltro} onChange={e => setCatFiltro(e.target.value)}>
          <option value="">Todas las categorías</option>
          {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
      </div>

      <div className="card" style={{padding:0}}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Código</th><th>Nombre</th><th>Categoría</th><th>Proveedor</th>
                <th>P. Mayorista</th><th>P. Minorista</th><th>Stock</th><th>Catálogo</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{textAlign:'center',padding:32,color:'var(--text-muted)'}}>Cargando...</td></tr>
              ) : productos.length === 0 ? (
                <tr><td colSpan={9}><div className="empty-state"><Package /><p>No hay productos</p></div></td></tr>
              ) : productos.map(p => (
                <tr key={p.id}>
                  <td><span style={{fontFamily:'monospace',fontSize:12,color:'var(--primary-light)'}}>{p.codigo_interno}</span></td>
                  <td style={{maxWidth:240,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.nombre}</td>
                  <td>{p.categoria_nombre || <span className="text-muted">—</span>}</td>
                  <td>{p.proveedor_nombre || <span className="text-muted">—</span>}</td>
                  <td>{fmt(p.precio_mayorista)}</td>
                  <td>{fmt(p.precio_minorista)}</td>
                  <td><span className={`badge ${stockBadge(p.stock_total, p.stock_minimo)}`}>{p.stock_total}</span></td>
                  <td>{p.en_catalogo ? <span className="badge badge-success">Sí</span> : <span className="badge badge-gray">No</span>}</td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openEdit(p)}><Edit2 size={13}/></button>
                      <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDesactivar(p.id)}><X size={13}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">{editItem ? 'Editar Producto' : 'Nuevo Producto'}</span>
              <button className="btn btn-icon btn-secondary" onClick={() => setModal(false)}><X size={16}/></button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Código Interno *</label>
                  <input className="form-control" value={form.codigo_interno} onChange={e => setForm({...form, codigo_interno: e.target.value})} disabled={!!editItem} />
                </div>
                <div className="form-group">
                  <label className="form-label">Código de Barras</label>
                  <input className="form-control" value={form.codigo_barras || ''} onChange={e => setForm({...form, codigo_barras: e.target.value})} />
                </div>
                <div className="form-group" style={{gridColumn:'1/-1'}}>
                  <label className="form-label">Nombre *</label>
                  <input className="form-control" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Categoría</label>
                  <select className="form-control" value={form.categoria_id || ''} onChange={e => setForm({...form, categoria_id: e.target.value || null})}>
                    <option value="">Sin categoría</option>
                    {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Proveedor</label>
                  <select className="form-control" value={form.proveedor_id || ''} onChange={e => setForm({...form, proveedor_id: e.target.value || null})}>
                    <option value="">Sin proveedor</option>
                    {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Precio Costo (Bs.)</label>
                  <input type="number" step="0.01" className="form-control" value={form.precio_costo} onChange={e => setForm({...form, precio_costo: parseFloat(e.target.value)||0})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Precio Mayorista (Bs.)</label>
                  <input type="number" step="0.01" className="form-control" value={form.precio_mayorista} onChange={e => setForm({...form, precio_mayorista: parseFloat(e.target.value)||0})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Precio Minorista (Bs.)</label>
                  <input type="number" step="0.01" className="form-control" value={form.precio_minorista} onChange={e => setForm({...form, precio_minorista: parseFloat(e.target.value)||0})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Stock Mínimo</label>
                  <input type="number" className="form-control" value={form.stock_minimo} onChange={e => setForm({...form, stock_minimo: parseInt(e.target.value)||0})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Mostrar en Catálogo</label>
                  <select className="form-control" value={form.en_catalogo ? '1' : '0'} onChange={e => setForm({...form, en_catalogo: e.target.value === '1'})}>
                    <option value="1">Sí</option>
                    <option value="0">No</option>
                  </select>
                </div>
                <div className="form-group" style={{gridColumn:'1/-1'}}>
                  <label className="form-label">Descripción</label>
                  <textarea className="form-control" rows={3} value={form.descripcion || ''} onChange={e => setForm({...form, descripcion: e.target.value})} />
                </div>
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
