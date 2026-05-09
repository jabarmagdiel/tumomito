from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, extract
from datetime import date, timedelta
from app.database import get_db
from app.models.transacciones import VentaCabecera, VentaDetalle, CompraCabecera
from app.models.producto import Producto
from app.models.inventario import StockInventario
from app.core.security import get_current_user

router = APIRouter()


@router.get("/dashboard")
def dashboard_kpis(db: Session = Depends(get_db), _=Depends(get_current_user)):
    hoy = date.today()
    inicio_mes = hoy.replace(day=1)
    inicio_sem = hoy - timedelta(days=hoy.weekday())

    ventas_mes = db.query(func.sum(VentaCabecera.total)).filter(
        VentaCabecera.fecha >= inicio_mes,
        VentaCabecera.estado != "ANULADA",
    ).scalar() or 0

    ventas_sem = db.query(func.sum(VentaCabecera.total)).filter(
        VentaCabecera.fecha >= inicio_sem,
        VentaCabecera.estado != "ANULADA",
    ).scalar() or 0

    ventas_hoy = db.query(func.sum(VentaCabecera.total)).filter(
        VentaCabecera.fecha == hoy,
        VentaCabecera.estado != "ANULADA",
    ).scalar() or 0

    num_ventas_mes = db.query(func.count(VentaCabecera.id)).filter(
        VentaCabecera.fecha >= inicio_mes,
        VentaCabecera.estado != "ANULADA",
    ).scalar() or 0

    total_productos = db.query(func.count(Producto.id)).filter(Producto.activo == True).scalar() or 0

    alertas_stock = 0
    productos = db.query(Producto).filter(Producto.activo == True).all()
    for p in productos:
        stock = db.query(func.sum(StockInventario.cantidad)).filter(StockInventario.producto_id == p.id).scalar() or 0
        if int(stock) <= p.stock_minimo:
            alertas_stock += 1

    return {
        "ventas_hoy": float(ventas_hoy),
        "ventas_semana": float(ventas_sem),
        "ventas_mes": float(ventas_mes),
        "num_ventas_mes": num_ventas_mes,
        "total_productos": total_productos,
        "alertas_stock": alertas_stock,
    }


@router.get("/productos-mas-vendidos")
def productos_mas_vendidos(
    fecha_inicio: date = None, fecha_fin: date = None,
    limit: int = 10, db: Session = Depends(get_db), _=Depends(get_current_user),
):
    q = db.query(
        Producto.id, Producto.nombre, Producto.codigo_interno,
        func.sum(VentaDetalle.cantidad).label("total_vendido"),
        func.sum(VentaDetalle.subtotal).label("total_ingreso"),
    ).join(VentaDetalle, VentaDetalle.producto_id == Producto.id
    ).join(VentaCabecera, VentaCabecera.id == VentaDetalle.venta_id
    ).filter(VentaCabecera.estado != "ANULADA")
    if fecha_inicio:
        q = q.filter(VentaCabecera.fecha >= fecha_inicio)
    if fecha_fin:
        q = q.filter(VentaCabecera.fecha <= fecha_fin)
    resultados = q.group_by(Producto.id, Producto.nombre, Producto.codigo_interno
                  ).order_by(desc("total_vendido")).limit(limit).all()
    return [
        {
            "producto_id": r.id, "nombre": r.nombre, "codigo": r.codigo_interno,
            "total_vendido": int(r.total_vendido),
            "total_ingreso": float(r.total_ingreso),
        }
        for r in resultados
    ]


@router.get("/productos-sin-rotacion")
def productos_sin_rotacion(dias: int = 60, db: Session = Depends(get_db), _=Depends(get_current_user)):
    corte = date.today() - timedelta(days=dias)
    vendidos_ids = db.query(VentaDetalle.producto_id).join(VentaCabecera).filter(
        VentaCabecera.fecha >= corte,
        VentaCabecera.estado != "ANULADA",
    ).distinct().subquery()
    sin_rotacion = db.query(Producto).filter(
        Producto.activo == True,
        ~Producto.id.in_(vendidos_ids),
    ).all()
    return [
        {
            "id": p.id, "nombre": p.nombre, "codigo_interno": p.codigo_interno,
            "stock_total": int(db.query(func.sum(StockInventario.cantidad)).filter(StockInventario.producto_id == p.id).scalar() or 0),
        }
        for p in sin_rotacion
    ]


@router.get("/ventas-por-fecha")
def ventas_por_fecha(
    fecha_inicio: date = None, fecha_fin: date = None,
    db: Session = Depends(get_db), _=Depends(get_current_user),
):
    if not fecha_inicio:
        fecha_inicio = date.today().replace(day=1)
    if not fecha_fin:
        fecha_fin = date.today()
    resultados = db.query(
        VentaCabecera.fecha,
        func.count(VentaCabecera.id).label("num_ventas"),
        func.sum(VentaCabecera.total).label("total"),
    ).filter(
        VentaCabecera.fecha.between(fecha_inicio, fecha_fin),
        VentaCabecera.estado != "ANULADA",
    ).group_by(VentaCabecera.fecha).order_by(VentaCabecera.fecha).all()
    return [
        {"fecha": str(r.fecha), "num_ventas": r.num_ventas, "total": float(r.total)}
        for r in resultados
    ]


@router.get("/inventario-actual")
def inventario_actual(db: Session = Depends(get_db), _=Depends(get_current_user)):
    productos = db.query(Producto).filter(Producto.activo == True).all()
    return [
        {
            "id": p.id, "nombre": p.nombre, "codigo_interno": p.codigo_interno,
            "stock_total": int(db.query(func.sum(StockInventario.cantidad)).filter(StockInventario.producto_id == p.id).scalar() or 0),
            "precio_mayorista": float(p.precio_mayorista),
            "precio_costo": float(p.precio_costo),
            "valor_inventario": float(p.precio_costo) * int(db.query(func.sum(StockInventario.cantidad)).filter(StockInventario.producto_id == p.id).scalar() or 0),
        }
        for p in productos
    ]
