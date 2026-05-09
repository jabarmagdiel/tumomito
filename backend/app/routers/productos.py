from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import Optional, List
from app.database import get_db
from app.models.producto import Producto, Categoria, Marca, Proveedor
from app.models.inventario import StockInventario
from app.schemas.producto import ProductoCreate, ProductoOut, ProductoUpdate, CategoriaOut, MarcaOut
from app.core.security import get_current_user, require_admin
from app.models.usuario import Usuario

router = APIRouter()


def _enrich(p: Producto, db: Session) -> dict:
    stock = db.query(func.sum(StockInventario.cantidad)).filter(StockInventario.producto_id == p.id).scalar() or 0
    return {
        **{c.name: getattr(p, c.name) for c in p.__table__.columns},
        "marca_nombre": p.marca.nombre if p.marca else None,
        "categoria_nombre": p.categoria.nombre if p.categoria else None,
        "proveedor_nombre": p.proveedor.nombre if p.proveedor else None,
        "stock_total": int(stock),
    }


@router.get("/", response_model=List[dict])
def listar_productos(
    search: Optional[str] = Query(None),
    categoria_id: Optional[int] = None,
    proveedor_id: Optional[int] = None,
    activo: Optional[bool] = True,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    q = db.query(Producto)
    if activo is not None:
        q = q.filter(Producto.activo == activo)
    if categoria_id:
        q = q.filter(Producto.categoria_id == categoria_id)
    if proveedor_id:
        q = q.filter(Producto.proveedor_id == proveedor_id)
    if search:
        q = q.filter(or_(
            Producto.nombre.ilike(f"%{search}%"),
            Producto.codigo_interno.ilike(f"%{search}%"),
            Producto.codigo_barras.ilike(f"%{search}%"),
        ))
    productos = q.offset(skip).limit(limit).all()
    return [_enrich(p, db) for p in productos]


@router.get("/alertas-stock", response_model=List[dict])
def alertas_stock_minimo(db: Session = Depends(get_db), _=Depends(get_current_user)):
    productos = db.query(Producto).filter(Producto.activo == True).all()
    alertas = []
    for p in productos:
        stock = db.query(func.sum(StockInventario.cantidad)).filter(StockInventario.producto_id == p.id).scalar() or 0
        if int(stock) <= p.stock_minimo:
            alertas.append({**_enrich(p, db), "stock_total": int(stock)})
    return alertas


@router.get("/{producto_id}", response_model=dict)
def obtener_producto(producto_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    p = db.query(Producto).filter(Producto.id == producto_id).first()
    if not p:
        raise HTTPException(404, "Producto no encontrado")
    return _enrich(p, db)


@router.post("/", response_model=dict, status_code=201)
def crear_producto(data: ProductoCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    existing = db.query(Producto).filter(Producto.codigo_interno == data.codigo_interno).first()
    if existing:
        raise HTTPException(400, f"Código interno '{data.codigo_interno}' ya existe")
    p = Producto(**data.model_dump())
    db.add(p)
    db.commit()
    db.refresh(p)
    return _enrich(p, db)


@router.put("/{producto_id}", response_model=dict)
def actualizar_producto(
    producto_id: int, data: ProductoUpdate,
    db: Session = Depends(get_db), _=Depends(require_admin),
):
    p = db.query(Producto).filter(Producto.id == producto_id).first()
    if not p:
        raise HTTPException(404, "Producto no encontrado")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(p, field, value)
    db.commit()
    db.refresh(p)
    return _enrich(p, db)


@router.delete("/{producto_id}")
def desactivar_producto(producto_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    p = db.query(Producto).filter(Producto.id == producto_id).first()
    if not p:
        raise HTTPException(404, "Producto no encontrado")
    p.activo = False
    db.commit()
    return {"detail": "Producto desactivado"}


# ── Catálogo auxiliar ─────────────────────────────────────────────────────────
@router.get("/meta/categorias", response_model=List[CategoriaOut])
def listar_categorias(db: Session = Depends(get_db)):
    return db.query(Categoria).all()


@router.post("/meta/categorias")
def crear_categoria(nombre: str, db: Session = Depends(get_db), _=Depends(require_admin)):
    cat = Categoria(nombre=nombre)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


@router.get("/meta/marcas", response_model=List[MarcaOut])
def listar_marcas(db: Session = Depends(get_db)):
    return db.query(Marca).all()


@router.post("/meta/marcas")
def crear_marca(nombre: str, pais_origen: Optional[str] = None, db: Session = Depends(get_db), _=Depends(require_admin)):
    m = Marca(nombre=nombre, pais_origen=pais_origen)
    db.add(m)
    db.commit()
    db.refresh(m)
    return m
