from app.database import Base
from sqlalchemy import Column, Integer, String, Boolean, Numeric, ForeignKey, TIMESTAMP, Date, func, Text, CheckConstraint
from sqlalchemy.orm import relationship


class Almacen(Base):
    __tablename__ = "almacenes"
    id = Column(Integer, primary_key=True)
    nombre = Column(String(100), nullable=False)
    ubicacion = Column(Text)
    activo = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    stock = relationship("StockInventario", back_populates="almacen")
    kardex = relationship("KardexInventario", back_populates="almacen")
    ventas = relationship("VentaCabecera", back_populates="almacen")


class StockInventario(Base):
    __tablename__ = "stock_inventario"
    id = Column(Integer, primary_key=True)
    producto_id = Column(Integer, ForeignKey("productos.id"), nullable=False)
    almacen_id = Column(Integer, ForeignKey("almacenes.id"), nullable=False)
    cantidad = Column(Integer, default=0)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())
    producto = relationship("Producto", back_populates="stock_inventario")
    almacen = relationship("Almacen", back_populates="stock")


class KardexInventario(Base):
    __tablename__ = "kardex_inventario"
    id = Column(Integer, primary_key=True)
    producto_id = Column(Integer, ForeignKey("productos.id"), nullable=False)
    almacen_id = Column(Integer, ForeignKey("almacenes.id"), nullable=False)
    tipo = Column(String(10), nullable=False)
    cantidad = Column(Integer, nullable=False)
    stock_anterior = Column(Integer, default=0)
    stock_resultante = Column(Integer, default=0)
    referencia_tipo = Column(String(30))
    referencia_id = Column(Integer)
    notas = Column(Text)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    producto = relationship("Producto", back_populates="kardex")
    almacen = relationship("Almacen", back_populates="kardex")
