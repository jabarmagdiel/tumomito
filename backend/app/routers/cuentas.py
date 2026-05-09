from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.transacciones import CuentaCobrar, CuentaPagar
from app.schemas.transacciones import PagoIn, CuentaCobrarOut, CuentaPagarOut
from app.core.security import get_current_user

router = APIRouter()


# ── Cuentas por Cobrar ────────────────────────────────────────────────────────
@router.get("/cobrar", response_model=List[dict])
def listar_cuentas_cobrar(db: Session = Depends(get_db), _=Depends(get_current_user)):
    cuentas = db.query(CuentaCobrar).filter(CuentaCobrar.estado.in_(["PENDIENTE", "PARCIAL"])).all()
    return [
        {
            "id": c.id, "venta_id": c.venta_id,
            "cliente_nombre": c.cliente.nombre if c.cliente else "Sin cliente",
            "monto_total": float(c.monto_total), "monto_pagado": float(c.monto_pagado),
            "saldo": float(c.monto_total) - float(c.monto_pagado),
            "fecha_vencimiento": str(c.fecha_vencimiento) if c.fecha_vencimiento else None,
            "estado": c.estado,
        }
        for c in cuentas
    ]


@router.post("/cobrar/{cuenta_id}/pago")
def registrar_pago_cobrar(cuenta_id: int, pago: PagoIn, db: Session = Depends(get_db), _=Depends(get_current_user)):
    c = db.query(CuentaCobrar).filter(CuentaCobrar.id == cuenta_id).first()
    if not c:
        raise HTTPException(404, "Cuenta no encontrada")
    c.monto_pagado = float(c.monto_pagado) + pago.monto
    if float(c.monto_pagado) >= float(c.monto_total):
        c.estado = "PAGADA"
        c.monto_pagado = c.monto_total
    else:
        c.estado = "PARCIAL"
    db.commit()
    return {"detail": "Pago registrado", "estado": c.estado}


# ── Cuentas por Pagar ─────────────────────────────────────────────────────────
@router.get("/pagar", response_model=List[dict])
def listar_cuentas_pagar(db: Session = Depends(get_db), _=Depends(get_current_user)):
    cuentas = db.query(CuentaPagar).filter(CuentaPagar.estado.in_(["PENDIENTE", "PARCIAL"])).all()
    return [
        {
            "id": c.id, "compra_id": c.compra_id,
            "proveedor_nombre": c.proveedor.nombre if c.proveedor else "Sin proveedor",
            "monto_total": float(c.monto_total), "monto_pagado": float(c.monto_pagado),
            "saldo": float(c.monto_total) - float(c.monto_pagado),
            "fecha_vencimiento": str(c.fecha_vencimiento) if c.fecha_vencimiento else None,
            "estado": c.estado,
        }
        for c in cuentas
    ]


@router.post("/pagar/{cuenta_id}/pago")
def registrar_pago_pagar(cuenta_id: int, pago: PagoIn, db: Session = Depends(get_db), _=Depends(get_current_user)):
    c = db.query(CuentaPagar).filter(CuentaPagar.id == cuenta_id).first()
    if not c:
        raise HTTPException(404, "Cuenta no encontrada")
    c.monto_pagado = float(c.monto_pagado) + pago.monto
    if float(c.monto_pagado) >= float(c.monto_total):
        c.estado = "PAGADA"
        c.monto_pagado = c.monto_total
    else:
        c.estado = "PARCIAL"
    db.commit()
    return {"detail": "Pago registrado", "estado": c.estado}
