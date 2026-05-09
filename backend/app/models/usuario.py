from app.database import Base
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, TIMESTAMP, func
from sqlalchemy.orm import relationship


class Rol(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(50), unique=True, nullable=False)
    descripcion = Column(String)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    usuarios = relationship("Usuario", back_populates="rol")


class Usuario(Base):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    rol_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    activo = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())
    rol = relationship("Rol", back_populates="usuarios")
    ventas = relationship("VentaCabecera", back_populates="usuario")
    compras = relationship("CompraCabecera", back_populates="usuario")
