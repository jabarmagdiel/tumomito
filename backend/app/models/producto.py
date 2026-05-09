from app.database import Base
from sqlalchemy import Column, Integer, String, Boolean, Numeric, ForeignKey, TIMESTAMP, func, Text
from sqlalchemy.orm import relationship


class Categoria(Base):
    __tablename__ = "categorias"
    id = Column(Integer, primary_key=True)
    nombre = Column(String(100), unique=True, nullable=False)
    descripcion = Column(Text)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    productos = relationship("Producto", back_populates="categoria")


class Marca(Base):
    __tablename__ = "marcas"
    id = Column(Integer, primary_key=True)
    nombre = Column(String(100), unique=True, nullable=False)
    pais_origen = Column(String(80))
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    productos = relationship("Producto", back_populates="marca")


class Proveedor(Base):
    __tablename__ = "proveedores"
    id = Column(Integer, primary_key=True)
    nombre = Column(String(150), nullable=False)
    contacto = Column(String(100))
    telefono = Column(String(30))
    email = Column(String(150))
    direccion = Column(Text)
    pais = Column(String(80))
    activo = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())
    productos = relationship("Producto", back_populates="proveedor")
    compras = relationship("CompraCabecera", back_populates="proveedor")
    cuentas_pagar = relationship("CuentaPagar", back_populates="proveedor")


class Producto(Base):
    __tablename__ = "productos"
    id = Column(Integer, primary_key=True)
    codigo_interno = Column(String(30), unique=True, nullable=False)
    codigo_barras = Column(String(50))
    nombre = Column(String(200), nullable=False)
    descripcion = Column(Text)
    marca_id = Column(Integer, ForeignKey("marcas.id"), nullable=True)
    categoria_id = Column(Integer, ForeignKey("categorias.id"), nullable=True)
    proveedor_id = Column(Integer, ForeignKey("proveedores.id"), nullable=True)
    precio_costo = Column(Numeric(12, 2), default=0)
    precio_mayorista = Column(Numeric(12, 2), default=0)
    precio_minorista = Column(Numeric(12, 2), default=0)
    stock_minimo = Column(Integer, default=5)
    imagen_url = Column(Text)
    activo = Column(Boolean, default=True)
    en_catalogo = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())
    marca = relationship("Marca", back_populates="productos")
    categoria = relationship("Categoria", back_populates="productos")
    proveedor = relationship("Proveedor", back_populates="productos")
    stock_inventario = relationship("StockInventario", back_populates="producto")
    kardex = relationship("KardexInventario", back_populates="producto")
    compra_detalles = relationship("CompraDetalle", back_populates="producto")
    venta_detalles = relationship("VentaDetalle", back_populates="producto")
