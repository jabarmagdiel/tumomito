import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Search, X, Truck } from 'lucide-react';

export default function ComprasPage() {
  const [compras, setCompras] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [productos, setProductos] = useState([]);
  const [almacenes, setAlmacenes] = useState([]);
  const [modal, setModal] = useState(false);
  const [recepcionModal, setRecepcionModal] = useState(null);
  const [form, setForm] = useState({ proveedor_id: '', notas: '', detalles: [] });
  const [linea, setLinea] = useState({ producto_id: '', cantidad_pedida: 1, precio_unitario: 0 });
  const [recepcion, setRecepcion] = useState({ almacen_id: '', fecha_recepcion: new Date().toISOString().slice(0,10), detalles: [], generar_cuenta_pagar: false });

  useEffect(() => {
    api.get('/api/compras/').then(r => setCompras(r.data));
    api.get('/api/proveedores/').then(r => setProveedores(r.data));
    api.get('/api/productos/?limit=500').then(r => setProductos(r.data));
    api.get('/api/inventario/almacenes').then(r => setAlmacenes(r.data));
  }, []);

  const load = () => api.get('/api/compras/').then(r => setCompras(r.data));

  const crearOrden = async () => {
    if (!form.proveedor_id || form.detalles.length === 0) return toast.error('Seleccione proveedor y agregue productos');
    try {
      await api.post('/api/compras/', { ...form, proveedor_id: parseInt(form.proveedor_id), detalles: form.detalles.map(d => ({ ...d, producto_id: parseInt(d.producto_id), cantidad_pedida: parseInt(d.cantidad_pedida), precio_unitario: parseFloat(d.precio_unitario) })) });
      toast.success('Orden de compra creada');
      setModal(false);
      setForm({ proveedor_id: '', notas: '', detalles: [] });
      load();
    } catch (e) { toast.error(e.response?.data?.detail || 'Error'); }
  };

  const abrirRecepcion = async (compra) => {
    const { data } = await api.get(`/api/compras/${compra.id}`);
    setRecepcionModal(data);
    setRecepcion({ almacen_id: '', fecha_recepcion: new Date().toISOString().slice(0,10), detalles: data.detalles.map(d => ({ compra_detalle_id: d.id, cantidad_recibida: d.cantidad_pedida })), generar_cuenta_pagar: false });
  };

  const registrarRecepcion = async () => {
    if (!recepcion.almacen_id) return toast.error('Seleccione almacén');
    try {
      await api.post(`/api/compras/${recepcionModal.id}/recepcion`, { ...recepcion, almacen_id: parseInt(recepcion.almacen_id), detalles: recepcion.detalles.map(d => ({ ...d, cantidad_recibida: parseInt(d.cantidad_recibida) })) });
      toast.success('Recepción registrada, stock actualizado');
      setRecepcionModal(null);
      load();
    } catch (e) { toast.error(e.response?.data?.detail || 'Error'); }
  };

  const fmt = (n) => `Bs. ${Number(n).toFixed(2)}`;

  return (
    <div className="page-body">
      <div className="page-header">
        <div><h2 className="page-title">Compras</h2><p className="page-subtitle">Órdenes de compra y recepciones</p></div>
        <button className="btn btn-primary" onClick={() => setModal(true)}><Plus size={15}/> Nueva Orden</button>
      </div>

      <div className="table-wrapper">
        <table>
          <thead><tr><th>N° Orden</th><th>Proveedor</th><th>Fecha</th><th>Estado</th><th>Total</th><th>Acciones</th></tr></thead>
          <tbody>
            {compras.map(c => (
              <tr key={c.id}>
                <td style={{fontFamily:'monospace',color:'var(--primary-light)'}}>{c.numero_orden}</td>
                <td>{c.proveedor_nombre}</td>
                <td>{c.fecha_orden}</td>
                <td><span className={`badge ${c.estado==='RECIBIDA' ? 'badge-success' : c.estado==='PENDIENTE' ? 'badge-warning' : 'badge-gray'}`}>{c.estado}</span></td>
                <td style={{fontWeight:700}}>{fmt(c.total)}</td>
                <td>
                  {c.estado === 'PENDIENTE' && (
                    <button className="btn btn-success btn-sm" onClick={() => abrirRecepcion(c)}><Truck size={13}/> Recibir</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal" style={{maxWidth:700}}>
            <div className="modal-header">
              <span className="modal-title">Nueva Orden de Compra</span>
              <button className="btn btn-icon btn-secondary" onClick={() => setModal(false)}><X size={16}/></button>
            </div>
            <div className="modal-body">
              <div className="form-grid" style={{gridTemplateColumns:'1fr 1fr',marginBottom:16}}>
                <div className="form-group">
                  <label className="form-label">Proveedor *</label>
                  <select className="form-control" value={form.proveedor_id} onChange={e => setForm({...form, proveedor_id: e.target.value})}>
                    <option value="">Seleccionar...</option>
                    {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Notas</label>
                  <input className="form-control" value={form.notas} onChange={e => setForm({...form, notas: e.target.value})}/>
                </div>
              </div>
              <h4 className="section-title">Productos</h4>
              <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr auto',gap:8,marginBottom:8}}>
                <select className="form-control" value={linea.producto_id} onChange={e => setLinea({...linea, producto_id: e.target.value})}>
                  <option value="">Seleccionar...</option>
                  {productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
                <input type="number" className="form-control" placeholder="Cantidad" value={linea.cantidad_pedida} onChange={e => setLinea({...linea, cantidad_pedida: e.target.value})}/>
                <input type="number" step="0.01" className="form-control" placeholder="Precio c/u" value={linea.precio_unitario} onChange={e => setLinea({...linea, precio_unitario: e.target.value})}/>
                <button className="btn btn-success" onClick={() => { if (linea.producto_id) { setForm({...form, detalles: [...form.detalles, {...linea}]}); setLinea({ producto_id: '', cantidad_pedida: 1, precio_unitario: 0 }); }}}><Plus size={14}/></button>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>Producto</th><th>Cant.</th><th>P. Unitario</th><th>Subtotal</th><th></th></tr></thead>
                  <tbody>
                    {form.detalles.map((d,i) => {
                      const p = productos.find(x => x.id == d.producto_id);
                      return <tr key={i}><td>{p?.nombre}</td><td>{d.cantidad_pedida}</td><td>{fmt(d.precio_unitario)}</td><td>{fmt(d.cantidad_pedida * d.precio_unitario)}</td><td><button className="btn btn-danger btn-sm btn-icon" onClick={() => setForm({...form, detalles: form.detalles.filter((_,j)=>j!==i)})}><X size={12}/></button></td></tr>;
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={crearOrden}>Crear Orden</button>
            </div>
          </div>
        </div>
      )}

      {recepcionModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setRecepcionModal(null)}>
          <div className="modal" style={{maxWidth:680}}>
            <div className="modal-header">
              <span className="modal-title">Recepción — {recepcionModal.numero_orden}</span>
              <button className="btn btn-icon btn-secondary" onClick={() => setRecepcionModal(null)}><X size={16}/></button>
            </div>
            <div className="modal-body">
              <div className="form-grid" style={{gridTemplateColumns:'1fr 1fr',marginBottom:16}}>
                <div className="form-group">
                  <label className="form-label">Almacén destino *</label>
                  <select className="form-control" value={recepcion.almacen_id} onChange={e => setRecepcion({...recepcion, almacen_id: e.target.value})}>
                    <option value="">Seleccionar...</option>
                    {almacenes.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Fecha de Recepción</label>
                  <input type="date" className="form-control" value={recepcion.fecha_recepcion} onChange={e => setRecepcion({...recepcion, fecha_recepcion: e.target.value})}/>
                </div>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>Producto</th><th>Pedido</th><th>Cantidad Recibida</th></tr></thead>
                  <tbody>
                    {recepcionModal.detalles.map((d, i) => (
                      <tr key={i}>
                        <td>{d.producto_nombre}</td>
                        <td>{d.cantidad_pedida}</td>
                        <td><input type="number" className="form-control" style={{width:100}} value={recepcion.detalles[i]?.cantidad_recibida || 0} onChange={e => {
                          const det = [...recepcion.detalles];
                          det[i] = { ...det[i], cantidad_recibida: parseInt(e.target.value)||0 };
                          setRecepcion({...recepcion, detalles: det});
                        }}/></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <label className="form-label mt-4" style={{display:'flex',alignItems:'center',gap:8}}>
                <input type="checkbox" checked={recepcion.generar_cuenta_pagar} onChange={e => setRecepcion({...recepcion, generar_cuenta_pagar: e.target.checked})}/>
                Generar Cuenta por Pagar
              </label>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setRecepcionModal(null)}>Cancelar</button>
              <button className="btn btn-success" onClick={registrarRecepcion}><Truck size={14}/> Confirmar Recepción</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
