from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ProductoBase(BaseModel):
    codigo_interno: str
    codigo_barras: Optional[str] = None
    nombre: str
    descripcion: Optional[str] = None
    marca_id: Optional[int] = None
    categoria_id: Optional[int] = None
    proveedor_id: Optional[int] = None
    precio_costo: float = 0
    precio_mayorista: float = 0
    precio_minorista: float = 0
    stock_minimo: int = 5
    imagen_url: Optional[str] = None
    activo: bool = True
    en_catalogo: bool = True


class ProductoCreate(ProductoBase):
    pass


class ProductoUpdate(BaseModel):
    codigo_barras: Optional[str] = None
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    marca_id: Optional[int] = None
    categoria_id: Optional[int] = None
    proveedor_id: Optional[int] = None
    precio_costo: Optional[float] = None
    precio_mayorista: Optional[float] = None
    precio_minorista: Optional[float] = None
    stock_minimo: Optional[int] = None
    imagen_url: Optional[str] = None
    activo: Optional[bool] = None
    en_catalogo: Optional[bool] = None


class ProductoOut(ProductoBase):
    id: int
    created_at: datetime
    marca_nombre: Optional[str] = None
    categoria_nombre: Optional[str] = None
    proveedor_nombre: Optional[str] = None
    stock_total: Optional[int] = 0

    class Config:
        from_attributes = True


class CategoriaOut(BaseModel):
    id: int
    nombre: str
    class Config:
        from_attributes = True


class MarcaOut(BaseModel):
    id: int
    nombre: str
    pais_origen: Optional[str] = None
    class Config:
        from_attributes = True


class ProveedorBase(BaseModel):
    nombre: str
    contacto: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    direccion: Optional[str] = None
    pais: Optional[str] = None
    activo: bool = True


class ProveedorCreate(ProveedorBase):
    pass


class ProveedorOut(ProveedorBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True


class ClienteBase(BaseModel):
    nombre: str
    nit_ci: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    direccion: Optional[str] = None
    descuento_pct: float = 0
    limite_credito: float = 0
    activo: bool = True


class ClienteCreate(ClienteBase):
    pass


class ClienteOut(ClienteBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True
