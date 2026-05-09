from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date
from app.database import get_db
from app.models.transacciones import CompraCabecera, CompraDetalle, CuentaPagar
from app.models.inventario import StockInventario, KardexInventario
from app.models.producto import Producto
from app.models.usuario import Usuario
from app.schemas.transacciones import CompraCreate, RecepcionCreate
from app.core.security import get_current_user, require_admin_or_almacen

router = APIRouter()


def _gen_orden():
    from datetime import datetime
    return f"OC-{datetime.now().strftime('%Y%m%d%H%M%S')}"


@router.post("/", status_code=201)
def crear_orden_compra(data: CompraCreate, db: Session = Depends(get_db), user: Usuario = Depends(require_admin_or_almacen)):
    total = sum(d.cantidad_pedida * d.precio_unitario for d in data.detalles)
    compra = CompraCabecera(
        numero_orden=_gen_orden(),
        proveedor_id=data.proveedor_id,
        fecha_orden=data.fecha_orden or date.today(),
        total=round(total, 2),
        notas=data.notas,
        usuario_id=user.id,
    )
    db.add(compra)
    db.flush()
    for det in data.detalles:
        db.add(CompraDetalle(
            compra_id=compra.id,
            producto_id=det.producto_id,
            cantidad_pedida=det.cantidad_pedida,
            precio_unitario=det.precio_unitario,
            subtotal=round(det.cantidad_pedida * det.precio_unitario, 2),
        ))
    db.commit()
    db.refresh(compra)
    return {"id": compra.id, "numero_orden": compra.numero_orden, "total": float(compra.total)}


@router.post("/{compra_id}/recepcion")
def recibir_compra(
    compra_id: int, data: RecepcionCreate,
    db: Session = Depends(get_db), _=Depends(require_admin_or_almacen),
):
    compra = db.query(CompraCabecera).filter(CompraCabecera.id == compra_id).first()
    if not compra:
        raise HTTPException(404, "Orden no encontrada")
    if compra.estado == "CANCELADA":
        raise HTTPException(400, "Orden cancelada")

    total_recibido = 0
    for rec in data.detalles:
        det = db.query(CompraDetalle).filter(CompraDetalle.id == rec.compra_detalle_id).first()
        if not det or det.compra_id != compra_id:
            raise HTTPException(404, f"Detalle {rec.compra_detalle_id} no encontrado")
        det.cantidad_recibida = rec.cantidad_recibida
        det.subtotal = round(det.cantidad_recibida * float(det.precio_unitario), 2)
        total_recibido += det.subtotal

        # Actualizar stock
        stock = db.query(StockInventario).filter(
            StockInventario.producto_id == det.producto_id,
            StockInventario.almacen_id == data.almacen_id,
        ).first()
        if not stock:
            stock = StockInventario(producto_id=det.producto_id, almacen_id=data.almacen_id, cantidad=0)
            db.add(stock)
        anterior = stock.cantidad
        stock.cantidad += rec.cantidad_recibida

        db.add(KardexInventario(
            producto_id=det.producto_id, almacen_id=data.almacen_id,
            tipo="ENTRADA", cantidad=rec.cantidad_recibida,
            stock_anterior=anterior, stock_resultante=stock.cantidad,
            referencia_tipo="COMPRA", referencia_id=compra_id,
        ))

        # Actualizar precio costo del producto
        prod = db.query(Producto).get(det.producto_id)
        if prod:
            prod.precio_costo = det.precio_unitario

    compra.estado = "RECIBIDA"
    compra.fecha_recepcion = data.fecha_recepcion
    compra.total = round(total_recibido, 2)

    if data.generar_cuenta_pagar:
        db.add(CuentaPagar(
            compra_id=compra_id,
            proveedor_id=compra.proveedor_id,
            monto_total=round(total_recibido, 2),
            fecha_vencimiento=data.fecha_vencimiento,
        ))

    db.commit()
    return {"detail": "Recepción registrada", "total": round(total_recibido, 2)}


@router.get("/", response_model=List[dict])
def listar_compras(skip: int = 0, limit: int = 50, db: Session = Depends(get_db), _=Depends(get_current_user)):
    compras = db.query(CompraCabecera).order_by(CompraCabecera.id.desc()).offset(skip).limit(limit).all()
    return [
        {
            "id": c.id, "numero_orden": c.numero_orden,
            "proveedor_nombre": c.proveedor.nombre, "fecha_orden": str(c.fecha_orden),
            "estado": c.estado, "total": float(c.total),
        }
        for c in compras
    ]


@router.get("/{compra_id}", response_model=dict)
def obtener_compra(compra_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    c = db.query(CompraCabecera).filter(CompraCabecera.id == compra_id).first()
    if not c:
        raise HTTPException(404, "Compra no encontrada")
    return {
        "id": c.id, "numero_orden": c.numero_orden,
        "proveedor_nombre": c.proveedor.nombre, "fecha_orden": str(c.fecha_orden),
        "fecha_recepcion": str(c.fecha_recepcion) if c.fecha_recepcion else None,
        "estado": c.estado, "total": float(c.total), "notas": c.notas,
        "detalles": [
            {
                "id": d.id, "producto_id": d.producto_id,
                "producto_nombre": d.producto.nombre,
                "cantidad_pedida": d.cantidad_pedida,
                "cantidad_recibida": d.cantidad_recibida,
                "precio_unitario": float(d.precio_unitario),
                "subtotal": float(d.subtotal),
            }
            for d in c.detalles
        ],
    }
