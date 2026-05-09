from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import date
from app.database import get_db
from app.models.transacciones import (
    VentaCabecera, VentaDetalle, CuentaCobrar
)
from app.models.inventario import StockInventario, KardexInventario
from app.models.producto import Producto
from app.models.usuario import Usuario
from app.schemas.transacciones import VentaCreate, VentaOut
from app.core.security import get_current_user

router = APIRouter()


def _gen_numero():
    from datetime import datetime
    return f"VTA-{datetime.now().strftime('%Y%m%d%H%M%S')}"


@router.post("/", response_model=dict, status_code=201)
def crear_venta(data: VentaCreate, db: Session = Depends(get_db), user: Usuario = Depends(get_current_user)):
    # Validar stock
    for det in data.detalles:
        stock = db.query(StockInventario).filter(
            StockInventario.producto_id == det.producto_id,
            StockInventario.almacen_id == data.almacen_id,
        ).first()
        if not stock or stock.cantidad < det.cantidad:
            prod = db.query(Producto).get(det.producto_id)
            raise HTTPException(400, f"Stock insuficiente para '{prod.nombre if prod else det.producto_id}'")

    # Calcular totales
    subtotal = sum(d.cantidad * d.precio_unitario * (1 - d.descuento_pct / 100) for d in data.detalles)
    descuento_monto = subtotal * (data.descuento_pct / 100)
    total = subtotal - descuento_monto

    # Crear cabecera
    venta = VentaCabecera(
        numero_venta=_gen_numero(),
        cliente_id=data.cliente_id,
        almacen_id=data.almacen_id,
        tipo_venta=data.tipo_venta,
        descuento_pct=data.descuento_pct,
        descuento_monto=round(descuento_monto, 2),
        subtotal=round(subtotal, 2),
        total=round(total, 2),
        notas=data.notas,
        usuario_id=user.id,
    )
    db.add(venta)
    db.flush()

    # Crear detalles y actualizar stock
    for det in data.detalles:
        sub = det.cantidad * det.precio_unitario * (1 - det.descuento_pct / 100)
        detalle = VentaDetalle(
            venta_id=venta.id,
            producto_id=det.producto_id,
            cantidad=det.cantidad,
            precio_unitario=det.precio_unitario,
            descuento_pct=det.descuento_pct,
            subtotal=round(sub, 2),
        )
        db.add(detalle)

        # Descontar stock
        stock = db.query(StockInventario).filter(
            StockInventario.producto_id == det.producto_id,
            StockInventario.almacen_id == data.almacen_id,
        ).first()
        anterior = stock.cantidad
        stock.cantidad -= det.cantidad

        # Registrar Kardex
        db.add(KardexInventario(
            producto_id=det.producto_id,
            almacen_id=data.almacen_id,
            tipo="SALIDA",
            cantidad=det.cantidad,
            stock_anterior=anterior,
            stock_resultante=stock.cantidad,
            referencia_tipo="VENTA",
            referencia_id=venta.id,
        ))

    # Cuenta por cobrar opcional
    if data.generar_cuenta_cobrar:
        db.add(CuentaCobrar(
            venta_id=venta.id,
            cliente_id=data.cliente_id,
            monto_total=round(total, 2),
            fecha_vencimiento=data.fecha_vencimiento,
        ))

    db.commit()
    db.refresh(venta)
    return {"id": venta.id, "numero_venta": venta.numero_venta, "total": float(venta.total)}


@router.get("/", response_model=List[dict])
def listar_ventas(
    fecha_inicio: date = None,
    fecha_fin: date = None,
    cliente_id: int = None,
    skip: int = 0, limit: int = 50,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    q = db.query(VentaCabecera).filter(VentaCabecera.estado != "ANULADA")
    if fecha_inicio:
        q = q.filter(VentaCabecera.fecha >= fecha_inicio)
    if fecha_fin:
        q = q.filter(VentaCabecera.fecha <= fecha_fin)
    if cliente_id:
        q = q.filter(VentaCabecera.cliente_id == cliente_id)
    ventas = q.order_by(VentaCabecera.id.desc()).offset(skip).limit(limit).all()
    return [
        {
            "id": v.id, "numero_venta": v.numero_venta,
            "fecha": str(v.fecha), "total": float(v.total),
            "tipo_venta": v.tipo_venta, "estado": v.estado,
            "cliente_nombre": v.cliente.nombre if v.cliente else "Sin cliente",
        }
        for v in ventas
    ]


@router.get("/{venta_id}", response_model=dict)
def obtener_venta(venta_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    v = db.query(VentaCabecera).filter(VentaCabecera.id == venta_id).first()
    if not v:
        raise HTTPException(404, "Venta no encontrada")
    return {
        "id": v.id, "numero_venta": v.numero_venta,
        "fecha": str(v.fecha), "subtotal": float(v.subtotal),
        "descuento_pct": float(v.descuento_pct), "total": float(v.total),
        "tipo_venta": v.tipo_venta, "estado": v.estado, "notas": v.notas,
        "cliente_nombre": v.cliente.nombre if v.cliente else None,
        "almacen_nombre": v.almacen.nombre if v.almacen else None,
        "usuario_nombre": v.usuario.nombre if v.usuario else None,
        "detalles": [
            {
                "producto_id": d.producto_id,
                "producto_nombre": d.producto.nombre,
                "cantidad": d.cantidad,
                "precio_unitario": float(d.precio_unitario),
                "descuento_pct": float(d.descuento_pct),
                "subtotal": float(d.subtotal),
            }
            for d in v.detalles
        ],
    }


@router.put("/{venta_id}/anular")
def anular_venta(venta_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    v = db.query(VentaCabecera).filter(VentaCabecera.id == venta_id).first()
    if not v:
        raise HTTPException(404, "Venta no encontrada")
    if v.estado == "ANULADA":
        raise HTTPException(400, "La venta ya fue anulada")
    # Revertir stock
    for det in v.detalles:
        stock = db.query(StockInventario).filter(
            StockInventario.producto_id == det.producto_id,
            StockInventario.almacen_id == v.almacen_id,
        ).first()
        if stock:
            anterior = stock.cantidad
            stock.cantidad += det.cantidad
            db.add(KardexInventario(
                producto_id=det.producto_id, almacen_id=v.almacen_id,
                tipo="ENTRADA", cantidad=det.cantidad,
                stock_anterior=anterior, stock_resultante=stock.cantidad,
                referencia_tipo="ANULACION_VENTA", referencia_id=venta_id,
            ))
    v.estado = "ANULADA"
    db.commit()
    return {"detail": "Venta anulada y stock restaurado"}
