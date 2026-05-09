from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date


# ── Venta ─────────────────────────────────────────────────────────────────────
class VentaDetalleIn(BaseModel):
    producto_id: int
    cantidad: int
    precio_unitario: float
    descuento_pct: float = 0


class VentaCreate(BaseModel):
    cliente_id: Optional[int] = None
    almacen_id: int
    tipo_venta: str = "MAYORISTA"
    descuento_pct: float = 0
    notas: Optional[str] = None
    detalles: List[VentaDetalleIn]
    generar_cuenta_cobrar: bool = False
    fecha_vencimiento: Optional[date] = None


class VentaDetalleOut(BaseModel):
    id: int
    producto_id: int
    cantidad: int
    precio_unitario: float
    descuento_pct: float
    subtotal: float
    producto_nombre: Optional[str] = None
    class Config:
        from_attributes = True


class VentaOut(BaseModel):
    id: int
    numero_venta: str
    cliente_id: Optional[int]
    almacen_id: int
    fecha: date
    subtotal: float
    descuento_pct: float
    descuento_monto: float
    total: float
    estado: str
    tipo_venta: str
    notas: Optional[str]
    created_at: datetime
    cliente_nombre: Optional[str] = None
    detalles: Optional[List[VentaDetalleOut]] = []
    class Config:
        from_attributes = True


# ── Compra ────────────────────────────────────────────────────────────────────
class CompraDetalleIn(BaseModel):
    producto_id: int
    cantidad_pedida: int
    precio_unitario: float


class CompraCreate(BaseModel):
    proveedor_id: int
    fecha_orden: Optional[date] = None
    notas: Optional[str] = None
    detalles: List[CompraDetalleIn]


class RecepcionDetalleIn(BaseModel):
    compra_detalle_id: int
    cantidad_recibida: int


class RecepcionCreate(BaseModel):
    almacen_id: int
    fecha_recepcion: date
    detalles: List[RecepcionDetalleIn]
    generar_cuenta_pagar: bool = False
    fecha_vencimiento: Optional[date] = None


class CompraDetalleOut(BaseModel):
    id: int
    producto_id: int
    cantidad_pedida: int
    cantidad_recibida: int
    precio_unitario: float
    subtotal: float
    producto_nombre: Optional[str] = None
    class Config:
        from_attributes = True


class CompraOut(BaseModel):
    id: int
    numero_orden: str
    proveedor_id: int
    fecha_orden: date
    fecha_recepcion: Optional[date]
    estado: str
    total: float
    notas: Optional[str]
    created_at: datetime
    proveedor_nombre: Optional[str] = None
    detalles: Optional[List[CompraDetalleOut]] = []
    class Config:
        from_attributes = True


# ── Cuentas ───────────────────────────────────────────────────────────────────
class PagoIn(BaseModel):
    monto: float


class CuentaCobrarOut(BaseModel):
    id: int
    venta_id: int
    cliente_id: Optional[int]
    monto_total: float
    monto_pagado: float
    fecha_vencimiento: Optional[date]
    estado: str
    cliente_nombre: Optional[str] = None
    class Config:
        from_attributes = True


class CuentaPagarOut(BaseModel):
    id: int
    compra_id: int
    proveedor_id: Optional[int]
    monto_total: float
    monto_pagado: float
    fecha_vencimiento: Optional[date]
    estado: str
    proveedor_nombre: Optional[str] = None
    class Config:
        from_attributes = True
