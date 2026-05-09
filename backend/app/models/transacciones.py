from app.database import Base
from sqlalchemy import Column, Integer, String, Numeric, ForeignKey, TIMESTAMP, Date, func, Text, Boolean
from sqlalchemy.orm import relationship


class Cliente(Base):
    __tablename__ = "clientes"
    id = Column(Integer, primary_key=True)
    nombre = Column(String(150), nullable=False)
    nit_ci = Column(String(30))
    telefono = Column(String(30))
    email = Column(String(150))
    direccion = Column(Text)
    descuento_pct = Column(Numeric(5, 2), default=0)
    limite_credito = Column(Numeric(12, 2), default=0)
    activo = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())
    ventas = relationship("VentaCabecera", back_populates="cliente")
    cuentas_cobrar = relationship("CuentaCobrar", back_populates="cliente")


class VentaCabecera(Base):
    __tablename__ = "venta_cabecera"
    id = Column(Integer, primary_key=True)
    numero_venta = Column(String(30), unique=True, nullable=False)
    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=True)
    almacen_id = Column(Integer, ForeignKey("almacenes.id"), nullable=False)
    fecha = Column(Date, server_default=func.current_date())
    subtotal = Column(Numeric(14, 2), default=0)
    descuento_pct = Column(Numeric(5, 2), default=0)
    descuento_monto = Column(Numeric(14, 2), default=0)
    total = Column(Numeric(14, 2), default=0)
    estado = Column(String(20), default="COMPLETADA")
    tipo_venta = Column(String(20), default="MAYORISTA")
    notas = Column(Text)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    cliente = relationship("Cliente", back_populates="ventas")
    almacen = relationship("Almacen", back_populates="ventas")
    usuario = relationship("Usuario", back_populates="ventas")
    detalles = relationship("VentaDetalle", back_populates="venta", cascade="all, delete-orphan")
    cuenta_cobrar = relationship("CuentaCobrar", back_populates="venta", uselist=False)


class VentaDetalle(Base):
    __tablename__ = "venta_detalle"
    id = Column(Integer, primary_key=True)
    venta_id = Column(Integer, ForeignKey("venta_cabecera.id"), nullable=False)
    producto_id = Column(Integer, ForeignKey("productos.id"), nullable=False)
    cantidad = Column(Integer, nullable=False, default=0)
    precio_unitario = Column(Numeric(12, 2), nullable=False, default=0)
    descuento_pct = Column(Numeric(5, 2), default=0)
    subtotal = Column(Numeric(14, 2), default=0)
    venta = relationship("VentaCabecera", back_populates="detalles")
    producto = relationship("Producto", back_populates="venta_detalles")


class CompraCabecera(Base):
    __tablename__ = "compra_cabecera"
    id = Column(Integer, primary_key=True)
    numero_orden = Column(String(30), unique=True, nullable=False)
    proveedor_id = Column(Integer, ForeignKey("proveedores.id"), nullable=False)
    fecha_orden = Column(Date, server_default=func.current_date())
    fecha_recepcion = Column(Date, nullable=True)
    estado = Column(String(20), default="PENDIENTE")
    total = Column(Numeric(14, 2), default=0)
    notas = Column(Text)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())
    proveedor = relationship("Proveedor", back_populates="compras")
    usuario = relationship("Usuario", back_populates="compras")
    detalles = relationship("CompraDetalle", back_populates="compra", cascade="all, delete-orphan")
    cuenta_pagar = relationship("CuentaPagar", back_populates="compra", uselist=False)


class CompraDetalle(Base):
    __tablename__ = "compra_detalle"
    id = Column(Integer, primary_key=True)
    compra_id = Column(Integer, ForeignKey("compra_cabecera.id"), nullable=False)
    producto_id = Column(Integer, ForeignKey("productos.id"), nullable=False)
    cantidad_pedida = Column(Integer, default=0)
    cantidad_recibida = Column(Integer, default=0)
    precio_unitario = Column(Numeric(12, 2), nullable=False, default=0)
    subtotal = Column(Numeric(14, 2), default=0)
    compra = relationship("CompraCabecera", back_populates="detalles")
    producto = relationship("Producto", back_populates="compra_detalles")


class CuentaCobrar(Base):
    __tablename__ = "cuentas_cobrar"
    id = Column(Integer, primary_key=True)
    venta_id = Column(Integer, ForeignKey("venta_cabecera.id"), nullable=False)
    cliente_id = Column(Integer, ForeignKey("clientes.id"))
    monto_total = Column(Numeric(14, 2), nullable=False)
    monto_pagado = Column(Numeric(14, 2), default=0)
    fecha_vencimiento = Column(Date)
    estado = Column(String(20), default="PENDIENTE")
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())
    venta = relationship("VentaCabecera", back_populates="cuenta_cobrar")
    cliente = relationship("Cliente", back_populates="cuentas_cobrar")


class CuentaPagar(Base):
    __tablename__ = "cuentas_pagar"
    id = Column(Integer, primary_key=True)
    compra_id = Column(Integer, ForeignKey("compra_cabecera.id"), nullable=False)
    proveedor_id = Column(Integer, ForeignKey("proveedores.id"))
    monto_total = Column(Numeric(14, 2), nullable=False)
    monto_pagado = Column(Numeric(14, 2), default=0)
    fecha_vencimiento = Column(Date)
    estado = Column(String(20), default="PENDIENTE")
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())
    compra = relationship("CompraCabecera", back_populates="cuenta_pagar")
    proveedor = relationship("Proveedor", back_populates="cuentas_pagar")


class Promocion(Base):
    __tablename__ = "promociones"
    id = Column(Integer, primary_key=True)
    nombre = Column(String(150), nullable=False)
    descripcion = Column(Text)
    descuento_pct = Column(Numeric(5, 2), default=0)
    fecha_inicio = Column(Date)
    fecha_fin = Column(Date)
    activa = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
