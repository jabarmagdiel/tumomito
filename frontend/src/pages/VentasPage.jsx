import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Search, Eye, X, ShoppingCart } from 'lucide-react';

export default function VentasPage() {
  const [ventas, setVentas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [almacenes, setAlmacenes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [modal, setModal] = useState(false);
  const [detalleModal, setDetalleModal] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ cliente_id: '', almacen_id: '', tipo_venta: 'MAYORISTA', descuento_pct: 0, notas: '', detalles: [], generar_cuenta_cobrar: false, fecha_vencimiento: '' });
  const [lineaActual, setLineaActual] = useState({ producto_id: '', cantidad: 1, precio_unitario: 0, descuento_pct: 0 });

  useEffect(() => {
    api.get('/api/ventas/').then(r => setVentas(r.data));
    api.get('/api/clientes/').then(r => setClientes(r.data));
    api.get('/api/inventario/almacenes').then(r => setAlmacenes(r.data));
    api.get('/api/productos/?limit=500').then(r => setProductos(r.data));
  }, []);

  const load = () => api.get('/api/ventas/').then(r => setVentas(r.data));

  const agregarLinea = () => {
    if (!lineaActual.producto_id) return toast.error('Seleccione un producto');
    if (lineaActual.cantidad <= 0) return toast.error('Cantidad inválida');
    setForm({ ...form, detalles: [...form.detalles, { ...lineaActual }] });
    setLineaActual({ producto_id: '', cantidad: 1, precio_unitario: 0, descuento_pct: 0 });
  };

  const selProducto = (id) => {
    const p = productos.find(x => x.id == id);
    if (p) setLineaActual({ ...lineaActual, producto_id: id, precio_unitario: form.tipo_venta === 'MAYORISTA' ? p.precio_mayorista : p.precio_minorista });
  };

  const subtotal = form.detalles.reduce((acc, d) => acc + d.cantidad * d.precio_unitario * (1 - d.descuento_pct / 100), 0);
  const total = subtotal * (1 - form.descuento_pct / 100);

  const handleRegistrar = async () => {
    if (form.detalles.length === 0) return toast.error('Agregue al menos un producto');
    if (!form.almacen_id) return toast.error('Seleccione almacén');
    try {
      await api.post('/api/ventas/', { ...form, cliente_id: form.cliente_id || null, almacen_id: parseInt(form.almacen_id), descuento_pct: parseFloat(form.descuento_pct), detalles: form.detalles.map(d => ({ ...d, producto_id: parseInt(d.producto_id), cantidad: parseInt(d.cantidad), precio_unitario: parseFloat(d.precio_unitario), descuento_pct: parseFloat(d.descuento_pct) })) });
      toast.success('Venta registrada exitosamente');
      setModal(false);
      setForm({ cliente_id: '', almacen_id: '', tipo_venta: 'MAYORISTA', descuento_pct: 0, notas: '', detalles: [], generar_cuenta_cobrar: false, fecha_vencimiento: '' });
      load();
    } catch (e) { toast.error(e.response?.data?.detail || 'Error al registrar'); }
  };

  const verDetalle = async (id) => {
    const { data } = await api.get(`/api/ventas/${id}`);
    setDetalleModal(data);
  };

  const fmt = (n) => `Bs. ${Number(n).toFixed(2)}`;
  const filtered = ventas.filter(v => v.numero_venta.includes(search) || (v.cliente_nombre || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <h2 className="page-title">Ventas</h2>
          <p className="page-subtitle">{ventas.length} ventas registradas</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}><Plus size={15}/> Nueva Venta</button>
      </div>

      <div className="search-bar">
        <div className="search-input-wrap" style={{flex:1}}>
          <Search size={16}/><input className="form-control search-input" placeholder="Buscar por N° venta o cliente..." value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
      </div>

      <div className="table-wrapper">
        <table>
          <thead><tr><th>N° Venta</th><th>Fecha</th><th>Cliente</th><th>Tipo</th><th>Total</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            {filtered.map(v => (
              <tr key={v.id}>
                <td style={{fontFamily:'monospace',color:'var(--primary-light)'}}>{v.numero_venta}</td>
                <td>{v.fecha}</td>
                <td>{v.cliente_nombre || 'Público general'}</td>
                <td><span className={`badge ${v.tipo_venta==='MAYORISTA' ? 'badge-purple' : 'badge-info'}`}>{v.tipo_venta}</span></td>
                <td style={{fontWeight:700}}>{fmt(v.total)}</td>
                <td><span className={`badge ${v.estado==='COMPLETADA' ? 'badge-success' : 'badge-danger'}`}>{v.estado}</span></td>
                <td><button className="btn btn-secondary btn-sm" onClick={() => verDetalle(v.id)}><Eye size={13}/> Ver</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Nueva Venta */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal" style={{maxWidth:780}}>
            <div className="modal-header">
              <span className="modal-title">Registrar Nueva Venta</span>
              <button className="btn btn-icon btn-secondary" onClick={() => setModal(false)}><X size={16}/></button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Cliente</label>
                  <select className="form-control" value={form.cliente_id} onChange={e => setForm({...form, cliente_id: e.target.value})}>
                    <option value="">Público general</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Almacén *</label>
                  <select className="form-control" value={form.almacen_id} onChange={e => setForm({...form, almacen_id: e.target.value})}>
                    <option value="">Seleccionar...</option>
                    {almacenes.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Tipo de Venta</label>
                  <select className="form-control" value={form.tipo_venta} onChange={e => setForm({...form, tipo_venta: e.target.value})}>
                    <option value="MAYORISTA">Mayorista</option>
                    <option value="MINORISTA">Minorista</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Descuento General (%)</label>
                  <input type="number" step="0.5" className="form-control" value={form.descuento_pct} onChange={e => setForm({...form, descuento_pct: parseFloat(e.target.value)||0})}/>
                </div>
              </div>
              <hr className="divider"/>
              <h4 className="section-title">Agregar Productos</h4>
              <div className="form-grid" style={{gridTemplateColumns:'2fr 1fr 1fr 1fr auto'}}>
                <div className="form-group">
                  <label className="form-label">Producto</label>
                  <select className="form-control" value={lineaActual.producto_id} onChange={e => selProducto(e.target.value)}>
                    <option value="">Seleccionar...</option>
                    {productos.map(p => <option key={p.id} value={p.id}>{p.nombre} (Stock: {p.stock_total})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Cantidad</label>
                  <input type="number" min="1" className="form-control" value={lineaActual.cantidad} onChange={e => setLineaActual({...lineaActual, cantidad: parseInt(e.target.value)||1})}/>
                </div>
                <div className="form-group">
                  <label className="form-label">Precio</label>
                  <input type="number" step="0.01" className="form-control" value={lineaActual.precio_unitario} onChange={e => setLineaActual({...lineaActual, precio_unitario: parseFloat(e.target.value)||0})}/>
                </div>
                <div className="form-group">
                  <label className="form-label">Desc.%</label>
                  <input type="number" step="0.5" className="form-control" value={lineaActual.descuento_pct} onChange={e => setLineaActual({...lineaActual, descuento_pct: parseFloat(e.target.value)||0})}/>
                </div>
                <div className="form-group" style={{justifyContent:'flex-end'}}>
                  <label className="form-label">&nbsp;</label>
                  <button className="btn btn-success" onClick={agregarLinea}><Plus size={14}/></button>
                </div>
              </div>
              {form.detalles.length > 0 && (
                <div className="table-wrapper mt-4">
                  <table>
                    <thead><tr><th>Producto</th><th>Cant.</th><th>Precio</th><th>Desc.%</th><th>Subtotal</th><th></th></tr></thead>
                    <tbody>
                      {form.detalles.map((d, i) => {
                        const p = productos.find(x => x.id == d.producto_id);
                        const sub = d.cantidad * d.precio_unitario * (1 - d.descuento_pct / 100);
                        return (
                          <tr key={i}>
                            <td>{p?.nombre}</td><td>{d.cantidad}</td><td>{fmt(d.precio_unitario)}</td><td>{d.descuento_pct}%</td><td>{fmt(sub)}</td>
                            <td><button className="btn btn-danger btn-sm btn-icon" onClick={() => setForm({...form, detalles: form.detalles.filter((_,j)=>j!==i)})}><X size={12}/></button></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div style={{padding:'12px 16px',textAlign:'right'}}>
                    <span className="text-muted">Subtotal: {fmt(subtotal)} | Desc: {form.descuento_pct}% | </span>
                    <strong style={{fontSize:16,color:'var(--success)'}}>TOTAL: {fmt(total)}</strong>
                  </div>
                </div>
              )}
              <div className="form-group mt-4">
                <label className="form-label">
                  <input type="checkbox" checked={form.generar_cuenta_cobrar} onChange={e => setForm({...form, generar_cuenta_cobrar: e.target.checked})} style={{marginRight:8}}/>
                  Generar Cuenta por Cobrar
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleRegistrar}><ShoppingCart size={14}/> Registrar Venta</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalle */}
      {detalleModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDetalleModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">Detalle Venta {detalleModal.numero_venta}</span>
              <button className="btn btn-icon btn-secondary" onClick={() => setDetalleModal(null)}><X size={16}/></button>
            </div>
            <div className="modal-body">
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
                <div><span className="text-muted">Cliente:</span> <strong>{detalleModal.cliente_nombre || 'Público'}</strong></div>
                <div><span className="text-muted">Fecha:</span> <strong>{detalleModal.fecha}</strong></div>
                <div><span className="text-muted">Almacén:</span> <strong>{detalleModal.almacen_nombre}</strong></div>
                <div><span className="text-muted">Tipo:</span> <strong>{detalleModal.tipo_venta}</strong></div>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>Producto</th><th>Cant.</th><th>Precio</th><th>Desc.</th><th>Subtotal</th></tr></thead>
                  <tbody>
                    {detalleModal.detalles?.map((d, i) => (
                      <tr key={i}><td>{d.producto_nombre}</td><td>{d.cantidad}</td><td>{fmt(d.precio_unitario)}</td><td>{d.descuento_pct}%</td><td>{fmt(d.subtotal)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{textAlign:'right',marginTop:12}}>
                <span className="text-muted">Subtotal: {fmt(detalleModal.subtotal)} | Desc: {fmt(detalleModal.descuento_monto)} | </span>
                <strong style={{fontSize:18,color:'var(--success)'}}>TOTAL: {fmt(detalleModal.total)}</strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
