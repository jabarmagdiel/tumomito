from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List
from app.database import get_db
from app.models.inventario import StockInventario, KardexInventario, Almacen
from app.models.producto import Producto
from app.core.security import get_current_user, require_admin_or_almacen

router = APIRouter()


@router.get("/stock", response_model=List[dict])
def stock_general(
    almacen_id: Optional[int] = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    q = db.query(StockInventario)
    if almacen_id:
        q = q.filter(StockInventario.almacen_id == almacen_id)
    items = q.all()
    return [
        {
            "id": s.id,
            "producto_id": s.producto_id,
            "producto_nombre": s.producto.nombre if s.producto else None,
            "codigo_interno": s.producto.codigo_interno if s.producto else None,
            "almacen_id": s.almacen_id,
            "almacen_nombre": s.almacen.nombre if s.almacen else None,
            "cantidad": s.cantidad,
            "stock_minimo": s.producto.stock_minimo if s.producto else 0,
            "alerta": s.cantidad <= (s.producto.stock_minimo if s.producto else 0),
            "updated_at": s.updated_at,
        }
        for s in items
    ]


@router.get("/kardex/{producto_id}", response_model=List[dict])
def kardex_producto(
    producto_id: int,
    almacen_id: Optional[int] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    q = db.query(KardexInventario).filter(KardexInventario.producto_id == producto_id)
    if almacen_id:
        q = q.filter(KardexInventario.almacen_id == almacen_id)
    movs = q.order_by(KardexInventario.id.desc()).limit(limit).all()
    return [
        {
            "id": m.id,
            "tipo": m.tipo,
            "cantidad": m.cantidad,
            "stock_anterior": m.stock_anterior,
            "stock_resultante": m.stock_resultante,
            "referencia_tipo": m.referencia_tipo,
            "referencia_id": m.referencia_id,
            "notas": m.notas,
            "almacen_nombre": m.almacen.nombre if m.almacen else None,
            "created_at": m.created_at,
        }
        for m in movs
    ]


@router.post("/ajuste")
def ajuste_stock(
    producto_id: int,
    almacen_id: int,
    cantidad: int,
    notas: Optional[str] = None,
    db: Session = Depends(get_db),
    _=Depends(require_admin_or_almacen),
):
    """Ajuste manual de inventario (positivo = entrada, negativo = salida)."""
    stock = db.query(StockInventario).filter(
        StockInventario.producto_id == producto_id,
        StockInventario.almacen_id == almacen_id,
    ).first()

    if not stock:
        stock = StockInventario(producto_id=producto_id, almacen_id=almacen_id, cantidad=0)
        db.add(stock)

    anterior = stock.cantidad
    stock.cantidad = max(0, stock.cantidad + cantidad)

    kardex = KardexInventario(
        producto_id=producto_id,
        almacen_id=almacen_id,
        tipo="ENTRADA" if cantidad > 0 else "SALIDA",
        cantidad=abs(cantidad),
        stock_anterior=anterior,
        stock_resultante=stock.cantidad,
        referencia_tipo="AJUSTE",
        notas=notas,
    )
    db.add(kardex)
    db.commit()
    return {"detail": "Ajuste registrado", "stock_actual": stock.cantidad}


@router.get("/almacenes", response_model=List[dict])
def listar_almacenes(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return [
        {"id": a.id, "nombre": a.nombre, "ubicacion": a.ubicacion, "activo": a.activo}
        for a in db.query(Almacen).filter(Almacen.activo == True).all()
    ]
